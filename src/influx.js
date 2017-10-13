const Influx = require('influx');

let influx = new Influx.InfluxDB({
    host: process.env.INFLUX_HOST,
    database: process.env.INFLUX_DATABASE,
    username: process.env.INFLUX_USERNAME,
    password: process.env.INFLUX_PASSWORD,
    schema: [
        {
            measurement: 'monzo_currentacc',
            fields: {
                current: Influx.FieldType.INTEGER,
                peak: Influx.FieldType.INTEGER,
                val: Influx.FieldType.INTEGER
            },
            tags: []
        },
        {
            measurement: 'discourse',
            fields: {
                topic_count: Influx.FieldType.INTEGER,
                post_count: Influx.FieldType.INTEGER,
                user_count: Influx.FieldType.INTEGER,
                active_users_7_days: Influx.FieldType.INTEGER,
                active_users_30_days: Influx.FieldType.INTEGER,
                like_count: Influx.FieldType.INTEGER,
                admin_count: Influx.FieldType.INTEGER,
                moderator_count: Influx.FieldType.INTEGER
            },
            tags: ['site']
        },
        {
            measurement: 'discourse_latest',
            fields: {
                posts: Influx.FieldType.INTEGER,
                replies: Influx.FieldType.INTEGER,
                likes: Influx.FieldType.INTEGER,
                views: Influx.FieldType.INTEGER,
                index: Influx.FieldType.INTEGER
            },
            tags: [
                'site',
                'id',
                'title'
            ],
        },
        {
            measurement: 'discourse_posts_aggregate',
            fields: {
                last_id: Influx.FieldType.INTEGER,
                posts: Influx.FieldType.INTEGER,
                sentiment: Influx.FieldType.FLOAT,
                sentiment_norm: Influx.FieldType.FLOAT,
                sentiment_comp: Influx.FieldType.FLOAT,
            },
            tags: [
                'site',
                'topic_id',
                'category_id',
                'topic_title',
            ],
        },
        {
            measurement: 'facebook',
            fields: {
                likes: Influx.FieldType.INTEGER,
                mentions_day: Influx.FieldType.INTEGER,
                mentions_week: Influx.FieldType.INTEGER,
                mentions_month: Influx.FieldType.INTEGER,
                visitors: Influx.FieldType.INTEGER,
                ratings: Influx.FieldType.INTEGER,
                talkingabout: Influx.FieldType.INTEGER,
                checkins: Influx.FieldType.INTEGER,
                rating: Influx.FieldType.FLOAT
            },
            tags: ['page']
        },
        {
            measurement: 'facebook_country',
            fields: {
                likes: Influx.FieldType.INTEGER,
                mentions_day: Influx.FieldType.INTEGER,
                mentions_week: Influx.FieldType.INTEGER,
                mentions_month: Influx.FieldType.INTEGER
            },
            tags: ['page', 'country']

        },
        {
            measurement: 'twitter',
            tags: [
                'profile',
                'id',
                'name'
            ],
            fields: {
                favourites_count: Influx.FieldType.INTEGER,
                friends_count: Influx.FieldType.INTEGER,
                statuses_count: Influx.FieldType.INTEGER,
                listed_count: Influx.FieldType.INTEGER,
                followers_count: Influx.FieldType.INTEGER
            }
        },
        {
            measurement: 'twitter_tweet',
            tags: [
                'profile',
                'id',
                'name',
                'tweet_id'
            ],
            fields: {
                type: Influx.FieldType.STRING,
                text: Influx.FieldType.STRING,
                favorite_count: Influx.FieldType.INTEGER,
                geo: Influx.FieldType.STRING,
                isReply: Influx.FieldType.BOOLEAN,
                isQuote: Influx.FieldType.BOOLEAN,
                hasMedia: Influx.FieldType.BOOLEAN,
                hasMention: Influx.FieldType.BOOLEAN,
                tags: Influx.FieldType.STRING
            }
        },
        {
            measurement: 'twitter_mention',
            tags: [
                'profile',
                'id',
                'name',
                'tweet_id',
                'query'
            ],
            fields: {
                type: Influx.FieldType.STRING,
                text: Influx.FieldType.STRING,
                favorite_count: Influx.FieldType.INTEGER,
                retweet_count: Influx.FieldType.INTEGER,
                geo: Influx.FieldType.STRING,
                isReply: Influx.FieldType.BOOLEAN,
                isQuote: Influx.FieldType.BOOLEAN,
                hasMedia: Influx.FieldType.BOOLEAN,
                hasMention: Influx.FieldType.BOOLEAN,
                tags: Influx.FieldType.STRING,
                sentiment: Influx.FieldType.FLOAT,
                sentiment_norm: Influx.FieldType.FLOAT,
                sentiment_comp: Influx.FieldType.FLOAT,
            }
        },
        {
            measurement: 'googleplay_search',
            tags: [
                'query',
                'appId',
                'country'
            ],
            fields: {
                score: Influx.FieldType.FLOAT,
                index: Influx.FieldType.INTEGER
            }
        },
        {
            measurement: 'googleplay_app',
            tags: [
                'appId'
            ],
            fields: {
                minInstalls: Influx.FieldType.INTEGER,
                maxInstalls: Influx.FieldType.INTEGER,
                reviews: Influx.FieldType.INTEGER,
                score: Influx.FieldType.FLOAT
            }
        },
        {
            measurement: 'googleplay_app_histogram',
            tags: [
                'appId',
                'stars'
            ],
            fields: {
                ratings: Influx.FieldType.INTEGER
            }
        },
        {
            measurement: 'googleplay_app_release',
            tags: [
                'appId',
                'version'
            ],
            fields: {
                androidVersion: Influx.FieldType.STRING,
                changed: Influx.FieldType.STRING
            }
        },
        {
            measurement: 'appstore_search',
            tags: [
                'query',
                'appId',
                'country',
                'title'
            ],
            fields: {
                score: Influx.FieldType.FLOAT,
                index: Influx.FieldType.INTEGER
            }
        },
        {
            measurement: 'appstore_app',
            tags: [
                'appId',
                'version',
                'title'
            ],
            fields: {
                size: Influx.FieldType.INTEGER,
                reviews: Influx.FieldType.INTEGER,
                currentVersionReviews: Influx.FieldType.INTEGER,
                score: Influx.FieldType.FLOAT,
                currentVersionScore: Influx.FieldType.FLOAT
            }
        },
        {
            measurement: 'appstore_app_release',
            tags: [
                'appId',
                'version',
                'title'
            ],
            fields: {
                size: Influx.FieldType.INTEGER,
                iosVersion: Influx.FieldType.STRING,
                changed: Influx.FieldType.STRING
            }
        }
    ]
});

module.exports = influx;
