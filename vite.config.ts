import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env dari .env, .env.development, dll
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],

    // Pastikan base adalah root (penting untuk Netlify)
    base: '/',

    server: {
      port: 3000,
      host: '0.0.0.0',
    },

    // Hanya define variabel yang dimulai dengan VITE_
    define: {
      // Gunakan VITE_ agar bisa diakses di browser
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'), // Lebih baik ke src, bukan root
      },
    },

    build: {
      outDir: 'dist',
      sourcemap: true, // Opsional, bantu debug di produksi
    },
  };
});
