import test from 'node:test';
import assert from 'node:assert/strict';

import { collectMarkdownWorkspaceSnapshot } from '../src/workspaces/markdown/collect.js';
import { collectShaderWorkspaceSnapshot } from '../src/workspaces/shader/collect.js';

function installStorage(map) {
    const store = new Map(Object.entries(map || {}));
    return {
        getItem(key) {
            return store.has(key) ? store.get(key) : null;
        },
        setItem(key, value) {
            store.set(key, String(value || ''));
        },
        removeItem(key) {
            store.delete(key);
        }
    };
}

function installDom(values) {
    return {
        getElementById(id) {
            if (!Object.prototype.hasOwnProperty.call(values, id)) return null;
            return { value: values[id] };
        }
    };
}

test('markdown collector exports main markdown and uploaded assets', () => {
    const backup = {
        document: globalThis.document,
        localStorage: globalThis.localStorage,
        sessionStorage: globalThis.sessionStorage
    };

    globalThis.document = installDom({
        'studio-target-path': '怎么贡献/综合IDE-验收.md',
        'studio-markdown': '# demo markdown',
        'studio-pr-worker-url': 'https://example.com/api/create-pr',
        'studio-pr-title': 'docs: markdown collect'
    });
    globalThis.localStorage = installStorage({
        'articleStudioMarkdown.v9': JSON.stringify({
            uploadedImages: [
                {
                    assetPath: '怎么贡献/imgs/demo.png',
                    base64: 'AAA='
                }
            ],
            uploadedCsharpFiles: [
                {
                    assetPath: '怎么贡献/code/Demo.cs',
                    content: 'public class Demo {}'
                }
            ]
        })
    });
    globalThis.sessionStorage = installStorage({
        'articleStudioOAuthToken.v1': 'token-demo',
        'articleStudioOAuthUser.v1': 'demo-user'
    });

    const snapshot = collectMarkdownWorkspaceSnapshot();

    assert.equal(snapshot.workspace, 'markdown');
    assert.equal(snapshot.targetPath, 'site/content/怎么贡献/综合IDE-验收.md');
    assert.equal(snapshot.markdown, '# demo markdown');
    assert.equal(snapshot.files.length, 3);
    assert.equal(snapshot.files[0].isMainMarkdown, true);
    assert.equal(snapshot.files[1].encoding, 'base64');
    assert.equal(snapshot.files[2].encoding, 'utf8');
    assert.equal(snapshot.authToken, 'token-demo');
    assert.equal(snapshot.githubUser, 'demo-user');

    globalThis.document = backup.document;
    globalThis.localStorage = backup.localStorage;
    globalThis.sessionStorage = backup.sessionStorage;
});

test('shader collector exports parsed template payload and auth context', () => {
    const backup = {
        document: globalThis.document,
        window: globalThis.window,
        sessionStorage: globalThis.sessionStorage
    };

    globalThis.document = installDom({
        'shader-contribute-template': '# shader markdown template',
        'shader-contribute-pr-worker-url': 'https://example.com/api/create-pr',
        'shader-contribute-pr-title': 'shader: collect'
    });
    globalThis.window = {
        ShaderContribute: {
            parseContributionTemplate(template) {
                return { template };
            },
            buildContributionPayload() {
                return {
                    targetPath: 'shader-gallery/demo/README.md',
                    markdown: '# shader readme',
                    extraFiles: [
                        {
                            path: 'site/content/shader-gallery/demo/entry.json',
                            content: '{"slug":"demo"}',
                            encoding: 'utf8'
                        }
                    ]
                };
            }
        }
    };
    globalThis.sessionStorage = installStorage({
        'articleStudioOAuthToken.v1': 'shader-token',
        'articleStudioOAuthUser.v1': 'shader-user'
    });

    const snapshot = collectShaderWorkspaceSnapshot();

    assert.equal(snapshot.workspace, 'shader');
    assert.equal(snapshot.targetPath, 'site/content/shader-gallery/demo/README.md');
    assert.equal(snapshot.markdown, '# shader readme');
    assert.equal(snapshot.files.length, 2);
    assert.equal(snapshot.files[0].isMainMarkdown, true);
    assert.equal(snapshot.files[1].path, 'site/content/shader-gallery/demo/entry.json');
    assert.equal(snapshot.authToken, 'shader-token');
    assert.equal(snapshot.githubUser, 'shader-user');
    assert.deepEqual(snapshot.warnings, []);

    globalThis.document = backup.document;
    globalThis.window = backup.window;
    globalThis.sessionStorage = backup.sessionStorage;
});

