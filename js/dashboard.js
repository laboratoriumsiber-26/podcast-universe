<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
    <title>Podcast Production Suite</title>
    <!-- Font Awesome 6 -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <!-- Chart.js & DataLabels -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.0.0/dist/chartjs-plugin-datalabels.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', Roboto, system-ui, -apple-system, sans-serif;
        }

        body {
            background: #f5f5f7;
            min-height: 100vh;
        }

        /* LOADING SCREEN */
        #loading-screen {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            backdrop-filter: blur(4px);
        }
        .spinner {
            width: 50px;
            height: 50px;
            border: 5px solid #fff;
            border-top: 5px solid #007AFF;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

        /* LOGIN PAGE */
        #login-page {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .login-card {
            background: white;
            padding: 40px 30px;
            border-radius: 32px;
            width: 90%;
            max-width: 400px;
            box-shadow: 0 20px 35px rgba(0,0,0,0.2);
            text-align: center;
        }
        .login-card h2 {
            margin-bottom: 24px;
            color: #1c1c1e;
        }
        .login-card input {
            width: 100%;
            padding: 14px 16px;
            margin: 10px 0;
            border: 1px solid #ccc;
            border-radius: 28px;
            font-size: 16px;
        }
        .btn-main {
            background: #007AFF;
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 30px;
            font-weight: bold;
            cursor: pointer;
            font-size: 16px;
            transition: 0.2s;
        }
        .btn-main:hover { background: #005bbf; transform: scale(0.98); }
        .btn-gray { background: #8E8E93; }
        .btn-gray:hover { background: #6c6c70; }

        /* DASHBOARD LAYOUT */
        .dashboard-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        .top-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 12px;
            margin-bottom: 24px;
            background: white;
            padding: 16px 24px;
            border-radius: 40px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .greeting {
            font-weight: bold;
            font-size: 1.3rem;
        }
        .controls {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
        }
        .filter-bar {
            background: white;
            border-radius: 28px;
            padding: 12px 20px;
            margin-bottom: 20px;
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            align-items: center;
        }
        .filter-bar select, .filter-bar input {
            padding: 8px 16px;
            border-radius: 40px;
            border: 1px solid #ddd;
            background: white;
        }
        table {
            width: 100%;
            background: white;
            border-radius: 24px;
            overflow-x: auto;
            display: block;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        table thead {
            background: #f8f9fc;
        }
        th, td {
            padding: 12px 10px;
            text-align: left;
            border-bottom: 1px solid #eee;
            white-space: nowrap;
        }
        .pill {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 30px;
            font-size: 12px;
            font-weight: bold;
            color: white;
        }
        .pill-revision { background: #FF3B30; }
        .deadline-warning { background-color: #fff1f0; color: #d32f2f; font-weight: bold; border-radius: 20px; }
        .note-cell { max-width: 180px; white-space: normal; word-break: break-word; }
        .note-text { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .note-text.expanded { display: block; }
        .note-more-btn { background: none; border: none; color: #007AFF; cursor: pointer; font-size: 12px; margin-top: 4px; }
        .hidden { display: none; }
        .modal {
            display: none;
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(0,0,0,0.5);
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }
        .modal-content {
            background: white;
            padding: 28px;
            border-radius: 32px;
            width: 90%;
            max-width: 500px;
            max-height: 90vh;
            overflow-y: auto;
        }
        .form-group {
            margin-bottom: 16px;
        }
        .form-group label {
            display: block;
            font-weight: 600;
            margin-bottom: 6px;
        }
        .form-group input, .form-group textarea, .form-group select {
            width: 100%;
            padding: 10px 12px;
            border-radius: 20px;
            border: 1px solid #ccc;
        }
        .list-item-row {
            display: flex;
            gap: 8px;
            margin-bottom: 8px;
            align-items: center;
        }
        /* WA Log Float */
        .wa-log-float {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #25D366;
            color: white;
            border-radius: 50px;
            padding: 12px 18px;
            cursor: pointer;
            z-index: 1100;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            font-weight: bold;
        }
        .wa-log-popup {
            position: fixed;
            bottom: 80px;
            right: 20px;
            width: 400px;
            max-width: 90vw;
            background: white;
            border-radius: 24px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            display: none;
            flex-direction: column;
            z-index: 1101;
            border: 1px solid #ddd;
        }
        .wa-log-header {
            padding: 12px 16px;
            background: #075E54;
            color: white;
            border-radius: 24px 24px 0 0;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
        }
        .wa-log-body {
            max-height: 400px;
            overflow-y: auto;
            padding: 12px;
        }
        .log-table {
            width: 100%;
            font-size: 12px;
        }
        .log-table td { padding: 6px 4px; white-space: normal; }
        .log-success { color: green; font-weight: bold; }
        .log-failed { color: red; }

        /* WA Panel (side) */
        .wa-panel {
            position: fixed;
            top: 0;
            right: 0;
            width: 380px;
            height: 100%;
            background: white;
            box-shadow: -4px 0 20px rgba(0,0,0,0.1);
            transform: translateX(100%);
            transition: transform 0.3s ease;
            z-index: 1200;
            display: flex;
            flex-direction: column;
            padding: 20px;
            overflow-y: auto;
        }
        .wa-panel h3 { margin-bottom: 16px; }
        @media (max-width: 640px) {
            th, td { font-size: 12px; padding: 8px 6px; }
            .controls button { font-size: 12px; padding: 8px 12px; }
        }
        .btn-sm { padding: 4px 10px; font-size: 12px; }
    </style>
</head>
<body>

<div id="loading-screen" style="display:none"><div class="spinner"></div></div>

<!-- LOGIN PAGE -->
<div id="login-page" style="display:flex">
    <div class="login-card">
        <h2 id="login-title">Podcast Production</h2>
        <input type="text" id="username" placeholder="Nama Editor / admin" autocomplete="off">
        <input type="password" id="password" placeholder="Password">
        <button class="btn-main" onclick="handleLogin()">Login</button>
    </div>
</div>

<!-- DASHBOARD PAGE -->
<div id="dashboard-page" style="display:none">
    <div class="dashboard-container">
        <div class="top-bar">
            <span class="greeting" id="greetings"></span>
            <div class="controls" id="admin-controls" class="hidden">
                <button class="btn-main" onclick="openNewProjectModal()"><i class="fa-solid fa-plus"></i> New Project</button>
                <button class="btn-main" onclick="openManagement()"><i class="fa-solid fa-gear"></i> Management</button>
                <button class="btn-main btn-gray" onclick="enterMonitoring()"><i class="fa-solid fa-chart-line"></i> Monitoring</button>
                <button class="btn-main btn-gray" onclick="openLeaderboardModal()"><i class="fa-solid fa-trophy"></i> Leaderboard</button>
            </div>
            <button class="btn-main btn-gray" onclick="handleLogout()"><i class="fa-solid fa-right-from-bracket"></i> Logout</button>
        </div>

        <!-- Filter bar -->
        <div class="filter-bar">
            <select id="f-subject"><option value="">All Narasumber</option></select>
            <select id="f-editor" class="hidden"><option value="">All Editor</option></select>
            <select id="f-status"><option value="">All Status</option></select>
            <div style="flex:1"></div>
            <div id="editor-score-container" style="display:none; background:#e9ecef; padding:6px 14px; border-radius:40px;">
                🎯 Skor: <span id="score-value">0</span>
            </div>
        </div>

        <!-- Table + summary -->
        <div style="display:flex; gap:20px; flex-wrap:wrap; margin-bottom:20px;">
            <div class="stats-card" style="background:white; border-radius:28px; padding:16px 24px; display:flex; gap:24px; flex-wrap:wrap;">
                <div>📹 Total Video: <strong id="sum-video">0</strong></div>
                <div>📖 Narasumber: <strong id="sum-subject">0</strong></div>
                <div>✍️ Editor: <strong id="sum-editor">0</strong></div>
                <div>⚠️ Deadline ≤3hr: <strong id="sum-deadline-warning">0</strong></div>
            </div>
            <div style="margin-left:auto;">
                <button id="toggle-wa-panel-btn" class="btn-main btn-gray hidden"><i class="fa-brands fa-whatsapp"></i> WA Panel</button>
                <button id="admin-wa-custom-btn" class="btn-main btn-gray hidden" onclick="openModal('modalWaCustom')"><i class="fa-regular fa-paper-plane"></i> Custom WA</button>
            </div>
        </div>

        <!-- Tabel -->
        <div style="overflow-x: auto;">
            <table>
                <thead>
                    <tr>
                        <th style="width:30px"><input type="checkbox" id="select-all-checkbox" onclick="toggleSelectAll(this.checked)"></th>
                        <th>Title</th><th>Narasumber</th><th>Host</th><th>Editor</th><th>Deadline</th><th>Status</th><th>RAW</th><th>Res</th><th>Rev</th><th>Note</th><th>Action</th>
                    </tr>
                </thead>
                <tbody id="main-table-body"></tbody>
            </table>
        </div>
    </div>
</div>

<!-- MONITORING PAGE -->
<div id="monitoring-page" style="display:none">
    <div class="dashboard-container">
        <div class="top-bar"><h2 id="monitoring-title-text">Monitoring</h2><button class="btn-main" onclick="backToLogin()">Kembali ke Dashboard</button></div>
        <div class="filter-bar">
            <select id="mon-f-subject"></select><select id="mon-f-editor"></select><select id="mon-f-status"></select>
            <button class="btn-main btn-gray" onclick="renderMonitoringTable()">Filter</button>
        </div>
        <div style="overflow-x:auto"><table><thead><tr><th>Title</th><th>Narasumber</th><th>Host</th><th>Editor</th><th>Deadline</th><th>Status</th><th>RAW</th><th>Res</th><th>Rev</th><th>Note</th></tr></thead><tbody id="monitoring-table-body"></tbody></table></div>
    </div>
</div>

<!-- MODALS -->
<div id="modalNewProject" class="modal"><div class="modal-content"><h3>New Episode</h3>
    <div class="form-group"><label>Title</label><input id="n-title"></div>
    <div class="form-group"><label>Narasumber</label><select id="n-subject"></select></div>
    <div class="form-group"><label>Host</label><input id="n-host"></div>
    <div class="form-group"><label>Editor</label><select id="n-editor"></select></div>
    <div class="form-group"><label>Deadline</label><input type="date" id="n-deadline"></div>
    <div class="form-group"><label>RAW (link)</label><input id="n-raw" placeholder="https://..."></div>
    <button class="btn-main" onclick="saveNewProject()">Save</button><button class="btn-gray btn-main" onclick="closeModal('modalNewProject')">Cancel</button>
</div></div>

<div id="modalAction" class="modal"><div class="modal-content"><h3>Edit Project</h3>
    <div class="form-group"><label>Title</label><input id="a-title"></div>
    <div class="form-group"><label>Narasumber</label><select id="a-subject"></select></div>
    <div class="form-group"><label>Host</label><input id="a-host"></div>
    <div class="form-group"><label>Deadline</label><input type="date" id="a-deadline"></div>
    <div class="form-group"><label>Editor</label><select id="a-change-editor"></select></div>
    <div class="form-group"><label>Status</label><select id="a-status" onchange="handleStatusChange()"></select></div>
    <div class="form-group" id="admin-action-area"><label>Result (link)</label><input id="a-result"><label>Revision (link)</label><input id="a-revision"></div>
    <div id="editor-action-area" class="hidden"></div>
    <div class="form-group"><label>Note</label><textarea id="a-note" rows="2"></textarea></div>
    <div style="display:flex; gap:10px;"><button class="btn-main" onclick="saveAction()">Save</button><button class="btn-gray btn-main" onclick="deleteProject()">Delete</button><button class="btn-gray btn-main" onclick="closeModal('modalAction')">Close</button></div>
</div></div>

<div id="modalManagement" class="modal"><div class="modal-content" style="max-width:700px"><h3>Management</h3>
    <div class="form-group"><label>Global Material Folder</label><input id="m-global"></div>
    <div class="form-group"><label>Result Folder</label><input id="m-result"></div>
    <div class="form-group"><label>Revision Folder</label><input id="m-rev"></div>
    <div class="form-group"><label>WA Review (nomor dipisah koma)</label><input id="m-wa-review"></div>
    <div class="form-group"><label>WA Retake (nomor)</label><input id="m-wa-retake"></div>
    <div class="form-group"><label>Admin WA (nomor)</label><input id="m-admin-wa"></div>
    <div class="form-group"><label>Fontee Token</label><input id="m-fontee-token"></div>
    <div class="form-group"><label>Fontee Endpoint</label><input id="m-fontee-endpoint"></div>
    <div class="form-group"><label>Country Code</label><input id="m-country-code"></div>
    <hr><h4>Editors</h4><div id="m-editor-list"></div><div style="display:flex; gap:6px"><input id="m-new-editor-name" placeholder="Nama"><input id="m-new-editor-wa" placeholder="WA"><button onclick="addEditor()">+</button></div>
    <hr><h4>Narasumber</h4><div id="m-subject-list"></div><div><input id="m-new-subject" placeholder="Narasumber"><button onclick="addSubject()">+</button></div>
    <button class="btn-main" onclick="saveManagement()">Save All</button><button class="btn-gray btn-main" onclick="closeModal('modalManagement')">Close</button>
</div></div>

<div id="modalWaCustom" class="modal"><div class="modal-content"><h3>Kirim WA Custom</h3>
    <div class="form-group"><label>Pilih Editor</label><select id="wa-recipient-select" onchange="handleWaRecipientChange()"><option value="">-- Pilih --</option></select></div>
    <div class="form-group"><label>Nomor WA (62xxx)</label><input id="wa-recipient-number"></div>
    <div class="form-group"><label>Pesan</label><textarea id="wa-custom-message" rows="5"></textarea></div>
    <button class="btn-main" onclick="sendCustomWA()">Kirim</button><button class="btn-gray btn-main" onclick="closeModal('modalWaCustom')">Batal</button>
</div></div>

<div id="modalLeaderboard" class="modal"><div class="modal-content" style="max-width:900px"><h3><i class="fa-solid fa-trophy"></i> Leaderboard Editor</h3>
    <div style="overflow-x:auto"><table><thead><tr><th>Peringkat</th><th>Editor</th><th>Total Project</th><th>Tepat Waktu</th><th>Hari Terlambat</th><th>Revisi</th><th>Retake</th><th>Skor</th><th>WA</th></tr></thead><tbody id="leaderboard-modal-body"></tbody></table></div>
    <button class="btn-main btn-gray" onclick="closeModal('modalLeaderboard')">Tutup</button>
</div></div>

<!-- WA Log Floating -->
<div id="waLogFloat" class="wa-log-float hidden" onclick="toggleLogPopup()"><i class="fa-brands fa-whatsapp"></i> Log <span id="waLogBadge">0</span></div>
<div id="waLogPopup" class="wa-log-popup"><div class="wa-log-header">Riwayat WA <span style="cursor:pointer" onclick="toggleLogPopup()">✕</span></div><div id="waLogBody" class="wa-log-body"></div></div>

<!-- WA Panel Side -->
<div id="wa-panel" class="wa-panel"><h3><i class="fa-brands fa-whatsapp"></i> WhatsApp Tools</h3>
    <div class="form-group"><label>🔔 Notifikasi ke Editor</label><input type="checkbox" id="user-notif-toggle"> Aktifkan notifikasi WA ke editor</div>
    <button id="send-deadline-btn" class="btn-main btn-gray">⏰ Kirim Deadline (H-3)</button>
    <div class="form-group"><label>📢 Broadcast All</label><textarea id="broadcast-all-message" rows="3" placeholder="Pesan untuk semua editor..."></textarea><button id="send-broadcast-all-btn" class="btn-main">Kirim Broadcast</button></div>
    <div id="wa-panel-status" style="margin-top:12px; font-size:12px; color:#666;">Siap</div>
    <button class="btn-gray btn-main" id="close-wa-panel" style="margin-top:16px;">Tutup Panel</button>
</div>

<script>
// ==================== GLOBAL VARIABLES ====================
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzhZrDLlOT9dnoZaBxjmH1w-Pr5Ud4j-WSip6CDtBRROBQshs95u9iGRdtMattMk8vL/exec';
const urlParams = new URLSearchParams(window.location.search);
const podcastId = urlParams.get('podcast');
if (!podcastId) { alert('Podcast tidak dipilih'); window.location.href = 'index.html'; }

let currentUser = null;
let projects = [];
let editors = [];
let subjects = [];
let settingsData = {
    global: '', res: '', rev: '', waRev: '', waRet: '', adminWa: '',
    fonteetoken: '', fonteeEndpoint: 'https://api.fontee.com/send-message',
    countryCode: '62', loginTitle: ' Podcast', adminUsername: 'admin',
    adminPassword: 'labsiber2026', userPassword: 'user123', podcastName: '',
    userNotifActive: true, podcastMaterial: '', podcastResult: '', podcastRevision: ''
};
let myChart = null;
let activeRowIndex = null;
let whatsappLogs = [];
let selectedRows = new Set();

// Helper functions
function escapeHtml(unsafe) { if(!unsafe) return ''; return String(unsafe).replace(/[&<>]/g, function(m){if(m==='&') return '&amp;'; if(m==='<') return '&lt;'; if(m==='>') return '&gt;'; return m;}); }
function formatDateDisplay(d) { if(!d) return '-'; let date = new Date(d); return isNaN(date) ? d : date.toLocaleDateString('id-ID'); }
function formatDateForInput(d) { if(!d) return ''; let date = new Date(d); return isNaN(date) ? '' : date.toISOString().split('T')[0]; }
function normalizeStatus(s) { let str = String(s||'').toLowerCase().trim(); if(str==='to do'||str==='todo') return 'To do'; if(str==='in progress'||str==='progress') return 'In Progress'; if(str==='review') return 'Review'; if(str==='revision'||str==='revisi') return 'Revision'; if(str==='retake') return 'Retake'; if(str==='finalized'||str==='final'||str==='done') return 'Finalized'; return 'To do'; }
function getStatusColor(s) { const map = { 'Finalized':'#34C759','In Progress':'#FFCC00','To do':'#007AFF','Review':'#5856D6','Revision':'#FF3B30','Retake':'#E67E22' }; return map[s]||'#8E8E93'; }
function isNearDeadline(p) { if(p.status==='Finalized') return false; let days = Math.ceil((new Date(p.deadline)-new Date())/86400000); return p.deadline && days<=3 && days>=0; }
const toggleLoading = (show) => document.getElementById('loading-screen').style.display = show?'flex':'none';
const openModal = (id) => document.getElementById(id).style.display = 'flex';
const closeModal = (id) => document.getElementById(id).style.display = 'none';
window.openModal = openModal; window.closeModal = closeModal;

// WA Log
function addWALog(recipient, projectTitle, status, message, success=true) {
    let ts = new Date().toLocaleString('id-ID',{hour12:false});
    whatsappLogs.unshift({timestamp:ts, recipient, projectTitle:projectTitle||'-', status:status||'-', message:message.length>50?message.substring(0,50)+'...':message, success});
    if(whatsappLogs.length>100) whatsappLogs.pop();
    updateWABadge(); renderWAPopup();
}
function updateWABadge() { let badge=document.getElementById('waLogBadge'); if(badge) badge.innerText=whatsappLogs.length; }
function renderWAPopup() { let body=document.getElementById('waLogBody'); if(!body) return; if(!whatsappLogs.length){ body.innerHTML='<div style="text-align:center;padding:20px;">Belum ada aktivitas</div>'; return; }
    let html='<table class="log-table"><thead><tr><th>Waktu</th><th>Penerima</th><th>Project</th><th>Status</th><th>Pesan</th><th>Hasil</th></tr></thead><tbody>';
    whatsappLogs.forEach(l=>{ html+=`<tr><td>${l.timestamp}</td><td>${l.recipient}</td><td>${l.projectTitle}</td><td>${l.status}</td><td>${l.message}</td><td class="${l.success?'log-success':'log-failed'}">${l.success?'✓':'✗'}</td></tr>`; });
    html+='</tbody></table>'; body.innerHTML=html;
}
window.toggleLogPopup = () => { let pop=document.getElementById('waLogPopup'); if(pop) pop.style.display=pop.style.display==='flex'?'none':'flex'; if(pop.style.display==='flex') renderWAPopup(); };

// Kirim WA via backend
async function sendWABackend(target, msg, projectTitle='', status='') {
    if(!target) { addWALog('(no number)', projectTitle, status, msg.substring(0,50), false); return false; }
    let editorNumbers = editors.map(e=>e.wa).filter(Boolean);
    let isEditor = editorNumbers.includes(target);
    if(isEditor && !settingsData.userNotifActive) { addWALog(target, projectTitle, status, 'Notifikasi user nonaktif', false); return false; }
    let formData = new URLSearchParams(); formData.append('action','SEND_WA_NOTIFICATION'); formData.append('targetNumber',target); formData.append('customMessage',msg);
    try{
        let res = await fetch(SCRIPT_URL, {method:'POST', body:formData});
        let data = await res.json();
        let success = data.success===true;
        let recipient = editors.find(e=>e.wa===target)?.name || target;
        addWALog(recipient, projectTitle, status, msg.substring(0,50), success);
        return success;
    }catch(err){ addWALog(target, projectTitle, status, msg.substring(0,50), false); return false; }
}
window.sendWABackend = sendWABackend;

// Load data from backend
async function refreshData() {
    toggleLoading(true); selectedRows.clear();
    try{
        let res = await fetch(SCRIPT_URL+'?podcast='+podcastId+'&t='+Date.now());
        let data = await res.json();
        projects = (data.projects||[]).map(p=>({ id:p.id, title:p.title||'', subject:p.subject||p.Narasumber||'', host:p.host||'', editor:p.editor||'', deadline:p.deadline||'', status:normalizeStatus(p.status||p.Status||''), raw:p.raw||p.RAW||'', result:p.result||p.Result||'', revision:p.revision||p.Revision||'', note:p.note||p.Note||'', timestamp:p.timestamp||'', rowIndex:p.id }));
        editors = (data.editors||[]).filter(e=>e.name&&e.name!=='admin').map(e=>({ name:String(e.name).trim(), wa:String(e.wa||'').trim() }));
        subjects = [...new Set((data.subjects||[]).map(s=>String(s).trim()).filter(Boolean))];
        let sets = data.settings||[];
        sets.forEach(r=>{ if(r.length<2) return; let k=r[0],v=r[1];
            if(k==='GLOBAL_MATERIAL') settingsData.global=v; else if(k==='FOLDER_RESULT') settingsData.res=v; else if(k==='FOLDER_REVISION') settingsData.rev=v;
            else if(k==='WA_REVISION') settingsData.waRev=v; else if(k==='WA_RETAKE') settingsData.waRet=v; else if(k==='ADMIN_WA') settingsData.adminWa=v;
            else if(k==='FONTEE_TOKEN') settingsData.fonteetoken=v; else if(k==='FONTEE_ENDPOINT') settingsData.fonteeEndpoint=v;
            else if(k==='COUNTRY_CODE') settingsData.countryCode=v; else if(k==='LOGIN_TITLE') settingsData.loginTitle=v;
            else if(k==='ADMIN_USERNAME') settingsData.adminUsername=v; else if(k==='ADMIN_PASSWORD') settingsData.adminPassword=v;
            else if(k==='USER_PASSWORD') settingsData.userPassword=v; else if(k==='USER_NOTIF_ACTIVE') settingsData.userNotifActive=(v==='true'||v==='1');
        });
        if(data.podcast){ settingsData.podcastName=data.podcast.name; settingsData.podcastMaterial=data.podcast.material_folder||''; settingsData.podcastResult=data.podcast.result_folder||''; settingsData.podcastRevision=data.podcast.revision_folder||''; }
        else { settingsData.podcastName=settingsData.loginTitle; settingsData.podcastMaterial=settingsData.global; settingsData.podcastResult=settingsData.res; settingsData.podcastRevision=settingsData.rev; }
        document.getElementById('sum-editor').innerText=editors.length;
        document.getElementById('sum-subject').innerText=subjects.length;
        document.getElementById('sum-video').innerText=projects.length;
        updateAllTitles();
        syncDropdowns();
        renderTable();
        if(document.getElementById('monitoring-page').style.display==='block') refreshMonitoringPage();
        if(currentUser==='admin') document.getElementById('waLogFloat').classList.remove('hidden');
        else document.getElementById('waLogFloat').classList.add('hidden');
    }catch(e){ console.error(e); alert('Gagal memuat data'); } finally { toggleLoading(false); }
}
function updateAllTitles(){ let title=settingsData.podcastName||settingsData.loginTitle; document.title=title+' - Production Suite'; document.getElementById('login-title').innerText=title; document.getElementById('dashboard-title').innerText=title+' - Production Suite'; document.getElementById('monitoring-title-text').innerText='Monitoring '+title; }
function syncDropdowns(){
    let subj=document.getElementById('f-subject'); if(subj){ let opts='<option value="">All Narasumber</option>'; let relevant=currentUser==='admin'?subjects:[...new Set(projects.filter(p=>p.editor===currentUser).map(p=>p.subject).filter(Boolean))]; relevant.forEach(s=>{if(s) opts+=`<option value="${s}">${s}</option>`;}); subj.innerHTML=opts; }
    let sts=document.getElementById('f-status'); if(sts) sts.innerHTML='<option value="">All Status</option>'+['To do','In Progress','Review','Revision','Retake','Finalized'].map(s=>`<option value="${s}">${s}</option>`).join('');
    let nSubj=document.getElementById('n-subject'); if(nSubj) nSubj.innerHTML=subjects.map(s=>`<option value="${s}">${s}</option>`).join('');
    let nEd=document.getElementById('n-editor'); if(nEd) nEd.innerHTML=editors.map(e=>`<option value="${e.name}">${e.name}</option>`).join('');
    if(currentUser==='admin'){ let ed=document.getElementById('f-editor'); if(ed){ ed.innerHTML='<option value="">All Editor</option>'+editors.map(e=>`<option value="${e.name}">${e.name}</option>`).join(''); ed.classList.remove('hidden'); }
        let waSel=document.getElementById('wa-recipient-select'); if(waSel) waSel.innerHTML='<option value="">-- Pilih Editor --</option>'+editors.map(e=>`<option value="${e.name}">${e.name}</option>`).join('');
    } else { let ed=document.getElementById('f-editor'); if(ed) ed.classList.add('hidden'); }
}
window.syncDropdowns = syncDropdowns;

// RENDER TABLE with result & revision icons
function renderTable() {
    let fSub = document.getElementById('f-subject')?.value||'', fEd = (currentUser==='admin')?document.getElementById('f-editor')?.value||'':'', fSt = document.getElementById('f-status')?.value||'';
    let filtered = projects.map(p=>({...p, displayStatus:normalizeStatus(p.status)}));
    if(currentUser!=='admin') filtered = filtered.filter(p=>p.editor===currentUser);
    filtered = filtered.filter(p=>(!fSub||p.subject===fSub) && (!fEd||p.editor===fEd) && (!fSt||p.displayStatus===fSt));
    filtered.sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));
    let tbody = document.getElementById('main-table-body');
    if(!filtered.length){ tbody.innerHTML='<tr><td colspan="12" style="text-align:center;">Belum ada project</td></tr>'; updateStatsAndChart([]); return; }
    let html='';
    filtered.forEach(p=>{
        let deadlineClass = isNearDeadline(p)?'deadline-warning':'';
        let checked = selectedRows.has(p.rowIndex)?'checked':'';
        html+=`<tr>
            <td style="text-align:center;"><input type="checkbox" class="row-checkbox" data-rowindex="${p.rowIndex}" ${checked} onclick="toggleRowSelection(${p.rowIndex}, this.checked)"></td>
            <td><b>${escapeHtml(p.title)}</b></td>
            <td>${escapeHtml(p.subject)}</td><td>${escapeHtml(p.host)}</td><td>${escapeHtml(p.editor)}</td>
            <td class="${deadlineClass}">${formatDateDisplay(p.deadline)}</td>
            <td><span class="pill" style="background:${getStatusColor(p.displayStatus)}">${p.displayStatus}</span></td>
            <td>${p.raw?`<a href="${escapeHtml(p.raw)}" target="_blank" class="btn-main btn-gray" style="padding:5px"><i class="fa-solid fa-link"></i></a>`:'-'}</td>
            <td>${p.result?`<a href="${escapeHtml(p.result)}" target="_blank" class="btn-main btn-gray" style="padding:5px"><i class="fa-solid fa-play"></i></a>`:'-'}</td>
            <td>${p.revision?`<a href="${escapeHtml(p.revision)}" target="_blank" class="btn-main btn-gray" style="padding:5px"><i class="fa-solid fa-rotate"></i></a>`:'-'}</td>
            <td class="note-cell">${p.note?`<div id="note-${p.rowIndex}" class="note-text">${escapeHtml(p.note)}</div><button class="note-more-btn" onclick="toggleNote('note-${p.rowIndex}')">more</button>`:'-'}</td>
            <td><button class="btn-main btn-gray" onclick="openAction(${p.rowIndex})">Edit</button></td>
        </tr>`;
    });
    tbody.innerHTML=html;
    let selectAll = document.getElementById('select-all-checkbox');
    if(selectAll){ let total=document.querySelectorAll('.row-checkbox').length, checkedCount=document.querySelectorAll('.row-checkbox:checked').length; selectAll.checked=total>0&&checkedCount===total; selectAll.indeterminate=checkedCount>0&&checkedCount<total; }
    let nearCount=filtered.filter(isNearDeadline).length;
    document.getElementById('sum-deadline-warning').innerText=nearCount;
    updateStatsAndChart(filtered);
}
function updateStatsAndChart(data){ let todo=data.filter(x=>x.displayStatus==='To do').length, prog=data.filter(x=>x.displayStatus==='In Progress').length, rev=data.filter(x=>x.displayStatus==='Review').length, revis=data.filter(x=>x.displayStatus==='Revision').length, ret=data.filter(x=>x.displayStatus==='Retake').length, fin=data.filter(x=>x.displayStatus==='Finalized').length;
    document.getElementById('stat-todo').innerText=todo; document.getElementById('stat-progress').innerText=prog; document.getElementById('stat-review').innerText=rev; document.getElementById('stat-revision').innerText=revis; document.getElementById('stat-retake').innerText=ret; document.getElementById('stat-final').innerText=fin;
    let total=data.length||1; let percent=Math.round((fin/total)*100); document.getElementById('center-percent').innerText=percent+'%';
    if(myChart) myChart.destroy(); let ctx=document.getElementById('statusChart')?.getContext('2d'); if(ctx){ myChart=new Chart(ctx,{type:'doughnut',data:{labels:['To do','In Progress','Review','Revision','Retake','Finalized'],datasets:[{data:[todo,prog,rev,revis,ret,fin],backgroundColor:['#007AFF','#FFCC00','#5856D6','#FF3B30','#E67E22','#34C759'],borderWidth:0}]},options:{cutout:'70%',plugins:{legend:{display:false},datalabels:{display:(ctx)=>ctx.dataset.data[ctx.dataIndex]>0,backgroundColor:(ctx)=>ctx.dataset.backgroundColor[ctx.dataIndex],borderRadius:4,color:'white',font:{weight:'bold',size:10},formatter:(val,ctx)=>{let total=ctx.dataset.data.reduce((a,b)=>a+b,0); return total?Math.round((val/total)*100)+'%':'0%';}}}}}}); }

// MODAL ACTION dengan field result/revision untuk semua role
window.openAction = function(idx){
    activeRowIndex = idx;
    let p = projects.find(x=>x.rowIndex===idx);
    if(!p) return;
    document.getElementById('a-title').value = p.title||'';
    document.getElementById('a-deadline').value = formatDateForInput(p.deadline);
    document.getElementById('a-result').value = p.result||'';
    document.getElementById('a-revision').value = p.revision||'';
    document.getElementById('a-note').value = p.note||'';
    let subj = document.getElementById('a-subject'); subj.innerHTML = subjects.map(s=>`<option value="${s}">${s}</option>`).join(''); subj.value = p.subject||'';
    document.getElementById('a-host').value = p.host||'';
    let edSel = document.getElementById('a-change-editor'); edSel.innerHTML = editors.map(e=>`<option value="${e.name}">${e.name}</option>`).join('');
    if(editors.some(e=>e.name===p.editor)) edSel.value = p.editor; else edSel.value = p.editor;
    let sts = document.getElementById('a-status');
    if(currentUser==='admin'){
        document.getElementById('admin-action-area').classList.remove('hidden');
        document.getElementById('editor-action-area').classList.add('hidden');
        sts.innerHTML = ['To do','In Progress','Review','Revision','Retake','Finalized'].map(s=>`<option value="${s}">${s}</option>`).join('');
        document.getElementById('a-title').disabled=false; document.getElementById('a-deadline').disabled=false; document.getElementById('a-note').disabled=false; edSel.disabled=false; document.getElementById('a-subject').disabled=false; document.getElementById('a-host').disabled=false;
    } else {
        document.getElementById('admin-action-area').classList.add('hidden');
        document.getElementById('editor-action-area').classList.remove('hidden');
        // Tampilkan form untuk editor (Result & Revision bisa diisi)
        document.getElementById('editor-action-area').innerHTML = `
            <div class="form-group"><label>Result (link)</label><input type="text" id="a-result" placeholder="https://..." value="${escapeHtml(p.result||'')}"></div>
            <div class="form-group"><label>Revision (link)</label><input type="text" id="a-revision" placeholder="https://..." value="${escapeHtml(p.revision||'')}"></div>
            <div class="form-group"><label>Note</label><textarea id="a-note" rows="3">${escapeHtml(p.note||'')}</textarea></div>
            <button class="btn-main" style="width:100%" onclick="window.saveAction()">Save</button>
        `;
        sts.innerHTML = ['To do','In Progress','Review','Retake'].map(s=>`<option value="${s}">${s}</option>`).join('');
        document.getElementById('a-title').disabled=true; document.getElementById('a-deadline').disabled=true; edSel.disabled=true; document.getElementById('a-subject').disabled=true; document.getElementById('a-host').disabled=true;
    }
    sts.value = p.status;
    handleStatusChange();
    openModal('modalAction');
};
window.handleStatusChange = function(){
    let st = document.getElementById('a-status').value;
    let note = document.getElementById('a-note');
    let needed = (st==='Retake'||st==='Revision');
    if(note) { note.disabled = !needed; note.placeholder = needed?'Wajib diisi':''; note.style.backgroundColor = needed?'#fff':'#f2f2f7'; if(!needed) note.value=''; }
};

window.saveAction = async function(){
    toggleLoading(true);
    try{
        let st = document.getElementById('a-status').value;
        let note = document.getElementById('a-note').value;
        if((st==='Retake'||st==='Revision') && !note.trim()){ alert('Note wajib diisi'); toggleLoading(false); return; }
        let selectedEditor = currentUser==='admin' ? document.getElementById('a-change-editor').value : projects.find(p=>p.rowIndex===activeRowIndex)?.editor;
        if(!selectedEditor){ alert('Editor tidak valid'); toggleLoading(false); return; }
        let formData = new URLSearchParams();
        formData.append('action','UPDATE_STATUS');
        formData.append('rowIndex', activeRowIndex);
        formData.append('status', st);
        formData.append('note', note);
        formData.append('editor', selectedEditor);
        formData.append('result', document.getElementById('a-result').value);
        formData.append('revision', document.getElementById('a-revision').value);
        formData.append('deadline', document.getElementById('a-deadline').value);
        if(currentUser==='admin'){
            formData.append('title', document.getElementById('a-title').value);
            formData.append('subject', document.getElementById('a-subject').value);
            formData.append('host', document.getElementById('a-host').value);
        }
        let res = await fetch(SCRIPT_URL, {method:'POST', body:formData});
        let result = await res.json();
        if(result.success){
            closeModal('modalAction');
            await refreshData();
            alert('Berhasil update!');
        } else alert('Gagal: '+ (result.error||''));
    } catch(err){ alert('Error server'); } finally { toggleLoading(false); }
};
window.deleteProject = async function(){ if(!confirm('Hapus project?')) return; toggleLoading(true); let fd=new URLSearchParams(); fd.append('action','DELETE'); fd.append('rowIndex',activeRowIndex); let res=await fetch(SCRIPT_URL,{method:'POST',body:fd}); let data=await res.json(); if(data.success){ closeModal('modalAction'); await refreshData(); alert('Dihapus'); } else alert('Gagal'); toggleLoading(false); };
window.toggleSelectAll = (c)=> { document.querySelectorAll('.row-checkbox').forEach(cb=>{ cb.checked=c; let idx=parseInt(cb.dataset.rowindex); if(c) selectedRows.add(idx); else selectedRows.delete(idx); }); };
window.toggleRowSelection = (idx,checked)=> { if(checked) selectedRows.add(idx); else selectedRows.delete(idx); let sa=document.getElementById('select-all-checkbox'); if(sa){ let total=document.querySelectorAll('.row-checkbox').length, chk=document.querySelectorAll('.row-checkbox:checked').length; sa.checked=total>0&&chk===total; sa.indeterminate=chk>0&&chk<total; } };
window.deleteSelected = async function(){ if(selectedRows.size===0) return alert('Pilih project'); if(!confirm(`Hapus ${selectedRows.size} project?`)) return; toggleLoading(true); for(let idx of selectedRows){ let fd=new URLSearchParams(); fd.append('action','DELETE'); fd.append('rowIndex',idx); await fetch(SCRIPT_URL,{method:'POST',body:fd}); } selectedRows.clear(); await refreshData(); alert('Terhapus'); toggleLoading(false); };
window.openManagement = async ()=>{ /* sama seperti kode sebelumnya */ openModal('modalManagement'); renderMgmtLists(); };
function renderMgmtLists(){ document.getElementById('m-editor-list').innerHTML=editors.map((e,i)=>`<div class="list-item-row"><input type="text" value="${e.name}" onchange="editors[${i}].name=this.value"><input type="text" value="${e.wa}" onchange="editors[${i}].wa=this.value"><i class="fa-solid fa-trash" style="color:red;cursor:pointer" onclick="editors.splice(${i},1);renderMgmtLists()"></i></div>`).join(''); document.getElementById('m-subject-list').innerHTML=subjects.map((s,i)=>`<div class="list-item-row"><input type="text" value="${s}" onchange="subjects[${i}]=this.value"><i class="fa-solid fa-trash" style="color:red;cursor:pointer" onclick="subjects.splice(${i},1);renderMgmtLists()"></i></div>`).join(''); }
window.addEditor = ()=>{ let n=document.getElementById('m-new-editor-name').value.trim(), w=document.getElementById('m-new-editor-wa').value.trim(); if(!n||!w) return alert('Isi nama dan WA'); if(editors.some(e=>e.name.toLowerCase()===n.toLowerCase())) return alert('Sudah ada'); editors.push({name:n,wa:w}); document.getElementById('m-new-editor-name').value=''; document.getElementById('m-new-editor-wa').value=''; renderMgmtLists(); };
window.addSubject = ()=>{ let s=document.getElementById('m-new-subject').value.trim(); if(!s) return; if(subjects.includes(s)) return alert('Sudah ada'); subjects.push(s); document.getElementById('m-new-subject').value=''; renderMgmtLists(); };
window.saveManagement = async ()=>{ let fd=new URLSearchParams(); fd.append('action','FULL_SETTING_UPDATE'); fd.append('global',document.getElementById('m-global').value); fd.append('res',document.getElementById('m-result').value); fd.append('rev',document.getElementById('m-rev').value); fd.append('waRev',document.getElementById('m-wa-review').value); fd.append('waRet',document.getElementById('m-wa-retake').value); fd.append('adminWa',document.getElementById('m-admin-wa').value); fd.append('FONTEE_TOKEN',document.getElementById('m-fontee-token').value); fd.append('fonteeEndpoint',document.getElementById('m-fontee-endpoint').value); fd.append('countryCode',document.getElementById('m-country-code').value); fd.append('editors',JSON.stringify(editors)); fd.append('subjects',JSON.stringify(subjects)); toggleLoading(true); let res=await fetch(SCRIPT_URL,{method:'POST',body:fd}); let data=await res.json(); if(data.success){ closeModal('modalManagement'); await refreshData(); alert('Saved'); } else alert('Gagal'); toggleLoading(false); };
window.enterMonitoring = async ()=>{ document.getElementById('dashboard-page').style.display='none'; document.getElementById('monitoring-page').style.display='block'; if(!projects.length) await refreshData(); refreshMonitoringPage(); };
window.refreshMonitoringPage = ()=>{ document.getElementById('mon-sum-editor').innerText=editors.length; document.getElementById('mon-sum-subject').innerText=subjects.length; document.getElementById('mon-sum-video').innerText=projects.length; let monSub=document.getElementById('mon-f-subject'); if(monSub) monSub.innerHTML='<option value="">All Narasumber</option>'+subjects.map(s=>`<option value="${s}">${s}</option>`).join(''); let monEd=document.getElementById('mon-f-editor'); if(monEd) monEd.innerHTML='<option value="">All Editor</option>'+editors.map(e=>`<option value="${e.name}">${e.name}</option>`).join(''); let monSt=document.getElementById('mon-f-status'); if(monSt) monSt.innerHTML='<option value="">All Status</option>'+['To do','In Progress','Review','Revision','Retake','Finalized'].map(s=>`<option value="${s}">${s}</option>`).join(''); renderMonitoringTable(); };
window.renderMonitoringTable = ()=>{ let fSub=document.getElementById('mon-f-subject')?.value||'', fEd=document.getElementById('mon-f-editor')?.value||'', fSt=document.getElementById('mon-f-status')?.value||''; let filtered=projects.filter(p=>(!fSub||p.subject===fSub)&&(!fEd||p.editor===fEd)&&(!fSt||normalizeStatus(p.status)===fSt)); filtered.sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp)); let tbody=document.getElementById('monitoring-table-body'); if(!filtered.length){ tbody.innerHTML='<tr><td colspan="10">Tidak ada data</td></tr>'; return; } let html=''; filtered.forEach(p=>{ html+=`<tr><td>${escapeHtml(p.title)}</td><td>${escapeHtml(p.subject)}</td><td>${escapeHtml(p.host)}</td><td>${escapeHtml(p.editor)}</td><td>${formatDateDisplay(p.deadline)}</td><td><span class="pill" style="background:${getStatusColor(normalizeStatus(p.status))}">${normalizeStatus(p.status)}</span></td><td>${p.raw?'🔗':'-'}</td><td>${p.result?'▶️':'-'}</td><td>${p.revision?'🔄':'-'}</td><td>${p.note?p.note.substring(0,30):'-'}</td></tr>`; }); tbody.innerHTML=html; };
window.handleLogin = async function(){ let u=document.getElementById('username').value.trim().toLowerCase(), p=document.getElementById('password').value; if(u===settingsData.adminUsername.toLowerCase() && p===settingsData.adminPassword) currentUser='admin'; else if(p===settingsData.userPassword) currentUser=u; else return alert('Username/password salah'); localStorage.setItem('podcastSession',currentUser); await refreshData(); document.getElementById('login-page').style.display='none'; document.getElementById('dashboard-page').style.display='block'; document.getElementById('greetings').innerText='Halo, '+(currentUser==='admin'?'Admin':currentUser.toUpperCase()); if(currentUser==='admin'){ document.getElementById('admin-controls').classList.remove('hidden'); document.getElementById('admin-wa-custom-btn').classList.remove('hidden'); document.getElementById('f-editor').classList.remove('hidden'); document.getElementById('waLogFloat').classList.remove('hidden'); document.getElementById('toggle-wa-panel-btn').classList.remove('hidden'); } else { document.getElementById('admin-controls').classList.add('hidden'); document.getElementById('admin-wa-custom-btn').classList.add('hidden'); document.getElementById('f-editor').classList.add('hidden'); document.getElementById('waLogFloat').classList.add('hidden'); document.getElementById('toggle-wa-panel-btn').classList.add('hidden'); document.getElementById('editor-score-container').style.display='block'; loadEditorScore(currentUser); } };
async function loadEditorScore(editorName){ try{ let res=await fetch(`${SCRIPT_URL}?action=GET_EDITOR_SCORE&editor=${encodeURIComponent(editorName)}&podcast=${podcastId}`); let data=await res.json(); document.getElementById('score-value').innerText=data.success?data.score:0; }catch(e){ document.getElementById('score-value').innerText='0'; } }
window.handleLogout = ()=>{ localStorage.removeItem('podcastSession'); location.reload(); };
window.backToLogin = ()=>{ document.getElementById('monitoring-page').style.display='none'; document.getElementById('dashboard-page').style.display='none'; document.getElementById('login-page').style.display='flex'; };
window.openNewProjectModal = ()=>{ let today=new Date(); let deadline=new Date(today); deadline.setDate(today.getDate()+5); document.getElementById('n-deadline').value=deadline.toISOString().split('T')[0]; openModal('modalNewProject'); };
window.saveNewProject = async ()=>{ let title=document.getElementById('n-title').value.trim(), subject=document.getElementById('n-subject').value, host=document.getElementById('n-host').value.trim(), editor=document.getElementById('n-editor').value, deadline=document.getElementById('n-deadline').value, raw=document.getElementById('n-raw').value.trim(); if(!title||!subject||!host||!editor||!deadline||!raw){ alert('Semua field harus diisi'); return; } toggleLoading(true); let fd=new URLSearchParams(); fd.append('action','CREATE'); fd.append('title',title); fd.append('subject',subject); fd.append('host',host); fd.append('editor',editor); fd.append('deadline',deadline); fd.append('raw',raw); fd.append('podcastId',podcastId); let res=await fetch(SCRIPT_URL,{method:'POST',body:fd}); let data=await res.json(); if(data.success){ closeModal('modalNewProject'); await refreshData(); alert('Berhasil!'); } else alert('Gagal'); toggleLoading(false); };
window.handleWaRecipientChange = ()=>{ let name=document.getElementById('wa-recipient-select').value; let ed=editors.find(e=>e.name===name); if(ed){ document.getElementById('wa-recipient-number').value=ed.wa; document.getElementById('wa-custom-message').value=`*${settingsData.podcastName||settingsData.loginTitle}*\n\nHalo, ${ed.name}!\n\n`; } };
window.sendCustomWA = async ()=>{ let target=document.getElementById('wa-recipient-number').value.trim(), msg=document.getElementById('wa-custom-message').value.trim(); if(!target||!msg) return alert('Lengkapi data'); if(!settingsData.fonteetoken) return alert('Token Fontee belum diisi'); if(!msg.includes('*')) msg=`*${settingsData.podcastName||settingsData.loginTitle}*\n\n${msg}`; toggleLoading(true); let success=await sendWABackend(target,msg,'Custom',''); toggleLoading(false); if(success){ alert('Terkirim'); closeModal('modalWaCustom'); } else alert('Gagal kirim'); };
window.toggleNote = (id)=>{ let el=document.getElementById(id); if(el){ el.classList.toggle('expanded'); el.nextElementSibling.innerText=el.classList.contains('expanded')?'less':'more'; } };
window.openLeaderboardModal = async ()=>{ openModal('modalLeaderboard'); let tbody=document.getElementById('leaderboard-modal-body'); tbody.innerHTML='<tr><td colspan="9">Memuat...</td></tr>'; try{ let res=await fetch(`${SCRIPT_URL}?action=GET_LEADERBOARD&podcast=${podcastId}`); let data=await res.json(); if(data.success && data.leaderboard.length){ let html=''; data.leaderboard.forEach((row,idx)=>{ html+=`<tr><td>${idx+1}</td><td>${escapeHtml(row.editor_name)}</td><td>${row.total_projects}</td><td>${row.on_time_projects}</td><td>${row.late_days}</td><td>${row.revision_count}</td><td>${row.retake_count}</td><td><strong>${row.score}</strong></td><td><button class="btn-main btn-sm" onclick="openChatFromLeaderboard('${row.editor_name}')"><i class="fa-brands fa-whatsapp"></i></button></td></tr>`; }); tbody.innerHTML=html; } else tbody.innerHTML='<tr><td colspan="9">Tidak ada data</td></tr>'; }catch(e){ tbody.innerHTML='<tr><td colspan="9">Error</td></tr>'; } };
window.openChatFromLeaderboard = (name)=>{ let editor=editors.find(e=>e.name===name); if(!editor||!editor.wa) return alert('Nomor WA tidak tersedia'); document.getElementById('wa-recipient-select').value=editor.name; document.getElementById('wa-recipient-number').value=editor.wa; document.getElementById('wa-custom-message').value=`*${settingsData.podcastName||settingsData.loginTitle}*\n\nHalo, ${editor.name}!\n\n`; openModal('modalWaCustom'); };
// WA Panel events
document.getElementById('toggle-wa-panel-btn')?.addEventListener('click',()=>{ let p=document.getElementById('wa-panel'); p.style.transform=p.style.transform==='translateX(0px)'?'translateX(100%)':'translateX(0px)'; });
document.getElementById('close-wa-panel')?.addEventListener('click',()=>{ document.getElementById('wa-panel').style.transform='translateX(100%)'; });
document.getElementById('user-notif-toggle')?.addEventListener('change',async function(){ let active=this.checked; let fd=new URLSearchParams(); fd.append('action','UPDATE_USER_NOTIF'); fd.append('active',active); let res=await fetch(SCRIPT_URL,{method:'POST',body:fd}); let data=await res.json(); if(data.success) settingsData.userNotifActive=active; else this.checked=!active; });
document.getElementById('send-deadline-btn')?.addEventListener('click',async function(){ let projectsToNotify=projects.filter(p=>p.deadline&&p.status!=='Finalized'&&(new Date(p.deadline)-new Date())/(86400000)<=3 && (new Date(p.deadline)-new Date())>=0); if(!projectsToNotify.length){ alert('Tidak ada deadline mendekat'); return; } let sent=0; for(let p of projectsToNotify){ let editor=editors.find(e=>e.name===p.editor); if(editor&&editor.wa){ let msg=`*${settingsData.podcastName}*\n\nHalo ${editor.name}, deadline project "${p.title}" pada ${formatDateDisplay(p.deadline)}. Segera selesaikan!`; let ok=await sendWABackend(editor.wa,msg,p.title,''); if(ok) sent++; await new Promise(r=>setTimeout(r,500)); } } alert(`Terkirim ke ${sent} editor`); });
document.getElementById('send-broadcast-all-btn')?.addEventListener('click',async function(){ let msg=document.getElementById('broadcast-all-message').value.trim(); if(!msg) return alert('Pesan kosong'); if(!confirm(`Kirim ke ${editors.length} editor?`)) return; let sent=0; for(let ed of editors){ if(ed.wa){ let fullMsg=`*${settingsData.podcastName}*\n\n${msg}`; let ok=await sendWABackend(ed.wa,fullMsg,'Broadcast',''); if(ok) sent++; await new Promise(r=>setTimeout(r,500)); } } alert(`Broadcast terkirim ke ${sent} editor`); document.getElementById('broadcast-all-message').value=''; });
window.onload = async ()=>{ let sess=localStorage.getItem('podcastSession'); if(sess){ currentUser=sess; await refreshData(); document.getElementById('login-page').style.display='none'; document.getElementById('dashboard-page').style.display='block'; document.getElementById('greetings').innerText='Halo, '+(currentUser==='admin'?'Admin':currentUser.toUpperCase()); if(currentUser==='admin'){ document.getElementById('admin-controls').classList.remove('hidden'); document.getElementById('admin-wa-custom-btn').classList.remove('hidden'); document.getElementById('f-editor').classList.remove('hidden'); document.getElementById('waLogFloat').classList.remove('hidden'); document.getElementById('toggle-wa-panel-btn').classList.remove('hidden'); } else { document.getElementById('admin-controls').classList.add('hidden'); document.getElementById('admin-wa-custom-btn').classList.add('hidden'); document.getElementById('f-editor').classList.add('hidden'); document.getElementById('waLogFloat').classList.add('hidden'); document.getElementById('toggle-wa-panel-btn').classList.add('hidden'); document.getElementById('editor-score-container').style.display='block'; loadEditorScore(currentUser); } } else document.getElementById('login-page').style.display='flex'; };
window.onclick = function(e){ if(e.target.classList.contains('modal')) e.target.style.display='none'; };
// tambahan tombol delete selected
(function addDeleteSelectedButton(){ let adminDiv=document.getElementById('admin-controls'); if(adminDiv && !document.getElementById('btn-delete-selected')){ let btn=document.createElement('button'); btn.id='btn-delete-selected'; btn.className='btn-main'; btn.style.background='#FF3B30'; btn.innerHTML='<i class="fa-solid fa-trash"></i> Delete Selected'; btn.onclick=window.deleteSelected; adminDiv.appendChild(btn); }})();
</script>
</body>
</html>
