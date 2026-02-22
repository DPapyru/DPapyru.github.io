import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.TML_IDE_URL || 'http://127.0.0.1:4173/tml-ide/';
const outDir = path.resolve('test-results/tml-ide-vscode-acceptance-rerun');

async function ensureDir(dir) {
    await fs.mkdir(dir, { recursive: true });
}

async function resolveChromium() {
    try {
        const playwright = await import('playwright');
        if (playwright && playwright.chromium) return playwright.chromium;
    } catch (_) {
    }

    try {
        const playwrightCore = await import('playwright-core');
        if (playwrightCore && playwrightCore.chromium) return playwrightCore.chromium;
    } catch (_) {
    }

    throw new Error('Missing playwright runtime: install playwright or playwright-core.');
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
    await page.waitForFunction(() => {
        return Boolean(globalThis.__tmlIdeDebug && typeof globalThis.__tmlIdeDebug.isReady === 'function' && globalThis.__tmlIdeDebug.isReady());
    }, null, { timeout: 30000 });
}

async function collectRuntimeFingerprint(page) {
    return await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script[src]')).map((item) => item.getAttribute('src') || '');
        const bundle = scripts.find((item) => /assets\/index-[^/]+\.js/.test(item)) || '';
        const indexInfo = document.querySelector('#index-info')?.textContent?.trim() || '';
        const initLog = Array.from(document.querySelectorAll('#event-log li')).some((item) => {
            const text = item.textContent || '';
            return text.includes('tML IDE 初始化完成');
        });
        const debugReady = Boolean(globalThis.__tmlIdeDebug && globalThis.__tmlIdeDebug.isReady && globalThis.__tmlIdeDebug.isReady());
        return {
            href: location.href,
            bundle,
            indexInfo,
            initLog,
            debugReady
        };
    });
}

function assertRuntimeFingerprint(runtimeFingerprint) {
    if (!runtimeFingerprint.bundle || !/\/tml-ide\/assets\/index-[^/]+\.js$/.test(runtimeFingerprint.bundle)) {
        throw new Error(`Runtime bundle mismatch: ${runtimeFingerprint.bundle || '(empty)'}`);
    }
    if (!String(runtimeFingerprint.indexInfo || '').includes('T:')) {
        throw new Error(`Index info not ready: ${runtimeFingerprint.indexInfo || '(empty)'}`);
    }
    if (!runtimeFingerprint.initLog) {
        throw new Error('Init log is missing.');
    }
    if (!runtimeFingerprint.debugReady) {
        throw new Error('Debug API reports not ready.');
    }
}

async function injectStableEditorText(page, text, cursorNeedle) {
    const result = await page.evaluate((payload) => {
        const debug = globalThis.__tmlIdeDebug;
        const setOk = debug.setEditorText(payload.text);
        const cursorOk = debug.setCursorAfterText(payload.cursorNeedle);
        const appliedText = debug.getEditorText();
        return {
            setOk,
            cursorOk,
            appliedText
        };
    }, { text, cursorNeedle });

    if (!result.setOk) {
        throw new Error('setEditorText returned false; editor is not ready.');
    }
    if (!result.cursorOk) {
        throw new Error('setCursorAfterText failed to locate cursor needle.');
    }
    if (result.appliedText !== text) {
        throw new Error('Editor text did not persist after injection.');
    }
}

async function collectSuggestSnapshot(page, maxItems) {
    const payload = await page.evaluate(async (n) => {
        return await globalThis.__tmlIdeDebug.requestAnalyzeAtCursor({
            completion: true,
            hover: false,
            diagnostics: false,
            maxItems: Number(n || 120)
        });
    }, Number(maxItems || 120));

    const labels = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.suggest-widget .monaco-list-row .label-name'))
            .map((node) => (node.textContent || '').trim())
            .filter(Boolean);
    });

    const popupVisible = await page.locator('.suggest-widget.visible').isVisible().catch(() => false);
    return {
        popupVisible,
        labels,
        payload: payload && Array.isArray(payload.completionItems) ? payload.completionItems : []
    };
}

async function collectProblemsSnapshot(page) {
    return await page.evaluate(() => {
        const activeTab = document.querySelector('.panel-tab.panel-tab-active')?.getAttribute('data-panel-tab') || '';
        const summary = document.querySelector('#problems-summary')?.textContent?.trim() || '';
        const listItems = Array.from(document.querySelectorAll('#problems-list .problem-item'));
        const rows = listItems.map((item) => ({
            severity: item.getAttribute('data-severity') || '',
            code: item.querySelector('.problem-code')?.textContent?.trim() || '',
            message: item.querySelector('.problem-message')?.textContent?.trim() || ''
        }));
        return {
            activeTab,
            summary,
            count: rows.length,
            rows
        };
    });
}

