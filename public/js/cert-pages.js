// Adds the Small / Medium / Large switcher and pagination to a certificates page
(() => {
    const grid = document.querySelector('.cert-grid');
    if (!grid) return;

    const cards = Array.from(grid.querySelectorAll('.sub-card'));
    const PAGE_SIZES = { small: 12, medium: 6, large: 4 };
    let view = localStorage.getItem('certView');
    if (!PAGE_SIZES[view]) view = 'medium';
    let page = 1;

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

    bar.addEventListener('click', (event) => {
        const btn = event.target.closest('button[data-view]');
        if (!btn) return;
        view = btn.dataset.view;
        page = 1;
        try { localStorage.setItem('certView', view); } catch (e) { /* storage blocked */ }
        render();
    });

    render();
})();
