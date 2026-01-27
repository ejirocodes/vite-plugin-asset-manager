import type { Asset } from '../types'

export type SnippetType = 'html' | 'react' | 'vue'

export interface CodeSnippet {
  type: SnippetType
  label: string
  code: string
}

function getPublicPath(asset: Asset): string {
  if (asset.path.startsWith('public/')) {
    return '/' + asset.path.slice(7)
  }
  return '/' + asset.path
}

function getAltText(asset: Asset): string {
  return asset.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
}

function isPublicAsset(asset: Asset): boolean {
  return asset.path.startsWith('public/')
}

function generateImageSnippets(asset: Asset): CodeSnippet[] {
  const publicPath = getPublicPath(asset)
  const alt = getAltText(asset)
  const isPublic = isPublicAsset(asset)

  return [
    {
      type: 'html',
      label: 'Plain Image',
      code: `<img
  width="24"
  height="24"
  src="${publicPath}"
  alt="${alt}"
/>`,
    },
    {
      type: 'react',
      label: 'React',
      code: isPublic
        ? `<img src="${publicPath}" alt="${alt}" />`
        : `import ${asset.name.replace(/\.[^.]+$/, '').replace(/[-.\s]/g, '')} from '${asset.path}'

<img src={${asset.name.replace(/\.[^.]+$/, '').replace(/[-.\s]/g, '')}} alt="${alt}" />`,
    },
    {
      type: 'vue',
      label: 'Vue',
      code: isPublic
        ? `<template>
  <img src="${publicPath}" alt="${alt}" />
</template>`
        : `<script setup>
import ${asset.name.replace(/\.[^.]+$/, '').replace(/[-.\s]/g, '')} from '${asset.path}'
</script>

<template>
  <img :src="${asset.name.replace(/\.[^.]+$/, '').replace(/[-.\s]/g, '')}" alt="${alt}" />
</template>`,
    },
  ]
}

function generateVideoSnippets(asset: Asset): CodeSnippet[] {
  const publicPath = getPublicPath(asset)
  const isPublic = isPublicAsset(asset)

  return [
    {
      type: 'html',
      label: 'Plain HTML',
      code: `<video
  src="${publicPath}"
  controls
></video>`,
    },
    {
      type: 'react',
      label: 'React',
      code: isPublic
        ? `<video src="${publicPath}" controls />`
        : `import videoSrc from '${asset.path}'

<video src={videoSrc} controls />`,
    },
    {
      type: 'vue',
      label: 'Vue',
      code: isPublic
        ? `<template>
  <video src="${publicPath}" controls></video>
</template>`
        : `<script setup>
import videoSrc from '${asset.path}'
</script>

<template>
  <video :src="videoSrc" controls></video>
</template>`,
    },
  ]
}

function generateAudioSnippets(asset: Asset): CodeSnippet[] {
  const publicPath = getPublicPath(asset)
  const isPublic = isPublicAsset(asset)

  return [
    {
      type: 'html',
      label: 'Plain HTML',
      code: `<audio
  src="${publicPath}"
  controls
></audio>`,
    },
    {
      type: 'react',
      label: 'React',
      code: isPublic
        ? `<audio src="${publicPath}" controls />`
        : `import audioSrc from '${asset.path}'

<audio src={audioSrc} controls />`,
    },
    {
      type: 'vue',
      label: 'Vue',
      code: isPublic
        ? `<template>
  <audio src="${publicPath}" controls></audio>
</template>`
        : `<script setup>
import audioSrc from '${asset.path}'
</script>

<template>
  <audio :src="audioSrc" controls></audio>
</template>`,
    },
  ]
}

function generateFontSnippets(asset: Asset): CodeSnippet[] {
  const publicPath = getPublicPath(asset)
  const fontName = asset.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
  const format = asset.extension.replace('.', '')
  const formatMap: Record<string, string> = {
    woff2: 'woff2',
    woff: 'woff',
    ttf: 'truetype',
    otf: 'opentype',
    eot: 'embedded-opentype',
  }

  return [
    {
      type: 'html',
      label: 'CSS @font-face',
      code: `@font-face {
  font-family: '${fontName}';
  src: url('${publicPath}') format('${formatMap[format] || format}');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}`,
    },
    {
      type: 'react',
      label: 'React (CSS-in-JS)',
      code: `// In your global styles or CSS module
@font-face {
  font-family: '${fontName}';
  src: url('${publicPath}') format('${formatMap[format] || format}');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

// Usage
<span style={{ fontFamily: "'${fontName}'" }}>Text</span>`,
    },
    {
      type: 'vue',
      label: 'Vue',
      code: `<style>
@font-face {
  font-family: '${fontName}';
  src: url('${publicPath}') format('${formatMap[format] || format}');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}
</style>

<template>
  <span style="font-family: '${fontName}'">Text</span>
</template>`,
    },
  ]
}

function generateDataSnippets(asset: Asset): CodeSnippet[] {
  const publicPath = getPublicPath(asset)
  const isPublic = isPublicAsset(asset)

  return [
    {
      type: 'html',
      label: 'Fetch',
      code: `fetch('${publicPath}')
  .then(res => res.json())
  .then(data => console.log(data))`,
    },
    {
      type: 'react',
      label: 'React',
      code: isPublic
        ? `const [data, setData] = useState(null)

useEffect(() => {
  fetch('${publicPath}')
    .then(res => res.json())
    .then(setData)
}, [])`
        : `import data from '${asset.path}'

// Use directly
console.log(data)`,
    },
    {
      type: 'vue',
      label: 'Vue',
      code: isPublic
        ? `<script setup>
import { ref, onMounted } from 'vue'

const data = ref(null)

onMounted(async () => {
  const res = await fetch('${publicPath}')
  data.value = await res.json()
})
</script>`
        : `<script setup>
import data from '${asset.path}'
</script>`,
    },
  ]
}

function generateGenericSnippets(asset: Asset): CodeSnippet[] {
  const publicPath = getPublicPath(asset)

  return [
    {
      type: 'html',
      label: 'Link',
      code: `<a href="${publicPath}" download="${asset.name}">
  Download ${asset.name}
</a>`,
    },
    {
      type: 'react',
      label: 'React',
      code: `<a href="${publicPath}" download="${asset.name}">
  Download {asset.name}
</a>`,
    },
    {
      type: 'vue',
      label: 'Vue',
      code: `<template>
  <a href="${publicPath}" download="${asset.name}">
    Download ${asset.name}
  </a>
</template>`,
    },
  ]
}

export function generateCodeSnippets(asset: Asset): CodeSnippet[] {
  switch (asset.type) {
    case 'image':
      return generateImageSnippets(asset)
    case 'video':
      return generateVideoSnippets(asset)
    case 'audio':
      return generateAudioSnippets(asset)
    case 'font':
      return generateFontSnippets(asset)
    case 'data':
      return generateDataSnippets(asset)
    default:
      return generateGenericSnippets(asset)
  }
}
