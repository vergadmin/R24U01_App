window.addEventListener("load", () => {
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

    sendData(browserInfo, osInfo, platform, dateTime)
});

async function sendData(browserInfo, osInfo, platform, dateTime) {
    console.log("IN SEND TO SERVER REGISTER CLICK")

    let url = '/registerClick';
    let data = {
        'isFirst': true,
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

