http-hash-mocker
====

http-hash-mocker using http-hash-router to mock backend server response (request handler).


```js
import { HttpRequest, HttpResponse } from "node.http"

type RoutePattern : String

type MockerOpts : {
  basedir: String,
  rootdir?: String,
  locator?: String,
  routes?: Array<RoutePattern>,
}

type Router : (
  req: HttpReqest,
  res: HttpResponse,
  opts: Object,
  cb: Callback<Error, void>
) => void
type Mocker : { router: HttpHashRouter } & Router

http-hash-mocker : Mocker
```

```js
const http = require('http');
const path = require('path');
const sendError = require('send-data/error');
const router = require('http-hash-mocker');

const initOpts = {
  basedir: path.resolve(__dirname, '../'),
  // rootdir: '/',
  // locator: 'test/fixtures',
  routes: [
    '/api/photo/:photoid',
  ],
};

const server = http.createServer(function (req, res) {
  router(req, res, initOpts, function (err) {
    if (err) {
      if (!res.finished) {
        sendError(req, res, { body: err });
      }
    }
  });
});
```

test/fixtures/api/photo/200.js

```js
module.exports = {
  statusCode: 200,
  body: 'OK',
};
```

test/fixtures/api/photo/:photoid.js

```js
const sendPlain = require('send-data/plain');

module.exports = function (req, res, opts, cb) {
  sendPlain(req, res, 'Nine Nine Nine', cb);
};
```

you mock it.
