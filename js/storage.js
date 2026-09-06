/**
 * storage.js - localStorage operations
 * Simple, focused, with error handling
 */

const STORAGE_KEY = 'infinityNotes';

/**
 * Load notes from localStorage
 * @returns {Array} Array of notes, or empty array if none/failed
 */
export function loadNotes() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const data = JSON.parse(raw);
        if (!Array.isArray(data)) return [];
        return data;
    } catch (err) {
        console.warn('Failed to load notes from localStorage:', err);
        return [];
    }
}

/**
 * Save notes to localStorage
 * @param {Array} notes - Array of note objects
 */
export function saveNotes(notes) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch (err) {
        console.error('Failed to save notes:', err);
        throw new Error('Could not save to localStorage. Storage may be full.');
    }
}

/**
 * Clear all data from localStorage
 */
export function clearNotes() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
        console.error('Failed to clear storage:', err);
    }
}

/**
 * Check if data exists in localStorage
 */
export function hasData() {
    return localStorage.getItem(STORAGE_KEY) !== null;
}