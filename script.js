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

document.addEventListener("DOMContentLoaded", () => {
    type();
    console.log("Portfolio Interactions Loaded!");
});

// --- Particles Background Logic ---
// ఇది index.html లో particles.js లోడ్ అయితేనే రన్ అవుతుంది
if (document.getElementById('particles-js')) {
    particlesJS("particles-js", {
        "particles": {
            "number": {
                "value": 80, // చుక్కల సంఖ్య
                "density": { "enable": true, "value_area": 800 }
            },
            "color": { "value": "#00d2ff" }, // మీ థీమ్ కలర్ (Cyan)
            "shape": {
                "type": "circle",
                "stroke": { "width": 0, "color": "#000000" }
            },
            "opacity": {
                "value": 0.5,
                "random": false
            },
            "size": {
                "value": 3,
                "random": true
            },
            "line_linked": {
                "enable": true,
                "distance": 150,
                "color": "#00d2ff", // లైన్స్ కలర్
                "opacity": 0.4,
                "width": 1
            },
            "move": {
                "enable": true,
                "speed": 4, // కదిలే స్పీడ్
                "direction": "none",
                "random": false,
                "straight": false,
                "out_mode": "out",
                "bounce": false
            }
        },
        "interactivity": {
            "detect_on": "canvas",
            "events": {
                "onhover": { "enable": true, "mode": "repulse" }, // మౌస్ పెడితే దూరంగా జరుగుతాయి
                "onclick": { "enable": true, "mode": "push" },
                "resize": true
            }
        },
        "retina_detect": true
    });
}

document.getElementById('contact-form').addEventListener('submit', function(event) {
    event.preventDefault(); // పేజీ రీఫ్రెష్ అవ్వకుండా ఆపుతుంది

    // కొత్త బటన్ క్లాస్ పేరు ఇక్కడ మార్చాము (.submit-btn-modern)
    const btn = document.querySelector('.submit-btn-modern');
    const originalText = btn.innerHTML;
    
    // లోడింగ్ ఎఫెక్ట్
    btn.innerHTML = 'Sending... <i class="fas fa-spinner fa-spin"></i>';

    // --- మీ వివరాలు ఇక్కడ ఉన్నాయి (వీటిని మార్చకండి) ---
    const serviceID = "service_6pn7qwl";   // <-- మీ సర్వీస్ ఐడి
    const templateID = "template_wgjs27o"; // <-- మీ టెంప్లేట్ ఐడి
    const publicKey = "ziJLHC6Y41VzbXq11";   // <-- మీ పబ్లిక్ కీ

    emailjs.sendForm(serviceID, templateID, this, publicKey)
        .then(function() {
            // సక్సెస్ అయితే
            alert("Message Sent Successfully! 🎉");
            btn.innerHTML = originalText;
            document.getElementById('contact-form').reset(); // ఫామ్ క్లియర్ అవుతుంది
        }, function(error) {
            // ఫెయిల్ అయితే
            alert("Failed to send message. Please check console.");
            btn.innerHTML = originalText;
            console.log('FAILED...', error); 
        });
});


const API_URL = "https://himagiri-portfolio.onrender.com/api/get-media";

async function loadSkillsMedia() {
    const photoContainer = document.getElementById('skills-photography-container');
    const videoContainer = document.getElementById('skills-video-container');
    
    if (!photoContainer || !videoContainer) return;

    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        photoContainer.innerHTML = '';
        videoContainer.innerHTML = '';

        data.forEach(item => {
            const mediaItem = document.createElement('div');
            mediaItem.className = 'skill-preview-item';

            if (item.category === 'Photography' && item.mediaType === 'image') {
                mediaItem.innerHTML = `<img src="${item.url}" alt="${item.title}" title="${item.title}">`;
                photoContainer.appendChild(mediaItem);
            } 
            else if (item.category === 'Videos' || item.mediaType === 'video') {
                mediaItem.innerHTML = `<video src="${item.url}" muted loop onmouseover="this.play()" onmouseout="this.pause()"></video>`;
                videoContainer.appendChild(mediaItem);
            }
        });
    } catch (error) {
        console.error("Error loading skills media:", error);
    }
}

// పేజీ లోడ్ అవ్వగానే రన్ అవుతుంది
document.addEventListener("DOMContentLoaded", () => {
    type(); // మీ పాత టైపింగ్ లాజిక్
    loadSkillsMedia(); // కొత్త స్కిల్స్ మీడియా లాజిక్
});