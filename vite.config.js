import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// `@cloud-backend` is Firestore normally. CLOUD_MOCK=1 swaps in a local test
// server (test/mockBackend.js) so sync can be tested without touching real data.
const backend = process.env.CLOUD_MOCK ? './test/mockBackend.js' : './src/lib/cloud/firebaseBackend.js';

export default defineConfig({
  plugins: [react()],
  build: { chunkSizeWarningLimit: 700 }, // the lazily-loaded Firestore SDK chunk is ~600 kB
  resolve: {
    alias: { '@cloud-backend': fileURLToPath(new URL(backend, import.meta.url)) },
  },
});
