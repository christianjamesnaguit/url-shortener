require("dotenv").config()
const express = require("express")
const { MongoClient } = require("mongodb")
const dns = require("dns")
const urlParser = require("url")

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const mongoUrl = process.env.MONGODB_URI || "mongodb://localhost:27017/shortener"
const client = new MongoClient(mongoUrl)
let urls

async function initDb() {
  await client.connect()
  const db = client.db("shortener")
  urls = db.collection("urls")
}
initDb()

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html")
})

app.post("/api/shorturl", async (req, res) => {
  let origUrl = req.body.url
  let parsedUrl = urlParser.parse(origUrl)

  if (!parsedUrl.hostname || !/^https?:/.test(parsedUrl.protocol)) {
    return res.json({ error: "invalid url" })
  }

  dns.lookup(parsedUrl.hostname, async (err) => {
    if (err) return res.json({ error: "invalid url" })

    let count = await urls.countDocuments()
    let doc = { original_url: origUrl, short_url: count + 1 }
    await urls.insertOne(doc)

    res.json({ original_url: origUrl, short_url: count + 1 })
  })
})

app.get("/api/shorturl/:id", async (req, res) => {
  let id = parseInt(req.params.id)
  let doc = await urls.findOne({ short_url: id })

  if (!doc) return res.json({ error: "No short URL found" })
  res.redirect(doc.original_url)
})

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
