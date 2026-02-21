import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.TML_IDE_URL || 'http://127.0.0.1:4173/tml-ide/';
const outDir = path.resolve('test-results/tml-ide-unified-acceptance');

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

async function waitIdeReady(page) {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => {
        return Boolean(globalThis.__tmlIdeDebug && globalThis.__tmlIdeDebug.isReady && globalThis.__tmlIdeDebug.isReady());
    }, null, { timeout: 30000 });
    await page.waitForSelector('#editor .monaco-editor', { timeout: 30000 });
}

async function addWorkspaceFile(page, fileName) {
    const dialogs = [];
    const handler = async (dialog) => {
        dialogs.push(dialog.message());
        if (dialog.type() === 'prompt') {
            await dialog.accept(fileName);
            return;
        }
        await dialog.dismiss();
    };
    page.once('dialog', handler);
    await page.click('#btn-add-file');
    await page.waitForTimeout(200);
    if (!dialogs.length) {
        throw new Error(`新增文件对话框未出现: ${fileName}`);
    }
}

async function main() {
    await fs.mkdir(outDir, { recursive: true });
    const chromium = await resolveChromium();
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1680, height: 980 } });
    const page = await context.newPage();

    await waitIdeReady(page);
    await page.screenshot({ path: path.join(outDir, '01-shell-ready.png'), fullPage: true });

    await addWorkspaceFile(page, 'demo.md');
    await addWorkspaceFile(page, 'effect.fx');

    await page.click('#file-list .file-item:has-text("demo.md")');
    await page.evaluate(() => {
        globalThis.__tmlIdeDebug.setEditorText('# Demo\n\n这是 markdown 预览测试。');
    });
    await page.click('#btn-markdown-toggle-preview');
    await page.waitForSelector('#markdown-preview-pane:not([hidden])', { timeout: 10000 });
    await page.click('#btn-markdown-open-viewer');
    await page.click('#btn-markdown-toggle-preview');
    await page.waitForSelector('#editor .monaco-editor', { timeout: 10000 });
    await page.click('button[data-panel-tab="compile"]');
    await page.waitForSelector('#markdown-toolbox-group:not([hidden])', { timeout: 10000 });
    await page.click('#btn-md-draft-check');
    await page.waitForFunction(() => {
        const node = document.querySelector('#markdown-draft-check-log');
        return node && String(node.textContent || '').includes('发布前自检结果');
    }, null, { timeout: 10000 });
    await page.click('#editor .monaco-editor');
    await page.click('button[data-md-insert="bold"]');
    await page.waitForFunction(() => {
        return String(globalThis.__tmlIdeDebug.getEditorText() || '').includes('**加粗文本**');
    }, null, { timeout: 10000 });

    await page.click('#editor .monaco-editor');
    await page.evaluate(() => {
        const pngPayload = 'tiny-png-binary';
        const file = new File([pngPayload], 'paste.png', { type: 'image/png' });
        const clipboardData = new DataTransfer();
        clipboardData.items.add(file);
        let event = null;
        try {
            event = new ClipboardEvent('paste', {
                clipboardData,
                bubbles: true,
                cancelable: true
            });
        } catch (_err) {
            event = new Event('paste', { bubbles: true, cancelable: true });
            Object.defineProperty(event, 'clipboardData', {
                value: clipboardData
            });
        }
        const target = document.activeElement || document.querySelector('#editor .monaco-editor');
        if (!target || typeof target.dispatchEvent !== 'function') {
            throw new Error('paste target not found');
        }
        target.dispatchEvent(event);
    });
    await page.waitForFunction(() => {
        return /!\[[^\]]+\]\((?:\.\/)?images\/.+\.(?:png|jpe?g|gif|webp|svg|bmp|avif)\)/i.test(String(globalThis.__tmlIdeDebug.getEditorText() || ''));
    }, null, { timeout: 10000 });
    await page.waitForSelector('#file-list .file-item:has-text("images/")', { timeout: 10000 });
    await page.click('#file-list .file-item:has-text("images/")');
    await page.waitForSelector('#image-preview-pane:not([hidden])', { timeout: 10000 });
    await page.waitForFunction(() => {
        const node = document.querySelector('#image-preview-image');
        return !!(node && String(node.getAttribute('src') || '').startsWith('data:image/'));
    }, null, { timeout: 10000 });
    await page.click('#file-list .file-item:has-text("demo.md")');
    await page.waitForSelector('#editor .monaco-editor', { timeout: 10000 });
    await page.click('#btn-md-focus-mode');
    await page.waitForTimeout(120);
    await page.click('#btn-md-focus-mode');
    await page.screenshot({ path: path.join(outDir, '02-markdown-toolbox.png'), fullPage: true });
    await page.screenshot({ path: path.join(outDir, '03-markdown-insert-paste.png'), fullPage: true });

    await page.click('#file-list .file-item:has-text("effect.fx")');
    await page.click('button[data-panel-tab="compile"]');
    await page.waitForSelector('#shader-compile-group:not([hidden])', { timeout: 10000 });
    await page.click('#btn-shader-insert-template');
    await page.waitForFunction(() => {
        const text = String(globalThis.__tmlIdeDebug.getEditorText() || '');
        return text.includes('float4 MainPS') && text.includes('saturate(');
    }, null, { timeout: 10000 });

    await page.evaluate(() => {
        globalThis.__tmlIdeDebug.setEditorText([
            'float4 PSMain(float2 uv : TEXCOORD0) : SV_Target',
            '{',
            '    sat',
            '    return float4(uv, 0.5, 1.0);',
            '}'
        ].join('\n'));
        globalThis.__tmlIdeDebug.setCursorAfterText('sat');
    });
    await page.evaluate(async () => {
        if (globalThis.__tmlIdeDebug && typeof globalThis.__tmlIdeDebug.triggerSuggest === 'function') {
            await globalThis.__tmlIdeDebug.triggerSuggest();
        }
    });
    await page.keyboard.type('u');

    await page.click('#editor .monaco-editor');
    await page.keyboard.type('\n// 模拟输入');
    await page.click('#btn-shader-compile');
    await page.click('button[data-panel-tab="compile"]');

    await page.waitForTimeout(200);
    const compileLog = await page.locator('#shader-compile-log').innerText();
    if (!String(compileLog).includes('编译成功')) {
        throw new Error(`Shader 编译日志未成功: ${compileLog}`);
    }

    await page.screenshot({ path: path.join(outDir, '04-markdown-shader-actions.png'), fullPage: true });
    await browser.close();
}

main().catch((error) => {
    console.error('[tml-ide-unified-acceptance] failed:', error);
    process.exitCode = 1;
});
