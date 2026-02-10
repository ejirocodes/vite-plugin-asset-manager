export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('render:html', (html) => {
    const config = useRuntimeConfig()
    const base =
      (config.public?.assetManager as { base?: string } | undefined)?.base ||
      '/__asset_manager__'

    html.bodyAppend.push(
      `<script>window.__VAM_BASE_URL__ = "${base}";</script>` +
        `<script type="module" src="${base}/floating-icon.js"></script>`
    )
  })
})
