const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const compiler = require(path.resolve('site/tooling/scripts/animcs-compiler.js'));
const astIntegrationEnabled = process.env.ANIMCS_AST_INTEGRATION === '1';
const maybeTest = astIntegrationEnabled ? test : test.skip;

const batchInputs = [
    {
        sourcePath: 'anims/ops.cs',
        sourceText: `
using AnimRuntime;
using AnimRuntime.Math;

[AnimEntry("vec3-mat4-ops")]
public sealed class Vec3Mat4Ops : IAnimScript
{
    public void OnInit(AnimContext ctx) {}
    public void OnUpdate(float dt) {}

    public void OnRender(ICanvas2D g)
    {
        var a = new Vec3(1f, 2f, 3f);
        var b = new Vec3(4f, 5f, 6f);
        var m = Mat4.Identity();
        var sum = a + b;
        var scaled = 2f * a;
        var transformed = m * sum;
        g.Clear(new Color(0, 0, 0));
    }

    public void OnDispose() {}
}
`
    },
    {
        sourcePath: 'anims/one.cs',
        sourceText: `
using AnimRuntime;
using AnimRuntime.Math;
public sealed class One : IAnimScript
{
    public void OnInit(AnimContext ctx) {}
    public void OnUpdate(float dt) {}
    public void OnRender(ICanvas2D g) { g.Clear(new Color(0, 0, 0)); }
    public void OnDispose() {}
}
`
    },
    {
        sourcePath: 'anims/two.cs',
        sourceText: `
using AnimRuntime;
using AnimRuntime.Math;
public sealed class Two : IAnimScript
{
    public void OnInit(AnimContext ctx) {}
    public void OnUpdate(float dt) {}
    public void OnRender(ICanvas2D g) { g.Clear(new Color(0, 0, 0)); }
    public void OnDispose() {}
}
`
    }
];

let cachedOutputs = null;
const retryableErrorPattern = /\b(EAGAIN|EMFILE|ENFILE|ETXTBSY)\b/i;

function sleep(ms) {
    const array = new Int32Array(new SharedArrayBuffer(4));
    Atomics.wait(array, 0, 0, ms);
}

function compileWithRetry() {
    let lastError = null;

    for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
            return compiler.compileAnimBatch(batchInputs);
        } catch (error) {
            lastError = error;
            const message = String(error && error.message ? error.message : error);
            const canRetry = retryableErrorPattern.test(message);
            if (!canRetry || attempt === 3) {
                throw error;
            }
            sleep(150 * attempt);
        }
    }

    throw lastError;
}

function compileOnce() {
    if (!cachedOutputs) {
        cachedOutputs = compileWithRetry();
    }
    return cachedOutputs;
}

maybeTest('compileAnimToJs lowers Vec3/Mat4 operators to runtime helpers', { timeout: 30_000 }, () => {
    const outputs = compileOnce();
    const ops = outputs.find((entry) => entry.sourcePath === 'anims/ops.cs');
    assert.ok(ops, 'missing compiled output for anims/ops.cs');

    const js = ops.js;
    assert.match(js, /Vec3\.Add\(/);
    assert.match(js, /Vec3\.MulScalar\(/);
    assert.match(js, /Mat4\.MulVec3\(/);
});

maybeTest('compileAnimBatch compiles all entries in one pass', { timeout: 30_000 }, () => {
    assert.equal(typeof compiler.compileAnimBatch, 'function');
    const outputs = compileOnce();
    assert.equal(outputs.length, 3);

    const one = outputs.find((entry) => entry.sourcePath === 'anims/one.cs');
    const two = outputs.find((entry) => entry.sourcePath === 'anims/two.cs');
    assert.ok(one, 'missing compiled output for anims/one.cs');
    assert.ok(two, 'missing compiled output for anims/two.cs');
    assert.match(one.js, /export function create\(runtime\)/);
    assert.match(two.js, /export function create\(runtime\)/);
});
