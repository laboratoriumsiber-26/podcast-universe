// ==================== KONFIGURASI ====================
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyXQI5sF8ZErj1g2okMCE_KLVi91vljcUBJbcdk2fFhydM5tqzAO_B3H_PIEpC_WxA_Hg/exec';
const urlParams = new URLSearchParams(window.location.search);
const podcastId = urlParams.get('podcast');
if (!podcastId) {
    alert('Podcast tidak dipilih');
    window.location.href = 'index.html';
}

let projects = [];
let editors = [];
let subjects = [];
let activeRowId = null;

// ==================== FUNGSI BANTU ====================
const toggleLoading = (show) => {
    const el = document.getElementById('loading-screen');
    if (el) el.style.display = show ? 'flex' : 'none';
};

const openModal = (id) => {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'flex';
};

const closeModal = (id) => {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'none';
};

window.closeModal = closeModal;
window.openModal = openModal;

const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return isNaN(d) ? dateStr : d.toLocaleDateString('id-ID');
};

const escapeHtml = (unsafe) => {
    if (!unsafe) return '';
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

// ==================== LOAD DATA ====================
async function loadData() {
    toggleLoading(true);
    try {
        const res = await fetch(SCRIPT_URL + '?podcast=' + podcastId + '&t=' + Date.now());
        if (!res.ok) throw new Error('Gagal memuat data');
        const data = await res.json();
        console.log('Data dari backend:', data);

        projects = (data.projects || []).map(p => ({
            id: p.id,
            title: p.title || '',
            subject: p.subject || '',
            host: p.host || '',
            editor: p.editor || '',
            deadline: p.deadline || '',
            status: p.status || '',
            raw: p.raw || '',
            result: p.result || '',
            revision: p.revision || '',
            note: p.note || '',
            timestamp: p.timestamp || p.updated_at || null
        }));

        editors = (data.editors || []).filter(e => e.name && e.name !== 'admin').map(e => e.name);
        subjects = [...new Set((data.subjects || []).filter(Boolean))];

        // Isi datalist narasumber
        const datalist = document.getElementById('narasumberList');
        if (datalist) {
            datalist.innerHTML = '';
            subjects.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s;
                datalist.appendChild(opt);
            });
        }

        // Tampilkan nama podcast
        if (data.podcast) {
            const podcastNameEl = document.getElementById('podcast-name');
            if (podcastNameEl) podcastNameEl.innerText = data.podcast.name;
        }

        // Urutkan projects: yang baru di atas (berdasarkan timestamp, lalu id)
        projects.sort((a, b) => {
            if (a.timestamp && b.timestamp) {
                return new Date(b.timestamp) - new Date(a.timestamp);
            }
            return b.id - a.id;
        });

        renderProjects();
    } catch (err) {
        console.error(err);
        alert('Gagal memuat data. Pastikan URL backend benar.');
    } finally {
        toggleLoading(false);
    }
}

// ==================== RENDER DAFTAR EPISODE ====================
function renderProjects() {
    const container = document.getElementById('projectsList');
    if (!container) return;

    if (!projects.length) {
        container.innerHTML = '<div class="empty-message">Belum ada episode.</div>';
        return;
    }

    let html = '<div class="table-responsive"><table class="episode-table"><thead><tr><th>Judul</th><th>Host</th><th>Narasumber</th><th>Deadline</th><th>Status</th><th>RAW</th><th>Aksi</th></tr></thead><tbody>';
    projects.forEach(p => {
        html += `<tr>
            <td>${escapeHtml(p.title)}</td>
            <td>${escapeHtml(p.host)}</td>
            <td>${escapeHtml(p.subject)}</td>
            <td>${formatDate(p.deadline)}</td>
            <td>${escapeHtml(p.status)}</td>
            <td class="raw-cell">${p.raw ? `<a href="${p.raw}" target="_blank" class="raw-link">🔗</a>` : '-'}</td>
            <td class="action-cell">
                <button class="btn-edit" onclick="openEditModal(${p.id})">Edit</button>
                <button class="btn-delete" onclick="deleteProject(${p.id})">Hapus</button>
            </td>
        </tr>`;
    });
    html += '</tbody></table></div>';
    container.innerHTML = html;
}

// ==================== UPLOAD EPISODE BARU ====================
document.getElementById('uploadForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const title = document.getElementById('title').value.trim();
    const host = document.getElementById('host').value.trim();
    const narasumber = document.getElementById('narasumber').value.trim();
    const rawLink = document.getElementById('rawLink').value.trim();

    if (!title || !host || !narasumber || !rawLink) {
        alert('Semua field harus diisi');
        return;
    }

    toggleLoading(true);
    const formData = new URLSearchParams();
    formData.append('action', 'UPLOAD_RAW');
    formData.append('title', title);
    formData.append('host', host);
    formData.append('narasumber', narasumber);
    formData.append('rawLink', rawLink);
    formData.append('podcastId', podcastId);

    try {
        const res = await fetch(SCRIPT_URL, { method: 'POST', body: formData });
        const result = await res.json();
        if (result.success) {
            document.getElementById('title').value = '';
            document.getElementById('host').value = '';
            document.getElementById('narasumber').value = '';
            document.getElementById('rawLink').value = '';
            await loadData();
            alert('Episode berhasil diupload');
        } else {
            alert('Gagal: ' + (result.error || ''));
        }
    } catch (err) {
        alert('Gagal terhubung ke server');
    } finally {
        toggleLoading(false);
    }
});

