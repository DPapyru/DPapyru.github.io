// 问答广场（Q&A）功能
(function () {
    'use strict';

    const QNA_INDEX_URL = 'assets/qna-index.json';
    const GISCUS_ORIGIN = 'https://giscus.app';
    const GISCUS_OPTIONS = {
        repo: 'DPapyru/DPapyru.github.io',
        repoId: 'R_kgDOQczhug',
        mapping: 'number',
        theme: 'dark_dimmed',
        lang: 'zh-CN'
    };

    const ASK_DRAFT_KEY = 'qna.askDraft.v1';

    function $(id) {
        return document.getElementById(id);
    }

    function escapeText(text) {
        return String(text || '').replace(/[&<>"']/g, function (ch) {
            return ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            })[ch] || ch;
        });
    }

    function formatDate(iso) {
        if (!iso) return '';
        const date = new Date(iso);
        if (Number.isNaN(date.getTime())) return '';
        try {
            return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
        } catch {
            return date.toISOString().slice(0, 10);
        }
    }

    function getSelectedNumberFromUrl() {
        const url = new URL(window.location.href);
        const raw = url.searchParams.get('d');
        const n = raw ? parseInt(raw, 10) : NaN;
        return Number.isFinite(n) && n > 0 ? n : null;
    }

    function setSelectedNumberToUrl(number) {
        const url = new URL(window.location.href);
        if (number) {
            url.searchParams.set('d', String(number));
        } else {
            url.searchParams.delete('d');
        }
        window.history.replaceState({}, '', url.toString());
    }

    function buildQuestionMarkdown(values) {
        const title = String(values.title || '').trim();
        const sections = [
            { header: '背景', key: 'background' },
            { header: '复现步骤', key: 'repro' },
            { header: '期望结果', key: 'expected' },
            { header: '实际结果', key: 'actual' },
            { header: '环境信息', key: 'env' },
            { header: '已尝试', key: 'tried' },
            { header: '相关链接/代码片段', key: 'links' }
        ];

        const lines = [];
        lines.push(`# ${title}`);
        lines.push('');
        lines.push('> 来自站内问答广场表单（建议补充必要信息，便于他人快速定位问题）。');
        lines.push('');

        sections.forEach(section => {
            const body = String(values[section.key] || '').trim();
            if (!body) return;
            lines.push(`## ${section.header}`);
            lines.push('');
            lines.push(body);
            lines.push('');
        });

        if (lines[lines.length - 1] === '') lines.pop();
        return lines.join('\n');
    }

    function requestCopy(text) {
        const content = String(text || '');
        if (!content) return Promise.reject(new Error('empty'));
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            return navigator.clipboard.writeText(content);
        }
        return Promise.reject(new Error('clipboard-unavailable'));
    }

    function findGiscusIframe(container) {
        if (!container) return null;
        return container.querySelector('iframe.giscus-frame');
    }

    function postGiscusTerm(container, term) {
        const iframe = findGiscusIframe(container);
        if (!iframe || !iframe.contentWindow) return false;
        iframe.contentWindow.postMessage(
            { giscus: { setConfig: { term: String(term) } } },
            GISCUS_ORIGIN
        );
        return true;
    }

    function loadGiscus(container, term) {
        if (!container) return;

        const existingScript = container.querySelector('script[data-giscus-script="true"]');
        const existingIframe = container.querySelector('iframe.giscus-frame');
        if (existingIframe) {
            postGiscusTerm(container, term);
            return;
        }

        if (existingScript) {
            return;
        }

        container.innerHTML = '';

        const script = document.createElement('script');
        script.src = 'https://giscus.app/client.js';
        script.async = true;
        script.crossOrigin = 'anonymous';
        script.setAttribute('data-giscus-script', 'true');
        script.setAttribute('data-repo', GISCUS_OPTIONS.repo);
        script.setAttribute('data-repo-id', GISCUS_OPTIONS.repoId);
        script.setAttribute('data-mapping', GISCUS_OPTIONS.mapping);
        script.setAttribute('data-term', String(term));
        script.setAttribute('data-reactions-enabled', '1');
        script.setAttribute('data-emit-metadata', '0');
        script.setAttribute('data-input-position', 'top');
        script.setAttribute('data-theme', GISCUS_OPTIONS.theme);
        script.setAttribute('data-lang', GISCUS_OPTIONS.lang);
        script.setAttribute('data-loading', 'lazy');
        container.appendChild(script);
    }

    function renderList(items, state) {
        const listEl = $('qa-list-items');
        const emptyEl = $('qa-empty');
        const metaEl = $('qa-list-meta');
        if (!listEl || !emptyEl || !metaEl) return;

        listEl.innerHTML = '';
        emptyEl.style.display = items.length ? 'none' : 'block';
        metaEl.textContent = state.metaText;

        items.forEach(item => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'qa-item';
            button.setAttribute('role', 'listitem');
            button.dataset.number = String(item.number);

            const solved = Boolean(item.answerChosenAt);
            const subtitle = [
                item.author ? `@${item.author}` : '',
                item.updatedAt ? `更新 ${formatDate(item.updatedAt)}` : '',
                Number.isFinite(item.comments) ? `${item.comments} 回复` : ''
            ].filter(Boolean).join(' · ');

            button.innerHTML = `
                <div class="qa-item-main">
                    <div class="qa-item-title">${escapeText(item.title || '')}</div>
                    <div class="qa-item-subtitle">${escapeText(subtitle)}</div>
                </div>
                <div class="qa-item-badges">
                    <span class="qa-badge ${solved ? 'qa-badge-solved' : 'qa-badge-unsolved'}">${solved ? '已解决' : '未解决'}</span>
                    <span class="qa-badge qa-badge-number">#${escapeText(item.number)}</span>
                </div>
            `;

            if (state.selectedNumber === item.number) {
                button.classList.add('active');
            }

            button.addEventListener('click', function () {
                state.onSelect(item.number);
            });

            listEl.appendChild(button);
        });
    }

    function updateSelectedView(item) {
        const titleEl = $('qa-selected-title');
        const subtitleEl = $('qa-selected-subtitle');
        const openEl = $('qa-open-selected');
        if (!titleEl || !subtitleEl || !openEl) return;

        if (!item) {
            titleEl.textContent = '请选择一个问题';
            subtitleEl.textContent = '';
            openEl.style.display = 'none';
            openEl.href = 'https://github.com/DPapyru/DPapyru.github.io/discussions';
            return;
        }

        titleEl.textContent = item.title || `#${item.number}`;
        const parts = [];
        if (item.author) parts.push(`@${item.author}`);
        if (item.updatedAt) parts.push(`更新 ${formatDate(item.updatedAt)}`);
        if (Number.isFinite(item.comments)) parts.push(`${item.comments} 回复`);
        if (item.answerChosenAt) parts.push('已解决');
        subtitleEl.textContent = parts.join(' · ');

        openEl.href = item.url || 'https://github.com/DPapyru/DPapyru.github.io/discussions';
        openEl.style.display = 'inline-flex';
    }

    function normalizeIndexPayload(payload) {
        const rawItems = Array.isArray(payload && payload.items) ? payload.items : [];
        return rawItems
            .filter(it => it && typeof it.number === 'number' && it.number > 0)
            .map(it => ({
                number: it.number,
                title: String(it.title || ''),
                url: String(it.url || ''),
                createdAt: it.createdAt || null,
                updatedAt: it.updatedAt || null,
                author: it.author || '',
                comments: typeof it.comments === 'number' ? it.comments : null,
                answerChosenAt: it.answerChosenAt || null
            }));
    }

    function applyFilters(allItems, query, filterValue) {
        const q = String(query || '').trim().toLowerCase();
        const mode = String(filterValue || 'all');
        return allItems.filter(item => {
            const solved = Boolean(item.answerChosenAt);
            if (mode === 'solved' && !solved) return false;
            if (mode === 'unsolved' && solved) return false;
            if (!q) return true;
            const hay = `${item.title} ${item.author} #${item.number}`.toLowerCase();
            return hay.includes(q);
        });
    }

    async function loadIndex() {
        const res = await fetch(QNA_INDEX_URL, { cache: 'no-store' });
        if (!res.ok) throw new Error(`无法加载 ${QNA_INDEX_URL}: ${res.status}`);
        return res.json();
    }

    function updateNewDiscussionLinkFromPayload(payload) {
        const openGithubEl = $('qa-open-github');
        if (!openGithubEl) return;

        const source = payload && payload.source ? payload.source : null;
        const owner = source && source.owner ? String(source.owner) : '';
        const repo = source && source.repo ? String(source.repo) : '';

        const category = source && source.category ? source.category : null;
        const categorySlug = category && category.slug ? String(category.slug).trim() : '';

        if (!owner || !repo || !categorySlug) return;

        const url = new URL(`https://github.com/${owner}/${repo}/discussions/new`);
        url.searchParams.set('category', categorySlug);
        openGithubEl.href = url.toString();
    }

    function initAskForm() {
        const titleEl = $('qa-title');
        const generateBtn = $('qa-generate');
        const copyBtn = $('qa-copy');
        const copyGoBtn = $('qa-copy-and-go');
        const clearDraftBtn = $('qa-clear-draft');
        const outputEl = $('qa-markdown');
        const hintEl = $('qa-action-hint');
        const openGithubEl = $('qa-open-github');

        if (!titleEl || !generateBtn || !copyBtn || !copyGoBtn || !outputEl || !hintEl || !openGithubEl) return;

        let isDirty = false;

        function setHint(text) {
            hintEl.textContent = text || '';
        }

        if (clearDraftBtn) {
            clearDraftBtn.disabled = true;
        }

        function readValues() {
            return {
                title: titleEl.value,
                background: ($('qa-background') || {}).value,
                repro: ($('qa-repro') || {}).value,
                expected: ($('qa-expected') || {}).value,
                actual: ($('qa-actual') || {}).value,
                env: ($('qa-env') || {}).value,
                tried: ($('qa-tried') || {}).value,
                links: ($('qa-links') || {}).value
            };
        }

        function updateButtons() {
            const hasContent = Boolean(String(outputEl.value || '').trim());
            copyBtn.disabled = !hasContent;
            copyGoBtn.disabled = !hasContent;
        }

        function buildIfNeeded() {
            const hasContent = Boolean(String(outputEl.value || '').trim());
            if (hasContent && !isDirty) return true;

            const title = String(titleEl.value || '').trim();
            if (!title) return false;

            outputEl.value = buildQuestionMarkdown(readValues());
            setHint('已生成内容：建议复制后到 GitHub 发布。');
            updateButtons();
            isDirty = false;
            saveDraftSoon();
            return true;
        }

        let saveTimer = null;
        function saveDraftSoon() {
            if (saveTimer) window.clearTimeout(saveTimer);
            saveTimer = window.setTimeout(function () {
                saveTimer = null;
                try {
                    const draft = {
                        version: 1,
                        updatedAt: new Date().toISOString(),
                        values: readValues(),
                        markdown: outputEl.value
                    };
                    window.localStorage.setItem(ASK_DRAFT_KEY, JSON.stringify(draft));
                    if (clearDraftBtn) clearDraftBtn.disabled = false;
                } catch {
                    // ignore
                }
            }, 250);
        }

        function restoreDraft() {
            try {
                const raw = window.localStorage.getItem(ASK_DRAFT_KEY);
                if (!raw) return;
                if (clearDraftBtn) clearDraftBtn.disabled = false;
                const draft = JSON.parse(raw);
                const values = draft && draft.values ? draft.values : null;
                if (!values) return;

                titleEl.value = values.title || '';
                const map = [
                    ['qa-background', 'background'],
                    ['qa-repro', 'repro'],
                    ['qa-expected', 'expected'],
                    ['qa-actual', 'actual'],
                    ['qa-env', 'env'],
                    ['qa-tried', 'tried'],
                    ['qa-links', 'links']
                ];
                map.forEach(pair => {
                    const el = $(pair[0]);
                    if (!el) return;
                    el.value = values[pair[1]] || '';
                });

                const markdown = draft && typeof draft.markdown === 'string' ? draft.markdown : '';
                if (markdown) {
                    outputEl.value = markdown;
                }
                isDirty = false;
                updateButtons();

                const hasAny = Boolean(String(titleEl.value || '').trim())
                    || ['qa-background', 'qa-repro', 'qa-expected', 'qa-actual', 'qa-env', 'qa-tried', 'qa-links']
                        .some(id => Boolean(String((($(id) || {}).value) || '').trim()));
                if (hasAny) {
                    setHint('已恢复本地草稿。');
                }
            } catch {
                // ignore
            }
        }

        function clearDraft() {
            try {
                window.localStorage.removeItem(ASK_DRAFT_KEY);
            } catch {
                // ignore
            }
        }

        function resetForm() {
            titleEl.value = '';
            ['qa-background', 'qa-repro', 'qa-expected', 'qa-actual', 'qa-env', 'qa-tried', 'qa-links'].forEach(id => {
                const el = $(id);
                if (el) el.value = '';
            });
            outputEl.value = '';
            isDirty = false;
            updateButtons();
        }

        generateBtn.addEventListener('click', function () {
            setHint('');
            const title = String(titleEl.value || '').trim();
            if (!title) {
                setHint('请先填写标题。');
                outputEl.value = '';
                updateButtons();
                titleEl.focus();
                return;
            }

            outputEl.value = buildQuestionMarkdown(readValues());
            setHint('已生成内容：建议复制后到 GitHub 发布。');
            updateButtons();
            isDirty = false;
            saveDraftSoon();
        });

        copyBtn.addEventListener('click', async function () {
            setHint('');
            if (!buildIfNeeded()) {
                setHint('请先填写标题。');
                titleEl.focus();
                return;
            }
            try {
                await requestCopy(outputEl.value);
                setHint('已复制到剪贴板。');
            } catch {
                setHint('复制失败：请手动全选复制。');
                outputEl.focus();
                outputEl.select();
            }
        });

        copyGoBtn.addEventListener('click', async function () {
            setHint('');
            if (!buildIfNeeded()) {
                setHint('请先填写标题。');
                titleEl.focus();
                return;
            }
            try {
                await requestCopy(outputEl.value);
                setHint('已复制：已打开 GitHub 发布页面。');
            } catch {
                setHint('复制失败：请手动复制后再发布。已打开 GitHub。');
                outputEl.focus();
                outputEl.select();
            }

            window.open(openGithubEl.href, '_blank', 'noopener');
        });

        [titleEl, $('qa-background'), $('qa-repro'), $('qa-expected'), $('qa-actual'), $('qa-env'), $('qa-tried'), $('qa-links')]
            .filter(Boolean)
            .forEach(el => {
                el.addEventListener('input', saveDraftSoon);
                el.addEventListener('input', function () {
                    isDirty = true;
                });
            });

        if (clearDraftBtn) {
            clearDraftBtn.addEventListener('click', function () {
                clearDraft();
                resetForm();
                setHint('已清空本地草稿。');
                clearDraftBtn.disabled = true;
            });
        }

        restoreDraft();
    }

    async function init() {
        initAskForm();

        const errorEl = $('qa-error');
        const searchEl = $('qa-search');
        const filterEl = $('qa-filter');
        const giscusContainer = $('qa-giscus-container');

        const state = {
            allItems: [],
            filteredItems: [],
            selectedNumber: null,
            metaText: '',
            onSelect: function (number) {}
        };

        function selectNumber(number) {
            const n = number ? parseInt(number, 10) : NaN;
            const next = Number.isFinite(n) && n > 0 ? n : null;
            state.selectedNumber = next;
            setSelectedNumberToUrl(next);

            const item = state.allItems.find(it => it.number === next) || null;
            updateSelectedView(item);

            if (next) {
                loadGiscus(giscusContainer, next);
                const placeholder = $('qa-giscus-placeholder');
                if (placeholder) placeholder.style.display = 'none';
            }

            const q = searchEl ? searchEl.value : '';
            const filter = filterEl ? filterEl.value : 'all';
            state.filteredItems = applyFilters(state.allItems, q, filter);
            state.metaText = `共 ${state.allItems.length} 条，当前显示 ${state.filteredItems.length} 条`;
            renderList(state.filteredItems, state);
        }

        state.onSelect = selectNumber;

        try {
            const payload = await loadIndex();
            updateNewDiscussionLinkFromPayload(payload);
            state.allItems = normalizeIndexPayload(payload);

            const selectedFromUrl = getSelectedNumberFromUrl();
            const first = state.allItems.length ? state.allItems[0].number : null;
            selectNumber(selectedFromUrl || first);

            if (!state.allItems.length) {
                const emptyEl = $('qa-empty');
                if (emptyEl) emptyEl.style.display = 'block';
                updateSelectedView(null);
            }
        } catch (err) {
            if (errorEl) {
                errorEl.textContent = String(err && err.message ? err.message : err);
                errorEl.style.display = 'block';
            }
            updateSelectedView(null);
        }

        function refreshList() {
            const q = searchEl ? searchEl.value : '';
            const filter = filterEl ? filterEl.value : 'all';
            state.filteredItems = applyFilters(state.allItems, q, filter);
            state.metaText = `共 ${state.allItems.length} 条，当前显示 ${state.filteredItems.length} 条`;
            renderList(state.filteredItems, state);
        }

        if (searchEl) {
            searchEl.addEventListener('input', refreshList);
        }
        if (filterEl) {
            filterEl.addEventListener('change', refreshList);
        }
    }

    document.addEventListener('DOMContentLoaded', init);
})();

