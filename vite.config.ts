import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const devPort = Number(env.DEV_PORT ?? 5174);
  const devHost = env.DEV_HOST ?? '0.0.0.0';
  const proxyTarget = env.DEV_PROXY_TARGET ?? 'http://localhost:3000';
  const proxyPrefix = env.DEV_PROXY_PREFIX ?? '/api';

  return {
    base: './',
    plugins: [
      react(),
      tailwindcss(),
    ].filter(Boolean),
    server: {
      port: devPort,
      host: devHost,
      proxy: {
        [proxyPrefix]: {
          target: proxyTarget,
          changeOrigin: true,
        },
        '/api/socket.io': {
          target: proxyTarget,
          ws: true,
          changeOrigin: true,
          rewriteWsOrigin: true,
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@context': path.resolve(__dirname, './src/context'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@data': path.resolve(__dirname, './src/data'),
        '@components': path.resolve(__dirname, './src/components'),
        '@ui': path.resolve(__dirname, './src/components/ui'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@config': path.resolve(__dirname, './src/config'),
      },
    },
  };
})
