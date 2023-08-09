const express = require('express')
const session = require('express-session');

const app = express()
const CryptoJS = require("crypto-js");

const Geonames  = require('geonames.js');
require('dotenv').config()
// console.log(process.env)

app.set('view engine', 'ejs')
app.use(express.static(__dirname + '/public'));
app.use(express.json())
var sql = require("mssql");

var vh = ''
var type = ''
var visitNum = -1;

const geonames = Geonames({
    username: process.env.GEONAMES_USER,
    lan: 'en',
    encoding: 'JSON'
  });


// Modify based on Miriam/Emma's Qualtrics:
const orderOfInfo =  ["ID", "Gender", "Age", "State", "Race", "City", "HV", "Cond", "Pref"];

var userInfo = []

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

app.use(session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: true
}))

app.post('/updateDatabase', async (req, res) => {
    let setList = ''
    for (const [key, value] of Object.entries(req.body)) {
        if (key==="VHType") {
            vh = value
        }
        setList += key + `='` + value + `', `
    }
    setList = setList.slice(0, -2); 
    console.log(setList);

    // BEGIN DATABSAE STUFF:SENDING VERSION (R24 OR U01) AND ID TO DATABASE
    sql.connect(config, function (err) {
    
        if (err) console.log(err);

        // create Request object
        var request = new sql.Request();

        let queryString = `
        UPDATE R24
        SET ` + setList + 
        ` WHERE ID = '` + userInfo.ID + `' 
        AND VisitNum = '` + userInfo.visitNum + `'`;
        request.query(queryString, function (err, recordset) {
            if (err) console.log(err) 

        }); 
    
    });
    // END DATABASE STUFF
})


app.get('/:id/:type', extractInformation, setVHType, checkPreviousVisit, addVisitToDatabase, (req, res) => {
    id = req.params.id
    type = req.params.type
    if (type == "vh") 
        res.render('pages/index', {id: id, type: type})
    else if (type == "text")
        // vh = 'text';
        res.render('pages/indexText', {id: id, type: type})
})


app.get('/:id/:type/Discover', (req, res) => {
    id = req.params.id
    type = req.params.type

    sql.connect(config, function (err) {

        if (err) console.log(err);

        // create Request object
        var request = new sql.Request();

        let queryString = `
        UPDATE R24
        SET Discover = 'clicked'
        WHERE ID = '` + userInfo.ID + `' 
        AND VisitNum = '` + userInfo.visitNum + `'`;
        
        console.log(queryString)
        request.query(queryString, function (err, recordset) {
            if (err) console.log(err)
            // send records as a response
            console.log("UPDATED! IN R24 TABLE:")
            console.log(recordset);
        }); 
    
    });

    res.render('pages/discover', {id: id, type: type})
})

function checkPreviousVisit(req, res, next) {
    if (req.session.visitedIndex) {
        next();
        return;
    }
    var visitN = -1;
    sql.connect(config, function (err) {
        var request = new sql.Request();
        
        // Query Check for Existing Entry In Table
        let checkString = `
        SELECT VisitNum FROM R24
        WHERE ID = '` + userInfo.ID + `'
        AND DateTime = (
                SELECT max(DateTime)
                FROM R24
                WHERE ID = '` + userInfo.ID + `' 
        )`
        request.query(checkString, function(err, recordset) {
            if (err) console.log(err);
            console.log("HERE")
            console.log(recordset.recordset);
            console.log(recordset.recordset.length);
            if (recordset.recordset.length === 0) {
                visitN = 0;
            }
            else {
                visitN = recordset.recordset[0].VisitNum + 1;
            }
            visitNum = visitN;
            userInfo['visitNum'] = visitNum;
            next();
        })
    })

}

function addVisitToDatabase(req, res, next) {
    // After first time, we mark visitedIndex as true, and then we don't want to do it again.
    if (!req.session.visitedIndex) {
        req.session.visitedIndex = true;
    }
    else {
        next();
        return;
    }
    id = req.params.id
    type = req.params.type
    sql.connect(config, function (err) {
        var request = new sql.Request();
        let queryString = `INSERT INTO R24 (ID, VisitNum, VHType) VALUES ('` + userInfo.ID + `',` + userInfo.visitNum + `,'` + userInfo.VHType + `')`;
        console.log(queryString);
        request.query(queryString, function (err, recordset) {
            if (err) console.log(err)
        })
    })
    next()
}


