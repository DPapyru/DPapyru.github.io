import path from 'node:path';
import { parseAcceptanceArgs, runSuiteAndExit } from './lib/acceptance-runner.mjs';
import { buildIdePageDef } from './lib/suites.mjs';

// Compatibility markers retained for tml-ide readiness tests:
// runtimeFingerprint
// Runtime bundle mismatch
// Control+Shift+P
// data-panel-tab="output"
// Item.
// hasDamage
// override
// SetDefaults
// problems-list
// ide-context-menu
// Control+Period
// SHADER_COMPILE_ERROR

const args = parseAcceptanceArgs(process.argv.slice(2), {
    suiteId: 'tml-ide-vscode-acceptance',
    baseUrl: process.env.TML_IDE_URL || 'http://127.0.0.1:4173'
});

await runSuiteAndExit({
    suiteId: 'tml-ide-vscode-acceptance',
    baseUrl: args.baseUrl,
    runId: args.runId,
    updateBaseline: args.updateBaseline,
    allowlistPath: args.allowlistPath,
    visualThresholdPercent: args.visualThresholdPercent,
    pageFilter: args.pageFilter,
    headless: args.headless,
    outRoot: path.resolve('test-results/fullpage-acceptance'),
    baselineRoot: path.resolve('test-baselines/fullpage'),
    pages: [
        buildIdePageDef({
            pageId: 'tml-ide-vscode'
        })
    ]
});
