// API_BASE_URL, optimizedImage(), videoPoster(), escapeHtml() come from api.js
const CLOUDINARY_CLOUD = "dlwzq8sbe";
const UPLOAD_PRESET = "himagiri_preset";

const TABS = {
    Photography: { nav: 'nav-photos',    title: 'Manage Photography', accept: 'image/*', multiple: true,  mediaType: 'image',   resource: 'image', autoPrefix: 'Himagiri_Photos_clicks_' },
    Videos:      { nav: 'nav-videos',    title: 'Manage Videos',      accept: 'video/*', multiple: true,  mediaType: 'video',   resource: 'video', autoPrefix: 'Himagiri_Videos_clicks_' },
    Projects:    { nav: 'nav-projects',  title: 'Manage Projects',    accept: 'image/*', multiple: false, mediaType: 'project', resource: 'image' },
    About:       { nav: 'nav-about',     title: 'Manage About Photo', accept: 'image/*', multiple: false, mediaType: 'image',   resource: 'image' },
    AboutText:   { nav: 'nav-abouttext', title: 'Manage About Content', text: true },
};

let currentTab = 'Photography';
let allMediaData = [];
let aboutBlocks = [];
let editingId = null;
let editingBlockId = null;

function notify(message, type = 'info', duration = 3500) {
    if (typeof window.showToast === 'function') window.showToast(message, type, duration);
    else alert(message);
}

