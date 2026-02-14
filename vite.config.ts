import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // For Capacitor development, ensure proper CORS handling
    cors: true,
    strictPort: true,
    watch: {
      // For HMR to work with Capacitor
      usePolling: true,
    }
  },
  // Configure base path for deployment
  base: mode === 'production' ? '/booking/' : '/',
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
      "react-dom/client": path.resolve(__dirname, "node_modules/react-dom/client"),
      "react-dom/server": path.resolve(__dirname, "node_modules/react-dom/server"),
      "react/jsx-runtime": path.resolve(__dirname, "node_modules/react/jsx-runtime"),
      "react/jsx-dev-runtime": path.resolve(__dirname, "node_modules/react/jsx-dev-runtime"),
    },
    dedupe: [
      "react",
      "react-dom",
      "react-dom/client",
      "react-dom/server",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
    ],
  },
  optimizeDeps: {
    force: true,
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react-dom/server",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
    ],
  },
  build: {
    // Ensure proper output directory for Capacitor
    outDir: 'dist',
    emptyOutDir: true,
    // Generate source maps for debugging
    sourcemap: mode === 'development',
    // Optimize chunk splitting for mobile
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          'react-vendor': ['react', 'react-dom'],
          'radix-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'supabase-vendor': ['@supabase/supabase-js'],
        }
      }
    },
    // Target modern browsers but ensure mobile compatibility
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
      }
    }
  },
}));
