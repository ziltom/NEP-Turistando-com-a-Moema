import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // O MapLibre carrega o proprio Web Worker via new URL(..., import.meta.url).
  // O pre-bundler do Vite quebra esse caminho, e o mapa fica em branco sem erro.
  // Excluir o pacote da otimizacao resolve.
  optimizeDeps: {
    exclude: ['maplibre-gl'],
  },
})
