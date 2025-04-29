import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: './',
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020'
    }
  },
  resolve: {
    alias: {
      'firebase/app': '/node_modules/firebase/app/dist/esm/index.esm.js',
      'firebase/firestore': '/node_modules/firebase/firestore/dist/esm/index.esm.js'
    }
  },
  css: {
    preprocessorOptions: {
      css: {
        import: true,
      },
    },
  },
});