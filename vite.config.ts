import { defineConfig } from 'vite'

// Dynamically import ESM-only plugins to avoid `require` loading errors
export default defineConfig(async () => {
  const reactPluginModule = await import('@vitejs/plugin-react')
  const react = reactPluginModule.default || reactPluginModule
  return {
    plugins: [react()],
  }
})
