import fs from 'node:fs/promises';
import path from 'node:path';
import { execSync } from 'node:child_process';

const baseUrl = process.env.TML_IDE_URL || 'http://127.0.0.1:4173/tml-ide/';
const outDir = path.resolve('test-results/tml-ide-full-ui-audit');
const tinyPngBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5xYV0AAAAASUVORK5CYII=',
    'base64'
);

async function resolveChromium() {
    try {
        const playwright = await import('playwright');
        if (playwright && playwright.chromium) return playwright.chromium;
    } catch (_err) {
        // fallback below
    }
    try {
        const playwrightCore = await import('playwright-core');
        if (playwrightCore && playwrightCore.chromium) return playwrightCore.chromium;
    } catch (_err) {
        // fallback below
    }
    throw new Error('Missing playwright runtime: install playwright or playwright-core.');
}

function readLegacyPage(ref) {
    return execSync(`git show main:${ref}`, { encoding: 'utf8' });
}

function verifyLegacyMappings() {
    const legacyArticle = readLegacyPage('site/pages/article-studio.html');
    const legacyShader = readLegacyPage('site/pages/shader-playground.html');
    const mappingChecks = [
        { source: legacyArticle, legacyId: 'studio-open-markdown-guide', unifiedSelector: '#btn-md-open-guide' },
        { source: legacyArticle, legacyId: 'studio-run-draft-check', unifiedSelector: '#btn-md-draft-check' },
        { source: legacyArticle, legacyId: 'studio-insert-template', unifiedSelector: '#btn-md-insert-template' },
        { source: legacyArticle, legacyId: 'studio-insert-image', unifiedSelector: '#btn-md-insert-image' },
        { source: legacyArticle, legacyId: 'studio-format-markdown', unifiedSelector: '#btn-md-format' },
        { source: legacyArticle, legacyId: 'studio-copy-markdown', unifiedSelector: '#btn-md-copy' },
        { source: legacyArticle, legacyId: 'studio-export', unifiedSelector: '#btn-md-export-draft' },
        { source: legacyArticle, legacyId: 'studio-import', unifiedSelector: '#input-md-import-draft' },
        { source: legacyArticle, legacyId: 'studio-reset', unifiedSelector: '#btn-md-reset' },
        { source: legacyArticle, legacyId: 'studio-toggle-fullscreen', unifiedSelector: '#btn-md-focus-mode' },
        { source: legacyArticle, legacyId: 'studio-toggle-direct-preview', unifiedSelector: '#btn-markdown-toggle-preview' },
        { source: legacyArticle, legacyId: 'studio-open-viewer-preview', unifiedSelector: '#btn-markdown-open-viewer' },
        { source: legacyShader, legacyId: 'shaderpg-compile', unifiedSelector: '#btn-shader-compile' },
        { source: legacyShader, legacyId: 'shaderpg-export-fx', unifiedSelector: '#btn-shader-export' },
        { source: legacyShader, legacyId: 'shaderpg-blend-toggle', unifiedSelector: '#shader-render-mode' },
        { source: legacyShader, legacyId: 'shaderpg-address-mode', unifiedSelector: '#shader-address-mode' },
        { source: legacyShader, legacyId: 'shaderpg-bg-mode', unifiedSelector: '#shader-bg-mode' },
        { source: legacyShader, legacyId: 'shaderpg-upload', unifiedSelector: '#shader-upload-0' },
        { source: legacyShader, legacyId: 'shaderpg-canvas', unifiedSelector: '#shader-preview-canvas' },
        { source: legacyShader, legacyId: 'shaderpg-status', unifiedSelector: '#shader-preview-status' },
        { source: legacyShader, legacyId: 'shaderpg-layout-toggle', unifiedSelector: '#btn-shader-preview-popup' },
        { source: legacyShader, legacyId: 'shaderpg-contribute', unifiedSelector: '#btn-open-unified-submit' }
    ];
    mappingChecks.forEach((check) => {
        if (!check.source.includes(`id="${check.legacyId}"`)) {
            throw new Error(`main 分支缺少旧功能锚点: ${check.legacyId}`);
        }
    });
    return mappingChecks;
}

async function waitIdeReady(page) {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => {
        return Boolean(globalThis.__tmlIdeDebug && globalThis.__tmlIdeDebug.isReady && globalThis.__tmlIdeDebug.isReady());
    }, null, { timeout: 30000 });
    await page.waitForSelector('#editor .monaco-editor', { timeout: 30000 });
}