async function askConfirm(message, okLabel = 'Delete') {
    if (typeof window.showConfirm === 'function') return window.showConfirm(message, okLabel);
    return confirm(message);
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
    loginForm.noValidate = true;
    const urlMsg = new URLSearchParams(window.location.search).get('msg');
    if (urlMsg) notify(urlMsg, 'info', 5000);

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (typeof window.validateForm === 'function' && !window.validateForm(loginForm)) return;

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

// ---------- Dashboard elements ----------
const uploadForm = document.getElementById('uploadForm');
const formSubmitBtn = document.getElementById('formSubmitBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const fileInput = document.getElementById('mediaFile');
const titleInput = document.getElementById('mediaTitle');
const aboutForm = document.getElementById('aboutForm');

// ---------- Current homepage content, read from index.html ----------
// Used by the "Import" buttons so the built-in content can be edited like anything else.
let siteDefaultsPromise = null;

function nodeToMarkup(element) {
    return Array.from(element.childNodes).map((node) => {
        if (node.nodeType === Node.TEXT_NODE) return node.textContent;
        if (node.tagName === 'STRONG') return `**${node.textContent}**`;
        if (node.tagName === 'EM') return `*${node.textContent}*`;
        return node.textContent;
    }).join('').replace(/\s+/g, ' ').trim();
}

function getSiteDefaults() {
    if (!siteDefaultsPromise) {
        siteDefaultsPromise = fetch('index.html', { cache: 'no-store' })
            .then((response) => response.text())
            .then((html) => {
                const doc = new DOMParser().parseFromString(html, 'text/html');

                const projects = Array.from(doc.querySelectorAll('#projects-container .project-card')).map((card) => ({
                    title: card.querySelector('h3').textContent.trim(),
                    tag: card.querySelector('.project-tag')?.textContent.trim() || '',
                    description: card.querySelector('p')?.textContent.trim() || '',
                    techStack: Array.from(card.querySelectorAll('.tech-stack span')).map((s) => s.textContent.trim()).join(', '),
                    liveLink: card.querySelector('.card-links a')?.getAttribute('href') || '',
                    url: card.querySelector('img').getAttribute('src'),
                }));

                const about = [];
                const heading = doc.getElementById('about-heading');
                if (heading) about.push({ kind: 'heading', text: heading.textContent.replace(/\s+/g, ' ').trim() });
                doc.querySelectorAll('.about-text-col > p').forEach((p) => about.push({ kind: 'paragraph', text: nodeToMarkup(p) }));
                doc.querySelectorAll('.detail-item').forEach((item) => about.push({
                    kind: 'stat',
                    label: item.querySelector('.detail-label').textContent.trim(),
                    text: item.querySelector('.detail-value').textContent.trim(),
                }));

                return { projects, about };
            });
    }
    return siteDefaultsPromise;
}

// ---------- Tab handling ----------
function applyTabUI(tabName) {
    const tab = TABS[tabName];
    currentTab = tabName;

    document.getElementById('page-title').innerText = tab.title;
    Object.entries(TABS).forEach(([name, t]) => {
        document.getElementById(t.nav).classList.toggle('active', name === tabName);
    });

    const isText = !!tab.text;
    document.getElementById('uploadCard').style.display = isText ? 'none' : 'block';
    document.getElementById('aboutCard').style.display = isText ? 'block' : 'none';
    document.getElementById('gridTitle').textContent = isText ? 'Current About Content' : 'Recent Uploads';
    document.querySelector('.preview-grid').classList.toggle('blocks', isText);

    if (!isText) {
        document.getElementById('projectFields').style.display = tabName === 'Projects' ? 'block' : 'none';
        document.getElementById('titleBox').style.display = tabName === 'About' ? 'none' : 'block';

        fileInput.accept = tab.accept;
        fileInput.multiple = tab.multiple;
        document.getElementById('fileLabel').textContent = tab.multiple ? 'Choose Files (select many at once)' : 'Choose File';
        document.getElementById('fileHint').textContent =
            tabName === 'About' ? 'The new photo replaces the current About photo.'
            : tab.autoPrefix ? `Title is optional. If you leave it blank, files are named automatically (${tab.autoPrefix}0001, 0002...).`
            : '';
    }

    renderGrid();
    renderTools();
}

// ---------- Naming ----------
const pad4 = (n) => String(n).padStart(4, '0');

function nextAutoNumber(prefix) {
    const pattern = new RegExp(`^${prefix}(\\d+)$`);
    return allMediaData.reduce((max, item) => {
        const match = pattern.exec(item.title || '');
        return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 0) + 1;
}

// Titles that look like raw camera / phone / screenshot file names
function looksLikeFileName(title) {
    return /(IMG|VID|DSC|PXL|MVIMG|Screenshot|WhatsApp|Capture)/i.test(title) || /\d{6,}/.test(title);
}

function titleForFile(file, index, total, baseTitle, autoStart) {
    const tab = TABS[currentTab];
    if (currentTab === 'About') return 'About Photo';
    if (baseTitle) return total > 1 ? `${baseTitle} ${index + 1}` : baseTitle;
    if (tab.autoPrefix) return `${tab.autoPrefix}${pad4(autoStart + index)}`;
    return file.name.replace(/\.[^.]+$/, '');
}

// ---------- Notice bar (import / rename helpers) ----------
function renderTools() {
    const bar = document.getElementById('toolsBar');
    bar.hidden = true;
    bar.innerHTML = '';

    const show = (message, buttons) => {
        bar.innerHTML = `<span>${message}</span><div class="tools-actions"></div>`;
        buttons.forEach(({ label, className, onClick }) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = label;
            if (className) btn.className = className;
            btn.addEventListener('click', onClick);
            bar.querySelector('.tools-actions').appendChild(btn);
        });
        bar.hidden = false;
    };

    const tab = TABS[currentTab];

    if (tab.autoPrefix) {
        const oldItems = allMediaData.filter((m) => m.category === currentTab && looksLikeFileName(m.title || ''));
        if (oldItems.length) {
            show(`${oldItems.length} old item(s) still have file names like "${oldItems[0].title}". Rename them to ${tab.autoPrefix}0001...?`,
                [{ label: `Rename ${oldItems.length} items`, onClick: () => renameOldItems(oldItems) }]);
        }
    }

    if (currentTab === 'Projects' && localStorage.getItem('defaultsBannerDismissed') !== '1') {
        getSiteDefaults().then(({ projects }) => {
            if (currentTab !== 'Projects') return;
            const existing = new Set(allMediaData.filter((m) => m.category === 'Projects').map((m) => m.title));
            const missing = projects.filter((p) => !existing.has(p.title));
            if (!missing.length) return;
            show(`${missing.length} built-in project(s) (${missing.map((p) => p.title).join(', ')}) are not in the dashboard yet. Import them to edit, delete, or choose which ones appear on the homepage slider. Note: once any project exists here, the built-in ones are hidden on the site until imported.`, [
                { label: 'Import default projects', onClick: importDefaultProjects },
                { label: 'Hide this', className: 'secondary', onClick: () => { localStorage.setItem('defaultsBannerDismissed', '1'); renderTools(); } },
            ]);
        }).catch(() => {});
    }

    if (currentTab === 'AboutText' && aboutBlocks.length === 0) {
        show('The About section is showing the built-in text. Import it here to edit or delete every paragraph and card.',
            [{ label: 'Import current About content', onClick: importAboutContent }]);
    }
}

async function renameOldItems(items) {
    const tab = TABS[currentTab];
    const ok = await askConfirm(`Rename ${items.length} items to ${tab.autoPrefix}0001, 0002...? Oldest items get the lowest numbers.`, 'Rename');
    if (!ok) return;

    const sorted = [...items].sort((a, b) => new Date(a.uploadedAt) - new Date(b.uploadedAt));
    let number = nextAutoNumber(tab.autoPrefix);
    let done = 0;
    for (const item of sorted) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/update-media/${item._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: `${tab.autoPrefix}${pad4(number)}` }),
            });
            if (!response.ok) throw new Error('failed');
            number++;
            done++;
        } catch (err) {
            console.error('Rename failed for', item.title, err);
        }
    }
    notify(`${done} of ${items.length} items renamed.`, done === items.length ? 'success' : 'error');
    loadAdminPhotos();
}

