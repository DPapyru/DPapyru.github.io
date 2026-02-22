const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ROOT_DIR = path.resolve(__dirname, '../../..');
const DEFAULT_INPUT_PATH = path.join(ROOT_DIR, 'fun-test', 'quiz.source.yaml');
const DEFAULT_OUTPUT_PATH = path.join(ROOT_DIR, 'fun-test', 'quiz-data.v1.json');
const SUPPORTED_TYPES = new Set(['single', 'multi', 'scale']);
const SUPPORTED_RULE_OPS = new Set(['and', 'or']);
const SUPPORTED_COMPARATORS = new Set(['gte', 'gt', 'lte', 'lt', 'eq', 'neq']);

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function isPlainObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}

function ensureString(value, label) {
    assert(typeof value === 'string' && value.trim().length > 0, `${label} 必须是非空字符串`);
}

function ensureNumber(value, label, options = {}) {
    const allowZero = options.allowZero !== false;
    assert(typeof value === 'number' && Number.isFinite(value), `${label} 必须是有效数字`);
    if (allowZero) {
        assert(value >= 0, `${label} 必须是非负数`);
    } else {
        assert(value > 0, `${label} 必须大于 0`);
    }
}

function ensureScoreMap(scoreMap, label, dimensionSet) {
    assert(isPlainObject(scoreMap), `${label} 必须是对象`);
    Object.keys(scoreMap).forEach((dimensionKey) => {
        assert(dimensionSet.has(dimensionKey), `${label} 包含未知维度 "${dimensionKey}"`);
        ensureNumber(scoreMap[dimensionKey], `${label}.${dimensionKey}`, { allowZero: true });
    });
}

function cloneJson(value) {
    return JSON.parse(JSON.stringify(value));
}

function validateRuleNode(node, dimensionSet, label) {
    assert(isPlainObject(node), `${label} 必须是对象`);

    if (Object.prototype.hasOwnProperty.call(node, 'op')) {
        assert(
            SUPPORTED_RULE_OPS.has(node.op),
            `${label}.op 仅支持 and/or`
        );
        assert(Array.isArray(node.items) && node.items.length > 0, `${label}.items 不能为空`);
        node.items.forEach((child, index) => {
            validateRuleNode(child, dimensionSet, `${label}.items[${index}]`);
        });
        return;
    }

    ensureString(node.field, `${label}.field`);
    assert(dimensionSet.has(node.field), `${label}.field 使用了未知维度 "${node.field}"`);
    assert(SUPPORTED_COMPARATORS.has(node.cmp), `${label}.cmp 非法`);
    ensureNumber(node.value, `${label}.value`, { allowZero: true });
}

function buildEmptyDimensionMap(dimensions) {
    const map = {};
    dimensions.forEach((dimension) => {
        map[dimension.key] = 0;
    });
    return map;
}

function computeQuestionTheoreticalContribution(question, dimensions) {
    const byDimension = buildEmptyDimensionMap(dimensions);
    const keySet = new Set(dimensions.map((d) => d.key));

    if (question.type === 'single') {
        question.options.forEach((option) => {
            keySet.forEach((key) => {
                const score = option.scores[key] || 0;
                if (score > byDimension[key]) byDimension[key] = score;
            });
        });
        return byDimension;
    }

    if (question.type === 'multi') {
        keySet.forEach((key) => {
            byDimension[key] = question.cap[key] || 0;
        });
        return byDimension;
    }

    if (question.type === 'scale') {
        ['1', '2', '3', '4', '5'].forEach((level) => {
            const scoreMap = question.levelScores[level] || {};
            keySet.forEach((key) => {
                const score = scoreMap[key] || 0;
                if (score > byDimension[key]) byDimension[key] = score;
            });
        });
        return byDimension;
    }

    throw new Error(`未知题型: ${question.type}`);
}

function validateAndNormalizeQuestion(question, index, dimensionSet, dimensions) {
    const label = `questions[${index}]`;
    assert(isPlainObject(question), `${label} 必须是对象`);
    ensureString(question.id, `${label}.id`);
    assert(SUPPORTED_TYPES.has(question.type), `${label}.type 仅支持 single/multi/scale`);
    ensureString(question.prompt, `${label}.prompt`);

    if (question.type === 'single' || question.type === 'multi') {
        assert(Array.isArray(question.options) && question.options.length > 0, `${label}.options 不能为空`);
        const optionIds = new Set();
        question.options.forEach((option, optionIndex) => {
            const optionLabel = `${label}.options[${optionIndex}]`;
            assert(isPlainObject(option), `${optionLabel} 必须是对象`);
            ensureString(option.id, `${optionLabel}.id`);
            ensureString(option.text, `${optionLabel}.text`);
            assert(!optionIds.has(option.id), `${label} 包含重复 option id "${option.id}"`);
            optionIds.add(option.id);
            ensureScoreMap(option.scores, `${optionLabel}.scores`, dimensionSet);
        });
    }

    if (question.type === 'multi') {
        assert(isPlainObject(question.cap), `${label}.cap 必须是对象`);
        Object.keys(question.cap).forEach((dimensionKey) => {
            assert(dimensionSet.has(dimensionKey), `${label}.cap 包含未知维度 "${dimensionKey}"`);
            ensureNumber(question.cap[dimensionKey], `${label}.cap.${dimensionKey}`, { allowZero: true });
        });
    }

    if (question.type === 'scale') {
        assert(Array.isArray(question.scale), `${label}.scale 必须是数组`);
        const expectedScale = [1, 2, 3, 4, 5];
        assert(
            question.scale.length === expectedScale.length && question.scale.every((value, i) => value === expectedScale[i]),
            `${label}.scale 必须严格等于 [1,2,3,4,5]`
        );
        assert(isPlainObject(question.levelScores), `${label}.levelScores 必须是对象`);
        expectedScale.forEach((level) => {
            const levelKey = String(level);
            assert(isPlainObject(question.levelScores[levelKey]), `${label}.levelScores.${levelKey} 缺失`);
            ensureScoreMap(question.levelScores[levelKey], `${label}.levelScores.${levelKey}`, dimensionSet);
        });
    }

    return {
        id: question.id,
        type: question.type,
        prompt: question.prompt,
        options: question.options ? cloneJson(question.options) : undefined,
        cap: question.cap ? cloneJson(question.cap) : undefined,
        scale: question.scale ? cloneJson(question.scale) : undefined,
        levelScores: question.levelScores ? cloneJson(question.levelScores) : undefined,
        theoreticalContribution: computeQuestionTheoreticalContribution(question, dimensions)
    };
}

