import type { ServerResponse } from 'http'

const sseClients = new Set<ServerResponse>()

export function handleSSE(res: ServerResponse): void {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  })

  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)

  sseClients.add(res)

  res.on('close', () => {
    sseClients.delete(res)
  })
}

export function broadcastSSE(event: string, data: unknown): void {
  const message = JSON.stringify({ event, data })
  for (const client of sseClients) {
    client.write(`data: ${message}\n\n`)
  }
}