async function verifyWorkbenchInteractions(page) {
    await page.keyboard.press('Control+Shift+P');
    await page.waitForSelector('#command-palette:not([hidden])', { timeout: 5000 });
    await page.fill('#command-palette-input', 'View: Toggle Panel');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(250);

    const panelHidden = await page.evaluate(() => {
        return Boolean(document.querySelector('#app')?.classList.contains('is-panel-hidden'));
    });
    if (!panelHidden) {
        throw new Error('Ctrl+Shift+P did not execute "Toggle Panel".');
    }

    await page.keyboard.press('Control+Shift+P');
    await page.waitForSelector('#command-palette:not([hidden])', { timeout: 5000 });
    await page.fill('#command-palette-input', 'View: Toggle Panel');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(250);

    const panelVisibleAgain = await page.evaluate(() => {
        return !document.querySelector('#app')?.classList.contains('is-panel-hidden');
    });
    if (!panelVisibleAgain) {
        throw new Error('Panel did not reopen after second toggle command.');
    }

    await page.keyboard.press('Control+P');
    await page.waitForSelector('#command-palette:not([hidden])', { timeout: 5000 });
    const quickOpenReady = await page.evaluate(() => {
        const input = document.querySelector('#command-palette-input');
        return Boolean(input && String(input.placeholder || '').includes('Quick Open'));
    });
    if (!quickOpenReady) {
        throw new Error('Ctrl+P did not switch command palette to Quick Open mode.');
    }
    await page.fill('#command-palette-input', 'Program');
    await page.waitForTimeout(150);
    const hasQuickOpenItems = await page.evaluate(() => {
        return document.querySelectorAll('#command-palette-results .command-palette-item').length > 0;
    });
    if (!hasQuickOpenItems) {
        throw new Error('Quick Open did not produce file results.');
    }
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => {
        const node = document.querySelector('#command-palette');
        return Boolean(node && node.hasAttribute('hidden'));
    }, null, { timeout: 5000 });

    await page.click('button[data-panel-tab="output"]');
    const activePanelState = await page.evaluate(() => {
        const activeTab = document.querySelector('.panel-tab.panel-tab-active')?.getAttribute('data-panel-tab') || '';
        const activeView = document.querySelector('.panel-view.panel-view-active')?.getAttribute('data-panel-view') || '';
        return { activeTab, activeView };
    });
    if (activePanelState.activeTab !== 'output' || activePanelState.activeView !== 'output') {
        throw new Error(`Panel tab switch failed: tab=${activePanelState.activeTab} view=${activePanelState.activeView}`);
    }
}

async function clickContextMenuItem(page, labelText) {
    await page.waitForSelector('#ide-context-menu:not([hidden])', { timeout: 5000 });
    const item = page.locator('#ide-context-menu .ide-context-menu-item').filter({ hasText: labelText }).first();
    const count = await item.count();
    if (!count) {
        throw new Error(`Context menu item not found: ${labelText}`);
    }
    await item.click();
}

async function verifyPopupInViewport(page, selector, name) {
    const within = await page.evaluate((targetSelector) => {
        const node = document.querySelector(targetSelector);
        if (!node || node.hasAttribute('hidden')) return false;
        const rect = node.getBoundingClientRect();
        return rect.left >= -1
            && rect.top >= -1
            && rect.right <= window.innerWidth + 1
            && rect.bottom <= window.innerHeight + 1;
    }, selector);
    if (!within) {
        throw new Error(`${name} exceeds viewport bounds.`);
    }
}

