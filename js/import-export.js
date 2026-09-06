/**
 * import-export.js - JSON import/export with validation
 */

import { showToast } from './utils.js';

/**
 * Export notes as a JSON file download
 * @param {Array} notes - Array of note objects
 */
export function exportData(notes) {
    try {
        const json = JSON.stringify(notes, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `infinity_notes_archive_${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast(`Exported ${notes.length} notes`, 'success');
    } catch (err) {
        showToast('Export failed: ' + err.message, 'error');
        throw err;
    }
}

/**
 * Import notes from a JSON file
 * @param {File} file - The JSON file to import
 * @returns {Promise<Array>} The imported notes array
 */
export function importData(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                // Validate: must be array
                if (!Array.isArray(data)) {
                    reject(new Error('Invalid format: root must be an array of notes'));
                    return;
                }
                
                // Validate each note
                const validated = data.filter(item => {
                    return item.note && typeof item.note === 'string';
                });
                
                if (validated.length === 0) {
                    reject(new Error('No valid notes found in the file. Each note must have a "note" field.'));
                    return;
                }
                
                if (validated.length < data.length) {
                    showToast(`Skipped ${data.length - validated.length} invalid entries`, 'error');
                }
                
                resolve(validated);
            } catch (err) {
                reject(new Error('Failed to parse JSON: ' + err.message));
            }
        };
        
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}