// ==================== REGISTER CHART PLUGIN (AMAN) ====================
if (typeof Chart !== 'undefined' && typeof ChartDataLabels !== 'undefined') {
    Chart.register(ChartDataLabels);
} else {
    console.warn('Chart or DataLabels plugin not loaded yet');
}

// ==================== KONFIGURASI & STATE ====================
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby_K3P9U65-FUWruL7ijnoP0NqrzG-_4NdrV30Zrw9Gr5cWJ0eAnrS6IWDNrIDzqdusxw/exec';
const urlParams = new URLSearchParams(window.location.search);
const podcastId = urlParams.get('podcast');
if (!podcastId) { alert('Podcast tidak dipilih'); window.location.href = 'index.html'; }

let currentUser = null;
let projects = [];
let editors = [];
let subjects = [];
let settingsData = {
    global: '', res: '', rev: '', waRev: '', waRet: '', adminWa: '',
    fonteetoken: '',
    fonteeEndpoint: 'https://api.fontee.com/send-message',
    countryCode: '62',
    loginTitle: ' Podcast',
    adminUsername: 'admin',
    adminPassword: 'labsiber2026',
    userPassword: 'user123',
    podcastName: '',
    userNotifActive: true,
    podcastMaterial: '',
    podcastResult: '',
    podcastRevision: ''
};
let myChart = null;
let activeRowIndex = null;
let whatsappLogs = [];
let selectedRows = new Set();

// ==================== FUNGSI ESCAPE HTML ====================
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ==================== FUNGSI BANTU MODAL ====================
const toggleLoading = (show) => { 
    const loading = document.getElementById('loading-screen');
    if (loading) loading.style.display = show ? 'flex' : 'none';
};
const openModal = (id) => {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'block';
};
const closeModal = (id) => {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'none';
};
window.openModal = openModal;
window.closeModal = closeModal;

// ==================== LOG WHATSAPP ====================
const addWALog = (recipient, projectTitle, status, message, success = true) => {
    const timestamp = new Date().toLocaleString('id-ID', { hour12: false });
    whatsappLogs.unshift({ timestamp, recipient, projectTitle: projectTitle || '-', status: status || '-', message: message.length > 50 ? message.substring(0, 50) + '...' : message, success });
    if (whatsappLogs.length > 100) whatsappLogs.pop();
    updateWABadge(); 
    renderWAPopup();
};
const updateWABadge = () => { 
    const badge = document.getElementById('waLogBadge'); 
    if (badge) badge.innerText = whatsappLogs.length; 
};
const renderWAPopup = () => {
    const body = document.getElementById('waLogBody'); 
    if (!body) return;
    if (!whatsappLogs.length) { 
        body.innerHTML = '<div style="text-align:center; padding:20px; color:#888;">Belum ada aktivitas WhatsApp</div>'; 
        return; 
    }
    let html = '<table class="log-table"><thead><tr><th>Waktu</th><th>Penerima</th><th>Project</th><th>Status</th><th>Pesan</th><th>Hasil</th></tr></thead><tbody>';
    whatsappLogs.forEach(log => {
        html += `<tr>
            <td>${log.timestamp}</td>
            <td>${log.recipient}</td>
            <td>${log.projectTitle}</td>
            <td>${log.status}</td>
            <td>${log.message}</td>
            <td class="${log.success ? 'log-success' : 'log-failed'}">${log.success ? '✓' : '✗'}</td>
        </tr>`;
    });
    html += '</tbody></table>';
    body.innerHTML = html;
};
window.toggleLogPopup = () => {
    const popup = document.getElementById('waLogPopup');
    if (popup) popup.style.display = popup.style.display === 'flex' ? 'none' : 'flex';
    if (popup && popup.style.display === 'flex') renderWAPopup();
};

// ==================== FUNGSI BANTU FORMAT ====================
const formatDateDisplay = (dateStr) => { 
    if (!dateStr) return '-'; 
    const d = new Date(dateStr); 
    return isNaN(d) ? dateStr : d.toLocaleDateString('id-ID'); 
};
const formatDateForInput = (dateStr) => { 
    if (!dateStr) return ''; 
    const d = new Date(dateStr); 
    return isNaN(d) ? '' : d.toISOString().split('T')[0]; 
};
const getDaysUntilDeadline = (deadlineStr) => {
    if (!deadlineStr) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const deadline = new Date(deadlineStr); if (isNaN(deadline)) return null;
    deadline.setHours(0, 0, 0, 0);
    return Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
};
const isNearDeadline = (project) => {
    if (project.status === 'Finalized') return false;
    const days = getDaysUntilDeadline(project.deadline);
    return days !== null && days <= 3;
};
const getStatusColor = (s) => {
    const map = { 'Finalized': '#34C759', 'In Progress': '#FFCC00', 'To do': '#007AFF', 'Review': '#5856D6', 'Revision': '#FF3B30', 'Retake': '#E67E22' };
    return map[s] || '#8E8E93';
};
const normalizeStatus = (s) => {
    if (!s) return 'To do';
    const str = s.toString().toLowerCase().trim();
    if (str === 'to do' || str === 'todo') return 'To do';
    if (str === 'in progress' || str === 'progress') return 'In Progress';
    if (str === 'review') return 'Review';
    if (str === 'revision' || str === 'revisi') return 'Revision';
    if (str === 'retake') return 'Retake';
    if (str === 'finalized' || str === 'final' || str === 'done') return 'Finalized';
    return 'To do';
};
window.normalizeStatus = normalizeStatus;
const sortProjectsByNewest = (arr) => arr.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

// ==================== FUNGSI KIRIM WA VIA BACKEND ====================
const sendWABackend = async (target, msg, projectTitle = '', status = '') => {
    console.log(`📤 sendWABackend: target=${target}, project=${projectTitle}, status=${status}`);
    if (!target) {
        addWALog('(no number)', projectTitle, status, msg.substring(0, 50), false);
        return false;
    }
    const editorNumbers = editors.map(e => e.wa).filter(Boolean);
    const isEditorNumber = editorNumbers.includes(target);
    if (isEditorNumber && !settingsData.userNotifActive) {
        addWALog(target, projectTitle, status, 'Notifikasi user nonaktif', false);
        return false;
    }
    const formData = new URLSearchParams();
    formData.append('action', 'SEND_WA_NOTIFICATION');
    formData.append('targetNumber', target);
    formData.append('customMessage', msg);
    // Tidak perlu auth_token untuk send WA (bisa diakses publik)
    try {
        const res = await fetch(SCRIPT_URL, { method: 'POST', body: formData });
        const data = await res.json();
        const success = data.success === true;
        const recipient = editors.find(e => e.wa === target)?.name || target;
        addWALog(recipient, projectTitle, status, msg.substring(0, 50), success);
        return success;
    } catch (err) {
        console.error('❌ Gagal kirim WA', err);
        addWALog(target, projectTitle, status, msg.substring(0, 50), false);
        return false;
    }
};
window.sendWABackend = sendWABackend;

const sendWAToMultiple = async (targets, msg, title, st) => {
    if (!targets) { console.warn('sendWAToMultiple: targets kosong'); return; }
    const list = String(targets).split(',').map(t => t.trim()).filter(Boolean);
    for (const num of list) {
        await sendWABackend(num, msg, title, st);
        await new Promise(r => setTimeout(r, 1000));
    }
};

