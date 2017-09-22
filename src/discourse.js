const request = require('request');
const influx = require('./influx');
const _ = require('lodash');
const Sentiment = require('sentiment');

function gatherCommunity(domain, name) {
    request({
//        url: 'https://community.monzo.com/about.json',
        url: domain+'/about.json',
        json: true
    }, (err, res) => {
        if (err) return;
        let body = res.body;


        influx.writeMeasurement('discourse', [{
            tags: {
              site: name
            },
            fields: {
                topic_count: body.about.stats.topic_count,
                post_count: body.about.stats.post_count,
                user_count: body.about.stats.user_count,
                active_users_7_days: body.about.stats.active_users_7_days,
                active_users_30_days: body.about.stats.active_users_30_days,
                like_count: body.about.stats.like_count,
                admin_count: body.about.admins.length,
                moderator_count: body.about.moderators.length
            }
        }]);

    });
    gatherPosts(domain, name);
    gatherLatest(domain, name);
};

function gatherLatest(domain, name) {
    request({
        url: domain+'/latest.json',
        json: true
    }, (err, res) => {
        if (err) return;
        let body = res.body;


        let series = [];

        let i = 0;
        for (let topic of body.topic_list.topics) {
            series.push({
                measurement: 'discourse_latest',
                tags: {
                    site: name,
                    id: topic.id,
                    title: topic.title
                },
                fields: {
                    posts: topic.posts_count,
                    replies: topic.replies,
                    likes: topic.like_count,
                    views: topic.views,
                    index: i
                }
            });
            i ++;
        }

        // console.log(series);
        // console.log(series.length);

        influx.writePoints(series);
    });
}

function gatherPosts(domain, name) {
    request({
        url: domain + '/posts.json',
        json: true
    }, (err, res) => {
        if (err) return;
        let body = res.body;

        logAggregatePosts(name, body.latest_posts);

    });
}

function logAggregatePosts(name, posts) {

    influx.query(`
SELECT max("last_id") FROM discourse_posts_aggregate WHERE site='${name}'
        `).then(result => {
        if (result.length > 0) {
            let max = result[0].max;
            posts = _.filter(posts, post => post.id > max);
        }

        posts = _.filter(posts, post => post.username != 'system');
        // let peak = result.groups()[0].rows[0].max;

        let grouped = _.groupBy(posts, 'topic_id');
        let series = _.values(grouped).map(group => {
            let date = new Date(group[0].created_at);

            let sentiment = _.map(group, post => {
                let sent = Sentiment(post.raw);
                return sent.score;
            });

            let sentimentcomp = _.map(group, post => {
                let sent = Sentiment(post.raw);
                return sent.comparative;
            });

            let sentimentnorm = _.mean(_.map(group, post => {
                let sent = Sentiment(post.raw);
                let num = sent.positive + sent.negative;
                if (num == 0) return 0;
                return sent.score / (num);
            }));

            if (isNaN(sentimentnorm))
                sentimentnorm = 0;

            let data = {
                measurement: 'discourse_posts_aggregate',
                tags: {
                    site: name,
                    topic_id: group[0].topic_id,
                    category_id: group[0].category_id,
                    topic_title: group[0].topic_title
                },
                fields: {
                    last_id: group[0].id,
                    posts: group.length,
                    sentiment: _.mean(sentiment),
                    sentiment_comp: _.mean(sentimentcomp),
                    sentiment_norm: sentimentnorm
                },
                timestamp: date
            };
            return data;
        });

        influx.writePoints(series);
    });
}

if (process.env.ITX_MONITOR == 'true') {
    var CronJob = require('cron').CronJob;

    new CronJob({ //every 30 mins
        cronTime: '0 */30 * * * *',
        start: true,
        runOnInit: true,
        onTick: function () {
            console.log('Fetching monzo community');
            gatherCommunity('https://community.monzo.com', 'monzo');
            gatherCommunity('https://community.starlingbank.com', 'starling');
            gatherCommunity('https://community.revolut.com', 'revolut');
            gatherCommunity('https://tide.co/community', 'tide');
        }
    });
}

