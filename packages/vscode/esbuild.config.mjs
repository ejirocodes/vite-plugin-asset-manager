import esbuild from 'esbuild'
import { readFileSync, copyFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const isWatch = process.argv.includes('--watch')

const ctx = await esbuild.context({
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  target: 'node22',
  sourcemap: true,
  minify: !isWatch,
  loader: {
    '.wasm': 'file',
  },
  assetNames: '[name]',
})

if (isWatch) {
  await ctx.watch()
  console.log('Watching...')
} else {
  await ctx.rebuild()
  await ctx.dispose()
}
