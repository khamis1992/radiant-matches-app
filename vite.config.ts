import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 82,
    // For Capacitor development, ensure proper CORS handling
    cors: true,
    strictPort: true,
    watch: {
      // For HMR to work with Capacitor
      usePolling: true,
    }
  },
  // Use root base path for deployment
  base: '/',
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
        // Function form: react/react-dom are aliased to absolute paths above,
        // so name-based matching never works. Match normalized module IDs instead.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          const p = id.replace(/\\/g, "/");
          if (/node_modules\/(react|react-dom|scheduler)\//.test(p)) return "react-vendor";
          if (p.includes("@supabase") || p.includes("websocket") && p.includes("phoenix")) return "supabase-vendor";
          if (p.includes("@radix-ui")) return "radix-vendor";
          if (p.includes("recharts") || /node_modules\/d3-/.test(p) || p.includes("victory-vendor")) return "charts-vendor";
          if (p.includes("leaflet") || p.includes("react-leaflet") || p.includes("maplibre")) return "map-vendor";
          if (p.includes("embla-carousel")) return "carousel-vendor";
          if (p.includes("lottie")) return "lottie-vendor";
          if (p.includes("@phosphor-icons")) return "phosphor-icons";
          if (p.includes("lucide-react")) return "lucide-icons";
          if (p.includes("date-fns")) return "date-vendor";
        },
      },
    },
    // es2020 required by maplibre-gl (BigInt literals); safe for all
    // Capacitor-supported WebViews (Android 10+ / iOS 14+)
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
      }
    }
  },
}));
