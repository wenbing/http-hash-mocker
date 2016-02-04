/* eslint no-var:0, no-console:0 */
const url = require('url');
const path = require('path');

const xtend = require('xtend');
const httpHashRouter = require('http-hash-router');
const sendJson = require('send-data/json');
const sendPlain = require('send-data/plain');
 
function mock(req, res, opts, cb) {
  const result = opts.result;
  delete opts.result;

  if (typeof result === 'function') {
    try {
      result(req, res, opts, cb);
    } catch (err) {
      return cb(err);
    }
    return;
  }

  if (!result || result.statusCode === undefined || result.body === undefined) {
    const err = new Error('result 或 status 或 body 不存在');
    return cb(err);
  }

  if (typeof result.body === 'string') {
    sendPlain(req, res, result, cb);
  } else {
    sendJson(req, res, result, cb);
  }
}
 
function create(routes, copts) {
  if (!copts || !copts.basedir) {
    throw new Error('copts.basedir 必须');
  }

  const router = httpHashRouter();

  function addRoute(route) {
    router.set(route, function mockapiHandler(req, res, opts, cb) {
      const filepath = path.resolve(copts.basedir, 'test/fixtures' + route + '.js');
      var result;
      try {
        result = require(filepath);
      } catch (err) {
        return cb(err);
      }
      mock(req, res, xtend(opts, { result }), cb);
    });
  }

  routes.forEach(addRoute);

  function mockapi(req, res, opts, cb) {
    const pathname = url.parse(req.url).pathname;
    var filepath = path.resolve(copts.basedir, 'test/fixtures' + pathname + '.js');
    var result;
    try {
      result = require(filepath);
    } catch (err) {
      if (err.code !== 'MODULE_NOT_FOUND') {
        return cb(err);
      }
      return router(req, res, opts, cb);
    }

    mock(req, res, xtend(opts, { result }), cb);
  }

  mockapi.router = router;
  return mockapi;
}
 
module.exports = create;
