window.addEventListener("load", () => {
    // console.log("SAVING SESSION INFO LOCALLY")
    // console.log(document.URL)

    let browserInfo = ""
    let dateTime = ""
    var type = document.URL.split('/').reverse()[0]
    var id = document.URL.split('/').reverse()[1]
    sessionStorage.setItem("id", id)
    sessionStorage.setItem("type", type)

    // (B1) PARSE USER AGENT
    browserInfo = navigator.userAgent;
    // console.log(browserInfo)

    // console.log("TIME")
    dateTime = new Date().toLocaleString() + " " + Intl.DateTimeFormat().resolvedOptions().timeZone;
    // console.log(dateTime)
    sendGeneralData(browserInfo, dateTime)

    
});

setTimeout(function() {
    document.getElementById("load").style.display = "none"
}, 1500); // 3000 milliseconds = 3 seconds

// Function to handle language change
function handleLanguageChange(mutationsList, observer) {
    mutationsList.forEach(mutation => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'lang') {
            console.log('Language changed to:', mutation.target.lang);
            sessionStorage.setItem("language", mutation.target.lang)
        }
    });
}

// Create a new MutationObserver to watch for changes to the lang attribute
const observer = new MutationObserver(handleLanguageChange);

// Start observing changes to the attributes of the root HTML element
observer.observe(document.documentElement, { attributes: true });

function googleTranslateElementInit() {
    new google.translate.TranslateElement({includedLanguages: "en,es", layout: google.translate.TranslateElement.InlineLayout}, 'google_translate_element')
}

async function sendGeneralData(browserInfo, dateTime) {
    // console.log("IN SEND TO SERVER GENERAL DATA")

    let url = '/updateDatabase';
    let data = {
        'DateTime': dateTime,
        'BrowserInfo': browserInfo,
    };

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