// ==================== EDIT EPISODE ====================
window.openEditModal = function(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    document.getElementById('editRowIndex').value = project.id;
    document.getElementById('editTitle').value = project.title || '';
    document.getElementById('editHost').value = project.host || '';
    document.getElementById('editNarasumber').value = project.subject || '';
    document.getElementById('editRaw').value = project.raw || '';
    document.getElementById('editNote').value = project.note || '';

    // Isi datalist narasumber untuk edit
    const datalistEdit = document.getElementById('narasumberListEdit');
    if (datalistEdit) {
        datalistEdit.innerHTML = '';
        subjects.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s;
            datalistEdit.appendChild(opt);
        });
    }

    openModal('editModal');
};

document.getElementById('editForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const id = document.getElementById('editRowIndex').value;
    const title = document.getElementById('editTitle').value.trim();
    const host = document.getElementById('editHost').value.trim();
    const narasumber = document.getElementById('editNarasumber').value.trim();
    const raw = document.getElementById('editRaw').value.trim();
    const note = document.getElementById('editNote').value.trim();

    if (!title || !host || !narasumber) {
        alert('Judul, host, dan narasumber harus diisi');
        return;
    }

    toggleLoading(true);
    const formData = new URLSearchParams();
    formData.append('action', 'UPDATE_STATUS');
    formData.append('rowIndex', id);
    formData.append('title', title);
    formData.append('host', host);
    formData.append('subject', narasumber);
    formData.append('raw', raw);
    formData.append('note', note);

    try {
        const res = await fetch(SCRIPT_URL, { method: 'POST', body: formData });
        const result = await res.json();
        if (result.success) {
            closeModal('editModal');
            await loadData();
            alert('Episode berhasil diperbarui');
        } else {
            alert('Gagal: ' + (result.error || ''));
        }
    } catch (err) {
        alert('Gagal terhubung ke server');
    } finally {
        toggleLoading(false);
    }
});

// ==================== HAPUS EPISODE ====================
window.deleteProject = async function(projectId) {
    if (!confirm('Yakin ingin menghapus episode ini?')) return;

    toggleLoading(true);
    const formData = new URLSearchParams();
    formData.append('action', 'DELETE');
    formData.append('rowIndex', projectId);

    try {
        const res = await fetch(SCRIPT_URL, { method: 'POST', body: formData });
        const result = await res.json();
        if (result.success) {
            await loadData();
            alert('Episode dihapus');
        } else {
            alert('Gagal: ' + (result.error || ''));
        }
    } catch (err) {
        alert('Gagal terhubung ke server');
    } finally {
        toggleLoading(false);
    }
};

// ==================== LOGIN UPLOADER ====================
async function fetchSettings() {
    const res = await fetch(SCRIPT_URL + '?action=GET_SETTINGS&nocache=' + Date.now());
    if (!res.ok) throw new Error('Gagal mengambil settings');
    const data = await res.json();
    if (!data.success) throw new Error('Respons tidak sukses');
    const settings = {};
    (data.settings || []).forEach(row => { if (row[0]) settings[row[0]] = row[1]; });
    return settings;
}

document.getElementById('loginBtn')?.addEventListener('click', async function() {
    const password = document.getElementById('uploaderPassword').value.trim();
    const loginModal = document.getElementById('loginModal');
    const mainContent = document.getElementById('mainContent');
    const loginMessage = document.getElementById('loginMessage');

    if (!password) {
        loginMessage.innerText = 'Password harus diisi';
        return;
    }

    loginMessage.innerText = 'Memeriksa...';
    try {
        const settings = await fetchSettings();
        const validPassword = settings.PASSWORD_UPLOADER || 'upload123';
        if (password === validPassword) {
            loginModal.style.display = 'none';
            mainContent.style.pointerEvents = 'auto';
            mainContent.style.opacity = '1';
            const logoutBtnContainer = document.getElementById('logoutBtnContainer');
            if (logoutBtnContainer) logoutBtnContainer.style.display = 'block';
            await loadData();
            localStorage.setItem('uploaderSession', 'true');
            loginMessage.innerText = '';
        } else {
            loginMessage.innerText = 'Password salah';
        }
    } catch (err) {
        console.error(err);
        loginMessage.innerText = 'Gagal terhubung ke server. Gunakan password default.';
        if (password === 'upload123') {
            loginModal.style.display = 'none';
            mainContent.style.pointerEvents = 'auto';
            mainContent.style.opacity = '1';
            const logoutBtnContainer = document.getElementById('logoutBtnContainer');
            if (logoutBtnContainer) logoutBtnContainer.style.display = 'block';
            await loadData();
            localStorage.setItem('uploaderSession', 'true');
            loginMessage.innerText = '';
        } else {
            loginMessage.innerText = 'Password salah (default: upload123)';
        }
    }
});

document.getElementById('logoutBtn')?.addEventListener('click', function() {
    localStorage.removeItem('uploaderSession');
    location.reload();
});

// ==================== INIT ====================
window.addEventListener('load', function() {
    const session = localStorage.getItem('uploaderSession');
    if (session === 'true') {
        const loginModal = document.getElementById('loginModal');
        const mainContent = document.getElementById('mainContent');
        const logoutBtnContainer = document.getElementById('logoutBtnContainer');
        if (loginModal) loginModal.style.display = 'none';
        if (mainContent) {
            mainContent.style.pointerEvents = 'auto';
            mainContent.style.opacity = '1';
        }
        if (logoutBtnContainer) logoutBtnContainer.style.display = 'block';
        loadData();
    } else {
        const loginModal = document.getElementById('loginModal');
        if (loginModal) loginModal.style.display = 'flex';
    }
});
