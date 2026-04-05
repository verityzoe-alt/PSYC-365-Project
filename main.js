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

(() => {
    const root = document.querySelector('[data-timeline]');
    if (!(root instanceof HTMLElement)) return;

    const track = root.querySelector('.timeline-track');
    const updateLine = () => {
        if (!(track instanceof HTMLElement)) return;
        const startX = getPointCenterX('arrival');
        const endX = getPointCenterX('finalSurveys');
        if (startX == null || endX == null) return;

        const left = Math.min(startX, endX);
        const width = Math.max(0, Math.abs(endX - startX));
        root.style.setProperty('--timeline-line-left', `${left}px`);
        root.style.setProperty('--timeline-line-width', `${width}px`);
    };

    const overlaysHost = root.querySelector('.timeline-overlays');
    const getPointCenterX = (pointKey) => {
        if (!(track instanceof HTMLElement)) return null;
        const el = track.querySelector(`[data-timeline-point="${pointKey}"]`);
        if (!(el instanceof HTMLElement)) return null;

        const trackRect = track.getBoundingClientRect();
        const dot = el.querySelector('.timeline-dot');

        if (dot instanceof HTMLElement) {
            const dotRect = dot.getBoundingClientRect();
            return dotRect.left - trackRect.left + dotRect.width / 2;
        }

        const elRect = el.getBoundingClientRect();
        return elRect.left - trackRect.left + elRect.width / 2;
    };

    const updateOverlays = () => {
        if (!(overlaysHost instanceof HTMLElement)) return;

        const x1 = getPointCenterX('emotion1');
        const x2 = getPointCenterX('emotion2');
        const x55 = getPointCenterX('marker55');
        if (x1 == null || x2 == null || x55 == null) return;

        const left = Math.min(x1, x2);
        const right = Math.max(x1, x2);
        const gapWidth = Math.max(0, right - left);

        const bracket = overlaysHost.querySelector('[data-overlay="music"]');
        if (bracket instanceof HTMLElement) {
            const bracketInset = 8;
            bracket.style.left = `${left + bracketInset}px`;
            bracket.style.width = `${Math.max(0, gapWidth - bracketInset * 2)}px`;
        }

        const surveysBracket = overlaysHost.querySelector('[data-overlay="surveys"]');
        if (surveysBracket instanceof HTMLElement) {
            const surveysLeft = x1;
            const surveysRight = x55;
            const width = Math.max(0, surveysRight - surveysLeft);
            const inset = 8;
            surveysBracket.style.left = `${surveysLeft + inset}px`;
            surveysBracket.style.width = `${Math.max(0, width - inset * 2)}px`;
        }
    };

    const triggers = Array.from(root.querySelectorAll('[data-timeline-trigger]')).filter(
        (el) => el instanceof HTMLButtonElement
    );
    const panels = Array.from(root.querySelectorAll('[data-timeline-panel]')).filter(
        (el) => el instanceof HTMLElement
    );

    if (triggers.length === 0 || panels.length === 0) return;

    const setActive = (key) => {
        triggers.forEach((btn) => {
            const isActive = btn.getAttribute('data-timeline-trigger') === key;
            btn.classList.toggle('is-active', isActive);
            btn.setAttribute('aria-expanded', isActive ? 'true' : 'false');
        });

        panels.forEach((panel) => {
            const isActive = panel.getAttribute('data-timeline-panel') === key;
            panel.classList.toggle('is-active', isActive);
            panel.hidden = !isActive;
        });
    };

    triggers.forEach((btn) => {
        btn.addEventListener('click', () => {
            const key = btn.getAttribute('data-timeline-trigger');
            if (!key) return;
            setActive(key);
        });
    });

    const initiallyActive = triggers.find((btn) => btn.getAttribute('aria-expanded') === 'true');
    const initialKey =
        initiallyActive?.getAttribute('data-timeline-trigger') || triggers[0].getAttribute('data-timeline-trigger');
    updateLine();
    updateOverlays();
    window.addEventListener('resize', () => {
        updateLine();
        updateOverlays();
    });
    if (initialKey) setActive(initialKey);

    // One more pass after fonts/layout settle.
    window.setTimeout(() => {
        updateLine();
        updateOverlays();
    }, 60);
})();
