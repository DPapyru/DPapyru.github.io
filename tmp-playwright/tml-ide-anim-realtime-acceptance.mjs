import path from 'node:path';
import { parseAcceptanceArgs, runSuiteAndExit } from './lib/acceptance-runner.mjs';
import { buildIdePageDef } from './lib/suites.mjs';

const args = parseAcceptanceArgs(process.argv.slice(2), {
    suiteId: 'tml-ide-anim-realtime-acceptance',
    baseUrl: process.env.TML_IDE_URL || 'http://127.0.0.1:4173'
});

await runSuiteAndExit({
    suiteId: 'tml-ide-anim-realtime-acceptance',
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
            pageId: 'tml-ide-anim',
            scenarioIds: [
                'ide-file-create-and-input',
                'ide-anim-completion',
                'ide-markdown-preview'
            ]
        })
    ]
});

