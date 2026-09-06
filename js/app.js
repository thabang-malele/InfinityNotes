/**
 * InfinityNotes - Application Entry Point
 */

import { loadNotes, saveNotes } from './storage.js';
import { 
    getNotes, 
    setNotes,
    createNote, 
    updateNote, 
    deleteNote, 
    clearAllNotes,
    loadDemoData,
    getNoteById 
} from './notes.js';
import { generateSummary, testConnection } from './ai.js';
import { 
    renderDashboard, 
    renderArchive, 
    renderTimeline, 
    renderInsights,
    renderNoteDetail,
    renderForm,
    resetForm,
    populateFormForEdit,
    populateFilterOptions,
    showToast,
    openModal,
    updateWordCharCount
} from './ui.js';
import { exportData, importData } from './import-export.js';

// ============================================
// STATE
// ============================================

let currentTab = 'dashboard';
let activeDetailId = null;      // which note is currently open in detail view
let searchQuery = '';
let filters = {
    field: 'ALL',
    mood: 'ALL',
    location: 'ALL',
    sort: 'newest'
};

// ============================================
// DOM REFS
// ============================================

const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);

// ============================================
// RENDER COORDINATOR
// ============================================

export function renderAll() {
    const notes = getNotes();
    renderDashboard(notes);
    renderArchive(notes, searchQuery, filters);
    renderTimeline(notes);
    renderInsights(notes);
    populateFilterOptions(notes);
    renderForm(notes);
}

// ============================================
// TAB NAVIGATION
// ============================================

