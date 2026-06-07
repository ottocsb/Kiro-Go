import path from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

// 管理面板挂载在 /admin 下，构建产物直接输出到 ../web 供 Go 后端磁盘托管
// https://vite.dev/config/
export default defineConfig({
  base: "/admin/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "../web",
    emptyOutDir: true,
  },
})
