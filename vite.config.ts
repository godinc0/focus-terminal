import { defineConfig } from 'vite'
import { crx } from '@crxjs/vite-plugin'
import manifest from './public/config.json'

export default defineConfig({
  plugins: [crx({ manifest })],
  build: {
    rollupOptions: {
      input: {
        dashboard: 'src/interface/dashboard.html',
        interceptor: 'src/pages/interceptor.html'
      }
    }
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173
    }
  }
})