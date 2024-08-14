const express = require('express')
const session = require('express-session');
const AWS = require('aws-sdk');
const router = express.Router()
var sql = require("mssql");
var axios = require("axios")
const OpenAI = require('openai')

// <--- openai constants
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY // This is the default and can be omitted
});


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

const ses = new AWS.SES({ apiVersion: '2010-12-01' });

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


const sponsoredList = [
  {
    "Title": "Cancer Prevention Research Study",
    "Categories": ["Healthy Living"],
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

router.get('/Role', (req, res) => {
  var id = req.session.params.id;
  var vh = req.session.params.vCHE;
  var interventionType = req.session.params.interventionType;
  res.render("pages/StudySearch/role", {id: id, vh: vh, interventionType: interventionType})
})

router.get('/Background', (req, res) => {
    var id = req.session.params.id;
    var vh = req.session.params.vCHE;
    var interventionType = req.session.params.interventionType;
    res.render("pages/StudySearch/background", {id: id, vh: vh, interventionType: interventionType})
})

router.get('/Preferences', (req, res) => {
  var id = req.session.params.id;
  var vh = req.session.params.vCHE;
  var interventionType = req.session.params.interventionType;
  res.render("pages/StudySearch/preferences", {id: id, vh: vh, interventionType: interventionType})
})

router.get('/Diagnosis', (req, res) => {
  var id = req.session.params.id;
  var vh = req.session.params.vCHE;
  var interventionType = req.session.params.interventionType;
  res.render("pages/StudySearch/diagnosis", {id: id, vh: vh, interventionType: interventionType})
})

router.get('/Groupings', (req, res) => {
  var id = req.session.params.id;
  var vh = req.session.params.vCHE;
  var interventionType = req.session.params.interventionType;
  res.render("pages/StudySearch/groupings", {id: id, vh: vh, interventionType: interventionType})
})

router.get('/Browse', (req, res) => {
  var id = req.session.params.id;
  var vh = req.session.params.vCHE;
  var interventionType = req.session.params.interventionType;
  res.render("pages/StudySearch/browse", {id: id, vh: vh, interventionType: interventionType})
})

router.get('/GeneratingResults', (req, res) => {
  var id = req.session.params.id;
  var vh = req.session.params.vCHE;
  var interventionType = req.session.params.interventionType;
  var vhType = req.session.params.vhType;
  res.render("pages/StudySearch/generatingResults", {id: id, vh: vh, vhType: vhType, interventionType: interventionType})
})


router.post('/Results', parameterHelper, searchForCT, CTsWithDatabase, (req, res) => {
  // All middleware have executed in order by this point
  // You can send the response here 
  res.send('Dummy Response after both functions.');
});


router.get('/Results', (req, res) => {
  var id = req.session.params.id;
  var vh = req.session.params.vCHE;
  var interventionType = req.session.params.interventionType;
  var role = req.session.params.searchCriteria.Role;
  console.log(role);

  var trialsList = req.session.trialsList;
  res.render("pages/StudySearch/results", {id: id, vh: vh, interventionType: interventionType, role: role, trialsList: trialsList, sponsoredList: sponsoredList})
})

router.post('/SendEmailPatient', SendEmailPatient, (req, res) => {
  console.log("SEND P");
  res.send('Email Sent Successfully - P');
});

router.post('/SendEmailCaregiver', SendEmailCaregiver, (req, res) => {
  console.log("SEND CG");
  res.send('Email Sent Successfully - CG');
});

async function SendEmailPatient (req, res, next) {
  const message = req.body.message;
  const subject = req.body.subject;
  const studyContact = req.body.studyContact;
  const patientEmail = String(req.body.patientEmail); // Ensure it's a string

  const params = {
    Source: 'reply-all@learn-research.org', // Must be verified in SES
    Destination: {
        ToAddresses: [studyContact],
        BccAddresses: ['etch@mayo.edu'] // The recipient's email address
    },
    ReplyToAddresses: [patientEmail],
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

async function SendEmailCaregiver (req, res, next) {
  const message = req.body.message;
  const subject = req.body.subject;
  const studyContact = String(req.body.studyContact); // Ensure it's a string
  const patientEmail = String(req.body.patientEmail); // Ensure it's a string

  const caregiverEmail = req.body.caregiverEmail;
  const params = {
    Source: 'reply-all@learn-research.org', // Must be verified in SES
    Destination: {
        ToAddresses: [studyContact],
        BccAddresses: ['etch@mayo.edu'], // The recipient's email address
        CcAddresses: [patientEmail]
    },
    ReplyToAddresses: [caregiverEmail],
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
              let queryString = `SELECT * FROM ClinicalTrials WHERE STUDYID='` + trialsList[i].NCTId + `'`;
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

                          // Convert summary into a SQL friendly string and put in trialsList
                          title = title.replace(/'/g, "''");
                          summary = summary.replace(/'/g, "''");
                          trialsList[i]['GPTTitle'] = title;
                          trialsList[i]['GPTSummary'] = summary;
                          let category = trialsList[i]['Categories'];
                          // Keep track of IDs already seen.
                          idTracker.push(trialsList[i].NCTId);
                          // Insert new entry into table
                          // Useful SQL Code to empty out table, greatly helped with debugging: TRUNCATE TABLE ClinicalTrials;
                          let updateString = `INSERT INTO ClinicalTrials (StudyID, GPTTitle, GPTSummary, Categories) VALUES ('` + trialsList[i].NCTId + `','` + title + `','` + summary + `','` + category + `')`;
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
  const prompt = SUMMARY_PROMPT + "\nTEXT1: [" + briefSummary + "]\nTEXT2: [" + detailedDescription + "]";
  try {
    const completion = await client.chat.completions.create({            model: 'gpt-3.5-turbo',
    messages: [{role: 'user', content: `${prompt}`}],
  });
    const botResponse = completion.choices[0].message.content;
    // console.log(botResponse);
    return botResponse;
  } catch (err) {
      console.log(err);
  }
}

async function titleizeGPT(title, briefSummary, detailedDescription) {
  const prompt = TITLE_PROMPT + "\nTITLE: [" + title + "]\nTEXT1: [" + briefSummary + "]\nTEXT2: [" + detailedDescription + "]";
  try {
      const completion = await client.chat.completions.create({            model: 'gpt-3.5-turbo',
      messages: [{role: 'user', content: `${prompt}`}],
    });
      const botResponse = completion.choices[0].message.content;
      // console.log(botResponse);
      return botResponse;
  } catch (err) {
      console.log(err);
  }
}

async function categorizeGPT (title, briefSummary, detailedDescription) {
  let prompt = `Classify the following clinical trial accurately using any number of the following categories: "Healthy Living", "Cancer Prevention & Screening", "Treatment", and "Survivorship." If the clinical trial does not fit into any of these four categories, classify it as "Other".
      
  Your output should be in JSON format only. The JSON object can be called "category", and its object should be an array.
  
  `

  prompt += title + "\n" + briefSummary + "\n" + detailedDescription;

  try {
      const completion = await client.chat.completions.create({            
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: {type: 'json_object'}
      });
      const categoryString = completion.choices[0].message.content;
      const categoryObject = JSON.parse(categoryString);
      const categoryArray = categoryObject.category;
      console.log(categoryArray);
      return categoryArray;
  } catch (err) {
      console.log(err);
  }

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
    let healthyString = "AREA[HealthyVolunteers] true";
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

    // Max results set to 50
    let maxResults = "&pageSize=50";
    expression += maxResults;
    
    expression = encodeURI(expression);
    return expression;
    // resolve(expression);
  // });
}

function parameterHelper(req, res, next) {
  console.log("IN HELPER");
  req.body = {};
  req.body = req.session.params.searchCriteria;
  next();
}

async function searchForCT(req, res, next) {
  // console.log("Starting search...");
  let expression = await createClinicalTrialsString(req.body);
  const apiUrl = `https://clinicaltrials.gov/api/v2/studies?${expression}&sort=%40relevance&countTotal=true`;
  console.log(req.body);
  var userCategories = req.body.groupings;
  console.log(userCategories);
  var categoriesArray = new Array(userCategories.length).fill(false);
  var trialsList;
  trialsList = await axios.get(apiUrl)
  .then(response => {
      var studies = response.data.studies;
      return studies;
  })
  .catch(err => {
    console.error('Error in retrieving trials...: ', err.message, apiUrl);
  });

  var finalTrialsList = [];
  
  if(trialsList && trialsList.length > 0) {
    // GETTING FACILITIES LIST -- loop through all trials
    for (var i = 0; i < trialsList.length; i++) {
      // console.log("CONTACTS LOCATIONS MODULE:", trialsList[i].protocolSection.contactsLocationsModule)
      finalTrialsList[i] = {};
      const armsInterventionsModule = trialsList[i].protocolSection.armsInterventionsModule;
      var interventions;
      if (armsInterventionsModule)
        if (armsInterventionsModule.interventions)
          interventions = armsInterventionsModule.interventions;
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
      var categories = await categorizeGPT(finalTrialsList[i]['BriefTitle'], finalTrialsList[i]['BriefSummary'], finalTrialsList[i]['DetailedDescription']);
      finalTrialsList[i]['Categories'] = categories;
      for (var j = 0; j < categories.length; j++) {
        let index = userCategories.indexOf(categories[j]);
        if (index !== -1) {
          categoriesArray[index] = true;
        }
      }
      if (i >= 15 && categoriesArray.includes(true)) {
        break;
      }
    }
  }
  // Get remaining falses
  // Return those somewhere and log em
  req.trialsList = finalTrialsList;
  next();
}

module.exports = router