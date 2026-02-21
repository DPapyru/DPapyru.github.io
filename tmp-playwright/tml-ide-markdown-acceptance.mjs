import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.TML_IDE_URL || 'http://127.0.0.1:4173/tml-ide/?workspace=markdown';
const outDir = path.resolve('test-results/tml-ide-markdown-acceptance');

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
    await page.waitForSelector('#subapp-iframe', { timeout: 30000 });
}

async function main() {
    await ensureDir(outDir);

    const chromium = await resolveChromium();
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    const page = await context.newPage();

    await waitForIdeReady(page, baseUrl);

    const routeState = await page.evaluate(() => globalThis.__tmlIdeDebug.getRoute());
    if (routeState.workspace !== 'markdown') {
        throw new Error(`Expected markdown workspace, got ${routeState.workspace}`);
    }

    await page.evaluate(() => {
        globalThis.__tmlIdeDebug.setSubappSnapshot('markdown', {
            workspace: 'markdown',
            targetPath: 'site/content/怎么贡献/统一IDE验收.md',
            markdown: '# Unified IDE Markdown Acceptance\n\nbody',
            files: [
                {
                    path: 'site/content/怎么贡献/imgs/acceptance.png',
                    content: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB',
                    encoding: 'base64',
                    source: 'markdown-image'
                },
                {
                    path: 'site/assets/js/legacy-only.js',
                    content: 'console.log("legacy");',
                    encoding: 'utf8',
                    source: 'markdown-asset'
                }
            ]
        });
        globalThis.__tmlIdeDebug.setSubappSnapshot('shader', {
            workspace: 'shader',
            targetPath: 'site/content/shader-gallery/acceptance-markdown/README.md',
            markdown: '# Acceptance Anchor',
            files: [
                {
                    path: 'site/assets/js/legacy-only.js',
                    content: 'console.log(\"legacy\");',
                    encoding: 'utf8',
                    source: 'shader-asset'
                }
            ]
        });
    });

    await page.click('#btn-open-unified-submit');
    await page.evaluate(async () => {
        await globalThis.__tmlIdeDebug.collectUnified({ requestSubapp: false });
    });
    await page.waitForTimeout(200);

    const summary = await page.evaluate(() => {
        return {
            text: document.querySelector('#unified-summary')?.textContent || '',
            sendable: document.querySelectorAll('#unified-sendable-list .unified-file-item').length,
            blocked: document.querySelectorAll('#unified-blocked-list .unified-file-item').length,
            blockedText: document.querySelector('#unified-blocked-list')?.textContent || ''
        };
    });

    if (!summary.text.includes('Markdown')) {
        throw new Error(`Summary missing markdown stats: ${summary.text}`);
    }
    if (!summary.blockedText.includes('site/assets/js/legacy-only.js')) {
        throw new Error(`Blocked list missing site/assets item: ${summary.blockedText}`);
    }

    await page.screenshot({ path: path.join(outDir, '01-markdown-unified-submit.png'), fullPage: true });

    const legacyPage = await context.newPage();
    await legacyPage.goto('http://127.0.0.1:4173/site/pages/article-studio.html', { waitUntil: 'domcontentloaded' });
    await legacyPage.waitForURL('**/tml-ide/**', { timeout: 10000 });
    const redirected = legacyPage.url();
    if (!redirected.includes('workspace=markdown')) {
        throw new Error(`Legacy article studio redirect mismatch: ${redirected}`);
    }
    await legacyPage.screenshot({ path: path.join(outDir, '02-legacy-article-redirect.png'), fullPage: true });

    const report = {
        baseUrl,
        routeState,
        summary,
        legacyRedirect: redirected,
        generatedAt: new Date().toISOString()
    };
    await fs.writeFile(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));

    await browser.close();
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
