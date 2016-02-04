http-hash-mocker
====

http-hash-mocker server

```js
const http = require('http');
const path = require('path');
const sendError = require('send-data/error');

const server = http.createServer(function (req, res) {
  mocker([
    '/api/photo/:photoid'
  ], {
    basedir: path.resolve(__dirname, '../')
  })(req, res, {}, function (err) {
    if (err) {
      if (!res.finished) {
        sendError(req, res, { body: err });
      }
    }
  });
});
```

test/fixtures/api/photo/:photoid.js

```js
const sendPlain = require('send-data/plain');

module.exports = function (req, res, opts, cb) {
  sendPlain(req, res, 'Nine Nine Nine', cb);
};
```

you mock it.
