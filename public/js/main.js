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
if (document.getElementById('particles-js')) {
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
// Frontend (Vercel) and backend (Render) are separate domains, so this
// points at the full Render URL explicitly.
const API_URL = "https://himagiri-portfolio.onrender.com/api/get-media";

// The 3 project-cards already written in index.html act as the default
// fallback. If the admin has marked any projects as "featured" in the
// dashboard, those replace the defaults here (max 3 shown). If none are
// marked featured yet (or the request fails), the defaults stay untouched.
async function loadPortfolioContent() {
    const container = document.getElementById('projects-container');
    if (!container) return;

    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        const featuredProjects = data
            .filter(item => item.category === 'Projects' && item.featured)
            .slice(0, 3);

        if (featuredProjects.length === 0) return; // keep the default 3 cards

        container.innerHTML = featuredProjects.map(item => {
            const techTags = (item.techStack || '')
                .split(',')
                .map(t => t.trim())
                .filter(Boolean)
                .map(t => `<span>${t}</span>`)
                .join('');

            const links = `
                ${item.liveLink ? `<a href="${item.liveLink}" target="_blank" class="btn-link"><i class="fas fa-external-link-alt"></i> View Project</a>` : ''}
                ${item.repoLink ? `<a href="${item.repoLink}" target="_blank" class="btn-link"><i class="fab fa-github"></i> Source Code</a>` : ''}
            `;

            return `
                <div class="project-card">
                    <div class="card-image">
                        <img src="${item.url}" alt="${item.title}">
                    </div>
                    <div class="card-content">
                        <span class="project-tag">Project</span>
                        <h3>${item.title}</h3>
                        <p>${item.description || ''}</p>
                        <div class="tech-stack">${techTags}</div>
                        <div class="card-links">${links}</div>
                    </div>
                </div>`;
        }).join('');
    } catch (error) {
        console.error("Error loading featured projects:", error);
        // Fetch failed - the default 3 cards already in the HTML stay as-is.
    }
}

document.addEventListener("DOMContentLoaded", () => {
    type();
    loadPortfolioContent(); // డేటా లోడ్ అవుతుంది
    console.log("Portfolio Interactions Loaded!");
});