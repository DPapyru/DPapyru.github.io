'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const childProcess = require('node:child_process');
const { compileAnimToJs, validateFeatures } = require('./animcs-compiler');

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
        entries[key] = { js: `${item.entry}.js`, entry: item.entry };
    }
    return { schemaVersion: 1, entries };
}

function resolveOutputPath(sourcePath) {
    return String(sourcePath || '').replace(/.*?(anims\/)([^\/]+)\.cs$/i, 'site/assets/$1$2.js');
}

function resolveRuntimeOutputDir(projectRoot) {
    return toPosixPath(path.join(projectRoot, 'site', 'assets', 'anims', 'runtime'));
}

function writeManifest(projectRoot, items) {
    const outDir = path.join(projectRoot, 'site', 'assets', 'anims');
    fs.mkdirSync(outDir, { recursive: true });
    const manifestPath = path.join(outDir, 'manifest.json');
    const sources = items.map(item => item.source);
    const payload = {
        schemaVersion: 1,
        sources,
        entries: buildManifest(items).entries
    };
    fs.writeFileSync(manifestPath, JSON.stringify(payload, null, 2) + '\n', 'utf8');
}

function scanAnimScripts(projectRoot) {
    const animsRoot = path.join(projectRoot, 'site', 'content', 'anims');
    if (!fs.existsSync(animsRoot)) return [];

    const allFiles = listFilesRecursive(animsRoot);
    const csFiles = allFiles.filter((filePath) => {
        if (!filePath.endsWith('.cs')) return false;
        if (filePath.includes(`${path.sep}obj${path.sep}`)) return false;
        if (filePath.includes(`${path.sep}bin${path.sep}`)) return false;
        return true;
    });
    return csFiles
        .map((fullPath) => {
            const relative = path.relative(path.join(projectRoot, 'site', 'content'), fullPath);
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

function readJsonIfExists(filePath) {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
}

function pickFirstExisting(fileNames) {
    for (const name of fileNames) {
        if (name) return name;
    }
    return '';
}

function buildBootConfig(runtimeDir) {
    if (!runtimeDir || !fs.existsSync(runtimeDir)) {
        throw new Error(`runtime dir missing: ${runtimeDir}`);
    }

    const entries = fs.readdirSync(runtimeDir);
    const dlls = entries.filter(name => name.endsWith('.dll'));
    if (!dlls.length) {
        throw new Error(`runtime dir missing assemblies: ${runtimeDir}`);
    }

    const entryAssembly = dlls.includes('AnimHost.dll') ? 'AnimHost.dll' : dlls[0];
    const wasmNative = pickFirstExisting(entries.filter(name => name === 'dotnet.native.wasm' || name === 'dotnet.wasm'));
    const jsModuleNative = pickFirstExisting(entries.filter(name => name === 'dotnet.native.js'));
    const jsModuleRuntime = pickFirstExisting(entries.filter(name => name === 'dotnet.runtime.js'));

    if (!wasmNative) {
        throw new Error('dotnet wasm runtime asset missing');
    }
    if (!jsModuleNative) {
        throw new Error('dotnet native js module missing');
    }
    if (!jsModuleRuntime) {
        throw new Error('dotnet runtime js module missing');
    }

    const runtimeConfigName = entries.find(name => name.endsWith('.runtimeconfig.json'));
    const runtimeConfig = runtimeConfigName
        ? readJsonIfExists(path.join(runtimeDir, runtimeConfigName))
        : null;

    const assembly = {};
    dlls.forEach((name) => {
        assembly[name] = '';
    });

    const config = {
        cacheBootResources: true,
        debugBuild: false,
        linkerEnabled: true,
        mainAssemblyName: entryAssembly,
        entryAssembly: entryAssembly,
        resources: {
            assembly,
            jsModuleNative: { [jsModuleNative]: '' },
            jsModuleRuntime: { [jsModuleRuntime]: '' },
            wasmNative: { [wasmNative]: '' }
        }
    };

    if (runtimeConfig && runtimeConfig.runtimeOptions && runtimeConfig.runtimeOptions.configProperties) {
        config.configProperties = runtimeConfig.runtimeOptions.configProperties;
    }

    return config;
}

function writeBootConfig(runtimeDir) {
    const config = buildBootConfig(runtimeDir);
    const outPath = path.join(runtimeDir, 'dotnet.boot.json');
    fs.writeFileSync(outPath, JSON.stringify(config, null, 2) + '\n', 'utf8');
    return outPath;
}

function publishRuntime(projectRoot) {
    const runtimeOutDir = resolveRuntimeOutputDir(projectRoot);
    fs.mkdirSync(runtimeOutDir, { recursive: true });
    runDotnet([
        'publish',
        path.join(projectRoot, 'site', 'tooling', 'tools', 'animcs', 'AnimHost', 'AnimHost.csproj'),
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
    const outDir = path.join(projectRoot, 'site', 'assets', 'anims');
    fs.mkdirSync(outDir, { recursive: true });
    const project = path.join(projectRoot, 'site', 'tooling', 'tools', 'animcs', 'AnimScript', 'AnimScript.csproj');
    items.forEach((item) => {
        const sourceAbs = path.join(projectRoot, 'site', 'content', item.source);
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
    const projectRoot = path.resolve(__dirname, '..', '..', '..');
    const items = scanAnimScripts(projectRoot);
    buildAnimJs(projectRoot, items);
    writeManifest(projectRoot, items);
}

function buildAnimJs(projectRoot, items) {
    if (!items.length) return;
    const outDir = path.join(projectRoot, 'site', 'assets', 'anims');
    fs.mkdirSync(outDir, { recursive: true });
    items.forEach((item) => {
        const sourceAbs = path.join(projectRoot, 'site', 'content', item.source);
        const source = fs.readFileSync(sourceAbs, 'utf8');
        const errors = validateFeatures(source);
        if (errors.length) {
            throw new Error(`[animcs] ${item.source}: ${errors.join('; ')}`);
        }
        const js = compileAnimToJs(source);
        const target = path.join(outDir, `${item.entry}.js`);
        const banner = `// Generated from ${item.source}\n`;
        fs.writeFileSync(target, banner + js, 'utf8');
    });
}

if (require.main === module) {
    main();
}

module.exports = {
    buildManifest,
    buildBootConfig,
    resolveOutputPath,
    resolveRuntimeOutputDir,
    scanAnimScripts,
    buildAnimJs,
    writeBootConfig,
    writeManifest,
    main
};
