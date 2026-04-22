// js/admin.js

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz_pHKl38nOnulo3m80z4aYZ5hcBQ9t9aC7SZ1WVTxvXree4RvR4WCuSuXyVkpSiR9fWQ/exec';
const CACHE_KEY = 'podcastData';
const CACHE_DURATION = 5 * 60 * 1000;

let podcasts = [];
let editors = [];
let settings = {}; // untuk menyimpan settings dari server
let selectedPodcasts = new Set();
let undoStack = [];
let editingId = null; // untuk edit podcast

// ==================== UTILITIES ====================
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe.replace(/[&<>"]/g, m => {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        if (m === '"') return '&quot;';
        return m;
    });
}

function saveToCache(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), data: data }));
    } catch (e) {
        console.warn('Gagal cache', e);
    }
}

// Konversi file ke base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// ==================== LOAD PODCASTS ====================
async function loadPodcasts(forceRefresh = false) {
    const container = document.getElementById('projectCards');
    container.innerHTML = '<div class="loading">Memuat podcast...</div>';

    try {
        let data;
        if (!forceRefresh) {
            try {
                const cached = localStorage.getItem(CACHE_KEY);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (Date.now() - parsed.timestamp < CACHE_DURATION) {
                        data = parsed.data;
                        console.log('Memuat dari cache');
                    } else {
                        localStorage.removeItem(CACHE_KEY);
                    }
                }
            } catch (e) {
                localStorage.removeItem(CACHE_KEY);
            }
        }

        if (!data) {
            const response = await fetch(SCRIPT_URL + '?action=GET_PODCASTS&nocache=' + Date.now());
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const json = await response.json();
            if (json.success === false) throw new Error(json.error);
            data = json; // { podcasts: [...] }
            saveToCache(CACHE_KEY, data);
        }

        podcasts = (data.podcasts || []).sort((a, b) => b.id - a.id);
        renderPodcastCards();
        renderDots();
    } catch (err) {
        console.error(err);
        container.innerHTML = '<div class="empty-message">Gagal memuat data.</div>';
    }
}

