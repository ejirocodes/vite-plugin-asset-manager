import type { IncomingMessage, ServerResponse } from 'http'
import type { ParsedUrlQuery } from 'querystring'
import fs from 'fs'
import type { ImporterScanner } from '../../services/importer-scanner.js'
import { launchEditor } from '../../services/editor-launcher.js'
import { revealInFileExplorer } from '../../services/file-revealer.js'
import type { EditorType } from '../../types/index.js'
import { sendJson, validateFilePath } from '../utils.js'
import { AssetManagerError } from '../../errors.js'

export function handleGetImporters(
  res: ServerResponse,
  importerScanner: ImporterScanner,
  query: ParsedUrlQuery
): void {
  const assetPath = query.path as string
  if (!assetPath) {
    res.statusCode = 400
    sendJson(res, { error: 'Missing path parameter' })
    return
  }

  const importers = importerScanner.getImporters(assetPath)
  sendJson(res, { importers, total: importers.length })
}

export async function handleOpenInEditor(
  req: IncomingMessage,
  res: ServerResponse,
  root: string,
  editor: EditorType,
  query: ParsedUrlQuery
): Promise<void> {
  if (req.method !== 'POST') {
    res.statusCode = 405
    sendJson(res, { error: 'Method not allowed' })
    return
  }

  const validated = validateFilePath(root, query.file as string)
  if ('error' in validated) {
    res.statusCode = validated.status
    sendJson(res, { error: validated.error })
    return
  }

  const { absolutePath } = validated
  const line = parseInt(query.line as string) || 1
  const column = parseInt(query.column as string) || 1

  try {
    await fs.promises.access(absolutePath, fs.constants.R_OK)
  } catch {
    res.statusCode = 404
    sendJson(res, { error: 'File not found' })
    return
  }

  try {
    await launchEditor(absolutePath, line, column, editor)
    sendJson(res, { success: true })
  } catch (error) {
    throw new AssetManagerError(
      error instanceof Error ? error.message : 'Failed to open editor',
      500,
      'INTERNAL_ERROR',
      { handler: 'open-in-editor', file: absolutePath }
    )
  }
}

export async function handleRevealInFinder(
  req: IncomingMessage,
  res: ServerResponse,
  root: string,
  query: ParsedUrlQuery
): Promise<void> {
  if (req.method !== 'POST') {
    res.statusCode = 405
    sendJson(res, { error: 'Method not allowed' })
    return
  }

  const validated = validateFilePath(root, query.path as string)
  if ('error' in validated) {
    res.statusCode = validated.status
    sendJson(res, { error: validated.error === 'Forbidden' ? 'Invalid path' : validated.error })
    return
  }

  const { absolutePath } = validated

  try {
    await fs.promises.access(absolutePath, fs.constants.R_OK)
  } catch {
    res.statusCode = 404
    sendJson(res, { error: 'File not found' })
    return
  }

  try {
    await revealInFileExplorer(absolutePath)
    sendJson(res, { success: true })
  } catch (error) {
    throw new AssetManagerError(
      error instanceof Error ? error.message : 'Failed to reveal file',
      500,
      'INTERNAL_ERROR',
      { handler: 'reveal-in-finder', file: absolutePath }
    )
  }
}
