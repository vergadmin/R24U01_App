window.addEventListener("load", () => {
    console.log("SESSION STORAGE", sessionStorage)
});

async function validateAndSendFormData(id) {
    const form = document.getElementById(id);
    if (id === 'role-type') {
        const roleInput = form.querySelectorAll('input[type="radio"][name="Role"]');
        const roleSelected = Array.from(roleInput).find(button => button.checked);
        if (roleSelected) {
            sessionStorage.setItem("role-type", roleSelected.value);
            var ret = await sendFormData(id);
            window.location.href = `/${ret.id}/${ret.type}/${ret.vCHE}/StudySearch/Background`
        }
        else {
            if (!roleSelected) {
                if (!document.getElementById('role-info')) {
                    const roleLegend = document.querySelector('.role-legend');
                    const pElementRole = document.createElement('p');
                    pElementRole.textContent = "*You must select your role to proceed."
                    pElementRole.classList.add('small-text-red');
                    pElementRole.id = 'role-info';
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
            var ret = await sendFormData(id);
            var htmlForm = document.getElementById(id)
            var formData = new FormData(htmlForm)
            sessionStorage.setItem("preferences", preferencesSelected.value);
            let data = Object.fromEntries(formData)
            if (data['Preferences'] === 'Search') {
                window.location.href = `/${ret.id}/${ret.type}/${ret.vCHE}/StudySearch/Diagnosis`
            } else {
                window.location.href = `/${ret.id}/${ret.type}/${ret.vCHE}/StudySearch/Groupings`
            }
        }
        else {
            if (!preferencesSelected) {
                if (!document.getElementById('preferences-info')) {
                    const preferenceLegend = document.querySelector('.preferences-legend');
                    const pElementPreference = document.createElement('p');
                    pElementPreference.textContent = "*You must select an option below to proceed."
                    pElementPreference.classList.add('small-text-red');
                    pElementPreference.id = 'preference-info';
                    const preferenceInput = preferenceLegend.nextElementSibling;
                    preferenceInput.insertAdjacentElement('beforebegin', pElementPreference);
                }
            }
            else {
                if (document.getElementById('preferences-info')) document.getElementById('preferences-info').remove();
            }        
        }
    }
    else {
        const ageInput = form.querySelector('#Age');
        const genderInputs = form.querySelectorAll('input[type="radio"][name="Gender"]');
        const ageValue = parseInt(ageInput.value); // Convert input value to integer

        const ageValid = !isNaN(ageValue) && ageValue >= 18 && ageValue <= 150;
        const genderSelected = Array.from(genderInputs).some(button => button.checked);
        const stateSelected = document.getElementById("LocationState").value === '---' ? false : true
        const citySelected = document.getElementById("LocationCity").value === '' ? false : true
        console.log(document.getElementById("LocationCity").value)

        console.log(stateSelected)
        console.log(citySelected)


        if (ageValid && genderSelected && stateSelected && citySelected) {
            // Redirect the user if inputs are valid
            var ret = await sendFormData(id);
            console.log("The ID IS : ", id);
            window.location.href = `/${ret.id}/${ret.type}/${ret.vCHE}/StudySearch/Preferences`
        }
        else {
            if (!ageValid) {
                if (!document.getElementById('age-info')) {
                    const ageLegend = document.querySelector('.age-legend');
                    // console.log(ageLegend);
                    const pElementAge = document.createElement('p');
                    pElementAge.textContent = "*This field is required."
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
                    pElementGender.textContent = "*This field is required."
                    pElementGender.classList.add('small-text-red');
                    pElementGender.id = 'gender-info';
                    const genderInput = genderLegend.nextElementSibling;
                    genderInput.insertAdjacentElement('beforebegin', pElementGender);
                }
            }
            else {
                if (document.getElementById('gender-info')) document.getElementById('gender-info').remove();
            }        
            if (!stateSelected) {
                if (!document.getElementById('state-info')) {
                    const stateLegend = document.querySelector('.state-legend');
                    const pElementState = document.createElement('p');
                    pElementState.textContent = "*This field is required."
                    pElementState.classList.add('small-text-red');
                    pElementState.id = 'state-text';
                    const stateInput = stateLegend.nextElementSibling;
                    stateInput.insertAdjacentElement('beforebegin', pElementState);
                }
            }
            else {
                if (document.getElementById('state-info')) document.getElementById('state-info').remove();
            }        
            if (!citySelected) {
                if (!document.getElementById('city-info')) {
                    const cityLegend = document.querySelector('.city-legend');
                    const pElementCity = document.createElement('p');
                    pElementCity.textContent = "*This field is required."
                    pElementCity.classList.add('small-text-red');
                    pElementCity.id = 'city-text';
                    const cityInput = cityLegend.nextElementSibling;
                    cityInput.insertAdjacentElement('beforebegin', pElementCity);
                }
            }
            else {
                if (document.getElementById('city-info')) document.getElementById('city-info').remove();
            }        
        }
    }
}

async function sendFormData(id) {
    // console.log("IN SEND TO SERVER SEND FORM DATA")
    var htmlForm = document.getElementById(id)
    var formData;
    if (id !== "no-info") {
        formData = new FormData(htmlForm);
    } 
    let data;

    console.log(formData);

    if(id==='groupings-info') {
        const selectedCards = [];
        formData.forEach((value, key) => {
            selectedCards.push(value);
        });
        data = selectedCards.reduce((acc, cur) => ({ ...acc, [cur]: 'yes' }), {});
        const pref = sessionStorage.getItem('preferences');
        if (pref === 'Search') {
            console.log("User is Searching");
        }
        if (pref === 'Browse') {
            console.log("User is browsing");
            let id = sessionStorage.getItem("id") || "dummyId";
            let type = sessionStorage.getItem("type") || "dummyType";
            let vCHE = sessionStorage.getItem("vCHE") || "dummyvCHE";
            window.location.href = `/${id}/${type}/${vCHE}/StudySearch/Browse`
        }
    } 
    else if (id === 'browse-info') {
        const selectedConditions = [];
        const conditionText = ['ConditionText1', 'ConditionText2', 'ConditionText3'];
        const conditions = {};

        formData.forEach((value, key) => {
            const index = selectedConditions.length;
            if (index < conditionText.length) {
                conditions[conditionText[index]] = value;
            }
            selectedConditions.push(value);
        })
        data = conditions;
    }

    else if (id === 'background-info') {
        data = Object.fromEntries(formData)
        data['FLAG'] = true;

    }
    else if (id === "no-info") {
        data = {};
    }
    else if (id === 'diagnosis-info') {
        const selectedConditions = [];
        const conditionText = ['ConditionText1', 'ConditionText2', 'ConditionText3'];
        const conditions = {};

        formData.forEach((key, value) => {
            if (key != "") {
                const index = selectedConditions.length;
                console.log(key);
                console.log(value);
                if (index < conditionText.length) {
                    conditions[conditionText[index]] = key;
                }
                selectedConditions.push(key);
            }
        })
        data = conditions;
    }
    else {
        console.log(Object.fromEntries(formData))
        data = Object.fromEntries(formData)
    }


    
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
        var userId = ret.id;
        var type = ret.type;
        var vCHE = ret.vCHE;
        if (id === "browse-info" || id == "no-info") {
            window.location.href = `/${userId}/${type}/${vCHE}/StudySearch/GeneratingResults`
        }
        else if (id === "diagnosis-info") {
            window.location.href = `/${userId}/${type}/${vCHE}/StudySearch/Groupings`
        }
        else if (id === "groupings-info") {
            if (sessionStorage.getItem("preferences")) {
                const pref = sessionStorage.getItem('preferences');
                if (pref === 'Search') {
                    console.log("User is Searching");
                    let id = sessionStorage.getItem("id") || "dummyId";
                    let type = sessionStorage.getItem("type") || "dummyType";
                    let vCHE = sessionStorage.getItem("vCHE") || "dummyvCHE";
                    window.location.href = `/${id}/${type}/${vCHE}/StudySearch/GeneratingResults`
                }
            }
        }
        else {

        }
        return ret;
    } else {
        return `HTTP error: ${res.status}`;
    }
}

async function search() {
    // Because we've stored all of the variables in session we can send a flag here.
    
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
        const url = "/SendError";
        let res = fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({error}),
        });
        console.error('An error occurred while copying to clipboard:', error);
    });
}