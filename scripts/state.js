// scripts/state.js

/**
 * The 'state' is the central place to hold all the app's current data.
 * Think of it as the app's 'memory' while it is open.
 * We use 'export' so other JavaScript files can read and write to this memory.
 */

// 1. Array to hold all the expense records (transactions)
export let transactions = [];

// 2. Variables for budget and currency settings
export let settings = {
    budgetCap: 0,         // The maximum amount a student wants to spend (default is 0)
    baseCurrency: 'USD',  // The currency symbol to display (default is US Dollar)
    sortKey: 'date',      // The column to sort the table by (default is 'date')
    sortOrder: 'desc',    // The direction to sort (default is 'descending' or newest first)
};

// 3. Simple ID tracker to give each transaction a unique number (like a receipt ID)
let nextId = 0;

// --- FUNCTIONS TO MANAGE THE STATE ---

/**
 * Updates the 'transactions' array and recalculates the 'nextId'.
 * This is usually called right after loading data from localStorage.
 * @param {Array} newTransactions - The list of transactions loaded from storage.
 */
export function initializeState(newTransactions) {
    if (Array.isArray(newTransactions)) {
        transactions = newTransactions;
        
        // Find the highest ID and set 'nextId' one above it
        if (transactions.length > 0) {
            const maxId = Math.max(...transactions.map(t => t.id));
            nextId = maxId + 1;
        } else {
            nextId = 1;
        }
    }
}

/**
 * Adds a new transaction to the 'transactions' array.
 * @param {Object} transactionData - The transaction details (description, amount, category, date).
 * @returns {Object} The complete transaction object with the new ID.
 */
export function addTransaction(transactionData) {
    const newTransaction = {
        id: nextId++, // Assign the current ID and then increase it for the next one
        ...transactionData // Copy all other details (description, amount, etc.)
    };
    transactions.unshift(newTransaction); // Add to the start of the list (so it shows up first)
    return newTransaction;
}

/**
 * Deletes a transaction by its unique ID.
 * @param {number} id - The ID of the transaction to delete.
 */
export function deleteTransaction(id) {
    const initialLength = transactions.length;
    // Keep only the transactions whose ID does NOT match the one we want to delete
    transactions = transactions.filter(t => t.id !== id);
    return transactions.length !== initialLength; // Returns true if a transaction was deleted
}

/**
 * Overwrites the settings object with new values.
 * @param {Object} newSettings - The new settings object (e.g., {baseCurrency: 'RWF'}).
 */
export function updateSettings(newSettings) {
    settings = { ...settings, ...newSettings };
}

// Simple function to calculate the total money spent
export function getTotalSpent() {
    // We use parseFloat to make sure we are adding numbers, not text
    return transactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
}