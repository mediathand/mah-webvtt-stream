var util = require('util'),
    spawn = require('child_process').spawn;

var through = require('through');

module.exports = WebVttStream;

function WebVttStream(options) {
  options = options || {};

  var telxcc = null;
  var closed = false;

  return through(function write(data) {
    var self = this;

    if (!telxcc && data) {
      var params = ['-n'];

      if (options.pid) params.push('-t', options.pid);
      if (options.teletextPage) params.push('-p', options.teletextPage);
      if (options.endAfter) params.push('-e', options.endAfter);

      telxcc = spawn(__dirname+'/telxcc/telxcc', params, { stdout: ['pipe', 'pipe', 'ignore'] });

      telxcc.stdin.on('close', function() {
        closed = true;
      });

      telxcc.stdin.on('error', function(err) {
        if (err.code !== 'EPIPE') throw err;
      });

      telxcc.stdout.on('data', function(chunk) {
        self.queue(chunk);
      });

      telxcc.stdout.on('end', function() {
        self.queue(null);
      });

      telxcc.on('close', function(code) {
        if (code !== 0) {
          console.log('process exited with code ' + code);
        }
      });
    }

    if (data && !closed)
      telxcc.stdin.write(data);
  },
  function end () { //optional
    if (telxcc) telxcc.stdin.end();
    else this.queue(null);
  });
}
