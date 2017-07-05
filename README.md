http-hash-mocker
====

http-hash-mocker create request handler

```js
import { HttpRequest, HttpResponse } from "node.http"

type RoutePattern : String

type MockerOpts : {
  basedir: String,
  rootdir?: String = '/', // mocking urls' public path
  locator?: String = 'test/fixtures, // where to find handle-mock files, will combine with basedir
  routes?: Array<RoutePattern>,
  autoGenerate?: Boolean, // whether it will generate handle-mock files if the url-correspond file doesn't exist
  template?: String = `
    module.exports = {
      statusCode: 200,
      body: 'hello world',
    };
   `, // uses to generate handling files
}

type Router : (
  req: HttpReqest,
  res: HttpResponse,
  opts: Object,
  cb: Callback<Error, void>
) => void
type Mocker : { router: HttpHashRouter } & Router

http-hash-mocker : (mopts: MockerOpts) => Mocker
```

### Example

```js
const http = require('http');
const path = require('path');
const sendError = require('send-data/error');

const mocker = require('http-hash-mocker')({
  basedir: path.resolve(__dirname, '../')
  routes: [
    '/api/photo/:photoid' // dones't affect mock result
  ],
  autoGenerate: true,
  template: `
module.exports = {
  statusCode: 200,
  body: 'hello data template',
};
`,
});

const server = http.createServer(function (req, res) {
  mocker(req, res, {}, function (err) {
    if (err) {
      if (!res.finished) {
        sendError(req, res, { body: err });
      }
    }
  });
});
```

You can export several types in your handle-mock files:

1. JSON Data

```js
// test/fixtures/api/photo/200.js
// correspond to url: /api/photo/200

module.exports = {
  statusCode: 200,
  body: 'OK',
}; // mocker will use sed-data/json to send this object
```

2. Request Handler

```js
// test/fixtures/api/photo/:photoid.js
// correspond to url: /api/photo/:photoid

const sendPlain = require('send-data/plain');

module.exports = function (req, res, opts, cb) {
  sendPlain(req, res, 'Nine Nine Nine' + opts.params.photoid, cb);
};
```

3. HTTP Verb Object

```js
// test/fixtures/api/photo/verbs.js
// correspond to: GET /api/photo/verbs

module.exports = {
  GET(req, res) {
    res.end(req.headers['content-type']);
  }
}; // handled by 'http-verb'
```

you mock it.
