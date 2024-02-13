const express = require('express')
const router = express.Router()
var sql = require("mssql");
var axios = require("axios")

// <--- openai constants
const { Configuration, OpenAIApi } = require("openai");
const e = require('express');
const configuration = new Configuration({
    // TODO: replace apiKey
    apiKey: process.env.VERG_OPENAI_KEY,
});
const openai = new OpenAIApi(configuration);
// SUMMARY_PROMPT, MAX_TOKENS, & TEMPERATURE can be modified as needed.
// TODO: Move Summary Prompts into .env -- don't want any chance for user's to see prompt.
const COMPLETIONS_MODEL = process.env.COMPLETIONS_MODEL;
const SUMMARY_PROMPT = process.env.SUMMARY_PROMPT;
const TITLE_PROMPT = process.env.TITLE_PROMPT;
const MAX_TOKENS = 300
const MAX_TITLE_TOKENS = 50
const TEMPERATURE = 0
// open ai constants --->

// TODO: You previously deleted these variables.
var id = ''
var vh = ''
var type = ''

var trialsList = []

var currentExpression = "";
var lastExpression = "";

var sponsoredList = [
  {
    "Title": "Cancer Prevention Research Study",
    "Summary": "Adults between 45 -- 73 years old may be eligible to participate in in a University of Florida study to test messages about nutrition risk factors and colorectal cancer prevention in a one-time, web-based, interaction with a virtual health assistant.",
    "ContactName": "Dr. Melissa Vilaro",
    "ContactEMail": "mgraveley@ufl.edu",
    "Info": "https://research-studies-with-alex.s3.amazonaws.com/SponsoredStudies/STAMPEDNutrition_Module_CRC_Flyer_12.5.19.pdf",
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
  // All middleware have executed in order by this point
  // You can send the response here 
  res.send('Dummy Response after both functions.');
});

router.get('/Results', (req, res) => {
  res.render("pages/StudySearch/results", {id: id, vh: vh, type: type, trialsList: trialsList, sponsoredList: sponsoredList})
})

