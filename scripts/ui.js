// scripts/ui.js

// 1. IMPORT ALL NECESSARY MODULES
import { 
    transactions, settings, initializeState, addTransaction, deleteTransaction, 
    updateSettings, updateTransaction, getTotalSpent 
} from './state.js'; 
import { 
    loadTransactions, saveTransactions, loadSettings, saveSettings, clearAllData 
} from './storage.js';
import { validateTransaction } from './validators.js';
import { filterTransactionsByRegex } from './search.js';


// 2. DOM ELEMENT REFERENCES
const DOMElements = {
    // Transaction Form Elements (index.html)
    transactionForm: document.getElementById('transaction-form'),
    transactionIdInput: document.getElementById('transaction-id-input'), 
    saveTransactionBtn: document.getElementById('save-transaction-btn'), 
    recordsTbody: document.getElementById('records-tbody'),
    noRecordsMessage: document.getElementById('no-records-message'),
    
    // Dashboard Summary Elements (index.html)
    totalSpentDisplay: document.getElementById('total-spent'),
    budgetRemainingDisplay: document.getElementById('budget-remaining'),
    topCategoryDisplay: document.getElementById('top-category'),
    totalTransactionsDisplay: document.getElementById('total-transactions'),
    
    // Search & Sort Elements (index.html)
    regexSearchInput: document.getElementById('regex-search'),
    sortBySelect: document.getElementById('sort-by'),
    sortOrderBtn: document.getElementById('sort-order-btn'),

    // Settings Page Elements (settings.html)
    settingsForm: document.getElementById('settings-form'), 
    baseCurrencySelect: document.getElementById('base-currency'),
    secondaryCurrencySelect: document.getElementById('secondary-currency'), 
    budgetCapInput: document.getElementById('budget-cap-input'),
    budgetStatusDisplay: document.getElementById('budget-status-display'),
    exportBtn: document.getElementById('export-btn'),             
    importFile: document.getElementById('import-file'),           
    clearAllBtn: document.getElementById('clear-all-btn'),
    settingsStatus: document.getElementById('settings-status'),   
    exchangeRatesGrid: document.getElementById('exchange-rates-grid'), 
};

let isEditing = false; 

// --- 3. HELPER FUNCTIONS ---

/**
 * Sorts the transactions array based on the current settings.
 * @param {Array} arr - Array of transactions to sort.
 * @returns {Array} The sorted array.
 */
function sortTransactions(arr) {
    const key = settings.sortKey;
    const order = settings.sortOrder; // 'asc' or 'desc'
    
    // Use the spread operator to create a shallow copy before sorting (good practice)
    const sorted = [...arr].sort((a, b) => {
        let valA, valB;

        // Convert to numbers for amount, and to Date objects for date comparison
        if (key === 'amount') {
            valA = parseFloat(a.amount);
            valB = parseFloat(b.amount);
        } else if (key === 'date') {
            // Dates are compared as strings (YYYY-MM-DD) which works well
            valA = a.date;
            valB = b.date;
        } else {
            // Default to string comparison (case-insensitive) for description and category
            valA = String(a[key]).toLowerCase();
            valB = String(b[key]).toLowerCase();
        }

        if (valA < valB) return order === 'asc' ? -1 : 1;
        if (valA > valB) return order === 'asc' ? 1 : -1;
        return 0; // items are equal
    });

    return sorted;
}


/**
 * Formats a number amount into a currency string based on settings.
 * @param {number|string} amount - The numeric amount.
 * @param {string} [currencyCode] - Optional currency code to override base setting.
 * @returns {string} The formatted currency string.
 */
function formatCurrency(amount, currencyCode) {
    const numberAmount = isNaN(parseFloat(amount)) ? 0 : parseFloat(amount);
    const code = currencyCode || settings.baseCurrency;
    
    // A simplified symbol mapping to match the options in settings.html
    const symbols = {
        'USD': '$', 'RWF': 'R₣', 'EUR': '€', 'GBP': '£', 
        'KES': 'Ksh', 'ZAR': 'R', 'GHS': 'GH₵'
    };
    
    const symbol = symbols[code] || code;

    const formatter = new Intl.NumberFormat('en-US', {
        style: 'decimal', 
        minimumFractionDigits: 2,
    });
    
    return `${symbol}${formatter.format(numberAmount)}`;
}

