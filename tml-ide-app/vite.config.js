import { fileURLToPath } from 'node:url';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { dirname, extname, normalize, resolve } from 'node:path';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SITE_ROOT = resolve(__dirname, '../site');
const SITE_ROOT_PREFIX = `${normalize(SITE_ROOT)}${process.platform === 'win32' ? '\\' : '/'}`;
const CONTENT_TYPE_BY_EXT = Object.freeze({
    '.avif': 'image/avif',
    '.bmp': 'image/bmp',
    '.css': 'text/css; charset=utf-8',
    '.gif': 'image/gif',
    '.html': 'text/html; charset=utf-8',
    '.ico': 'image/x-icon',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.md': 'text/markdown; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain; charset=utf-8',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.xml': 'application/xml; charset=utf-8'
});

function contentTypeByPath(filePath) {
    return CONTENT_TYPE_BY_EXT[extname(filePath).toLowerCase()] || 'application/octet-stream';
}

function normalizeSafePath(rootPath, requestPath) {
    const safeRelative = String(requestPath || '/').replace(/^\/+/, '');
    const targetPath = normalize(resolve(rootPath, safeRelative || 'index.html'));
    if (targetPath === normalize(rootPath) || targetPath.startsWith(SITE_ROOT_PREFIX)) {
        return targetPath;
    }
    return '';
}

function createSiteStaticMiddleware() {
    return async function serveSiteStatic(req, res, next) {
        if (!req || !res) return next();
        const method = String(req.method || 'GET').toUpperCase();
        if (method !== 'GET' && method !== 'HEAD') return next();
        const rawUrl = String(req.url || '/').split('?')[0].split('#')[0];
        let decodedPath = '/';
        try {
            decodedPath = decodeURIComponent(rawUrl || '/');
        } catch (_err) {
            return next();
        }
        let targetPath = normalizeSafePath(SITE_ROOT, decodedPath);
        if (!targetPath) return next();

        let fileStats = null;
        try {
            fileStats = await stat(targetPath);
            if (fileStats.isDirectory()) {
                const nextPath = normalizeSafePath(SITE_ROOT, `${decodedPath.replace(/\/+$/, '')}/index.html`);
                if (!nextPath) return next();
                targetPath = nextPath;
                fileStats = await stat(targetPath);
            }
        } catch (_err) {
            return next();
        }
        if (!fileStats || !fileStats.isFile()) return next();

        res.statusCode = 200;
        res.setHeader('Content-Type', contentTypeByPath(targetPath));
        res.setHeader('Cache-Control', 'no-cache');
        if (method === 'HEAD') {
            res.end();
            return;
        }
        createReadStream(targetPath).pipe(res);
    };
}

export default defineConfig({
    base: '/tml-ide/',
    publicDir: 'public',
    plugins: [
        {
            name: 'serve-site-static-in-dev',
            configureServer(server) {
                server.middlewares.use('/site', createSiteStaticMiddleware());
            }
        }
    ],
    build: {
        outDir: resolve(__dirname, '../tml-ide'),
        emptyOutDir: true,
        sourcemap: false
    }
});
