(() => {
    const root = document.querySelector('[data-carousel="intro"]');
    if (!(root instanceof HTMLElement)) return;

    const items = Array.from(root.querySelectorAll('[data-carousel-item]'));
    const list = root.querySelector('[data-carousel-list]');
    const nextBtn = root.querySelector('[data-carousel-next]');

    if (!list || !(nextBtn instanceof HTMLButtonElement)) return;
    if (items.length === 0) return;

    // Unrolling model: N items are revealed and stay on screen.
    let revealedCount = 1;

    const updateButtons = () => {
        const isDone = revealedCount >= items.length;
        nextBtn.hidden = isDone;
        nextBtn.disabled = isDone;
        nextBtn.setAttribute('aria-hidden', String(isDone));
    };

    const syncAriaHidden = () => {
        items.forEach((el, i) => {
            const isRevealed = i < revealedCount;
            el.setAttribute('aria-hidden', String(!isRevealed));
        });
    };

    const setRevealedCount = (nextCount) => {
        const next = Math.max(1, Math.min(items.length, nextCount));
        if (next <= revealedCount) return; // no roll-up

        const prev = revealedCount;
        revealedCount = next;

        // Reveal only: unhide + animate open
        for (let i = prev; i < next; i += 1) {
            const el = items[i];
            if (!el) continue;
            el.hidden = false;
            el.classList.remove('is-revealed');
            window.requestAnimationFrame(() => {
                if (i < revealedCount) el.classList.add('is-revealed');
            });
        }

        syncAriaHidden();
        updateButtons();
    };

    // Initialize.
    const initialIndex = Math.max(0, items.findIndex((el) => el.classList.contains('is-active')));
    revealedCount = Math.max(1, initialIndex + 1);
    items.forEach((el, i) => {
        const isRevealed = i < revealedCount;
        el.hidden = !isRevealed;
        el.classList.toggle('is-revealed', isRevealed);
    });
    syncAriaHidden();
    updateButtons();

    nextBtn.addEventListener('click', () => setRevealedCount(revealedCount + 1));

    // Keyboard support when focused inside.
    root.addEventListener('keydown', (e) => {
        if (!(e instanceof KeyboardEvent)) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setRevealedCount(revealedCount + 1);
        }
    });
})();

