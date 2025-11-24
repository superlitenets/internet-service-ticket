import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const plugins = [react()];

  // Only add express plugin in serve/dev mode to avoid importing server during build
  // Note: Commenting out due to Vite ESM/CommonJS compatibility issues with Prisma
  // if (mode === "development") {
  //   plugins.push(expressPlugin());
  // }

  return {
    server: {
      host: "::",
      port: 8080,
      fs: {
        allow: ["./client", "./shared"],
        deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
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
