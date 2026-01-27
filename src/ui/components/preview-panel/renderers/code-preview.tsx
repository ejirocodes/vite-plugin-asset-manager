import { memo, useState, useEffect } from 'react'
import { SpinnerIcon } from '@phosphor-icons/react'
import type { Asset } from '@/ui/types'

interface CodePreviewProps {
  asset: Asset
}

const MAX_PREVIEW_SIZE = 50000 // 50KB limit for preview

export const CodePreview = memo(function CodePreview({ asset }: CodePreviewProps) {
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [truncated, setTruncated] = useState(false)

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true)
      setError(null)
      setTruncated(false)

      try {
        const response = await fetch(
          `/__asset_manager__/api/file?path=${encodeURIComponent(asset.path)}`
        )

        if (!response.ok) {
          throw new Error('Failed to fetch file')
        }

        const text = await response.text()

        if (text.length > MAX_PREVIEW_SIZE) {
          setContent(text.slice(0, MAX_PREVIEW_SIZE))
          setTruncated(true)
        } else {
          setContent(text)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load file')
      } finally {
        setLoading(false)
      }
    }

    fetchContent()
  }, [asset.path])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <SpinnerIcon className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
        {error}
      </div>
    )
  }

  return (
    <div className="relative">
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-xs font-mono max-h-80 overflow-y-auto">
        <code className="text-foreground/80 whitespace-pre-wrap wrap-break-word">
          {content}
        </code>
      </pre>
      {truncated && (
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-linear-to-t from-muted/80 to-transparent flex items-end justify-center pb-2">
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            Content truncated (file too large)
          </span>
        </div>
      )}
    </div>
  )
})
