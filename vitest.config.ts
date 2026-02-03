import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/e2e/**', // Playwright E2E tests run separately
        ],
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
})
