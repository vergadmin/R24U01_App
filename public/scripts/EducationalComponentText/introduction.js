// Expansion button
function expand() {
    var div = document.getElementById("intro");
    div.className = div.className.replace( /(?:^|\s)hidden(?!\S)/g , ' show');
}