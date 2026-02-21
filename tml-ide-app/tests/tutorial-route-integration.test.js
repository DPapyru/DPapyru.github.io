import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

test('main.js parses tutorial markdown route from query string', () => {
    const source = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8');

    assert.match(source, /function parseTutorialMarkdownPathFromUrl\(/);
    assert.match(source, /searchParams\.get\('file'\)/);
    assert.match(source, /searchParams\.get\('tutorial'\)/);
    assert.match(source, /tutorialPath:\s*parseTutorialMarkdownPathFromUrl\(url\)/);
});

test('main.js hydrates workspace with tutorial markdown and activates that file', () => {
    const source = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8');

    assert.match(source, /async function ensureTutorialMarkdownRouteLoaded\(/);
    assert.match(source, /await loadMarkdownContentFromPath\(tutorialRepoPath\)/);
    assert.match(source, /switchActiveFile\(targetFile\.id\)/);
    assert.match(source, /教程编辑模式：\$\{workspacePath\}/);
});

test('bootstrap triggers tutorial markdown route hydration', () => {
    const source = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8');

    assert.match(source, /await ensureTutorialMarkdownRouteLoaded\(\);/);
});
