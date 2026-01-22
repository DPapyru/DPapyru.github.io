const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

function read(path) {
    return fs.readFileSync(path, 'utf8');
}

test('viewer and renderer include AnimTS importmap entries', () => {
    const viewer = read('docs/viewer.html');
    const renderer = read('docs/anim-renderer.html');

    assert.match(viewer, /type="importmap"/);
    assert.match(renderer, /type="importmap"/);

    assert.match(viewer, /@animts\/math2d/);
    assert.match(renderer, /@animts\/math2d/);
});

test('tsconfig.anims.json defines @animts/* paths', () => {
    const raw = read('tsconfig.anims.json');
    const config = JSON.parse(raw);
    const opts = config && config.compilerOptions ? config.compilerOptions : {};
    assert.ok(opts.baseUrl, 'compilerOptions.baseUrl should exist');
    assert.ok(opts.paths, 'compilerOptions.paths should exist');
    assert.ok(opts.paths['@animts/*'], 'compilerOptions.paths["@animts/*"] should exist');
});

test('AnimTS shared lib sources exist', () => {
    const expected = [
        'docs/anims/_lib/math2d.ts',
        'docs/anims/_lib/math3d.ts',
        'docs/anims/_lib/calc.ts',
        'docs/anims/_lib/types.ts',
        'docs/anims/_lib/ui.ts'
    ];
    expected.forEach((p) => {
        assert.ok(fs.existsSync(p), `missing: ${p}`);
    });
});

test('Math demos exist', () => {
    const expected = [
        'docs/anims/demo-math-calculus.ts',
        'docs/anims/demo-math-axes-3d.ts',
        'docs/anims/demo-math-vectors.ts',
        'docs/anims/demo-math-matrix.ts'
    ];
    expected.forEach((p) => {
        assert.ok(fs.existsSync(p), `missing: ${p}`);
    });
});

test('math2d exports drawArrow2D helper (for vector/matrix demos)', () => {
    const src = read('docs/anims/_lib/math2d.ts');
    assert.match(src, /export function drawArrow2D\s*\(/);
});

test('AnimTS runtime CSS includes UI panel styles', () => {
    const css = read('assets/css/animts-runtime.css');
    assert.match(css, /\.animts-ui-panel\b/);
    assert.match(css, /\.animts-ui-panel--top-right\b/);
    assert.match(css, /\.animts-ui-panel--free\b/);
});

test('ui.createPanel supports toggling pinned/free (draggable) mode', () => {
    const src = read('docs/anims/_lib/ui.ts');
    assert.match(src, /animts-ui-panel--free/);
    assert.match(src, /pointerdown/);
});

test('ui.createPanel does not snap position when toggling pinned', () => {
    const src = read('docs/anims/_lib/ui.ts');
    assert.doesNotMatch(src, /toggle\\(dockClass,\\s*pinned\\)/);
    assert.doesNotMatch(src, /applyDocking/);
});

test('runtime exposes AbortSignal on stage for portal UI cleanup', () => {
    const js = read('assets/js/animts-runtime.js');
    assert.match(js, /__ANIMTS_SIGNAL/);
});

test('AI analysis scene panel supports dragging', () => {
    const js = read('assets/js/animts-runtime.js');
    assert.match(js, /panelHeader/);
    assert.match(js, /panelTitle\.addEventListener\('pointerdown'/);
});

test('portal panels are positioned in page coordinates (absolute) not viewport-fixed', () => {
    const css = read('assets/css/animts-runtime.css');
    assert.match(css, /\.animts-ui-panel--portal\s*\{/);
    assert.match(css, /position:\s*absolute/);
    assert.doesNotMatch(css, /position:\s*fixed/);

    const ui = read('docs/anims/_lib/ui.ts');
    assert.doesNotMatch(ui, /panel\.style\.position\s*=\s*'fixed'/);

    const runtime = read('assets/js/animts-runtime.js');
    assert.doesNotMatch(runtime, /panel\.style\.position\s*=\s*'fixed'/);
});

test('AI analysis scene exposes root element for custom UI', () => {
    const js = read('assets/js/animts-runtime.js');
    assert.match(js, /root:\s*stage/);
});

test('VSCode tsserver picks up @animts paths via docs/anims/tsconfig.json', () => {
    assert.ok(fs.existsSync('docs/anims/tsconfig.json'), 'missing: docs/anims/tsconfig.json');
    const config = JSON.parse(read('docs/anims/tsconfig.json'));
    const opts = config && config.compilerOptions ? config.compilerOptions : {};
    assert.ok(opts.baseUrl, 'docs/anims/tsconfig.json should define compilerOptions.baseUrl');
    assert.ok(opts.paths && opts.paths['@animts/*'], 'docs/anims/tsconfig.json should map @animts/*');
});
