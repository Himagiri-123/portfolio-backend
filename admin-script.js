// --- Global Variables ---
let currentTab = 'Photography';
let allMediaData = [];

// --- 1. Login Logic ---
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = document.getElementById('username').value;
        const pass = document.getElementById('password').value;

        if (user === "Him@giri" && pass === "444624474") {
            alert('Login Successful! Welcome Himagiri.');
            window.location.href = 'admin-dashboard.html';
        } else {
            alert('Access Denied! Invalid Credentials.');
            document.getElementById('password').value = ''; 
        }
    });
}

// --- 2. Forgot Password Logic (New Security Question) ---
function forgotPassword() {
    // సెక్యూరిటీ ప్రశ్న అడుగుతుంది
    const answer = prompt("Security Question: What is your childhood nickname?");
    
    // యూజర్ ఏమీ టైప్ చేయకపోయినా లేదా క్యాన్సిల్ చేసినా
    if (!answer) return;

    // జవాబు చెక్ చేయడం (Small letters or Capital letters accepted)
    if (answer.toLowerCase() === "raju") {
        alert("Correct Answer! ✅\n\nYour Password is: 444624474\n\nPlease login now.");
    } else {
        alert("Wrong Answer! ❌\n\nAccess Denied.");
    }
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

        if (tabName === 'Projects') {
            projectFields.style.display = 'block';
        } else {
            projectFields.style.display = 'none';
        }

        renderGrid();
    }

    navPhotos.addEventListener('click', () => switchTab('Photography', 'Manage Photography'));
    navVideos.addEventListener('click', () => switchTab('Videos', 'Manage Videos'));
    navProjects.addEventListener('click', () => switchTab('Projects', 'Manage Projects'));
}

// --- 4. Upload Logic ---
const uploadForm = document.getElementById('uploadForm');
if (uploadForm) {
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = document.querySelector('.submit-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = "Uploading... ⏳";
        
        const fileInput = document.getElementById('mediaFile');
        const titleInput = document.getElementById('mediaTitle');
        const file = fileInput.files[0];

        if (!file) { alert("Please select a file!"); submitBtn.innerHTML = originalText; return; }

        let type = 'image';
        if (file.type.includes('video')) type = 'video';
        if (currentTab === 'Projects') type = 'project';

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'himagiri_preset');

        try {
            const cloudUrl = `https://api.cloudinary.com/v1_1/dlwzq8sbe/${type === 'video' ? 'video' : 'image'}/upload`;
            const response = await fetch(cloudUrl, { method: 'POST', body: formData });
            const data = await response.json();

            if (data.secure_url) {
                const payload = {
                    title: titleInput.value,
                    url: data.secure_url,
                    mediaType: type,
                    category: currentTab
                };

                if (currentTab === 'Projects') {
                    payload.description = document.getElementById('projDesc').value;
                    payload.techStack = document.getElementById('projTech').value;
                    payload.liveLink = document.getElementById('projLive').value;
                    payload.repoLink = document.getElementById('projRepo').value;
                }

                await fetch('http://localhost:5000/api/upload-media', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                alert("Upload Successful! 🎉");
                submitBtn.innerHTML = originalText;
                uploadForm.reset();
                loadAdminPhotos();
            }
        } catch (err) {
            alert("Upload failed: " + err.message);
            submitBtn.innerHTML = originalText;
        }
    });
}

// --- 5. Fetch & Render ---
async function loadAdminPhotos() {
    const grid = document.querySelector('.preview-grid');
    if (!grid) return;

    try {
        const response = await fetch('http://localhost:5000/api/get-media');
        allMediaData = await response.json();
        renderGrid();
    } catch (error) { console.error(error); }
}

function renderGrid() {
    const grid = document.querySelector('.preview-grid');
    if (!grid) return;
    grid.innerHTML = "";

    const filteredData = allMediaData.filter(item => {
        if (currentTab === 'Photography') return item.category === 'Photography';
        if (currentTab === 'Videos') return item.category === 'Videos';
        if (currentTab === 'Projects') return item.category === 'Projects';
        return false;
    });

    if (filteredData.length === 0) {
        grid.innerHTML = `<p style="color:#64748b;">No ${currentTab} found.</p>`;
        return;
    }

    filteredData.forEach(item => {
        let mediaEl = `<img src="${item.url}" style="width:100%; height:120px; object-fit:cover;">`;
        if (item.mediaType === 'video') mediaEl = `<video src="${item.url}" style="width:100%; height:120px; object-fit:cover;"></video>`;

        grid.innerHTML += `
            <div class="preview-item">
                ${mediaEl}
                <div class="item-info">
                    <span>${item.title}</span>
                    <button class="delete-btn" onclick="deletePhoto('${item._id}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>`;
    });
}

async function deletePhoto(id) {
    if (confirm("Delete this?")) {
        await fetch(`http://localhost:5000/api/delete-media/${id}`, { method: 'DELETE' });
        loadAdminPhotos();
    }
}

document.addEventListener("DOMContentLoaded", loadAdminPhotos);