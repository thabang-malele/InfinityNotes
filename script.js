/**
 * InfinityN∞tes - Knowledge & Personal Data OS
 * Vanilla JS Local Architecture
 */

(function () {
  'use strict';

  // ==========================================
  // 1. CONSTANTS & SYSTEM ENUMS
  // ==========================================
  const STORAGE_KEY = 'infinityNotes';
  
  const FIELDS = [
    'Daily Life',
    'Work',
    'Studying',
    'Projects',
    'Ideas',
    'Personal',
    'Other'
  ];

  const MOODS = [
    'Happy',
    'Calm',
    'Neutral',
    'Sad',
    'Angry',
    'Anxious',
    'Excited',
    'Tired',
    'Motivated'
  ];

  const DEFAULT_LOCATIONS = ['Pretoria', 'Johannesburg', 'Home', 'University', 'Work'];

  // Color mappings for chart visuals
  const PALETTE = [
    '#00e5ff', '#9d4edd', '#f72585', '#10b981', '#f59e0b', '#3b82f6', '#ec4899'
  ];

  // ==========================================
  // 2. STATE MANAGEMENT
  // ==========================================
  let notesState = [];
  let currentActiveTab = 'dashboard';
  let activeDetailNoteId = null;
  let activeSearchQuery = '';

  // Filter state
  let currentFilters = {
    field: 'ALL',
    mood: 'ALL',
    location: 'ALL',
    sort: 'newest'
  };

  // ==========================================
  // 3. STORAGE LAYER
  // ==========================================
  function loadNotesFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      notesState = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(notesState)) notesState = [];
    } catch (err) {
      console.error('Corrupted local storage data. Resetting state.', err);
      notesState = [];
    }
  }

  function saveNotesToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notesState));
    } catch (err) {
      showToast('Error saving data to browser storage', 'error');
    }
  }

  // ==========================================
  // 4. CRUD OPERATIONS
  // ==========================================
  function createNoteObj(data) {
    const wordCount = countWords(data.note);
    const charCount = data.note.length;
    const nowISO = new Date().toISOString();

    return {
      id: 'inf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      note: data.note,
      datetime: nowISO,
      location: data.location.trim() || 'Home',
      field: data.field || 'Daily Life',
      mood: data.mood || 'Neutral',
      summary: data.summary || generateLocalSummary(data.note),
      wordCount: wordCount,
      characterCount: charCount
    };
  }

  function addNote(data) {
    const newNote = createNoteObj(data);
    notesState.unshift(newNote);
    saveNotesToStorage();
    showToast('Note archived successfully', 'success');
    return newNote;
  }

  function updateNote(id, data) {
    const idx = notesState.findIndex(n => n.id === id);
    if (idx !== -1) {
      notesState[idx] = {
        ...notesState[idx],
        note: data.note,
        location: data.location.trim(),
        field: data.field,
        mood: data.mood,
        summary: data.summary || generateLocalSummary(data.note),
        wordCount: countWords(data.note),
        characterCount: data.note.length
      };
      saveNotesToStorage();
      showToast('Note entry updated', 'success');
    }
  }

  function deleteNote(id) {
    notesState = notesState.filter(n => n.id !== id);
    saveNotesToStorage();
    showToast('Note deleted from archive', 'success');
  }

  function clearAllNotes() {
    notesState = [];
    localStorage.removeItem(STORAGE_KEY);
    showToast('Archive completely purged', 'success');
  }

  // ==========================================
  // 5. AI SUMMARIZATION ARCHITECTURE
  // ==========================================
  /**
   * Local Abstractor Engine (Fallback)
   * Analyzes sentence structures, extracts key density phrases.
   */
  function generateLocalSummary(text) {
    if (!text || text.trim().length === 0) return 'Empty note entry.';
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    if (sentences.length === 1) {
      return text.length > 120 ? text.substring(0, 117) + '...' : text;
    }

    // Pick top sentences (first and last usually summarize well)
    const firstSent = sentences[0].trim();
    const secondSent = sentences.length > 2 ? sentences[sentences.length - 1].trim() : sentences[1].trim();
    
    let summary = `${firstSent} ${secondSent}`;
    if (summary.length > 220) {
      summary = summary.substring(0, 217) + '...';
    }
    return summary;
  }

  /**
   * Abstraction boundary for future AI API integration
   */
  async function generateSummaryApi(noteText) {
    const aiMode = document.getElementById('aiModeSelect')?.value || 'local';

    if (aiMode === 'api') {
      // Mock API latency
      await new Promise(r => setTimeout(r, 800));
      return `[AI Engine Response] Synthesized core insight: Note centers on "${noteText.substring(0, 30)}..." with primary intent related to personal telemetry.`;
    }

    // Default Local Abstractor Engine
    await new Promise(r => setTimeout(r, 300));
    return generateLocalSummary(noteText);
  }

  // ==========================================
  // 6. HELPER UTILITIES
  // ==========================================
  function countWords(str) {
    if (!str) return 0;
    return str.trim().split(/\s+/).filter(Boolean).length;
  }

  function formatDate(isoStr) {
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  function formatTime(isoStr) {
    const d = new Date(isoStr);
    return d.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatFullDatetime(isoStr) {
    return `${formatDate(isoStr)}, ${formatTime(isoStr)}`;
  }

  function showToast(msg, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  function openModal(title, msg, onConfirm) {
    const overlay = document.getElementById('modalOverlay');
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

  // ==========================================
  // 7. STATISTICAL & INSIGHT ENGINE
  // ==========================================
  function calculateTelemetryStats() {
    if (notesState.length === 0) return null;

    const total = notesState.length;
    const now = new Date();
    
    // Week & Month calculations
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const notesThisWeek = notesState.filter(n => new Date(n.datetime) >= oneWeekAgo).length;
    const notesThisMonth = notesState.filter(n => new Date(n.datetime) >= startOfMonth).length;

    // Frequencies
    const fieldCounts = {};
    const moodCounts = {};
    const locCounts = {};
    let totalWords = 0;

    notesState.forEach(n => {
      fieldCounts[n.field] = (fieldCounts[n.field] || 0) + 1;
      moodCounts[n.mood] = (moodCounts[n.mood] || 0) + 1;
      locCounts[n.location] = (locCounts[n.location] || 0) + 1;
      totalWords += (n.wordCount || countWords(n.note));
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
    const datesSet = new Set(notesState.map(n => n.datetime.split('T')[0]));
    let streak = 0;
    let checkDate = new Date();
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (datesSet.has(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (streak === 0) {
        // Check yesterday in case user hasn't created note today yet
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
      topField: getTop(fieldCounts),
      topMood: getTop(moodCounts),
      topLocation: getTop(locCounts),
      streak,
      fieldCounts,
      moodCounts,
      locCounts
    };
  }

  function generateAlgorithmicInsights() {
    const list = [];
    const total = notesState.length;

    if (total === 0) return [];

    if (total < 4) {
      list.push({
        type: 'Archive Status',
        text: `Your archive contains ${total} entry/entries. Continue adding notes over time to unlock deep telemetry pattern matching.`
      });
      return list;
    }

    const stats = calculateTelemetryStats();

    // Time of day analysis
    const timeOfDay = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
    notesState.forEach(n => {
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

    // Mood correlation with Studying or Work
    const workOrStudyNotes = notesState.filter(n => n.field === 'Studying' || n.field === 'Work');
    if (workOrStudyNotes.length >= 3) {
      const moodCountMap = {};
      workOrStudyNotes.forEach(n => moodCountMap[n.mood] = (moodCountMap[n.mood] || 0) + 1);
      let topWorkMood = '';
      let maxWM = 0;
      for (const [m, c] of Object.entries(moodCountMap)) {
        if (c > maxWM) { maxWM = c; topWorkMood = m; }
      }
      list.push({
        type: 'Emotional Correlation',
        text: `When engaged in Work or Studying, your most frequently logged mood state is ${topWorkMood}.`
      });
    }

    // Word count trend
    list.push({
      type: 'Verbosity Telemetry',
      text: `Your average entry length is currently ${stats.avgWords} words per note.`
    });

    return list;
  }

  // ==========================================
  // 8. CANVAS GRAPH RENDERING (VANILLA SVG/CANVAS)
  // ==========================================
  function renderCharts(daysTimeframe = 30) {
    if (notesState.length === 0) return;

    renderActivityChart(daysTimeframe);
    renderDonutChart('chartFields', 'chartFieldsLegend', FIELDS);
    renderBarChart('chartMoods', MOODS, 'mood');
    renderTimeOfDayChart();
    renderBarChart('chartLocations', getUniqueLocations(), 'location');
  }

  function getUniqueLocations() {
    const locs = new Set(notesState.map(n => n.location));
    return Array.from(locs).slice(0, 6);
  }

  function renderActivityChart(days) {
    const canvas = document.getElementById('chartActivityOverTime');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Set resolution
    canvas.width = canvas.parentElement.clientWidth;
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

    notesState.forEach(n => {
      const str = n.datetime.split('T')[0];
      const b = buckets.find(item => item.date === str);
      if (b) b.count++;
    });

    const maxCount = Math.max(...buckets.map(b => b.count), 3);
    const padding = 30;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 3; i++) {
      const y = padding + (graphHeight / 3) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw line path
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

    // Fill area under line
    ctx.lineTo(width - padding, height - padding);
    ctx.lineTo(padding, height - padding);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, 'rgba(0, 229, 255, 0.25)');
    grad.addColorStop(1, 'rgba(0, 229, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fill();
  }

  function renderDonutChart(canvasId, legendId, categories) {
    const canvas = document.getElementById(canvasId);
    const legend = document.getElementById(legendId);
    if (!canvas || !legend) return;

    canvas.width = 160;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const counts = {};
    categories.forEach(c => counts[c] = 0);
    notesState.forEach(n => {
      if (counts[n.field] !== undefined) counts[n.field]++;
    });

    const total = notesState.length || 1;
    let startAngle = 0;

    legend.innerHTML = '';

    categories.forEach((cat, i) => {
      const count = counts[cat] || 0;
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

      // Add to legend
      const item = document.createElement('div');
      item.className = 'legend-item';
      item.innerHTML = `
        <span class="legend-color" style="background:${color}"></span>
        <span>${cat}: ${Math.round((count/total)*100)}%</span>
      `;
      legend.appendChild(item);
    });
  }

  function renderBarChart(canvasId, categories, property) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const counts = {};
    categories.forEach(c => counts[c] = 0);
    notesState.forEach(n => {
      const val = n[property];
      if (counts[val] !== undefined) counts[val]++;
    });

    const maxVal = Math.max(...Object.values(counts), 1);
    const padding = 30;
    const barWidth = Math.min(30, (canvas.width - padding * 2) / categories.length - 8);

    categories.forEach((cat, idx) => {
      const count = counts[cat] || 0;
      const barHeight = (count / maxVal) * (canvas.height - padding * 2);
      const x = padding + idx * ((canvas.width - padding * 2) / categories.length) + 4;
      const y = canvas.height - padding - barHeight;

      ctx.fillStyle = PALETTE[idx % PALETTE.length];
      ctx.fillRect(x, y, barWidth, barHeight);

      // Label
      ctx.fillStyle = '#64748b';
      ctx.font = '10px sans-serif';
      ctx.fillText(cat.substring(0, 4), x, canvas.height - 10);
    });
  }

  function renderTimeOfDayChart() {
    const canvas = document.getElementById('chartTimeOfDay');
    if (!canvas) return;
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const slots = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
    notesState.forEach(n => {
      const hr = new Date(n.datetime).getHours();
      if (hr >= 5 && hr < 12) slots.Morning++;
      else if (hr >= 12 && hr < 17) slots.Afternoon++;
      else if (hr >= 17 && hr < 22) slots.Evening++;
      else slots.Night++;
    });

    const maxVal = Math.max(...Object.values(slots), 1);
    const keys = Object.keys(slots);
    const padding = 30;

    keys.forEach((key, idx) => {
      const count = slots[key];
      const barHeight = (count / maxVal) * (canvas.height - padding * 2);
      const x = padding + idx * ((canvas.width - padding * 2) / keys.length) + 10;
      const y = canvas.height - padding - barHeight;

      ctx.fillStyle = '#9d4edd';
      ctx.fillRect(x, y, 40, barHeight);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px sans-serif';
      ctx.fillText(key, x, canvas.height - 10);
    });
  }

  // ==========================================
  // 9. UI RENDER CONTROLLERS
  // ==========================================
  function renderApp() {
    renderDashboardView();
    renderNotesArchiveView();
    renderTimelineView();
    renderInsightsView();
    populateSelectDropdowns();
  }

  function switchTab(tabId) {
    currentActiveTab = tabId;
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    document.querySelectorAll('.tab-view').forEach(view => {
      view.classList.toggle('active', view.id === `view-${tabId}`);
    });

    // Mobile sidebar close on switch
    document.getElementById('sidebar').classList.remove('mobile-open');

    // Trigger tab-specific refresh
    if (tabId === 'dashboard') renderDashboardView();
    if (tabId === 'notes') renderNotesArchiveView();
    if (tabId === 'timeline') renderTimelineView();
    if (tabId === 'insights') renderInsightsView();
    if (tabId === 'new-note' && !document.getElementById('editingNoteId').value) {
      resetNoteForm();
    }
  }

  function renderDashboardView() {
    const emptyState = document.getElementById('dashboardEmptyState');
    const content = document.getElementById('dashboardContent');

    if (notesState.length === 0) {
      emptyState.classList.remove('hidden');
      content.classList.add('hidden');
      return;
    }

    emptyState.classList.add('hidden');
    content.classList.remove('hidden');

    const stats = calculateTelemetryStats();

    document.getElementById('statTotalNotes').textContent = stats.total;
    document.getElementById('statStreak').textContent = `${stats.streak} Day Streak`;
    document.getElementById('statNotesWeek').textContent = stats.notesThisWeek;
    document.getElementById('statNotesMonth').textContent = stats.notesThisMonth;
    document.getElementById('statAvgWords').textContent = `${stats.avgWords} words/note avg`;

    document.getElementById('statTopField').textContent = stats.topField.name;
    document.getElementById('statTopFieldPct').textContent = `${stats.topField.pct}% of total`;

    document.getElementById('statTopMood').textContent = stats.topMood.name;
    document.getElementById('statTopMoodPct').textContent = `${stats.topMood.pct}% frequency`;

    document.getElementById('statTopLocation').textContent = stats.topLocation.name;
    document.getElementById('statTopLocationPct').textContent = `${stats.topLocation.pct}% occurrences`;

    // Render Canvas Charts
    setTimeout(() => renderCharts(), 50);
  }

  function renderNotesArchiveView() {
    const grid = document.getElementById('notesGrid');
    grid.innerHTML = '';

    let filtered = notesState.filter(n => {
      // Global search filter
      if (activeSearchQuery) {
        const q = activeSearchQuery.toLowerCase();
        const matchText = n.note.toLowerCase().includes(q);
        const matchSummary = n.summary.toLowerCase().includes(q);
        const matchField = n.field.toLowerCase().includes(q);
        const matchMood = n.mood.toLowerCase().includes(q);
        const matchLoc = n.location.toLowerCase().includes(q);
        if (!matchText && !matchSummary && !matchField && !matchMood && !matchLoc) return false;
      }

      if (currentFilters.field !== 'ALL' && n.field !== currentFilters.field) return false;
      if (currentFilters.mood !== 'ALL' && n.mood !== currentFilters.mood) return false;
      if (currentFilters.location !== 'ALL' && n.location !== currentFilters.location) return false;

      return true;
    });

    // Sorting
    filtered.sort((a, b) => {
      const dA = new Date(a.datetime);
      const dB = new Date(b.datetime);
      return currentFilters.sort === 'newest' ? dB - dA : dA - dB;
    });

    document.getElementById('notesCountBadge').textContent = `${filtered.length} Entries`;

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="empty-state-card" style="grid-column: 1/-1;">
          <p>No matching notes found for current query/filters.</p>
        </div>`;
      return;
    }

    filtered.forEach(note => {
      const card = document.createElement('div');
      card.className = 'note-card';
      card.addEventListener('click', () => openNoteDetail(note.id));

      card.innerHTML = `
        <div>
          <div class="note-card-meta">
            <span class="badge-style">${escapeHtml(note.field)}</span>
            <span class="badge-style" style="border-color:rgba(157, 78, 221, 0.3); color:var(--accent-purple)">${escapeHtml(note.mood)}</span>
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

  function openNoteDetail(id) {
    const note = notesState.find(n => n.id === id);
    if (!note) return;

    activeDetailNoteId = id;

    document.getElementById('detailSummaryText').textContent = note.summary;
    document.getElementById('detailNoteBody').textContent = note.note;
    document.getElementById('detailDate').textContent = formatFullDatetime(note.datetime);
    document.getElementById('detailField').textContent = note.field;
    document.getElementById('detailMood').textContent = note.mood;
    document.getElementById('detailLocation').textContent = note.location;
    document.getElementById('detailWordCount').textContent = `${note.wordCount || countWords(note.note)} words`;
    document.getElementById('detailCharCount').textContent = `${note.characterCount || note.note.length} chars`;
    document.getElementById('detailId').textContent = note.id;

    switchTab('note-detail');
  }

  function renderTimelineView() {
    const container = document.getElementById('timelineContainer');
    container.innerHTML = '';

    if (notesState.length === 0) {
      container.innerHTML = '<p class="subtitle">Timeline archive is currently empty.</p>';
      return;
    }

    // Group by Date
    const groups = {};
    notesState.forEach(n => {
      const d = formatDate(n.datetime);
      if (!groups[d]) groups[d] = [];
      groups[d].push(n);
    });

    for (const [dateStr, items] of Object.entries(groups)) {
      const groupEl = document.createElement('div');
      groupEl.className = 'timeline-day-group';

      let itemsHtml = items.map(item => `
        <div class="timeline-item" data-id="${item.id}">
          <div class="timeline-header">
            <span class="timeline-time">${formatTime(item.datetime)}</span>
            <span class="badge-style">${escapeHtml(item.field)}</span>
            <span class="badge-style" style="color:var(--accent-purple); border-color:rgba(157,78,221,0.3)">${escapeHtml(item.mood)}</span>
            <span>&bull; ${escapeHtml(item.location)}</span>
          </div>
          <div style="font-size:0.875rem; font-weight:500; color:#fff; margin-bottom:4px;">${escapeHtml(item.summary)}</div>
          <div style="font-size:0.8rem; color:var(--text-muted);">${escapeHtml(item.note.substring(0, 110))}...</div>
        </div>
      `).join('');

      groupEl.innerHTML = `
        <div class="timeline-date-header">${dateStr}</div>
        ${itemsHtml}
      `;

      container.appendChild(groupEl);
    }

    // Event listeners on timeline items
    container.querySelectorAll('.timeline-item').forEach(el => {
      el.addEventListener('click', () => openNoteDetail(el.dataset.id));
    });
  }

  function renderInsightsView() {
    const container = document.getElementById('insightsContainer');
    container.innerHTML = '';

    const insights = generateAlgorithmicInsights();

    if (insights.length === 0) {
      container.innerHTML = `
        <div class="empty-state-card" style="grid-column: 1/-1;">
          <p>Insufficient dataset telemetry to generate algorithmic observations. Keep logging notes.</p>
        </div>`;
      return;
    }

    insights.forEach(item => {
      const card = document.createElement('div');
      card.className = 'insight-card';
      card.innerHTML = `
        <div class="insight-type">${escapeHtml(item.type)}</div>
        <p>${escapeHtml(item.text)}</p>
      `;
      container.appendChild(card);
    });
  }

  function populateSelectDropdowns() {
    // New Note Selects
    const fieldSel = document.getElementById('noteField');
    const moodSel = document.getElementById('noteMood');
    
    if (fieldSel && fieldSel.children.length === 0) {
      FIELDS.forEach(f => fieldSel.add(new Option(f, f)));
    }
    if (moodSel && moodSel.children.length === 0) {
      MOODS.forEach(m => moodSel.add(new Option(m, m)));
    }

    // Filters Selects
    const fField = document.getElementById('filterField');
    const fMood = document.getElementById('filterMood');
    const fLoc = document.getElementById('filterLocation');

    if (fField && fField.children.length <= 1) {
      FIELDS.forEach(f => fField.add(new Option(f, f)));
    }
    if (fMood && fMood.children.length <= 1) {
      MOODS.forEach(m => fMood.add(new Option(m, m)));
    }

    if (fLoc) {
      fLoc.innerHTML = '<option value="ALL">All Locations</option>';
      getUniqueLocations().forEach(l => fLoc.add(new Option(l, l)));
    }

    // Location datalist
    const dl = document.getElementById('locationSuggestions');
    if (dl) {
      dl.innerHTML = '';
      DEFAULT_LOCATIONS.forEach(loc => {
        const opt = document.createElement('option');
        opt.value = loc;
        dl.appendChild(opt);
      });
    }
  }

  function resetNoteForm() {
    document.getElementById('noteForm').reset();
    document.getElementById('editingNoteId').value = '';
    document.getElementById('noteFormTitle').textContent = 'Capture New Thought';
    document.getElementById('displayDatetime').textContent = formatFullDatetime(new Date().toISOString());
    document.getElementById('wordCount').textContent = '0 words';
    document.getElementById('charCount').textContent = '0 chars';
    document.getElementById('noteSummary').value = '';
  }

  function populateEditForm(id) {
    const note = notesState.find(n => n.id === id);
    if (!note) return;

    document.getElementById('editingNoteId').value = note.id;
    document.getElementById('noteFormTitle').textContent = 'Edit Archive Entry';
    document.getElementById('noteBody').value = note.note;
    document.getElementById('noteField').value = note.field;
    document.getElementById('noteMood').value = note.mood;
    document.getElementById('noteLocation').value = note.location;
    document.getElementById('noteSummary').value = note.summary;
    document.getElementById('displayDatetime').textContent = formatFullDatetime(note.datetime);

    document.getElementById('wordCount').textContent = `${countWords(note.note)} words`;
    document.getElementById('charCount').textContent = `${note.note.length} chars`;

    switchTab('new-note');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, match => {
      const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
      return map[match];
    });
  }

  // ==========================================
  // 10. DEMO SEED DATA GENERATOR
  // ==========================================
  function loadDemoData() {
    const demoEntries = [
      {
        note: "Working through Java and concurrency structures. Understanding thread safety and executor pools in high-throughput network architectures.",
        datetime: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        location: "Pretoria",
        field: "Studying",
        mood: "Motivated",
        summary: "Analyzing Java concurrency structures and thread execution pools for network architectures."
      },
      {
        note: "What if I built an autonomous personal knowledge dashboard running entirely offline inside the browser? Local storage, zero latency.",
        datetime: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
        location: "Home",
        field: "Ideas",
        mood: "Excited",
        summary: "Brainstorming a zero-latency personal knowledge OS browser web application."
      },
      {
        note: "Went for a late evening walk across the neighborhood. Warm air, quiet atmosphere. Essential mental reset after heavy code debugging.",
        datetime: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        location: "Johannesburg",
        field: "Daily Life",
        mood: "Calm",
        summary: "Evening walk around neighborhood provided a necessary mental break from debugging."
      },
      {
        note: "Completed sprint review for the data visualization client pipeline. Addressed canvas performance bottlenecks under large datasets.",
        datetime: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
        location: "Work",
        field: "Work",
        mood: "Neutral",
        summary: "Finalized sprint review and resolved canvas graphics rendering bottlenecks."
      },
      {
        note: "Reflecting on annual personal growth goals. Focus for next quarter is technical depth and consistency over volume.",
        datetime: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
        location: "Home",
        field: "Personal",
        mood: "Happy",
        summary: "Planning quarterly goals prioritizing deep technical focus and consistent execution."
      }
    ];

    notesState = demoEntries.map(e => createNoteObj(e));
    saveNotesToStorage();
    renderApp();
    showToast('Demo dataset loaded successfully', 'success');
  }

  // ==========================================
  // 11. EVENT LISTENERS SETUP
  // ==========================================
  function setupEventListeners() {
    // Tab Navigation
    document.querySelectorAll('[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    document.getElementById('quickNewNoteBtn').addEventListener('click', () => switchTab('new-note'));
    document.getElementById('emptyStateAction').addEventListener('click', () => switchTab('new-note'));

    // Mobile Nav Drawer Toggle
    document.getElementById('mobileNavToggle').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('mobile-open');
    });

    // Real-time Word/Char Counter in Editor
    const noteBody = document.getElementById('noteBody');
    noteBody.addEventListener('input', (e) => {
      const val = e.target.value;
      document.getElementById('wordCount').textContent = `${countWords(val)} words`;
      document.getElementById('charCount').textContent = `${val.length} chars`;
    });

    // AI Summary Generation Trigger
    document.getElementById('generateSummaryBtn').addEventListener('click', async () => {
      const text = noteBody.value;
      if (!text.trim()) {
        showToast('Please enter note content first', 'error');
        return;
      }

      const indicator = document.getElementById('aiLoadingIndicator');
      indicator.classList.remove('hidden');

      const summary = await generateSummaryApi(text);

      document.getElementById('noteSummary').value = summary;
      indicator.classList.add('hidden');
    });

    // Form Submission
    document.getElementById('noteForm').addEventListener('submit', (e) => {
      e.preventDefault();
      
      const noteVal = noteBody.value.trim();
      const fieldVal = document.getElementById('noteField').value;
      const moodVal = document.getElementById('noteMood').value;
      const locVal = document.getElementById('noteLocation').value;
      const summaryVal = document.getElementById('noteSummary').value;
      const editId = document.getElementById('editingNoteId').value;

      if (!noteVal) return;

      if (editId) {
        updateNote(editId, {
          note: noteVal,
          field: fieldVal,
          mood: moodVal,
          location: locVal,
          summary: summaryVal
        });
      } else {
        addNote({
          note: noteVal,
          field: fieldVal,
          mood: moodVal,
          location: locVal,
          summary: summaryVal
        });
      }

      resetNoteForm();
      renderApp();
      switchTab('notes');
    });

    document.getElementById('cancelNoteBtn').addEventListener('click', () => {
      resetNoteForm();
      switchTab('notes');
    });

    // Global Search
    const searchInput = document.getElementById('globalSearch');
    const clearSearch = document.getElementById('clearSearchBtn');

    searchInput.addEventListener('input', (e) => {
      activeSearchQuery = e.target.value.trim();
      clearSearch.hidden = !activeSearchQuery;
      renderNotesArchiveView();
      if (currentActiveTab !== 'notes' && activeSearchQuery) {
        switchTab('notes');
      }
    });

    clearSearch.addEventListener('click', () => {
      searchInput.value = '';
      activeSearchQuery = '';
      clearSearch.hidden = true;
      renderNotesArchiveView();
    });

    // Filters Bar Controls
    ['filterField', 'filterMood', 'filterLocation', 'sortOrder'].forEach(id => {
      document.getElementById(id).addEventListener('change', () => {
        currentFilters.field = document.getElementById('filterField').value;
        currentFilters.mood = document.getElementById('filterMood').value;
        currentFilters.location = document.getElementById('filterLocation').value;
        currentFilters.sort = document.getElementById('sortOrder').value;
        renderNotesArchiveView();
      });
    });

    document.getElementById('resetFiltersBtn').addEventListener('click', () => {
      document.getElementById('filterField').value = 'ALL';
      document.getElementById('filterMood').value = 'ALL';
      document.getElementById('filterLocation').value = 'ALL';
      document.getElementById('sortOrder').value = 'newest';
      currentFilters = { field: 'ALL', mood: 'ALL', location: 'ALL', sort: 'newest' };
      renderNotesArchiveView();
    });

    // Note Detail Actions
    document.getElementById('detailBackBtn').addEventListener('click', () => switchTab('notes'));
    document.getElementById('detailEditBtn').addEventListener('click', () => {
      if (activeDetailNoteId) populateEditForm(activeDetailNoteId);
    });

    document.getElementById('detailDeleteBtn').addEventListener('click', () => {
      if (!activeDetailNoteId) return;
      openModal('Delete Note Entry', 'Are you sure you want to permanently delete this note from your archive?', () => {
        deleteNote(activeDetailNoteId);
        renderApp();
        switchTab('notes');
      });
    });

    // Dashboard Timeframe Select
    document.getElementById('timeframeSelect').addEventListener('change', (e) => {
      renderActivityChart(parseInt(e.target.value, 10));
    });

    // Geolocation helper
    document.getElementById('useGeoLocationBtn').addEventListener('click', () => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            document.getElementById('noteLocation').value = `${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)}`;
            showToast('Approximate location captured', 'success');
          },
          () => showToast('Unable to retrieve browser geolocation', 'error')
        );
      } else {
        showToast('Geolocation not supported by this browser', 'error');
      }
    });

    // Settings & Data Persistence Actions
    document.getElementById('exportDataBtn').addEventListener('click', () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(notesState, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `infinity_notes_archive_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Data archive exported to JSON', 'success');
    });

    document.getElementById('importDataBtn').addEventListener('click', () => {
      document.getElementById('importFileInput').click();
    });

    document.getElementById('importFileInput').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          if (Array.isArray(imported)) {
            notesState = imported;
            saveNotesToStorage();
            renderApp();
            showToast('Archive data imported successfully', 'success');
          } else {
            showToast('Invalid backup file format', 'error');
          }
        } catch (err) {
          showToast('Failed to parse backup JSON file', 'error');
        }
      };
      reader.readAsText(file);
    });

    document.getElementById('loadDemoDataBtn').addEventListener('click', () => {
      openModal('Load Demonstration Dataset', 'This will replace your current notes with sample telemetry notes. Continue?', () => {
        loadDemoData();
      });
    });

    document.getElementById('clearDataBtn').addEventListener('click', () => {
      openModal('Delete All Notes', 'PERMANENT ACTION: Purge all note entries from local storage?', () => {
        clearAllNotes();
        renderApp();
      });
    });

    // AI Mode Switch UI
    document.getElementById('aiModeSelect').addEventListener('change', (e) => {
      const keyGroup = document.getElementById('apiKeyGroup');
      keyGroup.classList.toggle('hidden', e.target.value !== 'api');
    });
  }

  // ==========================================
  // 12. INITIALIZATION
  // ==========================================
  function init() {
    loadNotesFromStorage();
    setupEventListeners();
    renderApp();
    switchTab('dashboard');
  }

  document.addEventListener('DOMContentLoaded', init);
})();