function CTsWithDatabase(req, res, next) {
  // The following function "processNext()" is a wrapper function so that the async calls made to
  // summarizeGPT don't return out of order -- it's a glorified for loop.
  // processNext() checks if we've already recorded the CT, if we have, retrieves it and stores in trialsList.GPTSummary
  // if we have not recorded it, it calls summarizeGPT, stores it in trialsList.GPTSummary and then inserts it into the ClinicalTrials table
  if (currentExpression == lastExpression) {
    next();
    return;
  }
  lastExpression = currentExpression;
  if (!trialsList) 
    trialsList = []
  let iterations = trialsList.length;
  let i = 0;
  // idTracker is a temp variable to make sure we have no duplicates stored in the table
  let idTracker = [];
  function processNext() { 
      if (i == trialsList.length) {
          // TODO: Replace this line of code with your code to render the trialsList
          // trialsList should contain all the same info and a new GPTSummary item
          // console.log("=======Simplified Versions======");
          // console.log(trialsList);
          // console.log("Number of Trials: " + trialsList.length);
          // console.log("End of search.");
          next();
          // return;
      }
      if (i < iterations) {
          // We do a sql.connect in every iteration of the loop because the table doesn't update until you disconnect and reconnect
          // Basically, I'm trying to avoid weird interactions with multiple users + it doesn't throttle speed a whole ton.
          
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
                      // console.log("HERE")
                      summarizeGPT(trialsList[i].BriefSummary, trialsList[i].DetailedDescription).then((summary) => {
                        titleizeGPT(trialsList[i].BriefTitle, trialsList[i].BriefSummary, trialsList[i].DetailedDescription).then((title) => {
                          // console.log("SUMMARIZED GPT")
                          // Console logs for Debugging.
                          // console.log("CASE 1: " + summary);

                          // Convert summary into a SQL friendly string and put in trialsList
                          title = title.replace(/'/g, "''");
                          summary = summary.replace(/'/g, "''");
                          trialsList[i]['GPTTitle'] = title;
                          trialsList[i]['GPTSummary'] = summary;
                          

                          // Keep track of IDs already seen.
                          idTracker.push(trialsList[i].NCTId);
                          // Insert new entry into table
                          // Useful SQL Code to empty out table, greatly helped with debugging: TRUNCATE TABLE ClinicalTrials;
                          let updateString = `INSERT INTO CLINICALTRIALS (StudyID, GPTTitle, GPTSummary) VALUES ('` + trialsList[i].NCTId + `','` + title + `','` + summary + `')`;
                          // console.log(updateString);
                          request.query(updateString, function (err, recordset2) {
                              if (err) 
                                  console.log(err);
                          });
                          // Update for loop and call it again until we looped through all items in trialsList
                          i++;
                          processNext();
                        }).catch((error) => {
                          console.error("Error in title GPT:", error);
                        })
                      }).catch((error) => {
                          console.error("Error in summarize GPT:", error);
                      })
                  }
                  // CASE 2: The Study ID is already in the table, so we can just grab it from the table and store it in our array.
                  else if (recordset.recordset.length !== 0) {
                      // Console logs for Debugging.
                      // console.log("CASE 2: " + recordset.recordset[0].GPTSummary);
                      trialsList[i]['GPTTitle'] = recordset.recordset[0].GPTTitle;
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
async function summarizeGPT(briefSummary, detailedDescription) {
  // console.log("IN SUMMARIZE GPT")
  // console.log(title, briefSummary, detailedDescription);
  const headers = {
      'Authorization': `Bearer ${process.env.VERG_OPENAI_KEY}`
    };
  const prompt = SUMMARY_PROMPT + "\nTEXT1: [" + briefSummary + "]\nTEXT2: [" + detailedDescription + "]";
  try {
      const result = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
          model: 'gpt-3.5-turbo',
          messages: [{role: 'user', content: `${prompt}`}],
          },
          { headers }
      );
      const botResponse = result.data.choices[0].message.content;
      // console.log(botResponse);
      return botResponse;
  } catch (err) {
      console.log(err);
  }
}

async function titleizeGPT(title, briefSummary, detailedDescription) {
  // console.log("IN TITLEIZE GPT")
  // console.log(title, briefSummary, detailedDescription);
  const headers = {
      'Authorization': `Bearer ${process.env.VERG_OPENAI_KEY}`
    };
  const prompt = TITLE_PROMPT + "\nTITLE: [" + title + "]\nTEXT1: [" + briefSummary + "]\nTEXT2: [" + detailedDescription + "]";
  try {
      const result = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
          model: 'gpt-3.5-turbo',
          messages: [{role: 'user', content: `${prompt}`}],
          },
          { headers }
      );
      const botResponse = result.data.choices[0].message.content;
      // console.log(botResponse);
      return botResponse;
  } catch (err) {
      console.log(err);
  }
}

function getInfo(req, res, next) {
    // console.log("IN MIDDLEWARE OF EDUCATIONAL COMPONENT - REQUEST PARAMS:")
    id = req.id
    userInfo = req.userInfo
    vh = req.vh
    type = req.type
    // console.log("type is " + type);
    next()
}


async function createClinicalTrialsString(fields) {
  // return new Promise((resolve) => {
    let expression = "";
    let conditions = [false, false, false]
    let healthConditions = "";

    // Health Condition Builder
    if (fields.ConditionText1 && fields.ConditionText1 != "") {
      healthConditions += "(" + fields.ConditionText1
      conditions[0] = true;
    }
    if (fields.ConditionText2 && fields.ConditionText2 != "") {
      if (!conditions[0])
        healthConditions += "("
      else 
        healthConditions += " OR "
      healthConditions += fields.ConditionText2
      conditions[1] = true
    }
    if (fields.ConditionText3 && fields.ConditionText3 != "") {
      if (!conditions[0] && !conditions[1]) 
        healthConditions += "("
      else 
        healthConditions += " OR "
        healthConditions += fields.ConditionText3
      conditions[2] = true
    }
    healthConditions
    if (!conditions[2] && (conditions[0] || conditions[1])) {
      expression += ") AND ";
    }
    if (conditions[0] || conditions[1] || conditions[2])
      healthConditions += ")";

    expression = "SEARCH[Location](AREA[LocationCountry] United States "; 
    if (fields.LocationState != "---") {
      expression += "AREA[LocationState] " + fields.LocationState + " AND ";
    }
    if (fields.LocationCity && fields.LocationCity != "") {
      expression += "AREA[LocationCity] " + fields.LocationCity + " AND ";
    }
    expression += "AREA[LocationStatus] Recruiting)";
    // Comment that Rashi said to include:
    // If a user put in Male or Female, we'll give them studies for Male or Female (and also studies that include all genders)
    // If a user put in Not listed or Prefer not to say, we'll just return all studies regardless of gender
    if (fields.Gender && (fields.Gender == "Male" || fields.Gender == "Female")) {
      expression += " AND SEARCH[Study](AREA[Gender] " + fields.Gender + " OR AREA[Gender] All)";
    }
    
    // Append the Health Conditinos to end depending on option.
    if (fields.HealthyVolunteer == "Accepts Healthy Volunteers") {
      expression += " AND SEARCH[Study](AREA[HealthyVolunteers] " + fields.HealthyVolunteer + ")";
    }
    else if (fields.HealthyVolunteer == "Both") {
      expression += " AND (SEARCH[Study](AREA[HealthyVolunteers] Accepts Healthy Volunteers) OR " + healthConditions + ")";
    }
    else if (fields.HealthyVolunteer == "No") {
      expression += " AND SEARCH[Study](AREA[HealthyVolunteers] " + fields.HealthyVolunteer + ") AND " + healthConditions;
    }

    return expression;
    // resolve(expression);
  // });
}

async function searchForCT(req, res, next) {
  // console.log("Starting search...");
  let expression = await createClinicalTrialsString(req.body);
  currentExpression = expression;
  if (currentExpression == lastExpression) {
    next();
    return;
  }
  const apiUrl = `https://clinicaltrials.gov/api/query/study_fields?expr=${expression}&fields=NCTId%2CBriefTitle%2COverallStatus%2CBriefSummary%2CDetailedDescription%2CCondition%2CStudyType%2CMaximumAge%2CMinimumAge%2CGender%2CInterventionType%2CHealthyVolunteers%2CCentralContactEMail%2CCentralContactName%2CLocationCountry%2CLocationState%2CLocationCity%2CLocationFacility&min_rnk=1&max_rnk=&fmt=json`;
  // const apiUrl = `https://clinicaltrials.gov/api/query/study_fields?expr=SEARCH[Study](AREA[NCTId] NCT03839940)&fields=NCTId%2CBriefTitle%2COverallStatus%2CBriefSummary%2CDetailedDescription%2CCondition%2CStudyType%2CMaximumAge%2CMinimumAge%2CGender%2CInterventionType%2CHealthyVolunteers%2CCentralContactEMail%2CCentralContactName%2CLocationCountry%2CLocationState%2CLocationCity%2CLocationFacility&min_rnk=1&max_rnk=&fmt=json`
  console.log(apiUrl);
  trialsList = await axios.get(apiUrl)
  .then(response => {
      var studies = response.data.StudyFieldsResponse.StudyFields
      // console.log(studies);
      let list = []
      // console.log(list)
      if (studies && studies.length > 0) {
        list = studies.filter(study => {
          let age = parseInt(req.body.Age)
          // console.log(age)
          let minNum = study.MinimumAge[0] ? parseInt(study.MinimumAge[0].replace(/[^0-9]/g, '')) : 0;
          let maxNum = study.MaximumAge[0] ? parseInt(study.MaximumAge[0].replace(/[^0-9]/g, '')) : 150;
          // console.log(minNum)
          return (age >= minNum && age <= maxNum)
        })
      } 
      return list
  })
  .catch(err => {
    console.error('Error in retrieving trials...: ', err.message, apiUrl);
  });

  if(trialsList && trialsList.length > 0) {
    if (trialsList.length > 5) {
      // Random Trial Added to End
      let randomInt = Math.floor(Math.random() * (trialsList.length - 1 - 5 + 1) + 5);
      let randomTrial = trialsList[randomInt];
      // console.log(randomInt);
      trialsList = trialsList.slice(0,5)
      trialsList.push(randomTrial);
    } 
    // console.log(trialsList[5]);
    // GETTING FACILITIES LIST -- loop through all trials
    for (var i = 0; i < trialsList.length; i++) {
      // remove duplications from InterventionType while we're here
      // console.log(trialsList[i].NCTId);
      // console.log(trialsList[i].InterventionType);
      trialsList[i].InterventionType = [...new Set(trialsList[i].InterventionType )];
      locationIndeces = [];
      facilities = []
      var remaining = -1;
      // get indeces of locations from cities array
      // If no city provided, we'll go by state, and if no state provided, we'll go by country (United States only)
      if (req.body.LocationCity && req.body.LocationCity != "") {
        // console.log(req.body.LocationCity);
        trialsList[i].LocationCity.forEach((city, index) => city === req.body.LocationCity ? locationIndeces.push(index) : null)
      }
      else if (req.body.LocationState && req.body.LocationState != "---") {
        // console.log(req.body.LocationState);
        trialsList[i].LocationState.forEach((state, index) => state === req.body.LocationState ? locationIndeces.push(index) : null)
      }
      else {
        // console.log(req.body.LocationCountry);
        for (var j = 0; j < trialsList[i].LocationCountry.length; j++) {
          locationIndeces.push(j);
        }
      }
      // condense down to 5 locations if more than 5
      if (locationIndeces.length > 5) {
        remaining = locationIndeces.length - 5;
        locationIndeces = locationIndeces.slice(0,5);
      }
      // iterate through indeces and extract those facilities from facilities array
      for (var j = 0; j < locationIndeces.length; j++) {
        facilities.push(trialsList[i].LocationFacility[locationIndeces[j]])
      }
      // set new property on trialsList for filtered facilities
      if (remaining != -1)
        trialsList[i]['RemainingFacilities'] = `... and ${remaining} other locations.`
      trialsList[i]['FilteredFacilities'] = facilities;      
    }
  }
  

  next()
}

module.exports = router