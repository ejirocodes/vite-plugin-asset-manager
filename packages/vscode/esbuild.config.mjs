import esbuild from 'esbuild'

const isWatch = process.argv.includes('--watch')

const ctx = await esbuild.context({
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  external: ['vscode', 'sharp', 'fsevents'],
  format: 'cjs',
  platform: 'node',
  target: 'node22',
  sourcemap: true,
  minify: !isWatch,
  loader: {
    '.wasm': 'file',
    '.node': 'file',
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
