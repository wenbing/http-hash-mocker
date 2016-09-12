const mockjs = require('mockjs');
const data = mockjs.mock({
  'total|1-1000': 1,
  'items|2': [
    {
      'id|+1': 1,
    }
  ]
});

module.exports = {
  statusCode: 200,
  body: {
    data: data
  }
}