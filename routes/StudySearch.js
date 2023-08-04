const express = require('express')
const router = express.Router()
var sql = require("mssql");
var axios = require("axios")

// <--- openai constants
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
    // TODO: replace apiKey
    apiKey: process.env.VERG_OPENAI_KEY,
});
const openai = new OpenAIApi(configuration);
const COMPLETIONS_MODEL = "text-davinci-003";
// SUMMARY_PROMPT, MAX_TOKENS, & TEMPERATURE can be modified as needed.
// TODO: Move Summary Prompts into .env -- don't want any chance for user's to see prompt.
const SUMMARY_PROMPT = "Re-explain the following to a population with an 8th grader's literacy while retaining accuracy: ";
const MAX_TOKENS = 300;
const TEMPERATURE = 0;
const REGISTRY_PROMPT = `Rewrite the following text to make it more concise (around one brief paragraph) and at an 8th grade language level, but keep the accuracy of the text: `;
// open ai constants --->

// TODO: You previously deleted these variables.
var id = ''
var version = ''
var vh = ''
var type = ''

var trialsList = []

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

// TODO: You removed "getInfo" function and all calls to it.
router.get('/Background', getInfo, (req, res) => {
    res.render("pages/StudySearch/background")
})

router.get('/Preferences', (req, res) => {
  res.render("pages/StudySearch/preferences")
})

router.get('/Registries', (req, res) => {
  res.render("pages/StudySearch/registries")
})

router.post('/Results', searchForCT, CTsWithDatabase, (req, res) => {
  res.render("pages/StudySearch/results", {trialsList: trialsList})
})

router.get('/Results', (req, res) => {
  res.render("pages/StudySearch/results", {trialsList: trialsList})
})

function CTsWithDatabase(req, res, next) {
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
          // console.log(trialsList);
          next();
      }
      if (i < iterations) {
          // We do a sql.connect in every iteration of the loop because the table doesn't update until you disconnect and reconnect
          // Basically, I'm trying to avoid weird interactions with multiple users + it doesn't throttle speed a whole ton.
          console.log("GOING TO MAKE SQL REQUEST IN GPT STUFF")
          sql.connect(config, function (err) {
              var request = new sql.Request();
              // I created a table called ClinicalTrials -- that's where we will store CT ID's and GPTSummary's
              let queryString = `SELECT * FROM CLINICALTRIALS WHERE STUDYID='` + trialsList[i].NCTId + `'`;
              request.query(queryString, function (err, recordset) {
                  if (err) 
                      console.log(err);

                  // CASE 1: The StudyID is not in our table yet -- we have no summary, so we have to GPT it and store it.
                  // Also, a Sanity Check is Necessary (&&):
                  // If we somehow have duplicates in the trialsList, we don't want to store it in the table twice.
                  // This can happen in very rare cases where the recordset length returns 0, after an entry for it was added moments before.
                  if (recordset.recordset.length === 0 && !idTracker.includes(trialsList[i].NCTId)) {
                      console.log("HERE")
                      summarizeGPT(trialsList[i].BriefSummary).then((summary) => {
                        console.log("SUMMARIZED GPT")
                          // Console logs for Debugging.
                          // console.log("CASE 1: " + summary);

                          // Convert summary into a SQL friendly string and put in trialsList
                          summary = summary.replace("'", "''");
                          trialsList[i]['GPTSummary'] = summary;

                          // Keep track of IDs already seen.
                          idTracker.push(trialsList[i].NCTId);
                          // Insert new entry into table
                          // Useful SQL Code to empty out table, greatly helped with debugging: TRUNCATE TABLE ClinicalTrials;
                          let updateString = `INSERT INTO CLINICALTRIALS (StudyID, GPTSummary) VALUES ('` + trialsList[i].NCTId + `','` + summary + `')`;
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
}

// summarizeGPT is an async helper function used to call openai API and returns the result
async function summarizeGPT(summary) {
  console.log("IN SUMMARIZE GPT")
  console.log(summary)
  const result = await openai.createCompletion({
          model: COMPLETIONS_MODEL,
          prompt: SUMMARY_PROMPT + summary,
          max_tokens: MAX_TOKENS,
          temperature: TEMPERATURE,
  });
  console.log(result.data.choices[0].text);
  return result.data.choices[0].text;
}

// TODO: You deleted this function previously.
function getInfo(req, res, next) {
    console.log("IN MIDDLEWARE OF EDUCATIONAL COMPONENT - REQUEST PARAMS:")
    id = req.id
    version = req.version
    vh = req.vh
    type = req.type
    console.log("type is " + type);
    next()
}

async function searchForCT(req, res, next) {
  let expression = `${req.body.Condition} AND SEARCH[Location](AREA[LocationState] ${req.body.LocationState} AND AREA[LocationCity] ${req.body.LocationCity} AND AREA[LocationStatus] Recruiting) AND AREA[Gender] ${req.body.Gender} AND AREA[HealthyVolunteers] ${req.body.HealthyVolunteer }`
  console.log("EXPRESSION IS: " + expression)
  const apiUrl = `https://clinicaltrials.gov/api/query/study_fields?expr=${expression}&fields=NCTId%2CBriefTitle%2COverallStatus%2CBriefSummary%2CCondition%2CStudyType%2CMaximumAge%2CMinimumAge%2CGender%2CInterventionType%2CHealthyVolunteers%2CCentralContactEMail%2CCentralContactName%2CLocationCity%2CLocationFacility&min_rnk=1&max_rnk=&fmt=json`;

  trialsList = await axios.get(apiUrl)
  .then(response => {
      var studies = response.data.StudyFieldsResponse.StudyFields
      // console.log(studies)
      let list = []
      list = studies.filter(study => {
        let age = parseInt(req.body.Age)
        // console.log(age)
        let minNum = study.MinimumAge[0] ? parseInt(study.MinimumAge[0].replace(/[^0-9]/g, '')) : 0;
        let maxNum = study.MaximumAge[0] ? parseInt(study.MaximumAge[0].replace(/[^0-9]/g, '')) : 150;
        // console.log(minNum)
        return (age >= minNum && age <= maxNum)
      })
      return list
  })
  .catch(err => {
    console.log('Error: ', err.message);
  });
  console.log(trialsList)
  trialsList = trialsList.slice(0,5)
  next()
}

module.exports = router