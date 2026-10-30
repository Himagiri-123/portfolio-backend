// Certificates pages: loads certificates from the dashboard (the cards written in the
// HTML are the fallback), then adds the Small / Medium / Large switcher and pagination.
(() => {
    const grid = document.querySelector('.cert-grid');
    if (!grid) return;

    const group = (document.body.dataset.group || new URLSearchParams(window.location.search).get('group') || '').trim();
    const defaultHTML = grid.innerHTML;
    const PAGE_SIZES = { small: 12, medium: 6, large: 4 };
    let view = localStorage.getItem('certView');
    if (!PAGE_SIZES[view]) view = 'medium';
    let page = 1;
    let cards = Array.from(grid.querySelectorAll('.sub-card'));

    const bar = document.createElement('div');
    bar.className = 'view-switch';
    bar.innerHTML = `
        <button type="button" data-view="small"><i class="fas fa-th"></i> Small</button>
        <button type="button" data-view="medium"><i class="fas fa-th-large"></i> Medium</button>
        <button type="button" data-view="large"><i class="fas fa-square"></i> Large</button>`;
    const pager = document.createElement('div');
    pager.className = 'pager';
    grid.before(bar);
    grid.after(pager);

    function render() {
        grid.className = `cert-grid view-${view}`;
        const size = PAGE_SIZES[view];
        const pages = Math.max(1, Math.ceil(cards.length / size));
        page = Math.min(page, pages);

        cards.forEach((card, i) => { card.hidden = i < (page - 1) * size || i >= page * size; });
        bar.querySelectorAll('button').forEach((btn) => btn.classList.toggle('active', btn.dataset.view === view));

        renderPager(pager, {
            page,
            pages,
            onChange: (next) => { page = next; render(); bar.scrollIntoView({ behavior: 'smooth' }); },
        });
    }

    function renderCertificates(all) {
        const mine = all.filter((c) => c.group.toLowerCase() === group.toLowerCase());
        grid.innerHTML = mine.length
            ? mine.map((c) => `
                <div class="sub-card">
                    <i class="${/^[a-z0-9\- ]+$/i.test(c.icon || '') ? c.icon : 'fas fa-certificate'}"></i>
                    <h3>${escapeHtml(c.title)}</h3>
                    <p>${escapeHtml(c.description)}</p>
                    ${c.url ? `<a href="${escapeHtml(c.url)}" target="_blank" rel="noopener" class="view-btn">View Certificate</a>` : ''}
                </div>`).join('')
            : defaultHTML;

        if (!grid.innerHTML.trim()) grid.innerHTML = '<p style="grid-column:1/-1; text-align:center; color:#94a3b8;">No certificates added yet.</p>';
        cards = Array.from(grid.querySelectorAll('.sub-card'));
        page = 1;
        render();
    }

    bar.addEventListener('click', (event) => {
        const btn = event.target.closest('button[data-view]');
        if (!btn) return;
        view = btn.dataset.view;
        page = 1;
        try { localStorage.setItem('certView', view); } catch (e) { /* storage blocked */ }
        render();
    });

    // Pages without a fixed group (certificates.html?group=Python) show the group name
    if (!document.body.dataset.group && group) {
        const heading = document.querySelector('header h1');
        const sub = document.querySelector('header p');
        if (heading) heading.textContent = `${group} Certificates`;
        if (sub) sub.textContent = `My ${group} learning journey.`;
        document.title = `${group} Certificates - Himagiri`;
    }

    render();
    loadCertificates(renderCertificates).catch((error) => console.error('Error loading certificates:', error));
})();
