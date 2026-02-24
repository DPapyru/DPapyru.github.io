import fs from 'node:fs/promises';
import path from 'node:path';
import { compareWithBaseline } from './visual-diff.mjs';

const DEFAULT_BASE_URL = 'http://127.0.0.1:4173';
const DEFAULT_THRESHOLD_PERCENT = 0.8;
const DEFAULT_ALLOWLIST_PATH = path.resolve('tmp-playwright/config/console-allowlist.json');

function sanitizeId(text) {
    return String(text || '')
        .trim()
        .replace(/[^a-zA-Z0-9_-]+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '') || 'scenario';
}

function defaultRunId() {
    const d = new Date();
    const pad = (num) => String(num).padStart(2, '0');
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}-${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`;
}

export function parseAcceptanceArgs(argvInput, defaultsInput) {
    const argv = Array.isArray(argvInput) ? argvInput : process.argv.slice(2);
    const defaults = defaultsInput && typeof defaultsInput === 'object' ? defaultsInput : {};
    const output = {
        baseUrl: String(defaults.baseUrl || DEFAULT_BASE_URL),
        runId: String(defaults.runId || defaultRunId()),
        updateBaseline: Boolean(defaults.updateBaseline),
        allowlistPath: String(defaults.allowlistPath || DEFAULT_ALLOWLIST_PATH),
        visualThresholdPercent: Number.isFinite(Number(defaults.visualThresholdPercent))
            ? Number(defaults.visualThresholdPercent)
            : DEFAULT_THRESHOLD_PERCENT,
        pageFilter: String(defaults.pageFilter || '').trim(),
        headless: defaults.headless !== false
    };

    for (let i = 0; i < argv.length; i += 1) {
        const arg = String(argv[i] || '');
        const next = String(argv[i + 1] || '');
        if (arg === '--base-url' && next) {
            output.baseUrl = next;
            i += 1;
            continue;
        }
        if (arg === '--run-id' && next) {
            output.runId = next;
            i += 1;
            continue;
        }
        if (arg === '--allowlist' && next) {
            output.allowlistPath = next;
            i += 1;
            continue;
        }
        if (arg === '--threshold' && next) {
            output.visualThresholdPercent = Number(next);
            i += 1;
            continue;
        }
        if (arg === '--pages' && next) {
            output.pageFilter = next;
            i += 1;
            continue;
        }
        if (arg === '--update-baseline') {
            output.updateBaseline = true;
            continue;
        }
        if (arg === '--headed') {
            output.headless = false;
            continue;
        }
    }

    return output;
}

async function resolveChromium() {
    try {
        const playwright = await import('playwright');
        if (playwright && playwright.chromium) return playwright.chromium;
    } catch (_error) {
        // fall through
    }
    try {
        const playwrightCore = await import('playwright-core');
        if (playwrightCore && playwrightCore.chromium) return playwrightCore.chromium;
    } catch (_error) {
        // fall through
    }
    throw new Error('Missing playwright runtime. Install playwright or playwright-core.');
}

function compileAllowlistRule(ruleInput) {
    const rule = ruleInput && typeof ruleInput === 'object' ? ruleInput : {};
    const type = String(rule.type || 'any').toLowerCase();
    const patternText = String(rule.pattern || '').trim();
    if (!patternText) return null;
    const flags = String(rule.flags || '').replace(/[^gimsuy]/g, '');
    return {
        type,
        patternText,
        regex: new RegExp(patternText, flags)
    };
}

async function loadAllowlist(allowlistPath) {
    const absolutePath = path.resolve(String(allowlistPath || DEFAULT_ALLOWLIST_PATH));
    const raw = await fs.readFile(absolutePath, 'utf8');
    const parsed = JSON.parse(raw);
    const rules = Array.isArray(parsed && parsed.rules) ? parsed.rules : [];
    return {
        path: absolutePath,
        rules: rules.map(compileAllowlistRule).filter(Boolean)
    };
}

function isConsoleEntryAllowed(entry, allowlist) {
    const event = entry && typeof entry === 'object' ? entry : {};
    const type = String(event.type || '').toLowerCase();
    const text = String(event.text || '');
    return allowlist.rules.some((rule) => {
        const typeMatched = rule.type === 'any' || rule.type === type;
        if (!typeMatched) return false;
        return rule.regex.test(text);
    });
}

function nowIso() {
    return new Date().toISOString();
}

async function ensureDir(dirPath) {
    await fs.mkdir(dirPath, { recursive: true });
}

function parsePageFilter(text) {
    const raw = String(text || '').trim();
    if (!raw) return null;
    const ids = raw.split(',').map((item) => sanitizeId(item)).filter(Boolean);
    if (!ids.length) return null;
    return new Set(ids);
}

function joinUrl(baseUrl, urlPath) {
    const base = String(baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '');
    const pathname = String(urlPath || '').startsWith('/') ? String(urlPath || '') : `/${String(urlPath || '')}`;
    return `${base}${pathname}`;
}

function toSerializablePath(filePath) {
    return path.resolve(filePath);
}

function createScenarioContext(input) {
    const payload = input && typeof input === 'object' ? input : {};
    const steps = payload.steps;
    const assertions = payload.assertions;

    async function step(id, action) {
        const label = String(id || 'step').trim();
        const record = {
            id: label,
            startedAt: nowIso(),
            finishedAt: '',
            status: 'passed',
            error: ''
        };
        steps.push(record);
        try {
            await action();
        } catch (error) {
            record.status = 'failed';
            record.error = String(error && error.stack ? error.stack : error);
            record.finishedAt = nowIso();
            throw error;
        }
        record.finishedAt = nowIso();
    }

    function assert(id, condition, detail) {
        const passed = Boolean(condition);
        const record = {
            id: String(id || 'assertion').trim(),
            status: passed ? 'passed' : 'failed',
            detail: String(detail || '')
        };
        assertions.push(record);
        if (!passed) {
            throw new Error(`Assertion failed: ${record.id}${record.detail ? ` (${record.detail})` : ''}`);
        }
    }

    return { step, assert };
}

export async function runAcceptanceSuite(optionsInput) {
    const options = optionsInput && typeof optionsInput === 'object' ? optionsInput : {};
    const suiteId = sanitizeId(options.suiteId || 'acceptance');
    const baseUrl = String(options.baseUrl || DEFAULT_BASE_URL).trim();
    const runId = sanitizeId(options.runId || defaultRunId());
    const updateBaseline = Boolean(options.updateBaseline);
    const visualThresholdPercent = Number.isFinite(Number(options.visualThresholdPercent))
        ? Number(options.visualThresholdPercent)
        : DEFAULT_THRESHOLD_PERCENT;
    const outRoot = path.resolve(String(options.outRoot || 'test-results/fullpage-acceptance'));
    const baselineRoot = path.resolve(String(options.baselineRoot || 'test-baselines/fullpage'));
    const pageFilterSet = parsePageFilter(options.pageFilter);
    const waitAfterGotoMs = Number.isFinite(Number(options.waitAfterGotoMs)) ? Number(options.waitAfterGotoMs) : 1200;
    const viewport = options.viewport && typeof options.viewport === 'object'
        ? options.viewport
        : { width: 1680, height: 980 };
    const headless = options.headless !== false;
    const pages = Array.isArray(options.pages) ? options.pages : [];
    if (!pages.length) {
        throw new Error('runAcceptanceSuite requires at least one page definition');
    }

    const allowlist = await loadAllowlist(options.allowlistPath || DEFAULT_ALLOWLIST_PATH);
    const runDir = path.join(outRoot, runId);
    await ensureDir(runDir);

    const chromium = await resolveChromium();
    const browser = await chromium.launch({ headless });

    const report = {
        schemaVersion: 'report.schema.v2',
        suiteId,
        runId,
        baseUrl,
        generatedAt: nowIso(),
        status: 'passed',
        pages: [],
        artifactsRoot: toSerializablePath(runDir)
    };

    try {
        for (const pageDef of pages) {
            const pageId = sanitizeId(pageDef && pageDef.pageId || 'page');
            if (pageFilterSet && !pageFilterSet.has(pageId)) {
                continue;
            }

            const urlPath = String(pageDef && pageDef.urlPath || '/');
            const scenarios = Array.isArray(pageDef && pageDef.scenarios) ? pageDef.scenarios : [];
            const pageDir = path.join(runDir, pageId);
            await ensureDir(pageDir);

            const pageReport = {
                pageId,
                url: joinUrl(baseUrl, urlPath),
                status: 'passed',
                scenarios: [],
                console: {
                    allowlistPath: allowlist.path,
                    entries: [],
                    errorCount: 0,
                    blockedErrorCount: 0
                },
                artifacts: {
                    actual: [],
                    baseline: [],
                    diff: []
                }
            };

            const context = await browser.newContext({ viewport });
            const page = await context.newPage();
            let currentScenarioId = '';
            page.on('console', (msg) => {
                const entry = {
                    ts: nowIso(),
                    type: msg.type(),
                    text: msg.text(),
                    scenarioId: currentScenarioId
                };
                pageReport.console.entries.push(entry);
            });

            for (let i = 0; i < scenarios.length; i += 1) {
                const scenarioDef = scenarios[i];
                const scenarioId = sanitizeId(scenarioDef && scenarioDef.id || `scenario-${i + 1}`);
                currentScenarioId = scenarioId;

                const scenarioReport = {
                    id: scenarioId,
                    status: 'passed',
                    steps: [],
                    assertions: [],
                    screenshot: {
                        actualPath: '',
                        baselinePath: '',
                        diffPath: ''
                    },
                    visualDiffPercent: 0,
                    visualThresholdPercent,
                    baselinePath: '',
                    actualPath: '',
                    diffPath: '',
                    error: ''
                };
                pageReport.scenarios.push(scenarioReport);

                const screenshotFileName = `${String(i + 1).padStart(2, '0')}-${scenarioId}.png`;
                const actualPath = path.join(pageDir, screenshotFileName);
                const baselinePath = path.join(baselineRoot, pageId, `${scenarioId}.png`);
                const diffPath = path.join(pageDir, `${String(i + 1).padStart(2, '0')}-${scenarioId}.diff.png`);

                const { step, assert } = createScenarioContext({
                    steps: scenarioReport.steps,
                    assertions: scenarioReport.assertions
                });

                try {
                    await page.goto(joinUrl(baseUrl, urlPath), {
                        waitUntil: 'networkidle',
                        timeout: 60000
                    });
                    if (waitAfterGotoMs > 0) {
                        await page.waitForTimeout(waitAfterGotoMs);
                    }
                    await scenarioDef.run({
                        page,
                        step,
                        assert,
                        baseUrl,
                        urlPath,
                        pageId,
                        scenarioId
                    });
                    await page.screenshot({ path: actualPath, fullPage: true });
                } catch (error) {
                    scenarioReport.status = 'failed';
                    scenarioReport.error = String(error && error.stack ? error.stack : error);
                    try {
                        await page.screenshot({ path: actualPath, fullPage: true });
                    } catch (_shotError) {
                        // ignore secondary screenshot failure
                    }
                }

                const diffResult = await compareWithBaseline({
                    actualPath,
                    baselinePath,
                    diffPath,
                    updateBaseline,
                    visualThresholdPercent
                });

                scenarioReport.visualDiffPercent = diffResult.visualDiffPercent;
                scenarioReport.visualThresholdPercent = diffResult.visualThresholdPercent;
                scenarioReport.baselinePath = toSerializablePath(baselinePath);
                scenarioReport.actualPath = toSerializablePath(actualPath);
                scenarioReport.diffPath = toSerializablePath(diffPath);
                scenarioReport.screenshot.actualPath = toSerializablePath(actualPath);
                scenarioReport.screenshot.baselinePath = toSerializablePath(baselinePath);
                scenarioReport.screenshot.diffPath = toSerializablePath(diffPath);

                pageReport.artifacts.actual.push(toSerializablePath(actualPath));
                pageReport.artifacts.baseline.push(toSerializablePath(baselinePath));
                pageReport.artifacts.diff.push(toSerializablePath(diffPath));

                if (!diffResult.pass && scenarioReport.status === 'passed') {
                    scenarioReport.status = 'failed';
                    scenarioReport.error = `visual diff ${diffResult.visualDiffPercent}% exceeds threshold ${visualThresholdPercent}%`;
                }

                if (scenarioReport.status !== 'passed') {
                    pageReport.status = 'failed';
                }
            }

            const errorEntries = pageReport.console.entries.filter((entry) => entry.type === 'error');
            const blockedErrors = errorEntries.filter((entry) => !isConsoleEntryAllowed(entry, allowlist));
            pageReport.console.errorCount = errorEntries.length;
            pageReport.console.blockedErrorCount = blockedErrors.length;
            if (blockedErrors.length > 0) {
                pageReport.status = 'failed';
                pageReport.console.blockedErrors = blockedErrors;
            }

            await context.close();
            report.pages.push(pageReport);

            if (pageReport.status !== 'passed') {
                report.status = 'failed';
            }
        }
    } finally {
        await browser.close();
    }

    const reportPath = path.join(runDir, 'report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    report.reportPath = toSerializablePath(reportPath);

    return report;
}

export async function runSuiteAndExit(optionsInput) {
    const report = await runAcceptanceSuite(optionsInput);
    console.log(JSON.stringify(report, null, 2));
    if (report.status !== 'passed') {
        process.exitCode = 1;
    }
    return report;
}

