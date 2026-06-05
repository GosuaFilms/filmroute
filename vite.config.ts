import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React y su ecosistema
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/scheduler')) {
            return 'react';
          }
          // Supabase
          if (id.includes('node_modules/@supabase') || id.includes('node_modules/jose') || id.includes('node_modules/tr46') || id.includes('node_modules/whatwg-url')) {
            return 'supabase';
          }
          // Lucide icons
          if (id.includes('node_modules/lucide-react')) {
            return 'lucide';
          }
          // clsx
          if (id.includes('node_modules/clsx')) {
            return 'utils';
          }
        },
      },
    },
  },
})
