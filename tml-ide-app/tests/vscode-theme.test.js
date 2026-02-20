import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('style declares vscode-like dark shell colors', () => {
    const cssPath = path.resolve(__dirname, '../src/style.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    assert.match(css, /--vscode-bg-editor:\s*#1e1e1e/i);
    assert.match(css, /--vscode-bg-sidebar:\s*#252526/i);
    assert.match(css, /--vscode-accent:\s*#007acc/i);
    assert.match(css, /--vscode-text:\s*#d4d4d4/i);
});
