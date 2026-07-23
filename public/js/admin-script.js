// --- Global Variables ---
let currentTab = 'Photography';
let allMediaData = [];
let editingId = null; // set while editing an existing item, null while adding new

// --- API Base URL ---
// Frontend (Vercel) and backend (Render) are separate services/domains now,
// so every request must point at the full Render URL explicitly.
const API_BASE_URL = "https://himagiri-portfolio.onrender.com";

// --- Notify helper ---
// Wraps showToast() (from toast.js) with a safe fallback. If toast.js ever
// fails to load for some reason, the admin still sees a message instead of
// the action silently doing nothing.
function notify(message, type = 'info', duration = 3500) {
    if (typeof window.showToast === 'function') {
        window.showToast(message, type, duration);
    } else {
        alert(message);
    }
}

// =====================================================================
// SESSION HANDLING (1 hour, client-side)
// A logged-in admin stays in for 1 hour, shown as a live countdown at the
// top of the dashboard. After 1 hour (or on Logout) they're sent back to
// the login page. This is a lightweight convenience timer, not a
// server-verified session - fine for a single-admin personal dashboard.
// =====================================================================
const SESSION_KEY = 'adminSessionExpiry';
const SESSION_DURATION_MS = 60 * 60 * 1000; // 1 hour

function startSession() {
    localStorage.setItem(SESSION_KEY, Date.now() + SESSION_DURATION_MS);
}

function clearSession() {
    localStorage.removeItem(SESSION_KEY);
}

function getSessionMillisLeft() {
    const expiry = parseInt(localStorage.getItem(SESSION_KEY), 10);
    if (!expiry) return 0;
    return expiry - Date.now();
}

function logout(message) {
    clearSession();
    window.location.href = 'admin-login.html' + (message ? `?msg=${encodeURIComponent(message)}` : '');
}

function initSessionGuard() {
    // Only runs on the dashboard page
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

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            clearSession();
            window.location.href = 'index.html';
        });
    }
}

// --- 1. Login Logic (verified on the server, not hardcoded here) ---
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    // If redirected here after a session expiry / logout with a message
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
                return; // don't restore the button text - we're navigating away
            } else {
                notify('Access denied - invalid credentials.', 'error');
                document.getElementById('password').value = '';
            }
        } catch (err) {
            notify('Could not reach the server. Please try again.', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
        }
    });
}

// --- 2. Forgot Password ---
// A real reset flow (email link, etc.) needs the backend. For now this just
// tells the admin to update ADMIN_PASS in the server's .env file directly -
// it no longer reveals the password in plain text on the page.
function forgotPassword() {
    notify('To reset your password, update ADMIN_PASS in the server .env file and redeploy.', 'info', 6000);
}

// --- 3. Dashboard Tabs Logic ---
if (document.querySelector('.dashboard-container')) {
    const navPhotos = document.getElementById('nav-photos');
    const navVideos = document.getElementById('nav-videos');
    const navProjects = document.getElementById('nav-projects');
    const pageTitle = document.getElementById('page-title');
    const projectFields = document.getElementById('projectFields');

    function switchTab(tabName, title) {
        currentTab = tabName;
        pageTitle.innerText = title;

        navPhotos.classList.remove('active');
        navVideos.classList.remove('active');
        navProjects.classList.remove('active');

        if (tabName === 'Photography') navPhotos.classList.add('active');
        if (tabName === 'Videos') navVideos.classList.add('active');
        if (tabName === 'Projects') navProjects.classList.add('active');

        projectFields.style.display = tabName === 'Projects' ? 'block' : 'none';

        renderGrid();
    }

    navPhotos.addEventListener('click', () => { cancelEdit(); switchTab('Photography', 'Manage Photography'); });
    navVideos.addEventListener('click', () => { cancelEdit(); switchTab('Videos', 'Manage Videos'); });
    navProjects.addEventListener('click', () => { cancelEdit(); switchTab('Projects', 'Manage Projects'); });
}

