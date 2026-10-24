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

// --- EmailJS Logic ---
document.getElementById('contact-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const btn = document.querySelector('.submit-btn-modern');
    const originalText = btn.innerHTML;
    btn.innerHTML = 'Sending... <i class="fas fa-spinner fa-spin"></i>';

    const serviceID = "service_6pn7qwl"; 
    const templateID = "template_wgjs27o";
    const publicKey = "ziJLHC6Y41VzbXq11";

    emailjs.sendForm(serviceID, templateID, this, publicKey)
        .then(function() {
            notify("Message sent successfully!", "success");
            btn.innerHTML = originalText;
            document.getElementById('contact-form').reset();
        }, function(error) {
            notify("Failed to send message. Please try again.", "error");
            btn.innerHTML = originalText;
            console.log('FAILED...', error); 
        });
});

// --- Homepage "Selected Professional Projects" ---
// Homepage content that comes from the database: featured projects and the About photo.
// The 3 project cards written in index.html are the default shown when nothing is featured.
const projectsContainer = document.getElementById('projects-container');
const defaultProjectsHTML = projectsContainer ? projectsContainer.innerHTML : '';

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
                <span class="project-tag">Project</span>
                <h3>${escapeHtml(item.title)}</h3>
                <p>${escapeHtml(item.description || '')}</p>
                <div class="tech-stack">${techTags}</div>
                <div class="card-links">${links}</div>
            </div>
        </div>`;
}

function renderHomepageContent(data) {
    if (projectsContainer) {
        const featured = data.filter(item => item.category === 'Projects' && item.featured).slice(0, 3);
        projectsContainer.innerHTML = featured.length ? featured.map(renderProjectCard).join('') : defaultProjectsHTML;
    }

    const aboutPhoto = document.getElementById('about-photo');
    const aboutItem = data.find(item => item.category === 'About');
    if (aboutPhoto && aboutItem) aboutPhoto.src = optimizedImage(aboutItem.url, 700);
}

document.addEventListener("DOMContentLoaded", () => {
    type();
    loadMedia(renderHomepageContent).catch(error => console.error("Error loading homepage content:", error));
});
