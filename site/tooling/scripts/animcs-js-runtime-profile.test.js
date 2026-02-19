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

test('createPlayer exposes Vec3 and Mat4 runtime APIs', () => {
    const seen = {};
    const mod = {
        create(runtimeApi) {
            seen.runtimeApi = runtimeApi;
            return {
                OnInit(ctx) {
                    seen.ctx = ctx;
                },
                OnUpdate() {},
                OnRender() {},
                OnDispose() {}
            };
        }
    };

    const player = runtime.createPlayer(mod, { width: 120, height: 80 });
    player.start();
    player.stop();

    assert.equal(typeof seen.runtimeApi.Vec3, 'function');
    assert.equal(typeof seen.runtimeApi.Mat4, 'function');
    assert.equal(typeof seen.ctx.Input.WheelDelta, 'number');

    const Vec3Ctor = seen.runtimeApi.Vec3;
    const Mat4Ctor = seen.runtimeApi.Mat4;
    const moved = Mat4Ctor.MulVec3(Mat4Ctor.Translation(1, 2, 3), new Vec3Ctor(4, 5, 6));
    assert.deepEqual({ x: moved.X, y: moved.Y, z: moved.Z }, { x: 5, y: 7, z: 9 });
});

test('canvas api supports Text drawing', () => {
    const calls = [];
    const fakeCtx = {
        save() { calls.push('save'); },
        restore() { calls.push('restore'); },
        fillText(text, x, y) { calls.push(['fillText', text, x, y]); },
        set fillStyle(value) { calls.push(['fillStyle', value]); },
        set font(value) { calls.push(['font', value]); },
        set textBaseline(value) { calls.push(['textBaseline', value]); }
    };
    const fakeCanvas = {
        width: 100,
        height: 60,
        addEventListener() {},
        removeEventListener() {}
    };

    const mod = {
        create(runtimeApi) {
            return {
                OnInit() {},
                OnUpdate() {},
                OnRender(g) {
                    g.Text('M', new runtimeApi.Vec2(10, 20), new runtimeApi.Color(255, 255, 255, 255), 14);
                },
                OnDispose() {}
            };
        }
    };

    const player = runtime.createPlayer(mod, { canvas: fakeCanvas, ctx: fakeCtx, width: 100, height: 60 });
    player.start();
    player.stop();

    assert.ok(calls.some((entry) => Array.isArray(entry) && entry[0] === 'fillText' && entry[1] === 'M'));
});
