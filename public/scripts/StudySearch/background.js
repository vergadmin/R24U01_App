
var cities = [];
var lastLetter = "";
window.addEventListener("load", () => {
    const fieldset = document.getElementById('LocationState');
    const input = document.getElementById('LocationCity');
    const list = document.getElementById('cities-list');
    fieldset.selectedIndex = 0;
    input.disabled = true;
    input.value = "";
    lastLetter = "";
    fieldset.addEventListener('change', function() {
        input.disabled = false;
    });
    
    // Autocomplete Feature
    input.addEventListener('input', async () => {
        if (input.value === "") {
            lastLetter = "";
            list.innerHTML = '';
            list.style.display = 'none'; 
            return;
        }
        if (lastLetter != input.value[0]) {
            await retrieveCities(input, fieldset);
        }
        
        // console.log(cities[0])
        lastLetter = input.value[0];

        const cityVal = input.value.toLowerCase();
        const maxResults = 10; // Maximum number of results
        let count = 0;
        
        const filteredValues = [];
        
        for (const key in cities[0]) {
            // console.log(count)
            if (count >= maxResults) {
                break;
            }
            // console.log(cities[0][key])
            if(cities[0][key] && ((cities[0][key]).toLowerCase()).startsWith(cityVal)) {
                filteredValues.push(cities[0][key]);
                count++;
            }
        }

        list.innerHTML = ''
        filteredValues.forEach(item => {
            const listItem = document.createElement('li');
            listItem.textContent = item;
            // listItem.name = "cities-list";
            listItem.addEventListener('click', function() {
                input.value = item;
                list.style.display = 'none'; // Hide the list after selecting an item
            });
            list.appendChild(listItem);
            
        });
        list.style.display = "";
    });

    // Click outside of dropdown, closes menu.
    document.addEventListener('click', function(event) {
        // Hide the autocomplete list when clicking outside the input and list
        if (event.target !== input && event.target !== list) {
          list.style.display = 'none';
        }
    });
});


async function retrieveCities(city, state) {
    let cityVal = city.value;
    let stateVal = state.value;
    await getResults(cityVal, stateVal).then((result) => {
        console.log(result);
        cities = result;
    }).catch((error) => {
        const url = "/SendError";
        let rev = fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({error}),
        });
        console.error('Error:', error);
        res.status(500).json({error:'Failed to wait for promise.'});
    });
}


async function getResults(cityVal, stateVal) {
    let id = sessionStorage.getItem("id") || "tempId";
    let type = sessionStorage.getItem("type") || "tempType";
    
    let url = `/${id}/${type}/RetrieveCities`;
    // console.log(url)

    let data = {};
    data['stateVal'] = stateVal
    data['cityVal'] = cityVal
    // console.log(data['selectedState']);
    
    let res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    if (res.ok) {
        let ret = await res.json();
        return ret;
    } else {
        return `HTTP error: ${res.status}`;
    }
}
