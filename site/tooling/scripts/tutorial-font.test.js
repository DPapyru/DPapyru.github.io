const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const jetBrainsFontPath = path.resolve('site/assets/fonts/JetBrainsMonoNerdFont-Bold.ttf');
const harmonyFontPath = path.resolve('site/assets/fonts/HarmonyOS_Sans_SC_Regular.ttf');
const styleCssPath = path.resolve('site/assets/css/style.css');
const variablesCssPath = path.resolve('site/assets/css/variables.css');

function readFile(filePath) {
    return fs.readFileSync(filePath, 'utf8');
}

test('tutorial font assets exist', () => {
    assert.equal(
        fs.existsSync(jetBrainsFontPath),
        true,
        'JetBrainsMonoNerdFont-Bold.ttf must exist in site/assets/fonts'
    );

    assert.equal(
        fs.existsSync(harmonyFontPath),
        true,
        'HarmonyOS_Sans_SC_Regular.ttf must exist in site/assets/fonts'
    );
});

test('style.css declares tutorial font-faces from local font files', () => {
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

    assert.match(
        css,
        /@font-face\s*\{[\s\S]*font-family:\s*['"]HarmonyOSSansSCRegular['"]/,
        'style.css should declare HarmonyOSSansSCRegular @font-face'
    );

    assert.match(
        css,
        /src:\s*url\(['"]\/site\/assets\/fonts\/HarmonyOS_Sans_SC_Regular\.ttf['"]\)\s*format\(['"]truetype['"]\)/,
        'style.css should load HarmonyOS_Sans_SC_Regular.ttf from /site/assets/fonts'
    );
});

test('tutorial pages use unified tutorial font variable', () => {
    const styleCss = readFile(styleCssPath);
    const variablesCss = readFile(variablesCssPath);

    assert.match(
        variablesCss,
        /--font-family-tutorial:\s*['"]JetBrainsMonoNerdFontBold['"],\s*['"]HarmonyOSSansSCRegular['"],\s*ui-monospace,\s*SFMono-Regular,\s*Menlo,\s*Monaco,\s*Consolas,\s*["']Liberation Mono["'],\s*["']Courier New["'],\s*monospace\s*;/,
        'variables.css should define --font-family-tutorial'
    );

    assert.match(
        styleCss,
        /body\s*\{[\s\S]*font-family:\s*var\(--font-family-tutorial\)\s*;/,
        'style.css body should use --font-family-tutorial'
    );
});
