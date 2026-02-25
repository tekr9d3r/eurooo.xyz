import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Stub out unused non-EVM ecosystems to prevent heavy transitive deps
      "@mysten/dapp-kit": path.resolve(__dirname, "./src/stubs/mysten-dapp-kit.ts"),
      "@solana/wallet-adapter-react": path.resolve(__dirname, "./src/stubs/solana-wallet-adapter.ts"),
      "@solana/wallet-adapter-base": path.resolve(__dirname, "./src/stubs/solana-wallet-adapter-base.ts"),
      "@bigmi/react": path.resolve(__dirname, "./src/stubs/bigmi-react.ts"),
      "@bigmi/client": path.resolve(__dirname, "./src/stubs/bigmi-client.ts"),
    },
  },
  build: {
    // Optimize chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
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
    minify: 'esbuild',
    // Target modern browsers for smaller bundle
    target: 'es2020',
  },
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: ['wagmi', 'viem', '@rainbow-me/rainbowkit'],
  },
}));
