import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const mainSource = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8');

test('shader files auto-focus compile workflow when activated', () => {
    assert.match(mainSource, /function ensureShaderWorkflowVisible\(/);
    assert.match(mainSource, /ensureShaderWorkflowVisible\(\);/);
    assert.match(mainSource, /setActivePanelTab\('compile'\)/);
});

test('repo explorer reveals active file after create or open', () => {
    assert.match(mainSource, /function revealRepoExplorerPath\(/);
    assert.match(mainSource, /createFileFromPathInput[\s\S]*revealRepoExplorerPath\(file\.path\)/);
    assert.match(mainSource, /openRepoExplorerFile[\s\S]*revealRepoExplorerPath\(file\.path\)/);
});

test('debug completion path reuses anim.ts visible suggestion logic', () => {
    assert.match(mainSource, /requestCompletionsAtCursor\(maxItems\)/);
    assert.match(mainSource, /isAnimationCsharpFilePath\(file\.path\)/);
    assert.match(mainSource, /buildAnimTsThisCompletionItems/);
});
