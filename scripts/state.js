// scripts/state.js

/**
 * The 'state' is the central place to hold all the app's current data.
 * This module ensures transactions have unique IDs and proper timestamps.
 */

export let transactions = [];

export let settings = {
    budgetCap: 0,         
    baseCurrency: 'USD',  
    sortKey: 'date',      
    sortOrder: 'desc',    
};

let nextId = 0;

/**
 * Initializes state from loaded data and sets the next available ID.
 */
export function initializeState(newTransactions, newSettings) {
    if (Array.isArray(newTransactions)) {
        transactions = newTransactions.map(t => ({
            ...t,
            id: parseInt(t.id),
            // Ensure createdAt and updatedAt exist for records imported without them
            createdAt: t.createdAt || new Date().toISOString(),
            updatedAt: t.updatedAt || t.createdAt || new Date().toISOString() 
        }));
        
        if (transactions.length > 0) {
            const validIds = transactions.map(t => parseInt(t.id)).filter(id => !isNaN(id));
            const maxId = validIds.length > 0 ? Math.max(...validIds) : 0;
            nextId = maxId + 1;
        } else {
            nextId = 1;
        }
    }

    if (newSettings) {
        settings = { ...settings, ...newSettings };
    }
}


/**
 * Adds a new transaction.
 */
export function addTransaction(transactionData) {
    const now = new Date().toISOString();
    const newTransaction = {
        id: nextId++, 
        createdAt: now,
        updatedAt: now, // NEW: Initial updatedAt
        ...transactionData 
    };
    transactions.unshift(newTransaction); 
    return newTransaction;
}

/**
 * Updates an existing transaction.
 */
export function updateTransaction(updatedTransactionData) {
    const id = updatedTransactionData.id;
    const index = transactions.findIndex(t => t.id === id);
    
    if (index !== -1) {
        // Keep the original createdAt and id, overwrite everything else, and update updatedAt
        transactions[index] = {
            ...transactions[index], 
            ...updatedTransactionData,
            updatedAt: new Date().toISOString() // NEW: Update timestamp
        };
        
        // Move to the front for better UX if sorting by date (desc)
        const [movedTransaction] = transactions.splice(index, 1);
        transactions.unshift(movedTransaction);
        
        return true;
    }
    return false;
}

/**
 * Deletes a transaction.
 */
export function deleteTransaction(id) {
    const initialLength = transactions.length;
    transactions = transactions.filter(t => t.id !== id);
    return transactions.length !== initialLength;
}

/**
 * Overwrites the settings object with new values.
 */
export function updateSettings(newSettings) {
    settings = { ...settings, ...newSettings };
}

// Simple function to calculate the total money spent
export function getTotalSpent() {
    return transactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
}
