// scripts/storage.js

/**
 * This module handles reading and writing data to the browser's localStorage.
 * This is how the app remembers transactions and settings between sessions.
 */

const TRANSACTIONS_KEY = 'sft_transactions';
const SETTINGS_KEY = 'sft_settings';

// --- TRANSACTION FUNCTIONS ---

/**
 * Saves the current list of transactions to localStorage.
 * @param {Array} transactions - The array of transactions from the state.
 */
export function saveTransactions(transactions) {
    try {
        // localStorage can only save TEXT, so we turn the list into a big string (JSON.stringify)
        localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
    } catch (error) {
        console.error("Error saving transactions to localStorage:", error);
    }
}

/**
 * Loads the transactions from localStorage.
 * @returns {Array} The loaded transactions, or an empty array if nothing is saved.
 */
export function loadTransactions() {
    try {
        const storedData = localStorage.getItem(TRANSACTIONS_KEY);
        // We turn the saved text string back into a JavaScript list (JSON.parse)
        return storedData ? JSON.parse(storedData) : [];
    } catch (error) {
        console.error("Error loading transactions from localStorage:", error);
        return [];
    }
}

// --- SETTINGS FUNCTIONS ---

/**
 * Saves the current settings (budget, currency, etc.) to localStorage.
 * @param {Object} settings - The settings object from the state.
 */
export function saveSettings(settings) {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
        console.error("Error saving settings to localStorage:", error);
    }
}

/**
 * Loads the settings from localStorage.
 * @returns {Object|null} The loaded settings object, or null if none are saved.
 */
export function loadSettings() {
    try {
        const storedData = localStorage.getItem(SETTINGS_KEY);
        // Returns the loaded settings or null
        return storedData ? JSON.parse(storedData) : null;
    } catch (error) {
        console.error("Error loading settings from localStorage:", error);
        return null;
    }
}

/**
 * Completely removes all saved data (transactions and settings) from localStorage.
 */
export function clearAllData() {
    localStorage.removeItem(TRANSACTIONS_KEY);
    localStorage.removeItem(SETTINGS_KEY);
}