// ==================== LOAD DATA ====================
window.refreshData = async function () {
    toggleLoading(true);
    try {
        const res = await fetch(SCRIPT_URL + '?podcast=' + podcastId + '&t=' + Date.now());
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        console.log('📦 Data dari backend:', data);

        projects = (data.projects || []).map((p, i) => ({
            id: p.id,
            title: p.title || '',
            subject: p.subject || p.Narasumber || '',
            host: p.host || '',
            editor: p.editor || '',
            deadline: p.deadline || '',
            status: normalizeStatus(p.status || p.Status || ''),
            raw: p.raw || p.RAW || '',
            result: p.result || p.Result || '',
            revision: p.revision || p.Revision || '',
            note: p.note || p.Note || '',
            timestamp: p.timestamp || p.Timestamp || '',
            rowIndex: p.id
        }));

        editors = (data.editors || []).filter(e => e.name && e.name !== 'admin').map(e => ({ name: String(e.name).trim(), wa: String(e.wa || '').trim() }));
        subjects = [...new Set((data.subjects || []).map(s => String(s).trim()).filter(Boolean))];

        const sets = data.settings || [];
        sets.forEach(r => {
            if (!r || r.length < 2) return;
            const key = r[0], val = r[1];
            if (key === 'GLOBAL_MATERIAL') settingsData.global = val || '';
            else if (key === 'FOLDER_RESULT') settingsData.res = val || '';
            else if (key === 'FOLDER_REVISION') settingsData.rev = val || '';
            else if (key === 'WA_REVISION') settingsData.waRev = val || '';
            else if (key === 'WA_RETAKE') settingsData.waRet = val || '';
            else if (key === 'ADMIN_WA') settingsData.adminWa = val || '';
            else if (key === 'FONTEE_TOKEN') settingsData.fonteetoken = val || '';
            else if (key === 'FONTEE_ENDPOINT') settingsData.fonteeEndpoint = val || 'https://api.fontee.com/send-message';
            else if (key === 'COUNTRY_CODE') settingsData.countryCode = val || '62';
            else if (key === 'LOGIN_TITLE') settingsData.loginTitle = val || ' Podcast';
            else if (key === 'ADMIN_USERNAME') settingsData.adminUsername = val || 'admin';
            else if (key === 'ADMIN_PASSWORD') settingsData.adminPassword = val || 'labsiber2026';
            else if (key === 'USER_PASSWORD') settingsData.userPassword = val || 'user123';
            else if (key === 'USER_NOTIF_ACTIVE') settingsData.userNotifActive = (val === 'true' || val === '1');
        });

        if (data.podcast) {
            settingsData.podcastName = data.podcast.name;
            settingsData.podcastMaterial = data.podcast.material_folder || '';
            settingsData.podcastResult = data.podcast.result_folder || '';
            settingsData.podcastRevision = data.podcast.revision_folder || '';
        } else {
            settingsData.podcastName = settingsData.loginTitle;
            settingsData.podcastMaterial = settingsData.global;
            settingsData.podcastResult = settingsData.res;
            settingsData.podcastRevision = settingsData.rev;
        }

        const sumEditor = document.getElementById('sum-editor');
        if (sumEditor) sumEditor.innerText = editors.length;
        const sumSubject = document.getElementById('sum-subject');
        if (sumSubject) sumSubject.innerText = subjects.length;
        const sumVideo = document.getElementById('sum-video');
        if (sumVideo) sumVideo.innerText = projects.length;

        const matLink = document.getElementById('global-material-link');
        if (matLink) {
            if (settingsData.podcastMaterial) matLink.href = settingsData.podcastMaterial;
            else if (settingsData.global) matLink.href = settingsData.global;
            else matLink.href = '#';
        }

        updateAllTitles();

        if (currentUser && currentUser !== 'admin') {
            const loginLower = currentUser.toLowerCase();
            const matched = editors.find(e => e.name.toLowerCase() === loginLower || e.name.toLowerCase().split(/\s+/).some(p => p === loginLower));
            if (matched) currentUser = matched.name;
            else { alert('Nama tidak cocok'); handleLogout(); toggleLoading(false); return; }
        }

        syncDropdowns();
        renderTable();
        if (document.getElementById('monitoring-page') && document.getElementById('monitoring-page').style.display === 'block') refreshMonitoringPage();

        if (currentUser === 'admin') {
            const waFloat = document.getElementById('waLogFloat');
            if (waFloat) waFloat.classList.remove('hidden');
            const toggleBtn = document.getElementById('toggle-wa-panel-btn');
            if (toggleBtn) toggleBtn.classList.remove('hidden');
        } else {
            const waFloat = document.getElementById('waLogFloat');
            if (waFloat) waFloat.classList.add('hidden');
            const toggleBtn = document.getElementById('toggle-wa-panel-btn');
            if (toggleBtn) toggleBtn.classList.add('hidden');
            const waPopup = document.getElementById('waLogPopup');
            if (waPopup) waPopup.style.display = 'none';
        }
    } catch (e) {
        console.error(e);
        alert('Gagal memuat data. Pastikan URL backend benar.');
    } finally {
        toggleLoading(false);
    }
};

function updateAllTitles() {
    const title = settingsData.podcastName || settingsData.loginTitle;
    document.title = title + ' - Production Suite';
    const loginTitle = document.getElementById('login-title');
    if (loginTitle) loginTitle.innerText = title;
    const dashboardTitle = document.getElementById('dashboard-title');
    if (dashboardTitle) dashboardTitle.innerText = title + ' - Production Suite';
    const monitoringTitle = document.getElementById('monitoring-title-text');
    if (monitoringTitle) monitoringTitle.innerText = 'Monitoring ' + title;
}

// ==================== SINKRONISASI DROPDOWN ====================
const syncDropdowns = () => {
    const subj = document.getElementById('f-subject');
    if (subj) {
        let opts = '<option value="">All Narasumber</option>';
        const relevant = (currentUser === 'admin') ? subjects : [...new Set(projects.filter(p => p.editor === currentUser).map(p => p.subject).filter(Boolean))];
        relevant.forEach(s => { if (s) opts += `<option value="${s}">${escapeHtml(s)}</option>`; });
        subj.innerHTML = opts;
    }
    const sts = document.getElementById('f-status');
    if (sts) {
        sts.innerHTML = '<option value="">All Status</option>' + ['To do', 'In Progress', 'Review', 'Revision', 'Retake', 'Finalized'].map(s => `<option value="${s}">${s}</option>`).join('');
    }
    const nSubj = document.getElementById('n-subject');
    if (nSubj) nSubj.innerHTML = subjects.map(s => `<option value="${s}">${escapeHtml(s)}</option>`).join('');
    const nEd = document.getElementById('n-editor');
    if (nEd) nEd.innerHTML = editors.map(e => `<option value="${e.name}">${escapeHtml(e.name)}</option>`).join('');
    if (currentUser === 'admin') {
        const ed = document.getElementById('f-editor');
        if (ed) {
            ed.innerHTML = '<option value="">All Editor</option>' + editors.map(e => `<option value="${e.name}">${escapeHtml(e.name)}</option>`).join('');
            ed.classList.remove('hidden');
        }
        const waSel = document.getElementById('wa-recipient-select');
        if (waSel) waSel.innerHTML = '<option value="">-- Pilih Editor --</option>' + editors.map(e => `<option value="${e.name}">${escapeHtml(e.name)}</option>`).join('');
    } else {
        const ed = document.getElementById('f-editor');
        if (ed) ed.classList.add('hidden');
    }
};
window.syncDropdowns = syncDropdowns;

