const express = require('express')
const session = require('express-session');
const stringSimilarity = require('string-similarity');

const app = express()
const CryptoJS = require("crypto-js");

require('dotenv').config()
// console.log(process.env)

app.set('view engine', 'ejs')
app.use(express.static(__dirname + '/public'));
app.use(express.json())
var sql = require("mssql");

const columnNames = ['diseases', 'synonym1', 'synonym2', 'synonym3', 'synonym4', 'synonym5', 'synonym6', 'synonym7', 'synonym8', 'synonym9', 'synonym10', 'synonym11', 'synonym12', 'synonym13', 'synonym14', 'synonym15', 'synonym16', 'synonym17', 'synonym18', 'synonym19', 'synonym20', 'synonym21', 'synonym22', 'synonym23', 'synonym24', 'synonym25', 'synonym26', 'synonym27', 'synonym28', 'synonym29', 'synonym30', 'synonym31', 'synonym32', 'synonym33', 'synonym34', 'synonym35', 'synonym36', 'synonym37', 'synonym38', 'synonym39', 'synonym40', 'synonym41', 'synonym42', 'synonym43', 'synonym44', 'synonym45', 'synonym46', 'synonym47', 'synonym48', 'synonym49', 'synonym50', 'synonym51'];


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
    saveUninitialized: true,
    rolling: true,
    cookie: {
        maxAge: 1000 * 60 * 15
    },
}))

app.post('/updateDatabase', async (req, res) => {
    let setList = ''
    // console.log(req.session.visitedIndex);
    for (const [key, value] of Object.entries(req.body)) {
        setList += key + `='` + value + `', `
    }
    setList = setList.slice(0, -2); 
    // console.log(setList);

    // BEGIN DATABSAE STUFF:SENDING VERSION (R24 OR U01) AND ID TO DATABASE
    sql.connect(config, function (err) {
    
        if (err) console.log(err);

        // create Request object
        var request = new sql.Request();

        let queryString = `
        UPDATE R24U01
        SET ` + setList + 
        ` WHERE ID = '` + req.session.params.id + `' 
        AND VisitNum = ` + req.session.params.visitNum;
        request.query(queryString, function (err, recordset) {
            if (err) console.log(err) 
            res.status(200).json({ message: 'Updated.' });
        }); 
    
    });
    // END DATABASE STUFF
})

app.post('/storeCharacterInfoInServer', async (req, res) => {
    req.session.params.vCHE = req.body.vCHE
    req.session.params.vhType = req.body.VHType
    res.status(200).json({ message: 'OK' });
})

app.post("/:id/:interventionType/RetrieveConditions", (req, res) => {
    let searchValue = (Object.entries(req.body)[0][1])
    const columnConditions = columnNames.map(column => `${column} LIKE '%${searchValue}%'`).join(' OR ')
    // const finalConditions = columnConditions.slice(0, -3);
    let queryString = `
    SELECT TOP 10 diseases FROM Diseases
    WHERE ${columnConditions}
    `;

    sql.connect(config, function (err) {
        if (err) console.log(err)

        var request = new sql.Request();
        request.query(queryString, function (err, recordset) {
            if (err) console.log(err)
            // send records as a response
            // console.log(recordset.recordset[0]);
            let conditions = recordset.recordset;
              // Sort items based on similarity score (higher score means more similar)
            const sortedItems = conditions.sort((a, b) => stringSimilarity.compareTwoStrings(searchValue, b.diseases) - stringSimilarity.compareTwoStrings(searchValue, a.diseases));
              
              // Get the top 10 most similar items
            res.json(sortedItems);    
        }); 
    })
})

// Root route that redirects to valid route
app.get('/', (req, res) => {
    res.redirect('/test-id/vh');
  });

// ID is userID from qualtrics, interventionType is vh or text from Qualtrics
app.get('/:id/:interventionType', checkPreviousVisit, addVisitToDatabase, (req, res) => {
    if (!req.session.params) {
        req.session.params = {};
        var id = req.params.id
        var interventionType = req.params.interventionType
        req.session.params.id = id;
        req.session.params.interventionType = interventionType;
    }

    var id = req.session.params.id;
    var interventionType = req.session.params.interventionType;

    if (interventionType == "text") 
        res.render('pages/indexText', {id: id, interventionType: interventionType})
    else 
        res.render('pages/index', {id: id, interventionType: interventionType})
})

// TO DO: ADD DATABASE CONNECTION
app.get('/:id/:interventionType/characters', (req, res) => {
    var id = req.session.params.id;
    var interventionType = req.session.params.interventionType;
    res.render("pages/selectCharacter", {id: id, interventionType: interventionType})
})


app.get('/:id/:interventionType/:vh/Discover', (req, res) => {
    var id = req.session.params.id;
    var interventionType = req.session.params.interventionType;
    var visitNum = req.session.params.visitNum;
    var vh = req.session.params.vCHE;
    sql.connect(config, function (err) {

        if (err) console.log(err);

        // create Request object
        var request = new sql.Request();

        let queryString = `
        UPDATE R24U01
        SET Discover = 'clicked'
        WHERE ID = '` + id + `' 
        AND VisitNum = '` + visitNum + `'`;
        
        // console.log(queryString)
        request.query(queryString, function (err, recordset) {
            if (err) console.log(err)
        }); 
    
    });

    res.render('pages/discover', {id: id, vh: vh, interventionType: interventionType})
})

