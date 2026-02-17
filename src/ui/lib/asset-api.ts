import { getApiBase } from './api-base'

export async function openAssetInEditor(assetPath: string): Promise<void> {
  const response = await fetch(
    `${getApiBase()}/api/importers?path=${encodeURIComponent(assetPath)}`
  )
  if (!response.ok) return

  const data = await response.json()
  if (data.importers && data.importers.length > 0) {
    const firstImporter = data.importers[0]
    await fetch(
      `${getApiBase()}/api/open-in-editor?file=${encodeURIComponent(firstImporter.filePath)}&line=${firstImporter.line}&column=${firstImporter.column}`,
      { method: 'POST' }
    )
  }
}

export async function revealAssetInFinder(assetPath: string): Promise<void> {
  await fetch(
    `${getApiBase()}/api/reveal-in-finder?path=${encodeURIComponent(assetPath)}`,
    { method: 'POST' }
  )
}