async function clickAndShot(page, selector, shotName, options) {
    const opts = options || {};
    if (!opts.skipEscape) {
        try {
            await page.keyboard.press('Escape');
        } catch (_error) {
            // Ignore escape dispatch failures.
        }
        await page.evaluate(() => {
            const palette = document.querySelector('#command-palette');
            const backdrop = document.querySelector('#command-palette-backdrop');
            if (palette instanceof HTMLElement && !palette.hidden && backdrop instanceof HTMLElement) {
                backdrop.click();
            }
        });
    }
    await page.waitForSelector(selector, { timeout: 10000 });
    try {
        await page.click(selector);
    } catch (_error) {
        await page.click(selector, { force: true });
    }
    await page.waitForTimeout(120);
    await page.screenshot({ path: path.join(outDir, shotName), fullPage: true });
}

async function setInputFile(page, selector, payload) {
    await page.setInputFiles(selector, payload);
    await page.waitForTimeout(150);
}

async function clickInUnifiedPanel(page, selector, shotName) {
    await page.waitForSelector(selector, { timeout: 10000 });
    await page.click(selector, { force: true });
    await page.waitForTimeout(120);
    await page.screenshot({ path: path.join(outDir, shotName), fullPage: true });
}

async function ensureUnifiedPanelOpen(page) {
    await page.evaluate(async () => {
        const panel = document.querySelector('#unified-submit-panel');
        const opened = panel instanceof HTMLElement && panel.getAttribute('aria-hidden') === 'false';
        if (opened) return;
        if (globalThis.__tmlIdeDebug && typeof globalThis.__tmlIdeDebug.switchWorkspace === 'function') {
            await globalThis.__tmlIdeDebug.switchWorkspace('csharp', 'submit');
            return;
        }
        const btn = document.querySelector('#btn-open-unified-submit');
        if (btn instanceof HTMLElement) {
            btn.click();
        }
    });
    const opened = await page.waitForFunction(() => {
        const panel = document.querySelector('#unified-submit-panel');
        return !!(panel instanceof HTMLElement && panel.getAttribute('aria-hidden') === 'false');
    }, null, { timeout: 2500 }).then(() => true).catch(() => false);
    if (opened) return;
    await page.evaluate(() => {
        const panel = document.querySelector('#unified-submit-panel');
        if (!(panel instanceof HTMLElement)) return;
        panel.setAttribute('aria-hidden', 'false');
        panel.classList.add('unified-submit-panel-open');
    });
    await page.waitForSelector('#btn-unified-auth-logout', { state: 'attached', timeout: 10000 });
}

