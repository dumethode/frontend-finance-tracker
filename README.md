# Student Finance Tracker

## Project Overview

The Student Finance Tracker is a simple and fast application designed to help African Leadership University (ALU) students manage their money. It lets students track their expenses, understand where their money goes, and make sure they stay within their monthly budget.

The app works entirely in the web browser using **Vanilla JavaScript, HTML, and CSS**. It saves all your information directly on your computer, so it works even without an internet connection. The design uses **Blue, Red, and White** to look professional and match the ALU colors.

## Key Features

### 1. Money Tracking and Summary

* **Add Expenses:** Easily add new transactions by filling in the **Description, Amount, Category,** and **Date**.
* **Live Dashboard:** See a summary of your finances that updates instantly:
    * **Total Spent:** How much you have spent this month.
    * **Budget Remaining:** How much money you have left before hitting your spending limit.
    * **Top Category:** The area where you spend the most money.
* **Data Saved Locally:** All your transactions, settings, and budget limits are saved in your web browser and will be there the next time you open the app.

### 2. Organizing and Finding Data

* **Search/Filter:** Use the search box to find specific transactions using text patterns, which is helpful for finding specific items quickly.
* **Sorting:** Arrange your records by **Date, Amount,** or **Category** in ascending (smallest to largest) or descending (largest to smallest) order.

### 3. Settings and Data Control

* **Custom Settings:** Set your preferred **Base Currency** (like USD, RWF, or EUR) and set a **Monthly Budget Cap**.
* **Data Export (Backup):** Download all your transactions and settings into a **JSON file** on your computer. This creates a backup.
* **Data Import (Restore):** Upload a saved JSON file to put your old data onto a new computer or web browser.
* **Clear All Data:** Completely erase all saved information from the app to start over.

## Technologies Used

* **HTML5:** Used for the structure of all the web pages.
* **CSS3:** Used for all the styling, colors, layout, and making the app look good on phones and computers.
* **Vanilla JavaScript (ES6+):** Used for all the logic, saving and loading data, handling button clicks, and checking that the forms are filled out correctly.

## How to Set Up and Use

1.  **Get the Project:** Download the project files onto your computer.
2.  **Open the Folder:** Go to the main project folder (`student-finance-tracker`).
3.  **Start the App:** Find the file named **`index.html`** and double-click it. It will open in your web browser (like Chrome or Firefox).

**Note:** This application works right away in your browser and does not require any special setup or a server.

## Keyboard Map and Accessibility

This section explains how to use the app without a mouse, which is important for accessibility.

| Feature | Key/Action | What it does |
| :--- | :--- | :--- |
| **Skip Link** | `Tab` (when page loads) | Lets you jump past the main header right to the Dashboard content. |
| **Navigation** | `Tab` | Moves focus through the menu links, forms, and buttons in a logical order. |
| **Save Forms** | `Enter` (when focused on the Save button) | Submits the form after you fill out the required information. |
| **Search** | `Tab` to focus on the search box, then type. | Allows you to quickly filter the transactions table. |
| **Delete** | `Enter` (when focused on a Delete button) | Brings up the confirmation box to remove a transaction. |

## Testing Instructions

Use these steps to confirm all parts of the application are working properly.

### 1. Data Saving (Persistence)

* **Action:** Add a new expense and click **"Save Transaction."**
* **Action:** **Close** the browser tab completely, then **re-open** `index.html`.
* **Expected Result:** The transaction you saved should still be in the table, and the Dashboard totals should still be correct.

### 2. Checking Forms (Validation)

* **Action:** Try to save a new expense but leave the **Amount** field empty.
* **Expected Result:** A red error message appears below the amount field, and the transaction does not save.

### 3. Screen Adaptation (Responsiveness)

* **Action:** Make your browser window very narrow (like a phone screen), then make it very wide (like a computer screen).
* **Expected Result:** The Dashboard cards should smoothly move from being a **single column** to a **four-column grid** on the wide screen.

### 4. Settings

* **Action:** Go to the **Settings** page. Change the **Base Currency** and the **Budget Cap**. Click **Save All Settings**.
* **Expected Result:** A success message appears, and the "Current Budget" display instantly shows the new amount and currency.