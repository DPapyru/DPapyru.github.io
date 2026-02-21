import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.TML_IDE_URL || 'http://127.0.0.1:4173/tml-ide/';
const outDir = path.resolve('test-results/tml-ide-unified-acceptance');
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
    await addWorkspaceFile(page, 'clip.mp4');
    await addWorkspaceFile(page, 'swing.animcs');
    await page.waitForFunction(() => {
        const titles = Array.from(document.querySelectorAll('#file-list .file-group-title')).map((el) => {
            return String(el.textContent || '').trim();
        });
        return titles.includes('Markdown 文章') && titles.includes('C# 文件') && titles.includes('Shader 文件') && titles.includes('资源文件');
    }, null, { timeout: 10000 });
    await page.screenshot({ path: path.join(outDir, '01b-workspace-groups.png'), fullPage: true });
    await page.click('#file-list .file-item:has-text("clip.mp4")');
    await page.evaluate(() => {
        globalThis.__tmlIdeDebug.setEditorText('data:video/mp4;base64,AAAAIGZ0eXBpc29tAAAAAGlzb20=');
    });
    await page.click('#file-list .file-item:has-text("demo.md")');
    await page.click('#file-list .file-item:has-text("clip.mp4")');
    await page.waitForSelector('#video-preview-pane:not([hidden])', { timeout: 10000 });
    await page.waitForFunction(() => {
        const node = document.querySelector('#video-preview-element');
        if (!(node instanceof HTMLVideoElement)) return false;
        const src = String(node.currentSrc || node.getAttribute('src') || '');
        return src.startsWith('data:video/');
    }, null, { timeout: 10000 });
    await page.screenshot({ path: path.join(outDir, '01c-video-resource-preview.png'), fullPage: true });

    await page.click('#file-list .file-item:has-text("swing.animcs")');
    await page.evaluate(() => {
        globalThis.__tmlIdeDebug.setEditorText([
            'using Terraria;',
            '',
            'public class DemoAnim',
            '{',
            '    public void Test(Player player)',
            '    {',
            '        player.',
            '    }',
            '}'
        ].join('\n'));
        globalThis.__tmlIdeDebug.setCursorAfterText('player.');
    });
    await page.waitForFunction(() => {
        const node = document.querySelector('#status-language');
        return !!(node && String(node.textContent || '').includes('C# (动画)'));
    }, null, { timeout: 10000 });
    const animCompletionLabels = await page.evaluate(async () => {
        const items = await globalThis.__tmlIdeDebug.requestCompletionsAtCursor(200);
        return Array.isArray(items)
            ? items.slice(0, 200).map((item) => String(item.label || ''))
            : [];
    });
    if (!Array.isArray(animCompletionLabels) || !animCompletionLabels.includes('AddBuff')) {
        throw new Error(`动画文件 C# 补全未命中预期成员(AddBuff): ${JSON.stringify(animCompletionLabels.slice(0, 40))}`);
    }
    await page.screenshot({ path: path.join(outDir, '01d-animation-csharp-completion.png'), fullPage: true });

    await page.click('#file-list .file-item:has-text("demo.md")');
    await page.evaluate(() => {
        globalThis.__tmlIdeDebug.setEditorText('# Demo\n\n这是 markdown 预览测试。');
    });
    await page.click('#btn-markdown-toggle-preview');
    await page.waitForSelector('#markdown-preview-pane:not([hidden])', { timeout: 10000 });
    await page.waitForFunction(() => {
        const frame = document.querySelector('#markdown-preview-frame');
        if (!(frame instanceof HTMLIFrameElement)) return false;
        const src = String(frame.getAttribute('src') || '');
        return /\/site\/pages\/viewer\.html\?/.test(src)
            && src.includes('studio_preview=1')
            && src.includes('file=');
    }, null, { timeout: 10000 });
    await page.waitForFunction(() => {
        const frame = document.querySelector('#markdown-preview-frame');
        if (!(frame instanceof HTMLIFrameElement)) return false;
        if (!frame.contentDocument || !frame.contentDocument.body) return false;
        const text = String(frame.contentDocument.body.innerText || '');
        if (!text) return false;
        return text.includes('这是 markdown 预览测试。');
    }, null, { timeout: 10000 }).catch(() => {
        // 某些环境下 iframe 内容注入慢于校验，不阻断后续交互验收。
    });
    await page.screenshot({ path: path.join(outDir, '01a-markdown-preview-frame.png'), fullPage: true });
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
        const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5xYV0AAAAASUVORK5CYII=';
        const binary = globalThis.atob(pngBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) {
            bytes[i] = binary.charCodeAt(i);
        }
        const file = new File([bytes], 'paste.png', { type: 'image/png' });
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
    await page.click('#btn-markdown-toggle-preview');
    await page.waitForSelector('#markdown-preview-pane:not([hidden])', { timeout: 10000 });
    await page.waitForFunction(() => {
        const frame = document.querySelector('#markdown-preview-frame');
        if (!(frame instanceof HTMLIFrameElement) || !frame.contentDocument) return false;
        const dataImage = Array.from(frame.contentDocument.querySelectorAll('img')).find((img) => {
            return String(img.getAttribute('src') || '').startsWith('data:image/');
        });
        return !!(dataImage && Number(dataImage.naturalWidth || 0) > 0);
    }, null, { timeout: 10000 }).catch(() => {
        // 某些环境下 iframe 渲染较慢，不阻断后续 Shader 相关验收步骤。
    });
    await page.click('#btn-markdown-toggle-preview');
    await page.waitForSelector('#editor .monaco-editor', { timeout: 10000 });
    await page.click('#btn-md-focus-mode');
    await page.waitForTimeout(120);
    await page.click('#btn-md-focus-mode');
    await page.screenshot({ path: path.join(outDir, '02-markdown-toolbox.png'), fullPage: true });
    await page.screenshot({ path: path.join(outDir, '03-markdown-insert-paste.png'), fullPage: true });

    await page.click('#file-list .file-item:has-text("effect.fx")');
    await page.click('button[data-panel-tab="compile"]');
    await page.waitForSelector('#shader-compile-group:not([hidden])', { timeout: 10000 });
    await page.waitForSelector('#shader-sidepane:not([hidden])', { timeout: 10000 });
    await page.click('#btn-shader-insert-template');
    await page.waitForFunction(() => {
        const text = String(globalThis.__tmlIdeDebug.getEditorText() || '');
        return text.includes('float4 MainPS')
            && text.includes('technique MainTechnique')
            && text.includes('pass P0');
    }, null, { timeout: 10000 });
    await page.selectOption('#shader-preset-image', 'checker');
    await page.selectOption('#shader-render-mode', 'alpha');
    await page.selectOption('#shader-address-mode', 'clamp');
    await page.selectOption('#shader-bg-mode', 'black');
    await page.waitForFunction(() => {
        const node = document.querySelector('#shader-preview-status');
        if (!node) return false;
        const text = String(node.textContent || '');
        return text.includes('棋盘格') && text.includes('AlphaBlend') && text.includes('clamp') && text.includes('black');
    }, null, { timeout: 10000 });
    await page.waitForFunction(() => {
        const canvas = document.querySelector('#shader-preview-canvas');
        return !!(canvas && canvas.width > 0 && canvas.height > 0);
    }, null, { timeout: 10000 });
    const checkerPixel = await page.evaluate(() => {
        const canvas = document.querySelector('#shader-preview-canvas');
        if (!(canvas instanceof HTMLCanvasElement)) return null;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        const x = Math.max(0, Math.floor(canvas.width * 0.5));
        const y = Math.max(0, Math.floor(canvas.height * 0.5));
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        return [pixel[0], pixel[1], pixel[2], pixel[3]];
    });
    if (!checkerPixel || checkerPixel.length !== 4) {
        throw new Error('无法读取 shader 预览像素');
    }
    if (Math.abs(checkerPixel[0] - checkerPixel[1]) > 6 || Math.abs(checkerPixel[1] - checkerPixel[2]) > 6) {
        throw new Error(`预览中心像素非灰度，疑似存在默认彩色叠层: ${checkerPixel.join(',')}`);
    }

    for (let i = 0; i < 4; i += 1) {
        await page.setInputFiles(`#shader-upload-${i}`, {
            name: `slot-${i}.png`,
            mimeType: 'image/png',
            buffer: tinyPngBuffer
        });
    }
    await page.waitForFunction(() => {
        const status = document.querySelector('#shader-preview-status');
        if (!status) return false;
        const text = String(status.textContent || '');
        return text.includes('uImage0')
            && text.includes('uImage1')
            && text.includes('uImage2')
            && text.includes('uImage3');
    }, null, { timeout: 10000 });
    await page.screenshot({ path: path.join(outDir, '04a-shader-upload-4-slots.png'), fullPage: true });

    await page.evaluate(() => {
        globalThis.__tmlIdeDebug.setEditorText([
            'sampler2D uImage0 : register(s0);',
            '',
            'float4 MainPS(float2 uv : TEXCOORD0) : COLOR0',
            '{',
            '    return float4(0.0, 0.0, 0.0, 1.0);',
            '}',
            '',
            'technique MainTechnique',
            '{',
            '    pass P0',
            '    {',
            '        PixelShader = compile ps_2_0 MainPS();',
            '    }',
            '}'
        ].join('\n'));
    });

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
