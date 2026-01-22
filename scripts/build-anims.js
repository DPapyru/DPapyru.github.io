const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function toPosixPath(filePath) {
    return String(filePath).replace(/\\/g, '/');
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

function runTsc(projectRoot) {
    const localTsc = path.join(projectRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'tsc.cmd' : 'tsc');
    const tscBin = fs.existsSync(localTsc) ? localTsc : 'npx';

    const args = tscBin === 'npx'
        ? ['tsc', '-p', path.join(projectRoot, 'tsconfig.anims.json')]
        : ['-p', path.join(projectRoot, 'tsconfig.anims.json')];

    const result = spawnSync(tscBin, args, {
        cwd: projectRoot,
        stdio: 'inherit',
        shell: false
    });

    if (result.status !== 0) {
        process.exit(result.status || 1);
    }
}

function writeManifest(projectRoot, sources) {
    const outDir = path.join(projectRoot, 'assets', 'anims');
    fs.mkdirSync(outDir, { recursive: true });
    const manifestPath = path.join(outDir, 'manifest.json');

    const payload = {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        sources
    };

    fs.writeFileSync(manifestPath, JSON.stringify(payload, null, 2) + '\n', 'utf8');
}

function syncEmbeddedDemo(projectRoot) {
    const rendererPath = path.join(projectRoot, 'docs', 'anim-renderer.html');
    const demoPath = path.join(projectRoot, 'docs', 'anims', 'demo-eoc-ai.ts');
    if (!fs.existsSync(rendererPath) || !fs.existsSync(demoPath)) return;

    const html = fs.readFileSync(rendererPath, 'utf8');
    const begin = '/* ANIMTS-DEMO-EOC-BEGIN */';
    const end = '/* ANIMTS-DEMO-EOC-END */';
    const beginIndex = html.indexOf(begin);
    const endIndex = html.indexOf(end);

    const demo = fs.readFileSync(demoPath, 'utf8');
    if (demo.includes('</textarea>')) {
        throw new Error('demo-eoc-ai.ts contains </textarea>, cannot embed safely');
    }

    let next = html;

    if (beginIndex >= 0 && endIndex >= 0 && endIndex > beginIndex) {
        const before = html.slice(0, beginIndex + begin.length);
        const after = html.slice(endIndex);
        next = `${before}\n${demo.trim()}\n${after}`;
    } else {
        // First-time bootstrap: replace the whole textarea content, and keep markers for future sync.
        const textareaOpen = html.indexOf('<textarea id="anim-demo-eoc-source"');
        if (textareaOpen < 0) return;
        const openEnd = html.indexOf('>', textareaOpen);
        const textareaClose = html.indexOf('</textarea>', openEnd);
        if (openEnd < 0 || textareaClose < 0) return;

        const before = html.slice(0, openEnd + 1);
        const after = html.slice(textareaClose);
        next = `${before}\n${begin}\n${demo.trim()}\n${end}\n${after}`;
    }

    fs.writeFileSync(rendererPath, next, 'utf8');
}

function main() {
    const projectRoot = path.resolve(__dirname, '..');
    const animsRoot = path.join(projectRoot, 'docs', 'anims');

    if (!fs.existsSync(animsRoot)) {
        writeManifest(projectRoot, []);
        return;
    }

    const allFiles = listFilesRecursive(animsRoot);
    const tsFiles = allFiles.filter(f => f.endsWith('.ts'));
    const sources = tsFiles
        .map(f => path.relative(path.join(projectRoot, 'docs'), f))
        .map(toPosixPath)
        .sort((a, b) => a.localeCompare(b, 'en'));

    if (sources.length === 0) {
        writeManifest(projectRoot, []);
        syncEmbeddedDemo(projectRoot);
        return;
    }

    runTsc(projectRoot);
    writeManifest(projectRoot, sources);
    syncEmbeddedDemo(projectRoot);
}

main();