function checkPreviousVisit(req, res, next) {
    if (req.session.visitedIndex) {
        next();
        return;
    }
    var id = req.params.id;
    if (!req.session.params) {
        req.session.params = {};
        req.session.params.id = id;
    }
    var visitN = -1;
    // 
    sql.connect(config, function (err) {
        if (err) {
            console.error('SQL connection error:', err);
            next(err);
            return;
        }

        const request = new sql.Request();

        // Query Check for Existing Entry In Table
        let checkString = `
        SELECT * FROM R24U01
        WHERE ID = '` + id + `'
        AND VisitNum = (
                SELECT max(VisitNum)
                FROM R24U01
                WHERE ID = '` + id + `' 
        )`
        request.query(checkString, function (err, recordset) {
            if (err) {
                console.error('SQL query error:', err);
                next(err);
                return;
            }
            if (recordset.recordset.length === 0) {
                visitN = 1;
                req.session.params.visitNum = visitN;

            } else {
                visitN = recordset.recordset[0].VisitNum + 1;
            }
            req.session.params.visitNum = visitN;
            next();
        });
    });

}

function addVisitToDatabase(req, res, next) {
    if (!req.session.visitedIndex) {
        req.session.visitedIndex = true;
    } else {
        next();
        return;
    }
    if (!req.session.params) {
        req.session.params = {};
    }
    var id = req.params.id;
    var interventionType = req.params.interventionType;

    req.session.params.id = id;
    req.session.params.interventionType = interventionType;

    var visitNum = req.session.params.visitNum;
    req.session.params.visitNum = visitNum;
    sql.connect(config, function (err) {
        if (err) {
            console.error('SQL connection error:', err);
            next(err);
            return;
        }

        const request = new sql.Request();
        // let queryString = `INSERT INTO R24U01 (ID, VisitNum, InterventionType) VALUES ('` + id  + `',` + visitNum + `,'` + interventionType + `')`;
        let queryString = `
        INSERT INTO R24U01 (ID, VisitNum, InterventionType)
        VALUES (@id, @visitNum, @interventionType)`
  
        // Add input parameters
        request.input('id', sql.VarChar(50), id);
        request.input('visitNum', sql.Int, visitNum);
        request.input('interventionType', sql.VarChar(50), interventionType);
 
        request.query(queryString, function (err, recordset) {
            if (err) {
                console.error('SQL query error:', err);
                next(err);
                return;
            }
            next();
        });
    });
}

app.post('/:id/:interventionType/RetrieveCities', (req, res) => {
    var id = req.params.id
    var interventionType = req.params.interventionType
    let stateVal = (Object.entries(req.body)[0][1])
    let cityVal =(Object.entries(req.body)[1][1])
    const code = cityVal.charCodeAt(0)
    let database = "StatesAndCitiesAG"
    if ((code >= 97 && code <= 103) || (code >= 65 && code <= 71)) {
        database = "StatesAndCitiesAG"
    }
    else if ((code >= 104 && code <= 111) || (code >= 72 && code <= 79)) {
        database = "StatesAndCitiesHO"
    }
    else {
        database = "StatesAndCitiesPZ"
    }
    
    const queryString = `
    SELECT * FROM ${database}
    WHERE State = '${stateVal}' 
    `;

    sql.connect(config, function (err) {
        if (err) console.log(err)

        var request = new sql.Request();
        request.query(queryString, function (err, recordset) {
            if (err) console.log(err)
            res.json(recordset.recordset);    
        }); 
    })
});

// Virtual Human Types
const EducationalComponentRouter = require('./routes/EducationalComponent');
app.use('/:id/:interventionType/:vh/EducationalComponent', function(req,res,next) {
    console.log("LET US SEE WOT IS IN REQ SESS PARAMS", req.session.params)
    req.id = req.session.params.id;
    req.vh = req.session.params.vCHE;
    req.vhType = req.session.params.vhType;
    req.interventionType = req.session.params.interventionType;
    req.visitNum = req.session.params.visitNum;
    next();
}, EducationalComponentRouter)


// Text Types
const EducationalComponentTextRouter = require('./routes/EducationalComponentText')
app.use('/:id/:interventionType/:vh/EducationalComponentText', function(req,res,next){
    req.id = req.session.params.id;
    req.vh = req.session.params.vCHE;
    req.vhType = req.session.params.vhType;
    req.interventionType = req.session.params.interventionType;
    req.visitNum = req.session.params.visitNum;
    next();
}, EducationalComponentTextRouter)

// Clinical Trials/study search router
const StudySearchRouter = require('./routes/StudySearch');
const { json } = require('body-parser');
app.use('/:id/:interventionType/:vh/StudySearch', function(req,res,next){
    req.id = req.session.params.id;
    req.vh = req.session.params.vCHE;
    req.vhType = req.session.params.vhType;
    req.interventionType = req.session.params.interventionType;
    req.visitNum = req.session.params.visitNum;
    next();
}, StudySearchRouter)


app.listen(process.env.PORT || 3000);