/**
 * Converts amount to secondary currency and returns the formatted string.
 * @param {number} amount - The amount in the base currency.
 * @returns {string} The secondary currency string in parentheses or an empty string.
 */
function convertToSecondaryCurrency(amount) {
    if (settings.secondaryCurrency === 'NONE' || settings.secondaryCurrency === settings.baseCurrency) {
        return ''; 
    }

    const baseRate = settings.exchangeRates[settings.baseCurrency] || 1;
    const secondaryRate = settings.exchangeRates[settings.secondaryCurrency] || 1;
    
    // Conversion formula: Amount in Base / Rate(1 USD=Base) * Rate(1 USD=Secondary)
    // Note: If Base Currency is USD, baseRate is 1.
    const amountInUSD = amount / baseRate; 
    const convertedAmount = amountInUSD * secondaryRate;
    
    return ` (${formatCurrency(convertedAmount, settings.secondaryCurrency)})`;
}

/**
 * Displays a success or error message on the screen.
 * @param {HTMLElement} element - The DOM element to display the message in.
 * @param {string} message - The message text.
 * @param {string} type - 'success' or 'error'.
 * @param {number} duration - Duration in milliseconds.
 */
function showStatusMessage(element, message, type = 'success', duration = 3000) {
    element.textContent = message;
    element.className = `status-message ${type}`;
    element.style.visibility = 'visible';
    element.style.opacity = '1';
    
    setTimeout(() => {
        element.style.opacity = '0';
        setTimeout(() => {
            element.textContent = '';
            element.className = 'status-message';
            element.style.visibility = 'hidden';
        }, 300);
    }, duration);
}


// --- 4. CORE RENDERING FUNCTIONS (index.html) ---

/**
 * Renders the dashboard summary (totals, budget, top category).
 */
function renderDashboardSummary() {
    if (!DOMElements.totalSpentDisplay) return; 

    const totalSpent = getTotalSpent();
    const budgetCap = settings.budgetCap || 0;

    // A. Total Spent
    const spentText = formatCurrency(totalSpent) + convertToSecondaryCurrency(totalSpent);
    DOMElements.totalSpentDisplay.textContent = spentText;

    // B. Budget Remaining
    const remaining = budgetCap - totalSpent;
    const remainingText = formatCurrency(remaining) + convertToSecondaryCurrency(remaining);
    DOMElements.budgetRemainingDisplay.textContent = remainingText;
    
    // Apply red/blue color based on status
    if (remaining < 0) {
        DOMElements.budgetRemainingDisplay.style.color = 'var(--color-accent)'; 
    } else {
        DOMElements.budgetRemainingDisplay.style.color = 'var(--color-primary)'; 
    }

    // C. Find Top Category (using amount, not count)
    const categoryTotals = transactions.reduce((acc, t) => {
        const amount = parseFloat(t.amount || 0);
        acc[t.category] = (acc[t.category] || 0) + amount;
        return acc;
    }, {});
    
    let topCategory = 'None';
    let maxSpent = -Infinity;
    for (const category in categoryTotals) {
        // Only consider positive spending for 'top' category
        if (categoryTotals[category] > maxSpent) {
            maxSpent = categoryTotals[category];
            topCategory = category;
        }
    }
    DOMElements.topCategoryDisplay.textContent = topCategory;
    
    // D. Total Transactions Count
    DOMElements.totalTransactionsDisplay.textContent = transactions.length;
}

/**
 * Renders the transactions table.
 */
