const puppeteer = require('puppeteer');
const path = require('path');

async function clickButton(page, buttonTextOrSelector, isSelector = false) {
    if (isSelector) {
        await page.click(buttonTextOrSelector);
    } else {
        const xpath = `//button[normalize-space()='${buttonTextOrSelector}']`;
        const button = await page.waitForSelector(`xpath/${xpath}`);
        if (!button) throw new Error(`Button with text "${buttonTextOrSelector}" not found.`);
        await button.click();
    }
    await new Promise(r => setTimeout(r, 50)); // Small delay after click
}

async function typeExpression(page, expression) {
    await page.keyboard.type(expression, { delay: 20 });
    await new Promise(r => setTimeout(r, 50));
}

async function getDisplayValue(page) {
    return page.evaluate(() => document.getElementById('display').value);
}

async function getHistoryItems(page) {
    return page.evaluate(() => Array.from(document.querySelectorAll('#history-list li')).map(li => li.textContent));
}

(async () => {
    let browser;
    const testLog = [];
    let testRunSuccess = true;

    function logStep(action, expected, actual) {
    // Ensure both actual and expected are strings for comparison and trim them
    const actualStr = String(actual).trim();
    const expectedStr = String(expected).trim();
    const status = actualStr === expectedStr ? "PASSED" : "FAILED";
    let logEntry = `Action: ${action} | Expected: "${expectedStr}" (len:${expectedStr.length}) | Actual: "${actualStr}" (len:${actualStr.length}) | Status: ${status}`;
    if (status === "FAILED") {
        logEntry += `\n    (Raw Expected: '${expected}', Raw Actual: '${actual}')`; // Show raw values if comparison fails
    }
        testLog.push(logEntry);
        console.log(logEntry);
        if (status === "FAILED") {
            testRunSuccess = false;
        console.error(`FAILURE DETECTED: ${action}`); // Keep console.error for visibility
        }
    }

    function logInfo(message) {
        testLog.push(`Info: ${message}`);
        console.log(`Info: ${message}`);
    }

    try {
        browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        const filePath = `file://${path.resolve(__dirname, 'Calculator.html')}`;
        await page.goto(filePath);
        await page.waitForSelector('#display');

        logInfo("--- Starting Final Manual Test Simulation ---");

        // **Initial State & Clear**
        logInfo("Step: Initial State & Clear");
        let display = await getDisplayValue(page);
        logStep("Load page, check display", "", display); // Initial display is empty by default
        await clickButton(page, 'C');
        display = await getDisplayValue(page);
        logStep("Click 'C', check display", "", display);

        // **Simple Calculation & History**
        logInfo("Step: Simple Calculation & History");
        await clickButton(page, '5');
        await clickButton(page, '*');
        await clickButton(page, '8');
        await clickButton(page, '=');
        display = await getDisplayValue(page);
        logStep("Input '5*8=', check display", "40", display);
        let history = await getHistoryItems(page);
        logStep("Check history for '5*8 = 40'", "5*8 = 40", history.includes("5*8 = 40") ? "5*8 = 40" : JSON.stringify(history));

        // **Chained Calculation & Keyboard Input**
        logInfo("Step: Chained Calculation & Keyboard Input");
        await clickButton(page, 'C');
        await typeExpression(page, '100-20/2+5=');
        display = await getDisplayValue(page);
        logStep("Type '100-20/2+5=', check display", "95", display);
        history = await getHistoryItems(page);
        logStep("Check history for '100-20/2+5 = 95'", "100-20/2+5 = 95", history.includes("100-20/2+5 = 95") ? "100-20/2+5 = 95" : JSON.stringify(history));

        // **Using Parentheses & Backspace**
        logInfo("Step: Using Parentheses & Backspace");
        await clickButton(page, 'C');
        await clickButton(page, '(');
        await clickButton(page, '1');
        await clickButton(page, '5');
        await clickButton(page, '+');
        await clickButton(page, '5');
        await clickButton(page, ')');
        await clickButton(page, '*');
        await clickButton(page, '2');
        logStep("Input '(15+5)*2'", "(15+5)*2", await getDisplayValue(page));
        await clickButton(page, '⌫'); // Backspace
        await clickButton(page, '⌫'); // Backspace
        display = await getDisplayValue(page);
        logStep("Click '⌫' twice, check display", "(15+5)", display); // Corrected expectation
        await clickButton(page, '/');
        await clickButton(page, '4');
        await clickButton(page, '=');
        display = await getDisplayValue(page);
        logStep("Input '/4=', check display", "5", display);
        history = await getHistoryItems(page);
        logStep("Check history for '(15+5)/4 = 5'", "(15+5)/4 = 5", history.includes("(15+5)/4 = 5") ? "(15+5)/4 = 5" : JSON.stringify(history));

        // **Theme Toggling During Use**
        logInfo("Step: Theme Toggling During Use");
        await page.click('.toggle-theme'); // Toggle to light
        logInfo("Toggled theme");
        await clickButton(page, 'C');
        await clickButton(page, '7');
        await clickButton(page, '+');
        await clickButton(page, '8');
        await clickButton(page, '=');
        display = await getDisplayValue(page);
        logStep("Theme toggled, '7+8=', check display", "15", display);
        await page.click('.toggle-theme'); // Toggle back to dark
        logInfo("Toggled theme again");
        await clickButton(page, 'C');
        await clickButton(page, '9');
        await clickButton(page, '-');
        await clickButton(page, '1');
        await clickButton(page, '=');
        display = await getDisplayValue(page);
        logStep("Theme toggled, '9-1=', check display", "8", display);

        // **Error Handling Check**
        logInfo("Step: Error Handling Check");
        await clickButton(page, 'C');
        await clickButton(page, '1');
        await clickButton(page, '2');
        await clickButton(page, '/');
        await clickButton(page, '(');
        await clickButton(page, '3');
        await clickButton(page, '-');
        await clickButton(page, '3');
        await clickButton(page, ')');
        await clickButton(page, '=');
        display = await getDisplayValue(page);
        logStep("Input '12/(3-3)=', check display", "Error: Div by 0", display);

        // **Reusing History Item**
        logInfo("Step: Reusing History Item ('5*8 = 40')");
        await clickButton(page, 'C');
        // Find and click "5*8 = 40". It should be the oldest, so last in current list.
        // History order (newest first): "(15+5)/4=5", "9-1=8", "7+8=15", "100-20/2+5=95", "5*8=40"
        // So "5*8=40" is the 5th item.
        const historyItemToClickSelector = '#history-list li:nth-child(5)';
        try {
            await new Promise(r => setTimeout(r, 200)); // Add delay before interacting with history
            await page.waitForSelector(historyItemToClickSelector, { timeout: 3000 }); // Wait for item to be sure
            await page.click(historyItemToClickSelector);
            display = await getDisplayValue(page);
            logStep("Clicked history item '5*8=40', check display", "5*8", display);
            await clickButton(page, '=');
            display = await getDisplayValue(page);
            logStep("Clicked '=', check display", "40", display);
        } catch (e) {
            logStep("Clicking history item '5*8=40'", "5*8", `ERROR: Could not click history item - ${e.message}`);
            logInfo(`Current history: ${JSON.stringify(await getHistoryItems(page))}`);
        }


        // **Keyboard Shortcuts - Clear & Backspace**
        logInfo("Step: Keyboard Shortcuts - Clear & Backspace");
        await clickButton(page, 'C');
        await typeExpression(page, '12345');
        logStep("Typed '12345'", "12345", await getDisplayValue(page));
        await page.keyboard.press('Escape');
        display = await getDisplayValue(page);
        logStep("Pressed 'Escape', check display", "", display);
        await typeExpression(page, '98765');
        logStep("Typed '98765'", "98765", await getDisplayValue(page));
        await page.keyboard.press('Backspace');
        display = await getDisplayValue(page);
        logStep("Pressed 'Backspace', check display", "9876", display);

        // **Clearing History**
        logInfo("Step: Clearing History");
        history = await getHistoryItems(page);
        logInfo(`History items before clear: ${history.length}`);
        if (history.length > 0) {
            await page.click('#clear-history-button');
            history = await getHistoryItems(page);
            logStep("Clicked 'Clear History', check history is empty", 0, history.length);
        } else {
            logInfo("Skipped clear history test as history was already empty.");
        }


        // **Long Expression and Display**
        logInfo("Step: Long Expression and Display");
        await clickButton(page, 'C');
        await typeExpression(page, '100000*200000=');
        display = await getDisplayValue(page);
        logStep("Input '100000*200000=', check display", "20000000000", display);

        await clickButton(page, 'C');
        await typeExpression(page, '0.0000001*0.0000001=');
        display = await getDisplayValue(page);
        // JS floating point precision can be tricky. 1e-14 is common.
        const expectedFloat = (0.0000001 * 0.0000001).toString();
        logStep("Input '0.0000001*0.0000001=', check display", expectedFloat, display);


        logInfo("--- Test Simulation Completed ---");

    } catch (error) {
        console.error("Error during Puppeteer final manual test:", error);
        testLog.push(`ERROR: ${error.message}`);
        testRunSuccess = false;
    } finally {
        if (browser) {
            await browser.close();
        }
        console.log("\n--- Final Test Log ---");
        testLog.forEach(log => console.log(log));
        console.log(`\nOverall Test Run Status: ${testRunSuccess ? "SUCCESSFUL" : "FAILED"}`);
        if (!testRunSuccess) {
            // process.exit(1); // Useful for CI
        }
    }
})();
