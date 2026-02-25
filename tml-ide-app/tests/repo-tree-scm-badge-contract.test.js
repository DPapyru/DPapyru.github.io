import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const mainSource = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8');
const styleSource = fs.readFileSync(path.join(root, 'src/style.css'), 'utf8');

test('repo tree file item exposes scm badge hook in main renderer', () => {
    assert.match(mainSource, /repo-tree-change-badge/);
    assert.match(mainSource, /badge\.dataset\.status/);
    assert.match(mainSource, /badge\.textContent\s*=\s*change\.status/);
});

test('repo tree scm badge styles define A M D states', () => {
    assert.match(styleSource, /\.repo-tree-change-badge\b/);
    assert.match(styleSource, /\.repo-tree-change-badge\[data-status="A"\]/);
    assert.match(styleSource, /\.repo-tree-change-badge\[data-status="M"\]/);
    assert.match(styleSource, /\.repo-tree-change-badge\[data-status="D"\]/);
});
