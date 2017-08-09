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

const processResult = router => R.curry((req, res, opts, cb) => R.cond([
  [R.is(Function), r => r(req, res, opts, cb)],
  [R.complement(isSendObject), r => httpMethods(r)(req, res, opts, cb)],
  [R.T, r => sendJson(req, res, R.merge(opts, r), cb)],
])(router));

const handler = R.curry((req, res, opts, cb) => R.compose(
  R.unless(R.isNil, router => processResult(router)(req, res, opts, cb)),
  filepath => R.tryCatch(
    require,
    R.compose(
      R.always(null),
      R.ifElse(
        R.where({ code: R.equals('MODULE_NOT_FOUND'), message: R.contains(filepath) }),
        () => opts.router(req, res, opts, cb),
        err => process.nextTick(() => cb(err))
      )
    )
  )(filepath),
  pathname => path.resolve(opts.basedir, opts.locator, pathname + '.js'),
  R.slice(opts.rootdir.length, Infinity),
  R.compose(R.path(['pathname']), url.parse, R.path(['url']))
)(req));

const useDefaults = router => R.curry((req, res, opts, cb) => R.ifElse(
  R.where({ basedir: R.isNil }),
  () => { throw new Error('mopts.basedir is undefined'); },
  R.compose(
    router(req, res, R.__, cb),
    R.mergeDeepRight({ rootdir: '/', locator: 'test/fixtures' })
  )
)(opts));

const useRoutes = router => R.curry((req, res, opts, cb) => R.compose(
  router(req, res, R.__, cb),
  R.when(
    R.where({ routes: R.is(Array) }),
    R.compose(
      R.tap(optsR => {
        const { basedir, locator, rootdir, routes } = optsR;
        routes.forEach(route => {
          const filepath = path.resolve(basedir, locator, route.slice(rootdir.length) + '.js');
          optsR.router.set(route, (reqIn, resIn, optsIn, cbIn) => {
            const routerIn = require(filepath);
            processResult(routerIn)(reqIn, resIn, optsIn, cbIn);
          });
        });
      }),
      R.when(R.where({ router: R.isNil }), R.assoc('router', httpHashRouter()))
    )
  )
)(opts));

module.exports = R.compose(useDefaults, useRoutes)(handler);
