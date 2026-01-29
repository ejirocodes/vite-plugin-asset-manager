/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const sharedConfig = {
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/ui': path.resolve(__dirname, './src/ui')
    }
  }
}

export default defineConfig({
  plugins: [react()],
  ...sharedConfig,
  test: {
    globals: true,
    watch: false,
    reporters: ['default'],
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 5000,
    pool: 'threads',
    projects: [
      {
        ...sharedConfig,
        test: {
          name: 'server',
          globals: true,
          environment: 'node',
          include: ['tests/**/*.test.ts'],
          setupFiles: ['./tests/setup.ts'],
          pool: 'threads'
        }
      },
      {
        ...sharedConfig,
        plugins: [react()],
        test: {
          name: 'ui',
          globals: true,
          environment: 'jsdom',
          include: ['src/ui/**/*.test.{ts,tsx}'],
          setupFiles: ['./tests/setup.ts', './tests/setup-ui.ts'],
          pool: 'threads'
        }
      }
    ],
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
