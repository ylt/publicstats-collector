const influx = require('./influx');
const request = require('request');

function gatherCurrent() {
    request({
        url: 'https://mondobank.looker.com/looks/nmDRFzqr4mVDcN7GKq2qhN9dbv7zdSzx.json',
        json: true
    }, (err, res) => {
        if (err) return;

        let count = res.body[0]['current_accounts_num_live.mastercard_card_id_num'];

        influx.query(`
SELECT max("peak") FROM monzo_currentacc
        `).then(result => {
            let peak = result.groups()[0].rows[0].max;

            if (count > peak)
                peak = count;

            influx.writeMeasurement('monzo_currentacc', [{
                tags: {},
                fields: {
                    current: count,
                    peak: peak,
                    val: count < peak ? null : count
                }
            }]);


        });
    });
}

const cron = require('cron');
var CronJob = require('cron').CronJob;

// secs mins hrs dom mo dow
new CronJob({ //every 5 mins
    cronTime: '0 */5 * * * *',
    start: true,
    runOnInit: true,
    onTick: function () {
        console.log('Fetching monzo current account');
        gatherCurrent();
    }
});

module.exports = gatherCurrent;
