const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function readViewerHtml() {
    return fs.readFileSync(path.resolve('site/pages/viewer.html'), 'utf8');
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

function extractFunctionBody(source, startMarker) {
    const start = source.indexOf(startMarker);
    assert.notEqual(start, -1, 'start marker not found: ' + startMarker);

    const bodyStart = source.indexOf('{', start);
    assert.notEqual(bodyStart, -1, 'function body start not found');

    let depth = 0;
    let bodyEnd = -1;
    for (let index = bodyStart; index < source.length; index += 1) {
        const ch = source[index];
        if (ch === '{') depth += 1;
        if (ch === '}') {
            depth -= 1;
            if (depth === 0) {
                bodyEnd = index;
                break;
            }
        }
    }

    assert.notEqual(bodyEnd, -1, 'function body end not found');
    return source.slice(bodyStart + 1, bodyEnd).replace(/\s*$/, '');
}

function createResolveLinkHref() {
    const source = readViewerHtml();
    const body = extractFunctionBody(
        source,
        'resolveLinkHref: function (linkContext)'
    );

    return new Function(
        'markdownResolver',
        'resolveDocLinkPath',
        'resolveRelativeHref',
        'CURRENT_DOC_PATH',
        `return function (linkContext) {${body}\n};`
    )(
        null,
        function () { return ''; },
        function (href) { return href; },
        '如何贡献/教学文章写作指南.md'
    );
}

function createUpdateNavigationButtons(documentMock) {
    const source = readViewerHtml();
    return extractNamedFunction(source, 'updateNavigationButtons', {
        document: documentMock,
        console: { warn() {}, log() {} },
        ALL_DOCS: [],
        resolveDocLinkPath: function () { return null; },
        resolveRelativeHref: function () { return null; },
        CURRENT_DOC_PATH: '',
        getFolderOfPath: function (docPath) {
            const parts = String(docPath || '')
                .replace(/\\/g, '/')
                .replace(/^\.\//, '')
                .replace(/^\/+/, '')
                .split('/')
                .filter(Boolean);
            if (parts.length <= 1) return '';
            return parts.slice(0, -1).join('/');
        }
    });
}

function createElement(tagName) {
    return {
        tagName,
        children: [],
        className: '',
        textContent: '',
        href: '',
        innerHTML: '',
        appendChild(node) {
            this.children.push(node);
            return node;
        }
    };
}

function createDocumentMock() {
    const navigationContainer = createElement('div');
    navigationContainer.className = 'tutorial-navigation';

    return {
        navigationContainer,
        querySelector(selector) {
            return selector === '.tutorial-navigation' ? navigationContainer : null;
        },
        createElement,
        createTextNode(text) {
            return { nodeType: 3, textContent: text };
        }
    };
}

test('viewer runtime docs navigation always routes to folder.html', () => {
    const viewer = readViewerHtml();

    assert.match(viewer, /docsLink\.href = 'folder\.html';/);
    assert.doesNotMatch(viewer, /docsLink\.href = 'index\.html';/);
    assert.match(viewer, /backToListBtn\.href = currentFolder \? `folder\.html\?path=\$\{encodeURIComponent\(currentFolder\)\}` : 'folder\.html';/);
    assert.doesNotMatch(viewer, /backToListBtn\.href = 'index\.html';/);
});

test('viewer back-to-list button preserves current folder path for nested docs', () => {
    const documentMock = createDocumentMock();
    const updateNavigationButtons = createUpdateNavigationButtons(documentMock);

    updateNavigationButtons(null, null, 'Modder入门/基础/第一章.md');

    assert.equal(documentMock.navigationContainer.children[0].href, 'folder.html?path=Modder%E5%85%A5%E9%97%A8%2F%E5%9F%BA%E7%A1%80');
});

test('viewer back-to-list button falls back to root folder page for top-level docs', () => {
    const documentMock = createDocumentMock();
    const updateNavigationButtons = createUpdateNavigationButtons(documentMock);

    updateNavigationButtons(null, null, 'README.md');

    assert.equal(documentMock.navigationContainer.children[0].href, 'folder.html');
});

test('viewer rewrites legacy absolute docs viewer links to current viewer route', () => {
    const resolveLinkHref = createResolveLinkHref();
    const legacyHref = 'https://dpapyru.github.io/docs/viewer.html?file=%E5%A6%82%E4%BD%95%E8%B4%A1%E7%8C%AE/%E6%95%99%E5%AD%A6%E6%96%87%E7%AB%A0%E5%86%99%E4%BD%9C%E6%8C%87%E5%8D%97.md#section';

    assert.equal(
        resolveLinkHref({ href: legacyHref }),
        'viewer.html?file=%E5%A6%82%E4%BD%95%E8%B4%A1%E7%8C%AE%2F%E6%95%99%E5%AD%A6%E6%96%87%E7%AB%A0%E5%86%99%E4%BD%9C%E6%8C%87%E5%8D%97.md#section'
    );
});

test('viewer keeps ordinary external links untouched', () => {
    const resolveLinkHref = createResolveLinkHref();
    const externalHref = 'https://example.com/docs/viewer.html?file=abc.md';

    assert.equal(resolveLinkHref({ href: externalHref }), externalHref);
});
