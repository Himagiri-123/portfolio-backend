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
            .confirm-overlay {
                position: fixed; inset: 0; z-index: 10000; background: rgba(2,6,23,0.7);
                display: flex; align-items: center; justify-content: center; padding: 20px;
                backdrop-filter: blur(3px);
            }
            .confirm-box {
                background: #1e293b; color: #e2e8f0; border: 1px solid rgba(255,255,255,0.12);
                border-radius: 16px; padding: 24px; width: 100%; max-width: 360px; text-align: center;
                box-shadow: 0 20px 50px rgba(0,0,0,0.5);
            }
            .confirm-box p { margin-bottom: 20px; line-height: 1.5; font-size: 1rem; }
            .confirm-actions { display: flex; gap: 10px; }
            .confirm-actions button {
                flex: 1; padding: 11px; border: none; border-radius: 10px; cursor: pointer;
                font-size: 0.95rem; font-weight: 600; color: #fff;
            }
            .confirm-cancel { background: #475569; }
            .confirm-ok { background: linear-gradient(135deg, #dc2626, #ef4444); }
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

    // Styled replacement for the browser's native "Please fill out this field" bubble.
    // Returns true when the form is valid; otherwise shows a toast for the first problem.
    window.validateForm = function (form) {
        const field = Array.from(form.elements).find((el) => el.willValidate && !el.validity.valid);
        if (!field) return true;

        const labelEl = field.parentElement.querySelector('.floating-label, label');
        const label = ((labelEl && labelEl.textContent) || field.placeholder || field.name || 'this field').trim();
        const message = field.validity.typeMismatch && field.type === 'email'
            ? 'Please enter a valid email address.'
            : `Please fill in: ${label}`;

        window.showToast(message, 'error');
        field.focus();
        return false;
    };

    // Styled replacement for window.confirm(); resolves to true or false
    window.showConfirm = function (message, okLabel = 'Delete') {
        ensureStyles();
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'confirm-overlay';
            overlay.innerHTML = `
                <div class="confirm-box" role="dialog" aria-modal="true">
                    <p></p>
                    <div class="confirm-actions">
                        <button type="button" class="confirm-cancel">Cancel</button>
                        <button type="button" class="confirm-ok"></button>
                    </div>
                </div>`;
            overlay.querySelector('p').textContent = message;
            overlay.querySelector('.confirm-ok').textContent = okLabel;

            const finish = (result) => {
                document.removeEventListener('keydown', onKey);
                overlay.remove();
                resolve(result);
            };
            const onKey = (e) => { if (e.key === 'Escape') finish(false); };

            overlay.querySelector('.confirm-cancel').addEventListener('click', () => finish(false));
            overlay.querySelector('.confirm-ok').addEventListener('click', () => finish(true));
            overlay.addEventListener('click', (e) => { if (e.target === overlay) finish(false); });
            document.addEventListener('keydown', onKey);
            document.body.appendChild(overlay);
            overlay.querySelector('.confirm-ok').focus();
        });
    };
})();
