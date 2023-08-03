const express = require('express')
const app = express()

require('dotenv').config()
console.log(process.env)

// <--- openai constants
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
    // TODO: replace apiKey
    apiKey: process.env.CHRIS_OPENAI_KEY,
});
const openai = new OpenAIApi(configuration);
const COMPLETIONS_MODEL = "text-davinci-003";
// SUMMARY_PROMPT, MAX_TOKENS, & TEMPERATURE can be modified as needed.
// TODO: Move Summary Prompts into .env -- don't want any chance for user's to see prompt.
const SUMMARY_PROMPT = "Re-explain the following to a population with an 8th grader's literacy while retaining accuracy: ";
const MAX_TOKENS = 300;
const TEMPERATURE = 0;
// open ai constants --->

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

app.get('/CTsWithDatabase', (req, res) => {
    
    let trialsList = []
    // TODO: Retrieve Trials and put into trialsList

    // Can Delete This Code After Testing From Here --- (scroll down)
    let dummyObject1 = {'Summary': `The goal of this observational study is to assess the level of oxidative stress during cesarean section depending on the type of anesthesia applied and to determine the factors that can affect the level of oxidative stress.

    The main questions it aims to answer are:
    
    is there any association between specific parameters of pregnancy, socio-demographic characteristics and laboratory analyses with an increased level of oxidative stress
    is there any association between type of anesthesia for ceasarean section with an increased level of oxidative stress
    Blood sample would be taken from the participants in the study for these analyses on three occasions in 3 test tubes (before cesarean section, during cesarean section and after cesarean section).
    
    Researchers will compare patients that received general anesthesia with patients under spinal regional anesthesia to see if there is any difference in level of oxidative stress measured by laboratory parameters.`, 'ID' : '69'};

    let dummyObject2 = {'Summary': `Sigi Insulin Management System (Sigi) is a novel insulin patch pump intended for subcutaneous delivery if insulin at set and variable rates for the management of diabetes mellitus in persons requiring insulin. Sigi is offering superior delivery accuracy and precision, accelerated occlusion detection, wearable patch pump, pre-filled insulin cartridges and smartphone control.

    Glycemia is CGM controlled and for safety purposes, CGM data are shared with study medical team during the whole study.
    
    Sigi FIH Study is conducted in a single clinical site in Lausanne University Hospital (CHUV) in Switzerland.`, 'ID': '420'};

    trialsList.push(dummyObject1);
    trialsList.push(dummyObject2);
    trialsList.push(dummyObject2);
    trialsList.push(dummyObject1);
    // -- To Here (stop scrolling).


    // The following function "processNext()" is a wrapper function so that the async calls made to
    // summarizeGPT don't return out of order -- it's a glorified for loop.
    // processNext() checks if we've already recorded the CT, if we have, retrieves it and stores in trialsList.GPTSummary
    // if we have not recorded it, it calls summarizeGPT, stores it in trialsList.GPTSummary and then inserts it into the ClinicalTrials table
    let iterations = trialsList.length;
    let i = 0;
    // idTracker is a temp variable to make sure we have no duplicates stored in the table
    let idTracker = [];
    function processNext() { 
        if (i == trialsList.length) {
            // TODO: Replace this line of code with your code to render the trialsList
            // trialsList should contain all the same info and a new GPTSummary item
            console.log("=======Simplified Versions======");
            console.log(trialsList);
        }
        if (i < iterations) {
            // We do a sql.connect in every iteration of the loop because the table doesn't update until you disconnect and reconnect
            // Basically, I'm trying to avoid weird interactions with multiple users + it doesn't throttle speed a whole ton.
            sql.connect(config, function (err) {
                var request = new sql.Request();
                // I created a table called ClinicalTrials -- that's where we will store CT ID's and GPTSummary's
                let queryString = `SELECT * FROM CLINICALTRIALS WHERE STUDYID='` + trialsList[i].ID + `'`;
                request.query(queryString, function (err, recordset) {
                    if (err) 
                        console.log(err);

                    // CASE 1: The StudyID is not in our table yet -- we have no summary, so we have to GPT it and store it.
                    // Also, a Sanity Check is Necessary (&&):
                    // If we somehow have duplicates in the trialsList, we don't want to store it in the table twice.
                    // This can happen in very rare cases where the recordset length returns 0, after an entry for it was added moments before.
                    if (recordset.recordset.length === 0 && !idTracker.includes(trialsList[i].ID)) {
                        
                        summarizeGPT(trialsList[i].Summary).then((summary) => {
                            // Console logs for Debugging.
                            // console.log("CASE 1: " + summary);

                            // Convert summary into a SQL friendly string and put in trialsList
                            summary = summary.replace("'", "''");
                            trialsList[i]['GPTSummary'] = summary;

                            // Keep track of IDs already seen.
                            idTracker.push(trialsList[i].ID);
                            // Insert new entry into table
                            // Useful SQL Code to empty out table, greatly helped with debugging: TRUNCATE TABLE ClinicalTrials;
                            let updateString = `INSERT INTO CLINICALTRIALS (StudyID, GPTSummary) VALUES ('` + trialsList[i].ID + `','` + summary + `')`;
                            request.query(updateString, function (err, recordset2) {
                                if (err) 
                                    console.log(err);
                            });
                            // Update for loop and call it again until we looped through all items in trialsList
                            i++;
                            processNext();
                        }).catch((error) => {
                            console.error(error);
                        })
                    }
                    // CASE 2: The Study ID is already in the table, so we can just grab it from the table and store it in our array.
                    else if (recordset.recordset.length !== 0) {
                        // Console logs for Debugging.
                        // console.log("CASE 2: " + recordset.recordset[0].GPTSummary);
                        trialsList[i]['GPTSummary'] = recordset.recordset[0].GPTSummary;
                        i++;
                        processNext();
                    }
                });
            });
        }
        
    }
    // initial call to processNext()
    processNext();
})

