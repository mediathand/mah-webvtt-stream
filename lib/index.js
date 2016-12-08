'use strict';

const Spawn = require('child_process').spawn;
const Through2 = require('through2');

module.exports = function WebVttStream(options) {

    options = options || {};

    let telxcc = null;
    let writable = true;
    let readable = true;

    return Through2(function write(chunk, encoding, callback) {

        if (!telxcc) {
            const params = ['-n'];

            if (options.pid !== undefined) {
                params.push('-t', parseInt(options.pid, 0));
            }
            if (options.teletextPage !== undefined) {
                params.push('-p', parseInt(options.teletextPage, 0));
            }
            if (options.endAfter !== undefined) {
                params.push('-e', options.endAfter);
            }

            telxcc = Spawn(`${__dirname}/../telxcc/telxcc`, params, { stdout: ['pipe', 'pipe', 'ignore'] });

            telxcc.stdin.on('close', () => {

                writable = false;
            });

            telxcc.stdin.on('error', (err) => {

                writable = false;
                if (err.code !== 'EPIPE' && err.code !== 'ECONNRESET') {
                    throw err;
                }
            });

            telxcc.stdout.on('data', (data) => {

                this.push(data);
            });

            telxcc.stdout.on('end', () => {

                readable = false;
            });

            telxcc.on('close', (code) => {

                writable = false;
                readable = false;
                if (code !== 0) {
                    console.log(`process exited with code ${code}`);
                }
                this.end();
            });
        }

        if (writable && telxcc.stdin.writable) {
            telxcc.stdin.write(chunk);
        }

        callback();
    }, (callback) => {

        if (telxcc && writable) {
            telxcc.stdin.end();
        }

        if (telxcc && readable) {

            // Flush and wait

            telxcc.stdout.on('end', callback);
        }
        else {
            setImmediate(() => {

                callback();
            });
        }
    });
};
