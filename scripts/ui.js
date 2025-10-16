// scripts/ui.js

// 1. IMPORT ALL NECESSARY MODULES
import { transactions, settings, initializeState, addTransaction, deleteTransaction, updateTransaction, updateSettings, getTotalSpent } from './state.js';
import { loadTransactions, saveTransactions, loadSettings, saveSettings, clearAllData } from './storage.js';
import { validateTransaction } from './validators.js';
import { filterTransactionsByRegex, compileRegex, highlight } from './search.js'; // NEW IMPORTS

// 2. DOM ELEMENT REFERENCES
const DOMElements = {
    // Transaction Form Elements (index.html)
    transactionForm: document.getElementById('transaction-form'),
    transactionIdInput: document.getElementById('transaction-id'), 
    clearFormBtn: document.getElementById('clear-form-btn'), 
    recordsTbody: document.getElementById('records-tbody'),
    noRecordsMessage: document.getElementById('no-records-message'),
    saveTransactionBtn: document.querySelector('#transaction-form .btn-primary'),
    
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
    budgetCapInput: document.getElementById('budget-cap'), 
    settingsStatus: document.getElementById('settings-status'),
    budgetStatusDisplay: document.getElementById('budget-status-display'),
    
    // Data Management Buttons (settings.html)
    exportBtn: document.getElementById('export-btn'),
    importFile: document.getElementById('import-file'),
    clearAllBtn: document.getElementById('clear-all-btn'),

    // Header buttons (for navigation)
    searchBtn: document.querySelector('.search-btn'),
};

let liveSearchRegex = null; // Stores the compiled regex for highlighting

// --- HELPER FUNCTION: Clear the form and reset edit mode ---
function clearForm() {
    if (DOMElements.transactionForm) DOMElements.transactionForm.reset();
    if (DOMElements.transactionIdInput) DOMElements.transactionIdInput.value = ''; 
    if (DOMElements.saveTransactionBtn) DOMElements.saveTransactionBtn.textContent = 'Save Transaction'; 
    
    // Clear error messages
    const errorIds = ['description-error', 'amount-error', 'category-error', 'date-error'];
    errorIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '';
    });
}


// 3. CORE RENDERING FUNCTIONS

/**
 * Formats a raw number value into the display currency format.
 */
function formatCurrency(amount) {
    const num = parseFloat(amount || 0);
    return `${settings.baseCurrency} ${num.toFixed(2)}`;
}

/**
 * Updates all the summary numbers on the dashboard.
 */
function renderDashboardSummary() {
    const totalSpent = getTotalSpent();
    const budgetCap = parseFloat(settings.budgetCap || 0);
    const budgetRemaining = budgetCap - totalSpent;

    const categoryTotals = transactions.reduce((acc, t) => {
        const category = t.category || 'Other';
        const amount = parseFloat(t.amount || 0);
        if (amount > 0) acc[category] = (acc[category] || 0) + amount; 
        return acc;
    }, {});

    let topCategory = 'N/A';
    let maxSpent = 0;
    for (const category in categoryTotals) {
        if (categoryTotals[category] > maxSpent) {
            maxSpent = categoryTotals[category];
            topCategory = category;
        }
    }

    // 1. Dashboard updates
    if (DOMElements.totalSpentDisplay) DOMElements.totalSpentDisplay.textContent = formatCurrency(totalSpent);
    if (DOMElements.budgetRemainingDisplay) DOMElements.budgetRemainingDisplay.textContent = formatCurrency(budgetRemaining);
    if (DOMElements.topCategoryDisplay) DOMElements.topCategoryDisplay.textContent = topCategory;
    if (DOMElements.totalTransactionsDisplay) DOMElements.totalTransactionsDisplay.textContent = transactions.length;
    
    // 2. Settings page budget status update
    if (DOMElements.budgetStatusDisplay) DOMElements.budgetStatusDisplay.textContent = `Current Budget: ${formatCurrency(budgetCap)}`;


    // 3. Visual styling for budget remaining
    if (DOMElements.budgetRemainingDisplay) {
        DOMElements.budgetRemainingDisplay.parentElement.classList.remove('bg-red', 'bg-green');
        
        // Use polite ARIA live region for status change
        let statusMessage = '';
        if (budgetRemaining < 0) {
            DOMElements.budgetRemainingDisplay.parentElement.classList.add('bg-red');
            statusMessage = `Warning: You have exceeded your budget cap by ${formatCurrency(Math.abs(budgetRemaining))}.`;
            DOMElements.budgetRemainingDisplay.setAttribute('aria-live', 'assertive'); // Assertive for negative
        } else if (budgetRemaining > 0) {
            DOMElements.budgetRemainingDisplay.parentElement.classList.add('bg-green');
            statusMessage = `You have ${formatCurrency(budgetRemaining)} remaining in your budget.`;
            DOMElements.budgetRemainingDisplay.setAttribute('aria-live', 'polite'); // Polite for positive
        } else {
            DOMElements.budgetRemainingDisplay.setAttribute('aria-live', 'polite');
        }
        
        // This is a simple ARIA live update. The display itself is the live region.
        // For more complex alerts, we'd use a dedicated hidden element.
        if (DOMElements.budgetRemainingDisplay.textContent !== formatCurrency(budgetRemaining)) {
             // Screen reader only announces the value change, not the status message string
        }
    }
}

