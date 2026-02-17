import type { IncomingMessage, ServerResponse } from 'http'
import path from 'path'
import fs from 'fs'
import archiver from 'archiver'
import { sendJson, parseJsonBody } from '../utils.js'

export async function handleBulkDownload(
  req: IncomingMessage,
  res: ServerResponse,
  root: string
): Promise<void> {
  if (req.method !== 'POST') {
    res.statusCode = 405
    sendJson(res, { error: 'Method not allowed' })
    return
  }

  let body: { paths?: string[] }
  try {
    body = (await parseJsonBody(req)) as { paths?: string[] }
  } catch {
    res.statusCode = 400
    sendJson(res, { error: 'Invalid JSON body' })
    return
  }

  const paths = body.paths
  if (!Array.isArray(paths) || paths.length === 0) {
    res.statusCode = 400
    sendJson(res, { error: 'Missing or invalid paths array' })
    return
  }

  const validatedPaths: { relativePath: string; absolutePath: string }[] = []

  for (const relativePath of paths) {
    const absolutePath = path.resolve(root, relativePath)

    if (!absolutePath.startsWith(root)) {
      res.statusCode = 403
      sendJson(res, { error: `Forbidden path: ${relativePath}` })
      return
    }

    try {
      await fs.promises.access(absolutePath, fs.constants.R_OK)
      validatedPaths.push({ relativePath, absolutePath })
    } catch {
      console.warn(`[asset-manager] Bulk download skipping missing file: ${relativePath}`)
    }
  }

  if (validatedPaths.length === 0) {
    res.statusCode = 404
    sendJson(res, { error: 'No valid files found' })
    return
  }

  res.setHeader('Content-Type', 'application/zip')
  res.setHeader('Content-Disposition', `attachment; filename="assets-${Date.now()}.zip"`)

  const archive = archiver('zip', { zlib: { level: 6 } })

  archive.on('error', err => {
    console.error('[asset-manager] ZIP creation error:', err)
    if (!res.headersSent) {
      res.statusCode = 500
      res.end('ZIP creation failed')
    }
  })

  archive.pipe(res)

  for (const { relativePath, absolutePath } of validatedPaths) {
    archive.file(absolutePath, { name: relativePath })
  }

  await archive.finalize()
}

export async function handleBulkDelete(
  req: IncomingMessage,
  res: ServerResponse,
  root: string
): Promise<void> {
  if (req.method !== 'POST') {
    res.statusCode = 405
    sendJson(res, { error: 'Method not allowed' })
    return
  }

  let body: { paths?: string[] }
  try {
    body = (await parseJsonBody(req)) as { paths?: string[] }
  } catch {
    res.statusCode = 400
    sendJson(res, { error: 'Invalid JSON body' })
    return
  }

  const paths = body.paths
  if (!Array.isArray(paths) || paths.length === 0) {
    res.statusCode = 400
    sendJson(res, { error: 'Missing or invalid paths array' })
    return
  }

  const results = {
    deleted: 0,
    failed: [] as string[],
    errors: [] as string[]
  }

  for (const relativePath of paths) {
    const absolutePath = path.resolve(root, relativePath)

    if (!absolutePath.startsWith(root)) {
      results.failed.push(relativePath)
      results.errors.push(`Forbidden path: ${relativePath}`)
      continue
    }

    try {
      await fs.promises.unlink(absolutePath)
      results.deleted++
    } catch (error) {
      results.failed.push(relativePath)
      results.errors.push(error instanceof Error ? error.message : 'Unknown error')
    }
  }

  sendJson(res, {
    deleted: results.deleted,
    failed: results.failed.length,
    errors: results.errors
  })
}
