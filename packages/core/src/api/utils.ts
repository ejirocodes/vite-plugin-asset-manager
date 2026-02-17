import type { IncomingMessage, ServerResponse } from 'http'
import path from 'path'

export const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.bmp': 'image/bmp',
  '.tiff': 'image/tiff',
  '.tif': 'image/tiff',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogg': 'video/ogg',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.flac': 'audio/flac',
  '.aac': 'audio/aac',
  '.pdf': 'application/pdf',
  '.json': 'application/json',
  '.md': 'text/markdown',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
  '.yml': 'text/yaml',
  '.yaml': 'text/yaml',
  '.toml': 'application/toml',
  '.xml': 'application/xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject'
}

export function sendJson(res: ServerResponse, data: unknown): void {
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}

export interface ValidatedPath {
  absolutePath: string
  relativePath: string
}

interface PathValidationError {
  error: string
  status: 400 | 403
}

export function validateFilePath(
  root: string,
  relativePath: string | undefined
): ValidatedPath | PathValidationError {
  if (!relativePath) {
    return { error: 'Missing path parameter', status: 400 }
  }

  const absolutePath = path.resolve(root, relativePath)

  if (!absolutePath.startsWith(root)) {
    return { error: 'Forbidden', status: 403 }
  }

  return { absolutePath, relativePath }
}

export function parseJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk: Buffer) => {
      body += chunk.toString()
    })
    req.on('end', () => {
      try {
        resolve(JSON.parse(body))
      } catch {
        reject(new Error('Invalid JSON'))
      }
    })
    req.on('error', reject)
  })
}
