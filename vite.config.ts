import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      '/earn-api': {
        target: 'https://earn.li.fi',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/earn-api/, ''),
      },
      '/lifi-composer': {
        target: 'https://li.quest',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/lifi-composer/, ''),
      },
    },
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimize chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate heavy vendor chunks
          'vendor-wagmi': ['wagmi', 'viem'],
          'vendor-rainbowkit': ['@rainbow-me/rainbowkit'],
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-radix': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-tooltip',
          ],
        },
      },
    },
    // Reduce chunk size warnings threshold
    chunkSizeWarningLimit: 600,
    // Enable minification optimizations
    minify: 'esbuild' as const,
    // Target modern browsers for smaller bundle
    target: 'es2020',
  },
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: ['wagmi', 'viem', '@rainbow-me/rainbowkit'],
  },
}));
