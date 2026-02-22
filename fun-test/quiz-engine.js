(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
        return;
    }
    root.FunTestQuizEngine = factory();
}(typeof window !== 'undefined' ? window : global, function () {
    'use strict';

    const CMP_SYMBOL = {
        gte: '>=',
        gt: '>',
        lte: '<=',
        lt: '<',
        eq: '==',
        neq: '!='
    };

    function assert(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }

    function toNumber(value) {
        const n = Number(value);
        return Number.isFinite(n) ? n : NaN;
    }

    function round1(value) {
        return Math.round(value * 10) / 10;
    }

    function clamp(value, min, max) {
        if (value < min) return min;
        if (value > max) return max;
        return value;
    }

    function createScoreMap(dimensions) {
        const map = {};
        (dimensions || []).forEach((dimension) => {
            map[dimension.key] = 0;
        });
        return map;
    }

    function applyScoreMap(target, scoreMap) {
        if (!scoreMap || typeof scoreMap !== 'object') return;
        Object.keys(scoreMap).forEach((key) => {
            const current = toNumber(target[key]) || 0;
            const delta = toNumber(scoreMap[key]) || 0;
            target[key] = current + delta;
        });
    }

    function compare(cmp, left, right) {
        if (cmp === 'gte') return left >= right;
        if (cmp === 'gt') return left > right;
        if (cmp === 'lte') return left <= right;
        if (cmp === 'lt') return left < right;
        if (cmp === 'eq') return left === right;
        if (cmp === 'neq') return left !== right;
        return false;
    }

    function evaluateRuleNode(ruleNode, scoreMap) {
        if (!ruleNode || typeof ruleNode !== 'object') return false;

        if (Object.prototype.hasOwnProperty.call(ruleNode, 'op')) {
            const op = ruleNode.op;
            const items = Array.isArray(ruleNode.items) ? ruleNode.items : [];
            if (items.length === 0) return false;
            if (op === 'and') return items.every((item) => evaluateRuleNode(item, scoreMap));
            if (op === 'or') return items.some((item) => evaluateRuleNode(item, scoreMap));
            return false;
        }

        const field = String(ruleNode.field || '');
        const cmp = String(ruleNode.cmp || '');
        const expected = toNumber(ruleNode.value);
        const actual = toNumber(scoreMap && scoreMap[field]);
        if (!Number.isFinite(expected) || !Number.isFinite(actual)) return false;
        return compare(cmp, actual, expected);
    }

    function describeRuleNode(ruleNode, scoreMap) {
        if (!ruleNode || typeof ruleNode !== 'object') return '';
        if (Object.prototype.hasOwnProperty.call(ruleNode, 'op')) {
            const op = ruleNode.op === 'or' ? ' OR ' : ' AND ';
            const items = Array.isArray(ruleNode.items) ? ruleNode.items : [];
            return items.map((item) => '(' + describeRuleNode(item, scoreMap) + ')').join(op);
        }
        const field = String(ruleNode.field || '');
        const cmp = String(ruleNode.cmp || '');
        const expected = toNumber(ruleNode.value);
        const actual = toNumber(scoreMap && scoreMap[field]);
        const symbol = CMP_SYMBOL[cmp] || cmp;
        return field + ' ' + symbol + ' ' + expected + '（当前 ' + round1(actual || 0) + '）';
    }

    function scoreSingleQuestion(question, answer, rawScores) {
        const optionId = String(answer || '');
        assert(optionId, 'single 题未作答');
        const option = (question.options || []).find((item) => item.id === optionId);
        assert(option, `single 题答案非法: ${question.id}`);
        applyScoreMap(rawScores, option.scores);
    }

    function scoreMultiQuestion(question, answer, rawScores) {
        assert(Array.isArray(answer) && answer.length > 0, 'multi 题至少选择 1 项');
        const selected = Array.from(new Set(answer.map((item) => String(item))));
        const optionById = new Map((question.options || []).map((item) => [String(item.id), item]));
        const localScores = {};

        selected.forEach((optionId) => {
            const option = optionById.get(optionId);
            assert(option, `multi 题答案非法: ${question.id}`);
            Object.keys(option.scores || {}).forEach((dimensionKey) => {
                const current = toNumber(localScores[dimensionKey]) || 0;
                const delta = toNumber(option.scores[dimensionKey]) || 0;
                localScores[dimensionKey] = current + delta;
            });
        });

        Object.keys(localScores).forEach((dimensionKey) => {
            const cap = toNumber(question.cap && question.cap[dimensionKey]);
            if (Number.isFinite(cap)) {
                localScores[dimensionKey] = Math.min(localScores[dimensionKey], cap);
            }
        });

        applyScoreMap(rawScores, localScores);
    }

    function scoreScaleQuestion(question, answer, rawScores) {
        const level = String(answer);
        assert(level === '1' || level === '2' || level === '3' || level === '4' || level === '5', 'scale 题答案必须是 1-5');
        const scoreMap = question.levelScores ? question.levelScores[level] : null;
        assert(scoreMap && typeof scoreMap === 'object', `scale 题缺失 levelScores: ${question.id}`);
        applyScoreMap(rawScores, scoreMap);
    }

    function calculateRawScores(quizData, answers) {
        const rawScores = createScoreMap(quizData.dimensions || []);
        (quizData.questions || []).forEach((question) => {
            const answer = answers ? answers[question.id] : undefined;
            if (question.type === 'single') {
                scoreSingleQuestion(question, answer, rawScores);
                return;
            }
            if (question.type === 'multi') {
                scoreMultiQuestion(question, answer, rawScores);
                return;
            }
            if (question.type === 'scale') {
                scoreScaleQuestion(question, answer, rawScores);
                return;
            }
            throw new Error('不支持的题型: ' + question.type);
        });
        return rawScores;
    }

    function calculateNormalizedScores(rawScores, theoreticalMax) {
        const out = {};
        Object.keys(rawScores || {}).forEach((dimensionKey) => {
            const raw = toNumber(rawScores[dimensionKey]) || 0;
            const max = toNumber(theoreticalMax && theoreticalMax[dimensionKey]) || 0;
            if (max <= 0) {
                out[dimensionKey] = 0;
                return;
            }
            const ratio = clamp((raw / max) * 100, 0, 100);
            out[dimensionKey] = round1(ratio);
        });
        return out;
    }

    function matchTitles(quizData, normalizedScores) {
        const titles = [];
        const titleRules = Array.isArray(quizData.titleRules) ? quizData.titleRules : [];
        const fallbackId = String(quizData.fallbackTitleId || '');
        titleRules.forEach((titleRule) => {
            if (titleRule.id === fallbackId) return;
            if (!evaluateRuleNode(titleRule.rule, normalizedScores)) return;
            titles.push({
                id: titleRule.id,
                title: titleRule.title,
                description: titleRule.description || '',
                reason: describeRuleNode(titleRule.rule, normalizedScores)
            });
        });

        if (titles.length > 0) return titles;

        const fallback = titleRules.find((titleRule) => titleRule.id === fallbackId);
        if (!fallback) return titles;
        return [{
            id: fallback.id,
            title: fallback.title,
            description: fallback.description || '',
            reason: describeRuleNode(fallback.rule, normalizedScores)
        }];
    }

    function calculateQuizResult(quizData, answers) {
        assert(quizData && typeof quizData === 'object', 'quizData 非法');
        const rawScores = calculateRawScores(quizData, answers || {});
        const normalizedScores = calculateNormalizedScores(rawScores, quizData.theoreticalMax || {});
        const titles = matchTitles(quizData, normalizedScores);
        return {
            rawScores,
            normalizedScores,
            titles
        };
    }

    function pushResultHistory(history, entry, maxLength = 5) {
        const list = Array.isArray(history) ? history.slice() : [];
        list.unshift(entry);
        return list.slice(0, Math.max(1, maxLength));
    }

    return {
        evaluateRuleNode,
        calculateQuizResult,
        pushResultHistory
    };
}));
