// scripts/validators.js

/**
 * This module contains functions to check if form inputs are valid and clean.
 * It enforces the required Regex rules for the assignment.
 */

/**
 * Checks if a value is empty or contains only whitespace.
 */
function isNotEmpty(value) {
    return value && String(value).trim() !== '';
}

// --- REQUIRED REGEX RULES ---
const REGEX = {
    // 1. Description: forbid leading/trailing spaces and collapse doubles.
    DESCRIPTION_CLEAN: /^\S(?:.*\S)?$/,
    
    // 2. Numeric field (amount/currency): Allows positive/negative number with up to 2 decimals
    AMOUNT: /^-?(0|[1-9]\d*)(\.\d{1,2})?$/, 
    
    // 3. Date (YYYY-MM-DD): Validates structure and basic month/day range
    DATE: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
    
    // 4. Category/tag: letters, spaces, hyphens (e.g., 'Books-Supplies')
    CATEGORY: /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/,
    
    // REQUIRED ADVANCED REGEX: Duplicate words (e.g., "coffee coffee")
    DUPLICATE_WORDS: /\b(\w+)\s+\1\b/i 
};

/**
 * Checks if a value is a valid amount number (positive or negative).
 */
function isValidAmount(value) {
    const num = parseFloat(value);
    // Check regex format AND ensure it's a number
    return REGEX.AMOUNT.test(value) && !isNaN(num);
}


/**
 * Main function to validate the transaction form data.
 * @returns {Object} An object with error messages for any invalid fields.
 */
export function validateTransaction(formData) {
    const errors = {};
    const { description, amount, category, date } = formData;

    // --- Rule 1: Description Validation (Includes Advanced Check) ---
    if (!isNotEmpty(description)) {
        errors.description = "Description is required.";
    } else if (!REGEX.DESCRIPTION_CLEAN.test(description.trim())) {
        errors.description = "Cannot have leading/trailing spaces.";
    } else if (REGEX.DUPLICATE_WORDS.test(description)) { 
        errors.description = "Advanced Warning: Duplicate words detected (e.g., 'the the').";
    }

    // --- Rule 2: Amount Validation ---
    if (!isValidAmount(amount)) {
        errors.amount = "Must be a valid currency format (e.g., 5.00 or -10.50).";
    }

    // --- Rule 3: Category Validation ---
    if (!isNotEmpty(category)) {
        errors.category = "Please select a category.";
    } else if (!REGEX.CATEGORY.test(category)) {
        errors.category = "Category name must use only letters, spaces, or hyphens.";
    }

    // --- Rule 4: Date Validation ---
    if (!isNotEmpty(date)) {
        errors.date = "Date is required.";
    } else if (!REGEX.DATE.test(date)) {
        errors.date = "Date format must be YYYY-MM-DD and represent a valid date.";
    }

    return errors;
}
