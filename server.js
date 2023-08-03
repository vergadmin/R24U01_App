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

app.get('/:version/:id', addVisitToDatabase, (req, res) => {
    console.log("REQUEST PARAMS:")
    console.log(req.params)
    version = req.params.version
    id = req.params.id
    res.render('pages/index', {id: id, version: version})
})

app.get('/:version/:id/Discover', (req, res) => {
    console.log("REQUEST PARAMS:")
    console.log(req.params)
    version = req.params.version
    id = req.params.id

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

    res.render('pages/discover', {id: id, version: version})
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

const EducationalComponentRouter = require('./routes/EducationalComponent')
app.use('/:version/:id/EducationalComponent', function(req,res,next){
    req.id = id;
    req.version = version
    req.vh = vh
    next();
}, EducationalComponentRouter)

const StudySearchRouter = require('./routes/StudySearch')
app.use('/:version/:id/StudySearch', function(req,res,next){
    req.id = id;
    req.version = version
    req.vh = vh
    next();
}, StudySearchRouter)

app.listen(process.env.PORT || 3000);