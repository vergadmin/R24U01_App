console.log("IN CHECK ROLE")

console.log(sessionStorage)
var role = sessionStorage.getItem('Role')
console.log(role)
if (document.getElementById("background-info")) {
    console.log("BACKGROUND INFO EXISTS")
    if (role === 'Caregiver') {
        document.getElementById('age-text').innerHTML = `&nbsp; How old is your loved one? <span class="red-validator">*</span> &nbsp;`
        document.getElementById('gender-text').innerHTML = `&nbsp; What is the gender of your loved one? <span class="red-validator">*</span> &nbsp;`
        document.getElementById('state-text').innerHTML = "&nbsp; What state is your loved one located in? &nbsp;"
        document.getElementById('city-text').innerHTML = "&nbsp; What city is your loved one located in? &nbsp;"
    }
}