/**
 * Creates the HTML table row for a single transaction, including highlighting.
 */
function createTransactionRow(t) {
    const displayAmount = formatCurrency(t.amount);
    
    const formatTimestamp = (ts) => ts ? new Date(ts).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';
    
    const createdAtDate = formatTimestamp(t.createdAt);
    
    // REQUIRED: Apply highlighting using the live search regex
    const markedDescription = highlight(t.description, liveSearchRegex);

    const formattedId = String(t.id).padStart(4, '0');

    return `
        <tr>
            <td data-label="ID">${formattedId}</td>
            <td data-label="Created At">${createdAtDate}</td>
            <td data-label="Date">${t.date}</td>
            <td data-label="Amount">${displayAmount}</td>
            <td data-label="Category">${t.category}</td>
            <td data-label="Description">${markedDescription}</td>
            <td class="action-cell" data-label="Actions">
                <button class="btn-icon btn-edit" data-id="${t.id}" aria-label="Edit transaction ID ${formattedId}">&#x270E;</button>
                <button class="btn-icon btn-delete" data-id="${t.id}" aria-label="Delete transaction ID ${formattedId}">&#x2715;</button>
            </td>
        </tr>
    `;
}

/**
 * Robust sorting function.
 */
function sortTransactions(arr) {
    const key = settings.sortKey;
    const order = settings.sortOrder === 'asc' ? 1 : -1;

    return [...arr].sort((a, b) => {
        let valA = a[key];
        let valB = b[key];
        let comparison = 0;

        if (key === 'amount' || key === 'id') {
            valA = parseFloat(valA || 0);
            valB = parseFloat(valB || 0);
            comparison = valA - valB;
        } 
        else if (key === 'date' || key === 'createdAt' || key === 'updatedAt') {
            if (valA < valB) comparison = -1;
            if (valA > valB) comparison = 1;
        }
        else { // String comparison (description, category)
            if (valA < valB) comparison = -1;
            if (valA > valB) comparison = 1;
        }

        return comparison * order;
    });
}


/**
 * Main function to render the entire transaction table.
 */
export function renderTransactionTable() {
    const tBody = DOMElements.recordsTbody;
    if (!tBody) return; 

    const searchPattern = DOMElements.regexSearchInput ? DOMElements.regexSearchInput.value : '';
    
    // 1. Compile the Regex for filtering and highlighting
    liveSearchRegex = compileRegex(searchPattern); // Uses search.js

    // 2. Filter, then Sort
    const filteredTransactions = filterTransactionsByRegex(transactions, searchPattern); // Uses search.js
    const sortedTransactions = sortTransactions(filteredTransactions);

    tBody.innerHTML = ''; 

    if (sortedTransactions.length === 0) {
        if (DOMElements.noRecordsMessage) {
            DOMElements.noRecordsMessage.textContent = liveSearchRegex === null ? 'No transactions found. Add one below!' : 'No transactions match your search pattern.';
            DOMElements.noRecordsMessage.style.display = 'block';
        } else {
             tBody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px;">${liveSearchRegex === null ? 'No transactions found.' : 'No transactions match your search pattern.'}</td></tr>`;
        }
        return;
    }

    if (DOMElements.noRecordsMessage) DOMElements.noRecordsMessage.style.display = 'none';
    
    // 3. Render
    const rowsHtml = sortedTransactions.map(createTransactionRow).join('');
    tBody.innerHTML = rowsHtml;
}

/**
 * The master render function that calls all necessary UI updates.
 */
function masterRender() {
    saveTransactions(transactions);
    saveSettings(settings);
    
    renderDashboardSummary();
    renderTransactionTable();
    
    // Update settings form values if we are on the settings page
    if (DOMElements.settingsForm) {
        DOMElements.baseCurrencySelect.value = settings.baseCurrency;
        DOMElements.budgetCapInput.value = settings.budgetCap;
    }
}

