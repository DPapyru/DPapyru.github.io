const test = require('node:test');
const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

function runNode(args, options = {}) {
    const result = childProcess.spawnSync(process.execPath, args, {
        encoding: 'utf8',
        ...options
    });
    return {
        status: result.status,
        stdout: result.stdout || '',
        stderr: result.stderr || ''
    };
}

test('compile-routes: --help exits 0', () => {
    const script = path.resolve(__dirname, 'compile-routes.js');
    const res = runNode([script, '--help']);

    assert.equal(res.status, 0, res.stderr || res.stdout);
    assert.match(res.stdout + res.stderr, /route-manifest\.json/i);
});

test('compile-routes: rejects decision without fallback', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'routes-compile-'));
    const root = path.join(tmp, 'routes');
    const outFile = path.join(tmp, 'route-manifest.json');
    fs.mkdirSync(root, { recursive: true });

    fs.writeFileSync(path.join(root, 'demo.route.json'), JSON.stringify({
        version: 2,
        article: 'demo.md',
        entry: 'entry',
        nodes: [
            {
                id: 'entry',
                type: 'decision',
                dimension: 'C',
                map: {
                    '0': 'remedial',
                    '1': 'standard',
                    '2': 'advanced'
                }
            },
            { id: 'remedial', type: 'path', path: 'remedial' },
            { id: 'standard', type: 'path', path: 'standard' },
            { id: 'advanced', type: 'path', path: 'deep' }
        ]
    }, null, 2), 'utf8');

    const script = path.resolve(__dirname, 'compile-routes.js');
    const res = runNode([script, '--root', root, '--out', outFile]);

    assert.equal(res.status, 1, res.stderr || res.stdout);
    assert.match(res.stdout + res.stderr, /fallback/i);
});

test('compile-routes: writes manifest for valid routes', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'routes-compile-'));
    const root = path.join(tmp, 'routes');
    const outFile = path.join(tmp, 'route-manifest.json');
    fs.mkdirSync(root, { recursive: true });

    fs.writeFileSync(path.join(root, 'demo.route.json'), JSON.stringify({
        version: 2,
        article: 'demo.md',
        entry: 'entry',
        nodes: [
            {
                id: 'entry',
                type: 'decision',
                dimension: 'C',
                fallback: 'standard',
                map: {
                    '0': 'remedial',
                    '1': 'standard',
                    '2': 'advanced'
                }
            },
            { id: 'remedial', type: 'path', path: 'remedial' },
            { id: 'standard', type: 'path', path: 'standard' },
            { id: 'advanced', type: 'path', path: 'deep' }
        ]
    }, null, 2), 'utf8');

    const script = path.resolve(__dirname, 'compile-routes.js');
    const res = runNode([script, '--root', root, '--out', outFile]);

    assert.equal(res.status, 0, res.stderr || res.stdout);
    assert.equal(fs.existsSync(outFile), true);

    const manifest = JSON.parse(fs.readFileSync(outFile, 'utf8'));
    assert.equal(manifest.version, 2);
    assert.ok(manifest.routes['demo.md']);
    assert.equal(manifest.routes['demo.md'].entry, 'entry');
    assert.equal(manifest.routes['demo.md'].nodes.entry.type, 'decision');
    assert.equal(manifest.routes['demo.md'].nodes.entry.fallback, 'standard');
});

test('compile-routes: ignores templates and examples directories', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'routes-compile-'));
    const root = path.join(tmp, 'routes');
    const templatesRoot = path.join(root, 'templates');
    const examplesRoot = path.join(root, 'examples');
    const outFile = path.join(tmp, 'route-manifest.json');
    fs.mkdirSync(templatesRoot, { recursive: true });
    fs.mkdirSync(examplesRoot, { recursive: true });

    fs.writeFileSync(path.join(templatesRoot, 'bad.route.json'), JSON.stringify({
        version: 2,
        article: 'template.md',
        entry: 'entry',
        nodes: []
    }, null, 2), 'utf8');

    fs.writeFileSync(path.join(examplesRoot, 'demo.route.json'), JSON.stringify({
        version: 2,
        article: 'example.md',
        entry: 'entry',
        nodes: []
    }, null, 2), 'utf8');

    const script = path.resolve(__dirname, 'compile-routes.js');
    const res = runNode([script, '--root', root, '--out', outFile]);

    assert.equal(res.status, 0, res.stderr || res.stdout);

    const manifest = JSON.parse(fs.readFileSync(outFile, 'utf8'));
    assert.deepEqual(manifest.routes, {});
});