function compileQuizSource(source) {
    assert(isPlainObject(source), '题库根节点必须是对象');

    assert(isPlainObject(source.meta), 'meta 必须是对象');
    ensureString(source.meta.id, 'meta.id');
    ensureString(source.meta.title, 'meta.title');
    if (Object.prototype.hasOwnProperty.call(source.meta, 'description')) {
        ensureString(source.meta.description, 'meta.description');
    }

    assert(Array.isArray(source.dimensions) && source.dimensions.length > 0, 'dimensions 不能为空');
    const dimensionSet = new Set();
    const dimensions = source.dimensions.map((dimension, index) => {
        const label = `dimensions[${index}]`;
        assert(isPlainObject(dimension), `${label} 必须是对象`);
        ensureString(dimension.key, `${label}.key`);
        ensureString(dimension.label, `${label}.label`);
        assert(!dimensionSet.has(dimension.key), `${label}.key 重复: ${dimension.key}`);
        dimensionSet.add(dimension.key);
        return { key: dimension.key, label: dimension.label };
    });

    assert(Array.isArray(source.questions) && source.questions.length > 0, 'questions 不能为空');
    const questionIds = new Set();
    const questions = source.questions.map((question, index) => {
        const normalizedQuestion = validateAndNormalizeQuestion(question, index, dimensionSet, dimensions);
        assert(!questionIds.has(normalizedQuestion.id), `重复 question id: ${normalizedQuestion.id}`);
        questionIds.add(normalizedQuestion.id);
        return normalizedQuestion;
    });

    assert(Array.isArray(source.titleRules) && source.titleRules.length > 0, 'titleRules 不能为空');
    const titleRuleIds = new Set();
    const titleRules = source.titleRules.map((rule, index) => {
        const label = `titleRules[${index}]`;
        assert(isPlainObject(rule), `${label} 必须是对象`);
        ensureString(rule.id, `${label}.id`);
        ensureString(rule.title, `${label}.title`);
        if (Object.prototype.hasOwnProperty.call(rule, 'description')) {
            ensureString(rule.description, `${label}.description`);
        }
        assert(!titleRuleIds.has(rule.id), `${label}.id 重复: ${rule.id}`);
        titleRuleIds.add(rule.id);
        validateRuleNode(rule.rule, dimensionSet, `${label}.rule`);
        return {
            id: rule.id,
            title: rule.title,
            description: rule.description || '',
            rule: cloneJson(rule.rule)
        };
    });

    ensureString(source.fallbackTitleId, 'fallbackTitleId');
    assert(titleRuleIds.has(source.fallbackTitleId), 'fallbackTitleId 未在 titleRules 中定义');

    const theoreticalMax = buildEmptyDimensionMap(dimensions);
    questions.forEach((question) => {
        Object.keys(question.theoreticalContribution).forEach((dimensionKey) => {
            theoreticalMax[dimensionKey] += question.theoreticalContribution[dimensionKey];
        });
    });

    const normalizedQuestions = questions.map((question) => {
        const output = {
            id: question.id,
            type: question.type,
            prompt: question.prompt
        };
        if (question.options) output.options = question.options;
        if (question.cap) output.cap = question.cap;
        if (question.scale) output.scale = question.scale;
        if (question.levelScores) output.levelScores = question.levelScores;
        return output;
    });

    return {
        schemaVersion: 1,
        meta: {
            id: source.meta.id,
            title: source.meta.title,
            description: source.meta.description || ''
        },
        dimensions,
        theoreticalMax,
        questions: normalizedQuestions,
        titleRules,
        fallbackTitleId: source.fallbackTitleId
    };
}

function parseQuizYaml(yamlText) {
    const source = yaml.load(String(yamlText || ''), { schema: yaml.JSON_SCHEMA });
    return source;
}

function generateFunTestQuiz(options = {}) {
    const inputPath = options.inputPath || DEFAULT_INPUT_PATH;
    const outputPath = options.outputPath || DEFAULT_OUTPUT_PATH;
    const yamlText = options.yamlText || fs.readFileSync(inputPath, 'utf8');
    const parsed = parseQuizYaml(yamlText);
    const compiled = compileQuizSource(parsed);
    const outputPayload = {
        ...compiled,
        generatedAt: new Date().toISOString()
    };

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(outputPayload, null, 4) + '\n', 'utf8');
    return outputPayload;
}

function runCli() {
    try {
        const result = generateFunTestQuiz();
        console.log(`[fun-test] 题库生成完成: ${result.meta.id} -> ${DEFAULT_OUTPUT_PATH}`);
    } catch (error) {
        console.error('[fun-test] 题库生成失败:', error.message);
        process.exitCode = 1;
    }
}

module.exports = {
    DEFAULT_INPUT_PATH,
    DEFAULT_OUTPUT_PATH,
    parseQuizYaml,
    compileQuizSource,
    generateFunTestQuiz
};

if (require.main === module) {
    runCli();
}

