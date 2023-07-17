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

// DATABASE CONFIG INFO -- TO DO: PUT IN ENV FILE
const config = {
    user: 'VergAdmin',
    password: process.env.PASSWORD,
    server: process.env.SERVER,
    port: process.env.DBPORT, 
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

app.post('/registerClick', async (req, res) => {
    console.log("IN REGISTER SERVER CLICK")
    console.log("VERSION: " + version + ' ; ID: ' + id)
    console.log("DATA SENT:")
    var landing = false
    if (req.body.isFirst) {
        console.log("FIRST TIME LANDING, APPENDING ID AND VERSION")
        req.body['ID'] = id
        req.body['Version'] = version
        landing = true
        delete req.body.isFirst
    }
    console.log(req.body)
    let columns = ''
    let values = ''
    for (const [key, value] of Object.entries(req.body)) {
        columns += key + ', '
        values += `'` + value + `'` + ', '
    }
    columns = columns.slice(0, -2); 
    values = values.slice(0, -2); 
    console.log(columns)
    console.log(values)

    // BEGIN DATABSAE STUFF:SENDING VERSION (R24 OR U01) AND ID TO DATABASE
    sql.connect(config, function (err) {
    
        if (err) console.log(err);

        // create Request object
        var request = new sql.Request();

        if (landing === true) {
            console.log("IN LANDING")
            // query to the database and get the records
            let queryString = 'INSERT INTO R24U01 (' + columns + ') VALUES (' + values + ')';
            console.log(queryString)
            request.query(queryString, function (err, recordset) {
                if (err) console.log(err)
                // send records as a response
                console.log("IN R24U01 TABLE:")
                console.log(recordset);
            }); 
        } else {
            console.log("NOT IN LANDING ")
            // query to the database and get the records
            let queryString = 'UPDATE R24U01 SET ' + columns + ' = ' + values + ' WHERE ID=' + `'` + id + `'`;
            console.log(queryString)
            request.query(queryString, function (err, recordset) {
                if (err) console.log(err)
                // send records as a response
                console.log("IN R24U01 TABLE:")
                console.log(recordset);
            }); 
        }
    });
    // END DATABASE STUFF
})

app.get('/:version/:id', (req, res) => {
    console.log("REQUEST PARAMS:")
    console.log(req.params)
    version = req.params.version
    id = req.params.id

    // let queryString = 'INSERT INTO R24U01 (ID, Version) VALUES (' + req.params.id + ', ' + req.params.version + ')';
    //  console.log(queryString)

    // BEGIN DATABSAE STUFF:SENDING VERSION (R24 OR U01) AND ID TO DATABASE
    // sql.connect(config, function (err) {
    
    //     if (err) console.log(err);

    //     // create Request object
    //     var request = new sql.Request();

    //     // query to the database and get the records
    //     let queryString = 'INSERT INTO R24U01 (ID, Version) VALUES (' + req.params.id + `, '` + req.params.version + `')`;
    //     console.log(queryString)
    //     request.query(queryString, function (err, recordset) {
    //         if (err) console.log(err)
    //         // send records as a response
    //         console.log("IN R24U01 TABLE:")
    //         console.log(recordset);
    //     });
    // });
    // END DATABASE STUFF

    res.render('pages/index', {id: id, version: version})
})

const EducationalComponentRouter = require('./routes/EducationalComponent')
app.use('/:version/:id/EducationalComponent', EducationalComponentRouter)

app.use(logger)
function logger(req, res, next) {
    console.log(req.originalUrl)
    next()
}

app.listen(process.env.PORT || 3000);