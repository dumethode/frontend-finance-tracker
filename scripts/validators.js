// scripts/validators.js

/**
 * This module contains functions to check if form inputs are valid and clean.
 * It makes sure the user provides correct and usable data before saving.
 */

/**
 * Checks if a value is empty or contains only whitespace.
 * @param {string} value - The input value to check.
 * @returns {boolean} True if the value is not empty, false otherwise.
 */
function isNotEmpty(value) {
    return value && String(value).trim() !== '';
}

/**
 * Checks if a value is a valid currency number (positive, negative, or zero).
 * @param {string|number} value - The input value to check.
 * @returns {boolean} True if it's a valid number, false otherwise.
 */
function isValidCurrencyNumber(value) {
    // Regex allows for optional leading minus sign, digits, and an optional decimal with 1-2 digits
    const numberRegex = /^-?\d+(\.\d{1,2})?$/; 
    const num = parseFloat(value);
    
    // Check if the format matches AND the parsed number is finite (not NaN, Infinity)
    return numberRegex.test(String(value)) && isFinite(num);
}

/**
 * Main function to validate the transaction form data.
 * @param {Object} formData - An object containing the transaction data.
 * @returns {Object} An object with error messages for any invalid fields.
 */
export function validateTransaction(formData) {
    const errors = {};

    // Rule 1: Description must not be empty
    if (!isNotEmpty(formData.description)) {
        errors.description = "Description is required.";
    }
    
    // Rule 2: Amount must be a valid number (allowing negative for refunds)
    if (!isValidCurrencyNumber(formData.amount)) {
        errors.amount = "Must be a valid number (e.g., 5.00 or -10.50 for refunds).";
    }

    // Rule 3: Category must be selected
    if (!isNotEmpty(formData.category)) {
        errors.category = "Please select a category.";
    }

    // Rule 4: Date must be filled
    if (!isNotEmpty(formData.date)) {
        errors.date = "Date is required.";
    }

    return errors;
}
