
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // The third parameter '' means load ALL env vars, not just those starting with VITE_
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
    },
    define: {
      // This matches the code reference "process.env.API_KEY"
      // It effectively replaces usages of process.env.API_KEY with the actual string value during build
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});
