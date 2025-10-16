// scripts/search.js

/**
 * This module handles the complex searching of transactions using Regular Expressions (Regex).
 */

/**
 * Safely compiles a user-provided string into a Regular Expression object.
 * @param {string} input - The string to compile (the user's search pattern).
 * @param {string} flags - The regex flags (default is 'i' for case-insensitive).
 * @returns {RegExp|null} The compiled RegExp object or null if compilation fails.
 */
export function compileRegex(input, flags = 'i') {
    if (!input || input.trim() === '') return null;
    try {
        // We ensure the 'g' flag is included for global search/highlighting
        const finalFlags = flags.includes('g') ? flags : flags + 'g';
        return new RegExp(input, finalFlags);
    } catch {
        return null;
    }
}

/**
 * REQUIRED: Highlights matches in a string using the <mark> tag.
 * @param {string} text - The text to search within.
 * @param {RegExp} re - The compiled RegExp object.
 * @returns {string} The text with matched portions wrapped in <mark> tags.
 */
export function highlight(text, re) {
    if (!re) return text;
    // The replace method uses $& to re-insert the actual matched string
    return text.replace(re, m => `<mark>${m}</mark>`);
}

/**
 * Filters a list of transactions based on a user-provided Regular Expression search pattern.
 * NOTE: This function uses compileRegex from this module.
 * @param {Array} transactions - The list of all transactions.
 * @param {string} searchPattern - The text or regex pattern entered by the user.
 * @returns {Array} A new array containing only the transactions that match the pattern.
 */
export function filterTransactionsByRegex(transactions, searchPattern) {
    // We use the safe compiler
    const regex = compileRegex(searchPattern);
    
    if (!regex) {
        return transactions;
    }

    return transactions.filter(transaction => {
        // We only test against the description field
        return regex.test(transaction.description);
    });
}
