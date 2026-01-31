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

