const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('viewer no longer loads route manifest runtime', () => {
    const viewerPath = path.resolve('site/pages/viewer.html');
    const viewer = fs.readFileSync(viewerPath, 'utf8');

    assert.doesNotMatch(viewer, /route-manifest\.json/);
    assert.doesNotMatch(viewer, /loadRouteManifest/);
    assert.doesNotMatch(viewer, /ROUTE_MANIFEST/);
});

test('viewer no longer resolves route path by profile', () => {
    const viewerPath = path.resolve('site/pages/viewer.html');
    const viewer = fs.readFileSync(viewerPath, 'utf8');

    assert.doesNotMatch(viewer, /resolveRoutePathForCurrentDoc/);
    assert.doesNotMatch(viewer, /routeDef\.entry/);
    assert.doesNotMatch(viewer, /routeDimensionLevel/);
    assert.doesNotMatch(viewer, /if\s*\(d\s*===\s*'G'\)/);
});

test('viewer removes runtime condition block filtering and route flags', () => {
    const viewerPath = path.resolve('site/pages/viewer.html');
    const viewer = fs.readFileSync(viewerPath, 'utf8');

    assert.doesNotMatch(viewer, /applyLearningConditionBlocks/);
    assert.doesNotMatch(viewer, /evaluateLearningCondition/);
    assert.doesNotMatch(viewer, /R_REMEDIAL/);
    assert.doesNotMatch(viewer, /R_STANDARD/);
    assert.doesNotMatch(viewer, /R_FAST/);
    assert.doesNotMatch(viewer, /R_DEEP/);
    assert.doesNotMatch(viewer, /ROUTE_PATH/);
});

test('viewer still keeps inline quiz rendering capability', () => {
    const viewerPath = path.resolve('site/pages/viewer.html');
    const viewer = fs.readFileSync(viewerPath, 'utf8');

    assert.match(viewer, /site-quiz\.js/);
    assert.match(viewer, /SiteQuiz\.renderQuizzes/);
});
