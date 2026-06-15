import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const frontendPort = Number(process.env.VITE_PORT || 5173)
const backendPort = Number(process.env.VITE_BACKEND_PORT || 3001)

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: { app: 'index.html' },
    },
  },
  server: {
    host: '127.0.0.1',
    port: frontendPort,
    strictPort: true,
    watch: {
      ignored: ['**/.env', '**/.env.*'],
    },
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${backendPort}`,
        changeOrigin: true,
      },
      '/ws': {
        target: `ws://127.0.0.1:${backendPort}`,
        ws: true,
      },
    },
  },
})
