// API_BASE_URL, optimizedImage(), videoPoster(), escapeHtml() come from api.js
const CLOUDINARY_CLOUD = "dlwzq8sbe";
const UPLOAD_PRESET = "himagiri_preset";

const TABS = {
    Photography: { nav: 'nav-photos',    title: 'Manage Photography', accept: 'image/*', multiple: true,  mediaType: 'image',   resource: 'image', autoPrefix: 'Himagiri_Photos_clicks_' },
    Videos:      { nav: 'nav-videos',    title: 'Manage Videos',      accept: 'video/*', multiple: true,  mediaType: 'video',   resource: 'video', autoPrefix: 'Himagiri_Videos_clicks_' },
    Projects:    { nav: 'nav-projects',  title: 'Manage Projects',    accept: 'image/*', multiple: false, mediaType: 'project', resource: 'image' },
    About:       { nav: 'nav-about',     title: 'Manage About Photo', accept: 'image/*', multiple: false, mediaType: 'image',   resource: 'image' },
    AboutText:   { nav: 'nav-abouttext', title: 'Manage About Content', text: true },
    Technical:   { nav: 'nav-tech',      title: 'Manage Technical Skills', skills: 'technical' },
    Creative:    { nav: 'nav-creative',  title: 'Manage Creative Skills',  skills: 'creative' },
    Certificates: { nav: 'nav-certs',    title: 'Manage Certificates', certs: true },
    Hero:        { nav: 'nav-hero',      title: 'Manage Hero Section', settings: 'hero' },
    Contact:     { nav: 'nav-contact',   title: 'Manage Contact Details', settings: 'contact' },
};

// Editable homepage texts. "lines" fields hold one item per line.
const SETTINGS_FIELDS = {
    hero: [
        { key: 'heroGreeting', label: 'Greeting (small text above your name)' },
        { key: 'heroName', label: 'Your name (big text)' },
        { key: 'typingWords', label: 'Typing words - one per line', lines: true },
        { key: 'heroBullets', label: 'Intro points under the typing text - one per line', lines: true },
    ],
    contact: [
        { key: 'contactIntro', label: 'Contact section intro line' },
        { key: 'email', label: 'Email address' },
        { key: 'location', label: 'Location' },
        { key: 'linkedin', label: 'LinkedIn link' },
        { key: 'github', label: 'GitHub link' },
        { key: 'instagram', label: 'Instagram link' },
        { key: 'footerName', label: 'Footer name' },
        { key: 'footerRole', label: 'Footer role line' },
    ],
};
const BUILTIN_CERT_GROUPS = ['frontend', 'backend'];

let currentTab = 'Photography';
let allMediaData = [];
let aboutBlocks = [];
let skillCards = [];
let editingSkillId = null;
let certificates = [];
let editingCertId = null;
let savedSettings = {};
let adminPage = 1;
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

const TOKEN_KEY = 'adminToken';

// The server signs a login token (JWT) valid for one hour; the timer follows its expiry
function startSession(token) {
    let expiry = Date.now() + SESSION_DURATION_MS;
    try { expiry = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).exp * 1000; } catch (e) { /* keep the default */ }
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(SESSION_KEY, expiry);
}

function clearSession() {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
}