(() => {
    const TERM_DEFS = new Map([
        ['emotional arousal hypothesis', 'The hypothesis that post-encoding emotional arousal trigger norepinephrine and cortisol release, which modulate memory via the hippocampus and basolateral amygdala.'],
        ['Yerkes-Dodson law', 'Cognitive performance peaks at moderate arousal but declines if arousal is too high or low, resembling an inverted U-shape curve.'],
        ['pattern separation', 'A hippocampal process that keeps similar experiences distinct (supports detailed discrimination).'],
        ['pattern completion', 'A process that fills in missing information to recognize something as familiar (supports gist/general recognition).'],
        ['mnemonic discrimination tasks (MDTs)', 'A long-term episodic memory task that include “lure” stimuli in the testing phase.'],
    ]);

    const ROOT_SELECTORS = [
        '.intro-point p',
    ];

    const normalize = (text) =>
        text
            .toLowerCase()
            .replace(/[“”"']/g, '')
            .replace(/\s+/g, ' ')
            .replace(/\s*\([^)]*\)\s*/g, ' ') // drop parenthetical abbreviations like (MDTs)
            .replace(/\s+/g, ' ')
            .trim();

    const findDefinitionForStrong = (strongEl) => {
        const raw = (strongEl.textContent || '').trim();
        if (!raw) return null;

        // Common case: headings like "No “One-Size-Fits-All”:" → strip trailing punctuation.
        const cleaned = raw.replace(/[:.]+\s*$/g, '').trim();
        const key = normalize(cleaned);

        for (const [term, def] of TERM_DEFS.entries()) {
            if (normalize(term) === key) return { term: cleaned, def };
        }
        return null;
    };

    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.setAttribute('role', 'tooltip');
    tooltip.setAttribute('aria-hidden', 'true');
    document.body.appendChild(tooltip);

    const tooltipId = 'tooltip-' + Math.random().toString(16).slice(2);
    tooltip.id = tooltipId;

    let activeEl = null;
    let activeAnchorX = null;

    const placeTooltip = (target, anchorX = null) => {
        const rect = target.getBoundingClientRect();
        const margin = 10;

        // Reset position so measurement isn't affected by previous clamp.
        tooltip.style.left = '0px';
        tooltip.style.top = '0px';

        // Measure after un-hiding
        const tipRect = tooltip.getBoundingClientRect();

        const anchor = typeof anchorX === 'number' ? anchorX : rect.left + rect.width / 2;
        const centeredLeft = anchor - tipRect.width / 2;
        const clampedLeft = Math.max(margin, Math.min(centeredLeft, window.innerWidth - tipRect.width - margin));

        const aboveTop = rect.top - tipRect.height - margin;
        const belowTop = rect.bottom + margin;

        const placeAbove = aboveTop >= margin;
        const top = placeAbove ? aboveTop : Math.min(belowTop, window.innerHeight - tipRect.height - margin);

        tooltip.style.left = `${Math.round(clampedLeft)}px`;
        tooltip.style.top = `${Math.round(top)}px`;

        // Arrow
        const arrowSize = 10;
        const arrowCenter = anchor;
        const arrowLeft = Math.max(
            14,
            Math.min(arrowCenter - clampedLeft - arrowSize / 2, tipRect.width - 24)
        );
        tooltip.style.setProperty('--arrow-left', `${Math.round(arrowLeft)}px`);
        tooltip.style.setProperty('--arrow-top', placeAbove ? `${tipRect.height - 6}px` : `-6px`);
        tooltip.style.setProperty('--arrow-rotate', placeAbove ? '225deg' : '45deg');

        tooltip.style.setProperty('--arrow-border-top', placeAbove ? '0' : '');
    };

    // Use CSS vars for arrow positioning.
    const applyArrowVars = () => {
        tooltip.style.setProperty('--arrow-left', '24px');
        tooltip.style.setProperty('--arrow-top', '-6px');
        tooltip.style.setProperty('--arrow-rotate', '45deg');
    };
    applyArrowVars();

    const show = (el, anchorX = null) => {
        const payload = findDefinitionForStrong(el);
        if (!payload) return;
        activeEl = el;
        activeAnchorX = typeof anchorX === 'number' ? anchorX : null;

        tooltip.textContent = payload.def;
        tooltip.classList.add('is-visible');
        tooltip.setAttribute('aria-hidden', 'false');
        placeTooltip(el, activeAnchorX);
    };

    const hide = () => {
        activeEl = null;
        activeAnchorX = null;
        tooltip.classList.remove('is-visible');
        tooltip.setAttribute('aria-hidden', 'true');
    };

    const onKeyDown = (e) => {
        if (!(e instanceof KeyboardEvent)) return;
        if (e.key === 'Escape') hide();
    };

    const enhanceStrongTerms = () => {
        const roots = ROOT_SELECTORS.flatMap((sel) => Array.from(document.querySelectorAll(sel)));
        const strongs = roots.flatMap((root) => Array.from(root.querySelectorAll('strong')));

        strongs.forEach((strongEl) => {
            if (!(strongEl instanceof HTMLElement)) return;
            const payload = findDefinitionForStrong(strongEl);
            if (!payload) return;

            strongEl.classList.add('has-tooltip');
            strongEl.setAttribute('tabindex', '0');
            strongEl.setAttribute('aria-describedby', tooltipId);
            strongEl.dataset.tooltipTerm = payload.term;

            strongEl.addEventListener('mouseenter', (e) => {
                if (e instanceof MouseEvent) show(strongEl, e.clientX);
                else show(strongEl);
            });
            strongEl.addEventListener('mousemove', (e) => {
                if (!(e instanceof MouseEvent)) return;
                if (activeEl !== strongEl) return;
                activeAnchorX = e.clientX;
                placeTooltip(strongEl, activeAnchorX);
            });
            strongEl.addEventListener('mouseleave', () => {
                if (activeEl === strongEl) hide();
            });
            strongEl.addEventListener('focus', () => show(strongEl));
            strongEl.addEventListener('blur', () => {
                if (activeEl === strongEl) hide();
            });
        });
    };

    window.addEventListener('scroll', () => {
        if (activeEl) placeTooltip(activeEl, activeAnchorX);
    }, { passive: true });
    window.addEventListener('resize', () => {
        if (activeEl) placeTooltip(activeEl, activeAnchorX);
    });
    window.addEventListener('keydown', onKeyDown);

    enhanceStrongTerms();
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

        // Panel transition: unhide first, then apply .is-active on next frame
        // so opacity/transform transitions can run.
        const nextPanel = panels.find((p) => p.getAttribute('data-timeline-panel') === key) || null;

        panels.forEach((panel) => {
            if (panel === nextPanel) return;
            panel.classList.remove('is-active');
            panel.hidden = true;
        });

        if (nextPanel) {
            nextPanel.hidden = false;
            nextPanel.classList.remove('is-active');
            window.requestAnimationFrame(() => {
                nextPanel.classList.add('is-active');
            });
        }
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

(() => {
    const plotEl = document.getElementById('plot-r1');
    if (!(plotEl instanceof HTMLElement)) return;
    // Plotly is loaded via CDN in index.html.
    if (typeof window.Plotly === 'undefined') return;

    const triggerEls = Array.from(document.querySelectorAll('[data-r1-plot]')).filter(
        (el) => el instanceof HTMLButtonElement
    );

    const getVar = (name) =>
        getComputedStyle(document.documentElement).getPropertyValue(name).trim() || undefined;

    const text = getVar('--text') || '#2E2623';
    const muted = getVar('--text-muted') || '#756A64';
    const bg = getVar('--bg') || '#F7F2EA';
    const musicColor = getVar('--teal') || '#5D8C87';
    const controlColor = getVar('--apricot') || '#E5A97A';
    const plum = getVar('--plum') || '#7A5C7B';
    const gold = getVar('--gold') || '#D8C06A';
    const surface = getVar('--surface') || '#FFF9F2';
    const blue = getVar('--blue') || '#4B86C7';
    const pink = getVar('--pink') || '#D48AA8';

    // Approximate values inferred from the paper figure (since exact means/SEs aren't reported).
    // Update these later if you extract the precise values from the paper.
    const states = {
        baseline: {
            kind: 'twoBar',
            xLabel: 'Baseline',
            yLabel: 'Arousal',
            x: ['Music', 'Control'],
            y: [4.1, 4.45],
            colors: [musicColor, controlColor],
            yRange: [1, 9],
            yTick0: 1,
            yDtick: 1,
        },
        post: {
            kind: 'twoBar',
            xLabel: 'Post-treatment',
            yLabel: 'Arousal',
            x: ['Music', 'Control'],
            y: [4.9, 4.25],
            colors: [musicColor, controlColor],
            yRange: [1, 9],
            yTick0: 1,
            yDtick: 1,
        },
    };

    const getState = (key) => states[key] || states.baseline;

    const buildData = (key) => {
        const state = getState(key);
        return [
            {
                type: 'bar',
                name: 'Arousal',
                x: state.x,
                y: state.y,
                marker: {
                    color: state.colors,
                    line: { color: text, width: 1 },
                },
                hoverinfo: 'skip',
            },
        ];
    };

    const buildLayout = (key) => {
        const state = getState(key);
        return {
            margin: { l: 56, r: 12, t: 10, b: 56 },
            paper_bgcolor: bg,
            plot_bgcolor: bg,
            font: { family: 'Switzer, sans-serif', color: text, size: 15 },
            xaxis: {
                title: { text: state.xLabel, font: { color: muted, size: 15 } },
                tickfont: { color: text, size: 14 },
                linecolor: text,
                linewidth: 1,
                showgrid: false,
                zeroline: false,
            },
            yaxis: {
                title: { text: state.yLabel, font: { color: muted, size: 15 } },
                range: state.yRange,
                tick0: state.yTick0,
                dtick: state.yDtick,
                tickfont: { color: text, size: 14 },
                gridcolor: 'rgba(46,38,35,0.12)',
                linecolor: text,
                linewidth: 1,
                zeroline: Boolean(state.zeroLine),
                zerolinecolor: text,
                zerolinewidth: 1,
            },
            showlegend: false,
            hovermode: false,
            bargap: 0.2,
        };
    };

    const config = {
        displayModeBar: false,
        responsive: true,
    };

    let currentKey = 'baseline';
    let hasPlotted = false;

    const plotInitial = (key) => {
        hasPlotted = true;
        currentKey = key;
        return window.Plotly.newPlot(plotEl, buildData(key), buildLayout(key), config);
    };

    const animateTwoBarTo = (key) => {
        const state = getState(key);
        currentKey = key;

        // Ensure axis label updates.
        window.Plotly.relayout(plotEl, {
            'xaxis.title.text': state.xLabel,
        });

        return window.Plotly.animate(
            plotEl,
            {
                data: [{ y: state.y }],
            },
            {
                transition: { duration: 700, easing: 'cubic-in-out' },
                frame: { duration: 700, redraw: false },
            }
        );
    };

    const setActive = (key) => {
        const nextKey = key in states ? key : 'baseline';
        triggerEls.forEach((btn) => {
            const isActive = btn.getAttribute('data-r1-plot') === nextKey;
            btn.classList.toggle('is-active', isActive);
            btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });

        if (!hasPlotted) {
            plotInitial(nextKey);
            return;
        }

        animateTwoBarTo(nextKey);
    };

    // Initialize with whichever trigger is marked active, otherwise baseline.
    const initialKey =
        triggerEls.find((el) => el.classList.contains('is-active'))?.getAttribute('data-r1-plot') || 'baseline';

    triggerEls.forEach((btn) => {
        btn.addEventListener('click', () => {
            const key = btn.getAttribute('data-r1-plot');
            if (!key) return;
            setActive(key);
        });
    });

    setActive(initialKey);
})();

(() => {
    // R2 (new): arousal across experimental conditions (single plot).
    const plotEl = document.getElementById('plot-r2');
    if (!(plotEl instanceof HTMLElement)) return;
    if (typeof window.Plotly === 'undefined') return;

    const getVar = (name) =>
        getComputedStyle(document.documentElement).getPropertyValue(name).trim() || undefined;

    const text = getVar('--text') || '#2E2623';
    const muted = getVar('--text-muted') || '#756A64';
    const bg = getVar('--bg') || '#F7F2EA';
    const musicColor = getVar('--teal') || '#5D8C87';
    const controlColor = getVar('--apricot') || '#E5A97A';
    const plum = getVar('--plum') || '#7A5C7B';
    const gold = getVar('--gold') || '#D8C06A';
    const blue = getVar('--blue') || '#4B86C7';
    const pink = getVar('--pink') || '#D48AA8';

    const state = {
        xLabel: 'Experimental conditions',
        yLabel: 'Arousal change score',
        x: ['N-LF', 'N-HF', 'P-LF', 'P-HF', 'Neutral', 'Silent'],
        // Approximate values based on the figure's bar heights (no dots/error bars/significance).
        y: [1.0, 1.1, 1.0, -0.6, -0.2, 0.0],
        colors: [controlColor, musicColor, gold, plum, blue, pink],
        yRange: [-6, 6],
        yTick0: -6,
        yDtick: 2,
        zeroLine: true,
    };

    const data = [
        {
            type: 'bar',
            name: 'Arousal',
            x: state.x,
            y: state.y,
            marker: {
                color: state.colors,
                line: { color: text, width: 1 },
            },
            hoverinfo: 'skip',
        },
    ];

    const layout = {
        margin: { l: 66, r: 12, t: 10, b: 62 },
        paper_bgcolor: bg,
        plot_bgcolor: bg,
        font: { family: 'Switzer, sans-serif', color: text, size: 15 },
        xaxis: {
            title: { text: state.xLabel, font: { color: muted, size: 15 } },
            tickfont: { color: text, size: 14 },
            linecolor: text,
            linewidth: 1,
            showgrid: false,
            zeroline: false,
        },
        yaxis: {
            title: { text: state.yLabel, font: { color: muted, size: 15 } },
            range: state.yRange,
            tick0: state.yTick0,
            dtick: state.yDtick,
            tickfont: { color: text, size: 14 },
            gridcolor: 'rgba(46,38,35,0.12)',
            linecolor: text,
            linewidth: 1,
            zeroline: Boolean(state.zeroLine),
            zerolinecolor: text,
            zerolinewidth: 1,
        },
        showlegend: false,
        hovermode: false,
        bargap: 0.25,
    };

    const config = { displayModeBar: false, responsive: true };

    window.Plotly.newPlot(plotEl, data, layout, config);
})();

(() => {
    const root = document.querySelector('[data-discussion-tabs]');
    if (!(root instanceof HTMLElement)) return;

    const tabs = Array.from(root.querySelectorAll('[data-discussion-tab]')).filter((el) => el instanceof HTMLButtonElement);
    const panels = Array.from(root.querySelectorAll('[data-discussion-panel]')).filter((el) => el instanceof HTMLElement);
    if (tabs.length === 0 || panels.length === 0) return;

    const getKey = (el) => el.getAttribute('data-discussion-tab') || '';

    let enteringTimer = 0;

    const setActive = (key, { focus = false } = {}) => {
        tabs.forEach((tab) => {
            const isActive = getKey(tab) === key;
            tab.classList.toggle('is-active', isActive);
            tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
            tab.tabIndex = isActive ? 0 : -1;
            if (isActive && focus) tab.focus();
        });

        panels.forEach((panel) => {
            const isActive = (panel.getAttribute('data-discussion-panel') || '') === key;
            panel.hidden = !isActive;
            panel.classList.remove('is-entering');
        });

        const activePanel = panels.find((p) => (p.getAttribute('data-discussion-panel') || '') === key);
        if (activePanel) {
            window.clearTimeout(enteringTimer);
            // Re-trigger animation even when switching back.
            activePanel.classList.add('is-entering');
            enteringTimer = window.setTimeout(() => {
                activePanel.classList.remove('is-entering');
            }, 520);
        }
    };

    // Initialize based on existing markup.
    const initiallySelected = tabs.find((t) => t.getAttribute('aria-selected') === 'true');
    const initialKey = initiallySelected ? getKey(initiallySelected) : getKey(tabs[0]);
    if (initialKey) setActive(initialKey);

    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            const key = getKey(tab);
            if (!key) return;
            setActive(key);
        });

        tab.addEventListener('keydown', (e) => {
            if (!(e instanceof KeyboardEvent)) return;

            const currentIndex = tabs.indexOf(tab);
            if (currentIndex < 0) return;

            const moveTo = (nextIndex) => {
                const next = tabs[(nextIndex + tabs.length) % tabs.length];
                if (!next) return;
                const key = getKey(next);
                if (!key) return;
                setActive(key, { focus: true });
            };

            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                moveTo(currentIndex + 1);
            }
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                moveTo(currentIndex - 1);
            }
            if (e.key === 'Home') {
                e.preventDefault();
                moveTo(0);
            }
            if (e.key === 'End') {
                e.preventDefault();
                moveTo(tabs.length - 1);
            }
        });
    });
})();

