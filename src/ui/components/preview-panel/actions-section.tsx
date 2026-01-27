import { memo, useCallback } from 'react'
import { DownloadIcon } from '@phosphor-icons/react'
import { Button } from '@/ui/components/ui/button'
import type { Asset } from '@/ui/types'

interface ActionsSectionProps {
  asset: Asset
}

export const ActionsSection = memo(function ActionsSection({ asset }: ActionsSectionProps) {
  const fileUrl = `/__asset_manager__/api/file?path=${encodeURIComponent(asset.path)}`

  const handleDownload = useCallback(() => {
    const link = document.createElement('a')
    link.href = fileUrl
    link.download = asset.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [fileUrl, asset.name])

  return (
    <div className="p-4">
      <h3 className="text-xs font-medium text-muted-foreground mb-3">Actions</h3>
      <Button
        variant="secondary"
        size="sm"
        onClick={handleDownload}
        className="w-full justify-start gap-2"
      >
        <DownloadIcon weight="bold" className="w-4 h-4" />
        Download
      </Button>
    </div>
  )
})
