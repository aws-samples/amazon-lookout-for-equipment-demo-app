import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/tests/setup.js',
    },
    resolve: {
        alias: [
        {
            find: './runtimeConfig',
            replacement: './runtimeConfig.browser' // ensures browser compatible version of AWS JS SDK is used
        }
        ]
    },
    server: {
        port: 5173,
        host: '127.0.0.1'
    }
})