app.get('/CTsWithoutDatabase', (req, res) =>  {
    // loop through trialsList and extract summaries, gpt them, and store.
    let trialsList = []
    // TODO: Retrieve Trials and put into trialsList

    // Can Delete This Code After Testing From Here --- (scroll down)
    let dummyObject1 = {'Summary': `The goal of this observational study is to assess the level of oxidative stress during cesarean section depending on the type of anesthesia applied and to determine the factors that can affect the level of oxidative stress.

    The main questions it aims to answer are:
    
    is there any association between specific parameters of pregnancy, socio-demographic characteristics and laboratory analyses with an increased level of oxidative stress
    is there any association between type of anesthesia for ceasarean section with an increased level of oxidative stress
    Blood sample would be taken from the participants in the study for these analyses on three occasions in 3 test tubes (before cesarean section, during cesarean section and after cesarean section).
    
    Researchers will compare patients that received general anesthesia with patients under spinal regional anesthesia to see if there is any difference in level of oxidative stress measured by laboratory parameters.`, 'ID' : '69'};

    let dummyObject2 = {'Summary': `Sigi Insulin Management System (Sigi) is a novel insulin patch pump intended for subcutaneous delivery if insulin at set and variable rates for the management of diabetes mellitus in persons requiring insulin. Sigi is offering superior delivery accuracy and precision, accelerated occlusion detection, wearable patch pump, pre-filled insulin cartridges and smartphone control.

    Glycemia is CGM controlled and for safety purposes, CGM data are shared with study medical team during the whole study.
    
    Sigi FIH Study is conducted in a single clinical site in Lausanne University Hospital (CHUV) in Switzerland.`, 'ID': '420'};

    trialsList.push(dummyObject1);
    trialsList.push(dummyObject2);
    trialsList.push(dummyObject2);
    trialsList.push(dummyObject1);
    // -- To Here (stop scrolling).

    let promise = Promise.resolve();

    // Without a database to parse, the code is easier, just loop through trials and call ChatGPT.
    for (let i = 0; i < trialsList.length; i++) {
        promise = promise.then(() => {
            // wait for summarizeGPT to return a GPT Summary and store it in trialsList
            return summarizeGPT(trialsList[i].Summary).then((summary) => {
                summary = summary.replace("'", "''");
                trialsList[i]['GPTSummary'] = summary;
            });
        });
    }
    // Once the promise is fulfilled (all iterations of loop are done), perform remaining actions.
    promise.then(() => {
        // TODO: Replace this line of code with your code to render the trialsList
        // trialsList should contain all the same info and a new GPTSummary item
        console.log("=======Simplified Versions======");
        console.log(trialsList);
    });
})

// summarizeGPT is an async helper function used to call openai API and returns the result
async function summarizeGPT(summary) {
    const result = await openai.createCompletion({
            model: COMPLETIONS_MODEL,
            prompt: SUMMARY_PROMPT + summary,
            max_tokens: MAX_TOKENS,
            temperature: TEMPERATURE,
    });
    return result.data.choices[0].text;
}


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