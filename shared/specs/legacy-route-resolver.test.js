const test = require('node:test');
const assert = require('node:assert/strict');

const {
    normalizeDocPath,
    resolveViewerFile,
    buildViewerHref,
    resolveFolderPath
} = require('../services/routing/legacy-route-resolver.js');

test('normalizeDocPath strips legacy prefixes and dot segments', () => {
    assert.equal(
        normalizeDocPath('/site/content/../content/Modder入门/./DPapyru-给新人的前言.md'),
        'Modder入门/DPapyru-给新人的前言.md'
    );
    assert.equal(normalizeDocPath('content\\怎么贡献\\教学文章写作指南.md'), '怎么贡献/教学文章写作指南.md');
});

test('resolveViewerFile maps legacy alias and filename to actual path', () => {
    const allDocs = [
        { path: 'Modder入门/DPapyru-给新人的前言.md', filename: 'Modder入门/DPapyru-给新人的前言.md', title: '前言' },
        { path: '怎么贡献/教学文章写作指南.md', filename: '怎么贡献/教学文章写作指南.md', title: '写作指南' }
    ];
    const pathMappings = {
        'DPapyru-ForNewModder.md': 'Modder入门/DPapyru-给新人的前言.md'
    };

    const resolvedAlias = resolveViewerFile('DPapyru-ForNewModder.md', { allDocs, pathMappings });
    assert.equal(resolvedAlias.path, 'Modder入门/DPapyru-给新人的前言.md');
    assert.equal(resolvedAlias.reason, 'path-mapping');

    const resolvedByName = resolveViewerFile('教学文章写作指南.md', { allDocs, pathMappings });
    assert.equal(resolvedByName.path, '怎么贡献/教学文章写作指南.md');
    assert.equal(resolvedByName.reason, 'filename-match');
});

test('buildViewerHref and resolveFolderPath keep compatibility query shape', () => {
    assert.equal(
        buildViewerHref('怎么贡献/教学文章写作指南.md'),
        '/site/pages/viewer.html?file=%E6%80%8E%E4%B9%88%E8%B4%A1%E7%8C%AE%2F%E6%95%99%E5%AD%A6%E6%96%87%E7%AB%A0%E5%86%99%E4%BD%9C%E6%8C%87%E5%8D%97.md'
    );

    assert.equal(resolveFolderPath('/site/content/Modder入门'), 'Modder入门');
});
