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

test('buildManifest keeps legacy profile metadata when animts source has no exported profile', () => {
    const manifest = buildAnimTs.buildManifest([
        {
            source: 'anims/demo-mode-state.anim.ts',
            entry: 'anims/demo-mode-state',
            profile: null
        }
    ]);

    assert.deepEqual(manifest.entries['anims/demo-mode-state.anim.ts'], {
        js: 'anims/demo-mode-state.js',
        entry: 'anims/demo-mode-state',
        profile: {
            controls: 'mode-select',
            heightScale: 1.25,
            modeOptions: [
                { value: 0, text: '自动' },
                { value: 1, text: '静止' },
                { value: 2, text: '顺时针' },
                { value: 3, text: '逆时针' }
            ]
        }
    });
});

test('buildManifest prefers explicit source profile over legacy fallback profile', () => {
    const manifest = buildAnimTs.buildManifest([
        {
            source: 'anims/demo-mode-state.anim.ts',
            entry: 'anims/demo-mode-state',
            profile: {
                controls: 'mode-select',
                heightScale: 9
            }
        }
    ]);

    assert.deepEqual(manifest.entries['anims/demo-mode-state.anim.ts'], {
        js: 'anims/demo-mode-state.js',
        entry: 'anims/demo-mode-state',
        profile: {
            controls: 'mode-select',
            heightScale: 9
        }
    });
});