// fetch() for everything that changes data: sends the login token, and signs the admin
// out if the server says the session is no longer valid
async function adminFetch(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
            Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
        },
    });
    if (response.status === 401) {
        logout('Your session expired. Please sign in again.');
        throw new Error('Session expired');
    }
    return response;
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

    if (getSessionMillisLeft() <= 0 || !localStorage.getItem(TOKEN_KEY)) {
        logout('Please sign in to open the dashboard.');
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
                startSession((await response.json()).token);
                window.location.href = 'admin-dashboard.html';
                return;
            }
            const message = response.status === 429 ? 'Too many failed attempts. Please try again in 15 minutes.' : 'Access denied - invalid credentials.';
            notify(message, 'error', 5000);
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
const skillForm = document.getElementById('skillForm');

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

                const readCards = (selector, section) => Array.from(doc.querySelectorAll(`${selector} .skill-card`)).map((card) => {
                    const onclick = card.getAttribute('onclick') || '';
                    const link = card.querySelector('a.view-cert');
                    const target = card.dataset.href || (link && link.getAttribute('href')) || (onclick.match(/['"]([^'"]+)['"]/) || [])[1] || '';
                    const label = card.querySelector('.view-cert');
                    return {
                        section,
                        title: card.querySelector('h3').textContent.trim(),
                        description: card.querySelector('p').textContent.trim(),
                        icon: card.querySelector('i').className.trim(),
                        linkText: label ? label.textContent.trim() : '',
                        linkUrl: target,
                    };
                });
                const skills = [...readCards('#technical-container', 'technical'), ...readCards('#creative-container', 'creative')];

                const text = (selector) => (doc.querySelector(selector)?.textContent || '').replace(/\s+/g, ' ').trim();
                const href = (selector) => doc.querySelector(selector)?.getAttribute('href') || '';
                const settings = {
                    heroGreeting: text('[data-setting="heroGreeting"]'),
                    heroName: text('[data-setting="heroName"]'),
                    typingWords: (doc.getElementById('typing-text')?.dataset.words || '').split('|').filter(Boolean),
                    heroBullets: (doc.querySelector('[data-setting="heroBullets"]')?.innerHTML || '')
                        .split(/<br\s*\/?>/i)
                        .map((line) => line.replace(/<[^>]+>/g, '').replace(/&bull;|\u2022/g, '').replace(/\s+/g, ' ').trim())
                        .filter(Boolean),
                    contactIntro: text('[data-setting="contactIntro"]'),
                    email: text('[data-setting="email"]'),
                    location: text('[data-setting="location"]'),
                    linkedin: href('.mini-icon.linkedin') || href('.s-btn.linkedin'),
                    github: href('.mini-icon.github') || href('.s-btn.github'),
                    instagram: href('.s-btn.instagram'),
                    footerName: text('[data-setting="footerName"]'),
                    footerRole: text('[data-setting="footerRole"]'),
                };

                return { projects, about, skills, settings };
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
    const isSkills = !!tab.skills;
    const isCerts = !!tab.certs;
    const isSettings = !!tab.settings;
    const isMedia = !isText && !isSkills && !isCerts && !isSettings;
    document.getElementById('uploadCard').style.display = isMedia ? 'block' : 'none';
    document.getElementById('aboutCard').style.display = isText ? 'block' : 'none';
    document.getElementById('skillCard').style.display = isSkills ? 'block' : 'none';
    document.getElementById('certCard').style.display = isCerts ? 'block' : 'none';
    document.getElementById('settingsCard').style.display = isSettings ? 'block' : 'none';
    document.getElementById('recentPanel').style.display = isSettings ? 'none' : 'block';
    document.getElementById('adminWorkspace').classList.toggle('single', isSettings);
    document.getElementById('gridTitle').textContent = isText ? 'Current About Content' : (isSkills || isCerts) ? `Current ${tab.title.replace('Manage ', '')}` : 'Recent Uploads';
    document.querySelector('.preview-grid').classList.toggle('blocks', !isMedia);
    if (isSkills) populateQuickLinks();
    if (isCerts) populateCertGroups();
    if (isSettings) renderSettingsForm();

    if (isMedia) {
        document.getElementById('galleryBox').style.display = tab.autoPrefix ? 'block' : 'none';
        refreshGalleryNames();
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

    if (tab.skills && !skillCards.some((c) => c.section === tab.skills)) {
        show('This slider is showing the built-in cards. Import them to edit or delete each card, or add your own.',
            [{ label: 'Import current cards', onClick: () => importSkillCards(tab.skills) }]);
    }

    if (tab.certs) {
        const have = new Set(certificates.map((c) => c.group.toLowerCase()));
        const missing = BUILTIN_CERT_GROUPS.filter((g) => !have.has(g));
        if (missing.length) {
            show(`The built-in ${missing.join(' and ')} certificates are not in the dashboard yet. Import them to edit, delete, or add new ones next to them.`,
                [{ label: 'Import built-in certificates', onClick: () => importCertificates(missing) }]);
        }
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
            const response = await adminFetch(`/api/update-media/${item._id}`, {
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
            const response = await adminFetch(`/api/upload-media`, {
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

async function importSkillCards(section) {
    try {
        const { skills } = await getSiteDefaults();
        const response = await adminFetch(`/api/skill-cards/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(skills.filter((card) => card.section === section)),
        });
        if (!response.ok) throw new Error('Import failed');
        notify('Cards imported. You can now edit each one.', 'success');
        loadSkillCardsAdmin();
    } catch (err) {
        notify('Could not import the cards.', 'error');
    }
}

async function importAboutContent() {
    try {
        const { about } = await getSiteDefaults();
        const response = await adminFetch(`/api/about-blocks/bulk`, {
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
function refreshGalleryNames() {
    const names = new Set(allMediaData.filter((m) => m.category === currentTab && m.gallery).map((m) => m.gallery));
    document.getElementById('galleryNames').innerHTML = Array.from(names).map((n) => `<option value="${escapeHtml(n)}"></option>`).join('');
}

function startEdit(item) {
    editingId = item._id;
    applyTabUI(item.category);

    titleInput.value = item.title || '';
    document.getElementById('mediaGallery').value = item.gallery || '';
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
    if (tab.autoPrefix) payload.gallery = document.getElementById('mediaGallery').value.trim();
    if (currentTab === 'Projects') Object.assign(payload, getProjectFields());

    const saveResponse = await adminFetch(`/api/upload-media`, {
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
    if (TABS[currentTab].autoPrefix) payload.gallery = document.getElementById('mediaGallery').value.trim();
    if (currentTab === 'Projects') Object.assign(payload, getProjectFields());

    const response = await adminFetch(`/api/update-media/${editingId}`, {
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
        const response = await adminFetch(`/api/about-blocks/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Delete failed');
        notify('Deleted.', 'success');
    } catch (err) {
        notify(err.message, 'error');
    }
    loadAboutBlocksAdmin();
}

// ---------- Skill cards (Technical Core / Creative Vision sliders) ----------
function populateQuickLinks() {
    const options = [
        ['', '-- choose a page, or type your own link below --'],
        ['frontend-certs.html', 'Frontend certificates page'],
        ['backend-certs.html', 'Backend certificates page'],
        ['photography.html?type=photos', 'Main photo gallery'],
        ['photography.html?type=videos', 'Main video gallery'],
    ];
    const seen = new Set();
    certificates.filter((c) => !BUILTIN_CERT_GROUPS.includes(c.group.toLowerCase())).forEach((c) => {
        const url = `certificates.html?group=${encodeURIComponent(c.group)}`;
        if (!seen.has(url)) {
            seen.add(url);
            options.push([url, `Certificates: ${c.group}`]);
        }
    });
    allMediaData.filter((m) => m.gallery && (m.category === 'Photography' || m.category === 'Videos')).forEach((m) => {
        const type = m.category === 'Videos' ? 'videos' : 'photos';
        const url = `photography.html?type=${type}&gallery=${encodeURIComponent(m.gallery)}`;
        if (!seen.has(url)) {
            seen.add(url);
            options.push([url, `${m.category === 'Videos' ? 'Videos' : 'Photos'} collection: ${m.gallery}`]);
        }
    });
    document.getElementById('skillQuickLink').innerHTML = options
        .map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`).join('');
}

function startSkillEdit(card) {
    editingSkillId = card._id;
    document.getElementById('skillTitle').value = card.title || '';
    document.getElementById('skillDesc').value = card.description || '';
    document.getElementById('skillIcon').value = card.icon || '';
    document.getElementById('skillLink').value = card.linkUrl || '';
    document.getElementById('skillLinkText').value = card.linkText || '';
    document.getElementById('skillCardTitle').innerHTML = '<i class="fas fa-pen"></i> Edit Skill Card';
    document.getElementById('skillSubmitBtn').textContent = 'Save Changes';
    document.getElementById('skillCancelBtn').style.display = 'inline-block';
    skillForm.scrollIntoView({ behavior: 'smooth' });
}

function cancelSkillEdit() {
    editingSkillId = null;
    skillForm.reset();
    document.getElementById('skillCardTitle').innerHTML = '<i class="fas fa-pen"></i> Add Skill Card';
    document.getElementById('skillSubmitBtn').textContent = 'Add Skill Card';
    document.getElementById('skillCancelBtn').style.display = 'none';
}

async function loadSkillCardsAdmin() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/skill-cards`, { cache: 'no-store' });
        skillCards = await response.json();
        try { localStorage.removeItem(SKILLS_CACHE_KEY); } catch (e) { /* storage blocked */ }
    } catch (error) {
        console.error('Error loading skill cards:', error);
    }
    renderGrid();
    renderTools();
}

async function deleteSkillCard(id) {
    if (!(await askConfirm('Delete this skill card?'))) return;
    if (editingSkillId === id) cancelSkillEdit();
    try {
        const response = await adminFetch(`/api/skill-cards/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Delete failed');
        notify('Deleted.', 'success');
    } catch (err) {
        notify(err.message, 'error');
    }
    loadSkillCardsAdmin();
}

function renderSkillCardsGrid(grid) {
    const section = TABS[currentTab].skills;
    const cards = skillCards.filter((c) => c.section === section);
    if (cards.length === 0) {
        grid.innerHTML = '<p style="color:#64748b;">Nothing here yet - the site shows its built-in cards. Use the Import button above, or add your own.</p>';
        return;
    }
    paginate(cards).forEach((c) => {
        const card = document.createElement('div');
        card.className = 'block-card';
        card.innerHTML = `
            <div class="block-icon"><i class="${/^[a-z0-9\- ]+$/i.test(c.icon || '') ? c.icon : 'fas fa-star'}"></i></div>
            <div class="block-label">${escapeHtml(c.title)}</div>
            <div class="block-text">${escapeHtml(c.description)}</div>`;
        card.appendChild(actionButton('edit', 'fas fa-pen', 'Edit', () => startSkillEdit(c)));
        card.appendChild(actionButton('delete', 'fas fa-trash', 'Delete', () => deleteSkillCard(c._id)));
        grid.appendChild(card);
    });
}

// ---------- Pagination for every list ----------
const isPhoneLayout = () => window.matchMedia('(max-width: 768px)').matches;

function paginate(list, { thumbnails = false } = {}) {
    const size = thumbnails ? (isPhoneLayout() ? 6 : 12) : (isPhoneLayout() ? 4 : 8);
    const pages = Math.max(1, Math.ceil(list.length / size));
    adminPage = Math.min(adminPage, pages);

    renderPager(document.getElementById('adminPager'), {
        page: adminPage,
        pages,
        onChange: (page) => {
            adminPage = page;
            renderGrid();
            document.getElementById('recentPanel').scrollIntoView({ behavior: 'smooth' });
        },
    });
    return list.slice((adminPage - 1) * size, adminPage * size);
}

// ---------- Hero / Contact texts ----------
async function loadSettingsAdmin() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/settings`, { cache: 'no-store' });
        savedSettings = await response.json();
        try { localStorage.removeItem(SETTINGS_CACHE_KEY); } catch (e) { /* storage blocked */ }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
    if (TABS[currentTab].settings) renderSettingsForm();
}

async function renderSettingsForm() {
    const tab = TABS[currentTab];
    const fields = SETTINGS_FIELDS[tab.settings];
    document.getElementById('settingsCardTitle').innerHTML = `<i class="fas fa-sliders-h"></i> ${tab.title.replace('Manage ', 'Edit ')}`;

    let defaults = {};
    try { defaults = (await getSiteDefaults()).settings; } catch (e) { /* form still works with empty defaults */ }

    const container = document.getElementById('settingsFields');
    container.innerHTML = '';
    fields.forEach((field) => {
        const saved = savedSettings[field.key];
        const hasSaved = field.lines ? Array.isArray(saved) && saved.length : !!(saved || '').trim();
        const value = hasSaved ? saved : defaults[field.key];
        const text = field.lines ? (value || []).join('\n') : (value || '');

        const box = document.createElement('div');
        box.className = 'input-box';
        box.innerHTML = `<label for="setting-${field.key}">${escapeHtml(field.label)}</label>`;
        const input = document.createElement(field.lines ? 'textarea' : 'input');
        input.id = `setting-${field.key}`;
        if (field.lines) {
            input.rows = 4;
            input.style.cssText = 'width:100%; background:#0f172a; color:white; border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:10px; outline:none;';
        } else {
            input.type = 'text';
        }
        input.value = text;
        box.appendChild(input);
        container.appendChild(box);
    });
}

function collectSettings(reset) {
    const body = {};
    SETTINGS_FIELDS[TABS[currentTab].settings].forEach((field) => {
        const value = reset ? '' : document.getElementById(`setting-${field.key}`).value;
        body[field.key] = field.lines ? value.split('\n').map((line) => line.trim()).filter(Boolean) : value.trim();
    });
    return body;
}

async function saveSettings(reset) {
    if (reset && !(await askConfirm('Go back to the text written in the page?', 'Use built-in'))) return;
    try {
        const response = await adminFetch('/api/settings', { method: 'PUT', body: JSON.stringify(collectSettings(reset)) });
        if (!response.ok) throw new Error('Saving failed');
        notify(reset ? 'Built-in text restored.' : 'Saved! The site shows the new text.', 'success');
        try { localStorage.removeItem(SETTINGS_CACHE_KEY); } catch (e) { /* storage blocked */ }
        await loadSettingsAdmin();
    } catch (err) {
        if (err.message !== 'Session expired') notify(err.message, 'error');
    }
}

// ---------- Certificates ----------
let certDefaultsPromise = null;

function getCertDefaults() {
    if (!certDefaultsPromise) {
        certDefaultsPromise = Promise.all(BUILTIN_CERT_GROUPS.map(async (group) => {
            const html = await (await fetch(`${group}-certs.html`, { cache: 'no-store' })).text();
            const doc = new DOMParser().parseFromString(html, 'text/html');
            return Array.from(doc.querySelectorAll('.cert-grid .sub-card')).map((card) => ({
                group,
                title: card.querySelector('h3').textContent.trim(),
                description: card.querySelector('p')?.textContent.trim() || '',
                icon: card.querySelector('i')?.className.trim() || 'fas fa-certificate',
                url: card.querySelector('a')?.getAttribute('href') || '',
            }));
        })).then((lists) => lists.flat());
    }
    return certDefaultsPromise;
}

async function importCertificates(groups) {
    try {
        const all = await getCertDefaults();
        const response = await adminFetch('/api/certificates/bulk', {
            method: 'POST',
            body: JSON.stringify(all.filter((c) => groups.includes(c.group))),
        });
        if (!response.ok) throw new Error('Import failed');
        notify('Certificates imported.', 'success');
        loadCertificatesAdmin();
    } catch (err) {
        if (err.message !== 'Session expired') notify('Could not import the certificates.', 'error');
    }
}

function certificateGroups() {
    const groups = new Map(BUILTIN_CERT_GROUPS.map((g) => [g, g]));
    certificates.forEach((c) => { if (!groups.has(c.group.toLowerCase())) groups.set(c.group.toLowerCase(), c.group); });
    return Array.from(groups.values());
}

function populateCertGroups(selected) {
    const select = document.getElementById('certGroup');
    const current = selected || select.value;
    select.innerHTML = certificateGroups().map((g) => `<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join('')
        + '<option value="__new__">+ New group...</option>';
    if (current) select.value = current;
    if (select.value !== current) select.selectedIndex = 0;
    document.getElementById('certNewGroupBox').style.display = select.value === '__new__' ? 'block' : 'none';
}

function startCertEdit(cert) {
    editingCertId = cert._id;
    populateCertGroups(certificateGroups().find((g) => g.toLowerCase() === cert.group.toLowerCase()) || cert.group);
    document.getElementById('certTitle').value = cert.title || '';
    document.getElementById('certDesc').value = cert.description || '';
    document.getElementById('certIcon').value = cert.icon || '';
    document.getElementById('certUrl').value = cert.url || '';
    document.getElementById('certCardTitle').innerHTML = '<i class="fas fa-certificate"></i> Edit Certificate';
    document.getElementById('certSubmitBtn').textContent = 'Save Changes';
    document.getElementById('certCancelBtn').style.display = 'inline-block';
    document.getElementById('certForm').scrollIntoView({ behavior: 'smooth' });
}

function cancelCertEdit() {
    editingCertId = null;
    document.getElementById('certForm').reset();
    document.getElementById('certCardTitle').innerHTML = '<i class="fas fa-certificate"></i> Add Certificate';
    document.getElementById('certSubmitBtn').textContent = 'Add Certificate';
    document.getElementById('certCancelBtn').style.display = 'none';
    populateCertGroups();
}

async function loadCertificatesAdmin() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/certificates`, { cache: 'no-store' });
        certificates = await response.json();
        try { localStorage.removeItem(CERTS_CACHE_KEY); } catch (e) { /* storage blocked */ }
    } catch (error) {
        console.error('Error loading certificates:', error);
    }
    if (TABS[currentTab].certs) populateCertGroups();
    renderGrid();
    renderTools();
}

async function deleteCertificate(id) {
    if (!(await askConfirm('Delete this certificate?'))) return;
    if (editingCertId === id) cancelCertEdit();
    try {
        const response = await adminFetch(`/api/certificates/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Delete failed');
        notify('Deleted.', 'success');
    } catch (err) {
        if (err.message !== 'Session expired') notify(err.message, 'error');
    }
    loadCertificatesAdmin();
}

// PDFs are stored as "raw" files on Cloudinary; images as normal images
async function uploadCertificateFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    const type = file.type === 'application/pdf' ? 'raw' : 'image';
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/${type}/upload`, { method: 'POST', body: formData });
    const data = await response.json();
    if (!data.secure_url) throw new Error(data.error?.message || 'Upload failed');
    return data.secure_url;
}

function renderCertificatesGrid(grid) {
    if (certificates.length === 0) {
        grid.innerHTML = '<p style="color:#64748b;">No certificates here yet - the certificate pages show their built-in cards. Use the Import button above, or add your own.</p>';
        return;
    }
    paginate(certificates).forEach((cert) => {
        const card = document.createElement('div');
        card.className = 'block-card';
        card.innerHTML = `
            <span class="badge">${escapeHtml(cert.group)}</span>
            <div class="block-icon"><i class="${/^[a-z0-9\- ]+$/i.test(cert.icon || '') ? cert.icon : 'fas fa-certificate'}"></i></div>
            <div class="block-label">${escapeHtml(cert.title)}</div>
            <div class="block-text">${escapeHtml(cert.description)}</div>`;
        card.appendChild(actionButton('edit', 'fas fa-pen', 'Edit', () => startCertEdit(cert)));
        card.appendChild(actionButton('delete', 'fas fa-trash', 'Delete', () => deleteCertificate(cert._id)));
        grid.appendChild(card);
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

    document.getElementById('adminPager').hidden = true;
    if (TABS[currentTab].settings) return;
    if (TABS[currentTab].text) return renderAboutBlocks(grid);
    if (TABS[currentTab].skills) return renderSkillCardsGrid(grid);
    if (TABS[currentTab].certs) return renderCertificatesGrid(grid);

    const items = allMediaData
        .filter((item) => item.category === currentTab)
        .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned));
    if (items.length === 0) {
        grid.innerHTML = `<p style="color:#64748b;">No ${currentTab} found.</p>`;
        return;
    }

    paginate(items, { thumbnails: true }).forEach((item) => {
        const media = item.mediaType === 'video'
            ? `<video src="${item.url}#t=0.1" poster="${videoPoster(item.url, 300)}" preload="metadata" muted playsinline></video>`
            : `<img src="${optimizedImage(item.url, 300)}" loading="lazy" alt="">`;

        const card = document.createElement('div');
        card.className = 'preview-item';
        const galleryTag = item.gallery ? `<span class="item-gallery">${escapeHtml(item.gallery)}</span>` : '';
        card.innerHTML = `<div class="preview-media">${media}</div><div class="item-name" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}${galleryTag}</div>`;

        const mediaBox = card.querySelector('.preview-media');
        if (currentTab !== 'About') mediaBox.appendChild(actionButton('edit', 'fas fa-pen', 'Edit', () => startEdit(item)));
        mediaBox.appendChild(actionButton('delete', 'fas fa-trash', 'Delete', () => deleteItem(item._id)));
        if (TABS[currentTab].autoPrefix) {
            mediaBox.appendChild(actionButton(`pin${item.pinned ? ' on' : ''}`, 'fas fa-thumbtack',
                item.pinned ? 'Pinned to the top of the gallery (click to unpin)' : 'Pin to the top of the gallery',
                () => togglePinned(item)));
        }
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

    paginate(aboutBlocks).forEach((block) => {
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

async function togglePinned(item) {
    try {
        const response = await adminFetch(`/api/update-media/${item._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pinned: !item.pinned }),
        });
        if (!response.ok) throw new Error('Update failed');
        notify(item.pinned ? 'Unpinned.' : 'Pinned - it now shows first in the gallery.', 'success');
    } catch (err) {
        notify(err.message, 'error');
    }
    loadAdminPhotos();
}

async function toggleFeatured(item) {
    try {
        const response = await adminFetch(`/api/update-media/${item._id}`, {
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
        const response = await adminFetch(`/api/delete-media/${id}`, { method: 'DELETE' });
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
            cancelSkillEdit();
            cancelCertEdit();
            adminPage = 1;
            applyTabUI(name);
        });
    });

    cancelEditBtn.addEventListener('click', cancelEdit);
    document.getElementById('aboutCancelBtn').addEventListener('click', cancelBlockEdit);
    aboutKind.addEventListener('change', syncAboutFormFields);
    document.getElementById('skillCancelBtn').addEventListener('click', cancelSkillEdit);
    document.getElementById('certCancelBtn').addEventListener('click', cancelCertEdit);
    document.getElementById('certGroup').addEventListener('change', (e) => {
        document.getElementById('certNewGroupBox').style.display = e.target.value === '__new__' ? 'block' : 'none';
    });

    document.getElementById('settingsForm').addEventListener('submit', (e) => { e.preventDefault(); saveSettings(false); });
    document.getElementById('settingsResetBtn').addEventListener('click', () => saveSettings(true));

    document.getElementById('certForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('certSubmitBtn');
        const groupChoice = document.getElementById('certGroup').value;
        const group = groupChoice === '__new__' ? document.getElementById('certNewGroup').value.trim() : groupChoice;
        const title = document.getElementById('certTitle').value.trim();
        if (!group) return notify('Please enter the group name.', 'error');
        if (!title) return notify('Please enter the certificate name.', 'error');

        submitBtn.disabled = true;
        try {
            let url = document.getElementById('certUrl').value.trim();
            const file = document.getElementById('certFile').files[0];
            if (file) {
                submitBtn.textContent = 'Uploading...';
                url = await uploadCertificateFile(file);
            }
            const payload = {
                group,
                title,
                description: document.getElementById('certDesc').value.trim(),
                icon: document.getElementById('certIcon').value.trim() || 'fas fa-certificate',
                url,
            };
            const response = await adminFetch(`/api/certificates${editingCertId ? `/${editingCertId}` : ''}`, {
                method: editingCertId ? 'PUT' : 'POST',
                body: JSON.stringify(payload),
            });
            if (!response.ok) throw new Error('Saving failed');
            notify(editingCertId ? 'Changes saved!' : 'Certificate added!', 'success');
            cancelCertEdit();
            loadCertificatesAdmin();
        } catch (err) {
            if (err.message !== 'Session expired') notify(err.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = editingCertId ? 'Save Changes' : 'Add Certificate';
        }
    });
    document.getElementById('skillQuickLink').addEventListener('change', (e) => {
        if (e.target.value) document.getElementById('skillLink').value = e.target.value;
    });

    skillForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('skillTitle').value.trim();
        if (!title) return notify('Please enter the skill name.', 'error');

        const payload = {
            section: TABS[currentTab].skills,
            title,
            description: document.getElementById('skillDesc').value.trim(),
            icon: document.getElementById('skillIcon').value.trim() || 'fas fa-star',
            linkUrl: document.getElementById('skillLink').value.trim(),
            linkText: document.getElementById('skillLinkText').value.trim(),
        };

        const submitBtn = document.getElementById('skillSubmitBtn');
        submitBtn.disabled = true;
        try {
            const response = await adminFetch(`/api/skill-cards${editingSkillId ? `/${editingSkillId}` : ''}`, {
                method: editingSkillId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) throw new Error('Saving failed');
            notify(editingSkillId ? 'Changes saved!' : 'Skill card added!', 'success');
            cancelSkillEdit();
            loadSkillCardsAdmin();
        } catch (err) {
            notify(err.message, 'error');
        } finally {
            submitBtn.disabled = false;
        }
    });

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
            const response = await adminFetch(`/api/about-blocks${editing ? `/${editing._id}` : ''}`, {
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
        loadSkillCardsAdmin();
        loadCertificatesAdmin();
        loadSettingsAdmin();
    }
    loadAdminPhotos();
});
