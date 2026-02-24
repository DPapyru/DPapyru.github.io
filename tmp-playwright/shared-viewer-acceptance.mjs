import path from 'node:path';
import { parseAcceptanceArgs, runSuiteAndExit } from './lib/acceptance-runner.mjs';
import { buildViewerPageDef } from './lib/suites.mjs';

const args = parseAcceptanceArgs(process.argv.slice(2), {
    suiteId: 'shared-viewer-acceptance'
});

await runSuiteAndExit({
    suiteId: 'shared-viewer-acceptance',
    baseUrl: args.baseUrl,
    runId: args.runId,
    updateBaseline: args.updateBaseline,
    allowlistPath: args.allowlistPath,
    visualThresholdPercent: args.visualThresholdPercent,
    pageFilter: args.pageFilter,
    headless: args.headless,
    outRoot: path.resolve('test-results/fullpage-acceptance'),
    baselineRoot: path.resolve('test-baselines/fullpage'),
    pages: [buildViewerPageDef()]
});

