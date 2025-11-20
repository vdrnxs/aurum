import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-tremor': ['@tremor/react'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-indicators': ['indicatorts'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})
