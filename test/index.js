const fs = require('fs');
const http = require('http');
const path = require('path');

const rimraf = require('rimraf');
const servertest = require('servertest');
const tape = require('tape');
const sendError = require('send-data/error');

const router = require('../');

const handleError = function (req, res, err) {
  if (err) {
    if (!res.finished) {
      sendError(req, res, { body: err });
    }
  }
};

const clean = () => {
  const filepath = path.resolve(__dirname, '..', 'test/fixtures', 'api/generate/100.js');
  delete require.cache[filepath];
  try {
    fs.unlinkSync(filepath);
  } catch(ex) {}
};

const initOpts = {
  basedir: path.resolve(__dirname, '../'),
  routes: [
    '/api/photo/:photoid',
    '/api/album/:albumid',
    '/api/picture/:is-plain-object',
  ],
  autoGenerate: false,
};

const server = http.createServer(function (req, res) {
  router(req, res, initOpts, (err) => handleError(req, res, err));
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

tape('mocker function', function (t) {
  servertest(server, '/api/photo/888', { encoding: 'utf8' }, function (err, res) {
    t.ifError(err, 'no error')
    t.equal(res.statusCode, 200, 'correct statusCode')
    t.equal(res.body, 'Eight Eight Eight', 'correct body content')
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

tape('mocker http-methods isSendObject', function (t) {
  servertest(server, '/api/picture/isPlainObject', { encoding: 'json' }, function (err, res) {
    t.ifError(err, 'no error')
    t.equal(res.statusCode, 200, 'correct statusCode')
    t.equal(res.body.is, 'plain object', 'correct body content')
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

tape('require nonexists module throws', function (t) {
  servertest(server, '/api/throw/500', { method: 'GET', encoding: 'json' }, function (err, res) {
    t.ok(err, 'throw err');
    t.end();
  })
  .end();
});
//*/
