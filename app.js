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

// Timeline elements
const timelineHeader = document.getElementById('timeline-header');
const timelineBody = document.getElementById('timeline-body');
const geenTimeline = document.getElementById('geen-timeline');

// Data storage
let klussen = [];
let totaalBudgetVerbouwing = 0;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadKlussen();
    loadTotaalBudget();
    renderKlussen();
    renderTimeline();
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

// Format short date for timeline
function formatShortDate(date) {
    return new Intl.DateTimeFormat('nl-NL', {
        day: 'numeric',
        month: 'short'
    }).format(date);
}

// Convert duur string to days
function duurToDays(duur) {
    if (!duur) return 1; // Default 1 dag

    const duurMap = {
        '1 dag': 1,
        '2 dagen': 2,
        '3 dagen': 3,
        '4 dagen': 4,
        '5 dagen': 5,
        '1 week': 7,
        '2 weken': 14,
        '3 weken': 21,
        '1 maand': 30,
        '2 maanden': 60,
        '3 maanden': 90
    };

    return duurMap[duur] || 1;
}

// Calculate end date based on start date and duration
function calculateEndDate(klus) {
    const startDate = new Date(klus.datum);

    // Priority: 1. einddatum, 2. duur, 3. default 1 day
    if (klus.einddatum) {
        return new Date(klus.einddatum);
    }

    const days = duurToDays(klus.duur);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days - 1);
    return endDate;
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
    renderTimeline();
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

// Render timeline
function renderTimeline() {
    if (klussen.length === 0) {
        timelineHeader.innerHTML = '';
        timelineBody.innerHTML = '';
        geenTimeline.classList.add('show');
        return;
    }

    geenTimeline.classList.remove('show');

    // Sort klussen by start date
    const sortedKlussen = [...klussen].sort((a, b) => new Date(a.datum) - new Date(b.datum));

    // Calculate timeline range
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let minDate = new Date(sortedKlussen[0].datum);
    let maxDate = calculateEndDate(sortedKlussen[0]);

    sortedKlussen.forEach(klus => {
        const startDate = new Date(klus.datum);
        const endDate = calculateEndDate(klus);

        if (startDate < minDate) minDate = startDate;
        if (endDate > maxDate) maxDate = endDate;
    });

    // Include today in range if not already
    if (today < minDate) minDate = new Date(today);
    if (today > maxDate) maxDate = new Date(today);

    // Extend range by 1 month on each side for better visibility
    minDate.setDate(1); // Start of month
    maxDate.setMonth(maxDate.getMonth() + 1);
    maxDate.setDate(0); // End of month

    // Generate months for header
    const months = [];
    const currentMonth = new Date(minDate);
    currentMonth.setDate(1);

    while (currentMonth <= maxDate) {
        months.push(new Date(currentMonth));
        currentMonth.setMonth(currentMonth.getMonth() + 1);
    }

    // Calculate total days and pixels per day
    const totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1;
    const pixelsPerDay = 4; // 4 pixels per day
    const labelWidth = 150; // Width of klus label

    // Render header
    timelineHeader.innerHTML = `<div style="width: ${labelWidth}px; flex-shrink: 0;"></div>`;
    months.forEach(month => {
        const monthName = new Intl.DateTimeFormat('nl-NL', { month: 'short', year: 'numeric' }).format(month);
        const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
        const isCurrentMonth = month.getMonth() === today.getMonth() && month.getFullYear() === today.getFullYear();

        timelineHeader.innerHTML += `
            <div class="timeline-month ${isCurrentMonth ? 'current' : ''}" style="width: ${daysInMonth * pixelsPerDay}px;">
                ${monthName}
            </div>
        `;
    });

    // Render body with klussen
    timelineBody.innerHTML = '';

    sortedKlussen.forEach(klus => {
        const startDate = new Date(klus.datum);
        const endDate = calculateEndDate(klus);

        // Calculate position and width
        const startOffset = Math.floor((startDate - minDate) / (1000 * 60 * 60 * 24));
        const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

        const leftPosition = startOffset * pixelsPerDay;
        const width = duration * pixelsPerDay;

        const row = document.createElement('div');
        row.className = 'timeline-row';

        row.innerHTML = `
            <div class="timeline-klus-label" title="${escapeHtml(klus.naam)}">${escapeHtml(klus.naam)}</div>
            <div class="timeline-track" style="width: ${totalDays * pixelsPerDay}px;">
                <div class="timeline-bar ${klus.status}"
                     style="left: ${leftPosition}px; width: ${width}px;"
                     onclick="openEditModal('${klus.id}')"
                     title="${escapeHtml(klus.naam)}: ${formatShortDate(startDate)} - ${formatShortDate(endDate)}">
                    <span class="timeline-bar-dates">${formatShortDate(startDate)} - ${formatShortDate(endDate)}</span>
                </div>
            </div>
        `;

        timelineBody.appendChild(row);
    });

    // Add today line
    const todayOffset = Math.floor((today - minDate) / (1000 * 60 * 60 * 24));
    if (todayOffset >= 0 && todayOffset <= totalDays) {
        const todayLine = document.createElement('div');
        todayLine.className = 'timeline-today-marker';
        todayLine.style.cssText = `
            position: absolute;
            left: ${labelWidth + todayOffset * pixelsPerDay}px;
            top: 0;
            bottom: 0;
            width: 2px;
            background-color: #dc2626;
            z-index: 5;
        `;

        const todayLabel = document.createElement('div');
        todayLabel.style.cssText = `
            position: absolute;
            top: -18px;
            left: -20px;
            font-size: 0.7rem;
            color: #dc2626;
            font-weight: 600;
            white-space: nowrap;
        `;
        todayLabel.textContent = 'Vandaag';
        todayLine.appendChild(todayLabel);

        timelineBody.style.position = 'relative';
        timelineBody.appendChild(todayLine);
    }
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
        renderTimeline();
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
    renderTimeline();
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