// ==================== RENDER TABEL ====================
window.renderTable = function () {
    try {
        const fSub = document.getElementById('f-subject')?.value || '';
        const fEd = (currentUser === 'admin') ? document.getElementById('f-editor')?.value || '' : '';
        const fSt = document.getElementById('f-status')?.value || '';
        const fSearch = document.getElementById('f-search')?.value.toLowerCase() || '';

        let filtered = projects.map(p => ({ ...p, displayStatus: normalizeStatus(p.status) }));
        if (currentUser !== 'admin') filtered = filtered.filter(p => p.editor === currentUser);
        filtered = filtered.filter(p => (!fSub || p.subject === fSub) && (!fEd || p.editor === fEd) && (!fSt || p.displayStatus === fSt));
        if (fSearch) filtered = filtered.filter(p => p.title.toLowerCase().includes(fSearch));
        filtered = sortProjectsByNewest(filtered);

        const tbody = document.getElementById('main-table-body');
        if (!filtered.length) {
            tbody.innerHTML = `<tr><td colspan="12" style="text-align:center; padding:30px;">Belum ada project</td></tr>`;
            updateStatsAndChart([]);
            return;
        }
        let html = '';
        filtered.forEach(p => {
            const isRev = p.displayStatus === 'Revision';
            const color = getStatusColor(p.displayStatus);
            const deadlineClass = isNearDeadline(p) ? 'deadline-warning' : '';
            const noteId = `note-${p.rowIndex}`;
            const noteText = p.note || '-';
            const hasNote = p.note && p.note.length > 0;
            const checked = selectedRows.has(p.rowIndex) ? 'checked' : '';
            html += `<tr>
                <td data-label="Pilih" style="text-align:center;"><input type="checkbox" class="row-checkbox" data-rowindex="${p.rowIndex}" ${checked} onclick="toggleRowSelection(${p.rowIndex}, this.checked)"></td>
                <td data-label="Title"><b>${escapeHtml(p.title)}</b></td>
                <td data-label="Narasumber">${escapeHtml(p.subject)}</td>
                <td data-label="Host">${escapeHtml(p.host)}</td>
                <td data-label="Editor">${escapeHtml(p.editor)}</td>
                <td data-label="Deadline" class="${deadlineClass}">${formatDateDisplay(p.deadline)}</td>
                <td data-label="Status"><span class="pill ${isRev ? 'pill-revision' : ''}" style="${isRev ? '' : 'background:' + color}">${p.displayStatus}</span></td>
                <td data-label="RAW">${p.raw ? `<a href="${p.raw}" target="_blank" class="btn-main btn-gray" style="padding:5px"><i class="fa-solid fa-link"></i></a>` : '-'}</td>
                <td data-label="Res">${p.result ? `<a href="${p.result}" target="_blank" class="btn-main btn-gray" style="padding:5px"><i class="fa-solid fa-play"></i></a>` : '-'}</td>
                <td data-label="Rev">${p.revision ? `<a href="${p.revision}" target="_blank" class="btn-main btn-gray" style="padding:5px"><i class="fa-solid fa-rotate"></i></a>` : '-'}</td>
                <td data-label="Note" class="note-cell">${hasNote ? `<div id="${noteId}" class="note-text">${escapeHtml(noteText)}</div><button class="note-more-btn" onclick="toggleNote('${noteId}')">more</button>` : '-'}</td>
                <td data-label="Action"><button class="btn-main btn-gray" onclick="openAction(${p.rowIndex})">Edit</button></td>
            </tr>`;
        });
        tbody.innerHTML = html;

        const selectAll = document.getElementById('select-all-checkbox');
        if (selectAll) {
            const total = document.querySelectorAll('.row-checkbox').length;
            const checkedCount = document.querySelectorAll('.row-checkbox:checked').length;
            selectAll.checked = total > 0 && checkedCount === total;
            selectAll.indeterminate = checkedCount > 0 && checkedCount < total;
        }

        const nearCount = filtered.filter(isNearDeadline).length;
        const sumDeadlineWarning = document.getElementById('sum-deadline-warning');
        if (sumDeadlineWarning) sumDeadlineWarning.innerText = nearCount;
        const deadlineWarningItem = document.getElementById('deadline-warning-item');
        if (deadlineWarningItem) deadlineWarningItem.style.display = nearCount ? 'flex' : 'none';

        updateStatsAndChart(filtered);
    } catch (e) { console.error('Render error', e); }
};

const updateStatsAndChart = (data) => {
    const todo = data.filter(x => x.displayStatus === 'To do').length;
    const prog = data.filter(x => x.displayStatus === 'In Progress').length;
    const rev = data.filter(x => x.displayStatus === 'Review').length;
    const revis = data.filter(x => x.displayStatus === 'Revision').length;
    const ret = data.filter(x => x.displayStatus === 'Retake').length;
    const fin = data.filter(x => x.displayStatus === 'Finalized').length;
    document.getElementById('stat-todo').innerText = todo;
    document.getElementById('stat-progress').innerText = prog;
    document.getElementById('stat-review').innerText = rev;
    document.getElementById('stat-revision').innerText = revis;
    document.getElementById('stat-retake').innerText = ret;
    document.getElementById('stat-final').innerText = fin;
    const total = data.length || 1;
    const percent = Math.round((fin / total) * 100);
    const center = document.getElementById('center-percent');
    if (center) center.innerText = percent + '%';
    if (myChart) myChart.destroy();
    const ctx = document.getElementById('statusChart');
    if (ctx && typeof Chart !== 'undefined') {
        myChart = new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: { labels: ['To do', 'In Progress', 'Review', 'Revision', 'Retake', 'Finalized'], datasets: [{ data: [todo, prog, rev, revis, ret, fin], backgroundColor: ['#007AFF', '#FFCC00', '#5856D6', '#FF3B30', '#E67E22', '#34C759'], borderWidth: 0 }] },
            options: { cutout: '70%', plugins: { legend: { display: false }, datalabels: { display: (ctx) => ctx.dataset.data[ctx.dataIndex] > 0, backgroundColor: (ctx) => ctx.dataset.backgroundColor[ctx.dataIndex], borderRadius: 4, color: 'white', font: { weight: 'bold', size: 10 }, padding: { top: 2, bottom: 2, left: 6, right: 6 }, formatter: (val, ctx) => { const total = ctx.dataset.data.reduce((a, b) => a + b, 0); return total ? Math.round((val / total) * 100) + '%' : '0%'; } } } }
        });
    }
};

