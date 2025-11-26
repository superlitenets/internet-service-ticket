import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const plugins = [react()];

  // Disabled: Express plugin causes bcrypt native module issues
  // For development, run frontend and backend separately:
  // Terminal 1: pnpm run dev (frontend only - Vite)
  // Terminal 2: pnpm run dev:backend (backend)
  // if (mode === "development") {
  //   plugins.push(expressPlugin());
  // }

  return {
    server: {
      host: "0.0.0.0",
      port: 5173,
      fs: {
        allow: ["./client", "./shared"],
        deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**"],
      },
    },
    build: {
      outDir: "dist/spa",
      rollupOptions: {
        external: ["@prisma/client"],
      },
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "client"),
        "@shared": path.resolve(__dirname, "shared"),
      },
    },
  };
});

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve",
    async configureServer(server) {
      // Dynamically import server only when this plugin runs (dev mode only)
      const { createServer } = await import("./server");
      const app = createServer();
      server.middlewares.use(app);
    },
  };
}
