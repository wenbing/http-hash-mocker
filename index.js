/* eslint no-var:0, no-console:0, strict:0 */
'use strict';
const fs = require('fs');
const url = require('url');
const path = require('path');

const xtend = require('xtend');
const httpHashRouter = require('http-hash-router');
const isSendObject = require('send-data/is-send-object');
const httpMethods = require('http-methods');
const sendJson = require('send-data/json');
const mkdirp = require('mkdirp');

const processResult = (result, req, res, opts, cb) => {
  if (typeof result === 'function') {
    result(req, res, opts, cb);
    return;
  }
  if (!isSendObject(result)) {
    httpMethods(result)(req, res, opts, cb);
  } else {
    sendJson(req, res, xtend(opts, result), cb);
  }
};

const createMocker = mopts => (req, res, opts, cb) => {
  const pathname = url.parse(req.url).pathname;
  const filepath = path.resolve(
    mopts.basedir,
    mopts.locator,
    pathname.slice(mopts.rootdir.length) + '.js'
  );
  let result;
  try {
    result = require(filepath);
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND' && err.message.indexOf(filepath) !== -1) {
      mopts.router(req, res, opts, cb);
    } else {
      process.nextTick(() => cb(err));
    }
    return;
  }
  processResult(result, req, res, opts, cb);
};

const useDefaults = createMocker => mopts => {
  if (!mopts.basedir) {
    throw new Error('mopts.basedir is undefined');
  }
  const rootdir = mopts.rootdir || '/';
  const locator = mopts.locator || 'test/fixtures';
  return createMocker(xtend(mopts, { rootdir, locator }));
};

const useRoutes = createMocker => mopts => {
  if (!Array.isArray(mopts.routes)) {
    return createMocker(mopts);
  }
  const router = mopts.router || httpHashRouter();
  mopts.routes.forEach((route) => {
    const filepath = path.resolve(
      mopts.basedir,
      mopts.locator,
      route.slice(mopts.rootdir.length) + '.js'
    );
    router.set(route, (req, res, opts, cb) => {
      const result = require(filepath);
      processResult(result, req, res, opts, cb);
    });
  });
  return createMocker(xtend(mopts, { router }));
};
 
const useGenerate = createMocker => mopts => {
  const mocker = createMocker(mopts);
  if (mopts.autoGenerate !== true) {
    return mocker;
  }
  const template = mopts.template || `
module.exports = {
  statusCode: 200,
  body: 'hello world',
};
`;
  return (req, res, opts, cb) => {
    let uri = url.parse(req.url).pathname;
    if (mopts.router) {
      const route = mopts.router.hash.get(req.url);
      if (route.src != null) {
        uri = route.src;
      }
    }
    const filepath = path.join(
      mopts.basedir,
      mopts.locator,
      uri.slice(mopts.rootdir.length) + '.js'
    );
    fs.stat(filepath, (err, stats) => {
      if (!err) {
        mocker(req, res, opts, cb);
        return;
      }
      if (err.code !== 'ENOENT') {
        cb(err)
        return;
      }
      const dirname = path.dirname(filepath);
      mkdirp(dirname, (err) => {
        if (err) {
          cb(err);
          return;
        }
        fs.writeFile(filepath, template, (err) => {
          if (err) {
            cb(err);
            return;
          }
          mocker(req, res, opts, cb);
        });
      });
    });
  };
};

module.exports = useDefaults(useRoutes(useGenerate(createMocker)));