function renderRecordsTable() {
    if (!DOMElements.recordsTbody) return; 
    
    DOMElements.recordsTbody.innerHTML = '';
    const searchPattern = DOMElements.regexSearchInput?.value || '';
    let filteredTransactions = filterTransactionsByRegex(transactions, searchPattern);
    const sortedTransactions = sortTransactions(filteredTransactions);

    if (sortedTransactions.length === 0) {
        DOMElements.noRecordsMessage.style.display = 'block';
    } else {
        DOMElements.noRecordsMessage.style.display = 'none';
        sortedTransactions.forEach(t => {
            const row = document.createElement('tr');
            const amountText = formatCurrency(t.amount) + convertToSecondaryCurrency(parseFloat(t.amount));

            row.innerHTML = `
                <td>${t.description}</td>
                <td data-sort-value="${t.amount}">${amountText}</td>
                <td>${t.category}</td>
                <td data-sort-value="${t.date}">${t.date}</td>
                <td class="action-cell">
                    <button class="btn btn-icon btn-edit" data-id="${t.id}" title="Edit" aria-label="Edit transaction ${t.description}">
                        &#x270D;
                    </button>
                    <button class="btn btn-icon btn-danger" data-id="${t.id}" title="Delete" aria-label="Delete transaction ${t.description}">
                        &#x274C;
                    </button>
                </td>
            `;
            DOMElements.recordsTbody.appendChild(row);
        });
    }

    // Attach event listeners for Edit and Delete buttons
    document.querySelectorAll('.btn-edit').forEach(button => {
        button.addEventListener('click', handleEditTransaction);
    });
    document.querySelectorAll('.btn-danger').forEach(button => {
        button.addEventListener('click', handleDeleteTransaction);
    });
}

/**
 * Renders the settings page controls and exchange rates.
 */
function renderSettings() {
    if (!DOMElements.settingsForm) return; 

    // A. Populate General Settings
    DOMElements.baseCurrencySelect.value = settings.baseCurrency;
    DOMElements.secondaryCurrencySelect.value = settings.secondaryCurrency || 'NONE'; 
    DOMElements.budgetCapInput.value = settings.budgetCap;
    DOMElements.budgetStatusDisplay.textContent = formatCurrency(settings.budgetCap);

    // B. Populate Exchange Rates Grid
    DOMElements.exchangeRatesGrid.innerHTML = ''; 
    
    for (const [code, rate] of Object.entries(settings.exchangeRates)) {
        if (code !== 'USD') { 
            const rateGroup = document.createElement('div');
            rateGroup.className = 'exchange-rate-group';
            rateGroup.innerHTML = `
                <label for="rate-${code}">1 USD = ${code}</label>
                <input type="number" id="rate-${code}" name="${code}" value="${rate}" step="0.0001" min="0.0001" required>
            `;
            DOMElements.exchangeRatesGrid.appendChild(rateGroup);
        }
    }
}


// --- 5. EVENT HANDLERS ---

// --- Transaction Handlers ---

function resetTransactionForm() {
    isEditing = false;
    document.getElementById('add-transaction-heading').textContent = 'Add New Transaction';
    DOMElements.saveTransactionBtn.textContent = 'Save Transaction';
    DOMElements.transactionIdInput.value = ''; 
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    document.getElementById('form-status').textContent = ''; 
    DOMElements.transactionForm.reset();
}

function handleEditTransaction(event) {
    const transactionId = parseInt(event.currentTarget.dataset.id);
    const transaction = transactions.find(t => t.id === transactionId);

    if (transaction) {
        isEditing = true;
        document.getElementById('add-transaction-heading').textContent = 'Edit Existing Transaction';
        DOMElements.saveTransactionBtn.textContent = 'Update Transaction';

        // Populate form fields
        DOMElements.transactionForm.description.value = transaction.description;
        DOMElements.transactionForm.amount.value = parseFloat(transaction.amount); 
        DOMElements.transactionForm.category.value = transaction.category;
        DOMElements.transactionForm.date.value = transaction.date;
        DOMElements.transactionIdInput.value = transaction.id; 

        // Scroll to form
        document.getElementById('add-transaction-heading').scrollIntoView({ behavior: 'smooth' });
    }
}

function handleDeleteTransaction(event) {
    const transactionId = parseInt(event.currentTarget.dataset.id);
    if (confirm('Are you sure you want to delete this transaction?')) {
        if (deleteTransaction(transactionId)) {
            saveTransactions(transactions);
            renderDashboardSummary();
            renderRecordsTable();
        }
    }
}

