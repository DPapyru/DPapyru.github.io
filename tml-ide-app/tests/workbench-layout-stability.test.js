import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cssPath = path.resolve(__dirname, '../src/style.css');

test('workbench layout keeps bottom panel and activity bottom group anchored', () => {
    const css = fs.readFileSync(cssPath, 'utf8');

    assert.match(css, /\.app-shell\s*\{[^}]*height:\s*100vh;/s);
    assert.match(css, /#workspace-csharp-root,\s*#workspace-subapp-root\s*\{[^}]*height:\s*100%;/s);
    assert.match(css, /\.app-main\s*\{[^}]*height:\s*100%;/s);
    assert.match(css, /\.activity-bar\s*\{[^}]*min-height:\s*0;/s);
});
