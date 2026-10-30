// Wraps showToast() (from toast.js) with a safe fallback, in case toast.js
// ever fails to load for some reason.
function notify(message, type = 'info', duration = 3500) {
    if (typeof window.showToast === 'function') {
        window.showToast(message, type, duration);
    } else {
        alert(message);
    }
}

// --- Typing Animation Logic ---
const words = (document.getElementById("typing-text")?.dataset.words || "MERN Stack Developer|Photographer|Video Editor").split("|");
let wordIndex = 0;
let charIndex = 0;
let isDeleting = false;

function type() {
    const textElement = document.getElementById("typing-text");
    if (!textElement) return;

    const currentWord = words[wordIndex];
    
    if (isDeleting) {
        textElement.textContent = currentWord.substring(0, charIndex - 1);
        charIndex--;
    } else {
        textElement.textContent = currentWord.substring(0, charIndex + 1);
        charIndex++;
    }

    let typeSpeed = isDeleting ? 100 : 200;

    if (!isDeleting && charIndex === currentWord.length) {
        isDeleting = true;
        typeSpeed = 2000; 
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        typeSpeed = 500;
    }
    setTimeout(type, typeSpeed);
}

// --- Mobile Menu Toggle ---
function toggleMenu() {
    const navLinks = document.getElementById('nav-links');
    if (navLinks) navLinks.classList.toggle('active');
}

// Close the mobile menu after a link is tapped
document.querySelectorAll('#nav-links a').forEach((link) => {
    link.addEventListener('click', () => document.getElementById('nav-links').classList.remove('active'));
});

// --- Particles Background Logic ---
if (document.getElementById('particles-js') && typeof particlesJS === 'function') {
    particlesJS("particles-js", {
        "particles": {
            "number": { "value": 80, "density": { "enable": true, "value_area": 800 } },
            "color": { "value": "#00d2ff" },
            "shape": { "type": "circle", "stroke": { "width": 0, "color": "#000000" } },
            "opacity": { "value": 0.5, "random": false },
            "size": { "value": 3, "random": true },
            "line_linked": { "enable": true, "distance": 150, "color": "#00d2ff", "opacity": 0.4, "width": 1 },
            "move": { "enable": true, "speed": 4, "direction": "none", "random": false, "straight": false, "out_mode": "out", "bounce": false }
        },
        "interactivity": {
            "detect_on": "canvas",
            "events": { "onhover": { "enable": true, "mode": "repulse" }, "onclick": { "enable": true, "mode": "push" }, "resize": true }
        },
        "retina_detect": true
    });
}

// --- Contact form (EmailJS) ---
const contactForm = document.getElementById('contact-form');
if (contactForm) {
    contactForm.noValidate = true;

    contactForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        if (!window.validateForm(contactForm)) return;

        const btn = contactForm.querySelector('.submit-btn-modern');
        const originalText = btn.innerHTML;
        btn.innerHTML = 'Sending... <i class="fas fa-spinner fa-spin"></i>';
        btn.disabled = true;

        try {
            if (typeof emailjs === 'undefined') throw new Error('EmailJS is not available');
            await emailjs.sendForm("service_6pn7qwl", "template_wgjs27o", contactForm, "ziJLHC6Y41VzbXq11");
            notify("Message sent successfully!", "success");
            contactForm.reset();
        } catch (error) {
            console.error('Contact form error:', error);
            notify("Failed to send message. Please try again.", "error");
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
}

// --- Homepage content that comes from the database ---
const projectsContainer = document.getElementById('projects-container');
const defaultProjectsHTML = projectsContainer ? projectsContainer.innerHTML : '';
const aboutColumn = document.querySelector('.about-text-col');
const defaultAboutHTML = aboutColumn ? aboutColumn.innerHTML : '';

function renderProjectCard(item) {
    const techTags = (item.techStack || '')
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)
        .map(t => `<span>${escapeHtml(t)}</span>`)
        .join('');

    const links = `
        ${item.liveLink ? `<a href="${escapeHtml(item.liveLink)}" target="_blank" class="btn-link"><i class="fas fa-external-link-alt"></i> View Project</a>` : ''}
        ${item.repoLink ? `<a href="${escapeHtml(item.repoLink)}" target="_blank" class="btn-link"><i class="fab fa-github"></i> Source Code</a>` : ''}
    `;

    return `
        <div class="project-card">
            <div class="card-image">
                <img src="${optimizedImage(item.url, 800)}" alt="${escapeHtml(item.title)}" loading="lazy" decoding="async">
            </div>
            <div class="card-content">
                <span class="project-tag">${escapeHtml(item.tag || 'Project')}</span>
                <h3>${escapeHtml(item.title)}</h3>
                <p>${escapeHtml(item.description || '')}</p>
                <div class="tech-stack">${techTags}</div>
                <div class="card-links">${links}</div>
            </div>
        </div>`;
}

