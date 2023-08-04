const express = require('express')
const app = express()

require('dotenv').config()
console.log(process.env)

app.set('view engine', 'ejs')
app.use(express.static(__dirname + '/public'));
app.use(express.json())
var sql = require("mssql");
app.use(logger)

var version = ''
var id = null
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

app.post('/updateDatabase', async (req, res) => {
    console.log("IN UPDATE DATABASE")
    console.log("VERSION: " + version + ' ; ID: ' + id)
    console.log("DATA SENT:")
    let setList = ''
    for (const [key, value] of Object.entries(req.body)) {
        if (key==="VHType") {
            vh = value
        }
        setList += key + `='` + value + `', `
    }
    setList = setList.slice(0, -2); 
    console.log(setList)

    // BEGIN DATABSAE STUFF:SENDING VERSION (R24 OR U01) AND ID TO DATABASE
    sql.connect(config, function (err) {
    
        if (err) console.log(err);

        // create Request object
        var request = new sql.Request();

        let queryString = 'UPDATE R24U01 SET ' + setList + ' WHERE ID=' + `'` + id + `' AND VERSION='` + version + `'`;
        console.log(queryString)
        request.query(queryString, function (err, recordset) {
            if (err) console.log(err)
            // send records as a response
            console.log("UPDATED! IN R24U01 TABLE:")
            console.log(recordset);
        }); 
    
    });
    // END DATABASE STUFF
})

app.get('/:version/:id/:type', addVisitToDatabase, (req, res) => {
    console.log("REQUEST PARAMS:")
    console.log(req.params)
    version = req.params.version
    id = req.params.id
    type = req.params.type
    if (type == "vh")
        res.render('pages/index', {id: id, version: version, type: type})
    else if (type == "text")
        res.render('pages/type/EducationalComponentText/introduction', {id: id, version: version, type: type})
})

app.get('/:version/:id/:type/Discover', (req, res) => {
    console.log("REQUEST PARAMS:")
    console.log(req.params)
    version = req.params.version
    id = req.params.id
    type = req.params.type

    sql.connect(config, function (err) {

        if (err) console.log(err);

        // create Request object
        var request = new sql.Request();

        let queryString = 'UPDATE R24U01 SET Discover' + `='clicked' WHERE ID=` + `'` + id + `' AND VERSION='` + version + `'`;
        console.log(queryString)
        request.query(queryString, function (err, recordset) {
            if (err) console.log(err)
            // send records as a response
            console.log("UPDATED! IN R24U01 TABLE:")
            console.log(recordset);
        }); 
    
    });

    res.render('pages/discover', {id: id, version: version, type: type})
})

app.use(logger)

function logger(req, res, next) {
    console.log(req.originalUrl)
    next()
}

function addVisitToDatabase(req, res, next) {
    console.log("IN MIDDLEWARE - REQUEST PARAMS:")
    console.log(req.params)
    version = req.params.version
    id = req.params.id
    type = req.params.type

    sql.connect(config, function (err) {
        var request = new sql.Request();
        console.log("ADDING NEW ROW TO DATABASE FOR THIS VISIT")
        let queryString =  `INSERT INTO R24U01 (ID, Version) VALUES ('` + id + `','` + version + `')`;
        console.log(queryString)
        request.query(queryString, function (err, recordset) {
            if (err) console.log(err)
            // send records as a response
            console.log("ADDED TO DATABSE:")
            console.log(recordset)
        })
    })
    next()
}

// Virtual Human Types
const EducationalComponentRouter = require('./routes/EducationalComponent')
app.use('/:version/:id/:type/EducationalComponent', function(req,res,next){
    req.id = id;
    req.version = version
    req.vh = vh
    req.type = type
    next();
}, EducationalComponentRouter)

// Text Types
const EducationalComponentTextRouter = require('./routes/EducationalComponentText')
app.use('/:version/:id/:type/EducationalComponentText', function(req,res,next){
    req.id = id;
    req.version = version
    req.vh = vh
    req.type = type
    next();
}, EducationalComponentTextRouter)

const StudySearchRouter = require('./routes/StudySearch')
app.use('/:version/:id/:type/StudySearch', function(req,res,next){
    req.id = id;
    req.version = version
    req.vh = vh
    req.type = type
    next();
}, StudySearchRouter)

// TODO: For Chris
// 1. Add "type" (text or virtual human) to the SQL Table
// 2. Add "type" to all the SQL insertions necessary inside the accesses to R24U01 Database


app.listen(process.env.PORT || 3000);