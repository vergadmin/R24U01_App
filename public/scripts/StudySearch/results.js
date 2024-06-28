// Get the email modal
var emailModal = document.getElementById("emailModal");


// Get the <span> element that closes the email modal
var emailCloseBtn = document.getElementsByClassName("close")[0];

// When the user clicks the button, open the email modal 
function openEmailModal(contactName, contactEmail, studyTitle, briefSummary, nctID) {
  console.log("here!")
  emailModal.style.display = "flex";
  let text= `Hello, 

I saw the following research study on the ALEX website, and am interested in participating and would like more information.

Title: ${studyTitle}
NCT ID: ${nctID}

AI-Generated Description I Read: ${briefSummary}`
    document.getElementById("message").value = text;

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

// Handle submission of email
var submitEmailButton = document.getElementById("submitEmailButton");
submitEmailButton.onclick = function() {
  var emailInput = document.getElementById("emailInput").value;
  // Perform any action with the entered email here, such as sending it to a server
  console.log("Submitted email:", emailInput);
  // Close the email modal after submission
  emailModal.style.display = "none";
}