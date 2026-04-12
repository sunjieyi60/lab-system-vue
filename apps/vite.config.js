import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": resolve(process.cwd(), "src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: " http://10.230.80.109:8088", //校园网下用 http://10.230.80.109:8088 皎月内穿用 http://10.6.22.2:8088

        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
