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
 * Checks if a value is a valid positive number (including currency format).
 * @param {string} value - The input value to check.
 * @returns {boolean} True if it's a positive number, false otherwise.
 */
function isPositiveNumber(value) {
    // Regular Expression to allow for numbers, decimals, and ensure it's positive.
    const numberRegex = /^\d+(\.\d{1,2})?$/; 
    const num = parseFloat(value);
    
    // Check if the format matches and the parsed number is greater than zero
    return numberRegex.test(value) && num > 0;
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
    
    // Rule 2: Amount must be a positive number (like 5.00 or 123)
    if (!isPositiveNumber(formData.amount)) {
        errors.amount = "Must be a valid positive number (e.g., 5.00).";
    }

    // Rule 3: Category must be selected
    if (!isNotEmpty(formData.category)) {
        errors.category = "Please select a category.";
    }

    // Rule 4: Date must be filled (HTML 'required' handles most of this, but we double-check)
    if (!isNotEmpty(formData.date)) {
        errors.date = "Date is required.";
    }

    // If the errors object is empty, the data is valid!
    return errors;
}