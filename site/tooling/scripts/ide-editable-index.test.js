const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
    generateIdeEditableIndex,
    runStructure,
    runAll
} = require('../generate-index.js');

function writeFile(root, relativePath, content) {
    const absPath = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(absPath), { recursive: true });
    fs.writeFileSync(absPath, content || '', 'utf8');
}

test('generateIdeEditableIndex outputs whitelist-only files with stable ordering', () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ide-editable-index-'));
    const contentRoot = path.join(tempRoot, 'site/content');
    const outputPath = path.join(tempRoot, 'site/assets/ide-editable-index.v1.json');

    writeFile(contentRoot, 'articles/guide.md', '# guide');
    writeFile(contentRoot, 'anims/demo.cs', 'public sealed class Demo {}');
    writeFile(contentRoot, 'articles/topic/code/Sample.cs', 'public sealed class Sample {}');
    writeFile(contentRoot, 'articles/topic/preview.fx', 'float4 MainPS(...) : SV_TARGET { return 1; }');
    writeFile(contentRoot, 'articles/topic/imgs/a.png', 'png');
    writeFile(contentRoot, 'articles/topic/media/a.mp4', 'mp4');
    writeFile(contentRoot, 'articles/topic/media/clip.mov', 'mov');

    writeFile(contentRoot, 'articles/topic/note.txt', 'skip');
    writeFile(contentRoot, 'anims/nested/skip.cs', 'skip');
    writeFile(contentRoot, 'articles/topic/codes/skip.cs', 'skip');

    generateIdeEditableIndex({
        contentRoot,
        outputPath,
        nowIso: '2026-02-21T00:00:00.000Z'
    });

    const payload = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    assert.equal(payload.schemaVersion, 1);
    assert.equal(payload.root, 'site/content');
    assert.equal(payload.generatedAt, '2026-02-21T00:00:00.000Z');
    assert.ok(Array.isArray(payload.files));

    const paths = payload.files.map((item) => String(item.path || ''));
    assert.deepEqual(paths, [
        'anims/demo.cs',
        'articles/guide.md',
        'articles/topic/code/Sample.cs',
        'articles/topic/imgs/a.png',
        'articles/topic/media/a.mp4',
        'articles/topic/media/clip.mov',
        'articles/topic/preview.fx'
    ]);
    assert.deepEqual(paths, paths.slice().sort());

    const whitelistPattern = /(?:\.md$|\.fx$|^anims\/[^/]+\.cs$|\/code\/[^/]+\.cs$|\/imgs\/[^/]+$|\/media\/[^/]+$)/;
    paths.forEach((entryPath) => {
        assert.match(entryPath, whitelistPattern);
    });
});

test('runStructure invokes ide editable index generator', () => {
    const calls = [];
    runStructure({
        processMainProject() {
            calls.push('process');
            return {};
        },
        generateSitemap() {
            calls.push('sitemap');
        },
        generateIdeEditableIndex() {
            calls.push('ide');
        }
    });

    assert.deepEqual(calls, ['process', 'sitemap', 'ide']);
});

test('runAll invokes ide editable index generator after other outputs', () => {
    const calls = [];
    runAll({
        processMainProject() {
            calls.push('process');
            return {};
        },
        generateSitemap() {
            calls.push('sitemap');
        },
        generateSearchIndex() {
            calls.push('search');
        },
        generateGuidedSemanticIndex() {
            calls.push('guided');
        },
        generateBm25Index() {
            calls.push('bm25');
        },
        generateIdeEditableIndex() {
            calls.push('ide');
        }
    });

    assert.deepEqual(calls, ['process', 'sitemap', 'search', 'guided', 'bm25', 'ide']);
});
