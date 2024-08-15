async function sendToDatabase(column, value) {
    // console.log("IN REGISTER CLICK FROM CLIENT")
    // console.log(column + ": " + value)
    console.log("IN SEND TO DATABSE")
    console.log(column, value)
    if (column === "vCHE") {
        sessionStorage.setItem("vCHE", value)
        if (value === 'swe' || value === 'mbe') {
            await logCharacterToDB("VHType", "hf")
            if (value==='mbe') { await storeCharacterInfoInServer("hf", "mbe") }
            if (value==='swe') { await storeCharacterInfoInServer("hf", "swe") }
        }
        if (value === 'jke') {
            await logCharacterToDB("VHType", "wf")
            await storeCharacterInfoInServer("wf", "jke")
        }
        if (value === 'cre') {
            await logCharacterToDB("VHType", "hm");
            await storeCharacterInfoInServer("hm", "cre");
        }
        if (value === 'bfe') {
            await logCharacterToDB("VHType", "bf")
            await storeCharacterInfoInServer("bf", "bfe")
        }
        if (value === 'bme') {
            await logCharacterToDB("VHType", "bm")
            await storeCharacterInfoInServer("bm", "bme")
        }
        if (value === 'wme') {
            await logCharacterToDB("VHType", "wm")
            await storeCharacterInfoInServer("wm", "wme")
        }
        if (value === 'mbs') {
            await logCharacterToDB("VHType", "hf")
            await storeCharacterInfoInServer("hf", "mbs")
        }
        if (value === 'crs') {
            await logCharacterToDB("VHType", "hm")
            await storeCharacterInfoInServer("hm", "crs")
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
        var id = ret.id;
        var type = ret.vhType;
        if (type !== 'text') {
            window.location.href=`/${id}/${type}/${vCHE}/EducationalComponent/Introduction`
        }
    } else {
        return `HTTP error: ${res.status}`;
    }
}