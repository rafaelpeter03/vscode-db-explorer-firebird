import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],
  base: '', // Use relative paths for assets
  build: {
    outDir: '../out/result-view/htmlContent',
    emptyOutDir: true,
    chunkSizeWarningLimit: 2000,
  }
})
