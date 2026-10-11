import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss()],
  base: './',
  publicDir: false,
  build: {
    outDir: 'public/assets/css',
    emptyOutDir: false,
    cssCodeSplit: false,
    lib: {
      entry: 'institution-login-entry.js',
      formats: ['es'],
      fileName: 'institution-login-bundle',
      cssFileName: 'institution-login',
    },
  },
});
