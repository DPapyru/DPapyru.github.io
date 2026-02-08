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

test('check-content: --help exits 0', () => {
    const script = path.resolve(__dirname, 'check-content.js');
    const res = runNode([script, '--help']);
    assert.equal(res.status, 0, res.stderr || res.stdout);
    assert.doesNotMatch(res.stdout + res.stderr, /routing_manual\s*:\s*true/i);
    assert.doesNotMatch(res.stdout + res.stderr, /route\s+v2/i);
});

test('check-content: rejects prev_chapter: null', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'content-check-'));
    const root = path.join(tmp, 'content');
    fs.mkdirSync(root, { recursive: true });

    fs.writeFileSync(path.join(root, 'a.md'), [
        '---',
        'title: A',
        'prev_chapter: null',
        '---',
        '',
        'body'
    ].join('\n'), 'utf8');

    const script = path.resolve(__dirname, 'check-content.js');
    const res = runNode([script, '--root', root]);

    assert.equal(res.status, 1, res.stderr || res.stdout);
    assert.match(res.stdout + res.stderr, /prev_chapter:\s*null/i);
});

test('check-content: ignores routing_manual metadata field', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'content-check-'));
    const root = path.join(tmp, 'content');
    fs.mkdirSync(root, { recursive: true });

    fs.writeFileSync(path.join(root, 'manual.md'), [
        '---',
        'title: Manual Routing',
        'routing_manual: true',
        '---',
        '',
        '## 正文',
        '',
        '这里是正文。'
    ].join('\n'), 'utf8');

    const script = path.resolve(__dirname, 'check-content.js');
    const res = runNode([script, '--root', root]);

    assert.equal(res.status, 0, res.stderr || res.stdout);
    assert.match(res.stdout + res.stderr, /OK/i);
});

test('check-content: still passes when markdown contains routing assertions text', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'content-check-'));
    const root = path.join(tmp, 'content');
    fs.mkdirSync(root, { recursive: true });

    fs.writeFileSync(path.join(root, 'manual-ok.md'), [
        '---',
        'title: Manual Routing OK',
        'routing_manual: true',
        '---',
        '',
        '## 分流断言',
        '- C0/T0：应看到补课内容。',
        '- C1/T1：应看到标准主线。',
        '- C2/T2：应看到进阶补充。',
        '',
        '## 正文',
        '',
        '这里是正文。'
    ].join('\n'), 'utf8');

    const script = path.resolve(__dirname, 'check-content.js');
    const res = runNode([script, '--root', root]);

    assert.equal(res.status, 0, res.stderr || res.stdout);
    assert.match(res.stdout + res.stderr, /OK/i);
});

test('check-content: ignores route files even if invalid', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'content-check-'));
    const root = path.join(tmp, 'content');
    const routesRoot = path.join(tmp, 'routes');
    fs.mkdirSync(root, { recursive: true });
    fs.mkdirSync(routesRoot, { recursive: true });

    fs.writeFileSync(path.join(root, 'a.md'), [
        '---',
        'title: A',
        '---',
        '',
        'body'
    ].join('\n'), 'utf8');

    fs.writeFileSync(path.join(routesRoot, 'demo.route.json'), JSON.stringify({
        version: 2,
        article: 'a.md',
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

    const script = path.resolve(__dirname, 'check-content.js');
    const res = runNode([script, '--root', root]);

    assert.equal(res.status, 0, res.stderr || res.stdout);
    assert.match(res.stdout + res.stderr, /OK/i);
});

test('check-content: still passes with standalone markdown checks', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'content-check-'));
    const root = path.join(tmp, 'content');
    const routesRoot = path.join(tmp, 'routes');
    fs.mkdirSync(root, { recursive: true });
    fs.mkdirSync(routesRoot, { recursive: true });

    fs.writeFileSync(path.join(root, 'a.md'), [
        '---',
        'title: A',
        '---',
        '',
        'body'
    ].join('\n'), 'utf8');

    fs.writeFileSync(path.join(routesRoot, 'demo.route.json'), JSON.stringify({
        version: 2,
        article: 'a.md',
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

    const script = path.resolve(__dirname, 'check-content.js');
    const res = runNode([script, '--root', root]);

    assert.equal(res.status, 0, res.stderr || res.stdout);
    assert.match(res.stdout + res.stderr, /OK/i);
});