const byId = (id) => document.getElementById(id);
const noCarousel = { refresh() {} };

const projectsCarousel = projectsContainer
    ? createCarousel(projectsContainer, { dotsEl: byId('projectsDots'), prevBtn: byId('projectsPrev'), nextBtn: byId('projectsNext') })
    : noCarousel;

// --- Technical Core / Creative Vision sliders ---
const technicalTrack = byId('technical-container');
const creativeTrack = byId('creative-container');
const defaultTechnicalHTML = technicalTrack ? technicalTrack.innerHTML : '';
const defaultCreativeHTML = creativeTrack ? creativeTrack.innerHTML : '';

const technicalCarousel = technicalTrack ? createCarousel(technicalTrack, { dotsEl: byId('technicalDots'), fadeEdges: true }) : noCarousel;
const creativeCarousel = creativeTrack ? createCarousel(creativeTrack, { dotsEl: byId('creativeDots'), fadeEdges: true }) : noCarousel;

const isExternalLink = (url) => /^https?:\/\//i.test(url) || /\.pdf$/i.test(url);
const safeIcon = (icon) => (/^[a-z0-9\- ]+$/i.test(icon || '') ? icon : 'fas fa-star');

function renderSkillCard(card, index) {
    const accent = `accent-${(index % 4) + 1}`;
    const url = card.linkUrl || '';
    const target = isExternalLink(url) ? ' target="_blank" rel="noopener"' : '';
    const link = url ? `<a href="${escapeHtml(url)}" class="view-cert"${target}>${escapeHtml(card.linkText || 'VIEW')}</a>` : '';
    const dataHref = url ? ` data-href="${escapeHtml(url)}"` : '';

    return `
        <div class="skill-card creative-glass-card ${accent}"${dataHref}>
            <div class="icon-box"><i class="${safeIcon(card.icon)}"></i></div>
            <h3 class="stylish-heading">${escapeHtml(card.title)}</h3>
            <p>${escapeHtml(card.description)}</p>
            ${link}
        </div>`;
}

function renderSkillCards(cards) {
    [
        ['technical', technicalTrack, defaultTechnicalHTML, technicalCarousel],
        ['creative', creativeTrack, defaultCreativeHTML, creativeCarousel],
    ].forEach(([section, track, defaultHTML, carousel]) => {
        if (!track) return;
        const list = cards.filter((card) => card.section === section);
        track.innerHTML = list.length ? list.map(renderSkillCard).join('') : defaultHTML;
        carousel.refresh();
    });
}

// Whole card is clickable (cards from the dashboard carry a data-href)
[technicalTrack, creativeTrack].forEach((track) => {
    if (!track) return;
    track.addEventListener('click', (event) => {
        const card = event.target.closest('.skill-card[data-href]');
        if (!card || event.target.closest('a')) return;
        const url = card.dataset.href;
        if (isExternalLink(url)) window.open(url, '_blank', 'noopener');
        else window.location.href = url;
    });
});

