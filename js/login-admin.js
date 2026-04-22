// js/login.js

// ==================== KONFIGURASI ====================
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyXQI5sF8ZErj1g2okMCE_KLVi91vljcUBJbcdk2fFhydM5tqzAO_B3H_PIEpC_WxA_Hg/exec';
const SETTINGS_CACHE_KEY = 'adminSettings';
const CACHE_DURATION = 5 * 60 * 1000; // 5 menit

// ==================== FUNGSI MENGAMBIL SETTINGS ====================
async function fetchSettings(forceRefresh = false) {
    // Cek cache terlebih dahulu
    if (!forceRefresh) {
        try {
            const cached = localStorage.getItem(SETTINGS_CACHE_KEY);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Date.now() - parsed.timestamp < CACHE_DURATION) {
                    console.log('Menggunakan cache settings');
                    return parsed.data;
                } else {
                    localStorage.removeItem(SETTINGS_CACHE_KEY);
                }
            }
        } catch (e) {
            localStorage.removeItem(SETTINGS_CACHE_KEY);
        }
    }

    try {
        const res = await fetch(SCRIPT_URL + '?action=GET_SETTINGS&nocache=' + Date.now());
        if (!res.ok) throw new Error('Gagal mengambil data');
        const data = await res.json();
        if (!data.success) throw new Error('Respons tidak sukses');
        const settings = {};
        (data.settings || []).forEach(row => { if (row[0]) settings[row[0]] = row[1]; });

        // Simpan ke cache
        try {
            localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify({
                timestamp: Date.now(),
                data: settings
            }));
        } catch (e) {
            console.warn('Gagal menyimpan cache settings', e);
        }

        return settings;
    } catch (err) {
        console.error('fetchSettings error:', err);
        throw err;
    }
}

// ==================== FUNGSI LOGIN ====================
async function handleLogin() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const rememberMe = document.getElementById('rememberMe')?.checked || false;
    const errorMsg = document.getElementById('errorMsg');
    const loading = document.getElementById('loading');

    if (!username || !password) {
        errorMsg.innerText = 'Username dan password harus diisi';
        return;
    }

    errorMsg.innerText = '';
    loading.style.display = 'flex';

    try {
        const settings = await fetchSettings();
        const validUsername = settings.USERNAME_ADMIN || 'admin';
        const validPassword = settings.PASSWORD_ADMIN || 'labsiber2026';

        if (username === validUsername && password === validPassword) {
            // Tentukan masa berlaku sesi
            let expires;
            if (rememberMe) {
                // 30 hari
                expires = Date.now() + 30 * 24 * 60 * 60 * 1000;
            } else {
                // 8 jam
                expires = Date.now() + 8 * 60 * 60 * 1000;
            }

            const session = {
                username: username,
                loginTime: Date.now(),
                expires: expires
            };
            localStorage.setItem('adminSession', JSON.stringify(session));
            window.location.href = 'admin.html';
        } else {
            errorMsg.innerText = 'Username atau password salah';
        }
    } catch (err) {
        console.error(err);
        errorMsg.innerText = 'Gagal terhubung ke server. Coba lagi.';
    } finally {
        loading.style.display = 'none';
    }
}

// ==================== CEK SESSION SEBELUMNYA ====================
function checkExistingSession() {
    try {
        const session = JSON.parse(localStorage.getItem('adminSession'));
        if (session && session.expires && Date.now() < session.expires) {
            // Session masih berlaku, langsung redirect
            window.location.href = 'admin.html';
        } else {
            // Hapus jika kadaluarsa
            localStorage.removeItem('adminSession');
        }
    } catch (e) {
        localStorage.removeItem('adminSession');
    }
}

// ==================== INISIALISASI ====================
document.addEventListener('DOMContentLoaded', function() {
    // Cek apakah sudah login, jika ya redirect
    checkExistingSession();

    // Pasang event listener
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
    }

    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });
});z
