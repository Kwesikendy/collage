import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
  },
  preview: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
