'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const childProcess = require('node:child_process');

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

function buildManifest(items) {
    const entries = {};
    for (const item of items || []) {
        const key = String(item.source || '').replace(/.*?(anims\/[^\/]+\.cs)$/i, '$1');
        if (!key) continue;
        entries[key] = { assembly: `${item.entry}.dll`, entry: item.entry };
    }
    return { schemaVersion: 1, entries };
}

function resolveOutputPath(sourcePath) {
    return String(sourcePath || '').replace(/.*?(anims\/)([^\/]+)\.cs$/i, 'assets/$1$2.dll');
}

function resolveRuntimeOutputDir(projectRoot) {
    return toPosixPath(path.join(projectRoot, 'assets', 'anims', 'runtime'));
}

function writeManifest(projectRoot, items) {
    const outDir = path.join(projectRoot, 'assets', 'anims');
    fs.mkdirSync(outDir, { recursive: true });
    const manifestPath = path.join(outDir, 'manifest.json');
    const sources = items.map(item => item.source);
    const payload = {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        sources,
        entries: buildManifest(items).entries
    };
    fs.writeFileSync(manifestPath, JSON.stringify(payload, null, 2) + '\n', 'utf8');
}

function scanAnimScripts(projectRoot) {
    const animsRoot = path.join(projectRoot, 'docs', 'anims');
    if (!fs.existsSync(animsRoot)) return [];

    const allFiles = listFilesRecursive(animsRoot);
    const csFiles = allFiles.filter(f => f.endsWith('.cs'));
    return csFiles
        .map((fullPath) => {
            const relative = path.relative(path.join(projectRoot, 'docs'), fullPath);
            const source = toPosixPath(relative);
            const entry = path.basename(fullPath, '.cs');
            return { source, entry };
        })
        .sort((a, b) => a.source.localeCompare(b.source, 'en'));
}

function resolveDotnetCommand() {
    return process.env.DOTNET_CMD || 'dotnet';
}

function isDotnetAvailable() {
    const cmd = resolveDotnetCommand();
    const result = childProcess.spawnSync(cmd, ['--version'], { stdio: 'ignore' });
    if (result.error) return false;
    return result.status === 0;
}

function runDotnet(args, options) {
    const cmd = resolveDotnetCommand();
    const result = childProcess.spawnSync(cmd, args, {
        stdio: 'inherit',
        cwd: options && options.cwd ? options.cwd : undefined
    });
    if (result.error) {
        throw result.error;
    }
    if (result.status !== 0) {
        throw new Error(`dotnet ${args.join(' ')} failed`);
    }
}

function publishRuntime(projectRoot) {
    const runtimeOutDir = resolveRuntimeOutputDir(projectRoot);
    fs.mkdirSync(runtimeOutDir, { recursive: true });
    runDotnet([
        'publish',
        path.join(projectRoot, 'tools', 'animcs', 'AnimHost', 'AnimHost.csproj'),
        '-c',
        'Release',
        '-r',
        'browser-wasm',
        '-o',
        runtimeOutDir
    ]);
}

function buildAnimDlls(projectRoot, items) {
    if (!items.length) return;
    const outDir = path.join(projectRoot, 'assets', 'anims');
    fs.mkdirSync(outDir, { recursive: true });
    const project = path.join(projectRoot, 'tools', 'animcs', 'AnimScript', 'AnimScript.csproj');
    items.forEach((item) => {
        const sourceAbs = path.join(projectRoot, 'docs', item.source);
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'animcs-'));
        runDotnet([
            'build',
            project,
            '-c',
            'Release',
            `-p:AnimScript=${sourceAbs}`,
            `-p:OutputPath=${tempDir}${path.sep}`,
            '-p:DebugType=none',
            '-p:DebugSymbols=false',
            '-p:GenerateRuntimeConfigurationFiles=false'
        ]);
        const builtDll = path.join(tempDir, 'AnimScript.dll');
        const targetDll = path.join(outDir, `${item.entry}.dll`);
        if (!fs.existsSync(builtDll)) {
            throw new Error(`build output missing: ${builtDll}`);
        }
        fs.copyFileSync(builtDll, targetDll);
        fs.rmSync(tempDir, { recursive: true, force: true });
    });
}

function main() {
    const projectRoot = path.resolve(__dirname, '..');
    const items = scanAnimScripts(projectRoot);
    if (!isDotnetAvailable()) {
        console.warn('[animcs] dotnet not found; skip runtime and dll build');
        writeManifest(projectRoot, items);
        return;
    }
    publishRuntime(projectRoot);
    buildAnimDlls(projectRoot, items);
    writeManifest(projectRoot, items);
}

if (require.main === module) {
    main();
}

module.exports = {
    buildManifest,
    resolveOutputPath,
    resolveRuntimeOutputDir,
    scanAnimScripts,
    writeManifest,
    main
};
