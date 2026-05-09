import { defineConfig } from 'vite';

export default defineConfig({
  base: '/HeroOfNVVH/',
  server: {
    port: 3000,
    strictPort: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
  },
  publicDir: 'public',
});
