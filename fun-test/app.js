(function () {
    'use strict';

    const QUIZ_DATA_URL = '/fun-test/quiz-data.v1.json';
    const STORAGE_PROGRESS_KEY = 'funTestProgress.v1';
    const STORAGE_HISTORY_KEY = 'funTestHistory.v1';

    const screens = {
        start: document.getElementById('screen-start'),
        quiz: document.getElementById('screen-quiz'),
        result: document.getElementById('screen-result')
    };

    const ui = {
        startButton: document.getElementById('btn-start'),
        continueButton: document.getElementById('btn-continue'),
        prevButton: document.getElementById('btn-prev'),
        nextButton: document.getElementById('btn-next'),
        submitButton: document.getElementById('btn-submit'),
        restartButton: document.getElementById('btn-restart'),
        clearProgressButton: document.getElementById('btn-clear-progress'),
        clearHistoryButton: document.getElementById('btn-clear-history'),
        quizProgress: document.getElementById('quiz-progress'),
        quizNav: document.getElementById('quiz-nav'),
        questionCard: document.getElementById('question-card'),
        quizHint: document.getElementById('quiz-hint'),
        resultTime: document.getElementById('result-time'),
        resultDimensions: document.getElementById('result-dimensions'),
        resultTitles: document.getElementById('result-titles'),
        resultHistory: document.getElementById('result-history'),
        resultRadar: document.getElementById('result-radar')
    };

    const state = {
        quizData: null,
        answers: {},
        currentIndex: 0,
        maxReachedIndex: 0,
        startedAt: '',
        progressLoaded: null,
        radarChart: null
    };

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function safeParseJson(text, fallback) {
        try {
            return JSON.parse(text);
        } catch (_) {
            return fallback;
        }
    }

    function getLocalStorageItem(key) {
        try {
            return window.localStorage.getItem(key);
        } catch (_) {
            return null;
        }
    }

    function setLocalStorageItem(key, value) {
        try {
            window.localStorage.setItem(key, value);
        } catch (_) {
            // ignore storage errors
        }
    }

    function removeLocalStorageItem(key) {
        try {
            window.localStorage.removeItem(key);
        } catch (_) {
            // ignore storage errors
        }
    }

    function showScreen(name) {
        Object.keys(screens).forEach((key) => {
            const isCurrent = key === name;
            screens[key].hidden = !isCurrent;
            screens[key].classList.toggle('fun-screen-active', isCurrent);
        });
    }

    function getQuestionByIndex(index) {
        if (!state.quizData) return null;
        if (index < 0 || index >= state.quizData.questions.length) return null;
        return state.quizData.questions[index];
    }

    function isQuestionAnswered(question, answer) {
        if (!question) return false;
        if (question.type === 'single') return typeof answer === 'string' && answer.trim().length > 0;
        if (question.type === 'multi') return Array.isArray(answer) && answer.length > 0;
        if (question.type === 'scale') {
            const n = Number(answer);
            return Number.isInteger(n) && n >= 1 && n <= 5;
        }
        return false;
    }

    function getFirstUnansweredIndex() {
        if (!state.quizData) return -1;
        for (let i = 0; i < state.quizData.questions.length; i += 1) {
            const question = state.quizData.questions[i];
            if (!isQuestionAnswered(question, state.answers[question.id])) {
                return i;
            }
        }
        return -1;
    }

    function canJumpTo(index) {
        const maxUnlocked = Math.min(state.quizData.questions.length - 1, state.maxReachedIndex + 1);
        return index >= 0 && index <= maxUnlocked;
    }

    function setHint(text) {
        ui.quizHint.textContent = text || '';
    }

    function getDimensionLabelMap() {
        const map = {};
        (state.quizData.dimensions || []).forEach((dimension) => {
            map[dimension.key] = dimension.label;
        });
        return map;
    }

    function saveProgress() {
        if (!state.quizData) return;
        const payload = {
            quizId: state.quizData.meta.id,
            answers: state.answers,
            currentIndex: state.currentIndex,
            maxReachedIndex: state.maxReachedIndex,
            startedAt: state.startedAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        setLocalStorageItem(STORAGE_PROGRESS_KEY, JSON.stringify(payload));
    }

    function clearProgress() {
        removeLocalStorageItem(STORAGE_PROGRESS_KEY);
        state.progressLoaded = null;
        ui.continueButton.hidden = true;
    }

    function loadProgress() {
        const raw = getLocalStorageItem(STORAGE_PROGRESS_KEY);
        if (!raw) return null;
        const parsed = safeParseJson(raw, null);
        if (!parsed || typeof parsed !== 'object') return null;
        if (!parsed.quizId || parsed.quizId !== state.quizData.meta.id) return null;
        if (!parsed.answers || typeof parsed.answers !== 'object') return null;
        if (!Number.isInteger(parsed.currentIndex) || !Number.isInteger(parsed.maxReachedIndex)) return null;
        return parsed;
    }

    function loadHistory() {
        const raw = getLocalStorageItem(STORAGE_HISTORY_KEY);
        if (!raw) return [];
        const parsed = safeParseJson(raw, []);
        return Array.isArray(parsed) ? parsed : [];
    }

    function saveHistory(history) {
        setLocalStorageItem(STORAGE_HISTORY_KEY, JSON.stringify(history));
    }

    function formatDateTime(value) {
        if (!value) return '';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function createResultRecord(result) {
        const entries = Object.entries(result.normalizedScores || {});
        entries.sort((a, b) => b[1] - a[1]);
        return {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
            createdAt: new Date().toISOString(),
            titles: (result.titles || []).map((title) => ({ id: title.id, title: title.title })),
            topDimensions: entries.slice(0, 3).map(function (entry) {
                return { key: entry[0], score: entry[1] };
            })
        };
    }

    function persistResultRecord(record) {
        const history = loadHistory();
        const engine = window.FunTestQuizEngine;
        const nextHistory = engine && typeof engine.pushResultHistory === 'function'
            ? engine.pushResultHistory(history, record, 5)
            : [record].concat(history).slice(0, 5);
        saveHistory(nextHistory);
        return nextHistory;
    }

    function renderHistory(history) {
        if (!history.length) {
            ui.resultHistory.innerHTML = '<p class="fun-history-empty">暂无历史记录。</p>';
            return;
        }

        const dimensionLabels = getDimensionLabelMap();
        const html = history.map((item) => {
            const titleText = (item.titles || []).map((x) => x.title).join('、') || '未命名结果';
            const topText = (item.topDimensions || []).map((x) => {
                const label = dimensionLabels[x.key] || x.key;
                return label + ' ' + x.score;
            }).join(' · ');
            return [
                '<div class="fun-history-item">',
                '<p class="fun-history-title">' + escapeHtml(titleText) + '</p>',
                '<p class="fun-history-meta">' + escapeHtml(formatDateTime(item.createdAt)) + '</p>',
                topText ? '<p class="fun-history-meta">' + escapeHtml(topText) + '</p>' : '',
                '</div>'
            ].join('');
        }).join('');

        ui.resultHistory.innerHTML = html;
    }

    function buildQuestionNav() {
        const current = state.currentIndex;
        const questions = state.quizData.questions || [];
        const maxUnlocked = Math.min(questions.length - 1, state.maxReachedIndex + 1);

        ui.quizNav.innerHTML = '';
        questions.forEach((question, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'fun-question-nav-btn';
            button.textContent = String(index + 1);
            button.setAttribute('aria-label', '第 ' + (index + 1) + ' 题');

            const answered = isQuestionAnswered(question, state.answers[question.id]);
            if (index === current) {
                button.setAttribute('data-state', 'current');
            } else if (answered) {
                button.setAttribute('data-state', 'answered');
            } else {
                button.setAttribute('data-state', 'idle');
            }

            if (index > maxUnlocked) {
                button.disabled = true;
            }

            button.addEventListener('click', function () {
                if (!canJumpTo(index)) return;
                state.currentIndex = index;
                renderQuizStep();
                saveProgress();
            });
            ui.quizNav.appendChild(button);
        });
    }

    function updateQuestionProgress() {
        const total = state.quizData.questions.length;
        const current = state.currentIndex + 1;
        const answeredCount = state.quizData.questions.filter((question) => isQuestionAnswered(question, state.answers[question.id])).length;
        ui.quizProgress.textContent = '第 ' + current + '/' + total + ' 题 · 已答 ' + answeredCount + ' 题';
    }

    function renderSingleQuestion(question) {
        const selected = String(state.answers[question.id] || '');
        return [
            '<div class="fun-options">',
            question.options.map((option) => [
                '<label class="fun-option">',
                '<input type="radio" name="' + escapeHtml(question.id) + '" value="' + escapeHtml(option.id) + '" ' + (selected === option.id ? 'checked' : '') + '>',
                '<span class="fun-option-text">' + escapeHtml(option.text) + '</span>',
                '</label>'
            ].join('')).join(''),
            '</div>'
        ].join('');
    }

    function renderMultiQuestion(question) {
        const selectedSet = new Set(Array.isArray(state.answers[question.id]) ? state.answers[question.id].map((x) => String(x)) : []);
        return [
            '<div class="fun-options">',
            question.options.map((option) => [
                '<label class="fun-option">',
                '<input type="checkbox" name="' + escapeHtml(question.id) + '" value="' + escapeHtml(option.id) + '" ' + (selectedSet.has(option.id) ? 'checked' : '') + '>',
                '<span class="fun-option-text">' + escapeHtml(option.text) + '</span>',
                '</label>'
            ].join('')).join(''),
            '</div>'
        ].join('');
    }

    function renderScaleQuestion(question) {
        const selected = Number(state.answers[question.id] || 0);
        const scaleTexts = {
            1: '完全不同意',
            2: '不太同意',
            3: '一般',
            4: '比较同意',
            5: '非常同意'
        };

        return [
            '<div class="fun-scale-grid">',
            [1, 2, 3, 4, 5].map((level) => [
                '<label class="fun-scale-item">',
                '<input type="radio" name="' + escapeHtml(question.id) + '" value="' + level + '" ' + (selected === level ? 'checked' : '') + '>',
                '<strong>' + level + '</strong>',
                '<span>' + scaleTexts[level] + '</span>',
                '</label>'
            ].join('')).join(''),
            '</div>'
        ].join('');
    }

    function collectAnswerFromDom(question) {
        if (question.type === 'single') {
            const selected = ui.questionCard.querySelector('input[type="radio"]:checked');
            return selected ? String(selected.value) : '';
        }
        if (question.type === 'multi') {
            return Array.from(ui.questionCard.querySelectorAll('input[type="checkbox"]:checked')).map((node) => String(node.value));
        }
        if (question.type === 'scale') {
            const selected = ui.questionCard.querySelector('input[type="radio"]:checked');
            return selected ? Number(selected.value) : 0;
        }
        return null;
    }

    function onAnswerChanged(question) {
        const answer = collectAnswerFromDom(question);
        if (isQuestionAnswered(question, answer)) {
            state.answers[question.id] = answer;
        } else {
            delete state.answers[question.id];
        }
        setHint('');
        buildQuestionNav();
        updateQuestionProgress();
        saveProgress();
    }

    function bindQuestionInputs(question) {
        const inputs = ui.questionCard.querySelectorAll('input');
        inputs.forEach((input) => {
            input.addEventListener('change', function () {
                onAnswerChanged(question);
            });
        });
    }

    function updateStepButtons() {
        const total = state.quizData.questions.length;
        const isLast = state.currentIndex === total - 1;

        ui.prevButton.disabled = state.currentIndex === 0;
        ui.nextButton.hidden = isLast;
        ui.submitButton.hidden = !isLast;
    }

    function renderQuizStep() {
        const question = getQuestionByIndex(state.currentIndex);
        if (!question) return;

        const body = question.type === 'single'
            ? renderSingleQuestion(question)
            : question.type === 'multi'
                ? renderMultiQuestion(question)
                : renderScaleQuestion(question);

        ui.questionCard.innerHTML = [
            '<h3 class="fun-question-title">' + (state.currentIndex + 1) + '. ' + escapeHtml(question.prompt) + '</h3>',
            body
        ].join('');

        bindQuestionInputs(question);
        buildQuestionNav();
        updateQuestionProgress();
        updateStepButtons();
    }

    function startQuizFromScratch() {
        state.answers = {};
        state.currentIndex = 0;
        state.maxReachedIndex = 0;
        state.startedAt = new Date().toISOString();
        setHint('');
        showScreen('quiz');
        renderQuizStep();
        saveProgress();
    }

    function startQuizFromProgress(progress) {
        state.answers = progress.answers || {};
        state.currentIndex = Math.max(0, Math.min(progress.currentIndex || 0, state.quizData.questions.length - 1));
        state.maxReachedIndex = Math.max(state.currentIndex, Math.min(progress.maxReachedIndex || 0, state.quizData.questions.length - 1));
        state.startedAt = progress.startedAt || new Date().toISOString();
        setHint('');
        showScreen('quiz');
        renderQuizStep();
    }

    function drawRadar(result) {
        if (!ui.resultRadar) return;
        if (!window.Chart || typeof window.Chart !== 'function') return;

        if (state.radarChart && typeof state.radarChart.destroy === 'function') {
            state.radarChart.destroy();
            state.radarChart = null;
        }

        const labels = state.quizData.dimensions.map((dimension) => dimension.label);
        const values = state.quizData.dimensions.map((dimension) => result.normalizedScores[dimension.key] || 0);

        state.radarChart = new window.Chart(ui.resultRadar, {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [{
                    label: '维度得分',
                    data: values,
                    borderColor: 'rgba(83, 213, 255, 1)',
                    backgroundColor: 'rgba(93, 125, 255, 0.28)',
                    pointBackgroundColor: 'rgba(255, 87, 192, 1)',
                    pointBorderColor: '#ffffff',
                    pointRadius: 4,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                animation: {
                    duration: 350
                },
                scales: {
                    r: {
                        min: 0,
                        max: 100,
                        ticks: {
                            stepSize: 20,
                            backdropColor: 'transparent',
                            color: '#8ba4c7'
                        },
                        angleLines: {
                            color: 'rgba(125, 164, 255, 0.24)'
                        },
                        grid: {
                            color: 'rgba(125, 164, 255, 0.24)'
                        },
                        pointLabels: {
                            color: '#d8ebff',
                            font: {
                                size: 13
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#d8ebff'
                        }
                    }
                }
            }
        });
    }

    function renderResultDimensions(result) {
        const items = state.quizData.dimensions.map((dimension) => {
            const score = result.normalizedScores[dimension.key] || 0;
            return [
                '<div class="fun-dimension-item">',
                '<span>' + escapeHtml(dimension.label) + '</span>',
                '<strong>' + score.toFixed(1) + '</strong>',
                '</div>'
            ].join('');
        }).join('');
        ui.resultDimensions.innerHTML = items;
    }

    function renderResultTitles(result) {
        const html = (result.titles || []).map((title) => {
            return [
                '<article class="fun-title-card">',
                '<p class="fun-title-name">' + escapeHtml(title.title) + '</p>',
                '<p class="fun-title-desc">' + escapeHtml(title.description || '') + '</p>',
                '<p class="fun-title-reason">触发条件：' + escapeHtml(title.reason || '') + '</p>',
                '</article>'
            ].join('');
        }).join('');
        ui.resultTitles.innerHTML = html;
    }

    function showResult(result, history) {
        showScreen('result');
        ui.resultTime.textContent = '完成时间：' + formatDateTime(new Date().toISOString());
        renderResultDimensions(result);
        renderResultTitles(result);
        renderHistory(history);
        drawRadar(result);
    }

    function submitQuiz() {
        const firstUnanswered = getFirstUnansweredIndex();
        if (firstUnanswered >= 0) {
            state.currentIndex = firstUnanswered;
            state.maxReachedIndex = Math.max(state.maxReachedIndex, firstUnanswered);
            setHint('请先完成所有题目后再提交。');
            renderQuizStep();
            saveProgress();
            return;
        }

        const engine = window.FunTestQuizEngine;
        if (!engine || typeof engine.calculateQuizResult !== 'function') {
            setHint('测评引擎未加载，无法计算结果。');
            return;
        }

        const result = engine.calculateQuizResult(state.quizData, state.answers);
        const record = createResultRecord(result);
        const history = persistResultRecord(record);
        clearProgress();
        showResult(result, history);
    }

    function attachStaticEvents() {
        ui.startButton.addEventListener('click', function () {
            startQuizFromScratch();
        });

        ui.continueButton.addEventListener('click', function () {
            if (!state.progressLoaded) return;
            startQuizFromProgress(state.progressLoaded);
        });

        ui.prevButton.addEventListener('click', function () {
            if (state.currentIndex <= 0) return;
            state.currentIndex -= 1;
            setHint('');
            renderQuizStep();
            saveProgress();
        });

        ui.nextButton.addEventListener('click', function () {
            const question = getQuestionByIndex(state.currentIndex);
            if (!question) return;
            const answer = state.answers[question.id];
            if (!isQuestionAnswered(question, answer)) {
                setHint('当前题未作答，不能进入下一题。');
                return;
            }

            const targetIndex = state.currentIndex + 1;
            if (targetIndex >= state.quizData.questions.length) return;
            state.currentIndex = targetIndex;
            state.maxReachedIndex = Math.max(state.maxReachedIndex, state.currentIndex);
            setHint('');
            renderQuizStep();
            saveProgress();
        });

        ui.submitButton.addEventListener('click', function () {
            submitQuiz();
        });

        ui.restartButton.addEventListener('click', function () {
            startQuizFromScratch();
        });

        ui.clearProgressButton.addEventListener('click', function () {
            clearProgress();
            setHint('已清空当前进度。');
        });

        ui.clearHistoryButton.addEventListener('click', function () {
            removeLocalStorageItem(STORAGE_HISTORY_KEY);
            renderHistory([]);
        });
    }

    async function loadQuizData() {
        const response = await fetch(QUIZ_DATA_URL + '?t=' + Date.now(), { cache: 'no-store' });
        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }
        return response.json();
    }

    function updateStartActions() {
        state.progressLoaded = loadProgress();
        ui.continueButton.hidden = !state.progressLoaded;
    }

    function showStartError(message) {
        showScreen('start');
        const panel = screens.start.querySelector('.fun-panel');
        const errorNode = document.createElement('p');
        errorNode.className = 'fun-hint';
        errorNode.textContent = message;
        panel.appendChild(errorNode);
        ui.startButton.disabled = true;
        ui.continueButton.hidden = true;
    }

    async function init() {
        attachStaticEvents();
        showScreen('start');
        try {
            state.quizData = await loadQuizData();
            updateStartActions();
            renderHistory(loadHistory());
        } catch (error) {
            showStartError('题库加载失败：' + (error && error.message ? error.message : String(error)));
        }
    }

    init();
})();
