window.addEventListener("load", () => {
    getResults();
});

async function getResults() {
    // console.log("GOING TO SEARCH FOR CT")

    var userInfo = {...JSON.parse(sessionStorage.getItem('background-info')), ...JSON.parse(sessionStorage.getItem('preferences-info'))}

    let url = `/${sessionStorage.getItem("id")}/${sessionStorage.getItem("type")}/StudySearch/Results`;
    // console.log(url)
    
    let res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userInfo),
    });
    if (res.ok) {
        // console.log(res);
        var button = document.getElementById("results");
        button.className = "enabled enabled-hover";
        button.innerText = "See Study Results";
        button.disabled = false;
        var disabledText = document.getElementById("disabled-text");
        disabledText.innerText = "Your tailored list of trials are ready. Press the button below to see your list!"
        // window.location.href = res.url
    } else {
        return `HTTP error: ${res.status}`;
    }
}
