const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzcz44qSH0lAOzp-CaHOKOKv_IP_1zgoQWMy0AymN2_/dev';
const CACHE_KEY = 'podcastData';
const CACHE_DURATION = 5 * 60 * 1000;

let podcasts = [];

document.getElementById('menuToggle').addEventListener('click', function(e) {
    e.stopPropagation();
    document.getElementById('dropdownMenu').classList.toggle('show');
});
window.addEventListener('click', function(e) {
    if (!e.target.matches('.menu-btn') && !e.target.closest('.menu-btn')) {
        document.getElementById('dropdownMenu').classList.remove('show');
    }
});

window.showUploaderModal = (podcastId) => { window.location.href = `uploader.html?podcast=${podcastId}`; };
window.showEditorModal = (podcastId) => { window.location.href = `dashboard.html?podcast=${podcastId}`; };

function updateGreetingAndTime() {
    const now = new Date();
    const hours = now.getHours();
    let greeting = '';
    if (hours >= 5 && hours < 12) greeting = 'Selamat Pagi';
    else if (hours >= 12 && hours < 15) greeting = 'Selamat Siang';
    else if (hours >= 15 && hours < 18) greeting = 'Selamat Sore';
    else greeting = 'Selamat Malam';
    document.getElementById('greeting').innerText = `${greeting}, PIPD SQUAD`;
    document.getElementById('liveTime').innerText = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    document.getElementById('liveDate').innerText = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
setInterval(updateGreetingAndTime, 1000);
updateGreetingAndTime();

function updateDots(index) {
    document.querySelectorAll('.dot').forEach((dot, i) => dot.classList.toggle('active', i === index));
}
function scrollToCard(index) {
    const container = document.getElementById('podcastList');
    const cards = container.children;
    if (cards[index]) {
        cards[index].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
        updateDots(index);
    }
}
function createDots(count) {
    const dotsContainer = document.getElementById('carouselDots');
    dotsContainer.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const dot = document.createElement('span');
        dot.classList.add('dot');
        if (i === 0) dot.classList.add('active');
        dot.addEventListener('click', () => scrollToCard(i));
        dotsContainer.appendChild(dot);
    }
}

function saveToCache(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), data: data }));
    } catch (e) {
        console.warn('Gagal cache', e);
        if (e.name === 'QuotaExceededError') {
            try {
                localStorage.removeItem(key);
                localStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), data: data }));
            } catch (err) {}
        }
    }
}

async function loadPodcasts(forceRefresh = false) {
    const container = document.getElementById('podcastList');
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
                        console.log('Cache');
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
            data = await response.json();
            saveToCache(CACHE_KEY, data);
        }
        podcasts = (data.podcasts || []).sort((a, b) => b.id - a.id);
        if (!podcasts.length) {
            container.innerHTML = '<div class="empty-message">Belum ada podcast.</div>';
            return;
        }
        let html = '';
        podcasts.forEach(p => {
            // Coba berbagai kemungkinan properti cover
            const coverUrl = p.cover_image || p.cover || p.gambar || '';
            // Fallback gambar base64 jika URL kosong atau error
            const fallbackImage = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'225\' viewBox=\'0 0 400 225\'%3E%3Crect width=\'400\' height=\'225\' fill=\'%23dddddd\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' dominant-baseline=\'middle\' text-anchor=\'middle\' font-family=\'Arial\' font-size=\'18\' fill=\'%23333\'%3ENo Cover%3C/text%3E%3C/svg%3E';
            html += `
                <div class="podcast-card">
                    <img src="${coverUrl || fallbackImage}" alt="${escapeHtml(p.name)}" class="podcast-cover" onerror="this.onerror=null; this.src='${fallbackImage}';">
                    <div class="podcast-content">
                        <h3>${escapeHtml(p.name)}</h3>
                        <p>${escapeHtml(p.description || '')}</p>
                        <div class="podcast-actions">
                            <button class="btn btn-primary" onclick="showUploaderModal(${p.id})">Upload</button>
                            <button class="btn btn-secondary" onclick="showEditorModal(${p.id})">Edit</button>
                        </div>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
        createDots(podcasts.length);
        container.addEventListener('scroll', function() {
            const containerRect = this.getBoundingClientRect();
            const cards = this.children;
            for (let i = 0; i < cards.length; i++) {
                const cardRect = cards[i].getBoundingClientRect();
                if (cardRect.left >= containerRect.left && cardRect.left < containerRect.right) {
                    updateDots(i);
                    break;
                }
            }
        });
    } catch (err) {
        console.error(err);
        container.innerHTML = '<div class="empty-message">Gagal memuat data.</div>';
    }
}

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

loadPodcasts();
// setInterval(() => loadPodcasts(true), CACHE_DURATION); // nonaktifkan auto refresh
