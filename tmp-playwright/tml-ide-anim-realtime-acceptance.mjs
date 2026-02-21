import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.TML_IDE_URL || 'http://127.0.0.1:4173/tml-ide/subapps/markdown/index.html';
const outDir = path.resolve('test-results/tml-ide-anim-realtime-acceptance');

const storageKeys = {
    studio: 'articleStudioMarkdown.v9',
    preview: 'articleStudioViewerPreview.v1',
    bridgeEndpoint: 'articleStudioAnimBridgeEndpoint.v1'
};

async function ensureDir(dir) {
    await fs.mkdir(dir, { recursive: true });
}

async function resolveChromium() {
    try {
        const playwright = await import('playwright');
        if (playwright && playwright.chromium) return playwright.chromium;
    } catch (_err) {
    }

    try {
        const playwrightCore = await import('playwright-core');
        if (playwrightCore && playwrightCore.chromium) return playwrightCore.chromium;
    } catch (_err) {
    }

    throw new Error('Missing playwright runtime: install playwright or playwright-core.');
}

async function waitForStudioReady(page, url) {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#studio-markdown', { timeout: 30000 });
    await page.waitForSelector('#studio-preview-frame', { timeout: 30000, state: 'attached' });
    await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: 30000 });
}

function buildMockModuleJs(sourceText) {
    const mode = sourceText.includes('REALTIME_MARKER_B') ? 'updated' : 'base';
    const color = mode === 'updated' ? 'new Color(72, 54, 160)' : 'new Color(8, 12, 16)';

    return [
        '// mocked by playwright acceptance',
        `// mode:${mode}`,
        'export function create(runtime) {',
        '    const { Color } = runtime;',
        '    return {',
        '        OnRender(g) {',
        `            g.Clear(${color});`,
        '        }',
        '    };',
        '}'
    ].join('\n');
}

async function readPreviewPayload(page) {
    return page.evaluate((keys) => {
        const raw = localStorage.getItem(keys.preview);
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch (_err) {
            return null;
        }
    }, storageKeys);
}

