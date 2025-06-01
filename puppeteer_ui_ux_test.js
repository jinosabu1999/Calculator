const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Ensure screenshots directory exists
const screenshotsDir = path.resolve(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
}

(async () => {
    let browser;
    const results = {
        themeToggle: { status: 'Not run', initialTheme: '', newTheme: '', initialIcon: '', newIcon: '', screenshots: [] },
        historyPanel: { status: 'Not run', screenshots: [], actions: [] },
        aesthetics: { status: 'Not run', screenshots: [] },
        cssChanges: []
    };

    try {
        browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        const filePath = `file://${path.resolve(__dirname, 'Calculator.html')}`;

        // --- Theme Toggle Test ---
        results.themeToggle.status = 'Running';
        await page.goto(filePath);
        await page.waitForSelector('body[data-theme]');

        results.themeToggle.initialTheme = await page.evaluate(() => document.body.getAttribute('data-theme'));
        results.themeToggle.initialIcon = await page.evaluate(() => document.getElementById('theme-icon').textContent);
        const darkThemePath = path.join(screenshotsDir, 'calculator_dark_theme.png');
        await page.screenshot({ path: darkThemePath, fullPage: true });
        results.themeToggle.screenshots.push(darkThemePath);

        await page.click('.toggle-theme');
        await new Promise(r => setTimeout(r, 100)); // Wait for transition

        results.themeToggle.newTheme = await page.evaluate(() => document.body.getAttribute('data-theme'));
        results.themeToggle.newIcon = await page.evaluate(() => document.getElementById('theme-icon').textContent);
        const lightThemePath = path.join(screenshotsDir, 'calculator_light_theme.png');
        await page.screenshot({ path: lightThemePath, fullPage: true });
        results.themeToggle.screenshots.push(lightThemePath);
        results.themeToggle.status = 'Completed';

        // --- History Panel Test ---
        results.historyPanel.status = 'Running';
        await page.goto(filePath); // Reload for a fresh state
        await page.waitForSelector('#display');

        // Perform calculations
        const calculations = [
            { expr: "1+1", click: ['1', '+', '1', '='] , expectedDisplay: "2"},
            { expr: "10-3", click: ['1', '0', '-', '3', '='], expectedDisplay: "7"},
            { expr: "2*5", click: ['2', '*', '5', '='], expectedDisplay: "10"}
        ];

        for (const calc of calculations) {
            await page.evaluate(() => document.getElementById('display').value = ''); // Clear display
            for (const btn of calc.click) {
                if (btn === '=') {
                    await page.click('button[onclick="calculateResult()"]');
                } else {
                    await page.click(`button[onclick="appendToDisplay('${btn}')"]`);
                }
                await new Promise(r => setTimeout(r, 50)); // Small delay between clicks
            }
            const displayVal = await page.evaluate(() => document.getElementById('display').value);
            results.historyPanel.actions.push(`Performed: ${calc.expr}, Display: ${displayVal}`);
            if (displayVal !== calc.expectedDisplay) {
                 results.historyPanel.actions.push(`ERROR: Expected display ${calc.expectedDisplay} but got ${displayVal}`);
            }
        }

        await new Promise(r => setTimeout(r, 200)); // Wait for history to populate

        const historyItemsInitial = await page.evaluate(() => Array.from(document.querySelectorAll('#history-list li')).map(li => li.textContent));
        results.historyPanel.actions.push(`Initial history items: ${JSON.stringify(historyItemsInitial)}`);

        const historyPanelPath = path.join(screenshotsDir, 'calculator_with_history.png');
        await page.screenshot({ path: historyPanelPath, fullPage: true });
        results.historyPanel.screenshots.push(historyPanelPath);

        // Click on a history item (e.g., the first one, which is the last calculation "2*5=10")
        if (historyItemsInitial.length > 0) {
            await page.click('#history-list li:first-child');
            await new Promise(r => setTimeout(r, 50));
            const displayAfterHistoryClick = await page.evaluate(() => document.getElementById('display').value);
            results.historyPanel.actions.push(`Clicked first history item. Display is now: "${displayAfterHistoryClick}" (expected "2*5")`);
             if (displayAfterHistoryClick !== "2*5") {
                 results.historyPanel.actions.push(`ERROR: Expected display "2*5" after history click, but got "${displayAfterHistoryClick}"`);
            }
        }

        // Clear history
        await page.click('#clear-history-button');
        await new Promise(r => setTimeout(r, 100));
        const historyItemsAfterClear = await page.evaluate(() => Array.from(document.querySelectorAll('#history-list li')).map(li => li.textContent));
        results.historyPanel.actions.push(`History items after clear: ${JSON.stringify(historyItemsAfterClear)} (expected [])`);
        if (historyItemsAfterClear.length !== 0) {
            results.historyPanel.actions.push(`ERROR: History not cleared. Items: ${JSON.stringify(historyItemsAfterClear)}`);
        }
        results.historyPanel.status = 'Completed';

        // --- Aesthetics and Responsiveness ---
        results.aesthetics.status = 'Running';
        await page.goto(filePath); // Reload
        await page.setViewport({ width: 375, height: 667 }); // iPhone SE size
        const mobilePath = path.join(screenshotsDir, 'calculator_mobile_view.png');
        await page.screenshot({ path: mobilePath, fullPage: true });
        results.aesthetics.screenshots.push(mobilePath);
        results.aesthetics.status = 'Completed';

    } catch (error) {
        console.error("Error during Puppeteer UI/UX testing:", error);
        if (results.themeToggle.status === 'Running') results.themeToggle.status = `Error: ${error.message}`;
        if (results.historyPanel.status === 'Running') results.historyPanel.status = `Error: ${error.message}`;
        if (results.aesthetics.status === 'Running') results.aesthetics.status = `Error: ${error.message}`;
    } finally {
        if (browser) {
            await browser.close();
        }
    }

    // Output results as JSON for easy parsing
    console.log(JSON.stringify(results, null, 2));
})();
