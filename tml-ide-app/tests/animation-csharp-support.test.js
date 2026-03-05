import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

test('main.js enables animation .anim.ts files with TypeScript highlight/completion mode', () => {
    const source = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8');

    assert.match(source, /FILE_NAME_ALLOWED_EXT_RE[\s\S]*\.anim\.ts/);
    assert.match(source, /function isAnimationCsharpFilePath/);
    assert.match(source, /if \(isAnimationCsharpFilePath\(pathValue\)\) return 'typescript';/);
    assert.match(source, /if \(mode === 'animts'\) return 'typescript';/);
    assert.match(source, /dom\.statusLanguage\.textContent = 'TypeScript \(动画\)';/);
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

test('main.js exposes vertex shader draw domain members for animation completion', () => {
    const source = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8');

    assert.match(source, /Microsoft\.Xna\.Framework/);
    assert.match(source, /Microsoft\.Xna\.Framework\.Graphics/);
    assert.match(source, /Vector2/);
    assert.match(source, /Vector3/);
    assert.match(source, /Matrix/);
    assert.match(source, /Color/);
    assert.match(source, /PrimitiveType/);
    assert.match(source, /BlendState/);
    assert.match(source, /VertexPositionColorTexture/);
    assert.match(source, /UseEffect/);
    assert.match(source, /ClearEffect/);
    assert.match(source, /SetBlendState/);
    assert.match(source, /SetTexture/);
    assert.match(source, /SetFloat/);
    assert.match(source, /SetVector2/);
    assert.match(source, /SetColor/);
    assert.match(source, /DrawUserIndexedPrimitives/);
    assert.doesNotMatch(source, /SetBlendMode/);
    assert.doesNotMatch(source, /SetVec2/);
    assert.doesNotMatch(source, /\bBlendMode\b/);
});

test('main.js augments anim.ts TypeScript completion with this-field provider', () => {
    const source = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8');

    assert.match(source, /buildAnimTsThisCompletionItems/);
    assert.match(source, /registerCompletionItemProvider\('typescript'/);
    assert.match(source, /if \(!file \|\| !isAnimationCsharpFilePath\(file\.path\)\)/);
    assert.match(source, /ANIMATION_MEMBER_RETURN_TYPE_BY_TYPE/);
});
