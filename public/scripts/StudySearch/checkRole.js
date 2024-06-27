console.log("IN CHECK ROLE")

console.log(sessionStorage)
var role = sessionStorage.getItem('Role')
console.log(role)
if (document.getElementById("background-info")) {
    console.log("BACKGROUND INFO EXISTS")
    if (role === 'Caregiver') {
        document.getElementById('background-description').innerHTML = `Please fill out the information below so we can find research studies <b>you might qualify for</b>.`
    } else {
        document.getElementById('background-description').innerHTML = `Please fill out the information below so we can find research studies <b>the person you're entering information for might qualify for</b>.`
    }
}