(() => {
    const plotEl = document.getElementById('plot-r3');
    if (!(plotEl instanceof HTMLElement)) return;
    if (typeof window.Plotly === 'undefined') return;

    const triggerEls = Array.from(document.querySelectorAll('[data-r3-plot]')).filter(
        (el) => el instanceof HTMLButtonElement
    );

    const switchHost = document.querySelector('[data-r3-view-switch]');
    const switchBtns = Array.from(document.querySelectorAll('[data-r3-view]')).filter(
        (el) => el instanceof HTMLButtonElement
    );

    const getVar = (name) =>
        getComputedStyle(document.documentElement).getPropertyValue(name).trim() || undefined;

    const text = getVar('--text') || '#2E2623';
    const muted = getVar('--text-muted') || '#756A64';
    const bg = getVar('--bg') || '#F7F2EA';
    const teal = getVar('--teal') || '#5D8C87';
    const gold = getVar('--gold') || '#D8C06A';
    const pink = getVar('--pink') || '#D48AA8';

    const palette = {
        low: pink,
        moderate: gold,
        high: teal,
    };

    const categories3 = ['Low (decrease)', 'Moderate', 'High (increase)'];
    const categories2 = ['Low (decrease)', 'Moderate'];

    // Approximate values inferred from the paper figure (no error bars/significance).
    // Update later if you extract exact values.
    const plots = {
        // Figure 5C/5D: Memory performance means by arousal-change cluster.
        fig6: {
            xTitle: 'Change in Arousal',
            showN: true,
            categories: categories3,
            views: {
                target: {
                    yTitle: 'Target Recognition',
                    yRange: [0, 4],
                    yTick0: 0,
                    yDtick: 1,
                    // Approximate values from the figure.
                    y: [3.2, 2.0, 3.3],
                    // Participant counts you provided.
                    n: [29, 27, 30],
                },
                lure: {
                    yTitle: 'Lure Discrimination',
                    yRange: [0, 0.8],
                    yTick0: 0,
                    yDtick: 0.2,
                    y: [0.30, 0.56, 0.33],
                    n: [23, 34, 29],
                },
            },
        },

        // Control groups: two clusters (Low decrease vs Moderate) with Target/Lure panels.
        fig7: {
            xTitle: 'Change in Arousal',
            showN: true,
            categories: categories2,
            views: {
                // Approximate values from the provided figure (ignore hatch patterns).
                target: {
                    yTitle: 'Target Recognition',
                    yRange: [0, 4],
                    yTick0: 0,
                    yDtick: 1,
                    y: [3.2, 2.0],
                    n: [17, 27],
                },
                lure: {
                    yTitle: 'Lure Discrimination',
                    yRange: [0, 0.8],
                    yTick0: 0,
                    yDtick: 0.2,
                    y: [0.49, 0.30],
                    n: [22, 22],
                },
            },
        },
    };

    const getPlot = (plotKey) => plots[plotKey] || plots.fig6;
    const getView = (plotKey, viewKey) => {
        const plot = getPlot(plotKey);
        return plot.views[viewKey] || plot.views.target;
    };

    const buildTrace = (plotKey, viewKey) => {
        const plot = getPlot(plotKey);
        const view = getView(plotKey, viewKey);

        const xCats = plot.categories || categories3;
        const barColors =
            xCats.length === 2
                ? [palette.low, palette.moderate]
                : [palette.low, palette.moderate, palette.high];

        const trace = {
            type: 'bar',
            name: plot.yTitle,
            x: xCats,
            y: view.y,
            marker: {
                color: barColors,
                line: { color: text, width: 1 },
            },
            hoverinfo: 'skip',
            cliponaxis: false,
        };

        if (plot.showN && Array.isArray(view.n)) {
            trace.customdata = view.n;
            trace.texttemplate = 'n=%{customdata}';
            trace.textposition = 'outside';
            trace.textfont = { color: text, size: 13 };
        }

        return trace;
    };

    const buildLayout = (plotKey, viewKey) => {
        const plot = getPlot(plotKey);
        const view = getView(plotKey, viewKey);
        return {
            margin: { l: 92, r: 12, t: 42, b: 64 },
            paper_bgcolor: bg,
            plot_bgcolor: bg,
            font: { family: 'Switzer, sans-serif', color: text, size: 15 },
            xaxis: {
                title: { text: plot.xTitle, font: { color: muted, size: 15 } },
                tickfont: { color: text, size: 14 },
                linecolor: text,
                linewidth: 1,
                showgrid: false,
                zeroline: false,
            },
            yaxis: {
                title: { text: view.yTitle, font: { color: muted, size: 15 } },
                range: view.yRange,
                tick0: view.yTick0,
                dtick: view.yDtick,
                tickfont: { color: text, size: 14 },
                gridcolor: 'rgba(46,38,35,0.12)',
                linecolor: text,
                linewidth: 1,
                zeroline: true,
                zerolinecolor: text,
                zerolinewidth: 1,
            },
            showlegend: false,
            hovermode: false,
            bargap: 0.35,
        };
    };

    const config = {
        displayModeBar: false,
        responsive: true,
    };

    let hasPlotted = false;
    let currentPlotKey = 'fig6';
    let currentViewKey = 'target';

    const setSwitchVisible = (visible) => {
        if (!(switchHost instanceof HTMLElement)) return;
        switchHost.hidden = !visible;
    };

    const setActiveTrigger = (plotKey) => {
        triggerEls.forEach((btn) => {
            const isActive = btn.getAttribute('data-r3-plot') === plotKey;
            btn.classList.toggle('is-active', isActive);
            btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
    };

    const setActiveView = (viewKey) => {
        const prevKey = currentViewKey;
        const nextKey = viewKey === 'lure' ? 'lure' : 'target';
        currentViewKey = nextKey;

        if (switchHost instanceof HTMLElement) {
            switchHost.setAttribute('data-active', nextKey);
        }

        switchBtns.forEach((btn) => {
            const isActive = btn.getAttribute('data-r3-view') === nextKey;
            btn.classList.toggle('is-active', isActive);
            btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });

        return prevKey;
    };

    const animateToView = (viewKey, prevViewKey = currentViewKey) => {
        const plot = getPlot(currentPlotKey);
        const view = getView(currentPlotKey, viewKey);

        const nextTrace = buildTrace(currentPlotKey, viewKey);
        const nextData = { y: nextTrace.y };
        if (plot.showN && Array.isArray(view.n)) nextData.customdata = view.n;

        const axisLayout = {
            'yaxis.title.text': view.yTitle,
            'yaxis.range': view.yRange,
            'yaxis.tick0': view.yTick0,
            'yaxis.dtick': view.yDtick,
        };

        // Jitter fix:
        // - Target -> Lure: animate bars first, then rescale axis.
        // - Lure -> Target (or anything else): rescale axis first, then animate bars.
        const isTargetToLure = prevViewKey === 'target' && viewKey === 'lure';

        const animateBars = () =>
            window.Plotly.animate(
                plotEl,
                { data: [nextData] },
                {
                    transition: { duration: 700, easing: 'cubic-in-out' },
                    frame: { duration: 700, redraw: false },
                }
            );

        if (isTargetToLure) {
            return Promise.resolve(animateBars()).then(() => window.Plotly.relayout(plotEl, axisLayout));
        }

        return Promise.resolve(window.Plotly.relayout(plotEl, axisLayout)).then(() => animateBars());
    };

    const fadeSwapToPlot = (plotKey, viewKey) => {
        plotEl.classList.add('is-fading');
        window.setTimeout(() => {
            window.Plotly.react(plotEl, [buildTrace(plotKey, viewKey)], buildLayout(plotKey, viewKey), config);
            window.requestAnimationFrame(() => {
                plotEl.classList.remove('is-fading');
            });
        }, 220);
    };

    const renderPlot = (plotKey, viewKey) => {
        setSwitchVisible(true);

        if (!hasPlotted) {
            hasPlotted = true;
            return window.Plotly.newPlot(plotEl, [buildTrace(plotKey, viewKey)], buildLayout(plotKey, viewKey), config);
        }

        // Same plot set: animate; switching plot sets: fade swap.
        if (plotKey === currentPlotKey) {
            animateToView(viewKey);
            return;
        }

        currentPlotKey = plotKey;
        fadeSwapToPlot(plotKey, viewKey);
    };

    const setActive = (plotKey) => {
        const nextKey = plotKey in plots ? plotKey : 'fig6';
        setActiveTrigger(nextKey);

        // Keep currentViewKey if it exists for the next plot; otherwise reset.
        const nextPlot = getPlot(nextKey);
        const nextViewKey = currentViewKey in nextPlot.views ? currentViewKey : 'target';
        currentViewKey = nextViewKey;
        setActiveView(nextViewKey);

        renderPlot(nextKey, nextViewKey);
    };

    triggerEls.forEach((btn) => {
        btn.addEventListener('click', () => {
            const key = btn.getAttribute('data-r3-plot');
            if (!key) return;
            setActive(key);
        });
    });

    switchBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            const key = btn.getAttribute('data-r3-view');
            if (!key) return;
            const prev = setActiveView(key);

            // Always animate within the active plot set, using prev->next to
            // control sequencing (Target->Lure bars first, then axis).
            if (currentPlotKey in plots) {
                animateToView(currentViewKey, prev);
                return;
            }

            renderPlot(currentPlotKey, currentViewKey);
        });
    });

    // Initialize: prefer any active trigger; otherwise, first.
    const initialPlotKey =
        triggerEls.find((el) => el.classList.contains('is-active'))?.getAttribute('data-r3-plot') ||
        triggerEls[0]?.getAttribute('data-r3-plot') ||
        'fig6';

    const initialViewKey =
        switchBtns.find((el) => el.classList.contains('is-active'))?.getAttribute('data-r3-view') || 'target';
    setActiveView(initialViewKey);
    setActive(initialPlotKey);
})();

