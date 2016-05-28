/* eslint no-var:0, no-console:0, strict:0 */
'use strict';
const url = require('url');
const path = require('path');

const xtend = require('xtend');
const httpHashRouter = require('http-hash-router');
const isSendObject = require('send-data/is-send-object');
const httpMethods = require('http-methods');
const sendJson = require('send-data/json');
const sendPlain = require('send-data/plain');
 
function create(routes, mopts) {
  if (!mopts || !mopts.basedir) {
    throw new Error('mopts.basedir 必须');
  }

  const rootdir = mopts.rootdir || '/';

  const router = httpHashRouter();

  function addRoute(route) {
    const filepath = path.resolve(mopts.basedir, 'test/fixtures' + route + '.js');
    const result = require(filepath);

    if (typeof result === 'function') {
      router.set(route, result);
      return;
    }

    if (!isSendObject(result)) {
      router.set(route, result);
      return;
    }

    router.set(route, function(req, res, opts, cb) {
      sendJson(req, res, xtend(opts, result), cb);
    });
  }

  routes.forEach(addRoute);

  function mockapi(req, res, opts, cb) {
    const pathname = url.parse(req.url).pathname;
    const filepath = path.resolve(
      mopts.basedir, 'test/fixtures' + pathname.slice(rootdir.length - 1) + '.js'
    );
    let result;
    try {
      result = require(filepath);
    } catch (err) {
      if (err.code === 'MODULE_NOT_FOUND' && err.message.indexOf(filepath) !== -1) {
        return router(req, res, opts, cb);
      }
      return process.nextTick(function() {
        cb(err);
      });
    }

    if (typeof result === 'function') {
      return result(req, res, opts, cb);
    }

    if (!isSendObject(result)) {
      return httpMethods(result)(req, res, opts, cb);
    }

    return sendJson(req, res, xtend(opts, result), cb);
  }

  mockapi.router = router;
  return mockapi;
}
 
module.exports = create;