async function main() {
    await ensureDir(outDir);

    const chromium = await resolveChromium();
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    const page = await context.newPage();

    const compileRequests = [];
    const mockAnimSource = [
        'using AnimCS.Runtime;',
        '',
        'public class DemoBasic : AnimScript',
        '{',
        '    public override void OnRender(Graphics2D g)',
        '    {',
        '        g.Clear(new Color(8, 12, 16));',
        '    }',
        '}',
        ''
    ].join('\n');

    await context.route('**/health', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ ok: true, version: 'playwright-mock-1.0.0' })
        });
    });

    await context.route('**/api/animcs/compile', async (route) => {
        const postData = route.request().postData() || '{}';
        let body = {};
        try {
            body = JSON.parse(postData);
        } catch (_err) {
            body = {};
        }

        const sourcePath = String(body.sourcePath || '');
        const sourceText = String(body.sourceText || '');
        const requestId = String(body.requestId || '');
        const isError = sourceText.includes('FORCE_ERROR');
        const diagnostics = isError ? ['Mock compile error: unexpected token near FORCE_ERROR'] : [];

        const response = isError
            ? {
                ok: false,
                diagnostics,
                elapsedMs: 23
            }
            : {
                ok: true,
                moduleJs: buildMockModuleJs(sourceText),
                profile: {
                    controls: 'orbit',
                    heightScale: 1,
                    modeOptions: [{ value: 0, text: 'Default' }]
                },
                diagnostics: [],
                elapsedMs: 18
            };

        compileRequests.push({
            sourcePath,
            requestId,
            isError,
            sourceLength: sourceText.length,
            mode: sourceText.includes('REALTIME_MARKER_B') ? 'updated' : 'base',
            diagnostics
        });

        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(response)
        });
    });

    await context.route('**/site/content/anims/demo-basic.cs', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'text/plain; charset=utf-8',
            body: mockAnimSource
        });
    });

    await waitForStudioReady(page, baseUrl);

    await page.evaluate((keys) => {
        localStorage.removeItem(keys.studio);
        localStorage.removeItem(keys.preview);
        localStorage.removeItem(keys.bridgeEndpoint);
    }, storageKeys);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#studio-markdown', { timeout: 30000 });

    const markdown = [
        '---',
        'title: Anim Realtime Acceptance',
        '---',
        '',
        '# Realtime Anim Preview',
        '',
        '{{anim:anims/demo-basic.cs}}',
        '',
        '```animcs',
        'anims/demo-basic.cs',
        '```',
        ''
    ].join('\n');

    await page.fill('#studio-markdown', markdown);
    await page.waitForTimeout(300);
    await page.waitForSelector('[data-tree-path="anims/demo-basic.cs"]', { timeout: 15000 });
    await page.click('[data-tree-path="anims/demo-basic.cs"]', { button: 'right' });
    await page.waitForFunction(() => {
        const menu = document.querySelector('#studio-explorer-context-menu');
        return !!menu && menu.hidden === false;
    }, null, { timeout: 10000 });
    await page.click('#studio-explorer-context-menu [data-context-action="preview-resource"]:not([hidden])');

    await page.waitForSelector('#studio-csharp-editor-modal.active', { timeout: 15000 });
    await page.waitForFunction(() => {
        const node = document.querySelector('#studio-anim-compile-status');
        return !!(node && String(node.textContent || '').includes('编译成功 anims/demo-basic.cs'));
    }, null, { timeout: 15000 });

    await page.waitForFunction((keys) => {
        const raw = localStorage.getItem(keys.preview);
        if (!raw) return false;
        let payload = null;
        try {
            payload = JSON.parse(raw);
        } catch (_err) {
            return false;
        }
        return Boolean(payload
            && payload.compiledAnims
            && payload.compiledAnims['anims/demo-basic.cs']
            && payload.compiledAnims['anims/demo-basic.cs'].moduleJs);
    }, storageKeys, { timeout: 15000 });

    const payloadAfterSuccess = await readPreviewPayload(page);
    await page.screenshot({ path: path.join(outDir, '01-compile-success-preview.png'), fullPage: true });

    const editorSelector = '#studio-csharp-editor-text';
    const baseText = await page.locator(editorSelector).inputValue();

    await page.fill(editorSelector, `${baseText}\n// REALTIME_MARKER_B`);
    await page.waitForFunction(() => {
        const node = document.querySelector('#studio-anim-compile-status');
        return !!(node && String(node.textContent || '').includes('编译成功 anims/demo-basic.cs'));
    }, null, { timeout: 15000 });

    await page.waitForFunction((keys) => {
        const raw = localStorage.getItem(keys.preview);
        if (!raw) return false;
        let payload = null;
        try {
            payload = JSON.parse(raw);
        } catch (_err) {
            return false;
        }
        const entry = payload && payload.compiledAnims ? payload.compiledAnims['anims/demo-basic.cs'] : null;
        return !!(entry && typeof entry.moduleJs === 'string' && entry.moduleJs.includes('mode:updated'));
    }, storageKeys, { timeout: 15000 });

    const payloadAfterRealtimeUpdate = await readPreviewPayload(page);
    await page.screenshot({ path: path.join(outDir, '02-realtime-refresh-after-edit.png'), fullPage: true });

    await page.fill(editorSelector, `${baseText}\n// FORCE_ERROR`);
    await page.waitForFunction(() => {
        const node = document.querySelector('#studio-anim-compile-status');
        return !!(node && String(node.textContent || '').includes('编译失败 anims/demo-basic.cs'));
    }, null, { timeout: 15000 });

    await page.waitForFunction((keys) => {
        const raw = localStorage.getItem(keys.preview);
        if (!raw) return false;
        let payload = null;
        try {
            payload = JSON.parse(raw);
        } catch (_err) {
            return false;
        }
        const hasError = payload
            && payload.animCompileErrors
            && payload.animCompileErrors['anims/demo-basic.cs']
            && Array.isArray(payload.animCompileErrors['anims/demo-basic.cs'].diagnostics)
            && payload.animCompileErrors['anims/demo-basic.cs'].diagnostics.length > 0;
        const hasCompiled = payload
            && payload.compiledAnims
            && payload.compiledAnims['anims/demo-basic.cs'];
        return Boolean(hasError && !hasCompiled);
    }, storageKeys, { timeout: 15000 });

    const payloadAfterError = await readPreviewPayload(page);
    await page.screenshot({ path: path.join(outDir, '03-compile-error-blocked-preview.png'), fullPage: true });

    await page.fill(editorSelector, `${baseText}\n// RECOVER_OK`);
    await page.waitForFunction(() => {
        const node = document.querySelector('#studio-anim-compile-status');
        return !!(node && String(node.textContent || '').includes('编译成功 anims/demo-basic.cs'));
    }, null, { timeout: 15000 });

    await page.waitForFunction((keys) => {
        const raw = localStorage.getItem(keys.preview);
        if (!raw) return false;
        let payload = null;
        try {
            payload = JSON.parse(raw);
        } catch (_err) {
            return false;
        }
        const compiledEntry = payload && payload.compiledAnims ? payload.compiledAnims['anims/demo-basic.cs'] : null;
        const compileError = payload && payload.animCompileErrors ? payload.animCompileErrors['anims/demo-basic.cs'] : null;
        return Boolean(compiledEntry && compiledEntry.moduleJs && !compileError);
    }, storageKeys, { timeout: 15000 });

    const payloadAfterRecovery = await readPreviewPayload(page);
    await page.screenshot({ path: path.join(outDir, '04-recovered-replay.png'), fullPage: true });

    const report = {
        baseUrl,
        compileRequestCount: compileRequests.length,
        compileRequests,
        statusTimeline: {
            success: await page.textContent('#studio-anim-compile-status')
        },
        payloadSnapshots: {
            success: payloadAfterSuccess,
            realtimeUpdate: payloadAfterRealtimeUpdate,
            error: payloadAfterError,
            recovery: payloadAfterRecovery
        },
        generatedAt: new Date().toISOString()
    };

    await fs.writeFile(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
    await browser.close();
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
