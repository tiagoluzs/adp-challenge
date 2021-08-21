require('dotenv').config()
const chalk = require('chalk');
const https = require('https');

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

dataFetch('https://api.yelp.com/v3/businesses/search?location=Alpharetta, GA&radius=5000&limit=5&sort_by=rating&categories=icecream')
  .then((result) => {
    let json = JSON.parse(result)
    let businesses = json.businesses.map(b => {
      return {
        id: b.id,
        alias: b.alias,
        image_url: b.image_url,
        name: b.name,
        address: b.location.display_address.join(' - ')
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

      console.log('\033[2J');
      console.log(chalk.white.bgRed(" ADP ") + " " + chalk.red.bgWhite(" Developer Code Challenge "))
      console.log("Top five ice cream shops in Alpharetta" + "\n")

      businesses.forEach((item, i) => {

        console.log(chalk.white.bgBlue((i + 1) + " - " + item.name))
        console.log(item.address)
        console.log("Review: " + item.review.text + "(" + item.review.name + ")")
        console.log("\n")

      });



    }).catch((error) => {
      console.error("ERROR: Can't fetch reviews data", error)
    });
  }).catch((error) => {
    console.error("ERROR: Can't fetch shop data", error)
  })
