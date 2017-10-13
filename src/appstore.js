/**
 * Created by joe on 12/10/17.
 */
const influx = require('./influx');
const aps = require('app-store-scraper');
const _ = require('lodash');
const moment = require('moment');

async function search(term, country) {

    let results = await aps.search({
        term: term,
        num: 100,
        device: aps.device.ALL,
        country: country
    });

    // console.log(results);

    let series = [];
    let i = 1;
    for (let result of results) {
        let point = {
            measurement: 'appstore_search',
            tags: {
                query: term,
                appId: result.appId,
                country: country,
                title: result.title
            },
            fields: {
                score: result.score || 0,
                index: i
            }
        }

        series.push(point);
        i++;
    }

    influx.writePoints(series);
    // console.log(series);
}

async function fetchInfo(appId) {
    let series = [];

    let q = {
        country: 'gb',
        lang: 'en-gb'
    }

    if (Number.isInteger(appId))
        q.id = appId;
    else
        q.appId = appId;

    let info = await aps.app(q);

    appId = info.appId;

    series.push({
        measurement: 'appstore_app',
        tags: {
            appId,
            version: info.version,
            title: info.title
        },
        fields: {
            size: info.size,
            reviews: info.reviews || 0,
            currentVersionReviews: info.currentVersionReviews || 0,
            score: info.score || 0,
            currentVersionScore: info.currentVersionScore || 0
        }
    });

    series.push({
        measurement: 'appstore_app_release',
        tags: {
            appId,
            version: info.version,
            title: info.title
        },
        fields: {
            size: info.size,
            iosVersion: info.requiredOsVersion,
            changed: info.releaseNotes || ""
        },
        timestamp: moment(info.updated).toDate()
    })

    influx.writePoints(series);
}

// let banks = [
    // 'co.uk.getmondo',
    // 'com.atombank.release',
    // 'com.bunq.android',
    // 'com.holvi.app',
    // 'com.imaginecurve.curve.prd',
    // 'com.monese.monese.live',
    // 'com.pockit.mobile.android',
    // 'com.revolut.revolut',
    // 'com.starlingbank.android',
    // 'com.tideplatform.banking',
    // 'com.transferwise.android',
    // 'de.number26.android',
    // 'io.loot.lootapp',
    // 'uk.co.tandem.android.app',
    // 'uk.uaccount.android'
// ];

let banks = [
    1052238659, //monzo
    1085637839, //atom
    1021178150, //bunq
    1006642625, //holvi
    1049397112, //curve
    1102793407, //monese
    1022334791, //pockit
    932493382, //revolut
    956806430, //starling
    1140086177, //tide
    612261027, //transferwise
    956857223, //n26
    1010828489, //loot
    1128467665, //tandem
    1224502407 //uaccount
]


const cron = require('cron');
var CronJob = require('cron').CronJob;

// secs mins hrs dom mo dow
new CronJob({ //every 5 mins
    cronTime: '0 */30 * * * *',
    start: true,
    runOnInit: true,
    onTick: function () {
        console.log('Fetching App store');

        search('bank', 'gb');
        let p = Promise.resolve(null);
        for (let bank of banks) {
            ((bank) => {
                p = p.then(() => {
                    fetchInfo(bank);
                })
            })(bank);
        }

    }
});