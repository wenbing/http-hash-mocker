const sendJson = require('send-data/json');

module.exports = {
  GET: function (req, res, opts, cb) {
    sendJson(req, res, { albumid: 222, }, cb);
  },
  POST: function (req, res, opts, cb) {
    sendJson(req, res, { albumid: 888, }, cb);
  }
};
