import { defineConfig } from 'vite'
import laravel from 'laravel-vite-plugin'
import react from '@vitejs/plugin-react' // Switched from SWC to avoid WASM memory issues
import * as path from 'path' // ✅ FIX: import path

export default defineConfig({
  // Optimize for memory usage
  esbuild: {
    // Reduce memory usage during transformation
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  },
  plugins: [
    laravel({
      input: ['resources/css/app.css', 'resources/js/app.tsx'],
      refresh: false,
    }),
    react({
      // Keep Fast Refresh enabled for better development experience
      fastRefresh: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'resources/js'),
    },
    dedupe: ["react", "react-dom"],
  },
  build: {
    sourcemap: false,
    minify: 'terser',
    // Reduce memory usage during build
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      // Optimize memory usage
      maxParallelFileOps: 2,
      output: {
        // Fixed chunking strategy - React must load first
        manualChunks(id) {
          // Critical: Keep React, ReactDOM, and Inertia together in the first vendor chunk
          // This prevents "Cannot read properties of undefined (reading 'forwardRef')" errors
          if (id.includes('node_modules/react') ||
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/scheduler') ||
              id.includes('@inertiajs/react')) {
            return 'react-vendor';
          }
          // Separate large UI libraries
          if (id.includes('@radix-ui')) {
            return 'radix-ui';
          }
          if (id.includes('@fullcalendar')) {
            return 'fullcalendar';
          }
          if (id.includes('chart.js') || id.includes('react-chartjs-2') || id.includes('recharts')) {
            return 'charts';
          }
          if (id.includes('framer-motion')) {
            return 'framer-motion';
          }
          // Everything else from node_modules goes to vendor
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        // Reduce chunk size
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      },
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
})
