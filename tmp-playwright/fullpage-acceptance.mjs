import path from 'node:path';
import { parseAcceptanceArgs, runSuiteAndExit } from './lib/acceptance-runner.mjs';
import {
    buildViewerPageDef,
    buildFolderPageDef,
    buildIdePageDef
} from './lib/suites.mjs';

const args = parseAcceptanceArgs(process.argv.slice(2), {
    suiteId: 'fullpage-acceptance'
});

await runSuiteAndExit({
    suiteId: 'fullpage-acceptance',
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
        buildViewerPageDef(),
        buildFolderPageDef(),
        buildIdePageDef()
    ]
});