async function verifyContextAndFixInteractions(page) {
    const problemsDemoCode = [
        'public class ProblemDemo {',
        '    void Test() {',
        '        int x = 1',
        '    }',
        '}'
    ].join('\n');
    await injectStableEditorText(page, problemsDemoCode, 'int x = 1');
    await page.click('#btn-run-diagnostics');
    await page.waitForTimeout(600);

    await page.click('.monaco-editor', { button: 'right' });
    await clickContextMenuItem(page, '显示问题面板');
    const activeProblemsTab = await page.evaluate(() => {
        return document.querySelector('.panel-tab.panel-tab-active')?.getAttribute('data-panel-tab') || '';
    });
    if (activeProblemsTab !== 'problems') {
        throw new Error(`Context menu command failed to show problems tab: ${activeProblemsTab}`);
    }

    await page.evaluate(() => globalThis.__tmlIdeDebug.setCursorAfterText('int x = 1'));
    await page.waitForSelector('#ide-fix-popup:not([hidden])', { timeout: 5000 });
    await verifyPopupInViewport(page, '#ide-fix-popup', 'Fix popup');
    await page.screenshot({ path: path.join(outDir, '08-context-fix-auto-popup.png'), fullPage: true });

    await page.mouse.click(4, 4);
    await page.waitForFunction(() => {
        return Boolean(document.querySelector('#ide-fix-popup')?.hasAttribute('hidden'));
    }, null, { timeout: 5000 });

    await page.keyboard.press('Control+Period');
    await page.waitForSelector('#ide-fix-popup:not([hidden])', { timeout: 5000 });
    await verifyPopupInViewport(page, '#ide-fix-popup', 'Fix popup (Ctrl+.)');

    await page.click('#problems-list .problem-item .problem-jump', { button: 'right' });
    await clickContextMenuItem(page, '打开修复子窗');
    await page.waitForSelector('#ide-fix-popup:not([hidden])', { timeout: 5000 });

    const suggestionCount = await page.evaluate(() => {
        return document.querySelectorAll('#ide-fix-popup-suggestions .ide-fix-suggestion').length;
    });
    if (suggestionCount <= 0) {
        throw new Error('Fix popup suggestions are empty.');
    }
    await page.click('#ide-fix-popup-suggestions .ide-fix-suggestion-actions button');
    await page.waitForTimeout(200);

    await page.evaluate(() => {
        const originalPrompt = window.prompt;
        window.prompt = function (...args) {
            window.prompt = originalPrompt;
            return 'site/content/怎么贡献/code/context-menu-acceptance.fx';
        };
    });
    await page.click('#btn-add-file');
    await page.waitForTimeout(200);

    const invalidShaderCode = [
        'sampler2D Texture0 : register(s0)',
        '{',
        '};'
    ].join('\n');
    await page.evaluate((text) => {
        globalThis.__tmlIdeDebug.setEditorText(text);
    }, invalidShaderCode);
    await page.click('button[data-panel-tab="compile"]');
    await page.waitForTimeout(150);
    await page.click('#btn-panel-shader-compile');
    await page.waitForTimeout(700);

    const shaderHasErrors = await page.evaluate(() => {
        return document.querySelectorAll('#shader-error-list .problem-item').length > 0;
    });
    if (!shaderHasErrors) {
        throw new Error('Shader compile error list did not populate.');
    }

    await page.click('button[data-panel-tab="problems"]');
    await page.waitForTimeout(250);
    await page.click('#problems-list .problem-item .problem-jump', { button: 'right' });
    await clickContextMenuItem(page, '打开修复子窗');
    const shaderFixState = await page.evaluate(() => globalThis.__tmlIdeDebug.getFixPopupState());
    if (!shaderFixState || shaderFixState.issueCode !== 'SHADER_COMPILE_ERROR') {
        throw new Error(`Shader quick-fix popup mismatch: ${JSON.stringify(shaderFixState)}`);
    }

    const contextClampState = await page.evaluate(() => {
        return globalThis.__tmlIdeDebug.openContextMenuAt('editor', { x: 9999, y: 9999, context: { menuTitle: '编辑器' } });
    });
    if (!contextClampState || !contextClampState.open) {
        throw new Error('Debug API failed to open context menu near viewport edge.');
    }
    await verifyPopupInViewport(page, '#ide-context-menu', 'Context menu');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => {
        return Boolean(document.querySelector('#ide-context-menu')?.hasAttribute('hidden'));
    }, null, { timeout: 5000 });
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => {
        return Boolean(document.querySelector('#ide-fix-popup')?.hasAttribute('hidden'));
    }, null, { timeout: 5000 });
    await page.screenshot({ path: path.join(outDir, '09-context-fix-shader.png'), fullPage: true });
}