// affect grid 
const rowData = [
    { desc: 'High' }, { desc: '' }, { desc: '' }, { desc: '' },
    { desc: 'Neutral' }, { desc: '' }, { desc: '' }, { desc: '' },
    { desc: 'Low' }
];

document.getElementById('rowLabels').innerHTML = rowData
    .map(r => `<div class="ag-row-label">${r.desc ? `<span class="ag-row-desc">${r.desc}</span>` : ''}</div>`)
    .join('');

const corners = {
    tl: [186, 110, 88], tr: [188, 155, 72],
    bl: [120, 118, 150], br: [100, 155, 138]
};
function lerp(a, b, t) { return a + (b - a) * t }
function lerpC(c1, c2, t) { return c1.map((v, i) => Math.round(lerp(v, c2[i], t))) }
function cellColor(col, row) {
    const tx = col / 8, ty = row / 8;
    const top = lerpC(corners.tl, corners.tr, tx);
    const bot = lerpC(corners.bl, corners.br, tx);
    const [r, g, b] = lerpC(top, bot, ty);
    return `rgb(${r},${g},${b})`;
}

const valenceLabels = ['1 — Extremely Negative', '2', '3', '4', '5 — Neutral', '6', '7', '8', '9 — Extremely Positive'];
const tip = document.getElementById('agTip');
const grid = document.getElementById('agGrid');

for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
        const cell = document.createElement('div');
        cell.className = 'ag-cell';
        cell.style.background = cellColor(col, row);
        cell.addEventListener('mouseenter', e => {
            tip.style.display = 'block';
            tip.innerHTML = `Arousal: <strong>${rowData[row].desc || (9 - row)}</strong><br>Valence: <strong>${valenceLabels[col]}</strong>`;
        });
        cell.addEventListener('mousemove', e => {
            tip.style.left = (e.clientX + 12) + 'px';
            tip.style.top = (e.clientY - 10) + 'px';
        });
        cell.addEventListener('mouseleave', () => { tip.style.display = 'none' });
        cell.addEventListener('click', () => {
            document.querySelectorAll('.ag-cell').forEach(c => c.classList.remove('selected'));
            cell.classList.add('selected');
        });
        grid.appendChild(cell);
    }
}