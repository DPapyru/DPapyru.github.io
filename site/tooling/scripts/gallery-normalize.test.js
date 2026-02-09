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

test('gallery-normalize: converts cover to webp and rewrites entry', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gallery-normalize-'));
    const root = path.join(tmp, 'gallery');
    const entryDir = path.join(root, 'demo-shader');
    fs.mkdirSync(entryDir, { recursive: true });

    const srcCover = path.join(entryDir, 'cover.png');
    await sharp({
        create: {
            width: 64,
            height: 64,
            channels: 4,
            background: { r: 120, g: 180, b: 220, alpha: 1 }
        }
    }).png().toFile(srcCover);

    fs.writeFileSync(path.join(entryDir, 'entry.json'), JSON.stringify({
        slug: 'demo-shader',
        title: 'Demo Shader',
        author: 'Tester',
        description: 'demo',
        shader: 'shader.json',
        cover: 'cover.png'
    }, null, 2) + '\n', 'utf8');

    fs.writeFileSync(path.join(entryDir, 'shader.json'), JSON.stringify({
        common: '',
        passes: [
            {
                name: 'Pass 1',
                type: 'image',
                code: 'float4 MainPS(float2 texCoord : TEXCOORD0) : COLOR0 { return float4(1,1,1,1); }',
                channels: [{ kind: 'none' }, { kind: 'none' }, { kind: 'none' }, { kind: 'none' }]
            }
        ]
    }, null, 2) + '\n', 'utf8');

    const script = path.resolve(__dirname, 'gallery-normalize.js');
    const res = runNode([script, '--root', root]);
    assert.equal(res.status, 0, res.stderr || res.stdout);

    const nextEntry = JSON.parse(fs.readFileSync(path.join(entryDir, 'entry.json'), 'utf8'));
    assert.equal(nextEntry.cover, 'cover.webp');
    assert.equal(fs.existsSync(path.join(entryDir, 'cover.webp')), true);
    assert.equal(fs.existsSync(srcCover), false);
});

