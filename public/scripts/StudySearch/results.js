// Get the email modal
var emailModal = document.getElementById("emailModal");


// Get the <span> element that closes the email modal
var emailCloseBtn = document.getElementsByClassName("close")[0];
var openModalEmail;
var openModalTitle;
var openModalNctId;
var openModalMessage;
// When the user clicks the button, open the email modal 
function openEmailModal(role, contactName, contactEmail, studyTitle, briefSummary, nctID) {
  console.log("here!")
  openModalEmail = contactEmail;
  openModalTitle = studyTitle;
  openModalNctId = nctID;
  emailModal.style.display = "flex";
  let patientText= `Hello, 

  I saw the following research study on the ALEX website. I am interested in participating and would like more information about the study and how to enroll.

  Title: ${studyTitle}
  NCT ID: ${nctID}

  AI-Generated Description I Read from ALEX: ${briefSummary}`

  let caregiverText= `Hello, 

  I saw the following research study on the ALEX website. I am the caregiver of someone who is interested in participating and would like more information about the study and how to enroll them.

  Title: ${studyTitle}
  NCT ID: ${nctID}

  AI-Generated Description I Read from ALEX: ${briefSummary}`

  var text
  if (role === 'Patient') {
    text = patientText
  } else {
    text = caregiverText
  }
    document.getElementById("message").value = text;
    openModalMessage =text;

    if (contactName && contactEmail !== null) {
      document.getElementById("coordinator-contact").innerHTML = contactName + ": " + contactEmail + " "
    } else {
      document.getElementById("coordinator-contact").style.display = none;
    }
}

// When the user clicks on <span> (x), close the email modal
emailCloseBtn.onclick = function() {
  emailModal.style.display = "none";
}

// When the user clicks anywhere outside of the email modal, close it
window.onclick = function(event) {
  if (event.target == emailModal) {
    emailModal.style.display = "none";
  }
}

async function emailPatient() {
  var patientName, patientEmail, caregiverName, caregiverEmail;
  if (document.getElementById("patientName")) {
    patientName = document.getElementById("patientName").value;
  }
  if (document.getElementById("patientEmail")) {
    patientEmail = document.getElementById("patientEmail").value;
  }
  var subject = "Requesting Information (NCTID: " + openModalNctId + ") " + openModalTitle; 

  let id = sessionStorage.getItem("id") || "dummyId";
  let type = sessionStorage.getItem("type") || "dummyType";
  let vCHE = sessionStorage.getItem("vCHE") || "dummyvCHE";
  let url =`/${id}/${type}/${vCHE}/StudySearch/SendEmailPatient`;
  let data = {
    message: openModalMessage,
    subject: subject,
    studyContact: "christopheryou32@gmail.com",
    patientEmail: patientEmail
  }
  console.log(data);
  let res = await fetch(url, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
  });

  if (res.ok) {
    let ret = await res.json();
    console.log(ret);
  }

}

async function emailCaregiver() {
  var patientName, patientEmail, caregiverName, caregiverEmail;
  if (document.getElementById("patientName")) {
    patientName = document.getElementById("patientName").value;
  }
  if (document.getElementById("patientEmail")) {
    patientEmail = document.getElementById("patientEmail").value;
  }

  if (document.getElementById("caregiverName")) {
    caregiverName = document.getElementById("caregiverName").value;
  }
  if (document.getElementById("caregiverEmail")) {
    caregiverEmail = document.getElementById("caregiverEmail").value;
  }
  var subject = "Requesting Information (NCTID: " + openModalNctId + ") " + openModalTitle; 

  let id = sessionStorage.getItem("id") || "dummyId";
  let type = sessionStorage.getItem("type") || "dummyType";
  let vCHE = sessionStorage.getItem("vCHE") || "dummyvCHE";
  let url =`/${id}/${type}/${vCHE}/StudySearch/SendEmailCaregiver`;

  let data = {
    message: openModalMessage,
    subject: subject,
    studyContact: "christopheryou32@gmail.com",
    patientEmail: patientEmail,
    caregiverEmail: caregiverEmail
  }
  console.log(data);

  let res = await fetch(url, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
  });
  
  if (res.ok) {
    let ret = await res.json();
    console.log(ret);
  }

}

// Handle submission of email
/*
var submitEmailButton = document.getElementById("submitEmailButton");
submitEmailButton.onclick = function() {
  if (contactName && contactEmail !== null) {
    document.getElementById("coordinator-contact").innerHTML = contactName + ": " + contactEmail + " "
  } else {
    document.getElementById("coordinator-contact").style.display = none;
  }
  // Perform any action with the entered email here, such as sending it to a server
  console.log("Submitted email:", emailInput);
  // Close the email modal after submission
  emailModal.style.display = "none";
}
  */