// ==================== RENDER CARD DENGAN COVER ====================
function renderPodcastCards() {
    const container = document.getElementById('projectCards');
    if (!podcasts.length) {
        container.innerHTML = '<div class="empty-message">Belum ada podcast.</div>';
        return;
    }

    const fallbackImage = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'225\' viewBox=\'0 0 400 225\'%3E%3Crect width=\'400\' height=\'225\' fill=\'%23dddddd\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' dominant-baseline=\'middle\' text-anchor=\'middle\' font-family=\'Arial\' font-size=\'18\' fill=\'%23333\'%3ENo Cover%3C/text%3E%3C/svg%3E';

    let html = '';
    podcasts.forEach(p => {
        let coverUrl = p.cover_image || p.cover || p.gambar || '';
        if (typeof coverUrl === 'string') coverUrl = coverUrl.trim();
        if (!coverUrl || coverUrl === '' || coverUrl === 'undefined' || coverUrl === 'null') {
            coverUrl = fallbackImage;
        }

        const checked = selectedPodcasts.has(p.id) ? 'checked' : '';

        html += `
            <div class="project-card" data-id="${p.id}">
                <img src="${coverUrl}" 
                     alt="${escapeHtml(p.name)}" 
                     class="cover"
                     onerror="this.onerror=null; this.src='${fallbackImage}';"
                     loading="lazy">
                <div class="card-content">
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
                        <input type="checkbox" class="podcast-checkbox" value="${p.id}" ${checked} onchange="toggleSelectPodcast(${p.id})">
                        <div class="card-title">${escapeHtml(p.name)}</div>
                    </div>
                    <div class="card-desc">${escapeHtml(p.description || '')}</div>
                    <div class="card-actions">
                        <button class="edit-btn" onclick="editPodcast(${p.id})">Edit</button>
                        <button class="delete-btn" onclick="deletePodcast(${p.id})">Hapus</button>
                        <button class="report-btn" onclick="viewReports(${p.id})">Laporan</button>
                    </div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

// ==================== CAROUSEL DOTS ====================
function renderDots() {
    const dotsContainer = document.getElementById('projectDots');
    if (!dotsContainer) return;
    const cards = document.querySelectorAll('.project-card');
    dotsContainer.innerHTML = '';
    if (cards.length === 0) return;

    for (let i = 0; i < cards.length; i++) {
        const dot = document.createElement('span');
        dot.classList.add('dot');
        if (i === 0) dot.classList.add('active');
        dot.addEventListener('click', () => scrollToCard(i));
        dotsContainer.appendChild(dot);
    }

    const container = document.getElementById('projectCards');
    container.addEventListener('scroll', function() {
        const containerRect = this.getBoundingClientRect();
        const cards = this.children;
        for (let i = 0; i < cards.length; i++) {
            const cardRect = cards[i].getBoundingClientRect();
            if (cardRect.left >= containerRect.left && cardRect.left < containerRect.right) {
                document.querySelectorAll('.dot').forEach((d, idx) => d.classList.toggle('active', idx === i));
                break;
            }
        }
    });
}

function scrollToCard(index) {
    const container = document.getElementById('projectCards');
    const cards = container.children;
    if (cards[index]) {
        cards[index].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    }
}

// ==================== SEARCH ====================
function filterPodcasts() {
    const keyword = document.getElementById('projectSearch').value.toLowerCase();
    document.querySelectorAll('.project-card').forEach(card => {
        const title = card.querySelector('.card-title')?.innerText.toLowerCase() || '';
        card.style.display = title.includes(keyword) ? 'block' : 'none';
    });
}

// ==================== SELECT / DELETE ====================
function toggleSelectPodcast(id) {
    if (selectedPodcasts.has(id)) selectedPodcasts.delete(id);
    else selectedPodcasts.add(id);
}

async function deleteSelectedPodcasts() {
    if (selectedPodcasts.size === 0) return alert('Pilih minimal satu podcast.');
    if (!confirm(`Hapus ${selectedPodcasts.size} podcast terpilih?`)) return;

    // Karena backend hanya mendukung hapus per ID, kita loop
    for (const id of selectedPodcasts) {
        await deletePodcastById(id, false); // false = jangan render ulang dulu
    }
    // Hapus dari array lokal
    podcasts = podcasts.filter(p => !selectedPodcasts.has(p.id));
    selectedPodcasts.clear();
    renderPodcastCards();
    renderDots();
    alert('Podcast terpilih telah dihapus.');
}

async function deletePodcast(id) {
    if (!confirm('Hapus podcast ini?')) return;
    await deletePodcastById(id, true);
}

async function deletePodcastById(id, rerender = true) {
    try {
        const formData = new URLSearchParams();
        formData.append('action', 'DELETE_PODCAST');
        formData.append('id', id);

        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        if (rerender) {
            podcasts = podcasts.filter(p => p.id !== id);
            selectedPodcasts.delete(id);
            renderPodcastCards();
            renderDots();
        }
    } catch (err) {
        alert('Gagal menghapus: ' + err.message);
    }
}

function editPodcast(id) {
    const p = podcasts.find(p => p.id === id);
    if (!p) return;
    editingId = id;
    document.getElementById('projectTitle').value = p.name || '';
    document.getElementById('projectDesc').value = p.description || '';
    document.getElementById('addProjectBtn').innerHTML = '<i class="fa-solid fa-pen"></i> Update Podcast';
    document.getElementById('addProjectBtn').onclick = () => updatePodcast(id);
    document.getElementById('cancelEditBtn').style.display = 'inline-block';
}

function cancelEdit() {
    editingId = null;
    document.getElementById('projectTitle').value = '';
    document.getElementById('projectDesc').value = '';
    document.getElementById('filePreview').style.display = 'none';
    document.getElementById('fileName').innerText = '';
    document.getElementById('addProjectBtn').innerHTML = '<i class="fa-solid fa-plus"></i> Tambah Podcast';
    document.getElementById('addProjectBtn').onclick = addOrUpdatePodcast;
    document.getElementById('cancelEditBtn').style.display = 'none';
}

async function addOrUpdatePodcast() {
    if (editingId) {
        await updatePodcast(editingId);
    } else {
        await addPodcast();
    }
}

async function addPodcast() {
    const title = document.getElementById('projectTitle').value.trim();
    const desc = document.getElementById('projectDesc').value.trim();
    if (!title) return alert('Judul harus diisi');

    const fileInput = document.getElementById('fileInput');
    let coverBase64 = '';
    if (fileInput.files.length > 0) {
        try {
            coverBase64 = await fileToBase64(fileInput.files[0]);
        } catch (err) {
            alert('Gagal membaca file cover');
            return;
        }
    }

    const formData = new URLSearchParams();
    formData.append('action', 'CREATE_PODCAST');
    formData.append('name', title);
    formData.append('description', desc);
    formData.append('cover_image', coverBase64);
    formData.append('materialFolder', '');
    formData.append('resultFolder', '');
    formData.append('revisionFolder', '');

    try {
        const response = await fetch(SCRIPT_URL, { method: 'POST', body: formData });
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        alert('Podcast berhasil ditambahkan');
        cancelEdit();
        await loadPodcasts(true); // refresh
    } catch (err) {
        alert('Gagal menambah: ' + err.message);
    }
}

async function updatePodcast(id) {
    const title = document.getElementById('projectTitle').value.trim();
    const desc = document.getElementById('projectDesc').value.trim();
    if (!title) return alert('Judul harus diisi');

    const fileInput = document.getElementById('fileInput');
    let coverBase64 = '';
    if (fileInput.files.length > 0) {
        try {
            coverBase64 = await fileToBase64(fileInput.files[0]);
        } catch (err) {
            alert('Gagal membaca file cover');
            return;
        }
    }

    const formData = new URLSearchParams();
    formData.append('action', 'UPDATE_PODCAST');
    formData.append('id', id);
    formData.append('name', title);
    formData.append('description', desc);
    if (coverBase64) formData.append('cover_image', coverBase64);
    formData.append('materialFolder', '');
    formData.append('resultFolder', '');
    formData.append('revisionFolder', '');

    try {
        const response = await fetch(SCRIPT_URL, { method: 'POST', body: formData });
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        alert('Podcast berhasil diperbarui');
        cancelEdit();
        await loadPodcasts(true);
    } catch (err) {
        alert('Gagal memperbarui: ' + err.message);
    }
}

function viewReports(id) {
    alert(`Fitur laporan untuk podcast ID ${id} akan segera hadir.`);
}

// ==================== UNDO ====================
function undo() {
    if (!undoStack.length) return alert('Tidak ada yang bisa di-undo');
    const last = undoStack.pop();
    if (last.action === 'delete') {
        podcasts = [...podcasts, ...last.items];
        podcasts.sort((a, b) => b.id - a.id);
        renderPodcastCards();
        renderDots();
    }
}

// ==================== MANAJEMEN EDITOR ====================
async function loadEditors() {
    try {
        const response = await fetch(SCRIPT_URL + '?nocache=' + Date.now());
        const data = await response.json();
        // Data berisi { editors: [...] }
        if (data.editors) {
            editors = data.editors.map((e, index) => ({
                id: index + 1, // beri id sementara untuk frontend
                name: e.name,
                wa: e.wa,
                selected: false
            }));
        } else {
            editors = [];
        }
    } catch (err) {
        console.error('Gagal memuat editor:', err);
        editors = [];
    }
    renderEditors();
}

function renderEditors() {
    const listDiv = document.getElementById('editorList');
    if (!listDiv) return;
    if (!editors.length) {
        listDiv.innerHTML = '<div style="padding:10px; text-align:center">Belum ada editor.</div>';
        return;
    }

    let html = '';
    editors.forEach(e => {
        html += `
            <div class="editor-item" data-id="${e.id}">
                <div style="display:flex; align-items:center; gap:10px; width:100%;">
                    <input type="checkbox" ${e.selected ? 'checked' : ''} onchange="toggleSelectEditor(${e.id})">
                    <div class="editor-info">
                        <input type="text" value="${escapeHtml(e.name)}" placeholder="Nama" onchange="updateEditor(${e.id}, 'name', this.value)">
                        <input type="text" value="${escapeHtml(e.wa)}" placeholder="628xxx" onchange="updateEditor(${e.id}, 'wa', this.value)">
                    </div>
                    <button onclick="deleteEditor(${e.id})"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `;
    });
    listDiv.innerHTML = html;
}

function toggleSelectEditor(id) {
    const e = editors.find(e => e.id === id);
    if (e) e.selected = !e.selected;
}

function addEditor() {
    const name = document.getElementById('newEditorName').value.trim();
    const wa = document.getElementById('newEditorWA').value.trim();
    if (!name || !wa) return alert('Nama dan WA harus diisi');
    const newId = editors.length ? Math.max(...editors.map(e => e.id)) + 1 : 1;
    editors.push({ id: newId, name, wa, selected: false });
    renderEditors();
    document.getElementById('newEditorName').value = '';
    document.getElementById('newEditorWA').value = '';
}

function updateEditor(id, field, value) {
    const e = editors.find(e => e.id === id);
    if (e) e[field] = value;
}

function deleteEditor(id) {
    editors = editors.filter(e => e.id !== id);
    renderEditors();
}

function deleteSelectedEditors() {
    const selected = editors.filter(e => e.selected);
    if (!selected.length) return alert('Pilih editor terlebih dahulu.');
    if (!confirm(`Hapus ${selected.length} editor terpilih?`)) return;
    editors = editors.filter(e => !e.selected);
    renderEditors();
}

async function saveEditors() {
    // Kirim ke server dengan action UPDATE_EDITORS
    const editorsToSend = editors.map(e => ({ name: e.name, wa: e.wa }));
    try {
        const formData = new URLSearchParams();
        formData.append('action', 'UPDATE_EDITORS');
        formData.append('editors', JSON.stringify(editorsToSend));

        const response = await fetch(SCRIPT_URL, { method: 'POST', body: formData });
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        alert('Data editor tersimpan di server');
    } catch (err) {
        alert('Gagal menyimpan editor: ' + err.message);
    }
}

// ==================== PENGATURAN WHATSAPP & PASSWORD ====================
async function loadSettings() {
    try {
        const response = await fetch(SCRIPT_URL + '?action=GET_SETTINGS&nocache=' + Date.now());
        const data = await response.json();
        if (!data.success) throw new Error(data.error);
        // data.settings adalah array [key, value]
        const settingMap = {};
        data.settings.forEach(([key, value]) => settingMap[key] = value);

        document.getElementById('adminWA').value = settingMap['ADMIN_WA'] || '';
        document.getElementById('waRevision').value = settingMap['WA_REVISION'] || '';
        document.getElementById('waRetake').value = settingMap['WA_RETAKE'] || '';
        document.getElementById('tokenFontee').value = settingMap['FONTEE_TOKEN'] || '';
        document.getElementById('fonteeEndpoint').value = settingMap['FONTEE_ENDPOINT'] || 'https://api.fontee.com/send-message';
        document.getElementById('countryCode').value = settingMap['COUNTRY_CODE'] || '62';

        document.getElementById('passwordUploader').value = settingMap['PASSWORD_UPLOADER'] || 'upload123';
        document.getElementById('passwordEditor').value = settingMap['PASSWORD_EDITOR'] || 'user123';
        document.getElementById('passwordAdmin').value = settingMap['PASSWORD_ADMIN'] || 'labsiber2026';
        document.getElementById('usernameAdmin').value = settingMap['USERNAME_ADMIN'] || 'admin';
    } catch (err) {
        console.error('Gagal memuat settings:', err);
        // fallback ke localStorage seperti sebelumnya
        document.getElementById('adminWA').value = localStorage.getItem('adminWA') || '';
        document.getElementById('waRevision').value = localStorage.getItem('waRevision') || '';
        document.getElementById('waRetake').value = localStorage.getItem('waRetake') || '';
        document.getElementById('tokenFontee').value = localStorage.getItem('tokenFontee') || '';
        document.getElementById('fonteeEndpoint').value = localStorage.getItem('fonteeEndpoint') || 'https://api.fontee.com/send-message';
        document.getElementById('countryCode').value = localStorage.getItem('countryCode') || '62';

        document.getElementById('passwordUploader').value = localStorage.getItem('passwordUploader') || 'upload123';
        document.getElementById('passwordEditor').value = localStorage.getItem('passwordEditor') || 'user123';
        document.getElementById('passwordAdmin').value = localStorage.getItem('passwordAdmin') || 'labsiber2026';
        document.getElementById('usernameAdmin').value = localStorage.getItem('usernameAdmin') || 'admin';
    }
}

async function saveWhatsApp() {
    const formData = new URLSearchParams();
    formData.append('action', 'UPDATE_WHATSAPP');
    formData.append('adminWA', document.getElementById('adminWA').value);
    formData.append('waRevision', document.getElementById('waRevision').value);
    formData.append('waRetake', document.getElementById('waRetake').value);
    formData.append('tokenFontee', document.getElementById('tokenFontee').value);
    formData.append('fonteeEndpoint', document.getElementById('fonteeEndpoint').value);
    formData.append('countryCode', document.getElementById('countryCode').value);

    try {
        const response = await fetch(SCRIPT_URL, { method: 'POST', body: formData });
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        alert('Pengaturan WhatsApp tersimpan');
    } catch (err) {
        alert('Gagal menyimpan: ' + err.message);
    }
}

async function savePasswords() {
    const formData = new URLSearchParams();
    formData.append('action', 'UPDATE_PASSWORDS');
    formData.append('usernameAdmin', document.getElementById('usernameAdmin').value);
    formData.append('passwordAdmin', document.getElementById('passwordAdmin').value);
    formData.append('passwordUploader', document.getElementById('passwordUploader').value);
    formData.append('passwordEditor', document.getElementById('passwordEditor').value);

    try {
        const response = await fetch(SCRIPT_URL, { method: 'POST', body: formData });
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        alert('Password tersimpan');
    } catch (err) {
        alert('Gagal menyimpan: ' + err.message);
    }
}

// ==================== REFRESH ====================
function refreshData() {
    loadPodcasts(true);
}

// ==================== LOGOUT ====================
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    if (confirm('Logout?')) {
        localStorage.removeItem('superAdmin');
        window.location.href = 'login-admin.html';
    }
});

// ==================== PREVIEW GAMBAR ====================
function previewImage(event) {
    const file = event.target.files[0];
    if (file) {
        document.getElementById('fileName').innerText = file.name;
        document.getElementById('filePreview').style.display = 'flex';
    }
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
    loadPodcasts();
    loadEditors();
    loadSettings();

    document.getElementById('projectSearch')?.addEventListener('input', filterPodcasts);
    document.getElementById('editorSearch')?.addEventListener('input', e => {
        const keyword = e.target.value.toLowerCase();
        document.querySelectorAll('.editor-item').forEach(item => {
            item.style.display = item.innerText.toLowerCase().includes(keyword) ? 'flex' : 'none';
        });
    });

    document.getElementById('fileInput')?.addEventListener('change', previewImage);
});
