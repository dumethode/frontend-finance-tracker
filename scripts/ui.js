// scripts/ui.js

// 1. IMPORT ALL NECESSARY MODULES
import { transactions, settings, initializeState, addTransaction, deleteTransaction, updateSettings, getTotalSpent } from './state.js';
import { loadTransactions, saveTransactions, loadSettings, saveSettings, clearAllData } from './storage.js';
import { validateTransaction } from './validators.js';
import { filterTransactionsByRegex } from './search.js';


// 2. DOM ELEMENT REFERENCES (A quick way to get elements from the HTML)
const DOMElements = {
    // Transaction Form Elements (index.html)
    transactionForm: document.getElementById('transaction-form'),
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
    settingsForm: document.getElementById('settings-form'), // NEW: Reference to the whole form
    baseCurrencySelect: document.getElementById('base-currency'),
    budgetCapInput: document.getElementById('budget-cap-input'),
    budgetStatusDisplay: document.getElementById('budget-status-display'),
    saveSettingsBtn: document.getElementById('save-settings-btn'), // The single save button
    clearAllBtn: document.getElementById('clear-all-btn'),
};


// 3. HELPER FUNCTION: Currency Formatting
// This function helps show money correctly (e.g., $5.00)
function formatCurrency(amount) {
    // Check if amount is a valid number, default to 0 if not
    const numberAmount = isNaN(parseFloat(amount)) ? 0 : parseFloat(amount);
    
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: settings.baseCurrency, // Uses the currency stored in state
        minimumFractionDigits: 2,
    });
    return formatter.format(numberAmount);
}


// 4. HELPER FUNCTION: Sorting Logic
function sortTransactions(data) {
    // (Sorting logic remains the same)
    const { sortKey, sortOrder } = settings; 
    const sortedData = [...data]; 

    sortedData.sort((a, b) => {
        let valA = a[sortKey];
        let valB = b[sortKey];

        if (sortKey === 'amount') {
            valA = parseFloat(valA);
            valB = parseFloat(valB);
        } else if (sortKey === 'date') {
            valA = new Date(valA).getTime();
            valB = new Date(valB).getTime();
        }

        let comparison = 0;
        if (valA > valB) {
            comparison = 1;
        } else if (valA < valB) {
            comparison = -1;
        }

        return sortOrder === 'asc' ? comparison : comparison * -1;
    });

    return sortedData;
}


// 5. CORE RENDERING FUNCTION: Dashboard Summary (index.html)
function renderDashboardSummary() {
    if (!DOMElements.totalSpentDisplay) return; // Only run if on index.html

    const totalSpent = getTotalSpent();
    const budgetCap = settings.budgetCap;

    // A. Update Total Spent
    DOMElements.totalSpentDisplay.textContent = formatCurrency(totalSpent);

    // B. Update Budget Remaining
    const remaining = budgetCap - totalSpent;
    DOMElements.budgetRemainingDisplay.textContent = formatCurrency(Math.abs(remaining));
    
    if (remaining < 0) {
        DOMElements.budgetRemainingDisplay.style.color = 'var(--color-accent)'; // Red (Over budget)
    } else {
        DOMElements.budgetRemainingDisplay.style.color = 'var(--color-primary)'; // Blue (Under budget)
    }

    // C. Find Top Category (Count based)
    const categoryCounts = transactions.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + 1;
        return acc;
    }, {});
    
    let topCategory = 'None';
    let maxCount = 0;
    for (const category in categoryCounts) {
        if (categoryCounts[category] > maxCount) {
            maxCount = categoryCounts[category];
            topCategory = category;
        }
    }
    DOMElements.topCategoryDisplay.textContent = topCategory;

    // D. Update Total Transactions Count
    DOMElements.totalTransactionsDisplay.textContent = transactions.length;
}


// 6. CORE RENDERING FUNCTION: Records Table (index.html)
function renderRecordsTable() {
    if (!DOMElements.recordsTbody) return; // Only run if on index.html
    
    DOMElements.recordsTbody.innerHTML = '';
    
    const searchPattern = DOMElements.regexSearchInput.value;
    let filteredTransactions = filterTransactionsByRegex(transactions, searchPattern);
    const sortedTransactions = sortTransactions(filteredTransactions);

    if (sortedTransactions.length === 0) {
        DOMElements.noRecordsMessage.style.display = 'block';
    } else {
        DOMElements.noRecordsMessage.style.display = 'none';
        
        sortedTransactions.forEach(t => {
            const row = DOMElements.recordsTbody.insertRow();
            row.innerHTML = `
                <td>${t.date}</td>
                <td>${t.description}</td>
                <td class="amount">${formatCurrency(t.amount)}</td>
                <td>${t.category}</td>
                <td><button data-id="${t.id}" class="btn btn-danger btn-sm delete-btn">Delete</button></td>
            `;
        });
    }

    renderDashboardSummary();
}


// 7. EVENT HANDLER: Transaction Form Submission (index.html)
function handleFormSubmit(event) {
    event.preventDefault(); 
    // (Form submission logic remains the same)
    const formData = {
        description: document.getElementById('description').value,
        amount: document.getElementById('amount').value,
        category: document.getElementById('category').value,
        date: document.getElementById('date').value,
    };
    
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');

    const errors = validateTransaction(formData);
    
    if (Object.keys(errors).length > 0) {
        for (const key in errors) {
            document.getElementById(`${key}-error`).textContent = errors[key];
        }
        document.getElementById('form-status').textContent = 'Please fix the errors above.';
    } else {
        addTransaction(formData); 
        saveTransactions(transactions); 
        
        renderRecordsTable();
        
        DOMElements.transactionForm.reset();
        document.getElementById('form-status').textContent = 'Transaction saved successfully!';
        setTimeout(() => document.getElementById('form-status').textContent = '', 3000); 
    }
}


