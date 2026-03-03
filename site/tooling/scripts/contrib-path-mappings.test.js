const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function loadConfig() {
    const configPath = path.resolve('site/content/config.json');
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

const REQUIRED_MAPPINGS = {
    'DPapyru-ForContributors-Basic.md': '如何贡献/教学文章写作指南.md',
    'TopicSystemGuide.md': '如何贡献/站点Markdown扩展语法说明.md',
    'TopicSystem使用指南.md': '如何贡献/站点Markdown扩展语法说明.md'
};

const REMOVED_MAPPINGS = [
    '怎么贡献/DPapyru-贡献者如何编写文章基础.md',
    '怎么贡献/教学文章写作指南.md',
    '怎么贡献/TopicSystem使用指南.md'
];

function assertRemovedMappings(mappingTable, tableName) {
    REMOVED_MAPPINGS.forEach((legacyPath) => {
        assert.equal(mappingTable[legacyPath], undefined, `${tableName} should remove legacy mapping: ${legacyPath}`);
    });
};

test('config pathMappings keeps contributor legacy aliases mapped to current paths', () => {
    const config = loadConfig();
    const topMappings = config.pathMappings || {};

    Object.entries(REQUIRED_MAPPINGS).forEach(([legacyPath, nextPath]) => {
        assert.equal(topMappings[legacyPath], nextPath, `missing top-level mapping: ${legacyPath}`);
    });
});

test('settings.pathMappings mirrors required contributor alias mappings', () => {
    const config = loadConfig();
    const settingsMappings = (config.settings && config.settings.pathMappings) || {};

    Object.entries(REQUIRED_MAPPINGS).forEach(([legacyPath, nextPath]) => {
        assert.equal(settingsMappings[legacyPath], nextPath, `missing settings mapping: ${legacyPath}`);
    });
});

test('config pathMappings removes obsolete 怎么贡献 aliases', () => {
    const config = loadConfig();
    const topMappings = config.pathMappings || {};
    assertRemovedMappings(topMappings, 'pathMappings');
});

test('settings.pathMappings removes obsolete 怎么贡献 aliases', () => {
    const config = loadConfig();
    const settingsMappings = (config.settings && config.settings.pathMappings) || {};
    assertRemovedMappings(settingsMappings, 'settings.pathMappings');
});

test('mapped contributor targets exist in config all_files index', () => {
    const config = loadConfig();
    const allFiles = new Set((config.all_files || []).map((file) => file.path));

    Object.values(REQUIRED_MAPPINGS).forEach((targetPath) => {
        assert.ok(allFiles.has(targetPath), `mapping target must exist in all_files: ${targetPath}`);
    });
});
