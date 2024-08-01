console.log(sessionStorage)
async function sendToDatabase(column, value) {
    // console.log("IN REGISTER CLICK FROM CLIENT")
    // console.log(column + ": " + value)
    console.log("IN SEND TO DATABSE")
    console.log(column, value)
    if (column === "vCHE") {
        sessionStorage.setItem("vCHE", value)
        if (value === 'swe' || value === 'mbe') {
            logCharacterToDB("VHType", "hf")
            if (value==='mbe') { storeCharacterInfoInServer("hf", "mbe") }
            if (value==='swe') { storeCharacterInfoInServer("hf", "swe") }
        }
        if (value === 'jke') {
            logCharacterToDB("VHType", "wf")
            storeCharacterInfoInServer("wf", "jke")
        }
        if (value === 'cre') {
            logCharacterToDB("VHType", "hm")
            storeCharacterInfoInServer("hm", "cre")
        }
        if (value === 'bfe') {
            logCharacterToDB("VHType", "bf")
            storeCharacterInfoInServer("bf", "bfe")
        }
        if (value === 'bme') {
            logCharacterToDB("VHType", "bm")
            storeCharacterInfoInServer("bm", "bme")
        }
        if (value === 'wme') {
            logCharacterToDB("VHType", "wm")
            storeCharacterInfoInServer("wm", "wme")
        }
        console.log(sessionStorage)
    }

    let url = '/updateDatabase';
    let data = {};
    data[column] = value
    // console.log(data)

    let res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    if (res.ok) {
        let ret = await res.json();
        return ret.message
    } else {
        return `HTTP error: ${res.status}`;
    }
}

async function logCharacterToDB(column, value) {
    console.log(column, value)
    sessionStorage.setItem(column, value)
    console.log(sessionStorage)

    let url = '/updateDatabase';
    let data = {};
    data[column] = value
    // console.log(data)

    let res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    if (res.ok) {
        let ret = await res.json();
        return ret.message
    } else {
        return `HTTP error: ${res.status}`;
    }
}

async function storeCharacterInfoInServer(VHType, vCHE) {
    let url = '/storeCharacterInfoInServer';
    let data = {};
    data["VHType"] = VHType
    data["vCHE"] = vCHE

    console.log("STORING CHARACTER INFO", data)

    let res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    if (res.ok) {
        console.log("WE R GOOD YAY!")
        let ret = await res.json();
        window.location.href=`/${sessionStorage.id}/${sessionStorage.type}/${vCHE}/EducationalComponent/Introduction`
    } else {
        return `HTTP error: ${res.status}`;
    }
}