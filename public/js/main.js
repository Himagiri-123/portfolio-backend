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
const words = ["MERN Stack Developer", "Photographer", "Video Editor"];
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

// Auto-sliding carousel: one card per view on phones, three on desktop.
// It only slides (and shows arrows) when there are more cards than fit.
function initProjectsCarousel() {
    const track = projectsContainer;
    const prevBtn = document.getElementById('projectsPrev');
    const nextBtn = document.getElementById('projectsNext');
    if (!track || !prevBtn || !nextBtn) return { refresh() {} };

    const AUTO_SLIDE_MS = 10000;
    let paused = false;

    const hasOverflow = () => track.scrollWidth - track.clientWidth > 8;

    function stepSize() {
        const card = track.querySelector('.project-card');
        const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
        return card ? card.offsetWidth + gap : track.clientWidth;
    }

    function slide(direction) {
        const max = track.scrollWidth - track.clientWidth;
        if (direction > 0 && track.scrollLeft >= max - 8) track.scrollTo({ left: 0 });
        else if (direction < 0 && track.scrollLeft <= 8) track.scrollTo({ left: max });
        else track.scrollBy({ left: direction * stepSize() });
    }

    function updateArrows() {
        prevBtn.hidden = nextBtn.hidden = !hasOverflow();
    }

    prevBtn.addEventListener('click', () => slide(-1));
    nextBtn.addEventListener('click', () => slide(1));
    window.addEventListener('resize', updateArrows);

    // Pause while the visitor is interacting; resume shortly after
    let resumeTimer;
    const pause = () => { paused = true; clearTimeout(resumeTimer); };
    const resume = (delay) => { clearTimeout(resumeTimer); resumeTimer = setTimeout(() => { paused = false; }, delay); };
    track.addEventListener('mouseenter', pause);
    track.addEventListener('mouseleave', () => resume(0));
    track.addEventListener('touchstart', pause, { passive: true });
    track.addEventListener('touchend', () => resume(4000), { passive: true });

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduceMotion) {
        setInterval(() => {
            if (!paused && !document.hidden && hasOverflow()) slide(1);
        }, AUTO_SLIDE_MS);
    }

    return {
        refresh() {
            track.scrollTo({ left: 0, behavior: 'instant' });
            updateArrows();
        },
    };
}

const projectsCarousel = initProjectsCarousel();

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

document.addEventListener("DOMContentLoaded", () => {
    type();
    loadMedia((data) => { renderProjects(data); renderAboutPhoto(data); })
        .catch(error => console.error("Error loading homepage content:", error));
    loadAboutBlocks(renderAboutText)
        .catch(error => console.error("Error loading About content:", error));
});
