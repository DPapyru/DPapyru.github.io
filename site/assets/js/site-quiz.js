// Quiz renderer for site/pages/viewer.html
// Style: CommonJS-ish, semicolons, 4-space indent, global export via window.SiteQuiz.

(function () {
    'use strict';

    function normalizeNewlines(text) {
        return String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    }

    function trimIndentBlock(lines) {
        const normalized = lines.map((l) => String(l));
        const nonEmpty = normalized.filter((l) => l.trim().length > 0);
        if (nonEmpty.length === 0) return '';

        const indents = nonEmpty.map((l) => {
            const match = l.match(/^[ \t]*/);
            return match ? match[0].length : 0;
        });
        const minIndent = Math.min.apply(null, indents);
        return normalized.map((l) => l.slice(minIndent)).join('\n').trimEnd();
    }

    function parseQuizYamlLike(source) {
        const lines = normalizeNewlines(source).split('\n');
        let index = 0;

        function peek() {
            return index < lines.length ? lines[index] : null;
        }

        function next() {
            const line = peek();
            index += 1;
            return line;
        }

        function indentOf(line) {
            const match = String(line || '').match(/^[ ]*/);
            return match ? match[0].length : 0;
        }

        function parseBlockScalar(baseIndent) {
            const blockLines = [];
            while (true) {
                const line = peek();
                if (line === null) break;
                if (line.trim().length === 0) {
                    blockLines.push('');
                    next();
                    continue;
                }
                const ind = indentOf(line);
                if (ind <= baseIndent) break;
                blockLines.push(line.slice(baseIndent + 2));
                next();
            }
            return trimIndentBlock(blockLines);
        }

        function parseScalar(value) {
            const v = String(value || '').trim();
            if (v === 'true') return true;
            if (v === 'false') return false;
            return v;
        }

        const out = {};

        while (index < lines.length) {
            const line = next();
            if (!line) continue;
            if (line.trim().length === 0) continue;

            const baseIndent = indentOf(line);
            const trimmed = line.trim();

            // options list item
            if (trimmed === 'options:') {
                out.options = [];
                while (true) {
                    const l = peek();
                    if (l === null) break;
                    if (l.trim().length === 0) {
                        next();
                        continue;
                    }
                    if (indentOf(l) <= baseIndent) break;
                    const itemTrimmed = l.trim();
                    if (!itemTrimmed.startsWith('-')) break;

                    // Start a new option item
                    const option = {};
                    // Consume "- ..." line
                    const first = next().trim();
                    // Allow "- id: A" on same line
                    const inline = first.replace(/^-+/, '').trim();
                    if (inline) {
                        const m = inline.match(/^([^:]+):\s*(.*)$/);
                        if (m) option[m[1].trim()] = parseScalar(m[2]);
                    }

                    // Parse indented key/value pairs
                    while (true) {
                        const p = peek();
                        if (p === null) break;
                        if (p.trim().length === 0) {
                            next();
                            continue;
                        }
                        const pIndent = indentOf(p);
                        if (pIndent <= baseIndent + 1) break;
                        const pTrim = p.trim();
                        if (pTrim.startsWith('-')) break;

                        const kv = next();
                        const m = kv.trim().match(/^([^:]+):\s*(.*)$/);
                        if (!m) continue;
                        const key = m[1].trim();
                        const val = m[2];
                        if (String(val).trim() === '|') {
                            option[key] = parseBlockScalar(pIndent);
                        } else {
                            option[key] = parseScalar(val);
                        }
                    }

                    out.options.push(option);
                }
                continue;
            }

            // answer list
            if (trimmed === 'answer:') {
                out.answer = [];
                while (true) {
                    const l = peek();
                    if (l === null) break;
                    if (l.trim().length === 0) {
                        next();
                        continue;
                    }
                    if (indentOf(l) <= baseIndent) break;
                    const t = l.trim();
                    if (!t.startsWith('-')) break;
                    out.answer.push(t.replace(/^-+/, '').trim());
                    next();
                }
                continue;
            }

            const match = trimmed.match(/^([^:]+):\s*(.*)$/);
            if (!match) continue;
            const key = match[1].trim();
            const val = match[2];

            if (String(val).trim() === '|') {
                out[key] = parseBlockScalar(baseIndent);
                continue;
            }

            out[key] = parseScalar(val);
        }

        return out;
    }

    function asArray(value) {
        if (Array.isArray(value)) return value;
        if (value === null || typeof value === 'undefined' || value === '') return [];
        return [value];
    }

    function normalizeTfAnswer(value) {
        if (typeof value === 'boolean') return String(value);
        const text = String(value == null ? '' : value).trim().toLowerCase();
        if (text === 'true') return 'true';
        if (text === 'false') return 'false';
        return '';
    }

    function setEquals(a, b) {
        const setA = new Set(a);
        const setB = new Set(b);
        if (setA.size !== setB.size) return false;
        for (const v of setA) {
            if (!setB.has(v)) return false;
        }
        return true;
    }

    function renderMarkdownToHtml(md, inline) {
        if (window.marked) {
            if (inline && typeof window.marked.parseInline === 'function') {
                return window.marked.parseInline(String(md || ''));
            }
            if (typeof window.marked.parse === 'function') {
                const html = window.marked.parse(String(md || ''));
                if (inline) {
                    // best-effort：将单段落包裹去掉，避免在行内渲染时产生额外块级结构
                    const trimmed = String(html || '').trim();
                    const m = trimmed.match(/^<p>([\s\S]*)<\/p>$/);
                    return m ? m[1] : trimmed;
                }
                return html;
            }
        }
        return inline ? String(md || '') : '<pre><code>' + String(md || '') + '</code></pre>';
    }

    function createEl(tag, className) {
        const el = document.createElement(tag);
        if (className) el.className = className;
        return el;
    }

    function renderQuiz(preEl, quiz) {
        const quizType = String(quiz.type || '').trim();
        const quizId = String(quiz.id || '').trim() || ('quiz-' + Math.random().toString(16).slice(2));
        const questionHtml = renderMarkdownToHtml(quiz.question || '');
        const explainHtml = renderMarkdownToHtml(quiz.explain || '');

        const container = createEl('div', 'site-quiz');
        container.setAttribute('data-quiz-id', quizId);
        container.setAttribute('data-quiz-type', quizType);

        const header = createEl('div', 'site-quiz-header');
        const title = createEl('div', 'site-quiz-title');
        title.textContent = '题目';
        header.appendChild(title);

        const body = createEl('div', 'site-quiz-body');
        const question = createEl('div', 'site-quiz-question');
        question.innerHTML = questionHtml;

        const form = createEl('form', 'site-quiz-form');
        form.setAttribute('autocomplete', 'off');

        const optionsWrap = createEl('div', 'site-quiz-options');
        const result = createEl('div', 'site-quiz-result');
        result.setAttribute('aria-live', 'polite');

        const explain = createEl('details', 'site-quiz-explain');
        const explainSummary = createEl('summary', 'site-quiz-explain-summary');
        explainSummary.textContent = '解析';
        const explainBody = createEl('div', 'site-quiz-explain-body');
        explainBody.innerHTML = explainHtml;
        explain.appendChild(explainSummary);
        explain.appendChild(explainBody);

        let expectedAnswers = [];
        if (quizType === 'tf') {
            const tfAnswer = normalizeTfAnswer(quiz.answer);
            expectedAnswers = [tfAnswer || 'false'];
            const name = 'tf-' + quizId;
            const tfOptions = [
                { id: 'true', text: '对' },
                { id: 'false', text: '错' }
            ];
            tfOptions.forEach((opt) => {
                const label = createEl('label', 'site-quiz-option');
                const input = document.createElement('input');
                input.type = 'radio';
                input.name = name;
                input.value = opt.id;
                const text = createEl('span', 'site-quiz-option-text');
                text.textContent = opt.text;
                label.appendChild(input);
                label.appendChild(text);
                optionsWrap.appendChild(label);
            });
        } else {
            expectedAnswers = asArray(quiz.answer).map((x) => String(x));
            const isMulti = expectedAnswers.length > 1;
            const inputType = isMulti ? 'checkbox' : 'radio';
            const name = 'choice-' + quizId;
            const options = Array.isArray(quiz.options) ? quiz.options : [];

            options.forEach((opt) => {
                const optionId = String(opt.id || '').trim();
                const label = createEl('label', 'site-quiz-option');
                const input = document.createElement('input');
                input.type = inputType;
                input.name = name;
                input.value = optionId;

                const text = createEl('div', 'site-quiz-option-text');
                text.innerHTML = renderMarkdownToHtml(opt.text || '', true);
                label.appendChild(input);
                label.appendChild(text);
                optionsWrap.appendChild(label);
            });
        }

        const actions = createEl('div', 'site-quiz-actions');
        const submit = document.createElement('button');
        submit.type = 'button';
        submit.className = 'site-quiz-submit';
        submit.textContent = '提交';

        const reset = document.createElement('button');
        reset.type = 'button';
        reset.className = 'site-quiz-reset';
        reset.textContent = '重置';

        actions.appendChild(submit);
        actions.appendChild(reset);

        function collectSelected() {
            const inputs = optionsWrap.querySelectorAll('input');
            const selected = [];
            inputs.forEach((i) => {
                if (i.checked) selected.push(String(i.value));
            });
            return selected;
        }

        function setResult(ok) {
            container.setAttribute('data-quiz-status', ok ? 'correct' : 'wrong');
            result.textContent = ok ? '回答正确' : '回答错误';
            explain.open = true;
        }

        submit.addEventListener('click', () => {
            const selected = collectSelected();
            if (selected.length === 0) {
                result.textContent = '请选择一个答案';
                return;
            }
            setResult(setEquals(selected, expectedAnswers));
        });

        reset.addEventListener('click', () => {
            const inputs = optionsWrap.querySelectorAll('input');
            inputs.forEach((i) => {
                i.checked = false;
            });
            container.removeAttribute('data-quiz-status');
            result.textContent = '';
            explain.open = false;
        });

        form.appendChild(optionsWrap);
        form.appendChild(actions);
        form.appendChild(result);
        form.appendChild(explain);

        body.appendChild(question);
        body.appendChild(form);

        container.appendChild(header);
        container.appendChild(body);

        preEl.replaceWith(container);
    }

    function renderQuizzes(root) {
        const container = root || document;
        const blocks = container.querySelectorAll('pre > code.language-quiz');
        blocks.forEach((codeEl) => {
            const pre = codeEl.parentElement;
            if (!pre) return;
            if (pre.getAttribute('data-quiz-processed') === 'true') return;
            pre.setAttribute('data-quiz-processed', 'true');

            const raw = codeEl.textContent || '';
            let quiz;
            try {
                quiz = parseQuizYamlLike(raw);
            } catch (e) {
                console.warn('Quiz parse failed:', e);
                return;
            }

            if (!quiz || !quiz.type || !quiz.question) return;
            renderQuiz(pre, quiz);
        });
    }

    window.SiteQuiz = {
        renderQuizzes: renderQuizzes
    };
})();
