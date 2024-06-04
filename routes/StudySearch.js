const express = require('express')
const session = require('express-session');
const AWS = require('aws-sdk');
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
// SUMMARY_PROMPT, MAX_TOKENS, & TEMPERATURE can be modified as needed.
// TODO: Move Summary Prompts into .env -- don't want any chance for user's to see prompt.
const COMPLETIONS_MODEL = process.env.COMPLETIONS_MODEL;
const SUMMARY_PROMPT = process.env.SUMMARY_PROMPT;
const TITLE_PROMPT = process.env.TITLE_PROMPT;
const MAX_TOKENS = 300
const MAX_TITLE_TOKENS = 50
const TEMPERATURE = 0
// open ai constants --->


AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

// TODO: You previously deleted these variables.
var id = ''
var vh = ''
var type = ''

var currentExpression = "";
var lastExpression = "";

const usStates = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", 
  "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", 
  "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", 
  "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", 
  "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", 
  "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
];

// Array of corresponding state abbreviations
const stateAbbreviations = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", 
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", 
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", 
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", 
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];


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

router.use(session({
  secret: process.env.SESSION_KEY,
  resave: false,
  saveUninitialized: true,
  rolling: true,
  cookie: {
      maxAge: 1000 * 60 * 15
  }
}));

router.get('/Role', getInfo, (req, res) => {
  res.render("pages/StudySearch/role", {id: id, vh: vh, type: type})
})

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
  var trialsList = req.session.trialsList;
  // console.log(trialsList);
  res.render("pages/StudySearch/results", {id: id, vh: vh, type: type, trialsList: trialsList, sponsoredList: sponsoredList})
})

router.get('/SendEmail', SendEmail, (req, res) => {
  res.send('Email Sent Successfully');
});

async function SendEmail(req, res, next) {
  const message = req.body.message;
  const subject = req.body.subject;
  const studyContact = req.body.studyContact;
  const userEmail = req.body.userEmail;

  const params = {
    Source: userEmail, // Must be verified in SES
    Destination: {
        ToAddresses: [studyContact],
        BccAddresses: ['mayo_email@mayo.gov'] // The recipient's email address
    },
    Message: {
        Subject: {
            Data: subject
        },
        Body: {
            Text: {
                Data: message
            }
        }
    }
  };

  try {
      const data = await ses.sendEmail(params).promise();
      console.log('Email sent:', data);
      next();
  } catch (err) {
      console.error('Failed to send email:', err);
      next();
  }
}


