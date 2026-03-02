const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('viewer contains markdown callout runtime for > [!LEVEL] syntax', () => {
    const viewer = fs.readFileSync(path.resolve('site/pages/viewer.html'), 'utf8');

    assert.match(viewer, /MARKDOWN_CALLOUT_LEVEL_MAP/);
    assert.match(viewer, /parseMarkdownCalloutMarker/);
    assert.match(viewer, /\^\s*\\\[!\(\[A-Za-z\]\+\)\\\]/);
    assert.match(viewer, /stripMarkdownCalloutMarker/);
    assert.match(viewer, /applyMarkdownCalloutBlocks\(markdownContent\)/);
    assert.match(viewer, /applyMarkdownCalloutBlocks\(dom\.output\)/);
    assert.match(viewer, /markerRemoved/);
    assert.match(viewer, /strippedLines\.join\('\\n'\)/);
});

test('viewer contains KaTeX runtime and applies math rendering for markdown outputs', () => {
    const viewer = fs.readFileSync(path.resolve('site/pages/viewer.html'), 'utf8');

    assert.match(viewer, /katex\.min\.css/);
    assert.match(viewer, /katex\.min\.js/);
    assert.match(viewer, /auto-render\.min\.js/);
    assert.match(viewer, /normalizeMarkdownMathBlocks/);
    assert.match(viewer, /renderMarkdownMath/);
    assert.match(viewer, /renderMathInElement/);
    assert.match(viewer, /renderMarkdownMath\(markdownContent\)/);
    assert.match(viewer, /renderMarkdownMath\(dom\.output\)/);
});

test('viewer embeds fx references as fxembed fenced blocks', () => {
    const viewer = fs.readFileSync(path.resolve('site/pages/viewer.html'), 'utf8');

    assert.match(viewer, /buildFencedCodeBlock\('fxembed'/);
    assert.match(viewer, /installFxEmbedInteractions\(markdownContent\)/);
    assert.match(viewer, /data-fx-embed-path/);
});

test('viewer fx embed card includes inline realtime preview runtime hooks', () => {
    const viewer = fs.readFileSync(path.resolve('site/pages/viewer.html'), 'utf8');

    assert.match(viewer, /fx-embed-card-preview/);
    assert.match(viewer, /fx-embed-card-canvas/);
    assert.match(viewer, /installFxEmbedCardPreviews/);
    assert.match(viewer, /drawFxEmbedCardCanvas/);
    assert.match(viewer, /FX_EMBED_SESSION\.set\(runtime\.path/);
    assert.match(viewer, /setFxEmbedModalOpen\(true\)/);
    assert.match(viewer, /正在加载 Shader 源码/);
});

test('viewer fx embed modal editor uses shader assist highlight and autocomplete hooks', () => {
    const viewer = fs.readFileSync(path.resolve('site/pages/viewer.html'), 'utf8');

    assert.match(viewer, /\/tml-ide\/subapps\/assets\/js\/shader-editor-assist\.js/);
    assert.match(viewer, /fx-embed-editor-highlight/);
    assert.match(viewer, /fx-embed-editor-highlight-code/);
    assert.match(viewer, /fx-embed-autocomplete/);
    assert.match(viewer, /collectCompletionItems/);
    assert.match(viewer, /indentTextBlock/);
    assert.match(viewer, /Ctrl \+ Space/);
});

test('viewer fx embed modal exposes shader preview operation controls', () => {
    const viewer = fs.readFileSync(path.resolve('site/pages/viewer.html'), 'utf8');

    assert.match(viewer, /fx-embed-timebox/);
    assert.match(viewer, /data-fx-embed-toggle-run/);
    assert.match(viewer, /data-fx-embed-reset-playback/);
    assert.match(viewer, /data-fx-embed-itime-input/);
    assert.match(viewer, /data-fx-embed-zoom-in/);
    assert.match(viewer, /data-fx-embed-zoom-out/);
    assert.match(viewer, /data-fx-embed-aspect-resizer/);
    assert.match(viewer, /setBoundFxEmbedTextureAddressMode/);
});
