'use strict';

const Spawn = require('child_process').spawn;
const Through2 = require('through2');

module.exports = function Popen(command, args) {

    let exec = null;
    let writable = true;
    let readable = true;

    return Through2(function write(chunk, encoding, callback) {

        if (!exec) {
            exec = Spawn(command, args, { stdio: ['pipe', 'pipe', 'ignore'] });

            exec.stdin.on('close', () => {

                writable = false;
            });

            exec.stdin.on('error', (err) => {

                writable = false;
                if (err.code !== 'EPIPE' && err.code !== 'ECONNRESET') {
                    throw err;
                }
            });

            exec.stdout.on('data', (data) => {

                this.push(data);
            });

            exec.stdout.on('end', () => {

                readable = false;
            });

            exec.on('close', (code) => {

                writable = false;
                readable = false;
                if (code !== 0) {
                    console.log(`process exited with code ${code}`);
                }

                this.end();
            });
        }

        if (writable && exec.stdin.writable) {
            exec.stdin.write(chunk);
        }

        callback();
    }, (callback) => {

        if (exec && writable) {
            exec.stdin.end();
        }

        if (exec && readable) {

            // Flush and wait

            exec.stdout.on('end', callback);
        }
        else {
            setImmediate(() => {

                callback();
            });
        }
    });
};
