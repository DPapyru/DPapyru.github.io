const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('viewer expands transclusions before optional learning UI rendering', () => {
    const viewerPath = path.resolve('site/pages/viewer.html');
    const viewer = fs.readFileSync(viewerPath, 'utf8');

    const transclusionIdx = viewer.indexOf('content = await expandMarkdownTransclusions(content, fetchPath, 0, [], learningModel.ctx);');
    const sidebarIdx = viewer.indexOf('renderLearningSidebarPanel(learningModel);');
    const hintsIdx = viewer.indexOf('renderLearningHintsBanner(learningModel);');
    const topBannerIdx = viewer.indexOf('renderLearningTopBanner(learningModel);');

    assert.notEqual(transclusionIdx, -1, 'missing markdown transclusion expansion call');
    assert.notEqual(sidebarIdx, -1, 'missing sidebar learning render call');
    assert.notEqual(hintsIdx, -1, 'missing hints learning render call');
    assert.notEqual(topBannerIdx, -1, 'missing top-banner learning render call');

    assert.ok(
        transclusionIdx < sidebarIdx,
        'transclusion expansion should run before optional learning sidebar rendering'
    );
    assert.ok(
        transclusionIdx < hintsIdx,
        'transclusion expansion should run before optional learning hints rendering'
    );
    assert.ok(
        transclusionIdx < topBannerIdx,
        'transclusion expansion should run before optional learning top-banner rendering'
    );
});
