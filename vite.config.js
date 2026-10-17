import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// `@cloud-backend` is Firestore normally. CLOUD_MOCK=1 swaps in a local test
// server (test/mockBackend.js) so sync can be tested without touching real data.
const backend = process.env.CLOUD_MOCK ? './test/mockBackend.js' : './src/lib/cloud/firebaseBackend.js';

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 800, // the Firebase SDK chunk is ~700 kB
    rollupOptions: {
      output: {
        manualChunks: (id) => (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase') ? 'firebase' : undefined),
      },
    },
  },
  resolve: {
    alias: { '@cloud-backend': fileURLToPath(new URL(backend, import.meta.url)) },
  },
});
