import vue from '@vitejs/plugin-vue';
import { defineConfig, loadEnv } from 'vite';
import zhCN from './src/locales/zh_CN.json';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'RENATUS_');
  return {
    plugins: [
      vue(),
      {
        name: 'renatus-html-localization',
        transformIndexHtml(html) {
          const messages = {
            __I18N_TITLE__: zhCN.messages['app.name'],
            __I18N_DESCRIPTION__: zhCN.messages['app.description'],
            __I18N_JAVASCRIPT_REQUIRED__: zhCN.messages['app.javascriptRequired'],
          };
          for (const [marker, value] of Object.entries(messages)) {
            const escaped = value
              .replaceAll('&', '&amp;')
              .replaceAll('<', '&lt;')
              .replaceAll('>', '&gt;')
              .replaceAll('"', '&quot;');
            html = html.replaceAll(marker, escaped);
          }
          return html;
        },
      },
    ],
    appType: 'spa',
    server: {
      port: 5173,
      strictPort: true,
      proxy: { '/api': { target: env['RENATUS_API_TARGET'] ?? 'http://localhost:5294', changeOrigin: true } },
    },
    preview: { port: 4173, strictPort: true },
  };
});
