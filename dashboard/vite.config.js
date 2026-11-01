import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Port 5174 so the dashboard can run next to the traveller app (5173).
export default defineConfig({
  plugins: [react()],
  server: { port: 5174 },
});
