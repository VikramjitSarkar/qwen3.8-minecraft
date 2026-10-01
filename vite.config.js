import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { port: 5274 },
  preview: { port: 4274 },
  build: {
    target: 'es2020',
  },
});
