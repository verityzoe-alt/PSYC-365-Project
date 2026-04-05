(() => {
    const root = document.querySelector('[data-carousel="intro"]');
    if (!(root instanceof HTMLElement)) return;

    const items = Array.from(root.querySelectorAll('[data-carousel-item]'));
    const list = root.querySelector('[data-carousel-list]');
    const prevBtn = root.querySelector('[data-carousel-prev]');
    const nextBtn = root.querySelector('[data-carousel-next]');

    if (!list || !(prevBtn instanceof HTMLButtonElement) || !(nextBtn instanceof HTMLButtonElement)) return;
    if (items.length === 0) return;

    let index = items.findIndex((el) => el.classList.contains('is-active'));
    if (index < 0) index = 0;

    let isAnimating = false;

    const cleanupClasses = (el) => {
        el.classList.remove('is-entering-up', 'is-entering-down', 'is-leaving-up', 'is-leaving-down');
    };

    const updateButtons = () => {
        prevBtn.disabled = index === 0;
        nextBtn.disabled = index === items.length - 1;
    };

    const setIndex = (nextIndex) => {
        const clamped = Math.max(0, Math.min(items.length - 1, nextIndex));
        if (clamped === index) {
            updateButtons();
            return;
        }
        if (isAnimating) return;

        const direction = clamped > index ? 'down' : 'up';
        const current = items[index];
        const next = items[clamped];
        if (!current || !next) return;

        isAnimating = true;

        // Prepare next slide in an offset position.
        cleanupClasses(current);
        cleanupClasses(next);

        next.classList.add('is-active');
        next.classList.add(direction === 'down' ? 'is-entering-up' : 'is-entering-down');
        next.setAttribute('aria-hidden', 'false');

        // Force the browser to apply initial styles before animating.
        void next.offsetHeight;

        current.classList.add(direction === 'down' ? 'is-leaving-up' : 'is-leaving-down');
        next.classList.remove(direction === 'down' ? 'is-entering-up' : 'is-entering-down');

        const onDone = () => {
            current.classList.remove('is-active');
            current.setAttribute('aria-hidden', 'true');
            cleanupClasses(current);
            cleanupClasses(next);

            index = clamped;
            updateButtons();
            isAnimating = false;
        };

        // Use a single timeout as a robust end signal.
        window.setTimeout(onDone, 360);
    };

    // Initialize aria-hidden and buttons.
    items.forEach((el, i) => {
        el.setAttribute('aria-hidden', String(i !== index));
        el.classList.toggle('is-active', i === index);
        cleanupClasses(el);
    });
    updateButtons();

    prevBtn.addEventListener('click', () => setIndex(index - 1));
    nextBtn.addEventListener('click', () => setIndex(index + 1));

    // Scroll-to-advance (when hovering the carousel).
    let wheelLock = false;
    root.addEventListener(
        'wheel',
        (e) => {
            if (!(e instanceof WheelEvent)) return;
            if (wheelLock) return;

            // Only treat meaningful vertical scroll as navigation.
            if (Math.abs(e.deltaY) < 6) return;
            e.preventDefault();

            wheelLock = true;
            window.setTimeout(() => {
                wheelLock = false;
            }, 180);

            if (e.deltaY > 0) setIndex(index + 1);
            else setIndex(index - 1);
        },
        { passive: false }
    );

    // Keyboard support when focused inside.
    root.addEventListener('keydown', (e) => {
        if (!(e instanceof KeyboardEvent)) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setIndex(index + 1);
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setIndex(index - 1);
        }
    });
})();

(() => {
    const cards = Array.from(document.querySelectorAll('[data-flip-card]'));
    if (cards.length === 0) return;

    cards.forEach((btn) => {
        if (!(btn instanceof HTMLButtonElement)) return;

        btn.addEventListener('click', () => {
            const next = !btn.classList.contains('is-flipped');
            btn.classList.toggle('is-flipped', next);
            btn.setAttribute('aria-pressed', String(next));
        });
    });
})();
