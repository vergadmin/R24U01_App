var litlang = sessionStorage.getItem("literallanguage")

console.log("IN CHECK LANGUAGE: ", litlang)

if (litlang === 'es') {
    document.getElementById('spanish').style.display = 'block';
    document.getElementById('english').style.display = 'none';
}

if (litlang === 'en') {
    document.getElementById('spanish').style.display = 'none';
    document.getElementById('english').style.display = 'block';
}