import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cssPath = path.resolve(__dirname, '../src/style.css');

test('app-shell clamps to viewport height on desktop and relaxes on small screens', () => {
    const css = fs.readFileSync(cssPath, 'utf8');

    assert.match(
        css,
        /\.app-shell\s*\{[^}]*height:\s*100vh;[^}]*min-height:\s*100vh;[^}]*\}/
    );

    assert.match(
        css,
        /@media\s*\(max-width:\s*1200px\)\s*\{[\s\S]*?\.app-shell\s*\{[^}]*height:\s*auto;[^}]*min-height:\s*100vh;[^}]*\}/
    );
});
