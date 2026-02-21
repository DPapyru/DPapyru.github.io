import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

test('main.js enables animation C# files with csharp completion/highlight mode', () => {
    const source = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8');

    assert.match(source, /FILE_NAME_ALLOWED_EXT_RE[\s\S]*animcs/);
    assert.match(source, /if \(ext === '\.animcs'\) return 'csharp';/);
    assert.match(source, /function isAnimationCsharpFilePath/);
    assert.match(source, /if \(isAnimationCsharpFilePath\(pathValue\)\) return 'csharp';/);
    assert.match(source, /dom\.statusLanguage\.textContent = 'C# \(动画\)';/);
});

test('main.js separates animation completion profile from normal tModLoader C#', () => {
    const source = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8');

    assert.match(source, /ANALYZE_COMPLETION_PROFILE_TMOD/);
    assert.match(source, /ANALYZE_COMPLETION_PROFILE_ANIMATION/);
    assert.match(source, /completionProfileForModel/);
    assert.match(source, /buildAnimationDomainCompletionItems/);
    assert.match(source, /filterAnalyzeItemsForAnimation/);
    assert.match(source, /mergeCompletionItems/);
});
