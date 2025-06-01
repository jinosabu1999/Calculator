const puppeteer = require('puppeteer');
const path = require('path');

const testCases = [
    { id: "T01", expression: "1+1", expected: "2" },
    { id: "T02", expression: "5-2", expected: "3" },
    { id: "T03", expression: "3*4", expected: "12" },
    { id: "T04", expression: "8/2", expected: "4" },
    { id: "T05", expression: "1+2*3", expected: "7" },
    { id: "T06", expression: "8-4/2", expected: "6" },
    { id: "T07", expression: "(1+2)*3", expected: "9" },
    { id: "T08", expression: "10/(2+3)", expected: "2" },
    { id: "T09", expression: "1.5+2.5", expected: "4" },
    { id: "T10", expression: "0.1*0.2", expected: "0.02" },
    { id: "T11", expression: "-5+2", expected: "-3" },
    { id: "T12", expression: "5*-2", expected: "-10" },
    { id: "T13", expression: "5*(-2)", expected: "-10" },
    { id: "T14", expression: "-(3+2)", expected: "-5" },
    { id: "T15", expression: "1++2", expected: "Error: Bad Sequence" },
    { id: "T16", expression: "/3", expected: "Error: Bad Sequence" }, // Might be "Error: Invalid Chars" or "Error: Bad Sequence"
    { id: "T17", expression: "4*", expected: "Error: Bad Sequence" },
    { id: "T18", expression: "(()", expected: "Error: Mismatched ()" },
    { id: "T19", expression: "1.2.3+4", expected: "Error: Invalid Token" }, // Or "Error: Invalid Chars"
    { id: "T20", expression: "1/0", expected: "Error: Div by 0" },
    { id: "T21", expression: "0/0", expected: "Error: Div by 0" },
    { id: "T22", expression: "0*5", expected: "0" },
    { id: "T23", expression: "5", expected: "5" },
    { id: "T24", expression: "", expected: "Error: Empty Input" },
    { id: "T25", expression: "(5)", expected: "5" }
];

(async () => {
    const results = [];
    let browser;

    try {
        browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });

        for (const testCase of testCases) {
            const page = await browser.newPage();
            const consoleOutput = [];

            page.on('console', msg => {
                const text = msg.text();
                // Capture logs relevant to our debug statements
                if (text.startsWith('Tokens:') || text.startsWith('RPN Queue:')) {
                    // The actual array content will be logged from the test script,
                    // here we just note that the log occurred.
                    // The actual data is passed via evaluate.
                    consoleOutput.push(text);
                } else if (msg.type() === 'error' || msg.type() === 'warning') {
                    consoleOutput.push(`[Browser ${msg.type().toUpperCase()}] ${text}`);
                }
            });

            const filePath = path.resolve(__dirname, 'Calculator.html');
            await page.goto(`file://${filePath}`);

            // Clear display and set expression
            await page.evaluate((expression) => {
                document.getElementById('display').value = expression;
            }, testCase.expression);

            // Simulate click on '='
            await page.click('button[onclick="calculateResult()"]');

            // Get actual result and captured logs from the page context
            const evalResult = await page.evaluate(() => {
                return {
                    actual: document.getElementById('display').value,
                    tokensLog: window.debug_tokens_log || [], // Retrieve token logs
                    rpnLog: window.debug_rpn_log || []       // Retrieve RPN logs
                };
            });

            // Combine console output with retrieved logs
            let detailedConsoleOutput = consoleOutput.join('\n');
            if (evalResult.tokensLog.length > 0) {
                detailedConsoleOutput += '\nTokens Log (from page): ' + JSON.stringify(evalResult.tokensLog);
            }
            if (evalResult.rpnLog.length > 0) {
                detailedConsoleOutput += '\nRPN Log (from page): ' + JSON.stringify(evalResult.rpnLog);
            }

            results.push({
                id: testCase.id,
                expression: testCase.expression,
                expected: testCase.expected,
                actual: evalResult.actual,
                consoleOutput: detailedConsoleOutput
            });

            await page.close();
        }
    } catch (error) {
        console.error("Error during Puppeteer testing:", error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }

    // Output results
    const passedTests = results.filter(r => r.actual === r.expected);
    const failedTests = results.filter(r => r.actual !== r.expected);

    console.log(`\n--- Test Summary ---`);
    console.log(`Total Tests: ${results.length}`);
    console.log(`Passed: ${passedTests.length}`);
    console.log(`Failed: ${failedTests.length}`);

    if (failedTests.length > 0) {
        console.log(`\n--- Failed Tests ---`);
        failedTests.forEach(test => {
            console.log(`ID: ${test.id}`);
            console.log(`Expression: "${test.expression}"`);
            console.log(`Expected: "${test.expected}"`);
            console.log(`Actual: "${test.actual}"`);
            if (test.consoleOutput) {
                console.log(`Console Output:\n${test.consoleOutput}`);
            }
            console.log(`---`);
        });
    }

    // For the subtask, we'll stringify the full results to be parsed by the agent
    // This is a bit of a hack for the environment, normally we'd use a test runner.
    // console.log('\nFULL_RESULTS_JSON_START');
    // console.log(JSON.stringify(results, null, 2));
    // console.log('FULL_RESULTS_JSON_END');

})();
