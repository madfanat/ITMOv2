import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { classificationApi } from './server/api.mjs';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    {
      name: 'classification-api',
      configureServer(server) {
        server.middlewares.use(classificationApi(loadEnv(mode, process.cwd(), 'N8N_')));
      },
    },
  ],
}));
