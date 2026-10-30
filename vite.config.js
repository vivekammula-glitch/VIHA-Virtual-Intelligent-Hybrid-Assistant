import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/xai': {
          target: 'https://generativelanguage.googleapis.com',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/xai\/v1/, '/v1beta/openai'),
          headers: { Authorization: `Bearer ${env.GEMINI_API_KEY}` },
        },
      },
    },
  };
});