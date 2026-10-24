// API_BASE_URL and optimizedImage()/videoPoster() come from api.js
const CLOUDINARY_CLOUD = "dlwzq8sbe";
const UPLOAD_PRESET = "himagiri_preset";

const TABS = {
    Photography: { nav: 'nav-photos',   title: 'Manage Photography', accept: 'image/*', multiple: true,  mediaType: 'image',   resource: 'image' },
    Videos:      { nav: 'nav-videos',   title: 'Manage Videos',      accept: 'video/*', multiple: true,  mediaType: 'video',   resource: 'video' },
    Projects:    { nav: 'nav-projects', title: 'Manage Projects',    accept: 'image/*', multiple: false, mediaType: 'project', resource: 'image' },
    About:       { nav: 'nav-about',    title: 'Manage About Photo', accept: 'image/*', multiple: false, mediaType: 'image',   resource: 'image' },
};

let currentTab = 'Photography';
let allMediaData = [];
let editingId = null;

function notify(message, type = 'info', duration = 3500) {
    if (typeof window.showToast === 'function') {
        window.showToast(message, type, duration);
    } else {
        alert(message);
    }
}

// ---------- Session (1 hour, stored in the browser) ----------
// A convenience timer for a single-admin dashboard; it is not verified by the server.
const SESSION_KEY = 'adminSessionExpiry';
const SESSION_DURATION_MS = 60 * 60 * 1000;

function startSession() {
    localStorage.setItem(SESSION_KEY, Date.now() + SESSION_DURATION_MS);
}

function clearSession() {
    localStorage.removeItem(SESSION_KEY);
}

function getSessionMillisLeft() {
    const expiry = parseInt(localStorage.getItem(SESSION_KEY), 10);
    return expiry ? expiry - Date.now() : 0;
}

function logout(message) {
    clearSession();
    window.location.href = 'admin-login.html' + (message ? `?msg=${encodeURIComponent(message)}` : '');
}

function initSessionGuard() {
    if (!document.querySelector('.dashboard-container')) return;

    if (getSessionMillisLeft() <= 0) {
        logout('Your session expired. Please sign in again.');
        return;
    }

    const timerEl = document.getElementById('sessionTimer');
    const timerText = document.getElementById('sessionTimerText');

    function tick() {
        const msLeft = getSessionMillisLeft();
        if (msLeft <= 0) {
            logout('Your session expired. Please sign in again.');
            return;
        }
        const totalSeconds = Math.floor(msLeft / 1000);
        const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
        const seconds = String(totalSeconds % 60).padStart(2, '0');
        timerText.textContent = `${minutes}:${seconds}`;

        timerEl.classList.remove('warning', 'danger');
        if (totalSeconds <= 60) timerEl.classList.add('danger');
        else if (totalSeconds <= 5 * 60) timerEl.classList.add('warning');
    }

    tick();
    setInterval(tick, 1000);

    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        clearSession();
        window.location.href = 'index.html';
    });
}

