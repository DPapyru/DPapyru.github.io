import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

test('index.html exposes context menu and fix popup nodes', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    assert.match(html, /id="ide-context-menu"/);
    assert.match(html, /id="ide-context-menu-list"/);
    assert.match(html, /id="ide-fix-popup"/);
    assert.match(html, /id="ide-fix-popup-issue"/);
    assert.match(html, /id="ide-fix-popup-suggestions"/);
    assert.match(html, /id="ide-fix-popup-actions"/);
    assert.match(html, /role="menu"/);
    assert.match(html, /role="menuitem"/);
});

test('main.js exposes context/fix debug APIs and Ctrl+.', () => {
    const js = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8');
    assert.match(js, /menuContext/);
    assert.match(js, /openContextMenuAt/);
    assert.match(js, /getContextMenuState/);
    assert.match(js, /getFixPopupState/);
    assert.match(js, /openFixPopupAtCursor/);
    assert.match(js, /key\s*===\s*'\.'/);
});
