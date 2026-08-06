import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: '0.0.0.0', 
    port: 5173,
    // Mobile & Network Access
    strictPort: false, // Automatically try next available port
    // Enable hot reload on mobile devices
    watch: {
      usePolling: true, // Better for some network setups
      interval: 1000
    }
  },
  // Mobile & Performance Optimizations
  build: {
    target: 'es2020', // Better compatibility for older mobile browsers
    cssMinify: 'lightningcss', // Faster CSS processing
    minify: 'terser', // More aggressive JS minification
    sourcemap: true, // Enable source maps for better debugging
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks for better caching
          'react-vendor': ['react', 'react-dom'],
          'leaflet-vendor': ['leaflet', 'react-leaflet'],
          'ui-vendor': ['lucide-react', 'react-hot-toast']
        }
      }
    }
  },
  // Enable mobile debugging
  esbuild: {
    sourcemap: true
  },
  // Optimize for mobile development
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'leaflet',
      'react-leaflet',
      'lucide-react',
      'react-hot-toast'
    ],
    exclude: [] // Nothing to exclude
  },
  // Better error reporting
  css: {
    devSourcemap: true
  }
})