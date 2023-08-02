const express = require('express')
const app = express()
const io = require('socket.io-client');

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

app.get('/faqResponse', async (req, res) => {
    let tag = req.body.fulfillmentInfo.tag;
    let query = req.body.text;

    console.log("Query is");
    console.log(query);

    console.log('A new request came...');
    console.log(tag);
    console.log(new Date())

    const socket = io('http://127.0.0.1:6000');
    
    socket.on('connect', () => {
      console.log('Connected to Python Socket.IO server');
    
      const data = 'What is a clinical trial?';
      socket.emit('my_event', data);
    });
    
    socket.on('my_response', (data) => {
      console.log('Response from Python Socket.IO server:', data);
    });
    console.log("END");
    /*
    const options = {
        hostname: 'localhost',
        port: 6000, // Replace with the same port used in the Python script
        path: '/data',
        method: 'GET'
      };

    const reqs = http.request(options, (ress) => {
        let data = '';
        ress.on('data', (chunk) => {
            data += chunk;
        });

        ress.on('end', () => {
            console.log('Response from Python Server:', data);
        });
    });
    
    reqs.on('error', (err) => {
        console.error('Error connecting to Python Server:', err);
    });

    reqs.end();
    /*
    const pythonProcess = spawn('python', ['FaqResponse.py'])

    const http = require('http')
    const server = http.createServer((req, res) => {
        functionName = 'greeting';
        pythonProcess.stdin.write(`${functionName}`);

        res.end('Request received');
    });

    if (tag === 'sampleResponse') {
        let result = await callPythonScript(query);
        console.log(result.status)
        console.log(result.response)
        if (result.status == 1) {
            console.log("We in it!");
            res.send(formatResponseForDialogflow(
                [
                    result.response
                ],
                '',
                '',
                ''
            ));
        } else {
            res.send(getErrorMessage());
        }

    } else {
        res.send(
            formatResponseForDialogflow(
                [
                    'This is from the webhook.',
                    'There is no tag set for this request.'
                ],
                '',
                '',
                ''
            )
        );
    }
    */

})

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

app.get('/:version/:id', checkUser, (req, res) => {
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

function checkUser(req, res, next) {
    console.log("IN MIDDLEWARE - REQUEST PARAMS:")
    console.log(req.params)
    version = req.params.version
    id = req.params.id

    sql.connect(config, function (err) {
        var request = new sql.Request();
        let queryString0 = `SELECT * FROM R24U01 WHERE ID='` + id + `' AND VERSION='` + version + `'` ;
        console.log(queryString0)
        request.query(queryString0, function (err, recordset) {
            if (err) console.log(err)
            // send records as a response
            console.log("RECORD SET:")
            console.log(recordset.recordset)
            if (recordset.recordsets.length !== 0) {
                console.log("ID EXISTS! INCREMENTING VISIT COUNT")
                let queryString1 = `UPDATE R24U01 SET VisitCount = VisitCount + 1 WHERE ID='` + id + `' AND VERSION='` + version + `'`
                console.log(queryString1)
                request.query(queryString1, function (err, recordset) {
                    if (err) console.log(err)
                    // send records as a response
                    console.log("INCREMENTED VISIT COUNT:")
                    console.log(recordset)
                })
            } 

            if (recordset.recordset.length === 0) {
                console.log("ID DOES NOT EXIST. ADDING TO DATABASE")
                let queryString2 =  `INSERT INTO R24U01 (ID, Version, VisitCount) VALUES ('` + id + `','` + version + `',0)`;
                console.log(queryString2)
                request.query(queryString2, function (err, recordset) {
                    if (err) console.log(err)
                    // send records as a response
                    console.log("ADDED TO DATABSE:")
                    console.log(recordset)
                })
            } 

        }); 
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

app.listen(process.env.PORT || 3000);