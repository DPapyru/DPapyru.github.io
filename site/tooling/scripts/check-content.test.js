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
    assert.match(res.stdout + res.stderr, /routing_manual\s*:\s*true/i);
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

test('check-content: manual routing requires 3 profile assertions', () => {
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

    assert.equal(res.status, 1, res.stderr || res.stdout);
    assert.match(res.stdout + res.stderr, /routing_manual\s*:\s*true/i);
    assert.match(res.stdout + res.stderr, /分流断言/i);
});

test('check-content: manual routing passes with 3 profile assertions', () => {
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

