import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: VITE_API_BASE_URL,
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
