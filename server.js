const express = require('express')
const session = require('express-session');
require('dotenv').config()
const stringSimilarity = require('string-similarity');
const routerImporter = require('./routes/StudySearch');
const StudySearchRouter = routerImporter.StudySearchRouter;
const errorProtocol = routerImporter.errorProtocol;
const app = express()
const CryptoJS = require("crypto-js");
// <--- openai constants
const OpenAI = require('openai');
const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY // This is the default and can be omitted
  });

app.set('view engine', 'ejs')
app.use(express.static(__dirname + '/public'));
app.use(express.json())
var sql = require("mssql");

const columnNames = ['diseases', 'synonym1', 'synonym2', 'synonym3', 'synonym4', 'synonym5', 'synonym6', 'synonym7', 'synonym8', 'synonym9', 'synonym10', 'synonym11', 'synonym12', 'synonym13', 'synonym14', 'synonym15', 'synonym16', 'synonym17', 'synonym18', 'synonym19', 'synonym20', 'synonym21', 'synonym22', 'synonym23', 'synonym24', 'synonym25', 'synonym26', 'synonym27', 'synonym28', 'synonym29', 'synonym30', 'synonym31', 'synonym32', 'synonym33', 'synonym34', 'synonym35', 'synonym36', 'synonym37', 'synonym38', 'synonym39', 'synonym40', 'synonym41', 'synonym42', 'synonym43', 'synonym44', 'synonym45', 'synonym46', 'synonym47', 'synonym48', 'synonym49', 'synonym50', 'synonym51'];

const FLAG = 'FLAG';


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

app.post('/updateDatabase', storeSessionParameters, (req, res) => {
    let setList = ''
    for (const [key, value] of Object.entries(req.body)) {
        if (key !== FLAG)
            setList += key + `='` + value + `', `
    }
    setList = setList.slice(0, -2); 


    // BEGIN DATABSAE STUFF:SENDING VERSION (R24 OR U01) AND ID TO DATABASE
    var id = req.session.params.id;
    var type = req.session.params.interventionType;
    var vCHE = req.session.params.vCHE;
    if (setList === '') {
        res.json({ id: id, type: type, vCHE: vCHE});
        return;
    }
    sql.connect(config, function (err) {
        if (err) {
            errorProtocol(err, req, res);
            console.log(err);
        }

        // create Request object
        var request = new sql.Request();

        let queryString = `
        UPDATE R24U01
        SET ${setList} 
        WHERE ID = '${req.session.params.id}' 
        AND VisitNum = ${req.session.params.visitNum}`
        // console.log(queryString);
        req.session.params.queryString = queryString;
        request.query(queryString, function (err, recordset) {
            if (err) {
                errorProtocol(err, req, res);
                console.log(err);
            }
            res.json({ id: id, type: type, vCHE: vCHE});
        }); 
    
    });
    // END DATABASE STUFF
})

app.post('/SendError', (req, res) => {
    errorProtocol(req.body.error, req, res);
    res.send("Error recorded successfully");
  })
  

app.post('/storeCharacterInfoInServer', async (req, res) => {
    // console.log("IN STORE CHARACTER INFO")
    req.session.params.vCHE = req.body.vCHE
    req.session.params.vhType = req.body.VHType
    // console.log(req.session.params)
    var id = req.session.params.id;
    var vh = req.session.params.vCHE;
    var interventionType = req.session.params.interventionType;
    res.json({id: id, vhType: interventionType, vh: vh});
});

app.post("/:id/:interventionType/RetrieveConditions", (req, res) => {
    const searchValue = (Object.entries(req.body)[0][1]);

    // List all synonym columns to be selected
    const synonymColumns = Array.from({ length: 51 }, (_, i) => `synonym${i + 1}`).join(", ");
    
    // Construct the query to select the disease and all synonym columns
    let queryString = `
    SELECT TOP 300 diseases, ${synonymColumns} FROM Diseases
    WHERE ${columnNames.map(column => `${column} LIKE '%${searchValue}%'`).join(' OR ')}
    `;

    req.session.params.queryString = queryString;

    sql.connect(config, function (err) {
        if (err) {
            errorProtocol(err, req, res);
            console.log(err);
            return;
        }

        var request = new sql.Request();
        request.query(queryString, function (err, recordset) {
            if (err) {
                errorProtocol(err, req, res);
                console.log(err);
                return;
            }

            let conditions = recordset.recordset;

            // For each condition, find the synonym that is the closest match to the searchValue
            let results = conditions.map(condition => {
                // Collect all non-empty synonyms into an array
                const synonymsArray = [];
                for (let i = 1; i <= 51; i++) {
                    const synonym = condition[`synonym${i}`];
                    if (synonym) {
                        synonymsArray.push(synonym.trim());
                    }
                }

                // Find the synonym with the highest similarity score
                const bestMatch = synonymsArray.reduce((best, synonym) => {
                    const similarity = stringSimilarity.compareTwoStrings(searchValue, synonym);
                    return (similarity > best.similarity) ? { synonym, similarity } : best;
                }, { synonym: '', similarity: 0 });
                
                return {
                    disease: condition.diseases,
                    bestMatch: bestMatch.synonym,
                    similarity: bestMatch.similarity
                };
            });

            // Sort the results by similarity score, highest first
            results.sort((a, b) => b.similarity - a.similarity);
            // console.log(results.slice(0, 10));
            // Limit the results to top 10 most similar items
            res.json(results.slice(0, 10));
        });
    });
});