function handleTransactionFormSubmit(event) {
    event.preventDefault();

    const formData = {
        description: DOMElements.transactionForm.description.value,
        amount: parseFloat(DOMElements.transactionForm.amount.value), // Ensure it's a number for validation
        category: DOMElements.transactionForm.category.value,
        date: DOMElements.transactionForm.date.value,
    };
    const transactionId = DOMElements.transactionIdInput.value;
    const formStatus = document.getElementById('form-status');

    // 2. Validate Data 
    const errors = validateTransaction(formData);

    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    if (Object.keys(errors).length > 0) {
        for (const key in errors) {
            document.getElementById(`${key}-error`).textContent = errors[key];
        }
        showStatusMessage(formStatus, 'Please fix the errors above.', 'error', 5000);
        return; 
    }

    // 3. Add or Update Transaction
    let success = false;
    if (isEditing && transactionId) {
        success = updateTransaction(transactionId, formData);
        if (success) {
            showStatusMessage(formStatus, 'Transaction successfully UPDATED!', 'success');
        } else {
             showStatusMessage(formStatus, 'Error updating transaction.', 'error');
        }
    } else {
        addTransaction(formData);
        success = true;
        showStatusMessage(formStatus, 'Transaction successfully ADDED!', 'success');
    }

    if (success) {
        saveTransactions(transactions); 
        renderDashboardSummary();      
        renderRecordsTable();          
        
        // Reset form for next entry
        resetTransactionForm();
    }
}

// --- Search and Sort Handlers ---

function handleSortOrderToggle() {
    settings.sortOrder = settings.sortOrder === 'asc' ? 'desc' : 'asc';
    saveSettings(settings);
    DOMElements.sortOrderBtn.textContent = settings.sortOrder === 'desc' ? '⬇️' : '⬆️';
    renderRecordsTable();
}

function handleSortChange() {
    settings.sortKey = DOMElements.sortBySelect.value;
    saveSettings(settings);
    renderRecordsTable();
}


// --- Settings Handlers ---

function handleSettingsFormSubmit(event) {
    event.preventDefault();

    const newSettings = {
        baseCurrency: DOMElements.baseCurrencySelect.value,
        secondaryCurrency: DOMElements.secondaryCurrencySelect.value,
        budgetCap: parseFloat(DOMElements.budgetCapInput.value) || 0,
        exchangeRates: { USD: 1 }, 
    };

    // Gather manual exchange rates
    let ratesValid = true;
    document.querySelectorAll('#exchange-rates-grid input').forEach(input => {
        const currencyCode = input.name;
        const rate = parseFloat(input.value);
        if (isNaN(rate) || rate <= 0) {
            ratesValid = false;
        }
        newSettings.exchangeRates[currencyCode] = rate;
    });

    if (!ratesValid) {
        showStatusMessage(DOMElements.settingsStatus, 'Error: All exchange rates must be positive numbers.', 'error', 5000);
        return;
    }
    
    // Update state and storage
    updateSettings(newSettings);
    saveSettings(settings);

    // Re-render UI elements that rely on settings
    renderSettings();
    renderDashboardSummary();
    renderRecordsTable(); 
    
    showStatusMessage(DOMElements.settingsStatus, 'Settings successfully saved!', 'success');
}

