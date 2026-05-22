import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// Custom plugin to stub missing admin folder during remote builds (e.g., Vercel)
const adminStubPlugin = () => {
  const adminDirPath = path.resolve(__dirname, 'src/admin')
  const hasAdmin = fs.existsSync(adminDirPath)

  return {
    name: 'vite-plugin-admin-stub',
    enforce: 'pre',
    resolveId(source) {
      if (!hasAdmin && (source.includes('/admin/') || source.startsWith('./admin/') || source.startsWith('../admin/'))) {
        return '\0virtual:admin-stub'
      }
      return null
    },
    load(id) {
      if (id === '\0virtual:admin-stub') {
        return `
          import React from 'react';
          export default function DummyAdminComponent() {
            return React.createElement('div', { style: { padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' } }, 'Admin Panel is not available in this deployment.');
          }
        `
      }
      return null
    }
  }
}

export default defineConfig({
  plugins: [adminStubPlugin(), react()],

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