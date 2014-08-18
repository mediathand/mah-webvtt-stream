var fs = require('fs');

var WebVttStream = require('../index');

fs.createReadStream(__dirname + '/fixtures/test.ts').pipe(new WebVttStream({ endAfter: 3 })).pipe(process.stdout);
fs.createReadStream(__dirname + '/fixtures/empty.ts').pipe(new WebVttStream()).pipe(process.stdout);