function switchTab(tabId) {
    currentTab = tabId;
    
    $$('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    
    $$('.tab-view').forEach(view => {
        view.classList.toggle('active', view.id === `view-${tabId}`);
    });
    
    // Close mobile sidebar
    $('sidebar').classList.remove('mobile-open');
    
    // Refresh content for the tab we're switching to
    const notes = getNotes();
    if (tabId === 'dashboard') renderDashboard(notes);
    if (tabId === 'notes') renderArchive(notes, searchQuery, filters);
    if (tabId === 'timeline') renderTimeline(notes);
    if (tabId === 'insights') renderInsights(notes);
    if (tabId === 'new-note') {
        const editId = $('editingNoteId').value;
        if (!editId) resetForm();
    }
}

// ============================================
// OPEN DETAIL (exposed globally for UI clicks)
// ============================================

function openDetail(id) {
    activeDetailId = id;                 // store which note we're viewing
    renderNoteDetail(id);                // fill the detail view with data
    switchTab('note-detail');            // show the detail tab
}

// Expose it so ui.js can call it from note card click handlers
window.__openDetail = openDetail;

// ============================================
// EVENT SETUP
// ============================================

function setupEventListeners() {
    // --- Tab Navigation ---
    $$('[data-tab]').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // --- Quick Note Buttons ---
    $('quickNewNoteBtn').addEventListener('click', () => {
        resetForm();
        switchTab('new-note');
    });
    $('emptyStateAction').addEventListener('click', () => {
        resetForm();
        switchTab('new-note');
    });
    
    // --- Mobile Nav ---
    $('mobileNavToggle').addEventListener('click', () => {
        $('sidebar').classList.toggle('mobile-open');
    });
    
    // --- Note Form ---
    const noteBody = $('noteBody');
    const noteTitle = $('noteTitle');
    
    noteBody.addEventListener('input', () => { // keyboard input?
        updateWordCharCount(noteBody.value);
    });
    
    // Generate Summary
    $('generateSummaryBtn').addEventListener('click', async () => {
        const text = noteBody.value.trim();
        if (!text) {
            showToast('Please enter note content first', 'error');
            return;
        }
        const indicator = $('aiLoadingIndicator');
        indicator.classList.remove('hidden');
        try {
            const summary = await generateSummary(text);
            $('noteSummary').value = summary;
        } catch (err) {
            showToast('AI summary failed: ' + err.message, 'error');
        } finally {
            indicator.classList.add('hidden');
        }
    });
    
    // Form submit (Create or Update) // note creation
    $('noteForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const title = noteTitle.value.trim();
        const body = noteBody.value.trim();
        const field = $('noteField').value;
        const mood = $('noteMood').value;
        const location = $('noteLocation').value.trim();
        const summary = $('noteSummary').value.trim();
        const editId = $('editingNoteId').value;
        
        if (!title || !body) {
            showToast('Please provide both a title and content', 'error');
            return;
        }
        
        const noteData = { title, note: body, field, mood, location, summary };
        
        if (editId) {
            // UPDATE: edit existing note
            updateNote(editId, noteData);
            showToast('Note updated', 'success');
        } else {
            // CREATE: new note
            createNote(noteData);
            showToast('Note created', 'success');
        }
        
        resetForm();
        renderAll();
        switchTab('notes');
    });
    
    $('cancelNoteBtn').addEventListener('click', () => {
        resetForm();
        switchTab('notes');
    });
    
    // --- Global Search ---
    $('globalSearch').addEventListener('input', (e) => {
        searchQuery = e.target.value.trim();
        $('clearSearchBtn').hidden = !searchQuery;
        renderArchive(getNotes(), searchQuery, filters);
        if (currentTab !== 'notes' && searchQuery) {
            switchTab('notes');
        }
    });
    $('clearSearchBtn').addEventListener('click', () => {
        $('globalSearch').value = '';
        searchQuery = '';
        $('clearSearchBtn').hidden = true;
        renderArchive(getNotes(), searchQuery, filters);
    });
    
    // --- Filters ---
    ['filterField', 'filterMood', 'filterLocation', 'sortOrder'].forEach(id => {
        $(id).addEventListener('change', () => {
            filters.field = $('filterField').value;
            filters.mood = $('filterMood').value;
            filters.location = $('filterLocation').value;
            filters.sort = $('sortOrder').value;
            renderArchive(getNotes(), searchQuery, filters);
        });
    });
    $('resetFiltersBtn').addEventListener('click', () => {
        $('filterField').value = 'ALL';
        $('filterMood').value = 'ALL';
        $('filterLocation').value = 'ALL';
        $('sortOrder').value = 'newest';
        filters = { field: 'ALL', mood: 'ALL', location: 'ALL', sort: 'newest' };
        renderArchive(getNotes(), searchQuery, filters);
    });
    
    // --- Detail View Actions ---
    $('detailBackBtn').addEventListener('click', () => switchTab('notes'));
    
    // Edit button: load note data into the form and switch to edit mode
    $('detailEditBtn').addEventListener('click', () => {
        if (activeDetailId) {
            populateFormForEdit(activeDetailId);   // fills the form with note data
            switchTab('new-note');                  // goes to the form (now in edit mode)
        }
    });
    
    // Delete button: confirm then delete
    $('detailDeleteBtn').addEventListener('click', () => {
        if (!activeDetailId) return;
        openModal(
            'Delete Note',
            'Are you sure you want to permanently delete this note?',
            () => {
                deleteNote(activeDetailId);
                renderAll();
                switchTab('notes');
                showToast('Note deleted', 'success');
            }
        );
    });
    
    // --- Dashboard Timeframe ---
    $('timeframeSelect').addEventListener('change', (e) => {
        renderDashboard(getNotes(), parseInt(e.target.value));
    });
    
    // --- Geolocation ---
    $('useGeoLocationBtn').addEventListener('click', () => {
        if (!navigator.geolocation) {
            showToast('Geolocation not supported', 'error');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const loc = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
                $('noteLocation').value = loc;
                showToast('Location captured', 'success');
            },
            () => showToast('Unable to retrieve location', 'error')
        );
    });
    
    // --- Settings ---
    $('exportDataBtn').addEventListener('click', () => {
        exportData(getNotes());
    });
    $('importDataBtn').addEventListener('click', () => {
        $('importFileInput').click();
    });
    $('importFileInput').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const imported = await importData(file);
            const notes = getNotes();
            notes.length = 0;
            notes.push(...imported);
            saveNotes(notes);
            renderAll();
            showToast(`Imported ${imported.length} notes`, 'success');
        } catch (err) {
            showToast('Import failed: ' + err.message, 'error');
        }
        e.target.value = '';
    });
    $('loadDemoDataBtn').addEventListener('click', () => {
        openModal(
            'Load Demo Data',
            'This will replace your current notes. Continue?',
            () => {
                loadDemoData();
                renderAll();
                showToast('Demo data loaded', 'success');
            }
        );
    });
    $('clearDataBtn').addEventListener('click', () => {
        openModal(
            'Delete All Notes',
            'Permanently delete ALL notes?',
            () => {
                clearAllNotes();
                renderAll();
                showToast('All notes deleted', 'success');
            }
        );
    });
    
    // --- AI Connection Test ---
    $('testAiConnection').addEventListener('click', async () => {
        const endpoint = $('aiEndpoint').value.trim() || 'http://localhost:8080/completion';
        try {
            const result = await testConnection(endpoint);
            showToast(result ? '✅ AI server connected' : '❌ Could not connect', result ? 'success' : 'error');
        } catch (err) {
            showToast('❌ Error: ' + err.message, 'error');
        }
    });
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    setNotes(loadNotes());
    setupEventListeners();
    renderAll();
    switchTab('dashboard');
    
    // Set current datetime in form
    const now = new Date().toISOString();
    const display = $('displayDatetime');
    if (display) {
        const d = new Date(now);
        display.textContent = d.toLocaleDateString('en-GB', { 
            day: 'numeric', month: 'short', year: 'numeric' 
        }) + ', ' + d.toLocaleTimeString('en-GB', { 
            hour: '2-digit', minute: '2-digit' 
        });
    }
});