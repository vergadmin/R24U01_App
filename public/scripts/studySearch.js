window.addEventListener("load", () => {
    console.log("SESSION STORAGE", sessionStorage)
    // const form = document.getElementById('background-info');
    // console.log(form)
    // const ageInput = form.querySelector('#Age');
    // // console.log(ageInput);
    // const ageValue = parseInt(ageInput.value); // Convert input value to integer
    // // console.log(ageValue);
});

function validateAndSendFormData(id) {
    // console.log("Here!");
    const form = document.getElementById('background-info');
    const ageInput = form.querySelector('#Age');
    const genderInputs = form.querySelectorAll('input[type="radio"][name="Gender"]');
    const ageValue = parseInt(ageInput.value); // Convert input value to integer
  
    const ageValid = !isNaN(ageValue) && ageValue >= 18 && ageValue <= 150;
    const genderSelected = Array.from(genderInputs).some(button => button.checked);

    if (ageValid && genderSelected) {
        // Redirect the user if inputs are valid
        sendFormData(id);
        window.location.href = `/${sessionStorage.id}/${sessionStorage.type}/StudySearch/Preferences`
    }
    else {
        if (!ageValid) {
            if (!document.getElementById('age-info')) {
                const ageLegend = document.querySelector('.age-legend');
                // console.log(ageLegend);
                const pElementAge = document.createElement('p');
                pElementAge.textContent = "This field is required."
                pElementAge.classList.add('small-text-red');
                pElementAge.id = 'age-info';
                // console.log(ageLegend.nextElementSibling);
                const ageInput = ageLegend.nextElementSibling;
                ageInput.insertAdjacentElement('beforebegin', pElementAge);
            }
        }
        else {
            if (document.getElementById('age-info'))
                document.getElementById('age-info').remove();
        }
        if (!genderSelected) {
            if (!document.getElementById('gender-info')) {
                const genderLegend = document.querySelector('.gender-legend');
                const pElementGender = document.createElement('p');
                pElementGender.textContent = "This field is required."
                pElementGender.classList.add('small-text-red');
                pElementGender.id = 'gender-info';
                const genderInput = genderLegend.nextElementSibling;
                genderInput.insertAdjacentElement('beforebegin', pElementGender);
            }
        }
        else {
            if (document.getElementById('gender-info'))
                document.getElementById('gender-info').remove();        }        
    
    }

}

async function sendFormData(id) {
    // console.log("IN SEND TO SERVER SEND FORM DATA")

    var htmlForm = document.getElementById(id)
    var formData = new FormData(htmlForm)
    // console.log(Object.fromEntries(formData))
    let data = Object.fromEntries(formData)

    sessionStorage.setItem(id, JSON.stringify(data))
}

if(window.location.toString().indexOf("Results") != -1){
    // console.log("WE ARE IN RESULTS PAGE")
    // console.log("SESSION STORAGE")
    // console.log(sessionStorage)
    // console.log(JSON.parse(sessionStorage.getItem('background-info')))
    // console.log(JSON.parse(sessionStorage.getItem('preferences-info')))
}

function copyEmailText(contactName, studyTitle, briefSummary) {
    // console.log("IN COPY EMAIL TEXT")
    // console.log(contactName)
    // console.log(briefSummary)

    let text= `Hi ${contactName},

    My name is [YOUR NAME HERE]. I saw your study ${studyTitle} through the Research Studies section on the ALEX site. I’m interested in participating and would like more information. Here’s the description of your study that I read:
    
    ${briefSummary}
    
    
    Thank you,
    
    [YOUR NAME]
    
    [YOUR EMAIL]`

    // console.log(text)

    // alert("The following text was successfully copied!\n\n" + text)

    navigator.clipboard.writeText(text).then(function() {
        // alert("Copied the text: " + link);
        var button = document.getElementById("copyLink");
        button.innerHTML = "&#x2713; Email Text Copied!";
        button.style.backgroundColor = "green";
    }).catch(function(error) {
        // Error - handle the error here
        console.error('An error occurred while copying to clipboard:', error);
    });
}

