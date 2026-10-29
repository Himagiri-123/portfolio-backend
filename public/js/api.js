// Shared by every page: backend address, Cloudinary URL helpers and a cached media loader.
const API_BASE_URL = "https://himagiri-portfolio.onrender.com";
const MEDIA_CACHE_KEY = "mediaCache";
const ABOUT_CACHE_KEY = "aboutCache";
const SKILLS_CACHE_KEY = "skillsCache";

// Wake the free Render instance up while the visitor is still on the first page
fetch(`${API_BASE_URL}/health`, { mode: "no-cors" }).catch(() => {});

// Cloudinary serves a smaller, auto-formatted copy when transformations are added to the URL
function optimizedImage(url, width) {
    if (!url || !url.includes("/image/upload/")) return url;
    return url.replace("/image/upload/", `/image/upload/f_auto,q_auto,w_${width}/`);
}

// First frame of a Cloudinary video as a small JPG, used as the grid thumbnail
function videoPoster(url, width = 480) {
    if (!url || !url.includes("/video/upload/")) return "";
    return url
        .replace("/video/upload/", `/video/upload/so_0,f_jpg,q_auto,w_${width}/`)
        .replace(/\.[a-z0-9]+$/i, ".jpg");
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text == null ? "" : String(text);
    return div.innerHTML;
}

// Calls render() with cached data immediately (if any), then again with fresh data
// from the server when it differs. Repeat visits show content instantly.
async function loadCached(cacheKey, path, render) {
    let cachedRaw = null;
    try {
        cachedRaw = localStorage.getItem(cacheKey);
        if (cachedRaw) render(JSON.parse(cachedRaw));
    } catch (e) {
        cachedRaw = null;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${path}`);
        if (!response.ok) throw new Error(`Request failed: ${response.status}`);
        const freshRaw = JSON.stringify(await response.json());

        try { localStorage.setItem(cacheKey, freshRaw); } catch (e) { /* storage full or blocked */ }
        if (freshRaw !== cachedRaw) render(JSON.parse(freshRaw));
    } catch (error) {
        if (!cachedRaw) throw error;
    }
}

const loadMedia = (render) => loadCached(MEDIA_CACHE_KEY, "/api/get-media", render);
const loadAboutBlocks = (render) => loadCached(ABOUT_CACHE_KEY, "/api/about-blocks", render);
const loadSkillCards = (render) => loadCached(SKILLS_CACHE_KEY, "/api/skill-cards", render);

// Escapes HTML, then turns **bold** and *italic* into tags (used for About paragraphs)
function formatRichText(text) {
    return escapeHtml(text)
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>");
}
