import { defineConfig } from 'vite'
import browserslistToEsbuild from 'browserslist-to-esbuild'
import { preact } from '@preact/preset-vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [preact()],
  build: { target: browserslistToEsbuild() }
})
