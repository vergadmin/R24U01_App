
var present2 = false;
var present3 = false;
window.addEventListener("load", () => {
    const input1 = document.getElementById('ConditionText-1');
    const list1 = document.getElementById('conditions-list-1');
    const input2 = document.getElementById('ConditionText-2');
    const list2 = document.getElementById('conditions-list-2');  
    const input3 = document.getElementById('ConditionText-3');
    const list3 = document.getElementById('conditions-list-3'); 

    const add1 = document.getElementById('add-1');
    const add2 = document.getElementById('add-2');
    const remove2 = document.getElementById('remove-2');
    const remove3 = document.getElementById('remove-3');

    input1.addEventListener('input', () => retrieveConditions(input1, list1, true, false));
    input2.addEventListener('input', () => retrieveConditions(input2, list2, true, true));
    input3.addEventListener('input', () => retrieveConditions(input3, list3, false, true));
    input1.addEventListener('keydown', function(event) {
        if(event.key === "Enter") { 
            event.preventDefault();
            list1.style.display = 'none';
        }
    });
    input2.addEventListener('keydown',function(event) {
        if(event.key === "Enter") { 
            event.preventDefault();
            list2.style.display = 'none';
        }
    });
    input3.addEventListener('keydown',function(event) {
        if(event.key === "Enter") { 
            event.preventDefault();
            list3.style.display = 'none';
        }
    });

    add1.addEventListener('click', () => addButton(1));
    add2.addEventListener('click', () => addButton(2));

    remove2.addEventListener('click', () => removeButton(2));
    remove3.addEventListener('click', () => removeButton(3));

    if (input3.value && input3.value != "") {
        input1.style.display = ""
        input2.style.display = ""
        input3.style.display = ""
        remove3.style.display = "";
    }
    else if (input2.value && input2.value != "") {
        input1.style.display = ""
        input2.style.display = ""
        input3.style.display = "none"
        add2.style.display = "";
        remove2.style.display = "";
    }
    else if (input1.value && input1.value != "") {
        input1.style.display = ""
        input2.style.display = "none"
        input3.style.display = "none"
        add1.style.display = "";
    }



    // Autocomplete Feature

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

function addButton(num) {
    switch(num) {
        case 1: {
            const button1 = document.getElementById("add-1")
            button1.style.display = "none";
            const input2 = document.getElementById('ConditionText-2');
            input2.style.display = "";
            const button2r = document.getElementById("remove-2")
            button2r.style.display = "";
            present2 = true;
            break;
        }
        case 2: {
            const button2a = document.getElementById("add-2")
            button2a.style.display = "none";
            const button2r = document.getElementById("remove-2")
            button2r.style.display = "none";
            const input3 = document.getElementById('ConditionText-3');
            input3.style.display = "";
            const button3 = document.getElementById("remove-3");
            button3.style.display = "";
            present3 = true;
            break;
        }
    }
}

function removeButton(num) {
    const input2 = document.getElementById('ConditionText-2');
    const input3 = document.getElementById('ConditionText-3');
    const button2a = document.getElementById("add-2")
    const button2r = document.getElementById("remove-2")
    const button1 = document.getElementById("add-1")
    const button3 = document.getElementById("remove-3");
    switch(num) {
        case 2: 
            input2.value = "";
            input2.style.display = "none";
            button2a.style.display = "none";
            button2r.style.display = "none";
            button1.style.display = "";
            present2 = false;
            break;
        case 3:
            input3.value = "";
            input3.style.display = "none";
            button3.style.display = "none";
            button2r.style.display = "";
            button2a.style.display = "";
            present3 = false;
            break;
    }
}





function retrieveConditions(input, list, add, remove) {
    const conditionText = input.value.toLowerCase();
    if (conditionText === "") {
        if (add && !remove) {
            const button1 = document.getElementById("add-1")
            button1.style.display = "none";
        }
        if (add && remove) {
            const button2a = document.getElementById("add-2")
            button2a.style.display = "none";
        }
        list.style.display = "none";
        return;
    }
    // Input1
    if (add && !remove && !present2) {
        const button1 = document.getElementById("add-1")
        button1.style.display = "";
    }

    // Input2
    if (add && remove && !present3) {
        const button2a = document.getElementById("add-2")
        const button2r = document.getElementById("remove-2")
        button2a.style.display = "";
        button2r.style.display = "";
    }

    getResults(conditionText).then((result) => {
        list.innerHTML = "";
        if (result.length > 0) {
            list.style.display = '';
        } else {
            list.style.display = 'none';
        }
        for (var i = 0; i < result.length; i++) {
            var disease = result[i].diseases;
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
        console.error('Error:', error);
        res.status(500).json({error:'Failed to wait for promise.'});
    });
}


async function getResults(conditionText) {
    let url = `/${sessionStorage.getItem("id")}/${sessionStorage.getItem("type")}/RetrieveConditions`;
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
