import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { execSync } from 'child_process'

const commitHash = (() => {
  try { return execSync('git rev-parse --short HEAD').toString().trim() } catch { return 'dev' }
})()

const buildNumber = (() => {
  try { return execSync('git rev-list --count HEAD').toString().trim() } catch { return '0' }
})()

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __COMMIT__: JSON.stringify(commitHash),
    __BUILD__: JSON.stringify(buildNumber),
  },
})