// 8. EVENT HANDLER: Delete Button Click (index.html)
function handleDeleteClick(event) {
    // (Delete logic remains the same)
    if (event.target.classList.contains('delete-btn')) {
        const transactionId = parseInt(event.target.dataset.id); 

        if (confirm("Are you sure you want to delete this transaction?")) {
            deleteTransaction(transactionId); 
            saveTransactions(transactions);  
            renderRecordsTable();           
        }
    }
}


// 9. EVENT HANDLER: Sort Button and Search (index.html)
function handleSortToggle() {
    // (Sort toggle logic remains the same)
    settings.sortOrder = settings.sortOrder === 'asc' ? 'desc' : 'asc';
    
    DOMElements.sortOrderBtn.textContent = settings.sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending';
    
    saveSettings(settings);
    renderRecordsTable();
}

function handleSortChange() {
    // (Sort change logic remains the same)
    settings.sortKey = DOMElements.sortBySelect.value;
    saveSettings(settings);
    renderRecordsTable();
}


// 10. EVENT HANDLER: Settings Page Save (settings.html)
function handleSettingsSave(event) {
    event.preventDefault(); // Stop the form from submitting and reloading the page
    
    if (!DOMElements.settingsForm) return; // Only run on settings page

    const newCurrency = DOMElements.baseCurrencySelect.value;
    const newBudgetCap = parseFloat(DOMElements.budgetCapInput.value);

    // 1. Validate the budget input
    if (isNaN(newBudgetCap) || newBudgetCap < 0) {
        alert('Please enter a valid positive number for the budget.');
        return;
    }

    // 2. Update the state with new settings
    updateSettings({
        baseCurrency: newCurrency,
        budgetCap: newBudgetCap,
    });
    
    // 3. Save settings to permanent storage
    saveSettings(settings);
    
    // 4. Update UI displays
    DOMElements.budgetStatusDisplay.textContent = `Current Budget: ${formatCurrency(settings.budgetCap)}`;
    
    // 5. Show success message
    const statusEl = document.getElementById('settings-status');
    if(statusEl) {
        statusEl.textContent = 'Settings saved successfully!';
        setTimeout(() => statusEl.textContent = '', 3000);
    }
    
    // IMPORTANT: If we were on the dashboard, the budget formatting would now be correct!
    // Since we're on the settings page, this just confirms the save.
}


// 11. EVENT HANDLER: Clear All Data (settings.html)
function handleClearAllData() {
    if (confirm("WARNING: This will permanently delete ALL your transactions and settings. Are you absolutely sure?")) {
        clearAllData(); 
        initializeState([]); // Reset memory to empty
        alert('All data has been cleared! The page will now reload.');
        window.location.reload(); // Reload the page to show the reset state
    }
}


// 12. INITIALIZATION FUNCTION: Runs when the page first loads
function init() {
    // A. Load Data from Storage
    const storedTransactions = loadTransactions();
    initializeState(storedTransactions); 
    
    const storedSettings = loadSettings();
    if (storedSettings) {
        updateSettings(storedSettings); 
    }
    
    // B. Set up Event Listeners for Index Page
    if (DOMElements.transactionForm) {
        DOMElements.transactionForm.addEventListener('submit', handleFormSubmit);
        DOMElements.recordsTbody.addEventListener('click', handleDeleteClick);
        DOMElements.sortOrderBtn.addEventListener('click', handleSortToggle);
        DOMElements.sortBySelect.addEventListener('change', handleSortChange);
        DOMElements.regexSearchInput.addEventListener('input', renderRecordsTable); 
        
        // Initial render of the table and summary
        renderRecordsTable();
        renderDashboardSummary();
    }
    
    // C. Set up Event Listeners for Settings Page
    if (DOMElements.settingsForm) {
        // Set the current values of the settings inputs from the loaded state
        DOMElements.baseCurrencySelect.value = settings.baseCurrency;
        DOMElements.budgetCapInput.value = settings.budgetCap;
        
        // Display the current budget using the loaded currency
        DOMElements.budgetStatusDisplay.textContent = `Current Budget: ${formatCurrency(settings.budgetCap)}`;

        // Attach the save handler to the settings form submission
        DOMElements.settingsForm.addEventListener('submit', handleSettingsSave);
        
        // Attach the clear data handler
        DOMElements.clearAllBtn.addEventListener('click', handleClearAllData);
    }

    // D. Global Navigation Helper (Existing code from last revision)
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.href === window.location.href || 
            (link.href.includes(currentPath) && currentPath !== "/") ||
            (currentPath === "/" && link.dataset.page === "dashboard")) {
            link.classList.add('active');
        }
    });

    document.querySelectorAll('.nav-link[href*="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').split('#')[1];
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
                history.pushState(null, '', this.getAttribute('href'));
            }
        });
    });

    document.querySelector('.search-btn')?.addEventListener('click', () => {
        if (currentPath === '/' || currentPath === '/index.html') {
            document.getElementById('regex-search')?.focus();
            document.getElementById('main-content')?.scrollIntoView({ behavior: 'smooth' });
        } else {
            window.location.href = 'index.html#main-content';
        }
    });
}

// Start the entire application!
init();