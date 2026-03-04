'use strict';

const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function toPosixPath(filePath) {
    return String(filePath || '').replace(/\\/g, '/');
}

function listFilesRecursive(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const results = [];

    entries.forEach((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...listFilesRecursive(full));
        } else if (entry.isFile()) {
            results.push(full);
        }
    });

    return results;
}

function parseModeOptionsDsl(text) {
    const raw = String(text || '').trim();
    if (!raw) return [];

    return raw.split('|')
        .map((chunk) => String(chunk || '').trim())
        .filter(Boolean)
        .map((part) => {
            const sep = part.indexOf(':');
            if (sep <= 0) return null;
            const value = Number(part.slice(0, sep).trim());
            const label = part.slice(sep + 1).trim();
            if (!Number.isFinite(value) || !label) return null;
            return { value, text: label };
        })
        .filter(Boolean);
}

function normalizeAnimProfile(input) {
    if (!input || typeof input !== 'object') return null;
    const profile = {};

    if (typeof input.controls === 'string') {
        const controls = input.controls.trim();
        if (controls) profile.controls = controls;
    }

    if (input.heightScale != null) {
        const heightScale = Number(input.heightScale);
        if (Number.isFinite(heightScale) && heightScale > 0) {
            profile.heightScale = heightScale;
        }
    }

    let modeOptions = [];
    if (Array.isArray(input.modeOptions)) {
        modeOptions = input.modeOptions
            .map((item) => {
                if (!item || typeof item !== 'object') return null;
                const value = Number(item.value);
                const text = String(item.text || '').trim();
                if (!Number.isFinite(value) || !text) return null;
                return { value, text };
            })
            .filter(Boolean);
    } else if (typeof input.modeOptions === 'string') {
        modeOptions = parseModeOptionsDsl(input.modeOptions);
    }

    if (modeOptions.length) {
        profile.modeOptions = modeOptions;
    }

    return Object.keys(profile).length ? profile : null;
}

function parseAnimProfile(sourceText) {
    const source = String(sourceText || '');

    const inlineTag = source.match(/\/\/\s*@anim-profile\s+(\{.*\})\s*$/m);
    if (inlineTag && inlineTag[1]) {
        try {
            const parsed = JSON.parse(inlineTag[1]);
            return normalizeAnimProfile(parsed);
        } catch (_error) {
            // Fallback to exported profile parser.
        }
    }

    const profileMatch = source.match(/export\s+const\s+profile\s*=\s*(\{[\s\S]*?\})\s*;?/m);
    if (!profileMatch || !profileMatch[1]) return null;

    try {
        const evaluated = Function(`"use strict"; return (${profileMatch[1]});`)();
        return normalizeAnimProfile(evaluated);
    } catch (_error) {
        return null;
    }
}

function scanAnimScripts(projectRoot) {
    const contentRoot = path.join(projectRoot, 'site', 'content');
    if (!fs.existsSync(contentRoot)) return [];

    const allFiles = listFilesRecursive(contentRoot);
    const animFiles = allFiles.filter((filePath) => {
        if (!filePath.endsWith('.anim.ts')) return false;
        if (filePath.includes(`${path.sep}node_modules${path.sep}`)) return false;
        return true;
    });

    return animFiles
        .map((absPath) => {
            const source = toPosixPath(path.relative(contentRoot, absPath));
            const entry = source.replace(/\.anim\.ts$/i, '');
            return { source, entry, absPath };
        })
        .sort((a, b) => a.source.localeCompare(b.source, 'en'));
}

function buildManifest(items) {
    const entries = {};

    for (const item of items || []) {
        entries[item.source] = {
            js: `${item.entry}.js`,
            entry: item.entry
        };

        if (item.profile) {
            entries[item.source].profile = item.profile;
        }
    }

    return {
        schemaVersion: 2,
        entries
    };
}

function transpileAnimSource(sourceText, sourcePath) {
    const result = ts.transpileModule(String(sourceText || ''), {
        fileName: sourcePath,
        compilerOptions: {
            target: ts.ScriptTarget.ES2020,
            module: ts.ModuleKind.ES2020,
            moduleResolution: ts.ModuleResolutionKind.Bundler,
            isolatedModules: true,
            removeComments: false,
            downlevelIteration: false
        },
        reportDiagnostics: true
    });

    const diagnostics = (result.diagnostics || [])
        .filter((diag) => diag && diag.category === ts.DiagnosticCategory.Error)
        .map((diag) => {
            const message = ts.flattenDiagnosticMessageText(diag.messageText, '\n');
            if (!diag.file || typeof diag.start !== 'number') {
                return message;
            }
            const pos = diag.file.getLineAndCharacterOfPosition(diag.start);
            return `${sourcePath}:${pos.line + 1}:${pos.character + 1} ${message}`;
        });

    if (diagnostics.length) {
        throw new Error(`[animts] compile failed: ${diagnostics.join(' | ')}`);
    }

    return String(result.outputText || '');
}

function buildAnimTs(projectRoot, items) {
    const outRoot = path.join(projectRoot, 'site', 'assets', 'anims');
    fs.mkdirSync(outRoot, { recursive: true });

    for (const item of items) {
        const sourceText = fs.readFileSync(item.absPath, 'utf8');
        item.profile = parseAnimProfile(sourceText);
        const js = transpileAnimSource(sourceText, item.source);
        const outPath = path.join(outRoot, `${item.entry}.js`);
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        const banner = `// Generated from ${item.source}\n`;
        fs.writeFileSync(outPath, banner + js, 'utf8');
    }
}

function writeManifest(projectRoot, items) {
    const outDir = path.join(projectRoot, 'site', 'assets', 'anims');
    fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, 'manifest.json');
    const payload = {
        schemaVersion: 2,
        sources: items.map((item) => item.source),
        entries: buildManifest(items).entries
    };
    fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function main() {
    const projectRoot = path.resolve(__dirname, '..', '..', '..');
    const items = scanAnimScripts(projectRoot);
    buildAnimTs(projectRoot, items);
    writeManifest(projectRoot, items);
}

if (require.main === module) {
    main();
}

module.exports = {
    parseModeOptionsDsl,
    normalizeAnimProfile,
    parseAnimProfile,
    scanAnimScripts,
    buildManifest,
    transpileAnimSource,
    buildAnimTs,
    writeManifest,
    main
};
