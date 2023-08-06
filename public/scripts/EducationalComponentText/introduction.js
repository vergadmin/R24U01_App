// Expansion button
function expand() {
    console.log("here");
    var div = document.getElementById("intro");
    console.log(div);
    div.className = div.className.replace( /(?:^|\s)hidden(?!\S)/g , ' show');
    console.log(div);
}