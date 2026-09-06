/**
 * ui.js - All UI rendering and DOM updates
 */

import { getNoteById } from './notes.js';
import { 
    formatDate, 
    formatFullDatetime, 
    formatTime, 
    countWords, 
    escapeHtml,
    showToast,
    openModal
} from './utils.js';
import { 
    calculateMetrics, 
    generateInsights,
    renderCharts 
} from './dashboard.js';

// ============================================
// CONSTANTS
// ============================================

const FIELDS = ['Daily Life', 'Work', 'Studying', 'Projects', 'Ideas', 'Personal', 'Other'];
const MOODS = ['Happy', 'Calm', 'Neutral', 'Sad', 'Angry', 'Anxious', 'Excited', 'Tired', 'Motivated'];

// ============================================
// DOM HELPERS
// ============================================

const $ = (id) => document.getElementById(id);

// ============================================
// FORM RENDER
// ============================================

export function renderForm(notes) {
    const fieldSel = $('noteField');
    if (fieldSel && fieldSel.children.length === 0) {
        FIELDS.forEach(f => fieldSel.add(new Option(f, f)));
    }
    const moodSel = $('noteMood');
    if (moodSel && moodSel.children.length === 0) {
        MOODS.forEach(m => moodSel.add(new Option(m, m)));
    }
    const dl = $('locationSuggestions');
    if (dl) {
        dl.innerHTML = '';
        const locations = new Set(notes.map(n => n.location).filter(Boolean));
        ['Home', 'Work', 'Pretoria', 'Johannesburg', 'Cape Town', 'University'].forEach(loc => {
            locations.add(loc);
        });
        locations.forEach(loc => {
            const opt = document.createElement('option');
            opt.value = loc;
            dl.appendChild(opt);
        });
    }
}

export function resetForm() {
    $('noteForm').reset();
    $('editingNoteId').value = '';
    $('noteFormTitle').textContent = 'Capture New Thought';
    $('noteSummary').value = '';
    $('wordCount').textContent = '0 words';
    $('charCount').textContent = '0 chars';
    const now = new Date();
    $('displayDatetime').textContent = formatFullDatetime(now.toISOString());
}

export function populateFormForEdit(id) {
    const note = getNoteById(id);
    if (!note) {
        showToast('Note not found', 'error');
        return;
    }
    $('editingNoteId').value = note.id;
    $('noteFormTitle').textContent = 'Edit Archive Entry';
    $('noteTitle').value = note.title || '';
    $('noteBody').value = note.note;
    $('noteField').value = note.field;
    $('noteMood').value = note.mood;
    $('noteLocation').value = note.location;
    $('noteSummary').value = note.summary || '';
    $('displayDatetime').textContent = formatFullDatetime(note.datetime);
    updateWordCharCount(note.note);
}

export function updateWordCharCount(text) {
    $('wordCount').textContent = `${countWords(text)} words`; // this sets the word count on the noteBody
    $('charCount').textContent = `${text.length} chars`; // this sets the word count on the noteBody
}

// ============================================
// DASHBOARD RENDER
// ============================================

export function renderDashboard(notes, timeframe = 30) {
    const emptyState = $('dashboardEmptyState');
    const content = $('dashboardContent');
    if (notes.length === 0) {
        emptyState.classList.remove('hidden');
        content.classList.add('hidden');
        return;
    }
    emptyState.classList.add('hidden');
    content.classList.remove('hidden');
    
    const metrics = calculateMetrics(notes);
    $('statTotalNotes').textContent = metrics.total;
    $('statStreak').textContent = `${metrics.streak} Day Streak`;
    $('statNotesWeek').textContent = metrics.notesThisWeek;
    $('statNotesMonth').textContent = metrics.notesThisMonth;
    $('statAvgWords').textContent = `${metrics.avgWords} words/note avg`;
    $('statTopField').textContent = metrics.topField.name;
    $('statTopFieldPct').textContent = `${metrics.topField.pct}% of total`;
    $('statTopMood').textContent = metrics.topMood.name;
    $('statTopMoodPct').textContent = `${metrics.topMood.pct}% frequency`;
    $('statTopLocation').textContent = metrics.topLocation.name;
    $('statTopLocationPct').textContent = `${metrics.topLocation.pct}% occurrences`;
    setTimeout(() => renderCharts(notes, timeframe), 50);
}

