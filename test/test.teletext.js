'use strict';

const fs = require('fs');

const WebVttStream = require('../index');

console.log('1:');
fs.createReadStream(__dirname + '/fixtures/test.ts').pipe(new WebVttStream({ endAfter: 3 }))
  .on('end', () => {
    console.log('2:');
    fs.createReadStream(__dirname + '/fixtures/empty.ts').pipe(new WebVttStream()).pipe(process.stdout);
  })
  .pipe(process.stdout);