// ---------- Login ----------
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    const urlMsg = new URLSearchParams(window.location.search).get('msg');
    if (urlMsg) notify(urlMsg, 'info', 5000);

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const submitBtn = loginForm.querySelector('.login-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = 'Checking...';

        try {
            const response = await fetch(`${API_BASE_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                startSession();
                window.location.href = 'admin-dashboard.html';
                return;
            }
            notify('Access denied - invalid credentials.', 'error');
            document.getElementById('password').value = '';
        } catch (err) {
            notify('Could not reach the server. It may be waking up - please try again in a few seconds.', 'error', 5000);
        } finally {
            submitBtn.innerHTML = originalText;
        }
    });
}

function forgotPassword() {
    notify('To reset your password, update ADMIN_PASS in the server .env file and redeploy.', 'info', 6000);
}

// ---------- Dashboard ----------
const uploadForm = document.getElementById('uploadForm');
const formSubmitBtn = document.getElementById('formSubmitBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const fileInput = document.getElementById('mediaFile');
const titleInput = document.getElementById('mediaTitle');

function applyTabUI(tabName) {
    const tab = TABS[tabName];
    currentTab = tabName;

    document.getElementById('page-title').innerText = tab.title;
    Object.entries(TABS).forEach(([name, t]) => {
        document.getElementById(t.nav).classList.toggle('active', name === tabName);
    });

    document.getElementById('projectFields').style.display = tabName === 'Projects' ? 'block' : 'none';
    document.getElementById('titleBox').style.display = tabName === 'About' ? 'none' : 'block';

    fileInput.accept = tab.accept;
    fileInput.multiple = tab.multiple;
    document.getElementById('fileLabel').textContent = tab.multiple ? 'Choose Files (select many at once)' : 'Choose File';
    document.getElementById('fileHint').textContent =
        tabName === 'About' ? 'The new photo replaces the current About photo.'
        : tab.multiple ? 'Hold Ctrl (or Shift) to select many. Title is optional - leave it blank to use file names.'
        : '';

    renderGrid();
}

function startEdit(item) {
    editingId = item._id;
    applyTabUI(item.category);

    titleInput.value = item.title || '';
    if (item.category === 'Projects') {
        document.getElementById('projDesc').value = item.description || '';
        document.getElementById('projTech').value = item.techStack || '';
        document.getElementById('projLive').value = item.liveLink || '';
        document.getElementById('projRepo').value = item.repoLink || '';
        document.getElementById('projFeatured').checked = !!item.featured;
    }

    fileInput.closest('.input-box').style.display = 'none';
    formSubmitBtn.textContent = 'Save Changes';
    cancelEditBtn.style.display = 'inline-block';
    uploadForm.scrollIntoView({ behavior: 'smooth' });
}

function cancelEdit() {
    editingId = null;
    uploadForm.reset();
    fileInput.closest('.input-box').style.display = 'block';
    formSubmitBtn.textContent = 'Upload to Live Site';
    cancelEditBtn.style.display = 'none';
}

function getProjectFields() {
    return {
        description: document.getElementById('projDesc').value,
        techStack: document.getElementById('projTech').value,
        liveLink: document.getElementById('projLive').value,
        repoLink: document.getElementById('projRepo').value,
        featured: document.getElementById('projFeatured').checked,
    };
}

// Phone photos are often 5-10 MB; resize before upload so many files upload quickly
async function compressImage(file) {
    const MAX_SIDE = 2400;
    if (file.size < 600 * 1024 || /gif|svg|png/.test(file.type)) return file;
    try {
        const bitmap = await createImageBitmap(file);
        const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(bitmap.width * scale);
        canvas.height = Math.round(bitmap.height * scale);
        canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
        return blob && blob.size < file.size ? blob : file;
    } catch (err) {
        return file;
    }
}

async function uploadOne(file, title) {
    const tab = TABS[currentTab];
    const body = tab.resource === 'image' ? await compressImage(file) : file;

    const formData = new FormData();
    formData.append('file', body, file.name);
    formData.append('upload_preset', UPLOAD_PRESET);

    const cloudResponse = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/${tab.resource}/upload`, { method: 'POST', body: formData });
    const cloudData = await cloudResponse.json();
    if (!cloudData.secure_url) throw new Error(cloudData.error?.message || 'Cloudinary upload failed');

    const payload = { title, url: cloudData.secure_url, mediaType: tab.mediaType, category: currentTab };
    if (currentTab === 'Projects') Object.assign(payload, getProjectFields());

    const saveResponse = await fetch(`${API_BASE_URL}/api/upload-media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!saveResponse.ok) throw new Error('Saving to the server failed');
}

function titleForFile(file, index, total, baseTitle) {
    if (currentTab === 'About') return 'About Photo';
    if (baseTitle) return total > 1 ? `${baseTitle} ${index + 1}` : baseTitle;
    return file.name.replace(/\.[^.]+$/, '');
}

async function submitEdit(title) {
    if (!title) {
        notify('Please enter a title.', 'error');
        return;
    }
    const payload = { title };
    if (currentTab === 'Projects') Object.assign(payload, getProjectFields());

    const response = await fetch(`${API_BASE_URL}/api/update-media/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Update failed');

    notify('Changes saved!', 'success');
    cancelEdit();
    loadAdminPhotos();
}

async function submitUploads(baseTitle) {
    const tab = TABS[currentTab];
    const files = Array.from(fileInput.files);

    if (!files.length) {
        notify('Please select at least one file.', 'error');
        return;
    }
    if (currentTab === 'Projects' && !baseTitle) {
        notify('Please enter the project name.', 'error');
        return;
    }
    const wrongType = files.filter((f) => !f.type.startsWith(tab.resource));
    if (wrongType.length) {
        notify(`${wrongType.length} selected file(s) are not ${tab.resource}s. Please remove them.`, 'error', 5000);
        return;
    }

    let uploaded = 0;
    const failed = [];
    for (let i = 0; i < files.length; i++) {
        formSubmitBtn.textContent = `Uploading ${i + 1} of ${files.length}...`;
        try {
            await uploadOne(files[i], titleForFile(files[i], i, files.length, baseTitle));
            uploaded++;
        } catch (err) {
            console.error(files[i].name, err);
            failed.push(files[i].name);
        }
    }

    if (failed.length) {
        notify(`${uploaded} uploaded, ${failed.length} failed: ${failed.join(', ')}`, 'error', 7000);
    } else {
        notify(uploaded === 1 ? 'Upload successful!' : `${uploaded} files uploaded successfully!`, 'success');
    }
    uploadForm.reset();
    loadAdminPhotos();
}

if (uploadForm) {
    Object.entries(TABS).forEach(([name, tab]) => {
        document.getElementById(tab.nav).addEventListener('click', () => {
            cancelEdit();
            applyTabUI(name);
        });
    });

    cancelEditBtn.addEventListener('click', cancelEdit);

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        formSubmitBtn.disabled = true;

        try {
            const title = titleInput.value.trim();
            if (editingId) await submitEdit(title);
            else await submitUploads(title);
        } catch (err) {
            notify(err.message, 'error');
        } finally {
            formSubmitBtn.disabled = false;
            formSubmitBtn.textContent = editingId ? 'Save Changes' : 'Upload to Live Site';
        }
    });
}