function CTsWithDatabase(req, res, next) {
  // The following function "processNext()" is a wrapper function so that the async calls made to
  // summarizeGPT don't return out of order -- it's a glorified for loop.
  // processNext() checks if we've already recorded the CT, if we have, retrieves it and stores in trialsList.GPTSummary
  // if we have not recorded it, it calls summarizeGPT, stores it in trialsList.GPTSummary and then inserts it into the ClinicalTrials table
  /*if (currentExpression == lastExpression) {
    next();
    return;
  }*/
  lastExpression = currentExpression;  
  var trialsList = req.trialsList;
  if (!trialsList || trialsList.length == 0) 
    trialsList = []
  let iterations = trialsList.length;
  let i = 0;
  // idTracker is a temp variable to make sure we have no duplicates stored in the table
  let idTracker = [];
  function processNext() { 
      if (i == trialsList.length) {
          req.session.trialsList = trialsList;
          next();
      }
      if (i < iterations) {
          // We do a sql.connect in every iteration of the loop because the table doesn't update until you disconnect and reconnect
          // Basically, I'm trying to avoid weird interactions with multiple users + it doesn't throttle speed a whole ton.
          
          sql.connect(config, function (err) {
              var request = new sql.Request();
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


async function createClinicalTrialsString_deprecated(fields) {
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


async function createClinicalTrialsString(fields) {
  // return new Promise((resolve) => {
    let conditionString = "query.cond=";
    let conditions = [false, false, false]
    // Health Condition Builder
    if (fields.ConditionText1 && fields.ConditionText1 != "") {
      conditionString += fields.ConditionText1;
      conditions[0] = true;
    }
    if (fields.ConditionText2 && fields.ConditionText2 != "") {
      if (conditions[0])
        conditionString += " OR ";
        conditionString += fields.ConditionText2
        conditions[1] = true;
    }
    if (fields.ConditionText3 && fields.ConditionText3 != "") {
      if (conditions[0] || conditions[1]) 
        conditionString += " OR ";
        conditionString += fields.ConditionText3
        conditions[2] = true;
    }

    // Gender Builder
    let genderString = "&query.term="
    let gender = false;
    if (fields.Gender && (fields.Gender == "Male" || fields.Gender == "Female")) {
      genderString += "AREA[Gender] " + fields.Gender + " OR AREA[Gender] All";
      gender = true;
    }

    // Location Builder
    let locationString = "&query.locn=AREA[LocationCountry] United States"
    let locationState = false;
    let locationCity = false;
    if (fields.LocationState != "---") {
      locationString += " AREA[LocationState] " + fields.LocationState;
      locationState = true;
    }
    if (fields.LocationCity && fields.LocationCity != "") {
      if (locationState)
        locationString += " AND AREA[LocationCity] " + fields.LocationCity;
      else
        locationString += " AREA[LocationCity] " + fields.LocationCity;
        locationCity = true;
    }

    // Advanced String
    let advancedString = "&filter.advanced="
    let age = false;
    if (fields.Age) {
      advancedString += "AREA[MinimumAge]RANGE[MIN, " + fields.Age + " years] AND AREA[MaximumAge]RANGE[" + fields.Age + " years, MAX]";
      age = true;
    }
    let healthyString = "AREA[HealthyVolunteers] yes"
    if (age) 
      advancedString += " AND " + healthyString;
    else 
      advancedString += healthyString;
    
    // Constants in String
    let recruitingString = "&filter.overallStatus=RECRUITING";
    
 
    // Build
    let expression = "";
    if (conditions.includes(true))
      expression += conditionString;
    if (gender)
      expression += genderString;
    // if (locationState || locationCity)
    expression += locationString;
    expression += advancedString;
    expression += recruitingString
    
    console.log("API String: " + expression);
    expression = encodeURI(expression)
    console.log("API URI: ", expression)
    return expression;
    // resolve(expression);
  // });
}

async function searchForCT(req, res, next) {
  // console.log("Starting search...");
  let expression = await createClinicalTrialsString(req.body);
  currentExpression = expression;
  /*
  if (currentExpression == lastExpression) {
    next();
    return;
  }*/
  const apiUrl = `https://clinicaltrials.gov/api/v2/studies?${expression}&sort=%40relevance&countTotal=true`;
  console.log("API URL: " + apiUrl);
  var trialsList;
  trialsList = await axios.get(apiUrl)
  .then(response => {
      var studies = response.data.studies;
      console.log("STUDIES LIST:", studies)
      return studies;
  })
  .catch(err => {
    console.error('Error in retrieving trials...: ', err.message, apiUrl);
  });

  var finalTrialsList = []
  if(trialsList && trialsList.length > 0) {
    // We're adding a random trial to make sure they get a good number of studies
    if (trialsList.length > 5) {
      // Random Trial Added to End
      let randomInt = Math.floor(Math.random() * (trialsList.length - 1 - 5 + 1) + 5);
      let randomTrial = trialsList[randomInt];
      trialsList = trialsList.slice(0,5)
      trialsList.push(randomTrial);
    } 
    
    // GETTING FACILITIES LIST -- loop through all trials
    for (var i = 0; i < trialsList.length; i++) {
      // console.log("CONTACTS LOCATIONS MODULE:", trialsList[i].protocolSection.contactsLocationsModule)
      finalTrialsList[i] = {};
      const interventions = trialsList[i].protocolSection.armsInterventionsModule.interventions;
      if (interventions)
        trialsList[i].InterventionType = [...new Set(interventions.map(intervention => intervention.type))];
      else 
        trialsList[i].InterventionType = ["Not listed"];
        finalTrialsList[i]['InterventionType'] = trialsList[i].InterventionType;
        locationIndeces = [];
        facilities = []
        facilityLocations = []
      var remaining = -1;
      var locationsArray = trialsList[i].protocolSection.contactsLocationsModule.locations;
      // get indeces of locations from cities array
      // If no city provided, we'll go by state, and if no state provided, we'll go by country (United States only)
      if (req.body.LocationCity && req.body.LocationCity != "") {
        for (var j = 0; j < locationsArray.length; j++) {
          if (locationsArray[j].city == req.body.LocationCity) {
            locationIndeces.push(j);
          }
        }
      }
      else if (req.body.LocationState && req.body.LocationState != "---") {
        for (var j = 0; j < locationsArray.length; j++) {
          if (locationsArray[j].state == req.body.LocationState) {
            locationIndeces.push(j);
          }
        }
      }
      else {
        for (var j = 0; j < locationsArray.length; j++) {
          if (locationsArray[j].country == "United States") {
            locationIndeces.push(j);
          }
        }
      }
      // condense down to 5 locations if more than 5
      if (locationIndeces.length > 5) {
        remaining = locationIndeces.length - 5;
        locationIndeces = locationIndeces.slice(0,5);
      }
      // iterate through indeces and extract those facilities from facilities array
      for (var j = 0; j < locationIndeces.length; j++) {
        facilities.push(locationsArray[locationIndeces[j]].facility);
        const stateIndex = usStates.indexOf(locationsArray[locationIndeces[j]].state);
        if (stateIndex !== -1)
          facilityLocations.push(locationsArray[locationIndeces[j]].city + ", " + stateAbbreviations[stateIndex]);
        else
          facilityLocations.push(locationsArray[locationIndeces[j]].city + ", " + locationsArray[locationIndeces[j]].state);

      }
      // set new property on trialsList for filtered facilities
      if (remaining != -1) {
        finalTrialsList[i]['RemainingFacilities'] = `... and ${remaining} other locations.`
      }
      finalTrialsList[i]['FilteredFacilities'] = facilities;
      finalTrialsList[i]['FacilityLocations'] = facilityLocations;
      if(trialsList[i].protocolSection.contactsLocationsModule.centralContacts) {
        finalTrialsList[i]['LocationContact'] = trialsList[i].protocolSection.contactsLocationsModule.centralContacts;
      } else {
        finalTrialsList[i]['LocationContact'] = [];
      }
      finalTrialsList[i]['Condition'] = trialsList[i].protocolSection.conditionsModule.conditions;
      finalTrialsList[i]['StudyType'] = trialsList[i].protocolSection.designModule.studyType;
      finalTrialsList[i]['BriefTitle'] = trialsList[i].protocolSection.identificationModule.briefTitle;
      finalTrialsList[i]['NCTId'] = trialsList[i].protocolSection.identificationModule.nctId;
      finalTrialsList[i]['BriefSummary'] = trialsList[i].protocolSection.descriptionModule.briefSummary;
      finalTrialsList[i]['DetailedDescription'] = trialsList[i].protocolSection.descriptionModule.detailedDescription;
    }
  }
  console.log(finalTrialsList.length);
  req.trialsList = finalTrialsList;
  next();
}

module.exports = router