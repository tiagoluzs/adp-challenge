require('dotenv').config()
const https = require('https');
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const app = express()

app.use(cors())
app.use(morgan('dev'))


const port = process.env.PORT

// memory cache
let cache = {
  last: null,
  data: null,
  enabled: process.env.CACHE_ENABLED == "true",
  ttl: process.env.CACHE_TTL
}

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

  let now = new Date().getTime();
  if (cache.enabled && cache.last != null && (now - cache.last) < cache.ttl) {
    return res.json({
      data: cache.data,
      last: now,
      cached: true,
      delay: new Date().getTime() - now
    })
  }


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
          if (businesses[i].review.length > 0) {
            businesses[i].review = businesses[i].review[0]
            businesses[i].review = {
              name: businesses[i].review.user.name,
              text: businesses[i].review.text
            }
          } else {
            businesses[i].review = {
              name: "",
              text: ""
            }
          }
        }
        if (cache.enabled) {
          cache.data = businesses;
          cache.last = now;
        }

        res.json({
          data: businesses,
          last: now,
          cached: false,
          delay: new Date().getTime() - now
        });

      }).catch((error) => {
        res.status(500).json({
          error: true,
          errormsg: error
        });
      });
    }).catch((error) => {
      res.status(500).json({
        error: true,
        errormsg: error
      });
    })
})

app.listen(port, () => {
  console.log(`IceCream Service at http://localhost:${port}`)
})
