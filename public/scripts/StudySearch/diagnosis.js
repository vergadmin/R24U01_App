
var present2 = false;
var present3 = false;

function addConditionRow(id) {
    document.getElementById(id).style.display = 'flex'
}

function removeConditionRow(id) {
    document.getElementById(id).style.display = 'none'
}

window.addEventListener("load", () => {
    const input1 = document.getElementById('Diagnosis1');
    const list1 = document.getElementById('conditions-list1');
    const input2 = document.getElementById('Diagnosis2');
    const list2 = document.getElementById('conditions-list2');
    const input3 = document.getElementById('Diagnosis3');
    const list3 = document.getElementById('conditions-list3');
    input1.value, input2.value, input3.value = "";
    lastLetter = "";
    
    // Autocomplete Feature
    input1.addEventListener('input', async () => {
            await retrieveConditions(input1, list1);
    });
    input1.addEventListener('keydown', function(event) {
        document.getElementById("add1").classList.remove("disabled")
        if(event.key === "Enter") { 
            event.preventDefault();
            list1.style.display = 'none';
        }
    });

    // Autocomplete Feature
    input2.addEventListener('input', async () => {
        await retrieveConditions(input2, list2);
    });
    input2.addEventListener('keydown', function(event) {
        if(event.key === "Enter") { 
            event.preventDefault();
            list2.style.display = 'none';
        }
    });

    // Autocomplete Feature
    input3.addEventListener('input', async () => {
        await retrieveConditions(input3, list3);
    });
    input3.addEventListener('keydown', function(event) {
    if(event.key === "Enter") { 
        event.preventDefault();
        list3.style.display = 'none';
    }
    });

    

    // Click outside of dropdown, closes menu.
    document.addEventListener('click', function(event) {
        // Hide the autocomplete list when clicking outside the input and list
        if (event.target !== input1 && event.target !== list1) {
          list1.style.display = 'none';
        }
        if (event.target !== input2 && event.target !== list2) {
            list2.style.display = 'none';
          }
          if (event.target !== input3 && event.target !== list3) {
            list3.style.display = 'none';
          }
    });
});

async function retrieveConditions(input, list) {
    const conditionText = input.value.toLowerCase();

    getResults(conditionText).then((result) => {
        list.innerHTML = "";
        if (result.length > 0) {
            list.style.display = '';
        } else {
            list.style.display = 'none';
        }
        for (var i = 0; i < result.length; i++) {
            var disease = result[i].bestMatch;
            if (disease === '') {
                disease = result[i].disease;
            }
            const listItem = document.createElement('li');
            listItem.textContent = disease;
            // listItem.name = "cities-list";
            (function(disease) {
                listItem.addEventListener('click', function() {
                    input.value = disease;
                    list.style.display = 'none'; // Hide the list after selecting an item
                });
            })(disease);
            
            list.appendChild(listItem);     
        }
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

async function getResults(conditionText) {
    let id = sessionStorage.getItem("id") || "tempId";
    let type = sessionStorage.getItem("type") || "tempType";
    let vCHE = sessionStorage.getItem("vCHE") || "tempvCHE";
    let url = `/${id}/${type}/RetrieveConditions`;
    // console.log(url)

    let data = {};
    data['conditionText'] = conditionText
    
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
