// Small UI helpers shared by several pages: pagination and sliders with dots.

// Draws "Prev 1 2 3 ... Next" into `container`. Hides itself when there is only one page.
function renderPager(container, { page, pages, onChange }) {
    container.innerHTML = '';
    container.hidden = pages <= 1;
    if (pages <= 1) return;

    const add = (label, target, { active = false, disabled = false, ariaLabel = '' } = {}) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.innerHTML = label;
        btn.className = active ? 'pager-btn active' : 'pager-btn';
        btn.disabled = disabled;
        if (ariaLabel) btn.setAttribute('aria-label', ariaLabel);
        if (!disabled && !active) btn.addEventListener('click', () => onChange(target));
        container.appendChild(btn);
    };

    add('<i class="fas fa-chevron-left"></i>', page - 1, { disabled: page === 1, ariaLabel: 'Previous page' });

    // Always show first, last, and the pages around the current one
    const visible = new Set([1, pages, page - 1, page, page + 1]);
    let previous = 0;
    for (let n = 1; n <= pages; n++) {
        if (!visible.has(n)) continue;
        if (n - previous > 1) {
            const gap = document.createElement('span');
            gap.className = 'pager-gap';
            gap.textContent = '...';
            container.appendChild(gap);
        }
        add(String(n), n, { active: n === page });
        previous = n;
    }

    add('<i class="fas fa-chevron-right"></i>', page + 1, { disabled: page === pages, ariaLabel: 'Next page' });
}

// Turns a scrollable row of cards into a slider: auto-slides, optional arrow buttons,
// and one dot per card (the current card's dot stretches into a short line).
// It only slides, and only shows arrows/dots, when there are more cards than fit.
function createCarousel(track, { dotsEl, prevBtn, nextBtn, intervalMs = 10000, fadeEdges = false } = {}) {
    let paused = false;
    let resumeTimer;

    const cards = () => Array.from(track.children);
    const hasOverflow = () => track.scrollWidth - track.clientWidth > 8;

    function stepSize() {
        const first = cards()[0];
        const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
        return first ? first.offsetWidth + gap : track.clientWidth;
    }

    function currentIndex() {
        const max = track.scrollWidth - track.clientWidth;
        if (track.scrollLeft >= max - 8) return cards().length - 1;
        return Math.round(track.scrollLeft / stepSize());
    }

    function goTo(index) {
        track.scrollTo({ left: index * stepSize() });
    }

    function slide(direction) {
        const max = track.scrollWidth - track.clientWidth;
        if (direction > 0 && track.scrollLeft >= max - 8) track.scrollTo({ left: 0 });
        else if (direction < 0 && track.scrollLeft <= 8) track.scrollTo({ left: max });
        else track.scrollBy({ left: direction * stepSize() });
    }

    // Cards that are cut off at an edge fade out softly instead of ending abruptly
    function updateFade() {
        if (!fadeEdges) return;
        const max = track.scrollWidth - track.clientWidth;
        track.classList.toggle('fade-left', max > 8 && track.scrollLeft > 8);
        track.classList.toggle('fade-right', max > 8 && track.scrollLeft < max - 8);
    }

    function updateDots() {
        updateFade();
        if (!dotsEl) return;
        const active = currentIndex();
        Array.from(dotsEl.children).forEach((dot, i) => dot.classList.toggle('active', i === active));
    }

    function buildDots() {
        if (prevBtn && nextBtn) prevBtn.hidden = nextBtn.hidden = !hasOverflow();
        if (!dotsEl) return;
        dotsEl.innerHTML = '';
        dotsEl.hidden = !hasOverflow();
        cards().forEach((card, i) => {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.setAttribute('aria-label', `Show card ${i + 1}`);
            dot.addEventListener('click', () => { goTo(i); pause(); resume(6000); });
            dotsEl.appendChild(dot);
        });
        updateDots();
    }

    function pause() { paused = true; clearTimeout(resumeTimer); }
    function resume(delay) { clearTimeout(resumeTimer); resumeTimer = setTimeout(() => { paused = false; }, delay); }

    if (prevBtn) prevBtn.addEventListener('click', () => { slide(-1); pause(); resume(6000); });
    if (nextBtn) nextBtn.addEventListener('click', () => { slide(1); pause(); resume(6000); });

    let scrollFrame;
    track.addEventListener('scroll', () => {
        cancelAnimationFrame(scrollFrame);
        scrollFrame = requestAnimationFrame(updateDots);
    }, { passive: true });
    window.addEventListener('resize', buildDots);

    track.addEventListener('mouseenter', pause);
    track.addEventListener('mouseleave', () => resume(0));
    track.addEventListener('touchstart', pause, { passive: true });
    track.addEventListener('touchend', () => resume(4000), { passive: true });

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setInterval(() => {
            if (!paused && !document.hidden && hasOverflow()) slide(1);
        }, intervalMs);
    }

    buildDots();

    // Call after the cards inside the track were replaced
    return {
        refresh() {
            track.scrollTo({ left: 0, behavior: 'instant' });
            buildDots();
        },
    };
}
