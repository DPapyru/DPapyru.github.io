const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function readFolderHtml() {
    return fs.readFileSync(path.resolve('site/pages/folder.html'), 'utf8');
}

function extractNamedFunction(source, functionName, dependencies) {
    const signature = 'function ' + functionName + '(';
    const start = source.indexOf(signature);
    assert.notEqual(start, -1, 'missing function ' + functionName);

    const braceStart = source.indexOf('{', start);
    assert.notEqual(braceStart, -1, 'missing opening brace for ' + functionName);

    let depth = 0;
    let end = -1;
    for (let index = braceStart; index < source.length; index += 1) {
        const ch = source[index];
        if (ch === '{') depth += 1;
        if (ch === '}') {
            depth -= 1;
            if (depth === 0) {
                end = index;
                break;
            }
        }
    }

    assert.notEqual(end, -1, 'missing closing brace for ' + functionName);
    const functionSource = source.slice(start, end + 1);
    const argNames = Object.keys(dependencies || {});
    const argValues = Object.values(dependencies || {});
    return new Function(...argNames, `return (${functionSource});`)(...argValues);
}

test('folder page main keeps only svg canvas content with 10px safe padding', () => {
    const html = readFolderHtml();

    assert.match(
        html,
        /<body class="workbench-page folder-svg-only-page">/
    );
    assert.match(
        html,
        /body\.folder-svg-only-page \.workbench-main\s*\{[\s\S]*padding:\s*10px;/
    );
    assert.match(
        html,
        /<main class="workbench-main" id="main-content" tabindex="-1">\s*<svg class="folder-map-svg" id="folder-map-svg"/s
    );
    assert.doesNotMatch(html, /id="folder-map-title"/);
    assert.doesNotMatch(html, /id="folder-count-meta"/);
    assert.doesNotMatch(html, /id="doc-count-meta"/);
    assert.doesNotMatch(html, /id="folder-map-empty"/);
    assert.doesNotMatch(html, /folder-map-legend/);
});

test('folder page script no longer depends on html toolbar helpers', () => {
    const html = readFolderHtml();

    assert.match(html, /function\s+buildFolderDocGroups\s*\(/);
    assert.match(html, /function\s+renderMap\s*\(/);
    assert.match(html, /function\s+drawNode\s*\(/);
    assert.doesNotMatch(html, /function\s+updateToolbar\s*\(/);
    assert.doesNotMatch(html, /function\s+setMapEmpty\s*\(/);
    assert.doesNotMatch(html, /id="go-parent-btn"/);
});

test('buildFolderDocGroups keeps current docs and limits child previews to three docs', () => {
    const html = readFolderHtml();
    const compareDoc = function (a, b) {
        const orderDelta = (a.order || 999) - (b.order || 999);
        if (orderDelta !== 0) return orderDelta;
        return String(a.title || '').localeCompare(String(b.title || ''), 'zh-CN');
    };
    const compareFolder = function (a, b) {
        return String(a.name || '').localeCompare(String(b.name || ''), 'zh-CN');
    };
    const collectDocsRecursively = extractNamedFunction(html, 'collectDocsRecursively', {
        compareDoc,
        compareFolder
    });
    const buildFolderDocGroups = extractNamedFunction(html, 'buildFolderDocGroups', {
        collectDocsRecursively,
        compareFolder,
        compareDoc,
        ROOT_LABEL: '教程目录'
    });

    const folderNode = {
        name: '螺线翻译tml教程',
        path: '螺线翻译tml教程',
        docs: [
            { title: '总览', path: '螺线翻译tml教程/总览.md', order: 1 },
            { title: '开始前', path: '螺线翻译tml教程/开始前.md', order: 2 }
        ],
        children: new Map([
            ['0-开始', {
                name: '0-开始',
                path: '螺线翻译tml教程/0-开始',
                docs: [
                    { title: '主页', path: '螺线翻译tml教程/0-开始/主页.md', order: 1 },
                    { title: '玩家', path: '螺线翻译tml教程/0-开始/玩家.md', order: 2 },
                    { title: '开发者', path: '螺线翻译tml教程/0-开始/开发者.md', order: 3 },
                    { title: '贡献者', path: '螺线翻译tml教程/0-开始/贡献者.md', order: 4 }
                ],
                children: new Map()
            }],
            ['1-基础', {
                name: '1-基础',
                path: '螺线翻译tml教程/1-基础',
                docs: [{ title: '基础一', path: '螺线翻译tml教程/1-基础/基础一.md', order: 1 }],
                children: new Map([
                    ['附录', {
                        name: '附录',
                        path: '螺线翻译tml教程/1-基础/附录',
                        docs: [
                            { title: '附录文档', path: '螺线翻译tml教程/1-基础/附录/附录文档.md', order: 2 },
                            { title: '附录二', path: '螺线翻译tml教程/1-基础/附录/附录二.md', order: 3 },
                            { title: '附录三', path: '螺线翻译tml教程/1-基础/附录/附录三.md', order: 4 }
                        ],
                        children: new Map()
                    }]
                ])
            }]
        ])
    };

    assert.deepEqual(
        collectDocsRecursively(folderNode).map(function (doc) { return doc.title; }),
        ['总览', '开始前', '主页', '玩家', '开发者', '贡献者', '基础一', '附录文档', '附录二', '附录三']
    );

    assert.deepEqual(
        buildFolderDocGroups(folderNode),
        {
            currentDocs: ['总览', '开始前'],
            childGroups: [
                {
                    label: '0-开始',
                    path: '螺线翻译tml教程/0-开始',
                    totalDocs: 4,
                    hiddenDocCount: 1,
                    previewDocs: ['主页', '玩家', '开发者']
                },
                {
                    label: '1-基础',
                    path: '螺线翻译tml教程/1-基础',
                    totalDocs: 4,
                    hiddenDocCount: 1,
                    previewDocs: ['基础一', '附录文档', '附录二']
                }
            ]
        }
    );
});
