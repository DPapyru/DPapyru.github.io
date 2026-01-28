// Onboarding quiz renderer + scorer (wizard: one question at a time).
// Style: semicolons, 4-space indent, IIFE.
(function () {
    'use strict';

    var PROFILE_KEY = 'learningProfile';
    var DISMISSED_KEY = 'learningOnboardingDismissed';
    var PREFS_KEY = 'learningPreferences';

    function getAssetUrl(path) {
        return '/site/' + String(path || '').replace(/^\/+/, '');
    }

    function el(tag, className) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        return node;
    }

    function clampInt(value, min, max) {
        var parsed = Number.parseInt(value, 10);
        if (!Number.isFinite(parsed)) return min;
        return Math.max(min, Math.min(max, parsed));
    }

    function mapTotalScoreToLevel(scoring, total) {
        var rules = scoring && Array.isArray(scoring.levelByTotalScore) ? scoring.levelByTotalScore : [];
        for (var i = 0; i < rules.length; i++) {
            var rule = rules[i];
            if (total >= rule.min && total <= rule.max) return rule.level;
        }
        return 0;
    }

    function pickRandom(items) {
        if (!Array.isArray(items) || items.length === 0) return null;
        return items[Math.floor(Math.random() * items.length)];
    }

    function shuffleInPlace(array) {
        if (!Array.isArray(array)) return array;
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = array[i];
            array[i] = array[j];
            array[j] = tmp;
        }
        return array;
    }

    function sampleWithoutReplacement(items, count) {
        var pool = Array.isArray(items) ? items.slice() : [];
        shuffleInPlace(pool);
        return pool.slice(0, Math.max(0, Math.min(Number(count) || 0, pool.length)));
    }

    function normalizeChoices(choices) {
        if (!Array.isArray(choices)) return [];
        return choices.map(function (c) {
            return {
                label: String(c.label || ''),
                score: typeof c.score === 'number' ? c.score : null,
                value: typeof c.value === 'string' ? c.value : null
            };
        });
    }

    function setProfile(profile, prefs) {
        try {
            window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
            if (prefs && Object.keys(prefs).length) {
                window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
            }
        } catch (e) {
            // ignore
        }
    }

    function setDismissed() {
        try {
            window.localStorage.setItem(DISMISSED_KEY, 'true');
        } catch (e) {
            // ignore
        }
    }

    function goDocsIndex() {
        window.location.href = '/site/pages/folder.html';
    }

    async function loadQuizSpec() {
        var url = getAssetUrl('assets/learning-quiz.v1.json');
        var response = await fetch(url, { cache: 'no-cache' });
        if (!response.ok) throw new Error('Failed to load quiz: ' + response.status);
        return await response.json();
    }

    function buildWizardQuestions(spec) {
        var slots = spec && spec.slots ? spec.slots : null;
        if (!slots) return null;

        var csharpBank = Array.isArray(slots.csharp) ? slots.csharp : [];
        var tml = slots.tmodloader || {};
        var basicApiBank = Array.isArray(tml.basicApi) ? tml.basicApi : [];
        var modPlayerBank = Array.isArray(tml.modPlayer) ? tml.modPlayer : [];
        var modSystemBank = Array.isArray(tml.modSystem) ? tml.modSystem : [];

        var advancedBuckets = tml.advanced && tml.advanced.buckets ? tml.advanced.buckets : {};
        var bucketKeys = Object.keys(advancedBuckets);
        var pickedBucketKey = pickRandom(bucketKeys);
        var advanced = pickedBucketKey ? pickRandom(advancedBuckets[pickedBucketKey]) : null;

        var prefsBank = Array.isArray(slots.preferences) ? slots.preferences : [];

        var csharp = sampleWithoutReplacement(csharpBank, 9);
        var basicApi = sampleWithoutReplacement(basicApiBank, 4);
        var modPlayer = sampleWithoutReplacement(modPlayerBank, 2);
        var modSystem = sampleWithoutReplacement(modSystemBank, 2);
        var prefs = sampleWithoutReplacement(prefsBank, 4);

        var questions = [];
        csharp.forEach(function (q, idx) {
            questions.push({
                kind: 'csharp',
                sectionLabel: 'C# 熟练度',
                sectionIndex: idx + 1,
                sectionTotal: csharp.length,
                id: q.id,
                prompt: q.prompt,
                choices: q.choices
            });
        });

        var tmlQuestions = basicApi.concat(modPlayer).concat(modSystem).concat(advanced ? [advanced] : []);
        tmlQuestions.forEach(function (q, idx) {
            questions.push({
                kind: 'tml',
                sectionLabel: 'tModLoader 熟悉度',
                sectionIndex: idx + 1,
                sectionTotal: tmlQuestions.length,
                id: q.id,
                prompt: q.prompt,
                choices: q.choices
            });
        });

        prefs.forEach(function (q, idx) {
            questions.push({
                kind: 'pref',
                sectionLabel: '偏好',
                sectionIndex: idx + 1,
                sectionTotal: prefs.length,
                id: q.id,
                prompt: q.prompt,
                choices: q.choices
            });
        });

        return {
            questions: questions,
            advancedPickedBucket: pickedBucketKey || ''
        };
    }

    function renderWizard(spec, wizard) {
        var root = document.getElementById('learning-onboarding-root');
        if (!root) return;

        var questions = wizard.questions || [];
        if (!questions.length) {
            root.innerHTML = '<div class="learning-onboarding-error">题库为空</div>';
            return;
        }

        var answers = new Array(questions.length);
        var currentIndex = 0;

        var header = el('div', 'learning-onboarding-header');
        header.innerHTML = [
            '<h1 class="learning-onboarding-title">入站测评</h1>',
            '<p class="learning-onboarding-subtitle">每次只显示一道题（约 2 分钟），可跳过。完成后会为你过滤展示更合适的文档。</p>'
        ].join('');
        root.appendChild(header);

        var progress = el('div', 'learning-progress');
        root.appendChild(progress);

        var card = el('section', 'learning-section');
        var sectionTitle = el('h2', 'learning-section-title');
        var questionWrap = el('div', 'learning-question');
        var questionTitle = el('div', 'learning-question-title');
        var questionBody = el('div', 'learning-question-body');
        var questionError = el('div', 'learning-question-error');
        questionError.textContent = '';

        questionWrap.appendChild(questionTitle);
        questionWrap.appendChild(questionBody);
        questionWrap.appendChild(questionError);
        card.appendChild(sectionTitle);
        card.appendChild(questionWrap);
        root.appendChild(card);

        var actions = el('div', 'learning-actions');

        var prevBtn = document.createElement('button');
        prevBtn.type = 'button';
        prevBtn.className = 'btn btn-outline';
        prevBtn.textContent = '上一题';

        var nextBtn = document.createElement('button');
        nextBtn.type = 'button';
        nextBtn.className = 'btn btn-primary';
        nextBtn.textContent = '下一题';

        var skipBtn = document.createElement('button');
        skipBtn.type = 'button';
        skipBtn.className = 'btn btn-secondary';
        skipBtn.textContent = '跳过';

        var result = el('div', 'learning-result');
        result.setAttribute('aria-live', 'polite');

        actions.appendChild(prevBtn);
        actions.appendChild(nextBtn);
        actions.appendChild(skipBtn);
        actions.appendChild(result);
        root.appendChild(actions);

        function getSelectedIndex() {
            var selected = questionBody.querySelector('input[type="radio"]:checked');
            if (!selected) return null;
            return clampInt(selected.value, 0, 999);
        }

        function setError(message) {
            questionError.textContent = message || '';
            if (message) {
                questionWrap.setAttribute('data-invalid', 'true');
            } else {
                questionWrap.removeAttribute('data-invalid');
            }
        }

        function updateButtons() {
            prevBtn.disabled = currentIndex <= 0;
            nextBtn.textContent = (currentIndex >= questions.length - 1) ? '提交并进入文档' : '下一题';
        }

        function renderCurrent() {
            var q = questions[currentIndex];
            var n = currentIndex + 1;
            progress.textContent = '第 ' + n + ' / ' + questions.length + ' 题';

            sectionTitle.textContent = q.sectionLabel + '（' + q.sectionIndex + '/' + q.sectionTotal + '）';
            questionTitle.textContent = String(q.prompt || '');

            questionBody.innerHTML = '';
            setError('');
            result.textContent = '';

            var choices = normalizeChoices(q.choices);
            choices.forEach(function (choice, idx) {
                var label = el('label', 'learning-choice');
                var input = document.createElement('input');
                input.type = 'radio';
                input.name = 'learning-question-' + currentIndex;
                input.value = String(idx);

                var text = el('span', 'learning-choice-text');
                text.textContent = choice.label;

                label.appendChild(input);
                label.appendChild(text);
                questionBody.appendChild(label);
            });

            if (answers[currentIndex] != null) {
                var saved = answers[currentIndex];
                var match = questionBody.querySelector('input[value="' + String(saved) + '"]');
                if (match) match.checked = true;
            }

            updateButtons();
        }

        function computeFinal() {
            var cTotal = 0;
            var tTotal = 0;
            var prefs = {};

            for (var i = 0; i < questions.length; i++) {
                var q = questions[i];
                var idx = answers[i];
                if (idx == null) return null;

                var choices = normalizeChoices(q.choices);
                var choice = choices[idx];
                if (!choice) continue;

                if (q.kind === 'pref') {
                    if (choice.value != null) {
                        prefs[q.id] = { value: choice.value, label: choice.label };
                    }
                    continue;
                }

                var score = typeof choice.score === 'number' ? choice.score : 0;
                if (q.kind === 'csharp') cTotal += score;
                if (q.kind === 'tml') tTotal += score;
            }

            return { cTotal: cTotal, tTotal: tTotal, prefs: prefs };
        }

        prevBtn.addEventListener('click', function () {
            var selected = getSelectedIndex();
            if (selected != null) answers[currentIndex] = selected;
            if (currentIndex > 0) currentIndex -= 1;
            renderCurrent();
        });

        nextBtn.addEventListener('click', function () {
            var selected = getSelectedIndex();
            if (selected == null) {
                setError('请选择一个选项');
                return;
            }

            answers[currentIndex] = selected;
            setError('');

            if (currentIndex < questions.length - 1) {
                currentIndex += 1;
                renderCurrent();
                return;
            }

            var final = computeFinal();
            if (!final) {
                result.textContent = '请先完成所有题目';
                return;
            }

            var cLevel = mapTotalScoreToLevel(spec.scoring, final.cTotal);
            var tLevel = mapTotalScoreToLevel(spec.scoring, final.tTotal);

            setProfile({
                c: cLevel,
                t: tLevel,
                updatedAt: new Date().toISOString(),
                version: 1
            }, final.prefs);

            result.textContent = '已保存你的学习路径（C' + cLevel + '/T' + tLevel + '），正在跳转...';
            goDocsIndex();
        });

        skipBtn.addEventListener('click', function () {
            setDismissed();
            goDocsIndex();
        });

        renderCurrent();
    }

    document.addEventListener('DOMContentLoaded', function () {
        var mount = document.getElementById('learning-onboarding-root');
        if (!mount) return;

        loadQuizSpec()
            .then(function (spec) {
                var wizard = buildWizardQuestions(spec);
                if (!wizard) throw new Error('Invalid quiz spec');
                renderWizard(spec, wizard);
            })
            .catch(function (err) {
                mount.innerHTML = '<div class="learning-onboarding-error">无法加载测评题库：' + String(err && err.message ? err.message : err) + '</div>';
            });
    });
}());
