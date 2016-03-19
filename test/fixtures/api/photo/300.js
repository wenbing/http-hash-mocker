const sendPlain = require('send-data/plain');
const sendJson = require('send-data/json');

module.exports = {
  GET: function (req, res, opts, cb) {
    sendPlain(req, res, '300 plain', cb);
  },
  POST: function (req, res, opts, cb) {
    sendJson(req, res, { foo: 'bar', method: 'POST' }, cb);
  },
};
