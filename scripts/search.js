// scripts/search.js

/**
 * This module handles the complex searching of transactions using Regular Expressions (Regex).
 * This allows users to find transactions based on patterns, not just exact words.
 */

/**
 * Filters a list of transactions based on a user-provided Regular Expression search pattern.
 * @param {Array} transactions - The list of all transactions.
 * @param {string} searchPattern - The text or regex pattern entered by the user (e.g., "food" or "^gas").
 * @returns {Array} A new array containing only the transactions that match the pattern.
 */
export function filterTransactionsByRegex(transactions, searchPattern) {
    // If the search box is empty, return everything (no filtering needed)
    if (!searchPattern || searchPattern.trim() === '') {
        return transactions;
    }

    try {
        // 1. Create a new Regular Expression object
        // The 'i' flag makes the search case-insensitive (ignores Capital vs small letters)
        const regex = new RegExp(searchPattern, 'i');

        // 2. Filter the transactions array
        return transactions.filter(transaction => {
            // Check if the transaction's description matches the regex pattern
            // .test() is the standard way to check if a string matches a regex
            return regex.test(transaction.description);
        });

    } catch (e) {
        // If the student types a broken regex pattern (which is easy to do),
        // we catch the error and return an empty list to show no results, but
        // we also log the error to the console for debugging.
        console.error("Invalid Regex Pattern:", e);
        return [];
    }
}
