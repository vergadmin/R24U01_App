window.addEventListener("load", () => {
    getResults();
});



async function getResults() {
    let id = sessionStorage.getItem("id") || "dummyId";
    let type = sessionStorage.getItem("type") || "dummyType";
    let vCHE = sessionStorage.getItem("vCHE") || "dummyvCHE";
    var url = `/${id}/${type}/${vCHE}/StudySearch/Results`

    
    let res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
    });
    if (res.ok) {
        // console.log(res);
        var button = document.getElementById("results");
        button.className = "green";
        button.innerText = "See Study Results";
        button.disabled = false;
        button.style.backgroundColor = "#22884C"
        button.classList.add('pulse');
        var loadedTitle = document.getElementById("loaded-title");
        loadedTitle.innerText = "Your Results are Ready!"
        document.getElementById("still-loading").innerText = "Your results are ready! Please click the button below."
        // window.location.href = res.url
    } else {
        return `HTTP error: ${res.status}`;
    }
}