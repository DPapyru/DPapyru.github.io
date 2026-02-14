const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const fontPath = path.resolve('site/assets/fonts/JetBrainsMonoNerdFont-Bold.ttf');
const styleCssPath = path.resolve('site/assets/css/style.css');
const variablesCssPath = path.resolve('site/assets/css/variables.css');

function readFile(filePath) {
    return fs.readFileSync(filePath, 'utf8');
}

test('tutorial font asset exists', () => {
    assert.equal(
        fs.existsSync(fontPath),
        true,
        'JetBrainsMonoNerdFont-Bold.ttf must exist in site/assets/fonts'
    );
});

test('style.css declares tutorial font-face from local font file', () => {
    const css = readFile(styleCssPath);

    assert.match(
        css,
        /@font-face\s*\{[\s\S]*font-family:\s*['"]JetBrainsMonoNerdFontBold['"]/,
        'style.css should declare JetBrainsMonoNerdFontBold @font-face'
    );

    assert.match(
        css,
        /src:\s*url\(['"]\/site\/assets\/fonts\/JetBrainsMonoNerdFont-Bold\.ttf['"]\)\s*format\(['"]truetype['"]\)/,
        'style.css should load JetBrainsMonoNerdFont-Bold.ttf from /site/assets/fonts'
    );
});

test('tutorial pages use unified tutorial font variable', () => {
    const styleCss = readFile(styleCssPath);
    const variablesCss = readFile(variablesCssPath);

    assert.match(
        variablesCss,
        /--font-family-tutorial:\s*['"]JetBrainsMonoNerdFontBold['"],\s*ui-monospace,\s*SFMono-Regular,\s*Menlo,\s*Monaco,\s*Consolas,\s*["']Liberation Mono["'],\s*["']Courier New["'],\s*monospace\s*;/,
        'variables.css should define --font-family-tutorial'
    );

    assert.match(
        styleCss,
        /body\s*\{[\s\S]*font-family:\s*var\(--font-family-tutorial\)\s*;/,
        'style.css body should use --font-family-tutorial'
    );
});
