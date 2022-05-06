require('dotenv').config();
require('mongodb');

const EXPRESS = require('express');
const CORS = require('cors');
const MONGOOSE = require('mongoose');
const BODYPARSER = require('body-parser');
const URL = require('url');
const DNS = require('dns');
const { nanoid } = require('nanoid');

const APP = EXPRESS();

// enable cors
APP.use(CORS());

// serve static files from public directory
APP.use(EXPRESS.static(`public`));

// middleware parses requests where content-type
// header is urlencoded and populates req.body
// property with parsed body. The extended option
// set to false means parsing using the querystring library.
APP.use(BODYPARSER.urlencoded({extended: false}));

// connect to mongodb
MONGOOSE.connect(
  process.env.MONGO_URI,
  { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
  }
)
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.log(err));

MONGOOSE.connection.on('error', err => console.log(err));

// build url schema
const SCHEMA = MONGOOSE.Schema;

let urlSchema = new SCHEMA({
  original_url: {type: String, required: true},
  short_url: {type: String, required: true}
});

// build ShortUrl model using url schema
let ShortUrl = MONGOOSE.model('shortUrl', urlSchema); 

// get request to root directory serves static index.html file.
APP.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

// post request that validates url
// and if valide creates a new ShortUrl
APP.post('/api/shorturl/', (req, res) => {
  let url = URL.parse(req.body.url, false);

  DNS.lookup(url.hostname, {all: true} , (err, addresses) => {
    
    if(err || addresses.length == 0) {
      return res.json({
        error: 'invalid url'
      });

    }
    
    // Create new short url
    // use Nano ID library to create short_url
    // id of length 12 characters will take ~1,000 years
    // to reach a 1% probability of collision per
    // calculator: https://zelark.github.io/nano-id-cc/
    let shortUrl = new ShortUrl({
      original_url: req.body.url,
      short_url: nanoid(12)
    });

    //Save new short url to database
    shortUrl.save((err) => {
      
      if(err) {
        console.log(err);
        return res.json({
          error: 'Could not create shortened url.'
        });

      }

      // Return new short url as json
      return res.json(shortUrl);
    });
  });
});

// get request that will attempt to find the
// corresponding ShortUrl in the database for
// the value passed. If found will redirect user
// to original_url.
APP.get('/api/shorturl/:shortUrl', (req, res) => {
  
  // get shortUrl value from path
  let shortUrl = req.params.shortUrl;
  
  // attempt to find the corresponding short url
  // in database. if found redirect user to corresponding
  // original_url. if not found return error message.
  ShortUrl.findOne({short_url: shortUrl}, (err, document) => {
    
    if(err) {
      console.log(err);
      return res.json({
        error: 'There was an issue getting the shortened url.'
      })
    }

    if(document == null) {
      return res.json({
        error: 'Could not find shortened url.'
      })
    }

    return res.redirect(document.original_url);
  });
});

const listener = APP.listen(process.env.PORT || 3000, () => {
    console.log('Your app is listening on port ' + listener.address().port);
});