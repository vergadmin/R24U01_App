const express = require('express')
const router = express.Router()
var sql = require("mssql");

var id = ''
var vh = ''
var type = ''

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

router.get('/Introduction', getInfo, updateDatabase, (req, res) => {
    res.render("pages/type/EducationalComponent/introduction", {id: id, vh: vh, type: type, buttons: buttons, url: 'Introduction'})
})

router.get('/1', updateDatabase, (req, res) => {
    res.render("pages/type/EducationalComponent/1", {id: id, vh: vh, type: type, buttons: buttons, url: '1'})
})

router.get('/2', updateDatabase, (req, res) => {
    res.render("pages/type/EducationalComponent/2", {id: id, vh: vh, type: type, buttons: buttons, url: '2'})
})

router.get('/3', updateDatabase, (req, res) => {
    res.render("pages/type/EducationalComponent/3", { id: id, vh: vh, type: type, buttons: buttons, url: '3'})
})

router.get('/4', updateDatabase, (req, res) => {
    res.render("pages/type/EducationalComponent/4", {id: id, vh: vh, type: type, buttons: buttons, url: '4'})
})

function getInfo(req, res, next) {
    // console.log("IN MIDDLEWARE OF EDUCATIONAL COMPONENT - REQUEST PARAMS:")
    id = req.id
    vh = req.vh
    type = req.type
    userInfo = req.userInfo
    // console.log("type is " + type);
    next()
}

function updateDatabase(req, res, next) {
    // console.log("IN UPDATE DATABASE")
    // console.log(req.url)
    let dbEntry = req.url.slice(1)
    // console.log(dbEntry)
    userInfo = req.userInfo;
    // BEGIN DATABSAE STUFF:SENDING VERSION (R24 OR U01) AND ID TO DATABASE
    sql.connect(config, function (err) {

        if (err) console.log(err);

        // create Request object
        var request = new sql.Request();

        // let queryString = 'UPDATE R24 SET Educational_' + dbEntry + `='clicked' WHERE ID=` + `'` + userInfo.ID + `'`; // UNCOMMENT:`'AND TYPE ='` + type + `'`;
        let queryString = `
        UPDATE R24
        SET Educational_` + dbEntry + `= 'clicked'
        WHERE ID = '` + userInfo.ID + `' 
        AND VisitNum = '` + userInfo.visitNum + `'`;

        // console.log(queryString)
        request.query(queryString, function (err, recordset) {
            if (err) console.log(err)
            // send records as a response
            /// console.log("UPDATED! IN R24U01 TABLE:")
            // console.log(recordset);
        }); 
        // res.send("Updated.");
    
    });
    // END DATABASE STUFF

    next();
}

module.exports = router