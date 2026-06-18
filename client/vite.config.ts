import { resolve } from 'path';
import { fileURLToPath } from 'url';

import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendUrl = env.VITE_BACKEND_URL || 'http://localhost:5242';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        'react-transition-group/TransitionGroupContext': resolve(
          __dirname,
          'node_modules/react-transition-group/cjs/TransitionGroupContext.js',
        ),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
        '/health': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './vitest.setup.ts',
      css: true,
      exclude: ['e2e/**', 'node_modules/**'],
      server: {
        deps: {
          inline: [/@mui\/material/, /@emotion\//, /react-transition-group/],
        },
      },
    },
  };
});
