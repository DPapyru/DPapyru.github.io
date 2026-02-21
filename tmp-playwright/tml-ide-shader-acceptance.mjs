import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.TML_IDE_URL || 'http://127.0.0.1:4173/tml-ide/?workspace=shader&panel=submit';
const outDir = path.resolve('test-results/tml-ide-shader-acceptance');

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

async function waitForIdeReady(page, url) {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => {
        return Boolean(globalThis.__tmlIdeDebug && typeof globalThis.__tmlIdeDebug.isReady === 'function' && globalThis.__tmlIdeDebug.isReady());
    }, null, { timeout: 30000 });
}

function makeShaderExtraFiles() {
    const files = [
        {
            path: 'site/content/shader-gallery/acceptance-shader/entry.json',
            content: '{"slug":"acceptance-shader"}',
            encoding: 'utf8',
            source: 'shader-extra'
        },
        {
            path: 'site/content/shader-gallery/acceptance-shader/shader.json',
            content: '{"name":"acceptance"}',
            encoding: 'utf8',
            source: 'shader-extra'
        }
    ];

    for (let i = 1; i <= 8; i += 1) {
        files.push({
            path: `site/content/怎么贡献/code/acceptance_${i}.cs`,
            content: `// test ${i}\npublic class Acceptance${i} { }`,
            encoding: 'utf8',
            source: 'shader-extra'
        });
    }

    files.push({
        path: 'site/assets/imgs/blocked-asset.png',
        content: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB',
        encoding: 'base64',
        source: 'shader-asset'
    });

    return files;
}

async function main() {
    await ensureDir(outDir);

    const chromium = await resolveChromium();
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    const page = await context.newPage();

    const interceptedPayloads = [];
    let requestCount = 0;

    await context.route('**/api/create-pr', async (route) => {
        requestCount += 1;
        const postData = route.request().postData() || '{}';
        let payload = {};
        try {
            payload = JSON.parse(postData);
        } catch (_err) {
            payload = {};
        }
        interceptedPayloads.push(payload);

        if (requestCount === 1) {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ ok: true, prNumber: 1999, prUrl: 'https://example.com/pr/1999' })
            });
            return;
        }

        if (requestCount === 2) {
            await route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ ok: false, error: 'mock failure on batch 2' })
            });
            return;
        }

        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ ok: true, prNumber: 1999, prUrl: 'https://example.com/pr/1999', reusedExistingPr: true })
        });
    });

    await waitForIdeReady(page, baseUrl);

    const routeState = await page.evaluate(() => globalThis.__tmlIdeDebug.getRoute());
    if (routeState.workspace !== 'shader' || routeState.panel !== 'submit') {
        throw new Error(`Shader route mismatch: ${JSON.stringify(routeState)}`);
    }

    await page.evaluate((files) => {
        sessionStorage.setItem('articleStudioOAuthToken.v1', 'mock-token');
        sessionStorage.setItem('articleStudioOAuthUser.v1', 'mock-user');

        globalThis.__tmlIdeDebug.setSubappSnapshot('shader', {
            workspace: 'shader',
            targetPath: 'site/content/shader-gallery/acceptance-shader/README.md',
            markdown: '# Acceptance Shader\n\nfrom playwright',
            files
        });
    }, makeShaderExtraFiles());

    await page.fill('#unified-worker-url', 'http://127.0.0.1:4173/api/create-pr');
    await page.waitForTimeout(120);

    const collectSnapshot = await page.evaluate(async () => {
        await globalThis.__tmlIdeDebug.collectUnified({ requestSubapp: false });
        return globalThis.__tmlIdeDebug.getUnifiedSnapshot();
    });

    if (collectSnapshot.extra < 8) {
        throw new Error(`Expected many extra files for batching, got ${collectSnapshot.extra}`);
    }
    if (collectSnapshot.blocked < 1) {
        throw new Error('Expected blocked site/assets file in collection.');
    }

    const firstSubmit = await page.evaluate(async () => {
        try {
            const snapshot = await globalThis.__tmlIdeDebug.submitUnified({ requestSubapp: false });
            return { ok: true, snapshot };
        } catch (error) {
            return {
                ok: false,
                message: String(error && error.message ? error.message : error),
                snapshot: globalThis.__tmlIdeDebug.getUnifiedSnapshot()
            };
        }
    });
    if (firstSubmit.ok) {
        throw new Error('Expected first unified submit to fail on mocked second batch.');
    }

    const failedState = firstSubmit.snapshot;
    if (!failedState.resume || Number(failedState.resume.nextIndex) < 1) {
        throw new Error(`Resume state missing after forced failure: ${JSON.stringify(failedState)}`);
    }

    const resumeResult = await page.evaluate(async () => {
        try {
            const snapshot = await globalThis.__tmlIdeDebug.resumeUnified();
            return { ok: true, snapshot };
        } catch (error) {
            return {
                ok: false,
                message: String(error && error.message ? error.message : error)
            };
        }
    });
    if (!resumeResult.ok) {
        throw new Error(`Resume failed: ${resumeResult.message}`);
    }

    if (interceptedPayloads.length < 3) {
        throw new Error(`Expected at least 3 create-pr requests, got ${interceptedPayloads.length}`);
    }
    if (!Array.isArray(interceptedPayloads[0].extraFiles) || interceptedPayloads[0].extraFiles.length > 8) {
        throw new Error('First batch extraFiles size violates <=8 rule.');
    }
    if (String(interceptedPayloads[1].existingPrNumber || '') !== '1999') {
        throw new Error(`Second batch should continue existing PR, got ${JSON.stringify(interceptedPayloads[1])}`);
    }
    if (String(interceptedPayloads[2].existingPrNumber || '') !== '1999') {
        throw new Error(`Resume batch should continue existing PR, got ${JSON.stringify(interceptedPayloads[2])}`);
    }

    await page.screenshot({ path: path.join(outDir, '01-shader-submit-resume.png'), fullPage: true });

    const legacyPlayground = await context.newPage();
    await legacyPlayground.goto('http://127.0.0.1:4173/site/pages/shader-playground.html', { waitUntil: 'domcontentloaded' });
    await legacyPlayground.waitForURL('**/tml-ide/**', { timeout: 10000 });
    const shaderRedirect = legacyPlayground.url();
    if (!shaderRedirect.includes('workspace=shader')) {
        throw new Error(`Legacy shader-playground redirect mismatch: ${shaderRedirect}`);
    }

    const legacyContribute = await context.newPage();
    await legacyContribute.goto('http://127.0.0.1:4173/site/pages/shader-contribute.html', { waitUntil: 'domcontentloaded' });
    await legacyContribute.waitForURL('**/tml-ide/**', { timeout: 10000 });
    const contributeRedirect = legacyContribute.url();
    if (!contributeRedirect.includes('workspace=shader') || !contributeRedirect.includes('panel=submit')) {
        throw new Error(`Legacy shader-contribute redirect mismatch: ${contributeRedirect}`);
    }

    await legacyContribute.screenshot({ path: path.join(outDir, '02-legacy-shader-redirects.png'), fullPage: true });

    const report = {
        baseUrl,
        routeState,
        collectSnapshot,
        requestCount,
        interceptedPayloads,
        shaderRedirect,
        contributeRedirect,
        generatedAt: new Date().toISOString()
    };
    await fs.writeFile(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));

    await browser.close();
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
