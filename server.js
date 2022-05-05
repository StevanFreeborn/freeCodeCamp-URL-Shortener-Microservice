require('dotenv').config();
require('mongodb');

const EXPRESS = require('express');
const CORS = require('cors');
const MONGOOSE = require('mongoose');
const BODYPARSER = require('body-parser');
const URL = require('url');
const DNS = require('dns');

const APP = EXPRESS();

// enable cors
APP.use(CORS());

// serve static files from public directory
APP.use(EXPRESS.static(`public`));

// middleware parses requests where content-type
// header is urlencoded and populates req.body
// property with parsed body. The extended option
// set to false parses using the querystring library.
APP.use(BODYPARSER.urlencoded({extended: false}));

// connect to mongodb
MONGOOSE.connect(
  process.env.MONGO_URI,
  { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
  }
);

// build url schema
const Schema = MONGOOSE.Schema;

const urlSchema = new Schema({
  original_url: {type: String, required: true},
  short_url: {type: String, required: true}
});

APP.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

APP.post('/api/shorturl/', (req, res) => {
  let url = URL.parse(req.body.url, false);

  DNS.lookup(url.hostname, {all: true} , (err, addresses) => {
    if(err || addresses.length == 0) {
      return res.json({
        error: 'invalid url'
      });
    }
    
    // TODO: Create new short url
    // TODO: Save new short url to database
    // TODO: Return new short url as json object

    res.json({message: 'here'});
  });
});

APP.get('/api/shorturl/:shortUrl', (req, res) => {
  
  let shortUrl = req.params.shortUrl;
  
  res.send(shortUrl);
});

const listener = APP.listen(process.env.PORT || 3000, () => {
    console.log('Your app is listening on port ' + listener.address().port);
});