module.exports = (app) => {
  const https = require('https');

  return {
    fetch: (endpoint) => {
      return new Promise((resolve, reject) => {
        let options = {
          headers: {
            'Authorization': "Bearer " + process.env.API_KEY,
          }
        }
        let data = "";
        https.get(endpoint, options, (res) => {
          if (res.statusCode != 200) {
            reject();
            return
          }
          res.on('data', (d) => {
            data += d;
          });
          res.on('end', () => {
            resolve(data);
          })
        }).on('error', (e) => {
          reject(e);
        });
      })
    }
  }
};
