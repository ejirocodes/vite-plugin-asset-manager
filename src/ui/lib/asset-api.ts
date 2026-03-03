import { getTransport } from './transport'

export async function openAssetInEditor(assetPath: string): Promise<void> {
  const data = await getTransport().getImporters(assetPath)
  if (data.importers.length > 0) {
    const firstImporter = data.importers[0]
    await getTransport().openInEditor(firstImporter.filePath, firstImporter.line, firstImporter.column)
  }
}

export async function revealAssetInFinder(assetPath: string): Promise<void> {
  await getTransport().revealInFinder(assetPath)
}
