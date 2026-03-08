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

function createSvgStub(tag, attrs) {
    return {
        tag,
        attrs: Object.assign({}, attrs),
        children: [],
        classList: {
            values: [],
            add(value) {
                this.values.push(value);
            }
        },
        setAttribute(name, value) {
            this.attrs[name] = value;
        },
        getAttribute(name) {
            return this.attrs[name];
        },
        appendChild(child) {
            this.children.push(child);
            return child;
        },
        addEventListener() {}
    };
}

test('folder page main keeps only svg canvas content', () => {
    const html = readFolderHtml();

    assert.match(
        html,
        /<main class="workbench-main" id="main-content" tabindex="-1">\s*<svg class="folder-map-svg" id="folder-map-svg"/s
    );
    assert.doesNotMatch(html, /id="go-parent-btn"/);
    assert.doesNotMatch(html, /id="folder-map-breadcrumb"/);
    assert.doesNotMatch(html, /id="folder-doc-locator"/);
    assert.doesNotMatch(html, /id="folder-doc-locator-results"/);
    assert.doesNotMatch(html, /id="folder-map-empty"/);
    assert.doesNotMatch(html, /folder-map-legend/);
});

test('folder page script no longer depends on html toolbar or locator controls', () => {
    const html = readFolderHtml();

    assert.doesNotMatch(html, /function updateToolbar\(/);
    assert.doesNotMatch(html, /function updateDocLocatorControls\(/);
    assert.doesNotMatch(html, /function updateFolderMapBreadcrumb\(/);
    assert.doesNotMatch(html, /folder-doc-locator/);
    assert.match(html, /function focusStageOnPoint\(/);
    assert.match(html, /function renderMap\(/);
});

test('folder page builds grouped recursive doc index for current folder svg', () => {
    const html = readFolderHtml();
    const compareDoc = function (a, b) {
        return String(a.title || '').localeCompare(String(b.title || ''), 'zh-CN');
    };
    const collectDocsRecursively = extractNamedFunction(html, 'collectDocsRecursively', {
        compareDoc,
        compareFolder: function (a, b) {
            return String(a.name || '').localeCompare(String(b.name || ''), 'zh-CN');
        }
    });
    const buildFolderDocGroups = extractNamedFunction(html, 'buildFolderDocGroups', {
        collectDocsRecursively,
        compareFolder: function (a, b) {
            return String(a.name || '').localeCompare(String(b.name || ''), 'zh-CN');
        },
        compareDoc,
        ROOT_LABEL: '教程目录'
    });

    const folderNode = {
        name: '螺线翻译tml教程',
        path: '螺线翻译tml教程',
        docs: [{ title: '总览', path: '螺线翻译tml教程/总览.md' }],
        children: new Map([
            ['0-开始', {
                name: '0-开始',
                path: '螺线翻译tml教程/0-开始',
                docs: [{ title: '主页', path: '螺线翻译tml教程/0-开始/主页.md' }],
                children: new Map()
            }],
            ['1-基础', {
                name: '1-基础',
                path: '螺线翻译tml教程/1-基础',
                docs: [{ title: '基础一', path: '螺线翻译tml教程/1-基础/基础一.md' }],
                children: new Map([
                    ['附录', {
                        name: '附录',
                        path: '螺线翻译tml教程/1-基础/附录',
                        docs: [{ title: '附录文档', path: '螺线翻译tml教程/1-基础/附录/附录文档.md' }],
                        children: new Map()
                    }]
                ])
            }]
        ])
    };

    assert.deepEqual(
        collectDocsRecursively(folderNode).map(function (doc) { return doc.title; }),
        ['总览', '主页', '基础一', '附录文档']
    );

    assert.deepEqual(
        buildFolderDocGroups(folderNode).map(function (group) {
            return {
                label: group.label,
                path: group.path,
                docs: group.docs.map(function (doc) { return doc.title; })
            };
        }),
        [
            { label: '当前目录', path: '螺线翻译tml教程', docs: ['总览'] },
            { label: '0-开始', path: '螺线翻译tml教程/0-开始', docs: ['主页'] },
            { label: '1-基础', path: '螺线翻译tml教程/1-基础', docs: ['基础一', '附录文档'] }
        ]
    );
});

test('drawNode falls back to visible title for SVG accessible name when label is omitted', () => {
    const html = readFolderHtml();
    const layer = {
        children: [],
        appendChild(node) {
            this.children.push(node);
            return node;
        }
    };
    const drawNode = extractNamedFunction(html, 'drawNode', {
        truncateText: function (text) {
            return String(text || '');
        },
        createSvgEl: createSvgStub,
        addInteractiveNode: function () {}
    });

    drawNode(layer, {
        cx: 160,
        cy: 120,
        width: 220,
        height: 72,
        fill: '#000',
        stroke: '#fff',
        textColor: '#fff',
        title: '返回上一级',
        subtitle: '进入上一级目录',
        onClick: function () {}
    });

    assert.equal(layer.children[0].getAttribute('aria-label'), '返回上一级');
});
