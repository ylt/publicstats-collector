/**
 * Created by joe on 12/10/17.
 */
const influx = require('./influx');
const gps = require('google-play-scraper');
const _ = require('lodash');
const moment = require('moment');

async function search(term, country) {

    let results = await gps.search({
        term: term,
        num: 50,
        lang: 'en',
        country: country
    });

    let series = [];
    let i = 1;
    for (let result of results) {
        let point = {
            measurement: 'googleplay_search',
            tags: {
                query: term,
                appId: result.appId,
                country: country
            },
            fields: {
                score: result.score,
                index: i
            }
        }

        series.push(point);
        i++;
    }

    influx.writePoints(series);
}

async function fetchInfo(appId) {
    let series = [];

    let info = await gps.app({
        appId: appId,
        country: 'gb',
        lang: 'en-gb'
    });

    console.log(info);

    series.push({
        measurement: 'googleplay_app',
        tags: {
            appId
        },
        fields: {
            minInstalls: info.minInstalls,
            maxInstalls: info.maxInstalls,
            reviews: info.reviews,
            score: info.score
        }
    });

    for (let i = 1; i <= 5; i++) {
        series.push({
            measurement: 'googleplay_app_histogram',
            tags: {
                appId,
                stars: i
            },
            fields: {
                ratings: info.histogram[i.toString()]
            }
        });
    }

    series.push({
        measurement: 'googleplay_app_release',
        tags: {
            appId,
            version: info.version
        },
        fields: {
            androidVersion: info.androidVersion,
            changed: info.recentChanges.join("\n")
        },
        timestamp: moment(info.updated, 'DD MMMM YYYY').toDate()
    })

    influx.writePoints(series);


}

let banks = [
    'co.uk.getmondo',
    'com.atombank.release',
    'com.bunq.android',
    'com.holvi.app',
    'com.imaginecurve.curve.prd',
    'com.monese.monese.live',
    'com.pockit.mobile.android',
    'com.revolut.revolut',
    'com.starlingbank.android',
    'com.tideplatform.banking',
    'com.transferwise.android',
    'de.number26.android',
    'io.loot.lootapp',
    'uk.co.tandem.android.app',
    'uk.uaccount.android'
];




const cron = require('cron');
var CronJob = require('cron').CronJob;

// secs mins hrs dom mo dow
new CronJob({ //every 5 mins
    cronTime: '0 */30 * * * *',
    start: true,
    runOnInit: true,
    onTick: function () {
        console.log('Fetching Google play');

        search('bank', 'gb');
        let p = Promise.resolve(null);
        for (let bank of banks) {
            ((bank) => {
                p.then(() => {
                    fetchInfo(bank);
                })
            })(bank);
        }

    }
});

