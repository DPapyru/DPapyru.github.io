const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('viewer loads route manifest for per-article routing', () => {
    const viewerPath = path.resolve('site/pages/viewer.html');
    const viewer = fs.readFileSync(viewerPath, 'utf8');

    assert.match(viewer, /route-manifest\.json/);
    assert.match(viewer, /loadRouteManifest/);
    assert.match(viewer, /ROUTE_MANIFEST/);
});

test('viewer resolves route path by current article and profile', () => {
    const viewerPath = path.resolve('site/pages/viewer.html');
    const viewer = fs.readFileSync(viewerPath, 'utf8');

    assert.match(viewer, /resolveRoutePathForCurrentDoc/);
    assert.match(viewer, /routeDef\.entry/);
    assert.match(viewer, /fallback/);
    assert.match(viewer, /if\s*\(d\s*===\s*'G'\)/);
});

test('viewer exposes route flags into condition context', () => {
    const viewerPath = path.resolve('site/pages/viewer.html');
    const viewer = fs.readFileSync(viewerPath, 'utf8');

    assert.match(viewer, /R_REMEDIAL/);
    assert.match(viewer, /R_STANDARD/);
    assert.match(viewer, /R_FAST/);
    assert.match(viewer, /R_DEEP/);
    assert.match(viewer, /ROUTE_PATH/);
});
