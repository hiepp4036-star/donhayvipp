import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'esbuild',
    target: 'es2022',
    cssCodeSplit: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html')
      },
      output: {
        manualChunks: {
          'vendor-crypto': ['zod'],
          'vendor-idb': ['idb'],
          'vendor-qrcode': ['qrcode']
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true,
    headers: {
      'Service-Worker-Allowed': '/'
    }
  },
  preview: {
    port: 4173
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@core': resolve(__dirname, 'src/core'),
      '@components': resolve(__dirname, 'src/components'),
      '@assets': resolve(__dirname, 'src/assets')
    }
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  }
});