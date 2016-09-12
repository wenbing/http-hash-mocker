const http = require('http');
const path = require('path');

const servertest = require('servertest');
const tape = require('tape');
const sendError = require('send-data/error');

const mocker = require('../');

const server = http.createServer(function (req, res) {
  mocker([], {
    autoMock: true,
    basedir: path.resolve(__dirname, '../')
  })(req, res, {}, function (err) {
    if (err) {
      if (!res.finished) {
        sendError(req, res, { body: err });
      }
    }
  });
});

tape('auto mock', function (t) {
  const randomFile = Math.random().toString(36).slice(2).slice(0, 6);
  servertest(server, `/auto/mock/${randomFile}`, { encoding: 'json' }, function (err, res) {
    t.ifError(err, 'no error');
    t.equal(res.statusCode, 200, 'correct statusCode');
    t.equal(!!res.body, true, 'body exit');
    t.equal(typeof res.body.data === 'object', true, 'body contains data');
    t.equal(typeof res.body.data.total === 'number', true, 'body data contains total');
    t.equal(Array.isArray(res.body.data.items), true, 'body data contains items');
    t.end();
  });
});
