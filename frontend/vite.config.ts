/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'
import { fileURLToPath, URL } from 'node:url'

// Performance budgets (in KB gzipped)
const PERFORMANCE_BUDGETS = {
  // Total JS budget
  totalJS: 250,
  // Total CSS budget
  totalCSS: 50,
  // Individual chunk budgets
  chunks: {
    'vendor-react': 80,
    'vendor-router': 20,
    'vendor-query': 15,
    'vendor-ui': 40,
    'vendor-charts': 30,
    'vendor-grid': 50,
    'vendor-pdf': 25,
  },
}

function checkBudgets(bundle: any): void {
  if (process.env.CI !== 'true') return
  
  let hasViolations = false
  
  for (const [chunkName, budget] of Object.entries(PERFORMANCE_BUDGETS.chunks)) {
    const chunk = bundle[chunkName]
    if (chunk && chunk.gzipSize > budget * 1024) {
      console.error(`❌ Budget exceeded: ${chunkName} (${(chunk.gzipSize / 1024).toFixed(1)}KB > ${budget}KB)`)
      hasViolations = true
    }
  }
  
  if (hasViolations) {
    process.exitCode = 1
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap',
    }),
  ],
  base: './',
  // Keep React and React DOM on one module instance. This prevents invalid-hook-call
  // failures when dependencies are linked or installed through differing paths.
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['react-router-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-ui': ['lucide-react', 'framer-motion', 'clsx', 'tailwind-merge', 'class-variance-authority'],
          'vendor-charts': ['chart.js'],
          'vendor-grid': ['ag-grid-community', 'ag-grid-react'],
          'vendor-pdf': ['pdfmake', 'html2canvas'],
        },
      },
    },
    // Enable source maps for production debugging
    sourcemap: true,
    // Report chunk sizes
    reportCompressedSize: true,
    chunkSizeWarningLimit: 500,
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    proxy: { '/api': { target: 'http://127.0.0.1:5000', changeOrigin: true } },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.test.{ts,tsx,js,jsx}', 'src/**/*.spec.{ts,tsx,js,jsx}'],
  },
})
