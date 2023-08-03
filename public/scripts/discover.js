
function download() {
    window.open(`https://vpf2content.s3.amazonaws.com/Uploads/Videos/R24/pdfs/questions.pdf`, '_blank');
    sendToDatabase(`DownloadGuide`, `clicked`)
}

function copyLink() {
    let link = String(window.location).slice(0,-9)
    navigator.clipboard.writeText(link).then(function() {
        alert("Copied the text: " + link);
        sendToDatabase(`ShareLink`, `clicked`)
    });
}

async function sendToDatabase(column, value) {
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