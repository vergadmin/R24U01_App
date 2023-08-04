window.addEventListener("load", () => {
    console.log("SAVING SESSION INFO LOCALLY")
    console.log(document.URL)
    var type = document.URL.split('/').reverse()[0]
    var id = document.URL.split('/').reverse()[1]
    var version = document.URL.split('/').reverse()[2]
    console.log(id, version, type);
    console.log("SPLIT");
    console.log(document.URL.split('/').reverse());
    sessionStorage.setItem("id", id)
    sessionStorage.setItem("version", version)
    sessionStorage.setItem("type", type)
    console.log("IN GET INFO")
    // (B1) PARSE USER AGENT
    var result = bowser.getParser(navigator.userAgent).getResult();

    // (B2) BROWSER INFO
    console.log("BROWSER NAME + VERSION")
    let browserInfo = result.browser.name + " " + result.browser.version;
    console.log(browserInfo)

    // (B3) OPERATING SYSTEM
    console.log("OS NAME + VERSION")
    let osInfo = result.os.name + " " + result.os.version + " " + result.os.versionName;
    console.log(osInfo)

    // (B4) PLATFORM
    console.log("PLATFORM")
    let platform = result.platform.type;
    console.log(platform)

    console.log("TIME")
    let dateTime = new Date().toLocaleString() + " " + Intl.DateTimeFormat().resolvedOptions().timeZone;
    console.log(dateTime)

    sendGeneralData(browserInfo, osInfo, platform, dateTime)
});

async function sendGeneralData(browserInfo, osInfo, platform, dateTime) {
    console.log("IN SEND TO SERVER GENERAL DATA")

    let url = '/updateDatabase';
    let data = {
        'DateTime': dateTime,
        'BrowserInfo': browserInfo,
        'OsInfo': osInfo,
        'Platform': platform
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

async function sendVHData(column, value) {
    console.log("IN REGISTER CLICK FROM CLIENT")
    console.log(column + ": " + value)

    let url = '/updateDatabase';
    let data = {};
    data[column] = value
    console.log(data)

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