// ==================== MONITORING ====================
window.refreshMonitoringPage = () => {
    const monSumEditor = document.getElementById('mon-sum-editor');
    if (monSumEditor) monSumEditor.innerText = editors.length;
    const monSumSubject = document.getElementById('mon-sum-subject');
    if (monSumSubject) monSumSubject.innerText = subjects.length;
    const monSumVideo = document.getElementById('mon-sum-video');
    if (monSumVideo) monSumVideo.innerText = projects.length;
    const monSub = document.getElementById('mon-f-subject');
    if (monSub) monSub.innerHTML = '<option value="">All Narasumber</option>' + subjects.map(s => `<option value="${s}">${escapeHtml(s)}</option>`).join('');
    const monEd = document.getElementById('mon-f-editor');
    if (monEd) monEd.innerHTML = '<option value="">All Editor</option>' + editors.map(e => `<option value="${e.name}">${escapeHtml(e.name)}</option>`).join('');
    const monSt = document.getElementById('mon-f-status');
    if (monSt) monSt.innerHTML = '<option value="">All Status</option>' + ['To do', 'In Progress', 'Review', 'Revision', 'Retake', 'Finalized'].map(s => `<option value="${s}">${s}</option>`).join('');
    renderMonitoringTable();
};
window.renderMonitoringTable = () => {
    const fSub = document.getElementById('mon-f-subject')?.value || '';
    const fEd = document.getElementById('mon-f-editor')?.value || '';
    const fSt = document.getElementById('mon-f-status')?.value || '';
    let filtered = projects.map(p => ({ ...p, displayStatus: normalizeStatus(p.status) }));
    filtered = filtered.filter(p => (!fSub || p.subject === fSub) && (!fEd || p.editor === fEd) && (!fSt || p.displayStatus === fSt));
    filtered = sortProjectsByNewest(filtered);
    const tbody = document.getElementById('monitoring-table-body');
    if (!filtered.length) { tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;">Belum ada data</td></tr>'; return; }
    let html = '';
    filtered.forEach(p => {
        html += `<tr>
            <td data-label="Title">${escapeHtml(p.title)}</td>
            <td data-label="Narasumber">${escapeHtml(p.subject)}</td>
            <td data-label="Host">${escapeHtml(p.host)}</td>
            <td data-label="Editor">${escapeHtml(p.editor)}</td>
            <td data-label="Deadline">${formatDateDisplay(p.deadline)}</td>
            <td data-label="Status"><span class="pill" style="background:${getStatusColor(p.displayStatus)}">${p.displayStatus}</span></td>
            <td data-label="RAW">${p.raw ? '🔗' : '-'}</td>
            <td data-label="Res">${p.result ? '▶️' : '-'}</td>
            <td data-label="Rev">${p.revision ? '🔄' : '-'}</td>
            <td data-label="Note">${p.note ? (p.note.length > 20 ? p.note.substring(0, 20) + '…' : p.note) : '-'}</td>
        </tr>`;
    });
    tbody.innerHTML = html;
};

// ==================== LOGIN / LOGOUT ====================
window.handleLogin = async function () {
    const u = document.getElementById('username').value.trim().toLowerCase();
    const p = document.getElementById('password').value;
    if (u === (settingsData.adminUsername || 'admin').toLowerCase() && p === (settingsData.adminPassword || 'labsiber2026')) {
        currentUser = 'admin';
    } else if (p === (settingsData.userPassword || 'user123')) {
        currentUser = u;
    } else {
        return alert('Username atau password salah');
    }
    localStorage.setItem('podcastSession', currentUser);
    await refreshData();
    showDashboard();
};

async function loadEditorScore(editorName) {
    try {
        const res = await fetch(`${SCRIPT_URL}?action=GET_EDITOR_SCORE&editor=${encodeURIComponent(editorName)}&podcast=${podcastId}&nocache=${Date.now()}`);
        const data = await res.json();
        const scoreSpan = document.getElementById('score-value');
        if (scoreSpan) scoreSpan.innerText = data.success ? data.score : '0';
    } catch (err) {
        console.error('Gagal memuat skor editor', err);
        const scoreSpan = document.getElementById('score-value');
        if (scoreSpan) scoreSpan.innerText = '0';
    }
}

const showDashboard = () => {
    const loginPage = document.getElementById('login-page');
    const monitoringPage = document.getElementById('monitoring-page');
    const dashboardPage = document.getElementById('dashboard-page');
    if (loginPage) loginPage.style.display = 'none';
    if (monitoringPage) monitoringPage.style.display = 'none';
    if (dashboardPage) dashboardPage.style.display = 'block';
    const greetings = document.getElementById('greetings');
    if (greetings) greetings.innerText = 'Halo, ' + (currentUser === 'admin' ? 'Admin' : currentUser.toUpperCase());

    const adminControls = document.getElementById('admin-controls');
    const adminWaCustom = document.getElementById('admin-wa-custom-btn');
    const fEditor = document.getElementById('f-editor');
    const waLogFloat = document.getElementById('waLogFloat');
    const toggleWaPanel = document.getElementById('toggle-wa-panel-btn');
    const scoreContainer = document.getElementById('editor-score-container');
    if (currentUser === 'admin') {
        if (adminControls) adminControls.classList.remove('hidden');
        if (adminWaCustom) adminWaCustom.classList.remove('hidden');
        if (fEditor) fEditor.classList.remove('hidden');
        if (waLogFloat) waLogFloat.classList.remove('hidden');
        if (toggleWaPanel) toggleWaPanel.classList.remove('hidden');
        if (scoreContainer) scoreContainer.style.display = 'none';
    } else {
        if (adminControls) adminControls.classList.add('hidden');
        if (adminWaCustom) adminWaCustom.classList.add('hidden');
        if (fEditor) fEditor.classList.add('hidden');
        if (waLogFloat) waLogFloat.classList.add('hidden');
        if (toggleWaPanel) toggleWaPanel.classList.add('hidden');
        if (scoreContainer) scoreContainer.style.display = 'block';
        loadEditorScore(currentUser);
    }
};
window.handleLogout = () => { localStorage.removeItem('podcastSession'); location.reload(); };
window.backToLogin = () => {
    const monitoringPage = document.getElementById('monitoring-page');
    const dashboardPage = document.getElementById('dashboard-page');
    const loginPage = document.getElementById('login-page');
    if (monitoringPage) monitoringPage.style.display = 'none';
    if (dashboardPage) dashboardPage.style.display = 'none';
    if (loginPage) loginPage.style.display = 'flex';
};
window.enterMonitoring = async () => {
    const loginPage = document.getElementById('login-page');
    const dashboardPage = document.getElementById('dashboard-page');
    const monitoringPage = document.getElementById('monitoring-page');
    if (loginPage) loginPage.style.display = 'none';
    if (dashboardPage) dashboardPage.style.display = 'none';
    if (monitoringPage) monitoringPage.style.display = 'block';
    if (!projects.length) await refreshData();
    refreshMonitoringPage();
};

// ==================== MODAL NEW PROJECT ====================
window.openNewProjectModal = () => {
    const today = new Date();
    const deadline = new Date(today); deadline.setDate(today.getDate() + 5);
    const yyyy = deadline.getFullYear();
    const mm = String(deadline.getMonth() + 1).padStart(2, '0');
    const dd = String(deadline.getDate()).padStart(2, '0');
    const deadlineInput = document.getElementById('n-deadline');
    if (deadlineInput) deadlineInput.value = `${yyyy}-${mm}-${dd}`;
    openModal('modalNewProject');
};
window.saveNewProject = async () => {
    const title = document.getElementById('n-title').value.trim();
    const subject = document.getElementById('n-subject').value;
    const host = document.getElementById('n-host').value.trim();
    const editorName = document.getElementById('n-editor').value;
    const deadline = document.getElementById('n-deadline').value;
    const raw = document.getElementById('n-raw').value.trim();
    if (!title || !subject || !host || !editorName || !deadline || !raw) { alert('Semua field harus diisi'); return; }
    toggleLoading(true);
    const formData = new URLSearchParams();
    formData.append('action', 'CREATE');
    formData.append('title', title);
    formData.append('subject', subject);
    formData.append('host', host);
    formData.append('editor', editorName);
    formData.append('deadline', deadline);
    formData.append('raw', raw);
    formData.append('podcastId', podcastId);
    // Tambahkan auth_token untuk admin (CREATE butuh akses admin)
    if (currentUser === 'admin') {
        formData.append('auth_token', settingsData.adminPassword);
    }
    try {
        const res = await fetch(SCRIPT_URL, { method: 'POST', body: formData });
        const result = await res.json();
        if (result.success) {
            closeModal('modalNewProject');
            document.getElementById('n-title').value = '';
            document.getElementById('n-host').value = '';
            document.getElementById('n-raw').value = '';
            await refreshData();
            alert('Episode berhasil dibuat!');
        } else alert('Gagal: ' + (result.error || ''));
    } catch (err) { alert('Gagal terhubung ke server'); } finally { toggleLoading(false); }
};

// ==================== ACTION MODAL ====================
window.openAction = (idx) => {
    activeRowIndex = idx;
    const p = projects.find(x => x.rowIndex === idx);
    if (!p) return;
    document.getElementById('a-title').value = p.title || '';
    document.getElementById('a-deadline').value = formatDateForInput(p.deadline);
    document.getElementById('a-result').value = p.result || '';
    document.getElementById('a-revision').value = p.revision || '';
    document.getElementById('a-note').value = p.note || '';
    const subj = document.getElementById('a-subject');
    subj.innerHTML = subjects.map(s => `<option value="${s}">${escapeHtml(s)}</option>`).join('');
    subj.value = p.subject || '';
    document.getElementById('a-host').value = p.host || '';
    if (currentUser === 'admin') {
        subj.disabled = false;
        document.getElementById('a-host').disabled = false;
    } else {
        subj.disabled = true;
        document.getElementById('a-host').disabled = true;
    }
    const sts = document.getElementById('a-status');
    const edSel = document.getElementById('a-change-editor');
    edSel.innerHTML = editors.map(e => `<option value="${e.name}">${escapeHtml(e.name)}</option>`).join('');
    if (currentUser === 'admin') {
        const adminArea = document.getElementById('admin-action-area');
        const editorArea = document.getElementById('editor-action-area');
        if (adminArea) adminArea.classList.remove('hidden');
        if (editorArea) editorArea.classList.add('hidden');
        sts.innerHTML = ['To do', 'In Progress', 'Review', 'Revision', 'Retake', 'Finalized'].map(s => `<option value="${s}">${s}</option>`).join('');
        document.getElementById('a-title').disabled = false;
        document.getElementById('a-deadline').disabled = false;
        document.getElementById('a-note').disabled = false;
        edSel.disabled = false;
        edSel.value = p.editor;
    } else {
        const adminArea = document.getElementById('admin-action-area');
        const editorArea = document.getElementById('editor-action-area');
        if (adminArea) adminArea.classList.add('hidden');
        if (editorArea) editorArea.classList.remove('hidden');
        sts.innerHTML = ['To do', 'In Progress', 'Review', 'Retake'].map(s => `<option value="${s}">${s}</option>`).join('');
        document.getElementById('a-title').disabled = true;
        document.getElementById('a-deadline').disabled = true;
        document.getElementById('a-note').disabled = false;
        edSel.disabled = true;
        edSel.value = p.editor;
        if (editorArea) {
            editorArea.innerHTML = `
                <button class="btn-main" style="width:100%" onclick="saveAction()">Save</button>
                <button class="btn-main" style="background:#FF3B30; width:100%; margin-top:8px;" onclick="rejectTask()">Tolak Tugas</button>
            `;
        }
    }
    sts.value = p.status;
    handleStatusChange();
    openModal('modalAction');
};
window.handleStatusChange = () => {
    const st = document.getElementById('a-status').value;
    const note = document.getElementById('a-note');
    const needed = st === 'Retake' || st === 'Revision';
    note.disabled = !needed;
    note.placeholder = needed ? 'Wajib diisi' : '';
    note.style.backgroundColor = needed ? '#fff' : '#f2f2f7';
    if (!needed) note.value = '';
};

window.rejectTask = async function() {
    if (!confirm('Apakah kamu yakin menolak tugas ini? Tugas akan dialihkan ke editor lain.')) return;
    toggleLoading(true);
    const formData = new URLSearchParams();
    formData.append('action', 'REJECT_TASK');
    formData.append('rowIndex', activeRowIndex);
    formData.append('reason', 'Tidak bersedia mengerjakan');
    // Reject task memerlukan akses admin? Tergantung backend, tapi aman kirim token jika admin
    if (currentUser === 'admin') {
        formData.append('auth_token', settingsData.adminPassword);
    }
    try {
        const res = await fetch(SCRIPT_URL, { method: 'POST', body: formData });
        const result = await res.json();
        if (result.success) {
            alert('Tugas telah dialihkan ke editor lain');
            closeModal('modalAction');
            await refreshData();
        } else {
            alert('Gagal: ' + (result.error || ''));
        }
    } catch (err) {
        alert('Gagal terhubung ke server');
        console.error(err);
    } finally {
        toggleLoading(false);
    }
};

window.saveAction = async () => {
    toggleLoading(true);
    try {
        const st = document.getElementById('a-status').value;
        const note = document.getElementById('a-note').value;
        if ((st === 'Retake' || st === 'Revision') && !note.trim()) { alert('Note wajib diisi'); toggleLoading(false); return; }
        if (!settingsData.fonteetoken) {
            alert('Token Fontee belum diisi! Tidak dapat mengirim WhatsApp.');
            toggleLoading(false);
            return;
        }

        const formData = new URLSearchParams();
        formData.append('action', 'UPDATE_STATUS');
        formData.append('rowIndex', activeRowIndex);
        formData.append('status', st);
        formData.append('note', note);
        formData.append('editor', document.getElementById('a-change-editor').value);
        formData.append('result', document.getElementById('a-result').value);
        formData.append('revision', document.getElementById('a-revision').value);
        formData.append('deadline', document.getElementById('a-deadline').value);
        if (currentUser === 'admin') {
            formData.append('title', document.getElementById('a-title').value);
            formData.append('subject', document.getElementById('a-subject').value);
            formData.append('host', document.getElementById('a-host').value);
            formData.append('auth_token', settingsData.adminPassword);
        }

        const res = await fetch(SCRIPT_URL, { method: 'POST', body: formData });
        const result = await res.json();
        if (result.success) {
            const project = projects.find(p => p.rowIndex === activeRowIndex);
            const editorName = document.getElementById('a-change-editor').value;
            const editor = editors.find(e => e.name === editorName);
            const newResult = document.getElementById('a-result').value;
            const newRevision = document.getElementById('a-revision').value;
            const newTitle = document.getElementById('a-title').value;
            const newSubject = document.getElementById('a-subject').value;
            const newHost = document.getElementById('a-host').value;
            const newDeadline = document.getElementById('a-deadline').value;
            const noteText = note;

            if (currentUser === 'admin') {
                let link = '', linkLabel = '';
                if (st === 'Revision' || st === 'Review') { link = newResult; linkLabel = 'Result'; } else { link = project?.raw || ''; linkLabel = 'RAW'; }
                if (editor) {
                    if (!editor.wa) {
                        alert(`Nomor WA untuk editor ${editor.name} tidak terisi! WA tidak dikirim.`);
                    } else {
                        const msg = window.buildAdminToUserMessage(
                            editor.name, newTitle, newSubject, newHost, st, newDeadline, noteText, link, linkLabel
                        );
                        await sendWABackend(editor.wa, msg, newTitle, st);
                    }
                } else { alert('Editor tidak ditemukan! WA tidak dikirim.'); }

                if (st === 'Revision' && settingsData.waRev) {
                    const msg = window.buildUserToAdminMessage(editor?.name || 'Admin', newTitle, newSubject, newHost, st, newDeadline, noteText, link, linkLabel);
                    await sendWAToMultiple(settingsData.waRev, msg, newTitle, st);
                }
                if (st === 'Retake' && settingsData.waRet) {
                    const msg = window.buildUserToAdminMessage(editor?.name || 'Admin', newTitle, newSubject, newHost, st, newDeadline, noteText, link, linkLabel);
                    await sendWAToMultiple(settingsData.waRet, msg, newTitle, st);
                }
                if (settingsData.adminWa) {
                    const msg = window.buildUserToAdminMessage(editor?.name || 'Admin', newTitle, newSubject, newHost, st, newDeadline, noteText, link, linkLabel);
                    await sendWAToMultiple(settingsData.adminWa, msg, newTitle, st);
                }
            } else {
                if (settingsData.fonteetoken) {
                    let link = '', linkLabel = '';
                    if (st === 'Review') { link = newResult; linkLabel = 'Result'; }
                    else if (st === 'Revision') { link = newRevision; linkLabel = 'Revision'; }
                    const msg = window.buildUserToAdminMessage(currentUser, newTitle, newSubject, newHost, st, newDeadline, noteText, link, linkLabel);
                    if (settingsData.adminWa) await sendWAToMultiple(settingsData.adminWa, msg, newTitle, st);
                    if (st === 'Revision' && settingsData.waRev) await sendWAToMultiple(settingsData.waRev, msg, newTitle, st);
                    if (st === 'Retake' && settingsData.waRet) await sendWAToMultiple(settingsData.waRet, msg, newTitle, st);
                }
            }
            closeModal('modalAction');
            await refreshData();
            alert('Berhasil Update Status!');
        } else { alert('Gagal: ' + (result.error || '')); }
    } catch (err) { alert('Gagal terhubung ke server'); console.error(err); } finally { toggleLoading(false); }
};

window.deleteProject = async () => {
    if (!confirm('Hapus project ini?')) return;
    toggleLoading(true);
    const formData = new URLSearchParams();
    formData.append('action', 'DELETE');
    formData.append('rowIndex', activeRowIndex);
    if (currentUser === 'admin') {
        formData.append('auth_token', settingsData.adminPassword);
    }
    try {
        const res = await fetch(SCRIPT_URL, { method: 'POST', body: formData });
        const result = await res.json();
        if (result.success) { closeModal('modalAction'); await refreshData(); alert('Project dihapus'); }
        else alert('Gagal: ' + (result.error || ''));
    } catch (err) { alert('Gagal terhubung ke server'); } finally { toggleLoading(false); }
};

// ==================== MANAGEMENT ====================
window.openManagement = () => {
    document.getElementById('m-global').value = settingsData.global || '';
    document.getElementById('m-result').value = settingsData.res || '';
    document.getElementById('m-rev').value = settingsData.rev || '';
    document.getElementById('m-wa-review').value = settingsData.waRev || '';
    document.getElementById('m-wa-retake').value = settingsData.waRet || '';
    document.getElementById('m-admin-wa').value = settingsData.adminWa || '';
    document.getElementById('m-fontee-token').value = settingsData.fonteetoken || '';
    document.getElementById('m-fontee-endpoint').value = settingsData.fonteeEndpoint || 'https://api.fontee.com/send-message';
    document.getElementById('m-country-code').value = settingsData.countryCode || '62';
    renderMgmtLists();
    openModal('modalManagement');
};
const renderMgmtLists = () => {
    const editorList = document.getElementById('m-editor-list');
    if (editorList) editorList.innerHTML = editors.map((e, i) => `<div class="list-item-row"><input type="text" value="${escapeHtml(e.name)}" onchange="editors[${i}].name=this.value" placeholder="Nama" style="width:45%"><input type="text" value="${escapeHtml(e.wa)}" onchange="editors[${i}].wa=this.value" placeholder="WA" style="width:40%"><i class="fa-solid fa-trash" style="color:red; cursor:pointer;" onclick="editors.splice(${i},1);renderMgmtLists()"></i></div>`).join('');
    const subjectList = document.getElementById('m-subject-list');
    if (subjectList) subjectList.innerHTML = subjects.map((s, i) => `<div class="list-item-row"><input type="text" value="${escapeHtml(s)}" onchange="subjects[${i}]=this.value" style="width:90%"><i class="fa-solid fa-trash" style="color:red; cursor:pointer;" onclick="subjects.splice(${i},1);renderMgmtLists()"></i></div>`).join('');
};
window.addEditor = () => {
    const n = document.getElementById('m-new-editor-name').value.trim();
    const w = document.getElementById('m-new-editor-wa').value.trim();
    if (!n || !w) { alert('Nama dan WA harus diisi'); return; }
    if (editors.some(e => e.name.toLowerCase() === n.toLowerCase())) { alert('Nama sudah ada'); return; }
    editors.push({ name: n, wa: w });
    document.getElementById('m-new-editor-name').value = '';
    document.getElementById('m-new-editor-wa').value = '';
    renderMgmtLists();
};
window.addSubject = () => {
    const s = document.getElementById('m-new-subject').value.trim();
    if (!s) { alert('Narasumber tidak boleh kosong'); return; }
    if (subjects.includes(s)) { alert('Narasumber sudah ada'); return; }
    subjects.push(s);
    document.getElementById('m-new-subject').value = '';
    renderMgmtLists();
};
window.saveManagement = async () => {
    const formData = new URLSearchParams();
    formData.append('action', 'FULL_SETTING_UPDATE');
    formData.append('global', document.getElementById('m-global').value);
    formData.append('res', document.getElementById('m-result').value);
    formData.append('rev', document.getElementById('m-rev').value);
    formData.append('waRev', document.getElementById('m-wa-review').value);
    formData.append('waRet', document.getElementById('m-wa-retake').value);
    formData.append('adminWa', document.getElementById('m-admin-wa').value);
    formData.append('FONTEE_TOKEN', document.getElementById('m-fontee-token').value);
    formData.append('fonteeEndpoint', document.getElementById('m-fontee-endpoint').value);
    formData.append('countryCode', document.getElementById('m-country-code').value);
    formData.append('editors', JSON.stringify(editors));
    formData.append('subjects', JSON.stringify(subjects));
    // WAJIB: tambahkan auth_token untuk admin
    formData.append('auth_token', settingsData.adminPassword);
    toggleLoading(true);
    try {
        const res = await fetch(SCRIPT_URL, { method: 'POST', body: formData });
        const result = await res.json();
        if (result.success) { closeModal('modalManagement'); await refreshData(); alert('Pengaturan disimpan'); }
        else alert('Gagal: ' + (result.error || ''));
    } catch (err) { alert('Gagal terhubung ke server'); } finally { toggleLoading(false); }
};

// ==================== FUNGSI OPEN FOLDER ====================
window.openFolder = (type) => {
    let url = '';
    if (type === 'res') url = settingsData.podcastResult || settingsData.res;
    else if (type === 'rev') url = settingsData.podcastRevision || settingsData.rev;
    if (url) window.open(url, '_blank');
    else alert('Folder belum diatur untuk podcast ini');
};

window.handleWaRecipientChange = () => {
    const name = document.getElementById('wa-recipient-select').value;
    const ed = editors.find(e => e.name === name);
    if (ed) {
        document.getElementById('wa-recipient-number').value = ed.wa;
        document.getElementById('wa-custom-message').value = `* ${settingsData.podcastName || settingsData.loginTitle}*\n\nHalo, ${ed.name}!\n\n(Tulis pesan kamu di sini...)`;
    }
};

window.sendCustomWA = async () => {
    const target = document.getElementById('wa-recipient-number').value.trim();
    let msg = document.getElementById('wa-custom-message').value.trim();
    if (!target) { alert('Nomor WA harus diisi!'); return; }
    if (!msg) { alert('Pesan harus diisi!'); return; }
    if (!settingsData.fonteetoken) { alert('Token Fontee belum diisi!'); return; }
    if (!msg.includes('*')) msg = `* ${settingsData.podcastName || settingsData.loginTitle}*\n\n${msg}`;
    toggleLoading(true);
    const success = await sendWABackend(target, msg, 'Custom', '');
    toggleLoading(false);
    if (success) { alert('WhatsApp Terkirim'); closeModal('modalWaCustom'); }
    else alert('Gagal mengirim');
};

window.toggleNote = (id) => {
    const el = document.getElementById(id);
    if (el) {
        el.classList.toggle('expanded');
        const btn = el.nextElementSibling;
        if (btn) btn.innerText = el.classList.contains('expanded') ? 'less' : 'more';
    }
};

// ==================== SELECT ALL / DELETE SELECTED ====================
window.toggleSelectAll = (checked) => {
    document.querySelectorAll('.row-checkbox').forEach(cb => {
        cb.checked = checked;
        const idx = parseInt(cb.dataset.rowindex);
        if (checked) selectedRows.add(idx);
        else selectedRows.delete(idx);
    });
};
window.toggleRowSelection = (rowIndex, checked) => {
    if (checked) selectedRows.add(rowIndex);
    else selectedRows.delete(rowIndex);
    const selectAll = document.getElementById('select-all-checkbox');
    if (selectAll) {
        const total = document.querySelectorAll('.row-checkbox').length;
        const checkedCount = document.querySelectorAll('.row-checkbox:checked').length;
        selectAll.checked = total > 0 && checkedCount === total;
        selectAll.indeterminate = checkedCount > 0 && checkedCount < total;
    }
};
window.deleteSelected = async () => {
    if (selectedRows.size === 0) { alert('Tidak ada project yang dipilih'); return; }
    if (!confirm(`Hapus ${selectedRows.size} project yang dipilih?`)) return;
    toggleLoading(true);
    try {
        const rows = Array.from(selectedRows).sort((a, b) => b - a);
        for (let rowIndex of rows) {
            const formData = new URLSearchParams();
            formData.append('action', 'DELETE');
            formData.append('rowIndex', rowIndex);
            if (currentUser === 'admin') {
                formData.append('auth_token', settingsData.adminPassword);
            }
            await fetch(SCRIPT_URL, { method: 'POST', body: formData });
        }
        selectedRows.clear();
        await refreshData();
        alert('Project terpilih telah dihapus');
    } catch (err) { alert('Gagal menghapus'); console.error(err); } finally { toggleLoading(false); }
};
// Tambah tombol delete selected jika belum ada
(function addDeleteSelectedButton() {
    const adminControls = document.getElementById('admin-controls');
    if (adminControls && !document.getElementById('btn-delete-selected')) {
        const btn = document.createElement('button');
        btn.id = 'btn-delete-selected';
        btn.className = 'btn-main';
        btn.style.background = '#FF3B30';
        btn.innerHTML = '<i class="fa-solid fa-trash"></i> Delete Selected';
        btn.onclick = window.deleteSelected;
        adminControls.appendChild(btn);
    }
})();

// ==================== NOTIFIKASI WA ====================
window.buildAdminToUserMessage = (editorName, projectTitle, subject, host, status, deadline, note, link, linkLabel) => {
    const emoji = { 'To do': '📦', 'In Progress': '⚙️', 'Review': '🔍', 'Revision': '🔄', 'Retake': '🎬', 'Finalized': '✅' }[status] || '📌';
    const formattedDeadline = formatDateDisplay(deadline);
    let msg = `${settingsData.podcastName || settingsData.loginTitle}\n\n` +
        `Hai *${editorName}*! 👋\n\n` +
        `Ada kabar baru nih buat project kamu:\n━━━━━━━━━━━━━━━━\n` +
        `${emoji} *${projectTitle}*\n👤 Narasumber: ${subject || '-'}\n👤 Host: ${host || '-'}\n📊 Status: *${status}*\n📅 Deadline: ${formattedDeadline}\n📝 Catatan: ${note || '-'}`;
    if (status !== 'Finalized' && link) msg += `\n\n🔗 Link ${linkLabel}: ${link}`;
    if (status === 'Finalized') msg += `\n━━━━━━━━━━━━━━━━\nTerima kasih atas kerja kerasnya! 🙏✨`;
    else msg += `\n━━━━━━━━━━━━━━━━\nSemangat terus! 🔥`;
    return msg;
};
window.buildUserToAdminMessage = (editorName, projectTitle, subject, host, status, deadline, note, link, linkLabel) => {
    const emoji = { 'To do': '📦', 'In Progress': '⚙️', 'Review': '🔍', 'Revision': '🔄', 'Retake': '🎬', 'Finalized': '✅' }[status] || '📌';
    const formattedDeadline = formatDateDisplay(deadline);
    let msg = `${settingsData.podcastName || settingsData.loginTitle}\n\n` +
        `Halo Admin! 🙌\n\n` +
        `Dari *${editorName}*:\n━━━━━━━━━━━━━━━━\n` +
        `${emoji} *${projectTitle}*\n👤 Narasumber: ${subject || '-'}\n👤 Host: ${host || '-'}\nUdah ganti status jadi: *${status}*\n📅 Deadline: ${formattedDeadline}\n📝 Catatan: ${note || '-'}`;
    if (status !== 'Finalized' && link) msg += `\n\n🔗 Link ${linkLabel}: ${link}`;
    msg += `\n━━━━━━━━━━━━━━━━\nCek yaa! 👆`;
    return msg;
};

// ==================== PANEL WHATSAPP ====================
const togglePanelBtn = document.getElementById('toggle-wa-panel-btn');
const closePanelBtn = document.getElementById('close-wa-panel');
const waPanel = document.getElementById('wa-panel');
const userNotifToggle = document.getElementById('user-notif-toggle');
const sendDeadlineBtn = document.getElementById('send-deadline-btn');
const sendBroadcastAllBtn = document.getElementById('send-broadcast-all-btn');
const broadcastAllMessage = document.getElementById('broadcast-all-message');
const personalEditorSelect = document.getElementById('personal-editor-select');
const personalMessage = document.getElementById('personal-message');
const sendPersonalBtn = document.getElementById('send-personal-btn');
const waPanelStatus = document.getElementById('wa-panel-status');

function updatePanelStatus(text, isError = false) {
    if (waPanelStatus) {
        waPanelStatus.innerText = text;
        waPanelStatus.style.color = isError ? '#d32f2f' : '#666';
        if (isError) setTimeout(() => { if (waPanelStatus) { waPanelStatus.innerText = 'Siap'; waPanelStatus.style.color = '#666'; } }, 3000);
    }
}

if (togglePanelBtn) togglePanelBtn.addEventListener('click', () => { if (waPanel) waPanel.style.transform = waPanel.style.transform === 'translateX(0px)' ? 'translateX(100%)' : 'translateX(0px)'; });
if (closePanelBtn) closePanelBtn.addEventListener('click', () => { if (waPanel) waPanel.style.transform = 'translateX(100%)'; });

function loadPersonalEditors() {
    if (!personalEditorSelect) return;
    personalEditorSelect.innerHTML = '<option value="">Pilih Editor</option>';
    editors.forEach(editor => {
        if (editor.wa) {
            const option = document.createElement('option');
            option.value = editor.wa;
            option.textContent = `${editor.name} (${editor.wa})`;
            personalEditorSelect.appendChild(option);
        }
    });
}

if (userNotifToggle) {
    userNotifToggle.checked = settingsData.userNotifActive;
    userNotifToggle.addEventListener('change', async function() {
        const active = this.checked;
        const formData = new URLSearchParams();
        formData.append('action', 'UPDATE_USER_NOTIF');
        formData.append('active', active);
        if (currentUser === 'admin') {
            formData.append('auth_token', settingsData.adminPassword);
        }
        try {
            const res = await fetch(SCRIPT_URL, { method: 'POST', body: formData });
            const data = await res.json();
            if (data.success) {
                settingsData.userNotifActive = active;
                updatePanelStatus('Pengaturan tersimpan');
            } else {
                alert('Gagal menyimpan pengaturan');
                this.checked = !active;
            }
        } catch (err) {
            alert('Gagal terhubung ke server');
            this.checked = !active;
        }
    });
}

if (sendDeadlineBtn) {
    sendDeadlineBtn.addEventListener('click', async function() {
        if (!confirm('Kirim notifikasi deadline ke semua editor yang memiliki project deadline dalam 3 hari ke depan?')) return;
        updatePanelStatus('Mengirim...');
        const today = new Date(); today.setHours(0,0,0,0);
        const threeDaysLater = new Date(today); threeDaysLater.setDate(today.getDate() + 3);
        const projectsToNotify = projects.filter(p => {
            if (!p.deadline || p.status === 'Finalized') return false;
            const deadlineDate = new Date(p.deadline); deadlineDate.setHours(0,0,0,0);
            return deadlineDate >= today && deadlineDate <= threeDaysLater;
        });
        if (projectsToNotify.length === 0) { updatePanelStatus('Tidak ada project dengan deadline dalam 3 hari ke depan', true); return; }
        let sentCount = 0;
        for (const project of projectsToNotify) {
            const editor = editors.find(e => e.name === project.editor);
            if (!editor || !editor.wa) continue;
            const deadlineDate = new Date(project.deadline); deadlineDate.setHours(0,0,0,0);
            const diffDays = Math.ceil((deadlineDate - today) / (1000*60*60*24));
            let dayLabel = diffDays === 0 ? 'HARI INI' : `H-${diffDays}`;
            const formattedDeadline = formatDateDisplay(project.deadline);
            const rawLink = project.raw || '(tidak ada)';
            const msg = `*${settingsData.podcastName || settingsData.loginTitle}*\n\nHalo *${editor.name}*,\n\nKamu memiliki project dengan deadline *${dayLabel}*:\n\n📌 *Judul*: ${project.title}\n👤 Narasumber: ${project.subject || '-'}\n🎤 Host: ${project.host || '-'}\n📅 Deadline: ${formattedDeadline}\n🔗 RAW: ${rawLink}\n\nSegera selesaikan tugas kamu! Terima kasih. 🙏`;
            const success = await sendWABackend(editor.wa, msg, project.title, '');
            if (success) sentCount++;
            await new Promise(r => setTimeout(r, 1000));
        }
        updatePanelStatus(`Pesan terkirim untuk ${sentCount} project`);
    });
}

if (sendBroadcastAllBtn) {
    sendBroadcastAllBtn.addEventListener('click', async function() {
        const message = broadcastAllMessage.value.trim();
        if (!message) { alert('Pesan tidak boleh kosong'); return; }
        if (!confirm(`Kirim broadcast ke semua editor (${editors.length})?`)) return;
        updatePanelStatus('Mengirim...');
        const msg = `*${settingsData.podcastName || settingsData.loginTitle}*\n\n${message}`;
        let sentCount = 0;
        for (const editor of editors) {
            if (editor.wa) {
                const success = await sendWABackend(editor.wa, msg, 'Broadcast All', '');
                if (success) sentCount++;
            }
        }
        updatePanelStatus(`Broadcast terkirim ke ${sentCount} editor`);
        broadcastAllMessage.value = '';
    });
}

if (sendPersonalBtn) {
    sendPersonalBtn.addEventListener('click', async function() {
        const target = personalEditorSelect.value;
        const message = personalMessage.value.trim();
        if (!target) { alert('Pilih editor'); return; }
        if (!message) { alert('Pesan tidak boleh kosong'); return; }
        updatePanelStatus('Mengirim...');
        const msg = `*${settingsData.podcastName || settingsData.loginTitle}*\n\n${message}`;
        const success = await sendWABackend(target, msg, 'Personal Chat', '');
        if (success) { updatePanelStatus('Pesan terkirim'); personalMessage.value = ''; }
        else updatePanelStatus('Gagal mengirim', true);
    });
}

const originalSyncDropdowns = syncDropdowns;
window.syncDropdowns = function() {
    originalSyncDropdowns();
    if (currentUser === 'admin') loadPersonalEditors();
};

// ==================== MODAL LEADERBOARD ====================
window.openLeaderboardModal = function() {
    const modal = document.getElementById('modalLeaderboard');
    if (modal) { modal.style.display = 'flex'; loadLeaderboardModal(); }
    else console.error('Modal leaderboard tidak ditemukan');
};
async function loadLeaderboardModal() {
    const tbody = document.getElementById('leaderboard-modal-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;">Memuat...</td></tr>';
    try {
        const res = await fetch(`${SCRIPT_URL}?action=GET_LEADERBOARD&podcast=${podcastId}&nocache=${Date.now()}`);
        const data = await res.json();
        if (!data.success || !data.leaderboard) { tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;">Gagal memuat data</td></tr>'; return; }
        if (data.leaderboard.length === 0) { tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;">Belum ada data skor</td></tr>'; return; }
        let html = '';
        data.leaderboard.forEach((row, idx) => {
            const editorName = escapeHtml(row.editor_name);
            html += `<tr>
                <td data-label="Peringkat">${idx+1}</td>
                <td data-label="Nama Editor">${editorName}</td>
                <td data-label="Total Project">${row.total_projects}</td>
                <td data-label="Tepat Waktu">${row.on_time_projects}</td>
                <td data-label="Hari Terlambat">${row.late_days}</td>
                <td data-label="Revisi">${row.revision_count}</td>
                <td data-label="Retake">${row.retake_count}</td>
                <td data-label="Skor"><strong>${row.score}</strong></td>
                <td data-label="Aksi"><button class="btn-wa" onclick="openChatFromLeaderboard('${editorName}')" title="Kirim WhatsApp"><i class="fa-brands fa-whatsapp"></i></button></td>
            </tr>`;
        });
        tbody.innerHTML = html;
    } catch (err) { console.error('Gagal load leaderboard modal', err); tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;">Error</td></tr>'; }
}
window.openChatFromLeaderboard = function(editorName) {
    const editor = editors.find(e => e.name === editorName);
    if (!editor) { alert('Editor tidak ditemukan'); return; }
    if (!editor.wa) { alert('Nomor WA editor tidak tersedia'); return; }
    const select = document.getElementById('wa-recipient-select');
    if (select) {
        for (let opt of select.options) {
            if (opt.text === editor.name || opt.value === editor.name) { select.value = opt.value; break; }
        }
    }
    document.getElementById('wa-recipient-number').value = editor.wa;
    document.getElementById('wa-custom-message').value = `*${settingsData.podcastName || settingsData.loginTitle}*\n\nHalo, ${editor.name}!\n\n`;
    openModal('modalWaCustom');
};

// ==================== FILTER TABLE SEARCH ====================
window.filterTable = () => { renderTable(); };

// ==================== ONLOAD ====================
window.onload = async () => {
    const sess = localStorage.getItem('podcastSession');
    if (sess) {
        currentUser = sess;
        await refreshData();
        showDashboard();
    } else {
        const loginPage = document.getElementById('login-page');
        if (loginPage) loginPage.style.display = 'flex';
    }
    if (currentUser !== 'admin') {
        const toggleBtn = document.getElementById('toggle-wa-panel-btn');
        if (toggleBtn) toggleBtn.classList.add('hidden');
    }
};

// ==================== TUTUP MODAL SAAT KLIK DI LUAR ====================
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
};
