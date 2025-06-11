import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path'; 

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'VuePolygonDrawer',
      fileName: (format) => `vue-polygon-drawer.${format}.js`,

      formats: ['es', 'umd', 'cjs'],
    },
    rollupOptions: {

      external: ['vue'],
      output: {

        globals: {
          vue: 'Vue',
        },
      },
    },
 
    cssCodeSplit: true,
  },
});