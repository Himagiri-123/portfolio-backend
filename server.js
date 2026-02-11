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
            alert("Message Sent Successfully! 🎉");
            btn.innerHTML = originalText;
            document.getElementById('contact-form').reset();
        }, function(error) {
            alert("Failed to send message.");
            btn.innerHTML = originalText;
            console.log('FAILED...', error); 
        });
});

// --- NEW: Fetch Projects from Live Server (Render) ---
// ఈ కోడ్ వల్ల మీ వెబ్‌సైట్ ఓపెన్ చేయగానే అడ్మిన్ ప్యానెల్‌లో అప్‌లోడ్ చేసినవి ఇక్కడ కనిపిస్తాయి.
const API_URL = "https://himagiri-portfolio.onrender.com/api/get-media";

async function loadPortfolioContent() {
    // మీ HTML లో projects లేదా gallery కి సంబంధించిన ID ఉంటే ఇది పని చేస్తుంది
    // ఉదాహరణకు: <div id="projects-container"></div>
    const container = document.getElementById('projects-container'); 
    if (!container) return; // కంటైనర్ లేకపోతే ఆగిపోతుంది

    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        container.innerHTML = ''; // పాతవి క్లియర్ చేయడం
        data.forEach(item => {
            // ఇక్కడ మీ డిజైన్ ప్రకారం HTML వస్తుంది
            const card = `
                <div class="project-card">
                    <img src="${item.url}" alt="${item.title}">
                    <h3>${item.title}</h3>
                </div>`;
            container.innerHTML += card;
        });
    } catch (error) {
        console.error("Error loading portfolio:", error);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    type();
    loadPortfolioContent(); // డేటా లోడ్ అవుతుంది
    console.log("Portfolio Interactions Loaded!");
});