function handleExportData() {
    const exportData = {
        settings: settings,
        transactions: transactions,
        exportDate: new Date().toISOString(),
        version: '1.0.0', 
    };
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sft-data-backup-${new Date().toISOString().slice(0, 10)}.json`; 
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showStatusMessage(DOMElements.settingsStatus, 'Data successfully EXPORTED to JSON file!', 'success');
}

function handleImportData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (Array.isArray(importedData.transactions) && importedData.settings) {
                
                // 1. Process Settings: Merge with existing settings to ensure all keys are present
                const defaultRates = { USD: 1, RWF: 1000, EUR: 0.92, GBP: 0.81, KES: 130, ZAR: 18.5, GHS: 14.8 };
                const importedRates = { ...defaultRates, ...importedData.settings.exchangeRates, USD: 1 };

                const newSettings = { 
                    ...settings, 
                    ...importedData.settings,
                    exchangeRates: importedRates 
                };

                // 2. Apply and Save Data
                initializeState(importedData.transactions); 
                updateSettings(newSettings);      

                saveTransactions(transactions);
                saveSettings(settings);

                // 3. Re-render UI
                renderSettings();
                renderDashboardSummary();
                renderRecordsTable();

                showStatusMessage(DOMElements.settingsStatus, `Successfully IMPORTED ${transactions.length} transactions!`, 'success');
            } else {
                throw new Error("JSON file missing 'transactions' or 'settings' object.");
            }
        } catch (error) {
            console.error("Error importing data:", error);
            showStatusMessage(DOMElements.settingsStatus, `Error importing file: ${error.message || 'Invalid JSON format.'}`, 'error', 5000);
        }
    };
    reader.readAsText(file);
    event.target.value = ''; 
}

function handleClearAllData() {
    if (confirm('WARNING: Are you sure you want to clear ALL saved data (transactions and settings)? This cannot be undone.')) {
        clearAllData();
        initializeState([]); // Reset transactions array
        updateSettings({ 
            budgetCap: 0, baseCurrency: 'USD', secondaryCurrency: 'RWF', 
            exchangeRates: { USD: 1, RWF: 1000, EUR: 0.92, GBP: 0.81, KES: 130, ZAR: 18.5, GHS: 14.8 },
            sortKey: 'date', sortOrder: 'desc'
        }); // Reset settings
        
        // Re-render
        if (DOMElements.settingsForm) renderSettings();
        if (DOMElements.transactionForm) {
            renderDashboardSummary();
            renderRecordsTable();
            resetTransactionForm();
        }

        showStatusMessage(DOMElements.settingsStatus || document.getElementById('form-status'), 'All data successfully CLEARED!', 'error', 5000);
    }
}


// --- 6. INITIALIZATION ---

function init() {
    // A. Load Data (FIX: Ensure data is loaded at start)
    const storedTransactions = loadTransactions();
    const storedSettings = loadSettings();

    initializeState(storedTransactions);
    if (storedSettings) {
        updateSettings(storedSettings); 
    }
    
    // B. Set up Event Listeners (Transaction Form is only on index.html)
    if (DOMElements.transactionForm) {
        DOMElements.transactionForm.addEventListener('submit', handleTransactionFormSubmit);
        DOMElements.regexSearchInput.addEventListener('input', renderRecordsTable);
        DOMElements.sortBySelect.addEventListener('change', handleSortChange);
        DOMElements.sortOrderBtn.addEventListener('click', handleSortOrderToggle);
    }

    // C. Settings Page Event Listeners
    if (DOMElements.settingsForm) {
        DOMElements.settingsForm.addEventListener('submit', handleSettingsFormSubmit);
        DOMElements.exportBtn.addEventListener('click', handleExportData);
        DOMElements.importFile.addEventListener('change', handleImportData);
        DOMElements.clearAllBtn.addEventListener('click', handleClearAllData);
    }

    // D. Global Search Button (FIX: Corrected global search logic)
    document.querySelector('.search-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        const isIndexPage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
        const controlsSection = document.getElementById('controls-section');

        if (isIndexPage && controlsSection) {
            // Scroll to the records/search area and focus the search input
            controlsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            DOMElements.regexSearchInput?.focus();
        } else {
            // Navigate to the index page with a hash to hint the location
            window.location.href = 'index.html#controls-section';
        }
    });

    // E. Initial Render
    if (DOMElements.transactionForm) {
        renderDashboardSummary();
        renderRecordsTable();
    }
    if (DOMElements.settingsForm) {
        renderSettings();
    }
    
    // F. Final navigation check (highlight active link)
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        // Check if the current URL matches the link's href or if it's the dashboard link on the root/index page
        if (window.location.href.includes(href) || 
            (link.dataset.page === "dashboard" && (window.location.pathname === '/' || window.location.pathname.endsWith('index.html')))) {
            link.classList.add('active');
        }
    });
}

// Start the entire application!
init();
