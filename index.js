require('log-timestamp');
console.log('starting');

console.log(process.env);

require('./src/monzocurrent');
require('./src/discourse');
require('./src/fb');
require('./src/twitter');
require('./src/googleplay');
require('./src/appstore');