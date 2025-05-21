# Modern Web Calculator

## Description

This is a sleek, modern web-based calculator built entirely with HTML, CSS, and Vanilla JavaScript. It provides a user-friendly interface for performing standard arithmetic calculations with added features for a better user experience, all without relying on the `eval()` function for safer expression processing.

## Features

*   **Standard Arithmetic Operations:** Supports addition (`+`), subtraction (`-`), multiplication (`*`), and division (`/`).
*   **Order of Operations:** Correctly handles calculations involving parentheses `()`.
*   **Safe Expression Evaluation:** Uses a custom Shunting-yard based algorithm to parse and compute results securely, avoiding the use of `eval()`.
*   **Dual Themes:** Offers both Dark and Light themes. The default theme is Dark.
*   **Calculation History:**
    *   Keeps a log of recent calculations.
    *   Allows users to click on a history item to load the expression back into the display.
    *   Provides a "Clear History" button.
*   **Keyboard Support:**
    *   **Numbers:** `0` through `9`
    *   **Operators:** `+`, `-`, `*`, `/`
    *   **Decimal Point:** `.`
    *   **Parentheses:** `(`, `)`
    *   **Calculate:** `Enter` or `=`
    *   **Clear Display:** `c` (case-insensitive) or `Escape`
    *   **Backspace:** `Backspace` key
*   **Responsive Design:** Adapts to various screen sizes, ensuring usability on desktops, tablets, and mobile devices.
*   **Haptic Feedback:** Provides subtle vibration feedback on button clicks and actions (on supported devices).

## How to Use

1.  **Open the Calculator:**
    *   Simply download the `Calculator.html` file.
    *   Open the `Calculator.html` file directly in any modern web browser (e.g., Chrome, Firefox, Safari, Edge).

2.  **Performing Calculations:**
    *   Use the on-screen buttons or your keyboard to input numbers and operators.
    *   The display will show your current expression.
    *   Press the `=` button or `Enter` key to see the result.

3.  **Switching Themes:**
    *   Click the theme toggle button (initially showing a 🌜 for dark mode) located at the top right of the calculator.
    *   The theme will switch between Dark and Light modes.

4.  **Using Calculation History:**
    *   Completed calculations will automatically appear in the "History" panel below the calculator.
    *   Click on any entry in the history list to load the expression part of that calculation back into the display for re-use or modification.
    *   Click the "Clear History" button to remove all entries from the history panel.

5.  **Keyboard Input:**
    *   You can use your physical keyboard for most calculator functions as listed in the "Features" section.

## Screenshot

*(As an AI agent, I cannot directly add image files to the repository. It is recommended to take a screenshot of the calculator, particularly in its default dark theme, to visually represent the application.)*

## License

This project is licensed under the **MIT License**. See the `LICENSE` file for more details.
