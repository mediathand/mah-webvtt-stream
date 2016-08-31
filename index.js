'use strict';

const Spawn = require('child_process').spawn;
const Through2 = require('through2');

module.exports = WebVttStream;

function WebVttStream(options) {
  options = options || {};

  let telxcc = null;
  let closed = false;

  return Through2(function write(chunk, encoding, callback) {

    if (!telxcc) {
      let params = ['-n'];

      if (options.pid) params.push('-t', options.pid);
      if (options.teletextPage) params.push('-p', options.teletextPage);
      if (options.endAfter) params.push('-e', options.endAfter);

      telxcc = Spawn(`${__dirname}/telxcc/telxcc`, params, { stdout: ['pipe', 'pipe', 'ignore'] });

      telxcc.stdin.on('close', () => {

        closed = true;
      });

      telxcc.stdin.on('error', (err) => {

        if (err.code !== 'EPIPE' && err.code !== 'ECONNRESET') throw err;
      });

      telxcc.stdout.on('data', (chunk) => {

        this.push(chunk);
      });

      telxcc.on('close', (code) => {

        if (code !== 0) {
          console.log(`process exited with code ${code}`);
        }
      });
    }

    if (chunk && !closed && telxcc.stdin.writable) {
      telxcc.stdin.write(chunk);
    }

    callback();
  }, (callback) => {

    if (telxcc) {
      telxcc.stdout.on('end', callback);
      telxcc.stdin.end();
    } else {
      callback();
    }
  });
}
