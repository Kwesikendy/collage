import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type Plugin } from 'vite';
import { createNeonApiMiddleware } from './src/server/api-middleware';

function neonDatabaseApiPlugin(): Plugin {
  const middleware = createNeonApiMiddleware();
  return {
    name: 'collat-neon-database-api',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}

export default defineConfig({
  plugins: [neonDatabaseApiPlugin(), react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@workspace/api-client-react': path.resolve(
        import.meta.dirname,
        'src/lib/api-client/index.ts',
      ),
      '@clerk/react/internal': path.resolve(
        import.meta.dirname,
        'src/lib/clerk-stub.tsx',
      ),
      '@clerk/react': path.resolve(
        import.meta.dirname,
        'src/lib/clerk-stub.tsx',
      ),
      '@clerk/themes': path.resolve(
        import.meta.dirname,
        'src/lib/clerk-stub.tsx',
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 3000,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    },
  },
  preview: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: true,
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    },
  },
});