// 4. EVENT HANDLERS

/**
 * Handles form submission for adding or updating a transaction.
 */
function handleTransactionSubmit(event) {
    event.preventDefault();
    
    const transactionId = DOMElements.transactionIdInput.value ? parseInt(DOMElements.transactionIdInput.value) : null;

    const formData = {
        id: transactionId, 
        description: DOMElements.transactionForm.description.value.trim(),
        amount: DOMElements.transactionForm.amount.value.trim(),
        category: DOMElements.transactionForm.category.value,
        date: DOMElements.transactionForm.date.value,
    };
    
    const errors = validateTransaction(formData); // Uses validators.js
    
    // Clear old errors and display new ones
    document.getElementById('description-error').textContent = errors.description || '';
    document.getElementById('amount-error').textContent = errors.amount || '';
    document.getElementById('category-error').textContent = errors.category || '';
    document.getElementById('date-error').textContent = errors.date || '';

    if (Object.keys(errors).length > 0) {
        displayStatusMessage('Error: Please fix the issues in the form.', 'error');
        return;
    }

    if (transactionId !== null) {
        // FIX: UPDATE Existing Transaction
        if (updateTransaction(formData)) {
            displayStatusMessage(`Transaction ID ${String(transactionId).padStart(4, '0')} updated successfully!`, 'success');
        } else {
            displayStatusMessage('Error: Could not find transaction to update.', 'error');
        }
    } else {
        // ADD New Transaction
        addTransaction(formData);
        displayStatusMessage('Transaction saved successfully!', 'success');
    }

    masterRender();
    clearForm(); 
}

/**
 * Handles table clicks for Delete and Edit actions.
 */
function handleTableClick(event) {
    const target = event.target;
    
    // --- DELETE ACTION ---
    if (target.closest('.btn-delete')) {
        const deleteButton = target.closest('.btn-delete');
        const id = parseInt(deleteButton.dataset.id);
        const formattedId = String(id).padStart(4, '0');

        if (confirm(`Are you sure you want to delete transaction ID ${formattedId}?`)) {
            if (deleteTransaction(id)) {
                masterRender();
                displayStatusMessage('Transaction deleted.', 'success');
            }
        }
    }

    // --- EDIT ACTION ---
    if (target.closest('.btn-edit')) {
        const editButton = target.closest('.btn-edit');
        const id = parseInt(editButton.dataset.id);
        const transactionToEdit = transactions.find(t => t.id === id);

        if (transactionToEdit) {
            // 1. Populate the form fields
            DOMElements.transactionIdInput.value = id; 
            DOMElements.transactionForm.description.value = transactionToEdit.description;
            // Use Math.abs in case it was a negative credit entry, but don't force positive, just use the value
            DOMElements.transactionForm.amount.value = parseFloat(transactionToEdit.amount).toFixed(2); 
            DOMElements.transactionForm.category.value = transactionToEdit.category;
            DOMElements.transactionForm.date.value = transactionToEdit.date;
            
            // 2. Change button text and scroll to form
            DOMElements.saveTransactionBtn.textContent = `Update Transaction ${String(id).padStart(4, '0')}`;
            document.getElementById('add-transaction-heading').scrollIntoView({ behavior: 'smooth' });

            displayStatusMessage(`Editing Transaction ID ${String(id).padStart(4, '0')}. Click 'Update' or 'Clear Form'.`, 'info');
        } else {
            displayStatusMessage('Error: Transaction not found.', 'error');
        }
    }
}

/**
 * FIX: Handles the settings form submission.
 */
function handleSettingsSubmit(event) {
    event.preventDefault();

    const newSettings = {
        baseCurrency: DOMElements.baseCurrencySelect.value,
        budgetCap: parseFloat(DOMElements.budgetCapInput.value) || 0,
    };

    updateSettings(newSettings);
    masterRender();
    displayStatusMessage('Settings saved successfully!', 'success', DOMElements.settingsStatus);
}

/**
 * Handles the Export Data button click.
 */
