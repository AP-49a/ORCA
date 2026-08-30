import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: path.resolve(__dirname, 'src/main/index.ts'),
        onstart(options) {
          // Launch / re-launch Electron every time the main process rebuilds in dev
          options.startup();
        },
        vite: {
          build: {
            outDir: path.resolve(__dirname, 'dist-electron/main'),
            rollupOptions: {
              external: ['electron', 'fs', 'path', 'os', 'child_process', 'events'],
            },
          },
        },
      },
      {
        onstart(options) {
          options.reload();
        },
        vite: {
          build: {
            lib: {
              entry: path.resolve(__dirname, 'src/preload/index.ts'),
              formats: ['cjs'],
              fileName: () => 'index.cjs',
            },
            outDir: path.resolve(__dirname, 'dist-electron/preload'),
            rollupOptions: {
              external: ['electron'],
            },
          },
        },
      },
    ]),
    renderer(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer/src'),
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
  root: path.resolve(__dirname, 'src/renderer'),
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
});
