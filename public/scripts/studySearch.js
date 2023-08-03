async function sendFormData(id) {
    console.log("IN SEND TO SERVER SEND FORM DATA")
    var htmlForm = document.getElementById(id)
    var formData = new FormData(htmlForm)
    console.log(Object.fromEntries(formData))

    let url = '/updateDatabase';
    
    let data = Object.fromEntries(formData)

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