const express = require('express')
const router = express.Router()
var bodyParser = require('body-parser')
var sql = require("mssql");

var urlencodedParser = bodyParser.urlencoded({ extended: false })

var id = ''
var version = ''
var vh = ''

const config = {
    user: 'VergAdmin',
    password: process.env.PASSWORD,
    server: process.env.SERVER,
    port: parseInt(process.env.DBPORT, 10), 
    database: process.env.DATABASE,
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    },
    options: {
      encrypt: true, // for azure
      trustServerCertificate: true // change to true for local dev / self-signed certs
    }
}

router.get('/Background', getInfo, (req, res) => {
    console.log("IN STUDY SEARCH ROUTER")
    console.log("VHType is: " + vh)
    res.render("pages/StudySearch/background", {version: version, id: id, vh: vh})
})

router.get('/Preferences', (req, res) => {
  console.log("IN STUDY SEARCH ROUTER")
  console.log("VHType is: " + vh)
  res.render("pages/StudySearch/preferences", {version: version, id: id, vh: vh})
})

router.get('/Registries', (req, res) => {
  console.log("IN STUDY SEARCH ROUTER")
  console.log("VHType is: " + vh)
  res.render("pages/StudySearch/registries", {version: version, id: id, vh: vh})
})

router.get('/Results', (req, res) => {
  console.log("IN STUDY SEARCH ROUTER")
  console.log("VHType is: " + vh)
  res.render("pages/StudySearch/results", {version: version, id: id, vh: vh})
})



function getInfo(req, res, next) {
    console.log("IN MIDDLEWARE OF EDUCATIONAL COMPONENT - REQUEST PARAMS:")
    id = req.id
    version = req.version
    vh = req.vh
    next()
}

module.exports = router