// ============================================
// ARCHIVE RENDER
// ============================================

export function renderArchive(notes, searchQuery = '', filters = {}) {
    const grid = $('notesGrid');
    grid.innerHTML = '';
    
    let filtered = notes.filter(n => {
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const matchTitle = (n.title || '').toLowerCase().includes(q);
            const matchNote = n.note.toLowerCase().includes(q);
            const matchSummary = (n.summary || '').toLowerCase().includes(q);
            const matchField = n.field.toLowerCase().includes(q);
            const matchMood = n.mood.toLowerCase().includes(q);
            const matchLoc = n.location.toLowerCase().includes(q);
            if (!matchTitle && !matchNote && !matchSummary && !matchField && !matchMood && !matchLoc) {
                return false;
            }
        }
        if (filters.field && filters.field !== 'ALL' && n.field !== filters.field) return false;
        if (filters.mood && filters.mood !== 'ALL' && n.mood !== filters.mood) return false;
        if (filters.location && filters.location !== 'ALL' && n.location !== filters.location) return false;
        return true;
    });
    
    filtered.sort((a, b) => {
        const dA = new Date(a.datetime);
        const dB = new Date(b.datetime);
        return filters.sort === 'newest' ? dB - dA : dA - dB;
    });
    
    $('notesCountBadge').textContent = `${filtered.length} Entries`;
    
    if (filtered.length === 0) {
        grid.innerHTML = `<div class="empty-state-card" style="grid-column:1/-1;"><p>No matching notes found.</p></div>`;
        return;
    }
    
    filtered.forEach(note => {
        const card = document.createElement('div');
        card.className = 'note-card';
        // Clicking the card calls window.__openDetail (defined in app.js)
        card.addEventListener('click', () => {
            window.__openDetail && window.__openDetail(note.id);
        });
        const titleDisplay = note.title || 'Untitled';
        card.innerHTML = `
            <div>
                <div class="note-card-title">${escapeHtml(titleDisplay)}</div>
                <div class="note-card-meta">
                    <span class="badge-style">${escapeHtml(note.field)}</span>
                    <span class="badge-style" style="border-color:rgba(157,78,221,0.3);color:var(--accent-purple)">${escapeHtml(note.mood)}</span>
                </div>
                <div class="note-card-summary">${escapeHtml(note.summary)}</div>
                <div class="note-card-preview">${escapeHtml(note.note)}</div>
            </div>
            <div class="note-card-footer">
                <span>${formatDate(note.datetime)}</span>
                <span>${escapeHtml(note.location)}</span>
            </div>
        `;
        grid.appendChild(card);
    });
}

// ============================================
// DETAIL VIEW RENDER
// ============================================

export function renderNoteDetail(id) {
    const note = getNoteById(id);
    if (!note) {
        showToast('Note not found', 'error');
        return;
    }
    $('detailTitle').textContent = note.title || 'Untitled';
    $('detailSummaryText').textContent = note.summary || 'No summary available.';
    $('detailNoteBody').textContent = note.note;
    $('detailDate').textContent = formatFullDatetime(note.datetime);
    $('detailField').textContent = note.field;
    $('detailMood').textContent = note.mood;
    $('detailLocation').textContent = note.location;
    $('detailWordCount').textContent = `${note.wordCount || countWords(note.note)} words`;
    $('detailCharCount').textContent = `${note.characterCount || note.note.length} chars`;
    $('detailId').textContent = note.id;
    window.__activeDetailId = id;  // store it globally so edit/delete buttons can use it
}

