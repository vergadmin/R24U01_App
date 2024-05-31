// Get the email modal
var emailModal = document.getElementById("emailModal");


// Get the <span> element that closes the email modal
var emailCloseBtn = document.getElementsByClassName("close")[0];

// When the user clicks the button, open the email modal 
function openEmailModal(contactName, studyTitle, briefSummary) {
  console.log("here!")
  emailModal.style.display = "flex";
  let text= `Hi ${contactName},

My name is [YOUR NAME]. I saw your study ${studyTitle} through the Research Studies section on the ALEX site. I’m interested in participating and would like more information. Here’s the description of your study that I read:
  
${briefSummary}
  
Thank you,
  
[YOUR NAME]`
    document.getElementById("message").value = text;
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