require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const urlParser = require('url');

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.urlencoded({ extended: false }));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Test endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

// In-memory database
let urlDatabase = [];
let idCounter = 1;

// Helper to validate URL format
function isValidHttpUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_) {
    return false;
  }
}

// POST /api/shorturl
app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;

  // Validate format first
  if (!isValidHttpUrl(originalUrl)) {
    return res.json({ error: 'invalid url' });
  }

  const hostname = urlParser.parse(originalUrl).hostname;

  dns.lookup(hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    const shortUrl = idCounter++;
    urlDatabase.push({ original_url: originalUrl, short_url: shortUrl });

    res.json({ original_url: originalUrl, short_url: shortUrl });
  });
});

// GET /api/shorturl/:short_url
app.get('/api/shorturl/:short_url', (req, res) => {
  const shortUrl = parseInt(req.params.short_url);
  const entry = urlDatabase.find(item => item.short_url === shortUrl);

  if (entry) {
    res.redirect(entry.original_url);
  } else {
    res.status(404).json({ error: 'No short URL found for given input' });
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});