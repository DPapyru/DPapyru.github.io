/* global KnowledgeCore */
(function () {
    'use strict';

    const OVERLAY_ID = 'knowledge-cards-overlay';
    const READY_EVENT = 'viewer:content-ready';

    let overlayEl = null;
    let containerEl = null;
    let worker = null;
    let nextAnchorId = 1;
    let nextRequestId = 1;
    let lastClickAnchorPoint = null;

    const cardsByAnchorId = new Map();
    const pendingByRequestId = new Map();
    const detectPendingByRequestId = new Map();
    let zIndexBase = 10000;
    let rafPending = false;
    let globalListenersBound = false;

    function ensureOverlay() {
        if (overlayEl) return overlayEl;
        overlayEl = document.createElement('div');
        overlayEl.className = 'kc-overlay';
        overlayEl.id = OVERLAY_ID;
        document.body.appendChild(overlayEl);
        return overlayEl;
    }

    function ensureWorker() {
        if (worker) return worker;
        try {
            worker = new Worker('../assets/js/knowledge-cards.worker.js');
        } catch (e) {
            try {
                worker = new Worker('..\/assets\/js\/knowledge-cards.worker.js');
            } catch (err) {
                worker = null;
            }
        }
        if (worker) {
            worker.onmessage = onWorkerMessage;
            worker.onerror = (e) => {
                console.error('KnowledgeCards worker error:', e);
                try {
                    worker.terminate();
                } catch (_) { }
                worker = null;
                if (lastClickAnchorPoint) showInvalidPulse(lastClickAnchorPoint);
                pendingByRequestId.clear();
            };
            worker.onmessageerror = (e) => {
                console.error('KnowledgeCards worker messageerror:', e);
                try {
                    worker.terminate();
                } catch (_) { }
                worker = null;
                if (lastClickAnchorPoint) showInvalidPulse(lastClickAnchorPoint);
                pendingByRequestId.clear();
            };
        }
        return worker;
    }

    function scheduleUpdate() {
        if (rafPending) return;
        rafPending = true;
        requestAnimationFrame(() => {
            rafPending = false;
            updateAll();
        });
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function getAnchorId(el) {
        if (!el) return null;
        if (!el.dataset.kcAnchorId) {
            el.dataset.kcAnchorId = String(nextAnchorId++);
        }
        return el.dataset.kcAnchorId;
    }

    function getAnchorPoint(el) {
        const rect = el.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            rect: rect
        };
    }

    function isCSharpCodeBlockToken(target) {
        if (!target) return null;
        const tokenEl = target.closest && target.closest('.token');
        if (!tokenEl) return null;

        const codeEl = tokenEl.closest('pre code.language-csharp, pre code.language-cs');
        if (!codeEl) return null;

        return { tokenEl, codeEl };
    }

    function isInlineCode(target) {
        if (!target) return null;
        const codeEl = target.closest && target.closest('code');
        if (!codeEl) return null;
        if (codeEl.closest('pre')) return null;
        return codeEl;
    }

    function getTextOffsetsWithin(rootEl, targetEl) {
        if (!rootEl || !targetEl || !rootEl.contains(targetEl)) return null;
        const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, null);
        let offset = 0;
        let start = null;
        let end = null;

        while (walker.nextNode()) {
            const node = walker.currentNode;
            const value = node && node.nodeValue ? node.nodeValue : '';
            const len = value.length;

            if (targetEl.contains(node)) {
                if (start == null) start = offset;
                end = offset + len;
            }

            offset += len;
        }

        if (start == null || end == null) return null;
        return { start, end };
    }

    function showInvalidPulse(anchorPoint) {
        const el = document.createElement('div');
        el.className = 'kc-invalid-pulse';
        el.style.left = (anchorPoint.x - 5) + 'px';
        el.style.top = (anchorPoint.y - 5) + 'px';
        ensureOverlay().appendChild(el);
        setTimeout(() => {
            if (el && el.parentNode) el.parentNode.removeChild(el);
        }, 520);
    }

    function onContentReady(detail) {
        const c = detail && detail.container ? detail.container : document.getElementById('markdown-content');
        if (!c) return;
        bindToContainer(c);
        detectAndHighlightCSharpBlocks(c);
    }

    function bindToContainer(c) {
        containerEl = c;
        ensureOverlay();
        ensureWorker();

        containerEl.removeEventListener('click', onContainerClick, true);
        containerEl.addEventListener('click', onContainerClick, true);

        if (!globalListenersBound) {
            globalListenersBound = true;
            window.addEventListener('scroll', scheduleUpdate, { passive: true });
            window.addEventListener('resize', scheduleUpdate);
        }

        scheduleUpdate();
    }

    function onContainerClick(event) {
        if (!event || !event.target) return;
        if (event.defaultPrevented) return;

        const tokenHit = isCSharpCodeBlockToken(event.target);
        if (tokenHit) {
            const anchorId = getAnchorId(tokenHit.tokenEl);
            const anchorPoint = getAnchorPoint(tokenHit.tokenEl);
            const tokenText = tokenHit.tokenEl.textContent || '';
            const blockCode = tokenHit.codeEl.textContent || '';
            const offsets = getTextOffsetsWithin(tokenHit.codeEl, tokenHit.tokenEl);
            if (!offsets) {
                showInvalidPulse(anchorPoint);
                return;
            }
            requestAnalyze({
                anchorId,
                kind: 'blockToken',
                clickedText: tokenText,
                tokenText,
                blockCode,
                blockOffsetStart: offsets.start,
                blockOffsetEnd: offsets.end,
                anchorPoint,
                anchorEl: tokenHit.tokenEl
            });
            return;
        }

        const inlineCodeEl = isInlineCode(event.target);
        if (inlineCodeEl) {
            const raw = String(inlineCodeEl.textContent || '').trim();
            if (!raw) return;

            const anchorId = getAnchorId(inlineCodeEl);
            requestAnalyze({
                anchorId,
                kind: 'inline',
                clickedText: raw,
                anchorPoint: getAnchorPoint(inlineCodeEl),
                anchorEl: inlineCodeEl
            });
        }
    }

    function requestAnalyze(payload) {
        const w = ensureWorker();
        if (!w) {
            showInvalidPulse(payload.anchorPoint);
            return;
        }

        lastClickAnchorPoint = payload.anchorPoint;
        const requestId = nextRequestId++;
        const existing = cardsByAnchorId.get(payload.anchorId);
        if (existing) {
            bringToFront(existing);
            existing.lastRequestId = requestId;
            existing.anchorPoint = payload.anchorPoint;
            existing.anchorEl = payload.anchorEl || existing.anchorEl;
            scheduleUpdate();
        } else {
            const timeoutId = setTimeout(() => {
                const pending = pendingByRequestId.get(requestId);
                if (!pending) return;
                pendingByRequestId.delete(requestId);
                showInvalidPulse(pending.anchorPoint);
            }, 2000);
            pendingByRequestId.set(requestId, {
                anchorId: payload.anchorId,
                anchorPoint: payload.anchorPoint,
                anchorEl: payload.anchorEl || null,
                timeoutId
            });
        }

        w.postMessage({
            type: 'analyze',
            requestId: requestId,
            kind: payload.kind,
            clickedText: payload.clickedText,
            tokenText: payload.tokenText,
            blockCode: payload.blockCode,
            blockOffsetStart: payload.blockOffsetStart,
            blockOffsetEnd: payload.blockOffsetEnd
        });
    }

    function onWorkerMessage(event) {
        const msg = event && event.data ? event.data : null;
        if (!msg || !msg.type) return;

        if (msg.type === 'detectCSharpResult') {
            const pending = detectPendingByRequestId.get(msg.requestId);
            if (!pending) return;
            detectPendingByRequestId.delete(msg.requestId);
            if (!msg.ok) return;

            const codeEl = pending.codeEl;
            if (!codeEl || !codeEl.isConnected) return;
            const pre = codeEl.closest && codeEl.closest('pre');
            if (pre && pre.classList && !pre.classList.contains('language-csharp') && !pre.classList.contains('language-cs')) {
                pre.classList.add('language-csharp');
            }
            if (codeEl.classList && !codeEl.classList.contains('language-csharp') && !codeEl.classList.contains('language-cs')) {
                codeEl.classList.add('language-csharp');
            }

            if (typeof Prism !== 'undefined' && Prism && typeof Prism.highlightElement === 'function') {
                Prism.highlightElement(codeEl);
            }
            return;
        }

        if (msg.type !== 'analyzeResult') return;

        const requestId = msg.requestId;
        const ok = !!msg.ok;

        let targetCard = null;
        cardsByAnchorId.forEach((card) => {
            if (card.lastRequestId === requestId) targetCard = card;
        });

        if (!targetCard) {
            const pending = pendingByRequestId.get(requestId);
            if (!pending) return;
            pendingByRequestId.delete(requestId);
            if (pending.timeoutId) clearTimeout(pending.timeoutId);

            if (!ok) {
                showInvalidPulse(pending.anchorPoint);
                return;
            }

            createCardShell(pending.anchorId, pending.anchorPoint);
            targetCard = cardsByAnchorId.get(pending.anchorId);
            if (!targetCard) return;
            targetCard.lastRequestId = requestId;
            targetCard.anchorEl = pending.anchorEl || null;
        }

        if (!ok) {
            showInvalidPulse(targetCard.anchorPoint);
            destroyCard(targetCard.anchorId);
            return;
        }

        applyModelToCard(targetCard, msg.model || {});
    }

    function createCardShell(anchorId, anchorPoint) {
        const overlay = ensureOverlay();

        const cardEl = document.createElement('div');
        cardEl.className = 'kc-card kc-enter';
        cardEl.style.zIndex = String(zIndexBase++);

        const headerEl = document.createElement('div');
        headerEl.className = 'kc-card-header';

        const titleEl = document.createElement('div');
        titleEl.className = 'kc-title';
        titleEl.textContent = '';

        const actionsEl = document.createElement('div');
        actionsEl.className = 'kc-actions';

        const pinBtn = document.createElement('button');
        pinBtn.type = 'button';
        pinBtn.className = 'kc-pin';
        pinBtn.setAttribute('aria-label', '固定知识卡牌');
        pinBtn.textContent = '📌';
        pinBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const card = cardsByAnchorId.get(anchorId);
            if (!card) return;
            card.pinned = !card.pinned;
            pinBtn.classList.toggle('kc-pinned', card.pinned);
            scheduleUpdate();
        });

        const handle = document.createElement('button');
        handle.type = 'button';
        handle.className = 'kc-handle';
        handle.setAttribute('aria-label', '展开延伸阅读');

        const chevron = document.createElement('div');
        chevron.className = 'kc-chevron';

        const badge = document.createElement('div');
        badge.className = 'kc-badge';
        badge.dataset.kcMode = 'dot';

        handle.appendChild(chevron);
        handle.appendChild(badge);

        handle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const card = cardsByAnchorId.get(anchorId);
            if (!card) return;
            toggleReading(card);
        });

        actionsEl.appendChild(handle);
        actionsEl.appendChild(pinBtn);

        headerEl.appendChild(titleEl);
        headerEl.appendChild(actionsEl);

        const bodyEl = document.createElement('div');
        bodyEl.className = 'kc-card-body';

        const clickedEl = document.createElement('div');
        clickedEl.className = 'kc-clicked';

        const notesEl = document.createElement('div');
        notesEl.className = 'kc-notes';

        const sigWrap = document.createElement('div');
        sigWrap.className = 'kc-signatures';

        const readingEl = document.createElement('div');
        readingEl.className = 'kc-reading kc-collapsed';

        bodyEl.appendChild(clickedEl);
        bodyEl.appendChild(notesEl);
        bodyEl.appendChild(sigWrap);
        bodyEl.appendChild(readingEl);

        cardEl.appendChild(headerEl);
        cardEl.appendChild(bodyEl);

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('kc-connector', 'kc-enter');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.classList.add('kc-line');
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.classList.add('kc-anchor');
        circle.setAttribute('r', '5');
        svg.appendChild(line);
        svg.appendChild(circle);

        overlay.appendChild(svg);
        overlay.appendChild(cardEl);

        const card = {
            anchorId,
            anchorPoint,
            anchorEl: null,
            cardEl,
            titleEl,
            clickedEl,
            notesEl,
            sigWrap,
            readingEl,
            svg,
            line,
            circle,
            handle,
            badge,
            pinned: false,
            open: false,
            lastRequestId: null,
            recommendations: [],
            dragging: null
        };

        cardsByAnchorId.set(anchorId, card);

        placeCardNearAnchor(card, anchorPoint);
        bindDrag(card);

        setTimeout(() => {
            cardEl.classList.add('kc-visible');
            handle.classList.add('kc-visible');
        }, 0);

        setTimeout(() => {
            cardEl.classList.remove('kc-enter');
            svg.classList.remove('kc-enter');
        }, 520);

        bringToFront(card);
        scheduleUpdate();
    }

    function bringToFront(card) {
        if (!card || !card.cardEl) return;
        card.cardEl.style.zIndex = String(zIndexBase++);
    }

    function bindDrag(card) {
        const header = card.cardEl.querySelector('.kc-card-header');
        if (!header) return;

        header.addEventListener('mousedown', (e) => {
            if (e.target && e.target.closest && e.target.closest('button')) return;
            if (e.button !== 0) return;
            e.preventDefault();
            bringToFront(card);

            const rect = card.cardEl.getBoundingClientRect();
            card.dragging = {
                startX: e.clientX,
                startY: e.clientY,
                originLeft: rect.left,
                originTop: rect.top
            };

            window.addEventListener('mousemove', onDragMove, true);
            window.addEventListener('mouseup', onDragEnd, true);
        });

        function onDragMove(e) {
            if (!card.dragging) return;
            const dx = e.clientX - card.dragging.startX;
            const dy = e.clientY - card.dragging.startY;
            const left = card.dragging.originLeft + dx;
            const top = card.dragging.originTop + dy;
            card.cardEl.style.left = left + 'px';
            card.cardEl.style.top = top + 'px';
            scheduleUpdate();
        }

        function onDragEnd() {
            card.dragging = null;
            window.removeEventListener('mousemove', onDragMove, true);
            window.removeEventListener('mouseup', onDragEnd, true);
        }
    }

    function placeCardNearAnchor(card, anchorPoint) {
        const margin = 8;
        const desiredLeft = anchorPoint.x + 10;
        const desiredTop = anchorPoint.y + 10;
        const width = 340;
        const height = 200;

        const left = clamp(desiredLeft, margin, window.innerWidth - margin - Math.min(width, window.innerWidth - 2 * margin));
        const top = clamp(desiredTop, margin, window.innerHeight - margin - Math.min(height, window.innerHeight - 2 * margin));
        card.cardEl.style.left = left + 'px';
        card.cardEl.style.top = top + 'px';
    }

    function applyModelToCard(card, model) {
        const title = model.conceptTitle || model.queryText || '';
        card.titleEl.textContent = title;
        card.clickedEl.textContent = String(model.clickedText || '');

        renderNotes(card.notesEl, model.notes || []);
        renderSignatures(card.sigWrap, model.signatures || []);
        applyInlineHighlight(card, model);

        const recs = Array.isArray(model.recommendations) ? model.recommendations : [];
        card.recommendations = recs;

        if (card.open) {
            renderReading(card);
        } else {
            card.readingEl.classList.add('kc-collapsed');
            renderReadingSkeleton(card.readingEl, 2);
        }

        bringToFront(card);
        scheduleUpdate();
    }

    function applyInlineHighlight(card, model) {
        if (!card || !card.anchorEl) return;
        if (!model || !model.syntax) return;

        const el = card.anchorEl;
        if (el.classList) {
            el.classList.add('kc-syntax-ok');
            setTimeout(() => {
                if (el && el.classList) el.classList.remove('kc-syntax-ok');
            }, 900);
        }

        if (typeof Prism === 'undefined' || !Prism || typeof Prism.highlightElement !== 'function') return;
        if (el.tagName === 'CODE' && !el.closest('pre')) {
            if (!el.classList.contains('language-csharp') && !el.classList.contains('language-cs')) {
                el.classList.add('language-csharp');
            }
            Prism.highlightElement(el);
        }
    }

    function detectAndHighlightCSharpBlocks(root) {
        const w = ensureWorker();
        if (!w || !root || !root.querySelectorAll) return;

        const blocks = root.querySelectorAll('pre > code');
        blocks.forEach((codeEl) => {
            if (!codeEl || !codeEl.textContent) return;
            if (codeEl.dataset && codeEl.dataset.kcCSharpDetected === '1') return;
            if (codeEl.classList && (codeEl.classList.contains('language-csharp') || codeEl.classList.contains('language-cs'))) {
                if (codeEl.dataset) codeEl.dataset.kcCSharpDetected = '1';
                return;
            }

            const hasExplicitLanguage = codeEl.classList
                ? Array.from(codeEl.classList).some((c) => /^language-/.test(c))
                : false;
            if (hasExplicitLanguage) {
                if (codeEl.dataset) codeEl.dataset.kcCSharpDetected = '1';
                return;
            }

            const text = String(codeEl.textContent || '');
            if (!text.trim()) return;
            if (text.length > 24000) return;

            if (codeEl.dataset) codeEl.dataset.kcCSharpDetected = '1';
            const requestId = nextRequestId++;
            detectPendingByRequestId.set(requestId, { codeEl });
            w.postMessage({ type: 'detectCSharp', requestId, code: text });
        });
    }

    function renderNotes(container, notes) {
        container.innerHTML = '';
        const list = Array.isArray(notes) ? notes.filter(Boolean) : [];
        if (!list.length) return;
        const ul = document.createElement('ul');
        list.forEach((n) => {
            const li = document.createElement('li');
            li.textContent = String(n);
            ul.appendChild(li);
        });
        container.appendChild(ul);
    }

    function renderSignatures(container, signatures) {
        container.innerHTML = '';
        const list = Array.isArray(signatures) ? signatures.filter(Boolean) : [];
        if (!list.length) return;
        list.forEach((sig) => {
            const el = document.createElement('div');
            el.className = 'kc-sig';
            el.textContent = String(sig);
            container.appendChild(el);
        });
    }

    function toggleReading(card) {
        card.open = !card.open;
        card.handle.classList.toggle('kc-open', card.open);
        card.handle.setAttribute('aria-label', card.open ? '收起延伸阅读' : '展开延伸阅读');

        if (card.open) {
            if (!Array.isArray(card.recommendations) || card.recommendations.length === 0) {
                renderReadingSkeleton(card.readingEl, 3);
                card.readingEl.classList.remove('kc-collapsed');
                setTimeout(() => {
                    card.open = false;
                    card.handle.classList.remove('kc-open');
                    card.readingEl.classList.add('kc-collapsed');
                    updateBadge(card, 0);
                }, 260);
                return;
            }

            renderReading(card);
            updateBadge(card, card.recommendations.length);
        } else {
            card.readingEl.classList.add('kc-collapsed');
            card.badge.className = 'kc-badge';
            card.badge.dataset.kcMode = 'dot';
        }
    }

    function updateBadge(card, count) {
        if (!card || !card.badge) return;
        if (!count) {
            card.badge.className = 'kc-badge';
            card.badge.textContent = '';
            card.badge.dataset.kcMode = 'dot';
            return;
        }

        card.badge.className = 'kc-badge kc-number';
        card.badge.textContent = String(count);
        card.badge.dataset.kcMode = 'number';
    }

    function renderReading(card) {
        card.readingEl.innerHTML = '';
        card.readingEl.classList.remove('kc-collapsed');

        const list = Array.isArray(card.recommendations) ? card.recommendations.slice(0, 3) : [];
        list.forEach((item) => {
            const link = document.createElement('a');
            link.href = resolveRecommendationHref(item);
            link.target = item.url ? '_blank' : '';
            if (item.url) link.rel = 'noopener noreferrer';
            link.textContent = deriveRecommendationTitle(item);
            card.readingEl.appendChild(link);
        });
    }

    function renderReadingSkeleton(container, rows) {
        container.innerHTML = '';
        for (let i = 0; i < rows; i++) {
            const sk = document.createElement('div');
            sk.className = 'kc-skeleton';
            sk.style.width = (70 + (i * 9)) + '%';
            container.appendChild(sk);
        }
    }

    function deriveRecommendationTitle(item) {
        if (!item) return '';
        if (item.title) return String(item.title);
        if (item.path) {
            const parts = String(item.path).split('/');
            const last = parts[parts.length - 1] || item.path;
            return String(last).replace(/\.md$/i, '');
        }
        if (item.url) return String(item.url);
        return '';
    }

    function resolveRecommendationHref(item) {
        if (!item) return '#';
        if (item.url) {
            const safe = KnowledgeCore && KnowledgeCore.sanitizeExternalUrl
                ? KnowledgeCore.sanitizeExternalUrl(item.url)
                : null;
            return safe || '#';
        }
        if (item.path) {
            const hash = item.hash ? String(item.hash) : '';
            return '?file=' + encodeURIComponent(String(item.path)) + hash;
        }
        return '#';
    }

    function updateAll() {
        cardsByAnchorId.forEach((card) => {
            updateCardGeometry(card);
        });
    }

    function updateCardGeometry(card) {
        if (!card || !card.cardEl) return;
        const anchorEl = containerEl ? containerEl.querySelector('[data-kc-anchor-id="' + card.anchorId + '"]') : null;
        if (!anchorEl || !anchorEl.isConnected) {
            if (!card.pinned) destroyCard(card.anchorId);
            return;
        }

        const anchor = getAnchorPoint(anchorEl);
        card.anchorPoint = anchor;

        const cardRect = card.cardEl.getBoundingClientRect();
        const attachX = clamp(anchor.x, cardRect.left + 10, cardRect.right - 10);
        const attachY = clamp(anchor.y, cardRect.top + 12, cardRect.bottom - 12);

        card.line.setAttribute('x1', String(anchor.x));
        card.line.setAttribute('y1', String(anchor.y));
        card.line.setAttribute('x2', String(attachX));
        card.line.setAttribute('y2', String(attachY));

        card.circle.setAttribute('cx', String(anchor.x));
        card.circle.setAttribute('cy', String(anchor.y));

        updateVisibility(card, anchor.rect);
    }

    function updateVisibility(card, anchorRect) {
        if (card.pinned) {
            card.cardEl.style.opacity = '';
            return;
        }

        const viewportTop = 0;
        const viewportBottom = window.innerHeight;
        const viewportLeft = 0;
        const viewportRight = window.innerWidth;

        const outY = anchorRect.bottom < viewportTop
            ? viewportTop - anchorRect.bottom
            : anchorRect.top > viewportBottom
                ? anchorRect.top - viewportBottom
                : 0;
        const outX = anchorRect.right < viewportLeft
            ? viewportLeft - anchorRect.right
            : anchorRect.left > viewportRight
                ? anchorRect.left - viewportRight
                : 0;

        const out = Math.max(outX, outY);
        if (out <= 0) {
            card.cardEl.style.opacity = '';
            return;
        }

        const alpha = clamp(1 - out / 140, 0, 1);
        card.cardEl.style.opacity = String(alpha);
        if (alpha <= 0.02) {
            destroyCard(card.anchorId);
        }
    }

    function destroyCard(anchorId) {
        const card = cardsByAnchorId.get(anchorId);
        if (!card) return;

        cardsByAnchorId.delete(anchorId);

        const removeEl = (el) => {
            if (el && el.parentNode) el.parentNode.removeChild(el);
        };

        removeEl(card.svg);
        if (card.cardEl) {
            card.cardEl.classList.add('kc-fade-out');
            setTimeout(() => removeEl(card.cardEl), 240);
        }
    }

    function reset() {
        cardsByAnchorId.forEach((card) => {
            destroyCard(card.anchorId);
        });
        cardsByAnchorId.clear();
        pendingByRequestId.clear();
    }

    window.KnowledgeCards = {
        reset: reset
    };

    document.addEventListener(READY_EVENT, (e) => onContentReady(e.detail), false);

    document.addEventListener('DOMContentLoaded', () => {
        const el = document.getElementById('markdown-content');
        if (el) bindToContainer(el);
    });
}());
