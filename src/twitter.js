/**
 * Created by joe on 18/09/17.
 */
const Twit = require('twit');
const moment = require('moment');
const influx = require('./influx');
const geohash = require('ngeohash');
const _ = require('lodash');
const sentiment = require('sentiment');
const querystring = require('querystring');

var T = new Twit({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token: process.env.TWITTER_ACCESS_TOKEN,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    timeout_ms: 60 * 1000,  // optional HTTP request timeout to apply to all requests.
});

function profiles(list) {

    T.get('users/lookup', {screen_name: list}).then(res => {
        let series = [];
        // console.log(res.data);
        // console.log(JSON.stringify(res.data, null, ' '));
        for (let account of res.data) {

            series.push({
                measurement: 'twitter',
                tags: {
                    profile: account.screen_name,
                    id: account.id,
                    name: account.name,
                },
                fields: {
                    favourites_count: account.favourites_count,
                    friends_count: account.friends_count,
                    statuses_count: account.statuses_count,
                    listed_count: account.listed_count,
                    followers_count: account.followers_count
                }
            });

            if (account.status) {
                let date = moment(account.status.created_at, 'ddd MMM D HH:mm:ss Z YYYY');
                let point = null;

                if (account.status.geo && account.status.geo.type == 'Point') {
                    point = geohash.encode(account.status.geo.coordinates[1], account.status.geo.coordinates[0]);
                }

                let fields = {
                    type: 'tweet',
                    text: account.status.text,
                    favorite_count: account.status.favorite_count,
                    geo: point,
                    isReply: !!account.status.in_reply_to_status_id,
                    isQuote: !!account.status.is_quote_status,
                    hasMedia: !!account.status.entities.media,
                    hasMention: !!account.status.entities.user_mentions && account.status.entities.user_mentions.length > 0,
                    tags: ''
                };

                let tags = [];

                if (fields.isReply)
                    tags.push('reply');
                if (fields.isQuote)
                    tags.push('quote');
                if (fields.hasMedia)
                    tags.push('media');
                if (fields.hasMention)
                    tags.push('mention');

                fields.tags = tags.join(',');

                series.push({
                    measurement: 'twitter_tweet',
                    tags: {
                        profile: account.screen_name,
                        id: account.id_str,
                        name: account.name,
                        tweet_id: account.status.id
                    },
                    fields: fields,
                    timestamp: date.toDate()
                });
            }
        }

        // console.log(series);
        influx.writePoints(series);
    });
}



function doMentions() {
    let banks = [
        'atom_bank',
        'AtomHelp',
        'BankMobile',
        'bunq',
        'ficoba',
        'fidorbank',
        'fidoruk',
        'getcoconut',
        'holvi',
        'imaginecurve',
        'lootapp',
        'monzo',
        'MonzoLoveTweets',
        'MyMonese',
        'n26',
        'N26_Support',
        'N26FR',
        'PockitUK',
        'RevolutApp',
        'StarlingBank',
        'TandemMoney',
        'tidebanking',
        'TransferWise',
        'uaccount'
    ];

    let banks_lower = _.map(banks, bank => {
        return bank.toLowerCase();
    })

    function process(query, res) {
        let series = [];

        for (status of res.data.statuses) {
            let text = status.full_text;

            if (status.user.screen_name.toLowerCase() in banks_lower)
                continue;

            let sent = sentiment(text);
            let num = sent.positive.length + sent.negative.length;
            let norm = 0;
            if (num > 0)
                norm = sent.score / (num);

            let date = moment(status.created_at, 'ddd MMM D HH:mm:ss Z YYYY');

            let point = null;
            if (status.geo && status.geo.type == 'Point') {
                point = geohash.encode(status.geo.coordinates[1], status.geo.coordinates[0]);
            }

            let fields = {
                text: text,
                favorite_count: status.favorite_count,
                retweet_count: status.retweet_count,
                geo: point,
                isReply: !!status.in_reply_to_status_id,
                isQuote: !!status.is_quote_status,
                hasMedia: !!status.entities.media,
                hasMention: !!status.entities.user_mentions && status.entities.user_mentions.length > 0,
                tags: '',
                sentiment: sent.score,
                sentiment_norm: norm,
                sentiment_comp: sent.comparative,
            };

            let tags = [];

            if (fields.isReply)
                tags.push('reply');
            if (fields.isQuote)
                tags.push('quote');
            if (fields.hasMedia)
                tags.push('media');
            if (fields.hasMention)
                tags.push('mention');

            fields.tags = tags.join(',');

            series.push({
                measurement: 'twitter_mention',
                tags: {
                    profile: status.user.screen_name,
                    id: status.id_str,
                    name: status.user.name,
                    tweet_id: status.id,
                    query: query
                },
                fields: fields,
                timestamp: date.toDate()
            });

            // console.log(ml.classify(text), sent.score, norm, sent.comparative, text);

        }

        // console.log(series);
        influx.writePoints(series);
    }

    function search(query, params) {
        if (!params)
            params = {};

        T.get('search/tweets', _.merge({}, params, {q: query, result_type: 'recent', tweet_mode: 'extended', count: 100})).then(res => {
            // console.log(JSON.stringify(res.data, null, ' '));
            process(query, res);
            //
            // if (res.data.search_metadata && res.data.search_metadata.max_id_str) {
            //     let pagenum = 1;
            //     if (params.pagenum)
            //         pagenum = params.pagenum+1;
            //
            //     let status = res.data.statuses[0];
            //     let date = moment(status.created_at, 'ddd MMM D HH:mm:ss Z YYYY');
            //     console.log(status);
            //
            //     if (date.isAfter('2017-09-22')) {
            //         console.log('fetching next page ', query, pagenum);
            //         let qs = querystring.parse(res.data.search_metadata.next_results.substring(1));
            //         let maxid = qs.max_id;
            //
            //         search(query, _.merge({}, params, {max_id: maxid, pagenum: pagenum}))
            //     }
            // }

        });
    }

    // search('@monzo');

    for (let bank of banks) {
         search('@' + bank);
    }
}


module.exports = profiles;

var CronJob = require('cron').CronJob;
// secs mins hrs dom mo dow
new CronJob({ //every 5 mins
    cronTime: '0 */5 * * * *',
    start: true,
    runOnInit: true,
    onTick: function () {
        console.log('fetching twitter');
        profiles([
            'atom_bank',
            'AtomHelp',
            'BankMobile',
            'bunq',
            'ficoba',
            'fidorbank',
            'fidoruk',
            'getcoconut',
            'holvi',
            'imaginecurve',
            'lootapp',
            'monzo',
            'MonzoLoveTweets',
            'MyMonese',
            'n26',
            'N26_Support',
            'N26FR',
            'PockitUK',
            'RevolutApp',
            'StarlingBank',
            'TandemMoney',
            'tidebanking',
            'TransferWise',
            'uaccount'
        ]);
    }
});

if (process.env.ITX_MONITOR == 'true') {
    new CronJob({ //every hour
        cronTime: '0 0 * * * *',
        start: true,
        runOnInit: true,
        onTick: function () {
            console.log('fetching twitter mentions');
            doMentions();
        }
    });
}

// doMentions();