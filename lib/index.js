'use strict';

const Popen = require('./popen');

module.exports = function WebVttStream(options) {

    options = options || {};

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

    return Popen(`${__dirname}/../telxcc/telxcc`, params);
};
