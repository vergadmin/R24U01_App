async function sendFormData(id) {
    console.log("IN SEND TO SERVER SEND FORM DATA")
    var htmlForm = document.getElementById(id)
    var formData = new FormData(htmlForm)
    console.log(Object.fromEntries(formData))
    let data = Object.fromEntries(formData)

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
    console.log("WE ARE IN RESULTS PAGE")
    console.log("SESSION STORAGE")
    console.log(sessionStorage)
    console.log(JSON.parse(sessionStorage.getItem('background-info')))
    console.log(JSON.parse(sessionStorage.getItem('preferences-info')))
}

async function getResults() {
    console.log("GOING TO SEARCH FOR CT")

    var userInfo = {...JSON.parse(sessionStorage.getItem('background-info')), ...JSON.parse(sessionStorage.getItem('preferences-info'))}

    let url = `/${sessionStorage.getItem("version")}/${sessionStorage.getItem("id")}/StudySearch/Results`;
    console.log(url)
    
    let res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userInfo),
    });
    if (res.ok) {
        console.log(res)
        window.location.href = res.url
    } else {
        return `HTTP error: ${res.status}`;
    }
}

