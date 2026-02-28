const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function readViewer() {
    return fs.readFileSync(path.resolve('site/pages/viewer.html'), 'utf8');
}

test('viewer shader modal includes ide-like preview control blocks', () => {
    const viewer = readViewer();

    assert.match(viewer, /fx-embed-preview-controls/);
    assert.match(viewer, /fx-embed-timebox/);
    assert.match(viewer, /fx-embed-stage-head/);
    assert.match(viewer, /fx-embed-zoom-actions/);
    assert.match(viewer, /fx-embed-aspect-resizer/);
    assert.match(viewer, /fx-embed-upload-name/);
});

test('viewer shader modal defines preview mode normalizers and iTime operations', () => {
    const viewer = readViewer();

    assert.match(viewer, /normalizeFxEmbedPreviewPreset/);
    assert.match(viewer, /normalizeFxEmbedPreviewRenderMode/);
    assert.match(viewer, /normalizeFxEmbedPreviewAddressMode/);
    assert.match(viewer, /normalizeFxEmbedPreviewBgMode/);
    assert.match(viewer, /setFxEmbedPreviewRunning/);
    assert.match(viewer, /applyFxEmbedITimeFromInput/);
    assert.match(viewer, /offsetFxEmbedITime/);
    assert.match(viewer, /resetFxEmbedITimeOffset/);
});

test('viewer shader modal defines viewport zoom drag and aspect resize interactions', () => {
    const viewer = readViewer();

    assert.match(viewer, /installFxEmbedViewportInteractions/);
    assert.match(viewer, /installFxEmbedAspectResizerInteractions/);
    assert.match(viewer, /setFxEmbedZoom/);
    assert.match(viewer, /resetFxEmbedView/);
    assert.match(viewer, /setFxEmbedViewportWidth/);
});