function renderProjects(data) {
    if (!projectsContainer) return;

    const projects = data.filter(item => item.category === 'Projects');
    if (projects.length === 0) {
        projectsContainer.innerHTML = defaultProjectsHTML;
    } else {
        const featured = projects.filter(item => item.featured);
        const shown = featured.length ? featured : projects.slice(0, 3);
        projectsContainer.innerHTML = shown.map(renderProjectCard).join('');
    }
    projectsCarousel.refresh();
}

function renderAboutPhoto(data) {
    const aboutPhoto = document.getElementById('about-photo');
    const aboutItem = data.find(item => item.category === 'About');
    if (aboutPhoto && aboutItem) aboutPhoto.src = optimizedImage(aboutItem.url, 700);
}

function renderAboutText(blocks) {
    if (!aboutColumn) return;
    aboutColumn.innerHTML = defaultAboutHTML;
    if (blocks.length === 0) return;

    const heading = blocks.find(b => b.kind === 'heading');
    if (heading) {
        const words = heading.text.trim().split(/\s+/);
        const lastWord = words.pop();
        document.getElementById('about-heading').innerHTML =
            `${escapeHtml(words.join(' '))} <span class="gradient-text">${escapeHtml(lastWord)}</span>`;
    }

    aboutColumn.querySelectorAll('p').forEach(p => p.remove());
    const grid = document.getElementById('about-details');
    blocks.filter(b => b.kind === 'paragraph').forEach(b => {
        const p = document.createElement('p');
        p.innerHTML = formatRichText(b.text);
        aboutColumn.insertBefore(p, grid);
    });

    grid.innerHTML = blocks.filter(b => b.kind === 'stat').map(b => `
        <div class="detail-item">
            <span class="detail-label">${escapeHtml(b.label)}</span>
            <span class="detail-value">${escapeHtml(b.text)}</span>
        </div>`).join('');
}

// --- Hero, contact and footer texts (editable in the dashboard) ---
// The text written in index.html is kept as the default for every field.
const defaultWords = [...words];
const defaultSettingText = {};
document.querySelectorAll('[data-setting]').forEach((el) => {
    defaultSettingText[el.dataset.setting] = el.dataset.setting === 'heroBullets' ? el.innerHTML : el.textContent;
});
document.querySelectorAll('a.linkedin, a.github, a.instagram').forEach((a) => { a.dataset.defaultHref = a.getAttribute('href'); });
document.querySelectorAll('a.mini-icon.email').forEach((a) => { a.dataset.defaultHref = a.getAttribute('href'); });

function applySettings(settings) {
    document.querySelectorAll('[data-setting]').forEach((el) => {
        const key = el.dataset.setting;
        if (key === 'heroBullets') {
            const lines = settings.heroBullets || [];
            el.innerHTML = lines.length ? lines.map((line) => `&bull; ${escapeHtml(line)}`).join('<br>') : defaultSettingText[key];
        } else {
            el.textContent = (settings[key] || '').trim() || defaultSettingText[key];
        }
    });

    const typingWords = (settings.typingWords || []).filter(Boolean);
    words.splice(0, words.length, ...(typingWords.length ? typingWords : defaultWords));
    if (wordIndex >= words.length) wordIndex = 0;

    ['linkedin', 'github', 'instagram'].forEach((network) => {
        document.querySelectorAll(`a.${network}`).forEach((a) => {
            a.setAttribute('href', (settings[network] || '').trim() || a.dataset.defaultHref || a.getAttribute('href'));
        });
    });
    document.querySelectorAll('a.mini-icon.email').forEach((a) => {
        const email = (settings.email || '').trim();
        a.setAttribute('href', email ? `mailto:${email}` : a.dataset.defaultHref);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    type();
    loadMedia((data) => { renderProjects(data); renderAboutPhoto(data); })
        .catch(error => console.error("Error loading homepage content:", error));
    loadSettings(applySettings)
        .catch(error => console.error("Error loading site settings:", error));
    loadSkillCards(renderSkillCards)
        .catch(error => console.error("Error loading skill cards:", error));
    loadAboutBlocks(renderAboutText)
        .catch(error => console.error("Error loading About content:", error));
});
