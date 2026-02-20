import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
    base: '/tml-ide/',
    publicDir: 'public',
    build: {
        outDir: resolve(__dirname, '../tml-ide'),
        emptyOutDir: true,
        sourcemap: false
    }
});
