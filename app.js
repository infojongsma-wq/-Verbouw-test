// Verbouwing Klussen Tracker - JavaScript

// DOM Elements
const klusForm = document.getElementById('klus-form');
const klussenLijst = document.getElementById('klussen-lijst');
const geenKlussen = document.getElementById('geen-klussen');
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const closeModal = document.querySelector('.close');
const filterStatus = document.getElementById('filter-status');
const filterSort = document.getElementById('filter-sort');

// Stats elements
const totaalBudgetKlussenEl = document.getElementById('totaal-budget-klussen');
const aantalKlussenEl = document.getElementById('aantal-klussen');
const afgerondKlussenEl = document.getElementById('afgerond-klussen');

// Budget overview elements
const totaalBudgetInput = document.getElementById('totaal-budget-input');
const displayTotaalBudget = document.getElementById('display-totaal-budget');
const displayUitgegeven = document.getElementById('display-uitgegeven');
const displayResterend = document.getElementById('display-resterend');
const budgetPercentage = document.getElementById('budget-percentage');
const budgetProgressFill = document.getElementById('budget-progress-fill');
const uitgegvenCard = document.getElementById('uitgegeven-card');
const resterendCard = document.getElementById('resterend-card');

// Data storage
let klussen = [];
let totaalBudgetVerbouwing = 0;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadKlussen();
    loadTotaalBudget();
    renderKlussen();
    updateStats();
    updateBudgetOverview();
    setDefaultDate();
});

// Set default date to today
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('klus-datum').value = today;
}

// Load klussen from localStorage
function loadKlussen() {
    const stored = localStorage.getItem('verbouwing-klussen');
    if (stored) {
        klussen = JSON.parse(stored);
    }
}

// Save klussen to localStorage
function saveKlussen() {
    localStorage.setItem('verbouwing-klussen', JSON.stringify(klussen));
}

// Load totaal budget from localStorage
function loadTotaalBudget() {
    const stored = localStorage.getItem('verbouwing-totaal-budget');
    if (stored) {
        totaalBudgetVerbouwing = parseFloat(stored);
        totaalBudgetInput.value = totaalBudgetVerbouwing;
    }
}

// Save totaal budget to localStorage
function saveTotaalBudget() {
    localStorage.setItem('verbouwing-totaal-budget', totaalBudgetVerbouwing.toString());
}

// Totaal budget input handler
totaalBudgetInput.addEventListener('input', () => {
    totaalBudgetVerbouwing = parseFloat(totaalBudgetInput.value) || 0;
    saveTotaalBudget();
    updateBudgetOverview();
});

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('nl-NL', {
        style: 'currency',
        currency: 'EUR'
    }).format(amount);
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('nl-NL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(date);
}

// Add new klus
klusForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const werkelijkValue = document.getElementById('klus-werkelijk').value;

    const klus = {
        id: generateId(),
        naam: document.getElementById('klus-naam').value.trim(),
        datum: document.getElementById('klus-datum').value,
        einddatum: document.getElementById('klus-einddatum').value || null,
        duur: document.getElementById('klus-duur').value || null,
        budget: parseFloat(document.getElementById('klus-budget').value),
        werkelijk: werkelijkValue ? parseFloat(werkelijkValue) : null,
        uitvoerder: document.getElementById('klus-uitvoerder').value.trim(),
        status: document.getElementById('klus-status').value,
        notities: document.getElementById('klus-notities').value.trim(),
        aangemaakt: new Date().toISOString()
    };

    klussen.push(klus);
    saveKlussen();
    renderKlussen();
    updateStats();
    updateBudgetOverview();

    // Reset form
    klusForm.reset();
    setDefaultDate();
});

