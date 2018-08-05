
var util = require('util');
var google = require("googleapis");
var youtube = google.youtube("v3");
var _ = require('lodash');
//
// youtube.channels.list({
//     id: 'UCNDTPIw62jC_qxtgje-b28g',
//     part: 'snippet,contentDetails,statistics',
//     key: process.env.GOOGLE_KEY
// }, (err,res) => {
//     // console.log(res);
//     console.log(util.inspect(res, false, null));
// });


youtube.search.list({
    key: process.env.GOOGLE_KEY,
    channelId: 'UCNDTPIw62jC_qxtgje-b28g',
    part: 'snippet'
}, (err,res) => {
    // console.log(util.inspect(res, false, null));
    let videoIds = _.map(res.items, i => i.id.videoId)

    let videos = _.keyBy(res.items, v => v.id.videoId)

    youtube.videos.list({
        key: process.env.GOOGLE_KEY,
        id: videoIds.join(','),
        part: 'statistics'
    }, (err, res) => {
        let videosInfo = _.keyBy(res.items, v => v.id)

        let series = [];

        for (let video of res.items) {
            let inf = videos[video]
        }

        console.log(util.inspect(videos, false, null));
        console.log(util.inspect(videosInfo, false, null));
    })
})