// ---------- Media grid ----------
async function loadAdminPhotos() {
    const grid = document.querySelector('.preview-grid');
    if (!grid) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/get-media`, { cache: 'no-store' });
        allMediaData = await response.json();
        try { localStorage.removeItem(MEDIA_CACHE_KEY); } catch (e) { /* storage blocked */ }
        renderGrid();
    } catch (error) {
        console.error('Error loading data:', error);
        grid.innerHTML = '<p style="color:#f87171;">Could not load items. The server may be waking up - refresh in a few seconds.</p>';
    }
}

function renderGrid() {
    const grid = document.querySelector('.preview-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const items = allMediaData.filter((item) => item.category === currentTab);
    if (items.length === 0) {
        grid.innerHTML = `<p style="color:#64748b;">No ${currentTab} found.</p>`;
        return;
    }

    items.forEach((item) => {
        const media = item.mediaType === 'video'
            ? `<video src="${item.url}#t=0.1" poster="${videoPoster(item.url, 300)}" preload="metadata" muted playsinline style="width:100%; height:120px; object-fit:cover;"></video>`
            : `<img src="${optimizedImage(item.url, 300)}" loading="lazy" style="width:100%; height:120px; object-fit:cover;">`;

        const card = document.createElement('div');
        card.className = 'preview-item';
        card.innerHTML = `
            ${media}
            <div class="item-info">
                <span>${item.featured ? '<span title="Shown in homepage highlights">⭐</span> ' : ''}${escapeHtml(item.title)}</span>
                <span>
                    ${currentTab === 'About' ? '' : '<button class="edit-btn" title="Edit"><i class="fas fa-pen"></i></button>'}
                    <button class="delete-btn" title="Delete"><i class="fas fa-trash"></i></button>
                </span>
            </div>`;

        const editBtn = card.querySelector('.edit-btn');
        if (editBtn) editBtn.addEventListener('click', () => startEdit(item));
        card.querySelector('.delete-btn').addEventListener('click', () => deleteItem(item._id));
        grid.appendChild(card);
    });
}

async function deleteItem(id) {
    if (!confirm('Delete this?')) return;
    if (editingId === id) cancelEdit();

    try {
        const response = await fetch(`${API_BASE_URL}/api/delete-media/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Delete failed');
        notify('Deleted.', 'success');
    } catch (err) {
        notify(err.message, 'error');
    }
    loadAdminPhotos();
}

document.addEventListener('DOMContentLoaded', () => {
    initSessionGuard();
    if (uploadForm) applyTabUI(currentTab);
    loadAdminPhotos();
});
