export class AssetManagerError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'AssetManagerError'
  }
}
