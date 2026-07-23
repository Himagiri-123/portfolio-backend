// A tiny, dependency-free toast/notification helper.
// Call window.showToast(message, type, durationMs) from any page instead of
// the default browser alert() - it looks like part of the site instead of a
// generic system popup.
//
// type: 'success' | 'error' | 'info'  (default: 'info')

(function () {
    function ensureStyles() {
        if (document.getElementById('toast-styles')) return;
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            #toast-container {
                position: fixed; top: 24px; left: 50%; transform: translateX(-50%);
                z-index: 9999; display: flex; flex-direction: column; gap: 10px;
                align-items: center; pointer-events: none;
            }
            .toast {
                min-width: 260px; max-width: 90vw; padding: 14px 20px;
                border-radius: 10px; color: #fff; font-size: 0.95rem;
                box-shadow: 0 8px 24px rgba(0,0,0,0.35);
                opacity: 0; transform: translateY(-12px);
                transition: opacity 0.25s ease, transform 0.25s ease;
                display: flex; align-items: center; gap: 10px;
                pointer-events: auto;
            }
            .toast.show { opacity: 1; transform: translateY(0); }
            .toast-success { background: linear-gradient(135deg, #059669, #10b981); }
            .toast-error   { background: linear-gradient(135deg, #dc2626, #ef4444); }
            .toast-info    { background: linear-gradient(135deg, #0284c7, #38bdf8); }
        `;
        document.head.appendChild(style);
    }

    function ensureContainer() {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    window.showToast = function (message, type = 'info', duration = 3500) {
        ensureStyles();
        const container = ensureContainer();

        const icons = { success: '✅', error: '⚠️', info: 'ℹ️' };
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<span>${icons[type] || ''}</span><span>${message}</span>`;
        container.appendChild(toast);

        requestAnimationFrame(() => toast.classList.add('show'));

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    };
})();
