import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
    tailwindcss()
  ],
  server: {
    proxy: {
      '/api': {
        // Use 127.0.0.1 — on Windows, localhost may resolve to ::1 where Docker often binds :3000
        target: process.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
})
