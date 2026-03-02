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

test('createPlayer exposes Vector2/Vector3 and Matrix runtime APIs', () => {
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

    assert.equal(typeof seen.runtimeApi.Vector2, 'function');
    assert.equal(typeof seen.runtimeApi.Vector3, 'function');
    assert.equal(typeof seen.runtimeApi.Matrix, 'function');
    assert.equal(typeof seen.ctx.Input.WheelDelta, 'number');

    const Vector2Ctor = seen.runtimeApi.Vector2;
    const Vector3Ctor = seen.runtimeApi.Vector3;
    const MatrixCtor = seen.runtimeApi.Matrix;
    const moved2 = MatrixCtor.TransformVector2(MatrixCtor.CreateTranslation(1, 2, 0), new Vector2Ctor(4, 5));
    const moved = MatrixCtor.TransformVector3(MatrixCtor.CreateTranslation(1, 2, 3), new Vector3Ctor(4, 5, 6));
    assert.deepEqual({ x: moved2.X, y: moved2.Y }, { x: 5, y: 7 });
    assert.deepEqual({ x: moved.X, y: moved.Y, z: moved.Z }, { x: 5, y: 7, z: 9 });
});

test('createPlayer exposes legacy runtime aliases for prebuilt anim modules', () => {
    const seen = {};
    const mod = {
        create(runtimeApi) {
            seen.runtimeApi = runtimeApi;
            return {
                OnInit() {},
                OnUpdate() {},
                OnRender() {},
                OnDispose() {}
            };
        }
    };

    const player = runtime.createPlayer(mod, { width: 120, height: 80 });
    player.start();
    player.stop();

    assert.equal(seen.runtimeApi.Vec2, seen.runtimeApi.Vector2);
    assert.equal(seen.runtimeApi.Vec3, seen.runtimeApi.Vector3);
    assert.equal(seen.runtimeApi.BlendMode, seen.runtimeApi.BlendState);

    assert.equal(typeof seen.runtimeApi.Mat4, 'function');
    assert.equal(seen.runtimeApi.Mat4, seen.runtimeApi.Matrix);
    assert.equal(seen.runtimeApi.Mat4.Translation, seen.runtimeApi.Matrix.CreateTranslation);
    assert.equal(seen.runtimeApi.Mat4.Scale, seen.runtimeApi.Matrix.CreateScale);
    assert.equal(seen.runtimeApi.Mat4.RotationX, seen.runtimeApi.Matrix.CreateRotationX);
    assert.equal(seen.runtimeApi.Mat4.RotationY, seen.runtimeApi.Matrix.CreateRotationY);
    assert.equal(seen.runtimeApi.Mat4.RotationZ, seen.runtimeApi.Matrix.CreateRotationZ);
    assert.equal(seen.runtimeApi.Mat4.PerspectiveFovRh, seen.runtimeApi.Matrix.CreatePerspectiveFieldOfView);
    assert.equal(seen.runtimeApi.Mat4.Mul, seen.runtimeApi.Matrix.Multiply);
    assert.equal(seen.runtimeApi.Mat4.MulVec2, seen.runtimeApi.Matrix.TransformVector2);
    assert.equal(seen.runtimeApi.Mat4.MulVec3, seen.runtimeApi.Matrix.TransformVector3);

    const translated = seen.runtimeApi.Mat4.MulVec3(
        seen.runtimeApi.Mat4.Translation(1, 2, 3),
        new seen.runtimeApi.Vec3(4, 5, 6)
    );
    assert.deepEqual({ x: translated.X, y: translated.Y, z: translated.Z }, { x: 5, y: 7, z: 9 });
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
                    g.Text('M', new runtimeApi.Vector2(10, 20), new runtimeApi.Color(255, 255, 255, 255), 14);
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

test('createPlayer exposes mesh shader draw APIs on canvas runtime', () => {
    const seen = {};
    const fakeCanvas = {
        width: 160,
        height: 120,
        addEventListener() {},
        removeEventListener() {},
        getContext() { return null; }
    };
    const mod = {
        create(runtimeApi) {
            seen.runtimeApi = runtimeApi;
            return {
                OnInit() {},
                OnUpdate() {},
                OnRender(g) {
                    seen.canvasApi = g;
                },
                OnDispose() {}
            };
        }
    };
    const player = runtime.createPlayer(mod, { canvas: fakeCanvas, width: 160, height: 120 });
    player.start();
    player.stop();

    assert.equal(typeof seen.runtimeApi.PrimitiveType, 'object');
    assert.equal(typeof seen.runtimeApi.BlendState, 'object');
    assert.equal(typeof seen.runtimeApi.VertexPositionColorTexture, 'function');

    assert.equal(typeof seen.canvasApi.UseEffect, 'function');
    assert.equal(typeof seen.canvasApi.ClearEffect, 'function');
    assert.equal(typeof seen.canvasApi.SetBlendState, 'function');
    assert.equal(typeof seen.canvasApi.SetTexture, 'function');
    assert.equal(typeof seen.canvasApi.SetFloat, 'function');
    assert.equal(typeof seen.canvasApi.SetVector2, 'function');
    assert.equal(typeof seen.canvasApi.SetColor, 'function');
    assert.equal(typeof seen.canvasApi.DrawUserIndexedPrimitives, 'function');
});

test('canvas api exposes legacy method aliases for blend and vec2 uniforms', () => {
    const seen = {};
    const fakeCanvas = {
        width: 160,
        height: 120,
        addEventListener() {},
        removeEventListener() {},
        getContext() { return null; }
    };
    const mod = {
        create(runtimeApi) {
            seen.runtimeApi = runtimeApi;
            return {
                OnInit() {},
                OnUpdate() {},
                OnRender(g) {
                    seen.canvasApi = g;
                    g.SetBlendMode(runtimeApi.BlendMode.AlphaBlend);
                    g.SetVec2('uCenter', new runtimeApi.Vec2(1, 2));
                },
                OnDispose() {}
            };
        }
    };

    const player = runtime.createPlayer(mod, { canvas: fakeCanvas, width: 160, height: 120 });
    player.start();
    player.stop();

    assert.equal(typeof seen.canvasApi.SetBlendMode, 'function');
    assert.equal(typeof seen.canvasApi.SetVec2, 'function');
});