// ============================================
// TIMELINE RENDER
// ============================================

export function renderTimeline(notes) {
    const container = $('timelineContainer');
    container.innerHTML = '';
    if (notes.length === 0) {
        container.innerHTML = '<p class="subtitle">Timeline is empty.</p>';
        return;
    }
    const groups = {};
    notes.forEach(n => {
        const d = formatDate(n.datetime);
        if (!groups[d]) groups[d] = [];
        groups[d].push(n);
    });
    const sortedDates = Object.keys(groups).sort((a, b) => new Date(b) - new Date(a));
    sortedDates.forEach(dateStr => {
        const items = groups[dateStr];
        const groupEl = document.createElement('div');
        groupEl.className = 'timeline-day-group';
        let itemsHtml = items.map(item => `
            <div class="timeline-item" data-id="${item.id}">
                <div class="timeline-header">
                    <span class="timeline-time">${formatTime(item.datetime)}</span>
                    <span class="badge-style">${escapeHtml(item.field)}</span>
                    <span class="badge-style" style="color:var(--accent-purple);border-color:rgba(157,78,221,0.3)">${escapeHtml(item.mood)}</span>
                    <span>&bull; ${escapeHtml(item.location)}</span>
                </div>
                <div style="font-size:0.875rem;font-weight:600;color:#fff;margin-bottom:4px;">${escapeHtml(item.title || 'Untitled')}</div>
                <div style="font-size:0.8rem;color:var(--text-muted);">${escapeHtml(item.summary || item.note.substring(0, 110))}...</div>
            </div>
        `).join('');
        groupEl.innerHTML = `<div class="timeline-date-header">${dateStr}</div>${itemsHtml}`;
        container.appendChild(groupEl);
    });
    // Clicking a timeline item opens detail view
    container.querySelectorAll('.timeline-item').forEach(el => {
        el.addEventListener('click', () => {
            const id = el.dataset.id;
            window.__openDetail && window.__openDetail(id);
        });
    });
}

// ============================================
// INSIGHTS RENDER
// ============================================

export function renderInsights(notes) {
    const container = $('insightsContainer');
    container.innerHTML = '';
    if (notes.length === 0) {
        container.innerHTML = `<div class="empty-state-card" style="grid-column:1/-1;"><p>Insufficient data for insights.</p></div>`;
        return;
    }
    const insights = generateInsights(notes);
    insights.forEach(item => {
        const card = document.createElement('div');
        card.className = 'insight-card';
        card.innerHTML = `<div class="insight-type">${escapeHtml(item.type)}</div><p>${escapeHtml(item.text)}</p>`;
        container.appendChild(card);
    });
}

// ============================================
// FILTER OPTIONS
// ============================================

export function populateFilterOptions(notes) {
    const fields = new Set(notes.map(n => n.field).filter(Boolean));
    const moods = new Set(notes.map(n => n.mood).filter(Boolean));
    const locations = new Set(notes.map(n => n.location).filter(Boolean));
    
    const fField = $('filterField');
    if (fField) {
        const current = fField.value;
        fField.innerHTML = '<option value="ALL">All Fields</option>';
        fields.forEach(f => fField.add(new Option(f, f)));
        fField.value = current;
    }
    const fMood = $('filterMood');
    if (fMood) {
        const current = fMood.value;
        fMood.innerHTML = '<option value="ALL">All Moods</option>';
        moods.forEach(m => fMood.add(new Option(m, m)));
        fMood.value = current;
    }
    const fLoc = $('filterLocation');
    if (fLoc) {
        const current = fLoc.value;
        fLoc.innerHTML = '<option value="ALL">All Locations</option>';
        locations.forEach(l => fLoc.add(new Option(l, l)));
        fLoc.value = current;
    }
}

export { showToast, openModal };