import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy all /api requests to the Voice Gateway backend
      // This bypasses CORS during local development
      '/api': {
        target: 'http://185.14.252.20:8001',
        changeOrigin: true,
        // No rewrite — gateway expects the full /api/chat, /api/translate, etc. paths
      },
      // Proxy all other root endpoints to bypass CORS on localhost with custom ports (e.g. 5174)
      ...[
        '/conversations',
        '/documents',
        '/signup',
        '/verify-otp',
        '/login',
        '/profile',
        '/voices',
        '/text-to-speech',
        '/speech-to-text',
        '/jobs',
        '/health',
        '/translate'
      ].reduce((acc, route) => {
        acc[route] = {
          target: 'http://185.14.252.20:8001',
          changeOrigin: true,
        };
        return acc;
      }, {}),
      // Proxy the WebSocket translation stream
      '/ws/translate': {
        target: 'http://185.14.252.20:8001',
        changeOrigin: true,
        ws: true,
      },
      // Proxy the live voice-translation WebSocket (mic audio → STT → translate)
      '/ws/voice-translate': {
        target: 'http://185.14.252.20:8001',
        changeOrigin: true,
        ws: true,
      }
    },
  },
})
