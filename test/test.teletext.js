'use strict';

// Load modules

const Fs = require('fs');
const Path = require('path');
const Spawn = require('child_process').spawn;
const ConcatStream = require('concat-stream');
const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Through2 = require('through2');
const WebVttStream = require('..');


// Declare internals

const internals = {
    testPath: Path.join(__dirname, 'fixtures', 'teletext.ts')
};


internals.concat = (stream) => {

    return new Promise((resolve, reject) => {

        stream.on('error', reject);
        stream.pipe(ConcatStream({ encoding: 'string' }, resolve));
    });
};


// Test shortcuts

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const afterEach = lab.afterEach;
const expect = Code.expect;


describe('WebVttStream', () => {

    afterEach(async () => {

        // Validate that file descriptors have been closed

        const cmd = Spawn('lsof', ['-p', process.pid]);
        cmd.stdin.end();

        const lsof = await internals.concat(cmd.stdout);

        let count = 0;
        const lines = lsof.split('\n');
        for (let i = 0; i < lines.length; ++i) {
            count += lines[i].indexOf(internals.testPath) !== -1;
        }

        expect(count).to.equal(0);
    });

    it('parses correctly', async () => {

        const data = await internals.concat(Fs.createReadStream(internals.testPath)
            .pipe(new WebVttStream()));

        expect(data).to.equal('WEBVTT\nX-TIMESTAMP-MAP=LOCAL:00:00.000,MPEGTS:1072442970\n\n' +
                            '00:02.080 --> 00:04.320 position:14% size:72% align:start\nDet er Frida,\nog det er Ida, og det er Ane.\n\n');
    });

    it('handles empty files', async () => {

        const data = await internals.concat(Fs.createReadStream(Path.join(__dirname, 'fixtures', 'empty.ts'))
            .pipe(new WebVttStream()));

        expect(data).to.equal('');
    });

    it('handles early process exits', async () => {

        let flushCb;

        const data = await internals.concat(Fs.createReadStream(internals.testPath)
            .pipe(Through2((chunk, encoding, callback) => {

                callback(null, chunk, encoding);
            }, (callback) => {

                flushCb = callback;
            }))
            .pipe(new WebVttStream({ endAfter: 1 })).on('end', () => {

                flushCb();
            }));

        expect(data).to.equal('WEBVTT\nX-TIMESTAMP-MAP=LOCAL:00:00.000,MPEGTS:1072442970\n\n');
    });

    describe('option', () => {

        it('"pid" is respected', async () => {

            const data = await internals.concat(Fs.createReadStream(internals.testPath)
                .pipe(new WebVttStream({ pid: 256 })));

            expect(data).to.equal('WEBVTT\nX-TIMESTAMP-MAP=LOCAL:00:00.000,MPEGTS:1072442970\n\n' +
                                  '00:02.080 --> 00:04.320 position:14% size:72% align:start\nDet er Frida,\nog det er Ida, og det er Ane.\n\n');

            const data2 = await internals.concat(Fs.createReadStream(internals.testPath)
                .pipe(new WebVttStream({ pid: 200 })));

            expect(data2).to.equal('');
        });

        it('"teletextPage" is respected', async () => {

            const data = await internals.concat(Fs.createReadStream(internals.testPath)
                .pipe(new WebVttStream({ teletextPage: 395 })));

            expect(data).to.equal('WEBVTT\nX-TIMESTAMP-MAP=LOCAL:00:00.000,MPEGTS:1072442970\n\n' +
                                  '00:02.080 --> 00:04.320 position:14% size:72% align:start\nDet er Frida,\nog det er Ida, og det er Ane.\n\n');

            const data2 = await internals.concat(Fs.createReadStream(internals.testPath)
                .pipe(new WebVttStream({ teletextPage: 42 })));

            expect(data2).to.equal('');
        });

        it('"endAfter" is respected', async () => {

            const data = await internals.concat(Fs.createReadStream(internals.testPath)
                .pipe(new WebVttStream({ endAfter: 3.5 })));

            expect(data).to.equal('WEBVTT\nX-TIMESTAMP-MAP=LOCAL:00:00.000,MPEGTS:1072442970\n\n' +
                                  '00:02.080 --> 00:04.320 position:14% size:72% align:start\nDet er Frida,\nog det er Ida, og det er Ane.\n\n');

            const data2 = await internals.concat(Fs.createReadStream(internals.testPath)
                .pipe(new WebVttStream({ endAfter: 1.9 })));

            expect(data2).to.equal('WEBVTT\nX-TIMESTAMP-MAP=LOCAL:00:00.000,MPEGTS:1072442970\n\n');
        });
    });
});