// Root route that redirects to valid route
app.get('/', (req, res) => {
    res.redirect('/test-id/vh');
  });

// ID is userID from qualtrics, interventionType is vh or text from Qualtrics
app.get('/:id/:interventionType', checkPreviousVisit, addVisitToDatabase, (req, res) => {
    if (!req.session.params) {
        req.session.params = {};
        req.session.params.id = req.params.id
        req.session.params.interventionType = req.params.interventionType
    }

    var id = req.session.params.id;
    var interventionType = req.session.params.interventionType;
    console.log("INTERVENTION TYPE IS", interventionType)

    if (interventionType === "text") {
        req.session.params.vCHE = 't';
        req.session.params.vhType = 't';
        res.render('pages/indexText', {id: id, interventionType: interventionType, vh: 't', vhType: 't'})
    } 
    else {
        res.render('pages/index', {id: id, interventionType: interventionType})
    }
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
    // console.log("SESSION STUFF IS:", req.session)
    sql.connect(config, function (err) {

        if (err) {
            errorProtocol(err, req, res);
            console.log(err);
        }
        // create Request object
        var request = new sql.Request();

        let queryString = `
        UPDATE R24U01
        SET Discover = 'clicked'
        WHERE ID = '` + id + `' 
        AND VisitNum = '` + visitNum + `'`;
        req.session.params.queryString = queryString;

        request.query(queryString, function (err, recordset) {
            if (err) {
                errorProtocol(err, req, res);
                console.log(err);
            }        
        }); 
    
    });

    res.render('pages/discover', {id: id, vh: vh, interventionType: interventionType})
})

function storeSessionParameters(req, res, next) {
    const formData = ['ConditionText1', 'ConditionText2', 'ConditionText3', 'Age', 'Gender', 'LocationState', 'LocationCity', 'Role'];

    const groupingsData = ['HealthyLiving', 'PreventionScreening', 'Treatment', 'Survivorship', 'Other'];

    const groupingsNames = ['Healthy Living', 'Cancer Prevention & Screening', 'Treatment', 'Survivorship', 'Other'];

    if (!req.session.params) {
        req.session.params = {};
    }
    if (!req.session.params.searchCriteria) {
        req.session.params.searchCriteria = {};
    }
    if (!req.session.params.searchCriteria.groupings) {
        req.session.params.searchCriteria.groupings = [];
    }

    if (req.body.FLAG) {
        if (req.body.FLAG === FLAG) {
            req.session.params.searchCriteria = {};
        }
    }

    for (const [key, value] of Object.entries(req.body)) {
        if (formData.includes(key)) {
            req.session.params.searchCriteria[key] = value;
        } else if (groupingsData.includes(key) && !req.session.params.searchCriteria.groupings.includes(key)) {
            let index = groupingsData.indexOf(key);
            let category = groupingsNames[index];
            req.session.params.searchCriteria.groupings.push(category);
        }
    }

    next();

}

function checkPreviousVisit(req, res, next) {
    if (req.session.visitedIndex && req.session.params.interventionType === req.params.interventionType) {
        next();
        return;
    }
    var id = req.params.id;
    var interventionType = req.params.interventionType;
    if (!req.session.params) {
        req.session.params = {};
        req.session.params.id = id;
        req.session.params.interventionType = interventionType;
    }
    if ( req.session.params.interventionType !== req.params.interventionType) {
        req.session.params.interventionType = interventionType;
    }

    

    var visitN = -1;
    // 
    sql.connect(config, function (err) {
        if (err) {
            errorProtocol(err, req, res);
            console.error('SQL connection error:', err);
            next(err);
            return;
        }

        const request = new sql.Request();

        // Query Check for Existing Entry In Table
        let checkString = `
        SELECT * FROM R24U01
        WHERE ID = '` + id + `'
        AND InterventionType = '` + interventionType + `'
        AND VisitNum = (
            SELECT max(VisitNum)
            FROM R24U01
            WHERE ID = '` + id + `'
            AND InterventionType = '` + interventionType + `'
        )`
        req.session.params.queryString = checkString;

        request.query(checkString, function (err, recordset) {
            if (err) {
                errorProtocol(err, req, res)
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
            errorProtocol(err, req, res)
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
                errorProtocol(err, req, res);
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

    req.session.params.queryString = queryString;

    sql.connect(config, function (err) {
        if (err) {
            errorProtocol(err, req, res);
            console.log(err);
        }
        var request = new sql.Request();
        request.query(queryString, function (err, recordset) {
            if (err) {
                errorProtocol(err, req, res);
                console.log(err);
            }            
            res.json(recordset.recordset);    
        }); 
    })
});

// Virtual Human Types
const EducationalComponentRouter = require('./routes/EducationalComponent');
app.use('/:id/:interventionType/:vh/EducationalComponent', function(req,res,next) {
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