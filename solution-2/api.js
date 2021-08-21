require('dotenv').config()
const https = require('https');
const express = require('express')
var cors = require('cors')
const app = express()
app.use(cors())

const port = 3000


let dataFetch = (endpoint) => {
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

app.get('/icecream', (req, res) => {


  dataFetch('https://api.yelp.com/v3/businesses/search?location=Alpharetta, GA&radius=5000&limit=5&sort_by=rating&categories=icecream')
    .then((result) => {
      let json = JSON.parse(result)
      let businesses = json.businesses.map(b => {
        return {
          id: b.id,
          alias: b.alias,
          image_url: b.image_url,
          name: b.name,
          address: b.location.display_address.join(' - '),
          url: b.url
        }
      })

      let promsReviews = businesses.map(b => {
        return dataFetch('https://api.yelp.com/v3/businesses/' + b.id + '/reviews')
      })

      Promise.all(promsReviews).then((reviews) => {
        for (let i = 0; i < reviews.length; i++) {
          businesses[i].review = JSON.parse(reviews[i]).reviews
          if (businesses[i].review.length > 1) {
            businesses[i].review = businesses[i].review[0]
            businesses[i].review = {
              name: businesses[i].review.user.name,
              text: businesses[i].review.text
            }
          }
        }

        res.json(businesses);

      }).catch((error) => {
        res.status(500).json({error: true, errormsg: error});
      });
    }).catch((error) => {
      res.status(500).json({error: true, errormsg: error});
    })


})

app.listen(port, () => {
  console.log(`IceCream Service at http://localhost:${port}`)
})
