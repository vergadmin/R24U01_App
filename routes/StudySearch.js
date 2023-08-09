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
const MAX_TOKENS = 300;
const TEMPERATURE = 0;
// open ai constants --->

// TODO: You previously deleted these variables.
var id = ''
var version = ''
var vh = ''
var type = ''

var trialsList = []

var sponsoredList = [
  {
    "Title": "Cancer Prevention Research Study",
    "Summary": "Adults between 50 - 73 years old are eligible to participate in a University of Florida study to develop and test messages about nutrition risk factors and colorectal cancer prevention.",
    "ContactName": "Dr. Melissa Vilaro",
    "ContactEMail": "mgraveley@ufl.edu",
    "Link": "https://research-studies-with-alex.s3.amazonaws.com/SponsoredStudies/STAMPEDNutrition_Module_CRC_Flyer_12.5.19.pdf"
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

// TODO: You removed "getInfo" function and all calls to it.
// You also removed the {version and id}, type is new.
router.get('/Background', getInfo, (req, res) => {
    res.render("pages/StudySearch/background", {id: id, vh: vh, type: type})
})

router.get('/Preferences', (req, res) => {
  res.render("pages/StudySearch/preferences", {id: id, vh: vh, type: type})
})

router.get('/Registries', (req, res) => {
  res.render("pages/StudySearch/registries", {id: id, vh: vh, type: type})
})

router.post('/Results', searchForCT, CTsWithDatabase, (req, res) => {
  // No longer rendering page here, this is just a post request!
  // console.log(trialsList)
})

router.get('/Results', (req, res) => {
  res.render("pages/StudySearch/results", {id: id, vh: vh, type: type, trialsList: trialsList, sponsoredList: sponsoredList})
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
  // console.log("IN SUMMARIZE GPT")
  // console.log(summary)
  const result = await openai.createCompletion({
          model: COMPLETIONS_MODEL,
          prompt: process.env.SUMMARY_PROMPT + summary,
          max_tokens: MAX_TOKENS,
          temperature: TEMPERATURE,
  });
  // console.log(result.data.choices[0].text);
  return result.data.choices[0].text;
}

function getInfo(req, res, next) {
    console.log("IN MIDDLEWARE OF EDUCATIONAL COMPONENT - REQUEST PARAMS:")
    id = req.id
    userInfo = req.userInfo
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
      console.log("IN REQUEST")
      let list = []
      list = studies.filter(study => {
        let age = parseInt(req.body.Age)
        // console.log(age)
        let minNum = study.MinimumAge[0] ? parseInt(study.MinimumAge[0].replace(/[^0-9]/g, '')) : 0;
        let maxNum = study.MaximumAge[0] ? parseInt(study.MaximumAge[0].replace(/[^0-9]/g, '')) : 150;
        // console.log(minNum)
        return (age >= minNum && age <= maxNum)
      })
      console.log("DONE")
      return list
  })
  .catch(err => {
    console.log('Error: ', err.message);
  });
  console.log("TRIALS LIST")
  console.log(trialsList)

  if(trialsList.length > 0) {
    if (trialsList.length > 5) {
      trialsList = trialsList.slice(0,5)
    } 
    var locationIndeces = [];
    var facilities = []
    // GETTING FACILITIES LIST -- loop through all trials
    for (var i = 0; i < trialsList.length; i++) {
      // remove duplications from InterventionType while we're here
      trialsList[i].InterventionType = [...new Set(trialsList[i].InterventionType )];
      locationIndeces = [];
      facilities = []
      // get indeces of locations from cities array
      trialsList[i].LocationCity.forEach((city, index) => city === req.body.LocationCity ? locationIndeces.push(index) : null)
      // condense down to 5 locations if more than 5
      if (locationIndeces.length > 5) {
        locationIndeces = locationIndeces.slice(0,5);
      }
      // iterate through indeces and extract those facilities from facilities array
      for (var j = 0; j < locationIndeces.length; j++) {
        facilities.push(trialsList[i].LocationFacility[locationIndeces[j]])
      }
      // set new property on trialsList for filtered facilities
      trialsList[i]['FilteredFacilities'] = facilities;
    }
  }
  

  next()
}

module.exports = router