async function main() {
    await fs.mkdir(outDir, { recursive: true });
    const mappingChecks = verifyLegacyMappings();
    const chromium = await resolveChromium();
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1780, height: 1060 } });
    const promptQueue = [];

    await context.route('http://127.0.0.1:4173/mock-api/create-pr', (route) => {
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                ok: true,
                prNumber: 1234,
                submitter: 'ui-audit-bot'
            })
        });
    });

    await context.addInitScript(() => {
        globalThis.__tmlIdeOpenLog = [];
        globalThis.open = function (url) {
            globalThis.__tmlIdeOpenLog.push(String(url || ''));
            return null;
        };
    });

    const page = await context.newPage();
    page.on('dialog', async (dialog) => {
        if (dialog.type() === 'prompt') {
            const next = promptQueue.length ? String(promptQueue.shift()) : '';
            await dialog.accept(next);
            return;
        }
        await dialog.accept();
    });

    const promptClick = async (selector, value) => {
        promptQueue.push(value);
        await page.click(selector);
        await page.waitForTimeout(120);
    };

    await waitIdeReady(page);
    await page.screenshot({ path: path.join(outDir, '01-ready.png'), fullPage: true });

    for (const check of mappingChecks) {
        await page.waitForSelector(check.unifiedSelector, { state: 'attached', timeout: 10000 });
    }
    await page.screenshot({ path: path.join(outDir, '02-mapping-presence.png'), fullPage: true });

    const activitySelectors = [
        '[data-activity="explorer"]',
        '[data-activity="search"]',
        '[data-activity="scm"]',
        '[data-activity="run"]',
        '[data-activity="extensions"]',
        '[data-activity="account"]',
        '[data-activity="settings"]'
    ];
    for (let i = 0; i < activitySelectors.length; i += 1) {
        await clickAndShot(page, activitySelectors[i], `03-activity-${i + 1}.png`);
    }

    const panelTabSelectors = [
        'button[data-panel-tab="problems"]',
        'button[data-panel-tab="output"]',
        'button[data-panel-tab="compile"]',
        'button[data-panel-tab="errors"]'
    ];
    for (let i = 0; i < panelTabSelectors.length; i += 1) {
        await clickAndShot(page, panelTabSelectors[i], `04-panel-tab-${i + 1}.png`);
    }
    const panelToggleVisible = await page.evaluate(() => {
        const node = document.querySelector('#btn-toggle-bottom-panel');
        return !!(node && node instanceof HTMLElement && node.offsetParent !== null);
    });
    if (!panelToggleVisible) {
        await page.keyboard.press('Control+KeyJ');
        await page.waitForTimeout(150);
    }
    await clickAndShot(page, '#btn-toggle-bottom-panel', '05-panel-collapse-a.png');
    await page.keyboard.press('Control+KeyJ');
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(outDir, '06-panel-collapse-b.png'), fullPage: true });

    await promptClick('#btn-add-file', 'audit.md');
    await promptClick('#btn-add-file', 'audit.fx');
    await promptClick('#btn-add-file', 'anims/swing.animcs');
    await promptClick('#btn-add-file', 'assets/clip.mp4');
    await promptClick('#btn-add-file', 'temp.cs');
    await page.screenshot({ path: path.join(outDir, '07-files-added.png'), fullPage: true });

    await page.click('#file-list .file-item:has-text("temp.cs")');
    await promptClick('#btn-rename-file', 'temp-renamed.cs');
    await page.click('#file-list .file-item:has-text("temp-renamed.cs")');
    await clickAndShot(page, '#btn-delete-file', '08-rename-delete.png');

    await clickAndShot(page, '#btn-run-diagnostics', '09-run-diagnostics.png');
    await clickAndShot(page, '#btn-save-workspace', '10-save-workspace.png');
    await clickAndShot(page, '#btn-export-workspace', '11-export-workspace.png');

    const workspacePayload = {
        schemaVersion: 1,
        activeFileId: 'file-anim',
        files: [
            { id: 'file-main', path: 'Program.cs', content: 'using Terraria;\npublic class Program { }\n' },
            { id: 'file-md', path: 'audit.md', content: '# Audit\n\n初始化内容' },
            { id: 'file-shader', path: 'audit.fx', content: '' },
            { id: 'file-anim', path: 'anims/swing.animcs', content: 'using Terraria;\npublic class Anim { }\n' },
            { id: 'file-video', path: 'assets/clip.mp4', content: 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAAAAGlzb20=' }
        ]
    };
    await setInputFile(page, '#input-import-workspace', {
        name: 'workspace-import.json',
        mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify(workspacePayload, null, 2), 'utf8')
    });
    await page.waitForSelector('#file-list .file-item:has-text("audit.md")', { timeout: 10000 });
    await page.screenshot({ path: path.join(outDir, '12-import-workspace.png'), fullPage: true });

    await page.click('#file-list .file-item:has-text("anims/swing.animcs")');
    await page.evaluate(() => {
        globalThis.__tmlIdeDebug.setEditorText([
            'using AnimRuntime;',
            'using AnimRuntime.Math;',
            '',
            'public class DemoAnim',
            '{',
            '    public void Tick(ICanvas2D g, AnimContext ctx)',
            '    {',
            '        AnimGeom.',
            '    }',
            '}'
        ].join('\n'));
        globalThis.__tmlIdeDebug.setCursorAfterText('AnimGeom.');
    });
    await page.waitForFunction(() => {
        const node = document.querySelector('#status-language');
        return !!(node && String(node.textContent || '').includes('C# (动画)'));
    }, null, { timeout: 10000 });
    const completionLabels = await page.evaluate(async () => {
        const items = await globalThis.__tmlIdeDebug.requestCompletionsAtCursor(200);
        return Array.isArray(items) ? items.map((item) => String(item.label || '')) : [];
    });
    if (!completionLabels.includes('DrawAxes')) {
        throw new Error(`动画 C# 补全未命中 DrawAxes，前 30 项: ${JSON.stringify(completionLabels.slice(0, 30))}`);
    }
    if (completionLabels.includes('AddBuff')) {
        throw new Error(`动画 C# 补全不应出现 AddBuff，前 30 项: ${JSON.stringify(completionLabels.slice(0, 30))}`);
    }
    await page.screenshot({ path: path.join(outDir, '13-animation-completion.png'), fullPage: true });

    await page.click('#file-list .file-item:has-text("audit.md")');
    await page.evaluate(() => {
        globalThis.__tmlIdeDebug.setEditorText('# Audit Markdown\n\n按钮验收中。');
    });
    await clickAndShot(page, '#btn-markdown-toggle-preview', '14-markdown-preview-open.png');
    await clickAndShot(page, '#btn-markdown-open-viewer', '15-markdown-open-viewer.png');
    await clickAndShot(page, '#btn-markdown-toggle-preview', '16-markdown-preview-close.png');

    await page.click('button[data-panel-tab="compile"]');
    await page.waitForSelector('#markdown-toolbox-group:not([hidden])', { timeout: 10000 });
    await clickAndShot(page, '#btn-md-open-guide', '17-md-open-guide.png');
    await clickAndShot(page, '#btn-md-draft-check', '18-md-draft-check.png');
    await clickAndShot(page, '#btn-md-insert-template', '19-md-insert-template.png');
    promptQueue.push('./images/audit.png');
    promptQueue.push('审计图');
    await clickAndShot(page, '#btn-md-insert-image', '20-md-insert-image.png');
    await clickAndShot(page, '#btn-md-format', '21-md-format.png');
    await clickAndShot(page, '#btn-md-copy', '22-md-copy.png');
    await clickAndShot(page, '#btn-md-export-draft', '23-md-export-draft.png');
    await setInputFile(page, '#input-md-import-draft', {
        name: 'markdown-draft.json',
        mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify({
            targetPath: 'audit.md',
            markdown: '# Imported Draft\n\nfrom ui-audit'
        }, null, 2), 'utf8')
    });
    await page.screenshot({ path: path.join(outDir, '24-md-import-draft.png'), fullPage: true });
    await clickAndShot(page, '#btn-md-focus-mode', '25-md-focus-on.png');
    await clickAndShot(page, '#btn-md-focus-mode', '26-md-focus-off.png');

    const markdownInsertSelectors = [
        '[data-md-insert="bold"]',
        '[data-md-insert="h2"]',
        '[data-md-insert="list"]',
        '[data-md-insert="quote"]',
        '[data-md-insert="ref"]',
        '[data-md-insert="anim"]',
        '[data-md-insert="animcs-block"]',
        '[data-md-insert="color-inline"]',
        '[data-md-insert="color-change-inline"]',
        '[data-md-insert="quiz-tf"]',
        '[data-md-insert="quiz-choice"]',
        '[data-md-insert="quiz-multi"]'
    ];
    await page.click('#editor .monaco-editor');
    for (let i = 0; i < markdownInsertSelectors.length; i += 1) {
        await clickAndShot(page, markdownInsertSelectors[i], `27-md-insert-${i + 1}.png`);
    }

    await page.click('#editor .monaco-editor');
    await page.evaluate(() => {
        const binary = globalThis.atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5xYV0AAAAASUVORK5CYII=');
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) {
            bytes[i] = binary.charCodeAt(i);
        }
        const file = new File([bytes], 'audit-paste.png', { type: 'image/png' });
        const clipboardData = new DataTransfer();
        clipboardData.items.add(file);
        let event = null;
        try {
            event = new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true });
        } catch (_err) {
            event = new Event('paste', { bubbles: true, cancelable: true });
            Object.defineProperty(event, 'clipboardData', { value: clipboardData });
        }
        const target = document.activeElement || document.querySelector('#editor .monaco-editor');
        target.dispatchEvent(event);
    });
    await page.waitForSelector('#file-list .file-item:has-text("images/")', { timeout: 10000 });
    await page.screenshot({ path: path.join(outDir, '28-md-paste-image.png'), fullPage: true });
    await clickAndShot(page, '#btn-md-reset', '29-md-reset.png');

    await page.click('#file-list .file-item:has-text("audit.fx")');
    await clickAndShot(page, 'button[data-panel-tab="compile"]', '30-shader-compile-tab.png');
    await clickAndShot(page, '#btn-shader-insert-template', '30-shader-insert-template.png');
    await clickAndShot(page, '#btn-shader-compile', '31-shader-header-compile.png');
    await clickAndShot(page, '#btn-panel-shader-compile', '32-shader-panel-compile.png');
    await clickAndShot(page, '#btn-shader-export', '33-shader-export.png');
    await clickAndShot(page, '#btn-shader-preview-popup', '34-shader-popup-open.png');
    await page.waitForSelector('#shader-preview-modal:not([hidden])', { timeout: 10000 });
    await page.selectOption('#shader-preset-image', 'noise');
    await page.selectOption('#shader-render-mode', 'additive');
    await page.selectOption('#shader-address-mode', 'wrap');
    await page.selectOption('#shader-bg-mode', 'white');
    await page.screenshot({ path: path.join(outDir, '35-shader-select-controls.png'), fullPage: true });

    for (let i = 0; i < 4; i += 1) {
        await setInputFile(page, `#shader-upload-${i}`, {
            name: `audit-slot-${i}.png`,
            mimeType: 'image/png',
            buffer: tinyPngBuffer
        });
    }
    await page.screenshot({ path: path.join(outDir, '36-shader-uploaded.png'), fullPage: true });
    for (let i = 0; i < 4; i += 1) {
        await clickAndShot(page, `#shader-upload-clear-${i}`, `37-shader-clear-${i}.png`, { skipEscape: true });
    }
    await clickAndShot(page, '#btn-shader-preview-close', '38-shader-popup-close.png', { skipEscape: true });
    await page.waitForFunction(() => {
        const node = document.querySelector('#shader-preview-modal');
        return !!(node instanceof HTMLElement && node.hidden);
    }, null, { timeout: 10000 });

    await clickAndShot(page, '#btn-open-unified-submit', '39-open-unified-submit.png');
    await ensureUnifiedPanelOpen(page);
    await page.evaluate(() => {
        const input = document.querySelector('#unified-worker-url');
        if (input instanceof HTMLInputElement) {
            input.value = '';
        }
    });
    await clickInUnifiedPanel(page, '#btn-unified-auth-login', '40-unified-auth-login-clicked.png');
    if (!page.url().includes('/tml-ide/')) {
        await waitIdeReady(page);
        await clickAndShot(page, '#btn-open-unified-submit', '40b-unified-reopen-after-login-nav.png');
    }
    await ensureUnifiedPanelOpen(page);
    await clickInUnifiedPanel(page, '#btn-unified-auth-logout', '41-unified-auth-logout-clicked.png');
    await page.fill('#unified-worker-url', 'http://127.0.0.1:4173/mock-api/create-pr');
    await page.fill('#unified-pr-title', 'ui-audit');
    await page.fill('#unified-existing-pr-number', '');
    await page.fill('#unified-shader-slug', 'audit-shader');
    await clickInUnifiedPanel(page, '#btn-unified-collect', '42-unified-collect.png');
    await clickInUnifiedPanel(page, '#btn-unified-submit', '43-unified-submit.png');
    await clickInUnifiedPanel(page, '#btn-unified-resume', '44-unified-resume.png');
    await clickInUnifiedPanel(page, '#btn-unified-submit-close', '45-unified-close.png');

    const openLog = await page.evaluate(() => {
        return Array.isArray(globalThis.__tmlIdeOpenLog) ? globalThis.__tmlIdeOpenLog.slice() : [];
    });
    if (!openLog.length) {
        throw new Error('未捕获到任何 window.open 调用，无法确认新标签相关按钮行为');
    }

    const legacyMarkdown = await context.newPage();
    await legacyMarkdown.goto('http://127.0.0.1:4173/site/pages/article-studio.html', { waitUntil: 'domcontentloaded' });
    await legacyMarkdown.screenshot({ path: path.join(outDir, '46-legacy-markdown-redirect.png'), fullPage: true });

    const legacyShader = await context.newPage();
    await legacyShader.goto('http://127.0.0.1:4173/site/pages/shader-playground.html', { waitUntil: 'domcontentloaded' });
    await legacyShader.screenshot({ path: path.join(outDir, '47-legacy-shader-redirect.png'), fullPage: true });

    await browser.close();
}

main().catch((error) => {
    console.error('[tml-ide-full-ui-audit] failed:', error);
    process.exitCode = 1;
});
