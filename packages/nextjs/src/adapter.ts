/**
 * Web API ↔ Node.js HTTP adapter.
 *
 * Next.js App Router API routes use the Web Fetch API (Request/Response),
 * but @vite-asset-manager/core middleware uses Node.js HTTP (IncomingMessage/ServerResponse).
 * This module bridges the two interfaces.
 */
import { Readable, Writable } from 'stream'
import type { IncomingHttpHeaders } from 'http'
import type { AssetManagerMiddleware } from '@vite-asset-manager/core'

/**
 * Mock IncomingMessage that wraps a Web API Request.
 * The core router reads: url, method, headers, and body via Readable events.
 */
class MockIncomingMessage extends Readable {
  public url: string
  public method: string
  public headers: IncomingHttpHeaders

  constructor(request: Request) {
    super()
    this.method = request.method
    this.url = new URL(request.url).pathname + new URL(request.url).search

    // Convert Web Headers to Node.js headers (lowercase keys)
    const headers: IncomingHttpHeaders = {}
    request.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value
    })
    this.headers = headers
  }

  _read(): void {
    // No-op — data is pushed via feedBody()
  }

  async feedBody(request: Request): Promise<void> {
    if (request.body) {
      const reader = request.body.getReader()
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          this.push(Buffer.from(value))
        }
      } finally {
        reader.releaseLock()
      }
    }
    this.push(null)
  }
}

/**
 * Mock ServerResponse that captures output and converts to a Web API Response.
 *
 * Supports:
 * - JSON responses (setHeader + end)
 * - Binary streaming via pipe() (file serving, ZIP downloads)
 * - SSE streaming (writeHead with text/event-stream, repeated write calls)
 * - Range requests (statusCode 206)
 */
class MockServerResponse extends Writable {
  public statusCode: number = 200
  public headersSent: boolean = false

  private headers: Map<string, string | number | string[]> = new Map()
  private chunks: Buffer[] = []
  private resolveResponse!: (response: Response) => void
  private sseController: ReadableStreamDefaultController<Uint8Array> | null =
    null
  private isSSE: boolean = false
  private responseResolved: boolean = false

  public readonly responsePromise: Promise<Response>

  constructor() {
    super()
    this.responsePromise = new Promise<Response>((resolve) => {
      this.resolveResponse = resolve
    })
  }

  setHeader(name: string, value: string | number | string[]): this {
    this.headers.set(name.toLowerCase(), value)
    return this
  }

  getHeader(name: string): string | number | string[] | undefined {
    return this.headers.get(name.toLowerCase())
  }

  removeHeader(name: string): void {
    this.headers.delete(name.toLowerCase())
  }

  writeHead(
    statusCode: number,
    headers?: Record<string, string | string[]>
  ): this {
    this.statusCode = statusCode
    this.headersSent = true

    if (headers) {
      for (const [key, value] of Object.entries(headers)) {
        this.headers.set(key.toLowerCase(), value)
      }
    }

    // Detect SSE and resolve immediately with a streaming Response
    const contentType = this.headers.get('content-type')
    if (contentType === 'text/event-stream') {
      this.isSSE = true
      this.resolveSSEResponse()
    }

    return this
  }

  // Capture data from pipe() and write() calls
  _write(
    chunk: Buffer | string,
    encoding: BufferEncoding,
    callback: (error?: Error | null) => void
  ): void {
    const buffer = Buffer.isBuffer(chunk)
      ? chunk
      : Buffer.from(chunk, encoding)

    if (this.isSSE && this.sseController) {
      try {
        this.sseController.enqueue(new Uint8Array(buffer))
      } catch {
        // Controller may be closed if client disconnected
      }
    } else {
      this.chunks.push(buffer)
    }

    callback()
  }

  _final(callback: (error?: Error | null) => void): void {
    if (!this.isSSE && !this.responseResolved) {
      this.resolveNormalResponse()
    }
    callback()
  }

  // Override end() to finalize the response
  end(chunk?: unknown, encodingOrCallback?: unknown, callback?: unknown): this {
    if (chunk !== undefined && chunk !== null) {
      const buf = Buffer.isBuffer(chunk)
        ? chunk
        : Buffer.from(String(chunk))
      if (this.isSSE && this.sseController) {
        try {
          this.sseController.enqueue(new Uint8Array(buf))
        } catch {
          // Controller may be closed
        }
      } else {
        this.chunks.push(buf)
      }
    }

    if (!this.isSSE && !this.responseResolved) {
      this.resolveNormalResponse()
    }

    const cb =
      typeof encodingOrCallback === 'function' ? encodingOrCallback : callback
    if (typeof cb === 'function') (cb as () => void)()

    return this
  }

  private buildHeaders(): Headers {
    const headers = new Headers()
    for (const [key, value] of this.headers) {
      if (Array.isArray(value)) {
        for (const v of value) headers.append(key, v)
      } else {
        headers.set(key, String(value))
      }
    }
    return headers
  }

  private resolveNormalResponse(): void {
    if (this.responseResolved) return
    this.responseResolved = true

    const body =
      this.chunks.length > 0
        ? new Uint8Array(Buffer.concat(this.chunks))
        : null
    this.resolveResponse(
      new Response(body, {
        status: this.statusCode,
        headers: this.buildHeaders(),
      })
    )
  }

  private resolveSSEResponse(): void {
    if (this.responseResolved) return
    this.responseResolved = true

    const stream = new ReadableStream<Uint8Array>({
      start: (controller) => {
        this.sseController = controller

        // Flush any data already written before the stream started
        // (e.g., the initial "connected" message in handleSSE)
        for (const chunk of this.chunks) {
          controller.enqueue(new Uint8Array(chunk))
        }
        this.chunks = []
      },
      cancel: () => {
        // Client disconnected — emit 'close' so the router cleans up sseClients
        this.emit('close')
        this.sseController = null
      },
    })

    this.resolveResponse(
      new Response(stream, {
        status: this.statusCode,
        headers: this.buildHeaders(),
      })
    )
  }
}

/**
 * Bridge a Web API Request through a Node.js middleware and return a Web API Response.
 */
export async function callMiddleware(
  request: Request,
  middleware: AssetManagerMiddleware
): Promise<Response> {
  const mockReq = new MockIncomingMessage(request)
  const mockRes = new MockServerResponse()

  let nextCalled = false
  const next = () => {
    nextCalled = true
  }

  // Start feeding the body — chunks are buffered in the Readable
  // until the middleware's parseJsonBody() consumes them
  mockReq.feedBody(request)

  // Call the middleware
  try {
    middleware(
      mockReq as unknown as import('http').IncomingMessage,
      mockRes as unknown as import('http').ServerResponse,
      next
    )
  } catch (error) {
    console.error('[nextjs-asset-manager] Middleware error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }

  if (nextCalled) {
    return new Response('Not Found', { status: 404 })
  }

  // Wait for the response to be built:
  // - Normal responses: resolves when end() is called
  // - SSE: resolves immediately when writeHead detects text/event-stream
  return mockRes.responsePromise
}
