window.addEventListener("load", () => {
    console.log("SESSION STORAGE")
    console.log(sessionStorage)
    
});

async function sendFormData(id) {
    console.log("IN SEND TO SERVER SEND FORM DATA")
    var htmlForm = document.getElementById(id)
    var formData = new FormData(htmlForm)
    console.log(Object.fromEntries(formData))
    let data = Object.fromEntries(formData)

    sessionStorage.setItem(id, JSON.stringify(data))
}

if(window.location.toString().indexOf("Results") != -1){
    console.log("WE ARE IN RESULTS PAGE")
    console.log("SESSION STORAGE")
    console.log(sessionStorage)
    console.log(JSON.parse(sessionStorage.getItem('background-info')))
    console.log(JSON.parse(sessionStorage.getItem('preferences-info')))
}

function copyEmailText(contactName, studyTitle, briefSummary) {
    console.log("IN COPY EMAIL TEXT")
    console.log(contactName)
    console.log(briefSummary)

    let text= `Hi ${contactName},

    My name is [YOUR NAME HERE]. I saw your study ${studyTitle} through the Research Studies section on the ALEX site. I’m interested in participating and would like more information. Here’s the description of your study that I read:
    
    ${briefSummary}
    
    
    Thank you,
    
    [YOUR NAME]
    
    [YOUR EMAIL]`

    console.log(text)

    alert("The following text was successfully copied!\n\n" + text)
}

async function getResults() {
    console.log("GOING TO SEARCH FOR CT")

    var userInfo = {...JSON.parse(sessionStorage.getItem('background-info')), ...JSON.parse(sessionStorage.getItem('preferences-info'))}

    let url = `/${sessionStorage.getItem("id")}/${sessionStorage.getItem("type")}/StudySearch/Results`;
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

