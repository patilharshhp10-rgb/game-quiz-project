import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  // turn off overlay if you want:
  // server: { hmr: { overlay: false } }
})
