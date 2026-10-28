import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    // Build directly into the repo root www/ folder, alongside PHP files
    outDir: resolve(__dirname, '../www'),
    emptyOutDir: false,  // do NOT wipe api.php/db.php/config.php
  },
  server: {
    // During dev: proxy /api.php to local PHP server
    proxy: {
      '/api.php': 'http://localhost:8000',
    },
  },
})
