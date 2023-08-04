const express = require('express')
const app = express()

const CryptoJS = require("crypto-js");

require('dotenv').config()
console.log(process.env)

app.set('view engine', 'ejs')
app.use(express.static(__dirname + '/public'));
app.use(express.json())
var sql = require("mssql");

var vh = 'bf'
var type = ''

// Modify based on Miriam/Emma's Qualtrics:
const orderOfInfo =  ["ID", "Gender", "Age", "State", "Race", "City", "HV", "Cond", "Pref"];

var userInfo = []

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

        let queryString = 'UPDATE R24 SET ' + setList + ' WHERE ID=' + `'` + userInfo.ID + `'`;
        console.log(queryString)
        request.query(queryString, function (err, recordset) {
            if (err) console.log(err)
            // send records as a response
            console.log("UPDATED! IN R24 TABLE:")
            console.log(recordset);
        }); 
    
    });
    // END DATABASE STUFF
})

app.get('/Introduction', registerClick, (req, res) => {
    res.render("pages/EducationalComponent/introduction", {vh: userInfo.VHType, buttons: buttons, url: 'Introduction'})
})

app.get('/1', registerClick, (req, res) => {
    res.render("pages/EducationalComponent/1", {vh: userInfo.VHType, buttons: buttons, url: '1'})
})

// TODO: You previously deleted this function.
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

// TODO: You previously deleted this function.
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

app.get('/2', registerClick, (req, res) => {
    res.render("pages/EducationalComponent/2", {vh: userInfo.VHType, buttons: buttons, url: '2'})
})

app.get('/3', registerClick, (req, res) => {
    res.render("pages/EducationalComponent/3", {vh: userInfo.VHType, buttons: buttons, url: '3'})
})

app.get('/4', registerClick, (req, res) => {
    res.render("pages/EducationalComponent/4", {vh: userInfo.VHType, buttons: buttons, url: '4'})
})

app.get('/Discover', registerClick, (req, res) => {
    res.render('pages/discover')
})

app.get('/Introduction/:id', extractInformation, setVHType, addVisitToDatabase, (req, res) => {
    res.render("pages/EducationalComponent/introduction", {vh: userInfo.VHType, buttons: buttons, url: 'Introduction'})
})


function addVisitToDatabase(req, res, next) {
    console.log("IN MIDDLEWARE - REQUEST PARAMS:")
    console.log(req.params)
    version = req.params.version
    id = req.params.id
    type = req.params.type

    sql.connect(config, function (err) {
        var request = new sql.Request();
        console.log("ADDING NEW ROW TO DATABASE FOR THIS VISIT")
        let queryString =  `INSERT INTO R24 (ID, VHType) VALUES ('` + userInfo.ID + `','` + userInfo.VHType + `')`;
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

function registerClick(req, res, next) {
    console.log("IN UPDATE DATABASE")
    console.log(req.url)
    let dbEntry = req.url.slice(1)
    console.log(dbEntry)
    // BEGIN DATABSAE STUFF:SENDING VERSION (R24 OR U01) AND ID TO DATABASE
    sql.connect(config, function (err) {

        if (err) console.log(err);

        // create Request object
        var request = new sql.Request();

        let queryString = ""
        if (dbEntry == '1' || dbEntry == '2' || dbEntry == '3' || dbEntry == '4' || dbEntry == 'Introduction') {
            console.log("IS EDUCATIONAL COMPONENT")
            queryString = 'UPDATE R24 SET Educational_' + dbEntry + `='clicked' WHERE ID=` + `'` + userInfo.ID + `'`;
        } else {
            queryString = 'UPDATE R24 SET ' + dbEntry + `='clicked' WHERE ID=` + `'` + userInfo.ID + `'`;
        }
        console.log(queryString)
        request.query(queryString, function (err, recordset) {
            if (err) console.log(err)
            // send records as a response
            console.log("UPDATED! IN R24 TABLE:")
            console.log(recordset);
        }); 
    
    });
}
// END DATABASE STUFF

function setVHType(req, res, next) {
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
    next()
}

function extractInformation(req, res, next) {
    // fields is an array of objects formatted as such...
    // {"ID" : id, "Gender" : gender, ... "Pref" : video}
    console.log("REQUEST PARAMS:")
    console.log(req.params)
    var id = req.params.id;
    var bytes = CryptoJS.AES.decrypt(id, process.env.DECRYPTION_KEY);
    // Test String
    // id = "U2FsdGVkX1-65+k-+XeQ4sLoEHZfMYjDPhOrn2oklAJhbM05l-KyH97UOpiKSBtlSgeJgGPM1ECXKVOoOPTCv4SNykjhAdO-RN7H-xVR9Dc="
    var fixedID = id.replaceAll("-","/");
    var bytes = CryptoJS.AES.decrypt(fixedID, process.env.DECRYPTION_KEY);
    var info = bytes.toString(CryptoJS.enc.Utf8);
    console.log("after decrypt: " + info)

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
    console.log(fields);
    userInfo = fields;
    next();
}

// TODO: You previously deleted this function
// Virtual Human Types
const EducationalComponentRouter = require('./routes/EducationalComponent');
app.use('/:version/:id/:type/EducationalComponent', function(req,res,next) {
    req.id = id;
    req.version = version
    req.vh = vh
    req.type = type
    next();
}, EducationalComponentRouter)


// TODO: You previously deleted this function.
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
// TODO: You previously deleted this function.
app.use('/:version/:id/:type/StudySearch', function(req,res,next){
    req.id = id;
    req.version = version
    req.vh = vh
    req.type = type
    next();
}, StudySearchRouter)

app.use('/StudySearch', function(req,res,next){
    next();
}, StudySearchRouter)

// TODO: For Chris
// 1. Add "type" (text or virtual human) to the SQL Table
// 2. Add "type" to all the SQL insertions necessary inside the accesses to R24U01 Database


app.listen(process.env.PORT || 3000);