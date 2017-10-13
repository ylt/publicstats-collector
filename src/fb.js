var FB = require('fb');

let fb = new FB.Facebook({
    appId: process.env.FACEBOOK_APPID,
    appSecret: process.env.FACEBOOK_APPSECRET,
    accessToken: process.env.FACEBOOK_ACCESSTOKEN
});

const influx = require('./influx');

function scrape(pagename, name) {
    fb.api(pagename, {
        fields: [
            'id',
            'name',
            'fan_count',
            'were_here_count',
            'rating_count',
            'talking_about_count',
            'checkins',
            'overall_star_rating'
        ]
    }, resDetails => {
        let info = {
            likes: resDetails.fan_count,
            visitors: resDetails.were_here_count,
            ratings: resDetails.rating_count,
            talkingabout: resDetails.talking_about_count,
            checkins: resDetails.checkins,
            rating: resDetails.overall_star_rating,
            mentions_day: 0,
            mentions_week: 0,
            mentions_month: 0
        };
        let countryinf = {};

        fb.api(pagename + '/insights', {metric: ['page_fans_country', 'page_storytellers_by_country']}, res_insights => {
            //console.log(res_insights);
            let series = [];

            if (res_insights.data) {
                for (let collection of res_insights.data) {
                    let field = '';
                    if (collection.name == 'page_fans_country') {
                        field = 'likes';
                    }
                    else {
                        field = 'mentions_' + collection.period.replace('days_28', 'month');
                    }
                    let sets = collection.values.filter(set => set.value);
                    let set = sets[sets.length - 1];

                    if (!set)
                        continue;

                    //aggregate mentions into total
                    if (collection.name == 'page_storytellers_by_country') {
                        for (let country in set.value) {
                            let val = set.value[country];
                            info[field] += val;
                        }
                    }

                    //per country inf
                    for (let country in set.value) {
                        let val = set.value[country];
                        if (!(country in countryinf)) {
                            countryinf[country] = {likes: 0, mentions_day: 0, mentions_week: 0, mentions_month: 0};
                        }
                        countryinf[country][field] = val;
                    }
                }
                for (let country in countryinf) {
                    let inf = countryinf[country];
                    series.push({
                        measurement: 'facebook_country',
                        fields: inf,
                        tags: {'page': pagename, country: country}
                    });
                }
            }
            else {
                console.error('fb', res_insights);
            }

            //the info is now organised, we can now generate the series
            //console.log(countryinf);
            //console.log(info);


            series.push({
                measurement: 'facebook',
                fields: info,
                tags: {'page': pagename}
            });


            //console.log(series);
            influx.writePoints(series);
        });
    });
}

var CronJob = require('cron').CronJob;
// secs mins hrs dom mo dow
new CronJob({ //every 5 mins
    cronTime: '0 */10 * * * *',
    start: true,
    runOnInit: true,
    onTick: function () {
        console.log('Fetching facebook');
        scrape('monzobank', 'monzo');
        scrape('starlingbank', 'starling');
        scrape('tidebanking', 'tide');
        scrape('revolutapp', 'revolut');
        scrape('fidorbank', 'fidor');
        scrape('fidoruk', 'fidoruk');
        scrape('TandemMoney', 'tandem');
        scrape('N26', 'N26');
        scrape('AtomBankOfficial', 'atom');
        scrape('imaginecurve', 'curve');
        scrape('lootapps', 'loot');
        scrape('MyMonese', 'monese');
        scrape('pockituk', 'pockit');
        scrape('Uaccount', 'uaccount');
        scrape('bunq', 'bunq');
        scrape('transferwise', 'transferwise');
        scrape('getcoconut', 'coconut');
        scrape('HolviCom', 'holvi');
    }
});

