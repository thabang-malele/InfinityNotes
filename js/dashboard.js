/**
 * dashboard.js - Metrics and chart rendering
 */

import { formatDate } from './utils.js';

// ============================================
// COLOR PALETTE
// ============================================

const PALETTE = [
    '#00e5ff', '#9d4edd', '#f72585', '#10b981', 
    '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'
];

// ============================================
// METRICS CALCULATION
// ============================================

export function calculateMetrics(notes) {
    if (notes.length === 0) {
        return {
            total: 0,
            notesThisWeek: 0,
            notesThisMonth: 0,
            avgWords: 0,
            streak: 0,
            topField: { name: 'None', count: 0, pct: 0 },
            topMood: { name: 'None', count: 0, pct: 0 },
            topLocation: { name: 'None', count: 0, pct: 0 }
        };
    }
    
    const total = notes.length;
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const notesThisWeek = notes.filter(n => new Date(n.datetime) >= oneWeekAgo).length;
    const notesThisMonth = notes.filter(n => new Date(n.datetime) >= startOfMonth).length;
    
    // Frequencies
    const fieldCounts = {};
    const moodCounts = {};
    const locCounts = {};
    let totalWords = 0;
    
    notes.forEach(n => {
        fieldCounts[n.field] = (fieldCounts[n.field] || 0) + 1;
        moodCounts[n.mood] = (moodCounts[n.mood] || 0) + 1;
        locCounts[n.location] = (locCounts[n.location] || 0) + 1;
        totalWords += (n.wordCount || n.note.split(/\s+/).filter(Boolean).length);
    });
    
    const getTop = (obj) => {
        let topKey = 'None';
        let max = 0;
        for (const [k, v] of Object.entries(obj)) {
            if (v > max) { max = v; topKey = k; }
        }
        return { name: topKey, count: max, pct: Math.round((max / total) * 100) };
    };
    
    // Streak calculation
    const datesSet = new Set(notes.map(n => n.datetime.split('T')[0]));
    let streak = 0;
    let checkDate = new Date();
    while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (datesSet.has(dateStr)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else if (streak === 0) {
            checkDate.setDate(checkDate.getDate() - 1);
            const yestStr = checkDate.toISOString().split('T')[0];
            if (datesSet.has(yestStr)) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        } else {
            break;
        }
    }
    
    return {
        total,
        notesThisWeek,
        notesThisMonth,
        avgWords: Math.round(totalWords / total),
        streak,
        topField: getTop(fieldCounts),
        topMood: getTop(moodCounts),
        topLocation: getTop(locCounts),
        fieldCounts,
        moodCounts,
        locCounts
    };
}

// ============================================
// INSIGHTS GENERATION
// ============================================

export function generateInsights(notes) {
    const list = [];
    const total = notes.length;
    
    if (total === 0) return [];
    
    if (total < 4) {
        list.push({
            type: 'Archive Status',
            text: `Your archive contains ${total} entry/entries. Continue adding notes to unlock deeper pattern matching.`
        });
        return list;
    }
    
    const stats = calculateMetrics(notes);
    
    // Time of day analysis
    const timeOfDay = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
    notes.forEach(n => {
        const hr = new Date(n.datetime).getHours();
        if (hr >= 5 && hr < 12) timeOfDay.Morning++;
        else if (hr >= 12 && hr < 17) timeOfDay.Afternoon++;
        else if (hr >= 17 && hr < 22) timeOfDay.Evening++;
        else timeOfDay.Night++;
    });
    
    let topTime = 'Morning';
    let maxT = 0;
    for (const [t, c] of Object.entries(timeOfDay)) {
        if (c > maxT) { maxT = c; topTime = t; }
    }
    
    list.push({
        type: 'Temporal Tendency',
        text: `Based on ${total} observations, you create notes most frequently in the ${topTime.toLowerCase()} (${Math.round((maxT / total) * 100)}% of total entries).`
    });
    
    if (stats.topField.name !== 'None') {
        list.push({
            type: 'Domain Focus',
            text: `The category "${stats.topField.name}" represents ${stats.topField.pct}% of your structured knowledge base.`
        });
    }
    
    // Mood correlation
    const workOrStudy = notes.filter(n => n.field === 'Studying' || n.field === 'Work');
    if (workOrStudy.length >= 3) {
        const moodCounts = {};
        workOrStudy.forEach(n => moodCounts[n.mood] = (moodCounts[n.mood] || 0) + 1);
        let topMood = '';
        let maxM = 0;
        for (const [m, c] of Object.entries(moodCounts)) {
            if (c > maxM) { maxM = c; topMood = m; }
        }
        list.push({
            type: 'Emotional Correlation',
            text: `When engaged in Work or Studying, your most frequently logged mood is ${topMood}.`
        });
    }
    
    list.push({
        type: 'Verbosity Telemetry',
        text: `Your average entry length is ${stats.avgWords} words per note.`
    });
    
    return list;
}

// ============================================
// CHART RENDERERS
// ============================================

