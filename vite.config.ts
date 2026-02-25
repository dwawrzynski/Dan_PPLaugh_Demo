import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// https://vitejs.dev/config/
export default defineConfig({
 // Setting base to '/' ensures Vercel looks in the root directory for your files
 base: '/',
 plugins: [react()],
}
