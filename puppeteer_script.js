const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  // Capture console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });

  // Open Calculator.html
  const filePath = path.resolve(__dirname, 'Calculator.html');
  await page.goto(`file://${filePath}`);

  // Simulate clicks
  await page.click('button[onclick="appendToDisplay(\'1\')"]');
  await page.click('button[onclick="appendToDisplay(\'+\')"]');
  await page.click('button[onclick="appendToDisplay(\'1\')"]');
  await page.click('button[onclick="calculateResult()"]');

  // Get display value
  const displayValue = await page.evaluate(() => {
    return document.getElementById('display').value;
  });

  // Output results
  console.log(JSON.stringify({ displayValue, consoleMessages }));

  await browser.close();
})();