export function renderCharts(notes, days = 30) {
    if (notes.length === 0) return;
    
    renderActivityChart(notes, days);
    renderDonutChart(notes, 'chartFields', 'chartFieldsLegend');
    renderBarChart(notes, 'chartMoods', 'mood');
    renderTimeOfDayChart(notes);
    renderBarChart(notes, 'chartLocations', 'location');
}

function renderActivityChart(notes, days) {
    const canvas = document.getElementById('chartActivityOverTime');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width || 500;
    canvas.height = 200;
    
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    
    // Date buckets
    const now = new Date();
    const buckets = [];
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const str = d.toISOString().split('T')[0];
        buckets.push({ date: str, count: 0 });
    }
    
    notes.forEach(n => {
        const str = n.datetime.split('T')[0];
        const b = buckets.find(item => item.date === str);
        if (b) b.count++;
    });
    
    const maxCount = Math.max(...buckets.map(b => b.count), 1);
    const padding = 30;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;
    
    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 3; i++) {
        const y = padding + (graphHeight / 3) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
    }
    
    // Line
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    
    const points = buckets.map((b, idx) => {
        const x = padding + (graphWidth / (buckets.length - 1 || 1)) * idx;
        const y = height - padding - (b.count / maxCount) * graphHeight;
        return { x, y };
    });
    
    points.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();
    
    // Area fill
    ctx.lineTo(width - padding, height - padding);
    ctx.lineTo(padding, height - padding);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, 'rgba(0, 229, 255, 0.25)');
    grad.addColorStop(1, 'rgba(0, 229, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fill();
}

function renderDonutChart(notes, canvasId, legendId) {
    const canvas = document.getElementById(canvasId);
    const legend = document.getElementById(legendId);
    if (!canvas || !legend) return;
    
    canvas.width = 160;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const fields = ['Daily Life', 'Work', 'Studying', 'Projects', 'Ideas', 'Personal', 'Other'];
    const counts = {};
    fields.forEach(f => counts[f] = 0);
    notes.forEach(n => {
        if (counts[n.field] !== undefined) counts[n.field]++;
    });
    
    const total = notes.length || 1;
    let startAngle = 0;
    legend.innerHTML = '';
    
    fields.forEach((field, i) => {
        const count = counts[field] || 0;
        if (count === 0) return;
        
        const sliceAngle = (count / total) * 2 * Math.PI;
        const color = PALETTE[i % PALETTE.length];
        
        ctx.beginPath();
        ctx.arc(80, 80, 70, startAngle, startAngle + sliceAngle);
        ctx.arc(80, 80, 40, startAngle + sliceAngle, startAngle, true);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        
        startAngle += sliceAngle;
        
        const item = document.createElement('div');
        item.className = 'legend-item';
        item.innerHTML = `
            <span class="legend-color" style="background:${color}"></span>
            <span>${field}: ${Math.round((count/total)*100)}%</span>
        `;
        legend.appendChild(item);
    });
}

function renderBarChart(notes, canvasId, property) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width || 300;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const counts = {};
    notes.forEach(n => {
        const val = n[property];
        counts[val] = (counts[val] || 0) + 1;
    });
    
    const categories = Object.keys(counts).slice(0, 8);
    const maxVal = Math.max(...Object.values(counts), 1);
    const padding = 30;
    const barWidth = Math.min(30, (canvas.width - padding * 2) / categories.length - 6);
    
    categories.forEach((cat, idx) => {
        const count = counts[cat] || 0;
        const barHeight = (count / maxVal) * (canvas.height - padding * 2);
        const x = padding + idx * ((canvas.width - padding * 2) / categories.length) + 4;
        const y = canvas.height - padding - barHeight;
        
        ctx.fillStyle = PALETTE[idx % PALETTE.length];
        ctx.fillRect(x, y, barWidth, barHeight);
        
        ctx.fillStyle = '#64748b';
        ctx.font = '9px sans-serif';
        ctx.fillText(cat.substring(0, 6), x, canvas.height - 10);
    });
}

function renderTimeOfDayChart(notes) {
    const canvas = document.getElementById('chartTimeOfDay');
    if (!canvas) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width || 300;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const slots = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
    notes.forEach(n => {
        const hr = new Date(n.datetime).getHours();
        if (hr >= 5 && hr < 12) slots.Morning++;
        else if (hr >= 12 && hr < 17) slots.Afternoon++;
        else if (hr >= 17 && hr < 22) slots.Evening++;
        else slots.Night++;
    });
    
    const maxVal = Math.max(...Object.values(slots), 1);
    const keys = Object.keys(slots);
    const padding = 30;
    const barWidth = Math.min(40, (canvas.width - padding * 2) / keys.length - 10);
    
    keys.forEach((key, idx) => {
        const count = slots[key];
        const barHeight = (count / maxVal) * (canvas.height - padding * 2);
        const x = padding + idx * ((canvas.width - padding * 2) / keys.length) + 8;
        const y = canvas.height - padding - barHeight;
        
        ctx.fillStyle = '#9d4edd';
        ctx.fillRect(x, y, barWidth, barHeight);
        
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px sans-serif';
        ctx.fillText(key, x, canvas.height - 10);
    });
}