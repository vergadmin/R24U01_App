window.addEventListener("load", () => {
    console.log("SESSION STORAGE", sessionStorage)
});

function validateAndSendFormData(id) {
    const form = document.getElementById(id);
    if (id === 'role-type') {
        const roleInput = form.querySelectorAll('input[type="radio"][name="Role"]');
        const roleSelected = Array.from(roleInput).find(button => button.checked);
        console.log("HERE")
        console.log(roleSelected)
        if (roleSelected) {
            sendFormData(id);
            window.location.href = `/${sessionStorage.id}/${sessionStorage.type}/${sessionStorage.vCHE}/StudySearch/Background`
        }
        else {
            if (!roleSelected) {
                if (!document.getElementById('role-info')) {
                    const roleLegend = document.querySelector('.role-legend');
                    const pElementRole = document.createElement('p');
                    pElementRole.textContent = "This field is required."
                    pElementRole.classList.add('small-text-red');
                    pElementRole.id = 'genroleder-info';
                    const roleInput = roleLegend.nextElementSibling;
                    roleInput.insertAdjacentElement('beforebegin', pElementRole);
                }
            }
            else {
                if (document.getElementById('role-info')) document.getElementById('role-info').remove();
            }        
        }
    } else if (id==='preferences') {
        const preferencesInput = form.querySelectorAll('input[type="radio"][name="Preferences"]');
        const preferencesSelected = Array.from(preferencesInput).find(button => button.checked);
        if (preferencesSelected) {
            sendFormData(id);
            var htmlForm = document.getElementById(id)
            var formData = new FormData(htmlForm)
            console.log(Object.fromEntries(formData))
            let data = Object.fromEntries(formData)
            if (data['Preferences'] === 'Search') {
                window.location.href = `/${sessionStorage.id}/${sessionStorage.type}/${sessionStorage.vCHE}/StudySearch/Diagnosis`
            } else {
                window.location.href = `/${sessionStorage.id}/${sessionStorage.type}/${sessionStorage.vCHE}/StudySearch/Groupings`
            }
        }
        else {
            if (!preferencesSelected) {
                if (!document.getElementById('preferences')) {
                    const roleLegend = document.querySelector('.preferences-legend');
                    const pElementRole = document.createElement('p');
                    pElementRole.textContent = "This field is required."
                    pElementRole.classList.add('small-text-red');
                    pElementRole.id = 'genroleder-info';
                    const roleInput = roleLegend.nextElementSibling;
                    roleInput.insertAdjacentElement('beforebegin', pElementRole);
                }
            }
            else {
                if (document.getElementById('preferences')) document.getElementById('preferences').remove();
            }        
        }
    }
    else {
        const ageInput = form.querySelector('#Age');
        const genderInputs = form.querySelectorAll('input[type="radio"][name="Gender"]');
        const ageValue = parseInt(ageInput.value); // Convert input value to integer

        const ageValid = !isNaN(ageValue) && ageValue >= 18 && ageValue <= 150;
        const genderSelected = Array.from(genderInputs).some(button => button.checked);

        if (ageValid && genderSelected) {
            // Redirect the user if inputs are valid
            sendFormData(id);
            window.location.href = `/${sessionStorage.id}/${sessionStorage.type}/${sessionStorage.vCHE}/StudySearch/Preferences`
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
                if (document.getElementById('gender-info')) document.getElementById('gender-info').remove();
            }        
        }
    }
}

async function sendFormData(id) {
    // console.log("IN SEND TO SERVER SEND FORM DATA")

    var htmlForm = document.getElementById(id)
    var formData = new FormData(htmlForm)
    let data

    if(id==='groupings-info') {
        const selectedCards = [];
        formData.forEach((value, key) => {
            selectedCards.push(value);
        });
        data = selectedCards.reduce((acc, cur) => ({ ...acc, [cur]: 'yes' }), {});
    } else {
        console.log(Object.fromEntries(formData))
        data = Object.fromEntries(formData)
    }

    console.log(data)
    

    sessionStorage.setItem(id, JSON.stringify(data))

    let url = '/updateDatabase';

    let res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    if (res.ok) {
        let ret = await res.json();
        return JSON.parse(ret.data);

    } else {
        return `HTTP error: ${res.status}`;
    }
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