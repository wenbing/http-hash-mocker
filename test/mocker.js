const http = require('http');
const path = require('path');

const servertest = require('servertest');
const tape = require('tape');
const sendError = require('send-data/error');

const mocker = require('../');

const server = http.createServer(function (req, res) {
  mocker([
    '/api/photo/:photoid',
    '/api/album/:albumid',
  ], {
    basedir: path.resolve(__dirname, '../')
  })(req, res, {}, function (err) {
    if (err) {
      if (!res.finished) {
        sendError(req, res, { body: err });
      }
    }
  });
});

tape('mocker pathname', function (t) {
  servertest(server, '/api/photo/200', { encoding: 'utf8' }, function (err, res) {
    t.ifError(err, 'no error')
    t.equal(res.statusCode, 200, 'correct statusCode')
    t.equal(res.body, '"OK"', 'correct body content')
    t.end();
  });
});

tape('mocker routes', function (t) {
  servertest(server, '/api/photo/999', { encoding: 'utf8' }, function (err, res) {
    t.ifError(err, 'no error')
    t.equal(res.statusCode, 200, 'correct statusCode')
    t.equal(res.body, 'Nine Nine Nine', 'correct body content')
    t.end();
  });
});

tape('mocker http-methods', function (t) {
  servertest(server, '/api/photo/300', { encoding: 'utf8' }, function (err, res) {
    t.ifError(err, 'no error')
    t.equal(res.statusCode, 200, 'correct statusCode')
    t.equal(res.body, '300 plain', 'correct body content')
    t.end();
  });
});

tape('mocker http-methods post', function (t) {
  servertest(server, '/api/photo/300', { method: 'POST', encoding: 'json' }, function (err, res) {
    t.ifError(err, 'no error')
    t.equal(res.statusCode, 200, 'correct statusCode')
    t.equal(res.body.foo, 'bar', 'correct body content')
    t.end();
  })
  .end();
});

tape('mocker http-methods route post', function (t) {
  servertest(server, '/api/album/333', { method: 'POST', encoding: 'json' }, function (err, res) {
    t.ifError(err, 'no error')
    t.equal(res.statusCode, 200, 'correct statusCode')
    t.equal(res.body.albumid, 888, 'correct body content')
    t.end();
  })
  .end();
});
