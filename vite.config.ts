import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // Importe o plugin do Tailwind

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(), // Mantenha o plugin do React
    tailwindcss(), // Adicione o plugin do Tailwind
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})