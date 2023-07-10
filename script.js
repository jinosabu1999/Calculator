const buttons = document.querySelectorAll('button');
const display = document.querySelector('.display');
const warning = document.querySelector('.warning');
const alarmSound = new Audio('Beep Alarm.mp3');

const MAX_DISPLAY_LENGTH = 13;

buttons.forEach((button) => {
  button.addEventListener('click', (e) => {
    if (e.target.classList.contains('clear')) {
      display.textContent = '';
      hideWarning();
    } else if (e.target.classList.contains('equal')) {
      let result = eval(display.textContent);
      if (result.toString().length > MAX_DISPLAY_LENGTH) {
        result = result.toPrecision(MAX_DISPLAY_LENGTH);
      }
      display.textContent = result;
      hideWarning();
    } else if (e.target.classList.contains('delete')) {
      display.textContent = display.textContent.slice(0, -1);
      hideWarning();
    } else {
      const displayValue = display.textContent;
      const isOperator = /[/*\-+]/.test(displayValue[displayValue.length - 1]);

      const buttonValue = e.target.textContent;
      const isButtonOperator = /[/*\-+]/.test(buttonValue);

      if (displayValue.length >= 2 * MAX_DISPLAY_LENGTH) {
        return;
      }

      if (displayValue.length >= MAX_DISPLAY_LENGTH && !isOperator && !isButtonOperator) {
        showWarning();
        playAlarm();
        return;
      }

      if (displayValue.replace('.', '').length + buttonValue.length > MAX_DISPLAY_LENGTH) {
        return;
      }

      display.textContent += buttonValue;
      hideWarning();
    }
  });
});

function showWarning() {
  warning.style.display = 'block';
  warning.classList.add('animate-warning');
}

function hideWarning() {
  warning.style.display = 'none';
  warning.classList.remove('animate-warning');
}

function playAlarm() {
  alarmSound.play();
}
