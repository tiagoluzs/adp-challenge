require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const app = express()
const consign = require('consign')

app.use(cors())
app.use(morgan('dev'))


const port = process.env.PORT

// memory cache
app.cache_local = {
  last: null,
  data: null,
  enabled: process.env.CACHE_ENABLED == "true",
  ttl: process.env.CACHE_TTL
}



consign().
 include('modules').

 then('controllers').
 then('routes').
  into(app);

app.listen(port, () => {
  console.log(`IceCream Service at http://localhost:${port}`)
})
