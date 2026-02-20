import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

test('index.html exposes required IDE controls', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    assert.match(html, /id="editor"/);
    assert.match(html, /id="btn-run-diagnostics"/);
    assert.match(html, /id="btn-import-assembly"/);
    assert.match(html, /id="toggle-roslyn"/);
});

test('message contract includes required request channels', () => {
    const contract = fs.readFileSync(path.join(root, 'src/contracts/messages.js'), 'utf8');
    assert.match(contract, /completion\.request/);
    assert.match(contract, /hover\.request/);
    assert.match(contract, /diagnostics\.rule\.request/);
    assert.match(contract, /diagnostics\.roslyn\.request/);
    assert.match(contract, /assembly\.import\.request/);
});
