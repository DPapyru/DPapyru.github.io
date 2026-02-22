const test = require('node:test');
const assert = require('node:assert/strict');

const {
    calculateQuizResult,
    evaluateRuleNode,
    pushResultHistory
} = require('./quiz-engine');

function createQuizData() {
    return {
        meta: {
            id: 'star-shatter-role',
            title: '猜猜你是《星辰击碎者》什么类型的角色'
        },
        dimensions: [
            { key: 'logic', label: '理性' },
            { key: 'action', label: '行动力' },
            { key: 'social', label: '社交' }
        ],
        theoreticalMax: {
            logic: 30,
            action: 20,
            social: 20
        },
        questions: [
            {
                id: 'q1',
                type: 'single',
                options: [
                    { id: 'a', scores: { logic: 10, action: 2 } },
                    { id: 'b', scores: { logic: 2, action: 10 } }
                ]
            },
            {
                id: 'q2',
                type: 'multi',
                options: [
                    { id: 'a', scores: { logic: 9, social: 4 } },
                    { id: 'b', scores: { logic: 9, action: 8 } },
                    { id: 'c', scores: { social: 10 } }
                ],
                cap: {
                    logic: 12,
                    action: 9,
                    social: 10
                }
            },
            {
                id: 'q3',
                type: 'scale',
                levelScores: {
                    '1': { social: 0 },
                    '2': { social: 2 },
                    '3': { social: 5 },
                    '4': { social: 7 },
                    '5': { social: 10 }
                }
            }
        ],
        titleRules: [
            {
                id: 'strategist',
                title: '冷静谋士',
                description: '逻辑与行动兼顾',
                rule: {
                    op: 'and',
                    items: [
                        { field: 'logic', cmp: 'gte', value: 60 },
                        {
                            op: 'or',
                            items: [
                                { field: 'action', cmp: 'gte', value: 50 },
                                { field: 'social', cmp: 'gte', value: 50 }
                            ]
                        }
                    ]
                }
            },
            {
                id: 'social-star',
                title: '星团交响者',
                description: '社交能力出众',
                rule: {
                    op: 'and',
                    items: [
                        { field: 'social', cmp: 'gte', value: 70 }
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

test('calculateQuizResult scores single + multi(cap) + scale and normalizes to 0..100', () => {
    const quizData = createQuizData();
    const answers = {
        q1: 'a',
        q2: ['a', 'b', 'c'],
        q3: 5
    };

    const result = calculateQuizResult(quizData, answers);
    assert.deepEqual(result.rawScores, {
        logic: 22,
        action: 10,
        social: 20
    });
    assert.deepEqual(result.normalizedScores, {
        logic: 73.3,
        action: 50.0,
        social: 100.0
    });
});

test('evaluateRuleNode supports nested and/or comparison tree', () => {
    const scoreMap = { logic: 61, action: 40, social: 72 };
    const rule = {
        op: 'and',
        items: [
            { field: 'logic', cmp: 'gte', value: 60 },
            {
                op: 'or',
                items: [
                    { field: 'action', cmp: 'gte', value: 50 },
                    { field: 'social', cmp: 'gte', value: 70 }
                ]
            }
        ]
    };
    assert.equal(evaluateRuleNode(rule, scoreMap), true);
});

test('calculateQuizResult emits titles in source order and includes trigger reasons', () => {
    const quizData = createQuizData();
    const answers = {
        q1: 'a',
        q2: ['a', 'b', 'c'],
        q3: 5
    };

    const result = calculateQuizResult(quizData, answers);
    assert.deepEqual(result.titles.map((x) => x.id), ['strategist', 'social-star']);
    assert.match(result.titles[0].reason, /logic/);
});

test('calculateQuizResult applies fallback title when nothing matches', () => {
    const quizData = createQuizData();
    quizData.titleRules = quizData.titleRules.filter((x) => x.id !== 'fallback').concat([
        {
            id: 'fallback',
            title: '初星旅者',
            description: '从这里启程',
            rule: { op: 'and', items: [{ field: 'logic', cmp: 'gte', value: 0 }] }
        }
    ]);
    const answers = {
        q1: 'b',
        q2: ['b'],
        q3: 1
    };

    const result = calculateQuizResult(quizData, answers);
    assert.deepEqual(result.titles.map((x) => x.id), ['fallback']);
});

test('pushResultHistory keeps latest 5 records only', () => {
    let history = [];
    for (let i = 1; i <= 7; i += 1) {
        history = pushResultHistory(history, { id: i });
    }
    assert.equal(history.length, 5);
    assert.deepEqual(history.map((x) => x.id), [7, 6, 5, 4, 3]);
});

