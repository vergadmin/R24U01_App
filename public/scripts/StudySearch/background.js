
var cities = [];
window.addEventListener("load", () => {
    const fieldset = document.getElementById('LocationState');
    const input = document.getElementById('LocationCity');
    const list = document.getElementById('cities-list');
    fieldset.selectedIndex = 0;
    input.disabled = true;
    input.value = "";
    fieldset.addEventListener('change', retrieveCities);
    


    // Autocomplete Feature
    input.addEventListener('input', function () {
        const searchText = input.value.toLowerCase();
        const matchedItems = cities.filter(item => item.toLowerCase().includes(searchText));
    
        list.innerHTML = ''

        if (matchedItems.length > 0) {
            list.style.display = 'block';
          } else {
            list.style.display = 'none';
          }
        

          var i = 0;
          matchedItems.forEach(item => {
            i++;
            const listItem = document.createElement('li');
            listItem.textContent = item;
            // listItem.name = "cities-list";
            listItem.addEventListener('click', function() {
              input.value = item;
              list.style.display = 'none'; // Hide the list after selecting an item
            });
            list.appendChild(listItem);
            if (i === 10) {
                return;
            }
            
          });
    });

    // Click outside of dropdown, closes menu.
    document.addEventListener('click', function(event) {
        // Hide the autocomplete list when clicking outside the input and list
        if (event.target !== input && event.target !== list) {
          list.style.display = 'none';
        }
    });
});





function retrieveCities(event) {
    const selectedState = event.target.value;
    state = selectedState;
    const input = document.getElementById('LocationCity');
    input.value = "";
    input.disabled = true;
    getResults(state).then((result) => {
        // console.log(result);
        cities = [];
        for (var i = 0; i < result.length; i++) {
            cities.push(result[i].name);
        }
        input.disabled = false;
        // console.log(cities);
    }).catch((error) => {
        console.error('Error:', error);
        res.status(500).json({error:'Failed to wait for promise.'});
    });
}


async function getResults(selectedState) {
    let url = `/${sessionStorage.getItem("id")}/${sessionStorage.getItem("type")}/RetrieveCities`;
    // console.log(url)

    let data = {};
    data['selectedState'] = selectedState
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
