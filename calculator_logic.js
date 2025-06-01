'use strict'; // Enforce stricter parsing and error handling in JavaScript

let calculationHistory = [];
const MAX_HISTORY_ITEMS = 15; // Limit the number of entries in calculation history

// Global arrays for debug logging - initialize only if window exists (browser)
if (typeof window !== 'undefined') {
    window.debug_tokens_log = [];
    window.debug_rpn_log = [];
}

// Clears the calculator display.
function clearDisplay() {
    document.getElementById('display').value = '';
    navigator.vibrate(50); // Vibration feedback
}

// Appends the given value to the calculator display.
function appendToDisplay(value) {
    const display = document.getElementById('display');
    display.value += value;
    navigator.vibrate(50); // Vibration feedback
}

// Removes the last character from the calculator display.
function backspace() {
    const display = document.getElementById('display');
    display.value = display.value.slice(0, -1);
    navigator.vibrate(50); // Vibration feedback
}

// Calculates the result of the expression in the display.
function calculateResult() {
    // Clear global debug logs at the beginning of a calculation
    if (typeof window !== 'undefined') {
        window.debug_tokens_log = [];
        window.debug_rpn_log = [];
    } else if (typeof global !== 'undefined' && global.window) { // For Node.js test mock
        global.window.debug_tokens_log = [];
        global.window.debug_rpn_log = [];
    }


    const display = document.getElementById('display');
    const expression = display.value;
    let result;

    try {
        result = evaluateExpression(expression);

        if (!String(result).startsWith('Error:') && expression.trim() !== '' && String(result) !== expression.trim()) {
            const historyEntry = `${expression} = ${result}`;
            calculationHistory.unshift(historyEntry);
            if (calculationHistory.length > MAX_HISTORY_ITEMS) {
                calculationHistory.pop();
            }
            updateHistoryDisplay();
        }

        display.value = result;

        if (String(result).startsWith('Error:')) {
            navigator.vibrate(100);
        }
    } catch (error) {
        console.error("Unexpected error in calculateResult:", error);
        display.value = 'Runtime Error';
        navigator.vibrate(100);
    }
}

function updateHistoryDisplay() {
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '';

    calculationHistory.forEach(entry => {
        const listItem = document.createElement('li');
        listItem.textContent = entry;
        listItem.addEventListener('click', () => {
            const display = document.getElementById('display');
            const expressionPart = entry.split('=')[0].trim();
            display.value = expressionPart;
            navigator.vibrate(30);
        });
        historyList.appendChild(listItem);
    });
}

function clearHistory() {
    calculationHistory = [];
    updateHistoryDisplay();
    navigator.vibrate(50);
}

function getPrecedence(op) {
    if (op === '+' || op === '-') return 1;
    if (op === '*' || op === '/') return 2;
    return 0;
}

function isOperator(token) {
    return ['+', '-', '*', '/'].includes(token);
}

