const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const runtime = require(path.resolve('site/assets/js/animcs-js-runtime.js'));

test('parseModeOptionsDsl parses mode option pairs', () => {
    const options = runtime.parseModeOptionsDsl('0:自动|1:一阶-徘徊|2:一阶-冲刺');
    assert.deepEqual(options, [
        { value: 0, text: '自动' },
        { value: 1, text: '一阶-徘徊' },
        { value: 2, text: '一阶-冲刺' }
    ]);
});

test('normalizeAnimProfile normalizes profile object payload', () => {
    const profile = runtime.normalizeAnimProfile({
        controls: 'mode-select',
        heightScale: '2.3',
        modeOptions: '0:自动|1:一阶-徘徊'
    });

    assert.deepEqual(profile, {
        controls: 'mode-select',
        heightScale: 2.3,
        modeOptions: [
            { value: 0, text: '自动' },
            { value: 1, text: '一阶-徘徊' }
        ]
    });
});

test('resolveEmbedProfile gives precedence to explicit embed data', () => {
    const resolved = runtime.resolveEmbedProfile(
        {
            controls: 'mode-select',
            heightScale: 2.3,
            modeOptions: [
                { value: 0, text: '自动' },
                { value: 1, text: '一阶-徘徊' }
            ]
        },
        {
            controls: 'mode-select',
            heightScale: '1.8',
            modeOptions: '0:自动|9:手动覆盖'
        }
    );

    assert.deepEqual(resolved, {
        controls: 'mode-select',
        heightScale: 1.8,
        modeOptions: [
            { value: 0, text: '自动' },
            { value: 9, text: '手动覆盖' }
        ]
    });
});
