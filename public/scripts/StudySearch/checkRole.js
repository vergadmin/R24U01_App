var role = sessionStorage.getItem('role-type')
console.log(role)
if (document.getElementById("background-info")) {
    console.log("BACKGROUND INFO EXISTS")
    if (role === 'Patient') {
        document.getElementById('background-description').innerHTML = `Please fill out the information below so we can find research studies <b>you might qualify for</b>.`
    } else {
        document.getElementById('background-description').innerHTML = `Please fill out the information below so we can find research studies <b>the person you're entering information for might qualify for</b>.`
    }
}

if (document.getElementById("preferences-description")) {
    if (role === 'Patient') {
        document.getElementById('preferences-description').innerHTML = `First, do you have a <b>specific diagnosis</b> in mind?`
    } else {
        document.getElementById('preferences-description').innerHTML = `First, is there a <b>specific diagnosis</b> for the person you are searching for?`
    }
}

if (document.getElementById("diagnosis-description")) {
    if (role === 'Patient') {
        document.getElementById('diagnosis-description').innerHTML = `Please enter <b>up to 3</b> diagnoses you'd like to search for.`
    } else {
        document.getElementById('diagnosis-description').innerHTML = `Please enter <b>up to 3</b> diagnoses for the person you are searching for.`
    }
}

if (document.getElementById("results-page")) {
    if (role === 'Patient') {
        document.getElementById('preferences-description').innerHTML = `Please fill out the information below so we can find research studies <b>you might qualify for</b>.`
    } else {
        document.getElementById('preferences-description').innerHTML = `Please fill out the information below so we can find research studies <b>the person you're entering information for might qualify for</b>.`
    }
}

if (document.getElementById("groupings")) {
    console.log(sessionStorage.preferences)
    if (sessionStorage.preferences === "Browse") {
        console.log(document.getElementById("back-link").href)
        document.getElementById("back-link").href = document.getElementById("back-link").href + "Preferences"
    } else {
        document.getElementById("back-link").href = document.getElementById("back-link").href +  "Diagnosis"
    }
}



