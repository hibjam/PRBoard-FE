import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Proxy only used in local dev — in production, VITE_API_BASE points to Render
    proxy: {
      '/users':      'http://localhost:8080',
      '/stats':      'http://localhost:8080',
      '/activities': 'http://localhost:8080',
      '/auth':       'http://localhost:8080',
      '/callback':   'http://localhost:8080',
      '/disciplines':'http://localhost:8080',
      '/import':     'http://localhost:8080',
    }
  }
})