const sendPlain = require('send-data/plain');

module.exports = function (req, res, opts, cb) {
  sendPlain(req, res, 'Nine Nine Nine', cb);
};