// Render klussen list
function renderKlussen() {
    // Get filter and sort values
    const statusFilter = filterStatus.value;
    const sortValue = filterSort.value;

    // Filter klussen
    let filteredKlussen = klussen;
    if (statusFilter !== 'alle') {
        filteredKlussen = klussen.filter(k => k.status === statusFilter);
    }

    // Sort klussen
    filteredKlussen = [...filteredKlussen].sort((a, b) => {
        switch (sortValue) {
            case 'datum-asc':
                return new Date(a.datum) - new Date(b.datum);
            case 'datum-desc':
                return new Date(b.datum) - new Date(a.datum);
            case 'budget-asc':
                return a.budget - b.budget;
            case 'budget-desc':
                return b.budget - a.budget;
            default:
                return 0;
        }
    });

    // Clear list
    klussenLijst.innerHTML = '';

    // Show/hide empty message
    if (filteredKlussen.length === 0) {
        geenKlussen.classList.add('show');
        if (klussen.length === 0) {
            geenKlussen.textContent = 'Nog geen klussen toegevoegd. Voeg je eerste klus hierboven toe!';
        } else {
            geenKlussen.textContent = 'Geen klussen gevonden met de huidige filters.';
        }
    } else {
        geenKlussen.classList.remove('show');
    }

    // Render each klus
    filteredKlussen.forEach(klus => {
        const card = createKlusCard(klus);
        klussenLijst.appendChild(card);
    });
}

