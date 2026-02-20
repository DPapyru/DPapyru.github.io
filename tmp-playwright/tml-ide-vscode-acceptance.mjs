import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const baseUrl = process.env.TML_IDE_URL || 'http://127.0.0.1:4173/tml-ide/';
const outDir = path.resolve('test-results/tml-ide-vscode-acceptance-rerun');

async function ensureDir(dir) {
    await fs.mkdir(dir, { recursive: true });
}

async function waitForIdeReady(page) {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => {
        return Boolean(globalThis.__tmlIdeDebug && document.querySelector('.monaco-editor'));
    }, null, { timeout: 30000 });
    await page.waitForFunction(() => {
        const label = document.querySelector('#index-info')?.textContent || '';
        return label.includes('T:');
    }, null, { timeout: 30000 });
    await page.waitForFunction(() => {
        return Array.from(document.querySelectorAll('#event-log li')).some((item) => {
            const text = item.textContent || '';
            return text.includes('tML IDE 初始化完成');
        });
    }, null, { timeout: 30000 });
}

async function main() {
    await ensureDir(outDir);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    const page = await context.newPage();

    await waitForIdeReady(page);

    await page.screenshot({ path: path.join(outDir, '01-shell-vscode.png'), fullPage: true });

    const demoCode = [
        'using Terraria;',
        'using Terraria.ModLoader;',
        '',
        'public class DemoMod : Mod',
        '{',
        '    public override void Load()',
        '    {',
        '        Player player = null;',
        '        player.',
        '    }',
        '}'
    ].join('\n');

    await page.evaluate((text) => {
        globalThis.__tmlIdeDebug.setEditorText(text);
        globalThis.__tmlIdeDebug.setCursorAfterText('player.');
    }, demoCode);

    const appliedText = await page.evaluate(() => globalThis.__tmlIdeDebug.getEditorText());
    if (appliedText !== demoCode) {
        throw new Error('Editor text did not persist after injection.');
    }

    await page.evaluate(() => globalThis.__tmlIdeDebug.triggerSuggest());
    const completionItems = await page.evaluate(async () => {
        return await globalThis.__tmlIdeDebug.requestCompletionsAtCursor(30);
    });
    if (!Array.isArray(completionItems) || completionItems.length === 0) {
        throw new Error('Completion payload is empty; completion is not working at cursor.');
    }
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outDir, '02-input-completion.png'), fullPage: true });

    await page.click('#btn-run-diagnostics');
    await page.waitForTimeout(500);

    const hoverPayload = await page.evaluate(async () => {
        globalThis.__tmlIdeDebug.setCursorAfterText('Pla');
        return await globalThis.__tmlIdeDebug.requestHoverAtCursor();
    });

    if (!hoverPayload || typeof hoverPayload.markdown !== 'string' || hoverPayload.markdown.trim() === '') {
        throw new Error('Hover payload is empty; hover docs not available at cursor.');
    }

    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outDir, '03-hover-diagnostics.png'), fullPage: true });

    await page.click('#toggle-roslyn');
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outDir, '04-roslyn-toggle.png'), fullPage: true });

    // Input validation: fill text-form fields before file import.
    await page.fill('#input-append-dll-path', '/tmp/example/extra-mod.dll');
    await page.fill('#input-indexer-out-path', 'tml-ide-app/public/data/api-index.v2.json');
    const importIndexInput = page.locator('#input-import-index');
    await importIndexInput.setInputFiles(path.resolve('tml-ide-app/public/data/api-index.v2.json'));
    await page.click('#btn-import-index');
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outDir, '05-index-import.png'), fullPage: true });

    await browser.close();

    console.log(`Acceptance screenshots written to ${outDir}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
