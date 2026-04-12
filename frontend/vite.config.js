import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Dev server settings
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  // Production preview server settings (used for Render deployment)
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: ['all'],
  },
})