function tokenize(expression) {
    expression = expression.replace(/\s+/g, '');
    expression = expression.replace(/(?<=^|[\(\+\-\*\/])\-(?=\d|\.)/g, 'N');

    const tokens = [];
    const regex = /(N\d+\.\d+|N\d+|\d+\.\d+|\d+|[+\-*/()])/g;
    let match;
    let lastIndex = 0;

    while ((match = regex.exec(expression)) !== null) {
        if (match.index > lastIndex) {
            return { error: 'Error: Invalid Chars' };
        }
        let token = match[0];
        if (!isOperator(token) && token !== '(' && token !== ')') {
            const isNegativeMarker = token.startsWith('N');
            const numPart = isNegativeMarker ? token.substring(1) : token;
            if (numPart === '' && isNegativeMarker) return { error: 'Error: Invalid Token' };
            if (isNaN(parseFloat(numPart))) { // Check if it's not a number at all
                 return { error: 'Error: Invalid Token' };
            }
            if ((numPart.match(/\./g) || []).length > 1) { // Check for multiple decimal points
                 return { error: 'Error: Invalid Token' };
            }
            // The check String(parseFloat(numPart)) !== numPart is removed as it fails for scientific notation representations
            // e.g. parseFloat("0.0000001") is 1e-7, String(1e-7) is "1e-7" which is not "0.0000001"
            // The previous two checks (isNaN, multiple decimals) should be sufficient for structural validity.
        }
        tokens.push(token);
        lastIndex = regex.lastIndex;
    }
    if (lastIndex < expression.length) {
        return { error: 'Error: Invalid Chars' };
    }
    if (tokens.length === 0 && expression.length > 0) return { error: 'Error: Invalid Chars' };
    return tokens;
}

function infixToRPN(tokens) {
    if (tokens.error) return tokens;

    if (tokens.length > 0 && tokens[0] === '-') {
        if (tokens.length === 1 || tokens[1] === '(' || (!isNaN(parseFloat(tokens[1])) && !tokens[1].startsWith('N')) ) {
            tokens.unshift("0");
        }
    }

    if (!tokens || tokens.length === 0) {
        return { error: 'Error: Invalid Chars' };
    }

    const outputQueue = [];
    const operatorStack = [];

    // Simplified initial token validation
    if (isOperator(tokens[0]) && tokens[0] !== '0') { // Allow '0' if it's the first token (e.g. "0-5")
         return { error: 'Error: Bad Sequence' };
    }
    if (tokens.length > 1 && isOperator(tokens[tokens.length - 1]) && tokens[tokens.length -1] !== ')') {
         return { error: 'Error: Bad Sequence' };
    }


    let lastTokenWasOperatorOrParen = true;

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        // Number handling (including N-prefixed and '0')
        if (token.startsWith('N') || !isNaN(parseFloat(token))) {
            let number;
            if (token.startsWith('N')) {
                number = parseFloat(token.substring(1)) * -1;
            } else {
                number = parseFloat(token);
            }
            outputQueue.push(number);
            lastTokenWasOperatorOrParen = false;
        } else if (isOperator(token)) {
            if (lastTokenWasOperatorOrParen && token !== '(') { // Added token !== '('
                 // Consecutive operators, unless previous was '('. e.g. "(*5)" is error.
                // This needs to be more nuanced for cases like "(0-5)" where "0" is processed, then "-"
                // If the previous token was '0' as part of (0-...), then an operator is fine.
                // Let's assume for now that `lastTokenWasOperatorOrParen` being true means an op cannot follow.
                // This might break (0-5) if '0' sets lastTokenWasOperatorOrParen to false. (It does)
                // So, if previous was a number (like '0'), lastTokenWasOperatorOrParen is false, so this check is skipped.
                // This check is for "++", "**", etc.
                return { error: 'Error: Bad Sequence' };
            }
            while (operatorStack.length > 0 &&
                   isOperator(operatorStack[operatorStack.length - 1]) &&
                   getPrecedence(operatorStack[operatorStack.length - 1]) >= getPrecedence(token)) {
                outputQueue.push(operatorStack.pop());
            }
            operatorStack.push(token);
            lastTokenWasOperatorOrParen = true;
        } else if (token === '(') {
            operatorStack.push(token);
            lastTokenWasOperatorOrParen = true;
        } else if (token === ')') {
            // Removed: `if(lastTokenWasOperatorOrParen && operatorStack.length > 0 && operatorStack[operatorStack.length-1] === '(')`
            // This was causing T18 "(()" to fail with Bad Sequence.
            // Proper "Mismatched ()" for incomplete expressions like "(", or "(()" is caught at the end.
            // An empty "()" will result in an empty RPN queue from infixToRPN, which evaluateRPN can handle.
            while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
                outputQueue.push(operatorStack.pop());
            }
            if (operatorStack.length === 0 || operatorStack[operatorStack.length - 1] !== '(') {
                return { error: 'Error: Mismatched ()' };
            }
            operatorStack.pop(); // Pop the '('
            lastTokenWasOperatorOrParen = false;
        } else {
            return { error: 'Error: Invalid Token' };
        }
    }

    while (operatorStack.length > 0) {
        const op = operatorStack.pop();
        if (op === '(') return { error: 'Error: Mismatched ()' };
        outputQueue.push(op);
    }

    // If RPN queue is empty but there were tokens (e.g. "()"), it's a bad sequence.
    if (outputQueue.length === 0 && tokens.length > 0) return { error: 'Error: Bad Sequence'};

    if (typeof window !== 'undefined') {
        window.debug_rpn_log.push(JSON.parse(JSON.stringify(outputQueue)));
    } else if (typeof global !== 'undefined' && global.window && global.window.debug_rpn_log) { // For Node.js test mock
        global.window.debug_rpn_log.push(JSON.parse(JSON.stringify(outputQueue)));
    }
    return { rpn: outputQueue };
}

