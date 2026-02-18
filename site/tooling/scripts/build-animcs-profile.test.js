const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const buildAnim = require(path.resolve('site/tooling/scripts/build-animcs.js'));

test('parseAnimProfile parses controls, heightScale and mode options', () => {
    const source = `
using AnimRuntime;

[AnimEntry("demo-mode")]
[AnimProfile(Controls = "mode-select", HeightScale = 2.3f, ModeOptions = "0:自动|1:一阶-徘徊|2:一阶-冲刺")]
public sealed class DemoMode : IAnimScript
{
    public void OnInit(AnimContext ctx) {}
    public void OnUpdate(float dt) {}
    public void OnRender(ICanvas2D g) {}
    public void OnDispose() {}
}
`;

    const profile = buildAnim.parseAnimProfile(source);
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

test('parseAnimProfile returns null when AnimProfile is absent', () => {
    const source = `
using AnimRuntime;

[AnimEntry("demo-basic")]
public sealed class DemoBasic : IAnimScript
{
    public void OnInit(AnimContext ctx) {}
    public void OnUpdate(float dt) {}
    public void OnRender(ICanvas2D g) {}
    public void OnDispose() {}
}
`;

    assert.equal(buildAnim.parseAnimProfile(source), null);
});

test('buildManifest includes profile data in entries', () => {
    const manifest = buildAnim.buildManifest([
        {
            source: 'anims/demo-mode.cs',
            entry: 'demo-mode',
            profile: {
                controls: 'mode-select',
                heightScale: 2.3,
                modeOptions: [
                    { value: 0, text: '自动' }
                ]
            }
        }
    ]);

    assert.deepEqual(manifest.entries['anims/demo-mode.cs'], {
        js: 'demo-mode.js',
        entry: 'demo-mode',
        profile: {
            controls: 'mode-select',
            heightScale: 2.3,
            modeOptions: [
                { value: 0, text: '自动' }
            ]
        }
    });
});