async function importDefaultProjects() {
    try {
        const { projects } = await getSiteDefaults();
        const existing = new Set(allMediaData.filter((m) => m.category === 'Projects').map((m) => m.title));
        let added = 0;
        for (const project of projects.filter((p) => !existing.has(p.title))) {
            const response = await fetch(`${API_BASE_URL}/api/upload-media`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...project, mediaType: 'project', category: 'Projects', featured: true }),
            });
            if (response.ok) added++;
        }
        notify(`${added} default project(s) imported.`, 'success');
        loadAdminPhotos();
    } catch (err) {
        notify('Could not import the default projects.', 'error');
    }
}

async function importAboutContent() {
    try {
        const { about } = await getSiteDefaults();
        const response = await fetch(`${API_BASE_URL}/api/about-blocks/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(about),
        });
        if (!response.ok) throw new Error('Import failed');
        notify('About content imported. You can now edit every part.', 'success');
        loadAboutBlocksAdmin();
    } catch (err) {
        notify('Could not import the About content.', 'error');
    }
}

// ---------- Media edit / upload ----------
function startEdit(item) {
    editingId = item._id;
    applyTabUI(item.category);

    titleInput.value = item.title || '';
    if (item.category === 'Projects') {
        document.getElementById('projTag').value = item.tag || '';
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
        tag: document.getElementById('projTag').value,
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

    const autoStart = tab.autoPrefix ? nextAutoNumber(tab.autoPrefix) : 0;
    let uploaded = 0;
    const failed = [];
    for (let i = 0; i < files.length; i++) {
        formSubmitBtn.textContent = `Uploading ${i + 1} of ${files.length}...`;
        try {
            await uploadOne(files[i], titleForFile(files[i], i, files.length, baseTitle, autoStart));
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

// ---------- About content (paragraphs, info cards, heading) ----------
const aboutKind = document.getElementById('aboutKind');

function syncAboutFormFields() {
    const editing = aboutBlocks.find((b) => b._id === editingBlockId);
    const kind = editing ? editing.kind : aboutKind.value;
    document.getElementById('aboutLabelBox').style.display = kind === 'stat' ? 'block' : 'none';
    document.getElementById('aboutKindBox').style.display = editing ? 'none' : 'block';
    document.getElementById('aboutTextLabel').textContent = kind === 'stat' ? 'Value (e.g. MERN Developer)' : kind === 'heading' ? 'Heading (the last word is highlighted)' : 'Paragraph';
    document.getElementById('aboutHint').style.display = kind === 'paragraph' ? 'block' : 'none';
}

function startBlockEdit(block) {
    editingBlockId = block._id;
    document.getElementById('aboutLabel').value = block.label || '';
    document.getElementById('aboutText').value = block.text || '';
    document.getElementById('aboutCardTitle').innerHTML = '<i class="fas fa-pen"></i> Edit About Content';
    document.getElementById('aboutSubmitBtn').textContent = 'Save Changes';
    document.getElementById('aboutCancelBtn').style.display = 'inline-block';
    syncAboutFormFields();
    aboutForm.scrollIntoView({ behavior: 'smooth' });
}

function cancelBlockEdit() {
    editingBlockId = null;
    aboutForm.reset();
    document.getElementById('aboutCardTitle').innerHTML = '<i class="fas fa-pen"></i> Add About Content';
    document.getElementById('aboutSubmitBtn').textContent = 'Add to About';
    document.getElementById('aboutCancelBtn').style.display = 'none';
    syncAboutFormFields();
}

async function loadAboutBlocksAdmin() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/about-blocks`, { cache: 'no-store' });
        aboutBlocks = await response.json();
        try { localStorage.removeItem(ABOUT_CACHE_KEY); } catch (e) { /* storage blocked */ }
    } catch (error) {
        console.error('Error loading About content:', error);
    }
    renderGrid();
    renderTools();
}

