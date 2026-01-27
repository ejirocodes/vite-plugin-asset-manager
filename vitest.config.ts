/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/ui': path.resolve(__dirname, './src/ui')
    }
  },
  test: {
    globals: true,
    watch: false,
    reporters: ['default'],
    include: ['tests/**/*.test.ts', 'src/**/*.test.{ts,tsx}'],
    environment: 'node',
    environmentMatchGlobs: [
      ['src/ui/**/*.test.{ts,tsx}', 'jsdom']
    ],
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 10000,
    hookTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'src/server/**/*.ts',
        'src/shared/**/*.ts',
        'src/plugin.ts',
        'src/ui/**/*.{ts,tsx}'
      ],
      exclude: [
        'node_modules',
        'dist',
        'playground',
        '**/*.d.ts',
        'tests/**',
        'src/ui/components/ui/**',
        '**/*.config.*',
        '**/*.test.{ts,tsx}'
      ]
    }
  }
})