function setVHType(req, res, next) {
    if (req.session.visitedIndex) {
        next();
        return;
    }
    if (userInfo.Pref ===  'Text') {
        userInfo['VHType'] = 'text';
    }
    else {
        // Change Black/White to contains Black/White potentially (based on answers for Survey Item)
        if (userInfo.Gender === 'Female' && userInfo.Race ==='Black') {
            userInfo['VHType'] = 'bf'
        }
        else if (userInfo.Gender === 'Male' && userInfo.Race ==='Black') {
            userInfo['VHType'] = 'bm'
        }
        else if (userInfo.Gender === 'Female' && userInfo.Race ==='White') {
            userInfo['VHType'] = 'wf'
        }
        else if (userInfo.Gender === 'Male' && userInfo.Race ==='White') {
            userInfo['VHType'] = 'wm'
        } else {
            userInfo['VHType'] = 'bf'
        }
    }
    next()
}
app.post('/:id/:type/RetrieveCities', (req, res) => {
    // console.log("REQUEST PARAMS:")
    // console.log(req.params)
    id = req.params.id
    type = req.params.type
    let state = (Object.entries(req.body)[0][1])
    retrieveCities(state).then((result) => {
        res.json(result);    
    }).catch((error) => {
        console.error('Error:', error);
        res.status(500).json({error:'Failed to wait for promise.'});
    });
});

async function retrieveCities(state) {
    try {
      const resp = await geonames.search({
        q: state,
        style: 'SHORT',
        country: 'US',
        cities: 'cities500'
      }); //get continents
  
      // console.log(resp.geonames);
      return resp.geonames;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

function extractInformation(req, res, next) {
    if (req.session.visitedIndex) {
        next();
        return;
    }
    // fields is an array of objects formatted as such...
    // {"ID" : id, "Gender" : gender, ... "Pref" : video}
    var id = req.params.id;
    var bytes = CryptoJS.AES.decrypt(id, process.env.DECRYPTION_KEY);
    var fixedID = id.replaceAll("-","/");
    var bytes = CryptoJS.AES.decrypt(fixedID, process.env.DECRYPTION_KEY);
    var info = bytes.toString(CryptoJS.enc.Utf8);
    var fields = [];

    var numberOfStrings = 0;
    var previousLocation = 0
    while (true) {
        // Find "_" -- 3 cases.
        let currentLocation = info.indexOf("_", previousLocation);
        // Case 1: We're at the end of the string, in that case insert
        // the remaining substring. This also accounts for if a user
        // did not answer the question.
        if (currentLocation === -1) {
            let item = info.substring(previousLocation);
            let field = orderOfInfo[numberOfStrings];
            fields[field] = item;
            break;
        }
        // Case 2: Two _'s next to each other -- the user skipped a question.
        // Simply insert the proper field and a blank ""        
        else if (currentLocation == previousLocation + 1) {
            let field = orderOfInfo[numberOfStrings];
            fields[field] = "";
            numberOfStrings++;
        }
        // Case 3: Base case. User properly entered an answer for the field
        // Grab the substring and insert into fields list.
        else {
            let item = info.substring(previousLocation, currentLocation);
            let field = orderOfInfo[numberOfStrings];
            fields[field] = item;
            numberOfStrings++;
        }
        previousLocation = currentLocation + 1;
    }
    userInfo = fields;
    userInfo['originalID'] = req.params.id
    next();
}

// Virtual Human Types
const EducationalComponentRouter = require('./routes/EducationalComponent');
app.use('/:id/vh/EducationalComponent', function(req,res,next) {
    req.id = id;
    req.vh = userInfo.VHType
    req.type = type
    req.userInfo = userInfo
    next();
}, EducationalComponentRouter)


// Text Types
const EducationalComponentTextRouter = require('./routes/EducationalComponentText')
app.use('/:id/text/EducationalComponentText', function(req,res,next){
    req.id = id;
    req.vh = userInfo.VHType
    req.type = type
    req.userInfo = userInfo
    next();
}, EducationalComponentTextRouter)

// Clinical Trials/study search router
const StudySearchRouter = require('./routes/StudySearch')
app.use('/:id/:type/StudySearch', function(req,res,next){
    req.id = id;
    req.vh = userInfo.VHType
    req.type = type
    req.userInfo = userInfo
    next();
}, StudySearchRouter)

// TODO: For Chris
// 1. Add "type" (text or virtual human) to the SQL Table
// 2. Add "type" to all the SQL insertions necessary inside the accesses to R24 Database


app.listen(process.env.PORT || 3000);