async function main() {
    await ensureDir(outDir);

    const chromium = await resolveChromium();
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    const page = await context.newPage();

    await waitForIdeReady(page);

    const runtimeFingerprint = await collectRuntimeFingerprint(page);
    assertRuntimeFingerprint(runtimeFingerprint);

    await page.screenshot({ path: path.join(outDir, '01-shell-vscode.png'), fullPage: true });
    await verifyWorkbenchInteractions(page);
    await page.screenshot({ path: path.join(outDir, '02-workbench-commands.png'), fullPage: true });

    const overrideDemoCode = [
        'using Terraria;',
        'using Terraria.ModLoader;',
        '',
        'public class ExampleItem : ModItem',
        '{',
        '    public override void Set',
        '}'
    ].join('\n');
    await injectStableEditorText(page, overrideDemoCode, 'Set');
    const overridePayload = await page.evaluate(async () => {
        return await globalThis.__tmlIdeDebug.requestAnalyzeAtCursor({
            completion: true,
            hover: false,
            diagnostics: false,
            maxItems: 120
        });
    });
    const overrideCandidate = (overridePayload && Array.isArray(overridePayload.completionItems)
        ? overridePayload.completionItems
        : []
    ).find((item) => item.label === 'SetDefaults');
    if (!overrideCandidate) {
        throw new Error('override completion missing SetDefaults.');
    }
    if (overrideCandidate.insertTextMode !== 'snippet') {
        throw new Error(`override completion insertTextMode mismatch: ${overrideCandidate.insertTextMode || '(empty)'}`);
    }
    if (!String(overrideCandidate.insertText || '').includes('{')) {
        throw new Error('override completion snippet is missing method body braces.');
    }
    await page.screenshot({ path: path.join(outDir, '03-override-snippet-completion.png'), fullPage: true });

    const exampleItemCode = [
        'using Terraria;',
        'using Terraria.ModLoader;',
        '',
        'public class ExampleItem : ModItem',
        '{',
        '    public override void SetDefaults()',
        '    {',
        '        ',
        '    }',
        '}'
    ].join('\n');

    await injectStableEditorText(page, exampleItemCode, '    {\n        ');

    await page.click('.monaco-editor');
    await page.keyboard.type('Item');
    await page.waitForTimeout(350);
    let itemSnapshot = await collectSuggestSnapshot(page, 120);
    if (!itemSnapshot.popupVisible) {
        await page.evaluate(() => globalThis.__tmlIdeDebug.triggerSuggest());
        await page.waitForTimeout(350);
        itemSnapshot = await collectSuggestSnapshot(page, 120);
    }

    const hasItemLabel = itemSnapshot.labels.includes('Item') || itemSnapshot.payload.some((item) => item.label === 'Item');
    if (!hasItemLabel) {
        throw new Error(`Item completion missing in type scenario. labels=${itemSnapshot.labels.slice(0, 10).join(',')}`);
    }

    await page.screenshot({ path: path.join(outDir, '04-item-typed-completion.png'), fullPage: true });

    await page.keyboard.type('.');
    await page.waitForTimeout(350);
    let itemDotSnapshot = await collectSuggestSnapshot(page, 220);
    if (!itemDotSnapshot.popupVisible) {
        await page.evaluate(() => globalThis.__tmlIdeDebug.triggerSuggest());
        await page.waitForTimeout(350);
        itemDotSnapshot = await collectSuggestSnapshot(page, 220);
    }

    const hasDamage = itemDotSnapshot.labels.includes('damage') || itemDotSnapshot.payload.some((item) => item.label === 'damage');
    if (!hasDamage) {
        throw new Error(`Item. completion missing 'damage'. labels=${itemDotSnapshot.labels.slice(0, 10).join(',')}`);
    }
    await page.screenshot({ path: path.join(outDir, '05-item-dot-completion.png'), fullPage: true });

    await page.click('#btn-run-diagnostics');
    await page.waitForTimeout(500);

    const hoverDemoCode = [
        'using Terraria;',
        '',
        'public class HoverDemo {',
        '    Player player;',
        '}'
    ].join('\n');
    await injectStableEditorText(page, hoverDemoCode, 'Player');

    const hoverPayload = await page.evaluate(async () => {
        const ok = globalThis.__tmlIdeDebug.setCursorAfterText('Pla');
        if (!ok) return null;
        const result = await globalThis.__tmlIdeDebug.requestAnalyzeAtCursor({
            completion: false,
            hover: true,
            diagnostics: true
        });
        return result && result.hover ? result.hover : null;
    });

    if (!hoverPayload || typeof hoverPayload.markdown !== 'string' || hoverPayload.markdown.trim() === '') {
        throw new Error('Hover payload is empty; hover docs not available at cursor.');
    }

    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outDir, '06-hover-diagnostics.png'), fullPage: true });

    const problemsDemoCode = [
        'public class ProblemDemo {',
        '    void Test() {',
        '        int x = 1',
        '    }',
        '}'
    ].join('\n');
    await injectStableEditorText(page, problemsDemoCode, 'int x = 1');
    await page.click('#btn-run-diagnostics');
    await page.waitForTimeout(500);
    const problemsSnapshot = await collectProblemsSnapshot(page);
    if (problemsSnapshot.activeTab !== 'problems') {
        throw new Error(`Problems panel not auto-focused. activeTab=${problemsSnapshot.activeTab}`);
    }
    if (problemsSnapshot.count <= 0) {
        throw new Error(`Problems list is empty. summary=${problemsSnapshot.summary}`);
    }
    await page.screenshot({ path: path.join(outDir, '07-problems-list.png'), fullPage: true });

    await verifyContextAndFixInteractions(page);

    await browser.close();

    console.log(`Acceptance screenshots written to ${outDir}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
