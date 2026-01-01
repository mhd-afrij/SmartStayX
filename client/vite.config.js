import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
  // Prevent accessing Server directory
  server: {
    port: 5173,
    fs: {
      deny: ['../Server']
    }
    // HMR will use default settings automatically - no explicit config needed
  }
})
