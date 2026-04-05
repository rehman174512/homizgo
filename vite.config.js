import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    host: true,
    allowedHosts: true,
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          seo: ['react-helmet-async'],
          ui: ['lucide-react', 'clsx', 'tailwind-merge'],
          gsap: ['gsap'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
})