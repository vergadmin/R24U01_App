function sendCategoryInfo() {
    const form = document.getElementById('groupings-info');
    const formData = new FormData(form);
    const selectedCards = [];
    formData.forEach((value, key) => {
        selectedCards.push(value);
    });
    console.log('Selected cards:', selectedCards);
    const cardsObject = selectedCards.reduce((acc, cur) => ({ ...acc, [cur]: 'yes' }), {});
    console.log(cardsObject);
}

document.addEventListener('DOMContentLoaded', (event) => {
    console.log("IN HERE")
    function limitCheckboxSelection() {
        const checkboxes = document.querySelectorAll('.browse-card input[type="checkbox"]');
        const maxSelections = 3;
        
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const checkedCount = document.querySelectorAll('.browse-card input[type="checkbox"]:checked').length;
                if (checkedCount > maxSelections) {
                    checkbox.checked = false;
                    alert('You may only select a maximum of ' + maxSelections + ' conditions.');
                }
            });
        });
    }

    // Call the function to apply the limit
    limitCheckboxSelection();
});
