const express = require('express')
const router = express.Router()
var sql = require("mssql");

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

let buttons = [
    {
        url: 'Introduction',
        text: "Introduction"
    },
    {
        url: '1',
        text: "What are research studies?"
    },
    {
        url: '2',
        text: "Why consider participating?"
    },
    {
        url: '3',
        text: "Are research studies safe?"
    },
    {
        url: '4',
        text: "How to participate in research and where to start?"
    }
]

router.get('/Introduction', getVH, updateDatabase, (req, res) => {
    console.log("IN EDUCATIONAL COMPONENT ROUTER")
    console.log("VHType is: " + vh)
    res.render("pages/EducationalComponent/introduction", {version: version, id: id, vh: vh, buttons: buttons, url: 'Introduction'})
})

router.get('/1', updateDatabase, (req, res) => {
    console.log("IN EDUCATIONAL COMPONENT ROUTER")
    console.log("VHType is: " + vh)
    res.render("pages/EducationalComponent/1", {version: version, id: id, vh: vh, buttons: buttons, url: '1'})
})

router.get('/2', updateDatabase, (req, res) => {
    console.log("IN EDUCATIONAL COMPONENT ROUTER")
    console.log("VHType is: " + vh)
    res.render("pages/EducationalComponent/2", {version: version, id: id, vh: vh, buttons: buttons, url: '2'})
})

router.get('/3', updateDatabase, (req, res) => {
    console.log("IN EDUCATIONAL COMPONENT ROUTER")
    console.log("VHType is: " + vh)
    res.render("pages/EducationalComponent/3", {version: version, id: id, vh: vh, buttons: buttons, url: '3'})
})

router.get('/4', updateDatabase, (req, res) => {
    console.log("IN EDUCATIONAL COMPONENT ROUTER")
    console.log("VHType is: " + vh)
    res.render("pages/EducationalComponent/4", {version: version, id: id, vh: vh, buttons: buttons, url: '4'})
})

function getVH(req, res, next) {
    console.log("IN MIDDLEWARE OF EDUCATIONAL COMPONENT - REQUEST PARAMS:")
    id = req.id
    version = req.version
    vh = req.vh
    next()
}

function updateDatabase(req, res, next) {
    console.log("IN UPDATE DATABASE")
    console.log(req.url)
    let dbEntry = req.url.slice(1)
    console.log(dbEntry)
    // BEGIN DATABSAE STUFF:SENDING VERSION (R24 OR U01) AND ID TO DATABASE
    sql.connect(config, function (err) {

        if (err) console.log(err);

        // create Request object
        var request = new sql.Request();

        let queryString = 'UPDATE R24U01 SET Educational_' + dbEntry + `='clicked' WHERE ID=` + `'` + id + `' AND VERSION='` + version + `'`;
        console.log(queryString)
        request.query(queryString, function (err, recordset) {
            if (err) console.log(err)
            // send records as a response
            console.log("UPDATED! IN R24U01 TABLE:")
            console.log(recordset);
        }); 
    
    });
    // END DATABASE STUFF

    next();
}

module.exports = router