// Create klus card element
function createKlusCard(klus) {
    const card = document.createElement('div');
    card.className = `klus-card status-${klus.status}`;
    card.dataset.id = klus.id;

    const notitiesHtml = klus.notities
        ? `<div class="klus-notities">${escapeHtml(klus.notities)}</div>`
        : '';

    const einddatumHtml = klus.einddatum
        ? `<div class="klus-detail">
                <span class="klus-detail-label">Einddatum</span>
                <span class="klus-detail-value">${formatDate(klus.einddatum)}</span>
            </div>`
        : '';

    const duurHtml = klus.duur
        ? `<div class="klus-detail">
                <span class="klus-detail-label">Duur</span>
                <span class="klus-detail-value">${escapeHtml(klus.duur)}</span>
            </div>`
        : '';

    // Budget en werkelijk met duimpje indicator
    let werkelijkHtml = '';
    if (klus.werkelijk !== null && klus.werkelijk !== undefined) {
        const isOverBudget = klus.werkelijk > klus.budget;
        const indicatorClass = isOverBudget ? 'over-budget' : 'within-budget';
        const thumb = isOverBudget ? '👎' : '👍';

        werkelijkHtml = `
            <div class="klus-detail">
                <span class="klus-detail-label">Werkelijk</span>
                <div class="budget-indicator ${indicatorClass}">
                    <span class="klus-detail-value">${formatCurrency(klus.werkelijk)}</span>
                    <span class="thumb">${thumb}</span>
                </div>
            </div>`;
    }

    card.innerHTML = `
        <div class="klus-header">
            <div>
                <h3>${escapeHtml(klus.naam)}</h3>
            </div>
            <span class="klus-status ${klus.status}">${capitalizeFirst(klus.status)}</span>
        </div>
        <div class="klus-details">
            <div class="klus-detail">
                <span class="klus-detail-label">Startdatum</span>
                <span class="klus-detail-value">${formatDate(klus.datum)}</span>
            </div>
            ${einddatumHtml}
            ${duurHtml}
            <div class="klus-detail">
                <span class="klus-detail-label">Budget</span>
                <span class="klus-detail-value">${formatCurrency(klus.budget)}</span>
            </div>
            ${werkelijkHtml}
            <div class="klus-detail">
                <span class="klus-detail-label">Uitvoerder</span>
                <span class="klus-detail-value">${escapeHtml(klus.uitvoerder)}</span>
            </div>
        </div>
        ${notitiesHtml}
        <div class="klus-actions">
            <button class="btn btn-small btn-edit" onclick="openEditModal('${klus.id}')">Bewerken</button>
            <button class="btn btn-small btn-delete" onclick="deleteKlus('${klus.id}')">Verwijderen</button>
        </div>
    `;

    return card;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Capitalize first letter
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Update statistics
function updateStats() {
    const totaalBudgetKlussen = klussen.reduce((sum, k) => sum + k.budget, 0);
    const aantalKlussen = klussen.length;
    const afgerondKlussen = klussen.filter(k => k.status === 'afgerond').length;

    totaalBudgetKlussenEl.textContent = formatCurrency(totaalBudgetKlussen);
    aantalKlussenEl.textContent = aantalKlussen;
    afgerondKlussenEl.textContent = afgerondKlussen;
}

// Update budget overview
function updateBudgetOverview() {
    // Bereken totaal uitgegeven (werkelijke kosten als ingevuld, anders budget)
    const totaalUitgegeven = klussen.reduce((sum, k) => {
        if (k.werkelijk !== null && k.werkelijk !== undefined) {
            return sum + k.werkelijk;
        }
        return sum;
    }, 0);

    const resterend = totaalBudgetVerbouwing - totaalUitgegeven;
    const percentage = totaalBudgetVerbouwing > 0
        ? Math.min((totaalUitgegeven / totaalBudgetVerbouwing) * 100, 100)
        : 0;

    // Update displays
    displayTotaalBudget.textContent = formatCurrency(totaalBudgetVerbouwing);
    displayUitgegeven.textContent = formatCurrency(totaalUitgegeven);
    displayResterend.textContent = formatCurrency(resterend);

    // Update percentage en progress bar
    budgetPercentage.textContent = `${Math.round(percentage)}%`;
    budgetProgressFill.style.width = `${Math.min(percentage, 100)}%`;

    // Update kleuren gebaseerd op budget status
    if (resterend < 0) {
        resterendCard.classList.add('negative');
        resterendCard.classList.remove('positive');
        budgetProgressFill.classList.add('over-budget');
    } else {
        resterendCard.classList.remove('negative');
        resterendCard.classList.add('positive');
        budgetProgressFill.classList.remove('over-budget');
    }

    // Als meer dan budget uitgegeven
    if (totaalUitgegeven > totaalBudgetVerbouwing && totaalBudgetVerbouwing > 0) {
        budgetProgressFill.style.width = '100%';
    }
}

// Delete klus
function deleteKlus(id) {
    if (confirm('Weet je zeker dat je deze klus wilt verwijderen?')) {
        klussen = klussen.filter(k => k.id !== id);
        saveKlussen();
        renderKlussen();
        updateStats();
        updateBudgetOverview();
    }
}

// Open edit modal
function openEditModal(id) {
    const klus = klussen.find(k => k.id === id);
    if (!klus) return;

    document.getElementById('edit-id').value = klus.id;
    document.getElementById('edit-naam').value = klus.naam;
    document.getElementById('edit-datum').value = klus.datum;
    document.getElementById('edit-einddatum').value = klus.einddatum || '';
    document.getElementById('edit-duur').value = klus.duur || '';
    document.getElementById('edit-budget').value = klus.budget;
    document.getElementById('edit-werkelijk').value = klus.werkelijk !== null ? klus.werkelijk : '';
    document.getElementById('edit-uitvoerder').value = klus.uitvoerder;
    document.getElementById('edit-status').value = klus.status;
    document.getElementById('edit-notities').value = klus.notities || '';

    editModal.classList.add('show');
}

// Close modal
function closeEditModal() {
    editModal.classList.remove('show');
}

closeModal.addEventListener('click', closeEditModal);

// Close modal when clicking outside
editModal.addEventListener('click', (e) => {
    if (e.target === editModal) {
        closeEditModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && editModal.classList.contains('show')) {
        closeEditModal();
    }
});

// Save edited klus
editForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const id = document.getElementById('edit-id').value;
    const klusIndex = klussen.findIndex(k => k.id === id);

    if (klusIndex === -1) return;

    const werkelijkValue = document.getElementById('edit-werkelijk').value;

    klussen[klusIndex] = {
        ...klussen[klusIndex],
        naam: document.getElementById('edit-naam').value.trim(),
        datum: document.getElementById('edit-datum').value,
        einddatum: document.getElementById('edit-einddatum').value || null,
        duur: document.getElementById('edit-duur').value || null,
        budget: parseFloat(document.getElementById('edit-budget').value),
        werkelijk: werkelijkValue ? parseFloat(werkelijkValue) : null,
        uitvoerder: document.getElementById('edit-uitvoerder').value.trim(),
        status: document.getElementById('edit-status').value,
        notities: document.getElementById('edit-notities').value.trim(),
        gewijzigd: new Date().toISOString()
    };

    saveKlussen();
    renderKlussen();
    updateStats();
    updateBudgetOverview();
    closeEditModal();
});

// Filter and sort event listeners
filterStatus.addEventListener('change', renderKlussen);
filterSort.addEventListener('change', renderKlussen);

// Make functions available globally for onclick handlers
window.deleteKlus = deleteKlus;
window.openEditModal = openEditModal;
