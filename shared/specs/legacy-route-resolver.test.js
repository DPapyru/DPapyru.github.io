const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

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
    assert.equal(normalizeDocPath('content\\如何贡献\\教学文章写作指南.md'), '如何贡献/教学文章写作指南.md');
});

test('resolveViewerFile maps legacy alias and filename to actual path', () => {
    const allDocs = [
        { path: 'Modder入门/DPapyru-给新人的前言.md', filename: 'Modder入门/DPapyru-给新人的前言.md', title: '前言' },
        { path: '如何贡献/教学文章写作指南.md', filename: '如何贡献/教学文章写作指南.md', title: '写作指南' }
    ];
    const pathMappings = {
        'DPapyru-ForNewModder.md': 'Modder入门/DPapyru-给新人的前言.md'
    };

    const resolvedAlias = resolveViewerFile('DPapyru-ForNewModder.md', { allDocs, pathMappings });
    assert.equal(resolvedAlias.path, 'Modder入门/DPapyru-给新人的前言.md');
    assert.equal(resolvedAlias.reason, 'path-mapping');

    const resolvedByName = resolveViewerFile('教学文章写作指南.md', { allDocs, pathMappings });
    assert.equal(resolvedByName.path, '如何贡献/教学文章写作指南.md');
    assert.equal(resolvedByName.reason, 'filename-match');
});

test('buildViewerHref and resolveFolderPath keep compatibility query shape', () => {
    assert.equal(
        buildViewerHref('如何贡献/教学文章写作指南.md'),
        '/site/pages/viewer.html?file=%E5%A6%82%E4%BD%95%E8%B4%A1%E7%8C%AE%2F%E6%95%99%E5%AD%A6%E6%96%87%E7%AB%A0%E5%86%99%E4%BD%9C%E6%8C%87%E5%8D%97.md'
    );

    assert.equal(resolveFolderPath('/site/content/Modder入门'), 'Modder入门');
});

test('resolveViewerFile keeps contributor aliases compatible with current config mappings', () => {
    const configPath = path.resolve(__dirname, '../../site/content/config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const allDocs = config.all_files || [];
    const pathMappings = config.pathMappings || (config.settings && config.settings.pathMappings) || {};

    const cases = [
        ['DPapyru-ForContributors-Basic.md', '如何贡献/教学文章写作指南.md'],
        ['TopicSystemGuide.md', '如何贡献/站点Markdown扩展语法说明.md'],
        ['TopicSystem使用指南.md', '如何贡献/站点Markdown扩展语法说明.md']
    ];

    for (const [rawFile, expectedPath] of cases) {
        const resolved = resolveViewerFile(rawFile, { allDocs, pathMappings });
        assert.equal(resolved.path, expectedPath);
        assert.equal(resolved.reason, 'path-mapping');
    }
});

test('resolveViewerFile no longer maps removed 怎么贡献 aliases via pathMappings', () => {
    const configPath = path.resolve(__dirname, '../../site/content/config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const allDocs = config.all_files || [];
    const pathMappings = config.pathMappings || (config.settings && config.settings.pathMappings) || {};

    const removedAliases = [
        '怎么贡献/DPapyru-贡献者如何编写文章基础.md',
        '怎么贡献/教学文章写作指南.md',
        '怎么贡献/TopicSystem使用指南.md'
    ];

    for (const rawFile of removedAliases) {
        const resolved = resolveViewerFile(rawFile, { allDocs, pathMappings });
        assert.notEqual(resolved.reason, 'path-mapping');
        assert.notEqual(resolved.reason, 'path-mapping-fallback');
    }
});
