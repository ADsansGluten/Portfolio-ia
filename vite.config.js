import { defineConfig } from 'vite';

// base: './' => fonctionne sur Vercel, Netlify ET GitHub Pages (sous-dossier /nom-du-repo/)
export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // Three.js dans un chunk séparé, chargé en différé par le hero
        manualChunks: { three: ['three'], gsap: ['gsap', 'gsap/ScrollTrigger'] },
      },
    },
  },
});
