
const steps = document.querySelectorAll('.step');
let currentStep = 1;

const activateStep = (stepNumber) => {
    steps.forEach((step, index) => {
        if (index < stepNumber) {
            step.classList.add('active');
            step.querySelector('.bullet').classList.add('active');
        } else {
            step.classList.remove('active');
            step.querySelector('.bullet').classList.remove('active');
        }
    });
};