// --- 4. Upload / Update Logic ---
// While editingId is null, submitting the form creates a new item
// (uploads the file to Cloudinary first). While editingId is set, submitting
// only updates the text fields of that existing item - no new file needed.
const uploadForm = document.getElementById('uploadForm');
const formSubmitBtn = document.getElementById('formSubmitBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const fileInput = document.getElementById('mediaFile');

function startEdit(item) {
    editingId = item._id;

    // Make sure we're on the right tab so the right fields are visible
    const tabToTitle = { Photography: 'Manage Photography', Videos: 'Manage Videos', Projects: 'Manage Projects' };
    currentTab = item.category;
    document.getElementById('page-title').innerText = tabToTitle[item.category] || item.category;
    document.getElementById('nav-photos').classList.toggle('active', item.category === 'Photography');
    document.getElementById('nav-videos').classList.toggle('active', item.category === 'Videos');
    document.getElementById('nav-projects').classList.toggle('active', item.category === 'Projects');
    document.getElementById('projectFields').style.display = item.category === 'Projects' ? 'block' : 'none';

    document.getElementById('mediaTitle').value = item.title || '';
    if (item.category === 'Projects') {
        document.getElementById('projDesc').value = item.description || '';
        document.getElementById('projTech').value = item.techStack || '';
        document.getElementById('projLive').value = item.liveLink || '';
        document.getElementById('projRepo').value = item.repoLink || '';
        document.getElementById('projFeatured').checked = !!item.featured;
    }

    // Editing metadata only - no new file required
    fileInput.required = false;
    fileInput.parentElement.style.display = 'none';

    formSubmitBtn.textContent = 'Update Project';
    cancelEditBtn.style.display = 'inline-block';

    uploadForm.scrollIntoView({ behavior: 'smooth' });
}

function cancelEdit() {
    editingId = null;
    uploadForm.reset();
    fileInput.required = true;
    fileInput.parentElement.style.display = 'block';
    formSubmitBtn.textContent = 'Upload to Live Site';
    cancelEditBtn.style.display = 'none';
}

if (cancelEditBtn) cancelEditBtn.addEventListener('click', cancelEdit);

if (uploadForm) {
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const originalText = formSubmitBtn.innerHTML;
        const titleInput = document.getElementById('mediaTitle');

        // --- EDIT MODE: just update the text fields, no file involved ---
        if (editingId) {
            formSubmitBtn.innerHTML = 'Updating... ⏳';
            try {
                const payload = { title: titleInput.value };
                if (currentTab === 'Projects') {
                    payload.description = document.getElementById('projDesc').value;
                    payload.techStack = document.getElementById('projTech').value;
                    payload.liveLink = document.getElementById('projLive').value;
                    payload.repoLink = document.getElementById('projRepo').value;
                    payload.featured = document.getElementById('projFeatured').checked;
                }

                await fetch(`${API_BASE_URL}/api/update-media/${editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                notify('Project updated!', 'success');
                cancelEdit();
                loadAdminPhotos();
            } catch (err) {
                notify('Update failed: ' + err.message, 'error');
            } finally {
                formSubmitBtn.innerHTML = originalText;
            }
            return;
        }

        // --- CREATE MODE: upload file to Cloudinary, then save metadata ---
        formSubmitBtn.innerHTML = 'Uploading... ⏳';
        const file = fileInput.files[0];

        if (!file) {
            notify('Please select a file first.', 'error');
            formSubmitBtn.innerHTML = originalText;
            return;
        }

        let type = 'image';
        if (file.type.includes('video')) type = 'video';
        if (currentTab === 'Projects') type = 'project';

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'himagiri_preset');

        try {
            const cloudUrl = `https://api.cloudinary.com/v1_1/dlwzq8sbe/${type === 'video' ? 'video' : 'image'}/upload`;
            const cloudResponse = await fetch(cloudUrl, { method: 'POST', body: formData });
            const cloudData = await cloudResponse.json();

            if (!cloudData.secure_url) {
                throw new Error('Cloudinary upload failed');
            }

            const payload = {
                title: titleInput.value,
                url: cloudData.secure_url,
                mediaType: type,
                category: currentTab,
            };

            if (currentTab === 'Projects') {
                payload.description = document.getElementById('projDesc').value;
                payload.techStack = document.getElementById('projTech').value;
                payload.liveLink = document.getElementById('projLive').value;
                payload.repoLink = document.getElementById('projRepo').value;
                payload.featured = document.getElementById('projFeatured').checked;
            }

            await fetch(`${API_BASE_URL}/api/upload-media`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            notify('Upload successful!', 'success');
            uploadForm.reset();
            loadAdminPhotos();
        } catch (err) {
            notify('Upload failed: ' + err.message, 'error');
        } finally {
            formSubmitBtn.innerHTML = originalText;
        }
    });
}

// --- 5. Fetch & Render Media Grid ---
async function loadAdminPhotos() {
    const grid = document.querySelector('.preview-grid');
    if (!grid) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/get-media`);
        allMediaData = await response.json();
        renderGrid();
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

function renderGrid() {
    const grid = document.querySelector('.preview-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const filteredData = allMediaData.filter((item) => item.category === currentTab);

    if (filteredData.length === 0) {
        grid.innerHTML = `<p style="color:#64748b;">No ${currentTab} found.</p>`;
        return;
    }

    filteredData.forEach((item) => {
        let mediaEl = `<img src="${item.url}" style="width:100%; height:120px; object-fit:cover;">`;
        if (item.mediaType === 'video') {
            mediaEl = `<video src="${item.url}" style="width:100%; height:120px; object-fit:cover;"></video>`;
        }

        const featuredBadge = item.featured ? '<span title="Shown in homepage highlights">⭐</span>' : '';
        const card = document.createElement('div');
        card.className = 'preview-item';
        card.innerHTML = `
            ${mediaEl}
            <div class="item-info">
                <span>${featuredBadge} ${item.title}</span>
                <span>
                    <button class="edit-btn" title="Edit"><i class="fas fa-pen"></i></button>
                    <button class="delete-btn" title="Delete"><i class="fas fa-trash"></i></button>
                </span>
            </div>`;

        card.querySelector('.edit-btn').addEventListener('click', () => startEdit(item));
        card.querySelector('.delete-btn').addEventListener('click', () => deletePhoto(item._id));

        grid.appendChild(card);
    });
}

// --- 6. Delete ---
async function deletePhoto(id) {
    if (!confirm('Delete this?')) return;
    if (editingId === id) cancelEdit();
    await fetch(`${API_BASE_URL}/api/delete-media/${id}`, { method: 'DELETE' });
    loadAdminPhotos();
}

document.addEventListener('DOMContentLoaded', () => {
    initSessionGuard();
    loadAdminPhotos();
});
