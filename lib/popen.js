'use strict';

const Spawn = require('child_process').spawn;
const { Transform } = require('stream');


class PopenStream extends Transform {

    #writable = true;
    #readable = true;
    #exec;

    constructor(command, args) {

        super({ autoDestroy: true, emitClose: true, allowHalfOpen: false });

        const exec = this.#exec = Spawn(command, args, { stdio: ['pipe', 'pipe', 'ignore'] });

        exec.stdin.on('close', () => {

            this.#writable = false;
        });

        exec.stdin.on('error', (err) => {

            this.#writable = false;
            if (err.code !== 'EPIPE' && err.code !== 'ECONNRESET') {
                this.destroy(err);
            }
        });

        exec.stdout.on('data', (data) => {

            this.push(data);
        });

        exec.stdout.on('end', () => {

            this.#readable = false;
        });

        exec.on('close', (code) => {

            this.#writable = false;
            this.#readable = false;
            if (code !== 0) {
                console.log(`process exited with code ${code}`);
            }

            this.end();
        });
    }

    _transform(chunk, encoding, done) {

        if (this.#writable && this.#exec.stdin.writable) {
            this.#exec.stdin.write(chunk);
        }

        done();
    }

    _flush(done) {

        if (this.#writable) {
            this.#exec.stdin.end();
        }

        if (this.#readable) {

            // Flush and wait

            this.#exec.stdout.on('close', () => setImmediate(done));
        }
        else {
            setImmediate(done);
        }
    }

    _destroy(err, cb) {

        setImmediate(() => this.#exec.kill());

        return super._destroy(err, cb);
    }
}


module.exports = function Popen(command, args) {

    return new PopenStream(command, args);
};
