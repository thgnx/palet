import { defineConfig } from 'vite';

export default defineConfig({
  // Ensures colorthief can load properly
  optimizeDeps: {
    include: ['colorthief', 'html2canvas'],
  },
});
