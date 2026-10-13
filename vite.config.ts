import vue from '@vitejs/plugin-vue';
import { defineConfig, loadEnv } from 'vite';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'RENATUS_');
  return {
    plugins: [vue()],
    appType: 'spa',
    server: {
      port: 5173,
      strictPort: true,
      proxy: { '/api': { target: env['RENATUS_API_TARGET'] ?? 'http://localhost:5294', changeOrigin: true } },
    },
    preview: { port: 4173, strictPort: true },
  };
});
