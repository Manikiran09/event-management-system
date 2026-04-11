import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const host = env.VITE_HOST || "0.0.0.0";
  const port = Number(env.VITE_PORT || 5173);
  const previewPort = Number(env.VITE_PREVIEW_PORT || 4173);
  const devApiProxy = env.VITE_DEV_API_PROXY || "http://localhost:5112";

  return {
    base: env.VITE_BASE_PATH || "/",
    plugins: [react()],
    server: {
      host,
      port,
      strictPort: true,
      proxy: {
        "/api": devApiProxy,
      },
    },
    preview: {
      host,
      port: previewPort,
      strictPort: true,
    },
  };
});
