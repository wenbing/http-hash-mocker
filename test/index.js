const fs = require('fs');
const http = require('http');
const path = require('path');

const rimraf = require('rimraf');
const servertest = require('servertest');
const tape = require('tape');
const sendError = require('send-data/error');

const router = require('../');

const handleError = (req, res, err) => {
  if (err && !res.finished) {
    sendError(req, res, { body: err });
  }
};

const initOpts = {
  basedir: path.resolve(__dirname, '../'),
  routes: [
    '/api/photo/:photoid',
    '/api/album/:albumid',
    '/api/picture/:is-plain-object',
  ],
};

const server = http.createServer((req, res) => {
  router(req, res, initOpts, (err) => handleError(req, res, err));
});

tape('mocker pathname', (t) => {
  servertest(server, '/api/photo/200', { encoding: 'utf8' }, (err, res) => {
    t.ifError(err, 'no error');
    t.equal(res.statusCode, 200, 'correct statusCode');
    t.equal(res.body, '"OK"', 'correct body content');
    t.end();
  });
});

tape('mocker routes', (t) => {
  servertest(server, '/api/photo/999', { encoding: 'utf8' }, (err, res) => {
    t.ifError(err, 'no error');
    t.equal(res.statusCode, 200, 'correct statusCode');
    t.equal(res.body, 'Nine Nine Nine', 'correct body content');
    t.end();
  });
});

tape('mocker function', (t) => {
  servertest(server, '/api/photo/888', { encoding: 'utf8' }, (err, res) => {
    t.ifError(err, 'no error');
    t.equal(res.statusCode, 200, 'correct statusCode');
    t.equal(res.body, 'Eight Eight Eight', 'correct body content');
    t.end();
  });
});

tape('mocker http-methods', (t) => {
  servertest(server, '/api/photo/300', { encoding: 'utf8' }, (err, res) => {
    t.ifError(err, 'no error');
    t.equal(res.statusCode, 200, 'correct statusCode');
    t.equal(res.body, '300 plain', 'correct body content');
    t.end();
  });
});

tape('mocker http-methods isSendObject', (t) => {
  servertest(server, '/api/picture/isPlainObject', { encoding: 'json' }, (err, res) => {
    t.ifError(err, 'no error');
    t.equal(res.statusCode, 200, 'correct statusCode');
    t.equal(res.body.is, 'plain object', 'correct body content');
    t.end();
  });
});

tape('mocker http-methods post', (t) => {
  servertest(server, '/api/photo/300', { method: 'POST', encoding: 'json' }, (err, res) => {
    t.ifError(err, 'no error');
    t.equal(res.statusCode, 200, 'correct statusCode');
    t.equal(res.body.foo, 'bar', 'correct body content');
    t.end();
  })
  .end();
});

tape('mocker http-methods route post', (t) => {
  servertest(server, '/api/album/333', { method: 'POST', encoding: 'json' }, (err, res) => {
    t.ifError(err, 'no error');
    t.equal(res.statusCode, 200, 'correct statusCode');
    t.equal(res.body.albumid, 888, 'correct body content');
    t.end();
  })
  .end();
});

tape('require nonexists module throws', (t) => {
  servertest(server, '/api/throw/500', { method: 'GET', encoding: 'json' }, (err, res) => {
    t.ok(err, 'throw err');
    t.end();
  })
  .end();
});
