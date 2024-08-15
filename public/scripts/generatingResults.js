window.addEventListener("load", () => {
    getResults();
});



async function getResults() {
    let id = sessionStorage.getItem("id") || "tempId";
    let type = sessionStorage.getItem("type") || "tempType";
    let vCHE = sessionStorage.getItem("vCHE") || "tempvCHE";
    var url = `/${id}/${type}/${vCHE}/StudySearch/Results`

    
    let res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
    });
    if (res.ok) {
        let ret = await res.json();
        var button = document.getElementById("results");
        var loadedTitle = document.getElementById("loaded-title");
        if (ret.numTrials === 0) {
            button.className = "green";
            button.innerText = "See Sponsored Study Results";
            button.disabled = false;
            button.style.backgroundColor = "#22884C"
            button.classList.add('pulse');

            loadedTitle.innerText = "We were unable to find any trials with your specified criteria. But we do have sponsored trials you can observe."

            document.getElementById("still-loading").innerText = "We were unable to find any trials with your specified criteria. You can try searching again with different conditions and preferences, if you'd like.";
            
            document.getElementById("noneHref").style.display = "block";
            document.getElementById("noneId").className = 'red';
            document.getElementById("noneId").disabled = false;
        }
        else {
            button.className = "green";
            button.innerText = "See Study Results";
            button.disabled = false;
            button.style.backgroundColor = "#22884C"
            button.classList.add('pulse');

            loadedTitle.innerText = "Your Results are Ready!"
            document.getElementById("still-loading").innerText = "Your results are ready! Please click the button below."
            // window.location.href = res.url
        }

    } else {
        return `HTTP error: ${res.status}`;
    }
}