var lang = sessionStorage.getItem("language")

console.log("IN CHECK LANGUAGE: ", lang)

function googleTranslateElementInit() {
    new google.translate.TranslateElement({pageLanguage: lang}, 'google_translate_element');
}

setTimeout(function() {
    document.getElementById("load").style.display = "none"
}, 1500); // 3000 milliseconds = 3 seconds