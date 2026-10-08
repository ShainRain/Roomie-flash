import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base keeps the build static-deploy friendly under any sub-path.
  base: './',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0
  },
  server: {
    port: 5173
  },
  preview: {
    port: 4173
  }
});
