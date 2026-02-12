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

// --- EmailJS Logic ---
document.getElementById('contact-form')?.addEventListener('submit', function(event) {
    event.preventDefault(); // పేజీ రీఫ్రెష్ అవ్వకుండా ఆపుతుంది

    const btn = document.querySelector('.submit-btn-modern');
    const originalText = btn.innerHTML;
    
    // లోడింగ్ ఎఫెక్ట్
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
            alert("Failed to send message. Please check console.");
            btn.innerHTML = originalText;
            console.log('FAILED...', error); 
        });
});

document.addEventListener("DOMContentLoaded", () => {
    type();
    console.log("Portfolio Interactions Loaded!");
    
    // Particles JS Logic
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
                "events": {
                    "onhover": { "enable": true, "mode": "repulse" },
                    "onclick": { "enable": true, "mode": "push" },
                    "resize": true
                }
            },
            "retina_detect": true
        });
    }
});