function handleExport() {
    const dataToExport = {
        transactions: transactions,
        settings: settings,
    };
    const dataStr = JSON.stringify(dataToExport, null, 2); 
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `sft_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    displayStatusMessage('Data exported successfully!', 'success', DOMElements.settingsStatus);
}

/**
 * FIX: Handles the file selection for importing data with validation.
 */
function handleImportFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);

            // REQUIRED: Validate JSON structure before loading
            if (!importedData || !Array.isArray(importedData.transactions) || !importedData.settings) {
                displayStatusMessage('Error: Imported JSON must contain a "transactions" array and a "settings" object.', 'error', DOMElements.settingsStatus);
                return;
            }

            initializeState(importedData.transactions, importedData.settings);
            
            masterRender();
            displayStatusMessage('Data imported and loaded successfully!', 'success', DOMElements.settingsStatus);
            DOMElements.importFile.value = '';

        } catch (error) {
            console.error("Import JSON parsing error:", error);
            displayStatusMessage('Error: The file is not a valid JSON format.', 'error', DOMElements.settingsStatus);
            DOMElements.importFile.value = '';
        }
    };
    reader.onerror = () => {
        displayStatusMessage('Error reading file.', 'error', DOMElements.settingsStatus);
    };
    reader.readAsText(file);
}

/**
 * Handles the Clear All Data button click.
 */
function handleClearAllData() {
    if (confirm('WARNING: This will permanently delete ALL transactions and settings. Are you sure?')) {
        clearAllData(); 
        initializeState([], { budgetCap: 0, baseCurrency: 'USD', sortKey: 'date', sortOrder: 'desc' });
        masterRender();
        displayStatusMessage('All application data has been cleared.', 'success', DOMElements.settingsStatus);
    }
}

/**
 * Displays a transient status message (success/error).
 */
function displayStatusMessage(message, type, targetElement = document.getElementById('form-status')) {
    if (!targetElement) return;

    targetElement.textContent = message;
    targetElement.className = `status-message ${type}`;

    setTimeout(() => {
        targetElement.className = 'status-message';
        targetElement.textContent = '';
    }, 4000);
}

/**
 * General Navigation and Active Link Handler
 */
function handleNavigationAndSearch() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';

    // 1. Navigation Active State
    document.querySelectorAll('.nav-menu .nav-link').forEach(link => {
        link.classList.remove('active');
        const linkPath = link.getAttribute('href').split('/').pop() || 'index.html';
        
        if (linkPath === currentPath) {
            link.classList.add('active');
        }
    });

    // 2. Search Button Action
    if (DOMElements.searchBtn) {
        DOMElements.searchBtn.addEventListener('click', () => {
            // Only try to focus or scroll if we are on the dashboard/index page
            if (currentPath === 'index.html' || currentPath === '') {
                DOMElements.regexSearchInput?.focus();
                document.getElementById('records-table')?.scrollIntoView({ behavior: 'smooth' });
            } else {
                // If not on index, redirect to index and scroll
                window.location.href = 'index.html#records-table';
            }
        });
    }
}


// 5. INITIALIZATION
function init() {
    // A. Load data from local storage first
    const loadedTransactions = loadTransactions();
    const loadedSettings = loadSettings();
    initializeState(loadedTransactions, loadedSettings);

    // B. Set up event listeners
    if (DOMElements.transactionForm) {
        DOMElements.transactionForm.addEventListener('submit', handleTransactionSubmit);
    }
    if (DOMElements.recordsTbody) {
        DOMElements.recordsTbody.addEventListener('click', handleTableClick);
    }
    if (DOMElements.clearFormBtn) {
        DOMElements.clearFormBtn.addEventListener('click', clearForm);
    }

    // Sort controls listeners
    if (DOMElements.sortBySelect) {
        DOMElements.sortBySelect.value = settings.sortKey; 
        DOMElements.sortBySelect.addEventListener('change', (e) => {
            updateSettings({ sortKey: e.target.value });
            masterRender();
        });
    }

    if (DOMElements.sortOrderBtn) {
        DOMElements.sortOrderBtn.textContent = settings.sortOrder === 'desc' ? '🔽' : '🔼'; 
        DOMElements.sortOrderBtn.addEventListener('click', () => {
            const newOrder = settings.sortOrder === 'desc' ? 'asc' : 'desc';
            updateSettings({ sortOrder: newOrder });
            DOMElements.sortOrderBtn.textContent = newOrder === 'desc' ? '🔼' : '🔽';
            masterRender();
        });
    }

    // FIX: Search listener added to trigger re-render on input
    if (DOMElements.regexSearchInput) {
        DOMElements.regexSearchInput.addEventListener('input', renderTransactionTable); 
    }
    
    // C. Settings Page Listeners
    if (DOMElements.settingsForm) {
        DOMElements.settingsForm.addEventListener('submit', handleSettingsSubmit);
        DOMElements.exportBtn.addEventListener('click', handleExport);
        DOMElements.importFile.addEventListener('change', handleImportFileSelect);
        DOMElements.clearAllBtn.addEventListener('click', handleClearAllData);
    }

    // D. Global Navigation and Search button helper
    handleNavigationAndSearch();

    // E. Initial render after loading data
    masterRender();
}

// Start the entire application!
init();
