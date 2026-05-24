import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const apiProxyTarget = process.env.VITE_PROXY_TARGET || "http://127.0.0.1:8000";

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ["zeravue.com", "www.zeravue.com", "42222.cloud", "localhost"],
    proxy: {
      "/api": apiProxyTarget
    }
  }
});
