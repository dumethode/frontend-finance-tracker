// scripts/state.js

/**
 * The 'state' is the central place to hold all the app's current data.
 * Think of it as the app's 'memory' while it is open.
 * We use 'export' so other JavaScript files can read and write to this memory.
 */

// 1. Array to hold all the expense records (transactions)
export let transactions = [];

// 2. Variables for budget and currency settings (with defaults for new features)
export let settings = {
    budgetCap: 0,         
    baseCurrency: 'USD',  
    secondaryCurrency: 'RWF', // NEW: The secondary currency for display
    exchangeRates: {      // NEW: Manual exchange rates (Anchor Currency: USD)
        USD: 1,           
        RWF: 1000,        // 1 USD = 1000 RWF (Example rate)
        EUR: 0.92,        
        GBP: 0.81,        
        KES: 130,         
        ZAR: 18.5,        
        GHS: 14.8,        
    },
    sortKey: 'date',      
    sortOrder: 'desc',    
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
            // Ensure IDs are numbers before finding the max
            const maxId = Math.max(...transactions.map(t => parseInt(t.id) || 0));
            nextId = maxId + 1;
        } else {
            nextId = 0;
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
        id: nextId++, 
        // Ensure amount is saved as a string to preserve decimal precision if needed
        amount: String(transactionData.amount),
        ...transactionData 
    };
    transactions.unshift(newTransaction); 
    return newTransaction;
}

/**
 * NEW: Updates an existing transaction by its unique ID.
 * @param {number} id - The ID of the transaction to update.
 * @param {Object} newData - The new data to merge into the existing transaction.
 * @returns {boolean} True if the transaction was updated, false otherwise.
 */
export function updateTransaction(id, newData) {
    const numericId = parseInt(id);
    const index = transactions.findIndex(t => t.id === numericId);
    if (index !== -1) {
        const updatedData = {
            ...newData,
            // Ensure the amount is stored as a string
            amount: String(newData.amount)
        };
        transactions[index] = { 
            ...transactions[index], 
            ...updatedData, 
            id: numericId // Ensure ID is preserved
        };
        // Optional: Move the updated transaction to the top for visibility
        const updatedTransaction = transactions.splice(index, 1)[0];
        transactions.unshift(updatedTransaction);
        return true;
    }
    return false;
}

/**
 * Deletes a transaction by its unique ID.
 * @param {number} id - The ID of the transaction to delete.
 */
export function deleteTransaction(id) {
    const numericId = parseInt(id);
    const initialLength = transactions.length;
    transactions = transactions.filter(t => t.id !== numericId);
    return transactions.length !== initialLength; 
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
    // Ensure all amounts are treated as numbers
    return transactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
}
