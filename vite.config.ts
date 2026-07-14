import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load .env.local (and .env) into `env` so proxy config can read VITE_* vars
  const env = loadEnv(mode, process.cwd(), '')

  const gatewayUrl = env.VITE_OPENWEBUI_URL || 'http://localhost:18789'
  const apiKey = env.VITE_OPENWEBUI_API_KEY || ''

  return {
    plugins: [react()],
    server: {
      // Add your deployment host here if serving the dev server behind a domain,
      // e.g. ['dashboard.example.com']. Empty = localhost only.
      allowedHosts: [],
      watch: {
        // Ignore live data files — TanStack Query handles polling, HMR reload is redundant
        ignored: ['**/public/data/**'],
      },
      proxy: {
        '/v1': {
          target: gatewayUrl,
          changeOrigin: true,
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        },
      },
    },
  }
})
