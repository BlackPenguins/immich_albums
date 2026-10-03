import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 15100
    },

    preview: {
        port: 15100,
        host: '0.0.0.0',
        allowedHosts: ['albums.penguinore.net']
    }
})
