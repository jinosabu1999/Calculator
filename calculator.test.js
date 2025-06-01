const { evaluateExpression } = require('./calculator_logic.js');

let testsPassed = 0;
let testsFailed = 0;

// Mocking browser-specific elements not available in Node.js
// These are used by functions like clearDisplay, appendToDisplay, etc., but not by evaluateExpression directly.
// However, calculator_logic.js might have some global scope code that could try to access them.
// For robust unit testing of evaluateExpression, such dependencies should ideally be refactored.
// For now, providing simple mocks if evaluateExpression itself doesn't directly call them.
global.document = {
    getElementById: (id) => {
        // console.log(`Mock document.getElementById called for ${id}`);
        if (id === 'display') {
            return { value: '' }; // Mock display element
        }
        return null;
    },
    body: { // Mock body for theme toggling or other body operations
        setAttribute: () => {},
        getAttribute: () => {}
    },
    addEventListener: () => {} // Mock event listener
};

global.navigator = {
    vibrate: () => {} // Mock navigator.vibrate
};

// Mock global arrays used for debug logging within calculator_logic.js if they are accessed globally
// evaluateExpression itself does not write to them, but other functions might.
// For evaluateExpression unit tests, these are not strictly needed unless there's global leakage.
global.window = {
    debug_tokens_log: [],
    debug_rpn_log: []
};


function runTest(id, expression, expected) {
    // Reset debug logs for each specific test run of evaluateExpression
    global.window.debug_tokens_log = [];
    global.window.debug_rpn_log = [];

    const actual = evaluateExpression(expression);
    // Convert actual to string for comparison, as expected values are strings.
    // This handles cases where actual is a number (e.g., 2) and expected is a string (e.g., "2").
    if (String(actual) === expected) {
        console.log(`Test ${id}: PASSED - "${expression}" -> "${actual}"`);
        testsPassed++;
    } else {
        console.error(`Test ${id}: FAILED - "${expression}" -> Expected: "${expected}", Actual: "${actual}"`);
        // Log debug info from the calculator_logic module for this specific run
        console.error(`  Tokens Log: ${JSON.stringify(global.window.debug_tokens_log)}`);
        console.error(`  RPN Log: ${JSON.stringify(global.window.debug_rpn_log)}`);
        testsFailed++;
    }
}

console.log("--- Running Unit Tests for evaluateExpression ---");

runTest("UT01", "1+1", "2");
runTest("UT02", "5-2", "3");
runTest("UT03", "3*4", "12");
runTest("UT04", "8/2", "4");
runTest("UT05", "1+2*3", "7");
runTest("UT06", "8-4/2", "6");
runTest("UT07", "(1+2)*3", "9");
runTest("UT08", "10/(2+3)", "2");
runTest("UT09", "1.5+2.5", "4");
runTest("UT10", "0.1*0.2", "0.02");
runTest("UT11", "-5+2", "-3");
runTest("UT12", "5*-2", "-10");
runTest("UT13", "5*(-2)", "-10");
runTest("UT14", "-(3+2)", "-5");
runTest("UT15", "1++2", "Error: Bad Sequence");
runTest("UT16", "/3", "Error: Bad Sequence");
runTest("UT17", "4*", "Error: Bad Sequence");
runTest("UT18", "(()", "Error: Mismatched ()");
runTest("UT19", "1.2.3+4", "Error: Invalid Chars");
runTest("UT20", "1/0", "Error: Div by 0");
runTest("UT21", "0/0", "Error: Div by 0");
runTest("UT22", "0*5", "0");
runTest("UT23", "5", "5");
runTest("UT24", "", "Error: Empty Input");
runTest("UT25", "(5)", "5");
runTest("UT26", "2*(3+4/2)-1", "9");
runTest("UT27", "10-2*3+1", "5");
runTest("UT28", "((1+1)*2)/4", "1");
runTest("UT29", "()", "Error: Bad Sequence"); // Test for empty parentheses

console.log(`
--- Unit Test Summary ---`);
console.log(`Total Tests: ${testsPassed + testsFailed}`);
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);

if (testsFailed > 0) {
    // process.exit(1); // Optional: exit with error code if any test fails
}