async function deleteBlock(id) {
    if (!(await askConfirm('Delete this About item?'))) return;
    if (editingBlockId === id) cancelBlockEdit();
    try {
        const response = await fetch(`${API_BASE_URL}/api/about-blocks/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Delete failed');
        notify('Deleted.', 'success');
    } catch (err) {
        notify(err.message, 'error');
    }
    loadAboutBlocksAdmin();
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
        renderTools();
    } catch (error) {
        console.error('Error loading data:', error);
        grid.innerHTML = '<p style="color:#f87171;">Could not load items. The server may be waking up - refresh in a few seconds.</p>';
    }
}

function actionButton(className, icon, title, onClick) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `card-action ${className}`;
    btn.title = title;
    btn.innerHTML = `<i class="${icon}"></i>`;
    btn.addEventListener('click', onClick);
    return btn;
}

function renderGrid() {
    const grid = document.querySelector('.preview-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (TABS[currentTab].text) return renderAboutBlocks(grid);

    const items = allMediaData.filter((item) => item.category === currentTab);
    if (items.length === 0) {
        grid.innerHTML = `<p style="color:#64748b;">No ${currentTab} found.</p>`;
        return;
    }

    items.forEach((item) => {
        const media = item.mediaType === 'video'
            ? `<video src="${item.url}#t=0.1" poster="${videoPoster(item.url, 300)}" preload="metadata" muted playsinline></video>`
            : `<img src="${optimizedImage(item.url, 300)}" loading="lazy" alt="">`;

        const card = document.createElement('div');
        card.className = 'preview-item';
        card.innerHTML = `<div class="preview-media">${media}</div><div class="item-name" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</div>`;

        const mediaBox = card.querySelector('.preview-media');
        if (currentTab !== 'About') mediaBox.appendChild(actionButton('edit', 'fas fa-pen', 'Edit', () => startEdit(item)));
        mediaBox.appendChild(actionButton('delete', 'fas fa-trash', 'Delete', () => deleteItem(item._id)));
        if (currentTab === 'Projects') {
            mediaBox.appendChild(actionButton(`star${item.featured ? ' on' : ''}`, 'fas fa-star',
                item.featured ? 'Shown on homepage slider (click to remove)' : 'Click to show on homepage slider',
                () => toggleFeatured(item)));
        }
        grid.appendChild(card);
    });
}

function renderAboutBlocks(grid) {
    if (aboutBlocks.length === 0) {
        grid.innerHTML = '<p style="color:#64748b;">Nothing here yet - the site shows its built-in About text. Use the Import button above, or add your own.</p>';
        return;
    }
    const kindNames = { heading: 'Heading', paragraph: 'Paragraph', stat: 'Info card' };

    aboutBlocks.forEach((block) => {
        const card = document.createElement('div');
        card.className = 'block-card';
        card.innerHTML = `
            <span class="badge">${kindNames[block.kind]}</span>
            ${block.kind === 'stat' ? `<div class="block-label">${escapeHtml(block.label)}</div>` : ''}
            <div class="block-text">${escapeHtml(block.text)}</div>`;
        card.appendChild(actionButton('edit', 'fas fa-pen', 'Edit', () => startBlockEdit(block)));
        card.appendChild(actionButton('delete', 'fas fa-trash', 'Delete', () => deleteBlock(block._id)));
        grid.appendChild(card);
    });
}

async function toggleFeatured(item) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/update-media/${item._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ featured: !item.featured }),
        });
        if (!response.ok) throw new Error('Update failed');
        notify(item.featured ? 'Removed from the homepage slider.' : 'Added to the homepage slider.', 'success');
    } catch (err) {
        notify(err.message, 'error');
    }
    loadAdminPhotos();
}

async function deleteItem(id) {
    if (!(await askConfirm('Delete this?'))) return;
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

// ---------- Wiring ----------
if (uploadForm) {
    Object.entries(TABS).forEach(([name, tab]) => {
        document.getElementById(tab.nav).addEventListener('click', () => {
            cancelEdit();
            cancelBlockEdit();
            applyTabUI(name);
        });
    });

    cancelEditBtn.addEventListener('click', cancelEdit);
    document.getElementById('aboutCancelBtn').addEventListener('click', cancelBlockEdit);
    aboutKind.addEventListener('change', syncAboutFormFields);

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

    aboutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const editing = aboutBlocks.find((b) => b._id === editingBlockId);
        const kind = editing ? editing.kind : aboutKind.value;
        const text = document.getElementById('aboutText').value.trim();
        const label = document.getElementById('aboutLabel').value.trim();

        if (!text) return notify('Please write some text first.', 'error');
        if (kind === 'stat' && !label) return notify('Please enter the card label (for example "Role:").', 'error');

        const submitBtn = document.getElementById('aboutSubmitBtn');
        submitBtn.disabled = true;
        try {
            const response = await fetch(`${API_BASE_URL}/api/about-blocks${editing ? `/${editing._id}` : ''}`, {
                method: editing ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ kind, text, label: kind === 'stat' ? label : '' }),
            });
            if (!response.ok) throw new Error('Saving failed');
            notify(editing ? 'Changes saved!' : 'Added to the About section!', 'success');
            cancelBlockEdit();
            loadAboutBlocksAdmin();
        } catch (err) {
            notify(err.message, 'error');
        } finally {
            submitBtn.disabled = false;
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initSessionGuard();
    if (uploadForm) {
        applyTabUI(currentTab);
        syncAboutFormFields();
        loadAboutBlocksAdmin();
    }
    loadAdminPhotos();
});
