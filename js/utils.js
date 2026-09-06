/**
 * utils.js - Shared helper functions
 */

// ============================================
// DATE HELPERS
// ============================================

export function formatDate(isoStr) {
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

export function formatTime(isoStr) {
    const d = new Date(isoStr);
    return d.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

export function formatFullDatetime(isoStr) {
    return `${formatDate(isoStr)}, ${formatTime(isoStr)}`;
}

export function getNowISO() {
    return new Date().toISOString();
}

// ============================================
// STRING HELPERS
// ============================================

export function countWords(str) {
    if (!str) return 0;
    return str.trim().split(/\s+/).filter(Boolean).length;
}

export function escapeHtml(str) { // prevents user text from being interpreted as HTML
    if (!str) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return str.replace(/[&<>"']/g, match => map[match]);
}

export function generateId() {
    return 'inf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
}

// ============================================
// UI HELPERS
// ============================================

export function showToast(msg, type = 'info') { // this is the notification pop-up
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = msg;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

export function openModal(title, msg, onConfirm) {
    const overlay = document.getElementById('modalOverlay');
    if (!overlay) return;
    
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMessage').textContent = msg;
    overlay.classList.remove('hidden');
    
    const confirmBtn = document.getElementById('modalConfirmBtn');
    const cancelBtn = document.getElementById('modalCancelBtn');
    
    const closeHandler = () => {
        overlay.classList.add('hidden');
        confirmBtn.removeEventListener('click', confirmHandler);
        cancelBtn.removeEventListener('click', closeHandler);
    };
    
    const confirmHandler = () => {
        onConfirm();
        closeHandler();
    };
    
    confirmBtn.addEventListener('click', confirmHandler);
    cancelBtn.addEventListener('click', closeHandler);
}