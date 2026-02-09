const test = require('node:test');
const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const sharp = require('sharp');

function runNode(args, options = {}) {
    const result = childProcess.spawnSync(process.execPath, args, {
        encoding: 'utf8',
        ...options
    });
    return {
        status: result.status,
        stdout: result.stdout || '',
        stderr: result.stderr || ''
    };
}

async function createWebp(filePath) {
    await sharp({
        create: {
            width: 80,
            height: 45,
            channels: 4,
            background: { r: 35, g: 120, b: 90, alpha: 1 }
        }
    }).webp({ quality: 80 }).toFile(filePath);
}

function writeShaderFile(filePath) {
    fs.writeFileSync(filePath, JSON.stringify({
        common: '',
        passes: [
            {
                name: 'Pass 1',
                type: 'image',
                code: 'float4 MainPS(float2 texCoord : TEXCOORD0) : COLOR0 { return float4(texCoord.x, texCoord.y, 0.5, 1.0); }',
                channels: [{ kind: 'none' }, { kind: 'none' }, { kind: 'none' }, { kind: 'none' }]
            }
        ]
    }, null, 2) + '\n', 'utf8');
}

test('gallery-check: passes with valid entry', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gallery-check-'));
    const root = path.join(tmp, 'gallery');
    const entryDir = path.join(root, 'demo');
    fs.mkdirSync(entryDir, { recursive: true });

    await createWebp(path.join(entryDir, 'cover.webp'));
    writeShaderFile(path.join(entryDir, 'shader.json'));
    fs.writeFileSync(path.join(entryDir, 'entry.json'), JSON.stringify({
        slug: 'demo',
        title: 'Demo',
        author: 'Tester',
        description: 'demo desc',
        shader: 'shader.json',
        cover: 'cover.webp',
        tags: ['noise']
    }, null, 2) + '\n', 'utf8');

    const script = path.resolve(__dirname, 'gallery-check.js');
    const res = runNode([script, '--root', root]);
    assert.equal(res.status, 0, res.stderr || res.stdout);
    assert.match(res.stdout + res.stderr, /gallery-check:\s*OK/i);
});

test('gallery-check: rejects non-webp cover', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gallery-check-'));
    const root = path.join(tmp, 'gallery');
    const entryDir = path.join(root, 'demo');
    fs.mkdirSync(entryDir, { recursive: true });

    await sharp({
        create: {
            width: 80,
            height: 45,
            channels: 4,
            background: { r: 200, g: 100, b: 90, alpha: 1 }
        }
    }).png().toFile(path.join(entryDir, 'cover.png'));
    writeShaderFile(path.join(entryDir, 'shader.json'));
    fs.writeFileSync(path.join(entryDir, 'entry.json'), JSON.stringify({
        slug: 'demo',
        title: 'Demo',
        author: 'Tester',
        description: 'demo desc',
        shader: 'shader.json',
        cover: 'cover.png'
    }, null, 2) + '\n', 'utf8');

    const script = path.resolve(__dirname, 'gallery-check.js');
    const res = runNode([script, '--root', root]);
    assert.equal(res.status, 1, res.stderr || res.stdout);
    assert.match(res.stdout + res.stderr, /cover.*webp/i);
});

