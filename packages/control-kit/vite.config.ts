import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ControlKit',
      fileName: (format) => `control-kit.${format}.js`,
    },
    rollupOptions: {
      // 外部依赖，不打包到库中
      external: ['vue'],
      output: {
        // 全局变量映射
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
})
