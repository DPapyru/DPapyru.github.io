import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

test('index.html exposes preview pane for video resources', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    assert.match(html, /id="video-preview-pane"/);
    assert.match(html, /id="video-preview-element"/);
});

test('main.js supports grouped explorer categories and video file mode', () => {
    const source = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8');

    assert.match(source, /const VIDEO_FILE_EXTENSIONS = new Set\(\[/);
    assert.match(source, /FILE_NAME_ALLOWED_EXT_RE[\s\S]*mp4[\s\S]*webm/);
    assert.match(source, /if \(VIDEO_FILE_EXTENSIONS\.has\(ext\)\) return 'video';/);
    assert.match(source, /function groupWorkspaceFilesByCategory/);
    assert.match(source, /Markdown 文章/);
    assert.match(source, /C# 文件/);
    assert.match(source, /Shader 文件/);
    assert.match(source, /资源文件/);
});
