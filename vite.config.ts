import path from 'path';
import react from '@vitejs/plugin-react'; // Make sure to import the react plugin
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      // --- ADD THIS LINE ---
      base: '/GalExpl3D/', 
      
      // --- ADD THE PLUGINS ARRAY ---
      plugins: [react()], 
      
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});