/**
 * notes.js - CRUD operations and in-memory state
 */

import { saveNotes } from './storage.js';
import { generateId, countWords, getNowISO } from './utils.js';

// ============================================
// STATE
// ============================================

/** @type {Array<Object>} */
let notes = [];

// ============================================
// EXPOSED FUNCTIONS
// ============================================

export function getNotes() {
    return notes;
}

export function setNotes(data) {
    notes = data;
}

export function getNoteById(id) {
    return notes.find(n => n.id === id);
}

/**
 * Create a new note
 * @param {Object} data - { title, note, field, mood, location, summary }
 * @returns {Object} The created note
 */
export function createNote(data) {
    const now = getNowISO();
    const wordCount = countWords(data.note);
    const charCount = data.note.length;
    
    const newNote = {
        id: generateId(),
        title: data.title.trim(),
        note: data.note.trim(),
        summary: data.summary || generateFallbackSummary(data.note),
        field: data.field || 'Daily Life',
        mood: data.mood || 'Neutral',
        location: data.location.trim() || 'Home',
        datetime: now,
        wordCount,
        characterCount: charCount
    };
    
    notes.unshift(newNote);
    saveNotes(notes);
    return newNote;
}

/**
 * Update an existing note
 * @param {string} id - Note ID
 * @param {Object} data - Same shape as createNote
 */
export function updateNote(id, data) {
    const index = notes.findIndex(n => n.id === id);
    if (index === -1) {
        throw new Error(`Note with id ${id} not found`);
    }
    
    const existing = notes[index];
    notes[index] = {
        ...existing,
        title: data.title.trim(),
        note: data.note.trim(),
        summary: data.summary || generateFallbackSummary(data.note),
        field: data.field || existing.field,
        mood: data.mood || existing.mood,
        location: data.location.trim() || existing.location,
        wordCount: countWords(data.note),
        characterCount: data.note.length
    };
    
    saveNotes(notes);
}

/**
 * Delete a note by ID
 */
export function deleteNote(id) {
    notes = notes.filter(n => n.id !== id);
    saveNotes(notes);
}

/**
 * Delete all notes
 */
export function clearAllNotes() {
    notes = [];
    saveNotes(notes);
}

// ============================================
// FALLBACK SUMMARY GENERATOR
// ============================================

function generateFallbackSummary(text) {
    if (!text || text.trim().length === 0) {
        return 'Empty note entry.';
    }
    
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    if (sentences.length === 1) {
        return text.length > 120 ? text.substring(0, 117) + '...' : text;
    }
    
    const first = sentences[0].trim();
    const last = sentences.length > 2 ? sentences[sentences.length - 1].trim() : sentences[1].trim();
    let summary = first + ' ' + last;
    
    if (summary.length > 220) {
        summary = summary.substring(0, 217) + '...';
    }
    return summary;
}

// ============================================
// DEMO DATA
// ============================================

export function loadDemoData() {
    const demoEntries = [
        {
            title: 'Java Concurrency Deep Dive',
            note: 'Working through Java and concurrency structures. Understanding thread safety and executor pools in high-throughput network architectures.',
            field: 'Studying',
            mood: 'Motivated',
            location: 'Pretoria',
            datetime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
            title: 'Offline Knowledge OS Concept',
            note: 'What if I built an autonomous personal knowledge dashboard running entirely offline inside the browser? Local storage, zero latency.',
            field: 'Ideas',
            mood: 'Excited',
            location: 'Home',
            datetime: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString()
        },
        {
            title: 'Evening Walk Reflections',
            note: 'Went for a late evening walk across the neighborhood. Warm air, quiet atmosphere. Essential mental reset after heavy code debugging.',
            field: 'Daily Life',
            mood: 'Calm',
            location: 'Johannesburg',
            datetime: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
        },
        {
            title: 'Sprint Review - Data Viz Pipeline',
            note: 'Completed sprint review for the data visualization client pipeline. Addressed canvas performance bottlenecks under large datasets.',
            field: 'Work',
            mood: 'Neutral',
            location: 'Work',
            datetime: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()
        },
        {
            title: 'Quarterly Goals: Technical Depth',
            note: 'Reflecting on annual personal growth goals. Focus for next quarter is technical depth and consistency over volume.',
            field: 'Personal',
            mood: 'Happy',
            location: 'Home',
            datetime: new Date(Date.now() - 120 * 60 * 60 * 1000).toISOString()
        }
    ];
    
    notes = demoEntries.map(entry => {
        const wordCount = countWords(entry.note);
        return {
            id: generateId(),
            title: entry.title,
            note: entry.note,
            summary: generateFallbackSummary(entry.note),
            field: entry.field,
            mood: entry.mood,
            location: entry.location,
            datetime: entry.datetime,
            wordCount,
            characterCount: entry.note.length
        };
    });
    
    saveNotes(notes);
}