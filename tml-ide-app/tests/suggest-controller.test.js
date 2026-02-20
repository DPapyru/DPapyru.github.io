import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mainEntryPath = path.resolve(__dirname, '../src/main.js');

test('main entry imports Monaco suggest controller so completion popup can render', () => {
    const source = fs.readFileSync(mainEntryPath, 'utf8');
    assert.match(
        source,
        /editor\/contrib\/suggest\/browser\/suggestController/,
        'Monaco suggest controller import is required for editor.action.triggerSuggest'
    );
});
