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
