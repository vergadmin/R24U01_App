
function download() {
    window.open(`https://vpf2content.s3.amazonaws.com/Uploads/Videos/R24/pdfs/questions.pdf`, '_blank');
    sendToDatabase(`DownloadGuide`, `clicked`)
}

function copyLink() {
    let link = String(window.location).slice(0,-9)
    navigator.clipboard.writeText(link).then(function() {
        // alert("Copied the text: " + link);
        sendToDatabase(`ShareLink`, `clicked`);
        var button = document.getElementById("copyLink");
        button.innerHTML = "&#x2713; Link Copied!";
        button.style.backgroundColor = "green";
    }).catch(function(error) {
        // Error - handle the error here
        console.error('An error occurred while copying to clipboard:', error);
    });
    
}