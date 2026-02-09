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

test('generate-shader-gallery: emits index json', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gallery-generate-'));
    const root = path.join(tmp, 'gallery');
    const entryDir = path.join(root, 'demo');
    const outFile = path.join(tmp, 'out', 'index.json');
    fs.mkdirSync(entryDir, { recursive: true });

    await sharp({
        create: {
            width: 90,
            height: 90,
            channels: 4,
            background: { r: 30, g: 60, b: 130, alpha: 1 }
        }
    }).webp({ quality: 80 }).toFile(path.join(entryDir, 'cover.webp'));

    fs.writeFileSync(path.join(entryDir, 'entry.json'), JSON.stringify({
        slug: 'demo',
        title: 'Demo Shader',
        author: 'Tester',
        description: 'demo',
        shader: 'shader.json',
        cover: 'cover.webp',
        tags: ['noise']
    }, null, 2) + '\n', 'utf8');

    fs.writeFileSync(path.join(entryDir, 'shader.json'), JSON.stringify({
        common: '',
        passes: [
            {
                name: 'Pass 1',
                type: 'image',
                code: 'float4 MainPS(float2 texCoord : TEXCOORD0) : COLOR0 { return float4(1,0,1,1); }',
                channels: [{ kind: 'none' }, { kind: 'none' }, { kind: 'none' }, { kind: 'none' }]
            }
        ]
    }, null, 2) + '\n', 'utf8');

    const script = path.resolve(__dirname, 'generate-shader-gallery.js');
    const res = runNode([script, '--root', root, '--out', outFile]);
    assert.equal(res.status, 0, res.stderr || res.stdout);

    const payload = JSON.parse(fs.readFileSync(outFile, 'utf8'));
    assert.equal(Array.isArray(payload.items), true);
    assert.equal(payload.items.length, 1);
    assert.equal(payload.items[0].slug, 'demo');
    assert.match(String(payload.items[0].cover || ''), /cover\.webp$/);
});

