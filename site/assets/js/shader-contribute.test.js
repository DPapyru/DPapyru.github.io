const test = require('node:test');
const assert = require('node:assert/strict');

const {
    normalizeWorkerApiUrl,
    buildWorkerApiCandidates,
    isLikelyWorkerNetworkError,
    normalizeSlug,
    parseContributionTemplate,
    buildContributionPayload
} = require('./shader-contribute');

test('normalizeWorkerApiUrl completes protocol and create-pr path', () => {
    assert.equal(
        normalizeWorkerApiUrl('greenhome-pr.3577415213.workers.dev'),
        'https://greenhome-pr.3577415213.workers.dev/api/create-pr'
    );
    assert.equal(
        normalizeWorkerApiUrl('https://example.workers.dev/api/create-pr'),
        'https://example.workers.dev/api/create-pr'
    );
});

test('buildWorkerApiCandidates adds known mirror and deduplicates', () => {
    assert.deepEqual(
        buildWorkerApiCandidates('greenhome-pr.3577415213.workers.dev'),
        [
            'https://greenhome-pr.3577415213.workers.dev/api/create-pr',
            'https://greenhome-pr-3577415213.workers.dev/api/create-pr'
        ]
    );
    assert.deepEqual(
        buildWorkerApiCandidates('https://greenhome-pr-3577415213.workers.dev/api/create-pr'),
        [
            'https://greenhome-pr-3577415213.workers.dev/api/create-pr',
            'https://greenhome-pr.3577415213.workers.dev/api/create-pr'
        ]
    );
    assert.deepEqual(
        buildWorkerApiCandidates('https://example.com/api/create-pr'),
        [
            'https://example.com/api/create-pr'
        ]
    );
});

test('isLikelyWorkerNetworkError detects fetch-level failures', () => {
    assert.equal(isLikelyWorkerNetworkError(new TypeError('Failed to fetch')), true);
    assert.equal(isLikelyWorkerNetworkError(new Error('Network request failed')), true);
    assert.equal(isLikelyWorkerNetworkError(new Error('Unauthorized')), false);
});

test('normalizeSlug keeps lowercase slug format', () => {
    assert.equal(normalizeSlug('  My Shader 01  '), 'my-shader-01');
    assert.equal(normalizeSlug('___ABC___'), 'abc');
});

test('parseContributionTemplate reads entry/shader/readme blocks', () => {
    const template = [
        '# Shader 投稿模板',
        '',
        '## entry.json',
        '```json',
        '{',
        '  "slug": "my-shader",',
        '  "title": "My Shader",',
        '  "author": "Alice",',
        '  "description": "test",',
        '  "shader": "shader.json",',
        '  "cover": "cover.webp",',
        '  "tags": ["demo"],',
        '  "updated_at": "2026-02-09"',
        '}',
        '```',
        '',
        '## shader.json',
        '```json',
        '{"common":"","passes":[{"name":"Pass 1","type":"image","scale":1,"code":"","channels":[{"kind":"none"},{"kind":"none"},{"kind":"none"},{"kind":"none"}]}]}',
        '```',
        '',
        '## README.md',
        '```markdown',
        '# My Shader',
        '',
        'A small demo.',
        '```'
    ].join('\n');

    const parsed = parseContributionTemplate(template);
    assert.equal(parsed.entry.slug, 'my-shader');
    assert.equal(parsed.entry.title, 'My Shader');
    assert.equal(parsed.shader.passes.length, 1);
    assert.match(parsed.readme, /A small demo\./);
});

test('buildContributionPayload builds worker payload paths', () => {
    const parsed = {
        entry: {
            slug: 'my-shader',
            title: 'My Shader',
            author: 'Alice',
            description: 'desc',
            shader: 'shader.json',
            cover: 'cover.webp',
            tags: ['demo'],
            updated_at: '2026-02-09'
        },
        shader: {
            common: '',
            passes: [{
                name: 'Pass 1',
                type: 'image',
                scale: 1,
                code: '',
                channels: [{ kind: 'none' }, { kind: 'none' }, { kind: 'none' }, { kind: 'none' }]
            }]
        },
        readme: '# My Shader\n\nA small demo.\n'
    };

    const payload = buildContributionPayload(parsed, { prTitle: '' });
    assert.equal(payload.targetPath, 'shader-gallery/my-shader/README.md');
    assert.equal(payload.extraFiles.length, 2);
    assert.equal(payload.extraFiles[0].path, 'site/content/shader-gallery/my-shader/entry.json');
    assert.equal(payload.extraFiles[1].path, 'site/content/shader-gallery/my-shader/shader.json');
    assert.match(payload.prTitle, /my-shader/i);
});

