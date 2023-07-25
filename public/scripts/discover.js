
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