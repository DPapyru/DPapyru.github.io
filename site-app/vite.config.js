import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@shared': resolve(__dirname, '../shared')
        }
    },
    build: {
        rollupOptions: {
            input: {
                index: resolve(__dirname, 'index.html'),
                viewer: resolve(__dirname, 'viewer.html'),
                folder: resolve(__dirname, 'folder.html')
            }
        }
    }
});
