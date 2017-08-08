/* eslint global-require: 0, no-console:0, strict:0 , prefer-template: 0*/
'use strict';
const fs = require('fs');
const url = require('url');
const path = require('path');

const httpHashRouter = require('http-hash-router');
const isSendObject = require('send-data/is-send-object');
const httpMethods = require('http-methods');
const sendJson = require('send-data/json');
const R = require('ramda');

const processResult = R.curry((result, req, res, opts, cb) => R.cond([
  [R.is(Function), r => r(req, res, opts, cb)],
  [R.complement(isSendObject), r => httpMethods(r)(req, res, opts, cb)],
  [R.T, r => sendJson(req, res, R.merge(opts, r), cb)],
])(result));

const createMocker = mopts => (req, res, opts, cb) => {
  const { basedir, locator, rootdir, router } = mopts;
  const pathname = url.parse(req.url).pathname;
  const filepath = path.resolve(basedir, locator, pathname.slice(rootdir.length) + '.js');
  R.compose(
    R.unless(
      R.isNil,
      processResult(R.__, req, res, opts, cb)
    ),
    R.tryCatch(
      require,
      R.compose(
        R.always(null),
        R.ifElse(
          R.where({
            code: R.equals('MODULE_NOT_FOUND'),
            message: R.contains(filepath),
          }),
          () => router(req, res, opts, cb),
          err => process.nextTick(() => cb(err))
        )
      )
    )
  )(filepath);
};

const useDefaults = mockerCreator => mopts => R.ifElse(
  R.compose(R.isNil, R.path(['basedir'])),
  () => { throw new Error('mopts.basedir is undefined'); },
  R.compose(mockerCreator, R.mergeDeepRight({ rootdir: '/', locator: 'test/fixtures' }))
)(mopts);

const useRoutes = mockerCreator => mopts => R.compose(
  mockerCreator,
  R.when(
    R.propSatisfies(R.is(Array), 'routes'),
    R.compose(
      R.tap(moptsR => {
        const { basedir, locator, rootdir, routes, router } = moptsR;
        routes.forEach(route => {
          const filepath = path.resolve(basedir, locator, route.slice(rootdir.length) + '.js');
          moptsR.router.set(route, (req, res, opts, cb) => {
            const result = require(filepath); // 这里是否需要 try-catch 一下？使用者自己保证 mock 文件存在？
            processResult(result, req, res, opts, cb);
          });
        });
      }),
      R.when(
        R.propSatisfies(R.isNil, 'router'),
        R.assoc('router', httpHashRouter())
      )
    )
  )
)(mopts);

module.exports = R.compose(useDefaults, useRoutes)(createMocker);
