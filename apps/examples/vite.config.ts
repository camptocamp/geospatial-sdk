import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@geospatial-sdk/geocoding': fileURLToPath(new URL('../../packages/geocoding/dist', import.meta.url)),
      '@geospatial-sdk/openlayers': fileURLToPath(new URL('../../packages/openlayers/dist', import.meta.url))
    }
  },
  optimizeDeps: {
    include: ['@geospatial-sdk/geocoding', '@geospatial-sdk/openlayers'],
    exclude: []
  },
  base: "/geospatial-sdk"
});
