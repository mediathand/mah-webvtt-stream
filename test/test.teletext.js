'use strict';

// Load modules

const Fs = require('fs');
const Path = require('path');
const ConcatStream = require('concat-stream');
const Code = require('code');
const Lab = require('lab');
const Through2 = require('through2');
const WebVttStream = require('..');


// Declare internals

const internals = {
    testPath: Path.join(__dirname, 'fixtures', 'teletext.ts')
};


// Test shortcuts

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


describe('WebVttStream', () => {

    it('parses correctly', (done) => {

        Fs.createReadStream(internals.testPath)
            .pipe(new WebVttStream())
            .pipe(ConcatStream({ encoding: 'string' }, (data) => {

                expect(data).to.equal('WEBVTT\nX-TIMESTAMP-MAP=LOCAL:00:00.000,MPEGTS:1072442970\n\n' +
                                  '00:02.080 --> 00:04.320 position:18% align:start\nDet er Frida,\nog det er Ida, og det er Ane.\n\n');
                done();
            }));
    });

    it('handles empty files', (done) => {

        Fs.createReadStream(Path.join(__dirname, 'fixtures', 'empty.ts'))
            .pipe(new WebVttStream())
            .pipe(ConcatStream({ encoding: 'buffer' }, (data) => {

                expect(data).to.equal(new Buffer(''));
                done();
            }));
    });

    it('handles early process exits', (done) => {

        let flushCb;

        Fs.createReadStream(internals.testPath)
            .pipe(Through2((chunk, encoding, callback) => {

                callback(null, chunk, encoding);
            }, (callback) => {

                flushCb = callback;
            }))
            .pipe(new WebVttStream({ endAfter: 1 })).on('end', () => {

                flushCb();
            })
            .pipe(ConcatStream({ encoding: 'string' }, (data) => {

                expect(data).to.equal('WEBVTT\nX-TIMESTAMP-MAP=LOCAL:00:00.000,MPEGTS:1072442970\n\n');
                done();
            }));
    });

    describe('option', () => {

        it('"pid" is respected', (done) => {

            Fs.createReadStream(internals.testPath)
                .pipe(new WebVttStream({ pid: 256 }))
                .pipe(ConcatStream({ encoding: 'string' }, (data) => {

                    expect(data).to.equal('WEBVTT\nX-TIMESTAMP-MAP=LOCAL:00:00.000,MPEGTS:1072442970\n\n' +
                                      '00:02.080 --> 00:04.320 position:18% align:start\nDet er Frida,\nog det er Ida, og det er Ane.\n\n');

                    Fs.createReadStream(internals.testPath)
                        .pipe(new WebVttStream({ pid: 200 }))
                        .pipe(ConcatStream({ encoding: 'string' }, (data2) => {

                            expect(data2).to.equal('');
                            done();
                        }));
                }));
        });

        it('"teletextPage" is respected', (done) => {

            Fs.createReadStream(internals.testPath)
                .pipe(new WebVttStream({ teletextPage: 395 }))
                .pipe(ConcatStream({ encoding: 'string' }, (data) => {

                    expect(data).to.equal('WEBVTT\nX-TIMESTAMP-MAP=LOCAL:00:00.000,MPEGTS:1072442970\n\n' +
                                      '00:02.080 --> 00:04.320 position:18% align:start\nDet er Frida,\nog det er Ida, og det er Ane.\n\n');

                    Fs.createReadStream(internals.testPath)
                        .pipe(new WebVttStream({ teletextPage: 42 }))
                        .pipe(ConcatStream({ encoding: 'string' }, (data2) => {

                            expect(data2).to.equal('');
                            done();
                        }));
                }));
        });

        it('"endAfter" is respected', (done) => {

            Fs.createReadStream(internals.testPath)
                .pipe(new WebVttStream({ endAfter: 3.5 }))
                .pipe(ConcatStream({ encoding: 'string' }, (data) => {

                    expect(data).to.equal('WEBVTT\nX-TIMESTAMP-MAP=LOCAL:00:00.000,MPEGTS:1072442970\n\n' +
                                      '00:02.080 --> 00:04.320 position:18% align:start\nDet er Frida,\nog det er Ida, og det er Ane.\n\n');

                    Fs.createReadStream(internals.testPath)
                        .pipe(new WebVttStream({ endAfter: 1.9 }))
                        .pipe(ConcatStream({ encoding: 'string' }, (data2) => {

                            expect(data2).to.equal('WEBVTT\nX-TIMESTAMP-MAP=LOCAL:00:00.000,MPEGTS:1072442970\n\n');
                            done();
                        }));
                }));
        });
    });
});
