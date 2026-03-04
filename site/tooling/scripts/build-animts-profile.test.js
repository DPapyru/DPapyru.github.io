const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const buildAnimTs = require(path.resolve('site/tooling/scripts/build-animts.js'));

test('parseAnimProfile parses nested exported profile object', () => {
    const source = `
export const profile = {
    controls: 'mode-select',
    heightScale: 2.3,
    modeOptions: [
        { value: 0, text: '自动' },
        { value: 1, text: '一阶-徘徊' },
        { value: 2, text: '一阶-冲刺' }
    ],
    extra: {
        note: 'ignored'
    }
};
`;

    const profile = buildAnimTs.parseAnimProfile(source);
    assert.deepEqual(profile, {
        controls: 'mode-select',
        heightScale: 2.3,
        modeOptions: [
            { value: 0, text: '自动' },
            { value: 1, text: '一阶-徘徊' },
            { value: 2, text: '一阶-冲刺' }
        ]
    });
});