function evaluateRPN(rpn) {
    const stack = [];
    if (rpn.length === 0) return { error: 'Error: Invalid RPN' }; // Handle empty RPN queue

    for (const token of rpn) {
        if (typeof token === 'number') {
            stack.push(token);
        } else if (isOperator(token)) {
            if (stack.length < 2) {
                return { error: 'Error: Invalid RPN' };
            }
            const b = stack.pop();
            const a = stack.pop();
            switch (token) {
                case '+': stack.push(a + b); break;
                case '-': stack.push(a - b); break;
                case '*': stack.push(a * b); break;
                case '/':
                    if (b === 0) return { error: 'Error: Div by 0' };
                    stack.push(a / b);
                    break;
                default: return { error: 'Error: Invalid RPN' };
            }
        } else {
            return { error: 'Error: Invalid RPN' };
        }
    }
    if (stack.length !== 1) {
        return { error: 'Error: Invalid RPN' };
    }
    return { result: stack[0] };
}

function evaluateExpression(expressionString) {
    if (expressionString === null || expressionString.trim() === '') return 'Error: Empty Input';

    const tokensResult = tokenize(expressionString);
    if (tokensResult.error) {
        if (typeof window !== 'undefined') {
            window.debug_tokens_log.push(JSON.parse(JSON.stringify(tokensResult)));
        } else if (typeof global !== 'undefined' && global.window && global.window.debug_tokens_log) { // For Node.js test mock
             global.window.debug_tokens_log.push(JSON.parse(JSON.stringify(tokensResult)));
        }
        return tokensResult.error;
    }
    if (typeof window !== 'undefined') {
        window.debug_tokens_log.push(JSON.parse(JSON.stringify(tokensResult)));
    } else if (typeof global !== 'undefined' && global.window && global.window.debug_tokens_log) { // For Node.js test mock
        global.window.debug_tokens_log.push(JSON.parse(JSON.stringify(tokensResult)));
    }

    if (tokensResult.length === 0 && expressionString.trim() !== '') {
        return 'Error: Invalid Chars';
    }

    const rpnResult = infixToRPN(tokensResult);
    if (rpnResult.error) {
        return rpnResult.error;
    }

    if (rpnResult.rpn && rpnResult.rpn.length === 0 && tokensResult.length > 0 && expressionString.trim() !== '()') {
         // "()" might validly produce empty RPN if we decide it's 0 or error at eval.
         // For other non-empty token sets leading to empty RPN, it's an issue.
        return 'Error: Bad Sequence';
    }

    const evaluationResult = evaluateRPN(rpnResult.rpn);
    if (evaluationResult.error) {
        return evaluationResult.error;
    }

    let finalResult = evaluationResult.result;
    // Use Number.EPSILON for a very small threshold.
    // Only zero out if it's extremely close to zero and not exactly zero.
    if (Math.abs(finalResult) < Number.EPSILON && finalResult !== 0) {
        finalResult = 0;
    } else if (String(finalResult).includes('.') && !String(finalResult).toLowerCase().includes('e')) {
        // Only apply .toFixed(8) if it's a standard decimal notation and has a long decimal part.
        // Avoids formatting "1e-14" into "0.00000000"
        const decimalPart = String(finalResult).split('.')[1];
        if (decimalPart && decimalPart.length > 8) {
            finalResult = parseFloat(finalResult.toFixed(8));
        }
    }
    return finalResult;
}

// --- End of Expression Evaluation Logic ---

function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    body.setAttribute('data-theme', newTheme);
    const themeIcon = document.getElementById('theme-icon');
    themeIcon.textContent = newTheme === 'light' ? '🌞' : '🌜';
    navigator.vibrate(50);
}

if (typeof document !== 'undefined') {
    document.addEventListener('keydown', function(event) {
        const key = event.key;
        let handled = true;

    if (key >= '0' && key <= '9') {
        appendToDisplay(key);
    }
    else if (['+', '-', '*', '/', '.', '(', ')'].includes(key)) {
        appendToDisplay(key);
    }
    else if (key === 'Enter' || key === '=') {
        calculateResult();
    }
    else if (key.toLowerCase() === 'c' || key === 'Escape') {
        clearDisplay();
    }
    else if (key === 'Backspace') {
        backspace();
    }
    else {
        handled = false;
    }

            if (handled) {
                event.preventDefault();
            }
        });
    }

if (typeof document !== 'undefined') {
    updateHistoryDisplay();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { evaluateExpression };
}
