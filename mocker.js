/* eslint no-var:0, no-console:0, strict:0 */
'use strict';
const url = require('url');
const path = require('path');
const fs = require('fs');

const xtend = require('xtend');
const httpHashRouter = require('http-hash-router');
const isSendObject = require('send-data/is-send-object');
const httpMethods = require('http-methods');
const sendJson = require('send-data/json');
const sendPlain = require('send-data/plain');
const mkdirp = require('mkdirp');

function create(routes, mopts) {
  if (!mopts || !mopts.basedir) {
    throw new Error('mopts.basedir 必须');
  }

  const rootdir = mopts.rootdir || '/';

  const router = httpHashRouter();

  function addRoute(route) {
    const filepath = path.resolve(mopts.basedir, 'test/fixtures' + route + '.js');
    delete require.cache[filepath];
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
    let ws;
    try {
      delete require.cache[filepath];
      require.resolve(filepath);
      dealResult();
    } catch (err) {
      if (!mopts.autoMock) {
        return router(req, res, opts, cb);
      } else { console.log('it is in mock ****')
        const filepathDir = path.dirname(filepath);
        console.log('create a new file: ', filepathDir);
        mkdirp.sync(filepathDir);
        // 模板文件初始化mock文件
        var srcPath = path.join(__dirname, './dataTemplate.js');
        ws = fs.createReadStream(srcPath).pipe(fs.createWriteStream(filepath));
        ws.on('finish', () => {
          dealResult();
        });
        ws.on('error', (err) => {
          cb(err);
        });
      }
    }
    function dealResult() {
      const result = require(filepath); console.log('&&result**:::', result, filepath)
      if (typeof result === 'function') {
        return result(req, res, opts, cb);
      }

      if (!isSendObject(result)) {
        return httpMethods(result)(req, res, opts, cb);
      }
      return sendJson(req, res, xtend(opts, result), cb);
    }
  }
  mockapi.router = router;
  return mockapi;
}

module.exports = create;
