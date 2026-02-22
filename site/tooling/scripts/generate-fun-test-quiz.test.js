const test = require('node:test');
const assert = require('node:assert/strict');

const {
    compileQuizSource
} = require('./generate-fun-test-quiz');

function createValidSource() {
    return {
        meta: {
            id: 'star-shatter-role',
            title: '猜猜你是《星辰击碎者》什么类型的角色',
            description: '测试题库'
        },
        dimensions: [
            { key: 'logic', label: '理性' },
            { key: 'action', label: '行动力' },
            { key: 'social', label: '社交' }
        ],
        questions: [
            {
                id: 'q1',
                type: 'single',
                prompt: '你更常怎么解题？',
                options: [
                    { id: 'a', text: '先分析', scores: { logic: 10, action: 2 } },
                    { id: 'b', text: '先尝试', scores: { logic: 2, action: 10 } }
                ]
            },
            {
                id: 'q2',
                type: 'multi',
                prompt: '你看重哪些特质？',
                options: [
                    { id: 'a', text: '沉着', scores: { logic: 6 } },
                    { id: 'b', text: '果断', scores: { action: 8 } },
                    { id: 'c', text: '共情', scores: { social: 9 } }
                ],
                cap: {
                    logic: 8,
                    action: 9,
                    social: 10
                }
            },
            {
                id: 'q3',
                type: 'scale',
                prompt: '我喜欢在团队中主动协调。',
                scale: [1, 2, 3, 4, 5],
                levelScores: {
                    '1': { social: 0 },
                    '2': { social: 3 },
                    '3': { social: 6 },
                    '4': { social: 9 },
                    '5': { social: 12 }
                }
            }
        ],
        titleRules: [
            {
                id: 'title-strategist',
                title: '冷静谋士',
                description: '理性先行',
                rule: {
                    op: 'and',
                    items: [
                        { field: 'logic', cmp: 'gte', value: 60 },
                        {
                            op: 'or',
                            items: [
                                { field: 'action', cmp: 'gte', value: 40 },
                                { field: 'social', cmp: 'gte', value: 40 }
                            ]
                        }
                    ]
                }
            },
            {
                id: 'fallback',
                title: '初星旅者',
                description: '从这里启程',
                rule: {
                    op: 'and',
                    items: [
                        { field: 'logic', cmp: 'gte', value: 0 }
                    ]
                }
            }
        ],
        fallbackTitleId: 'fallback'
    };
}

test('compileQuizSource compiles valid quiz and computes theoretical max', () => {
    const compiled = compileQuizSource(createValidSource());

    assert.equal(compiled.meta.id, 'star-shatter-role');
    assert.deepEqual(compiled.theoreticalMax, {
        logic: 18,
        action: 19,
        social: 22
    });
});

test('compileQuizSource rejects missing required fields', () => {
    const invalid = createValidSource();
    delete invalid.meta.title;

    assert.throws(() => compileQuizSource(invalid), /meta\.title/);
});

test('compileQuizSource rejects duplicate question id', () => {
    const invalid = createValidSource();
    invalid.questions.push({
        id: 'q1',
        type: 'single',
        prompt: '重复题目',
        options: [{ id: 'x', text: 'x', scores: { logic: 1 } }]
    });

    assert.throws(() => compileQuizSource(invalid), /重复.*question id/);
});

test('compileQuizSource rejects unknown dimension key in scores', () => {
    const invalid = createValidSource();
    invalid.questions[0].options[0].scores.unknown = 3;

    assert.throws(() => compileQuizSource(invalid), /未知维度/);
});

test('compileQuizSource rejects invalid comparator in title rule', () => {
    const invalid = createValidSource();
    invalid.titleRules[0].rule.items[0].cmp = 'bad-cmp';

    assert.throws(() => compileQuizSource(invalid), /cmp/);
});

test('compileQuizSource rejects invalid rule tree', () => {
    const invalid = createValidSource();
    invalid.titleRules[0].rule = { op: 'and' };

    assert.throws(() => compileQuizSource(invalid), /rule/);
});

test('compileQuizSource rejects missing fallbackTitleId mapping', () => {
    const invalid = createValidSource();
    invalid.fallbackTitleId = 'missing-id';

    assert.throws(() => compileQuizSource(invalid), /fallbackTitleId/);
});

test('compileQuizSource rejects scale that is not 1..5', () => {
    const invalid = createValidSource();
    invalid.questions[2].scale = [1, 2, 3, 4];

    assert.throws(() => compileQuizSource(invalid), /scale/);
});

test('compileQuizSource rejects negative score', () => {
    const invalid = createValidSource();
    invalid.questions[0].options[0].scores.logic = -1;

    assert.throws(() => compileQuizSource(invalid), /非负/);
});

