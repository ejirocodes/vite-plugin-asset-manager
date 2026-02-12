import { memo, useCallback } from 'react'
import { DownloadIcon, EyeSlashIcon, EyeIcon } from '@phosphor-icons/react'
import { Button } from '@/ui/components/ui/button'
import { useIgnoredAssets } from '@/ui/providers/ignored-assets-provider'
import { getApiBase } from '@/ui/lib/api-base'
import type { Asset } from '@/ui/types'

interface ActionsSectionProps {
  asset: Asset
}

export const ActionsSection = memo(function ActionsSection({ asset }: ActionsSectionProps) {
  const fileUrl = `${getApiBase()}/api/file?path=${encodeURIComponent(asset.path)}`
  const { isIgnored, toggleIgnored } = useIgnoredAssets()
  const ignored = isIgnored(asset.path)

  const handleDownload = useCallback(() => {
    const link = document.createElement('a')
    link.href = fileUrl
    link.download = asset.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [fileUrl, asset.name])

  const handleToggleIgnore = useCallback(() => {
    toggleIgnored(asset.path)
  }, [asset.path, toggleIgnored])

  return (
    <div className="p-4">
      <h3 className="text-xs font-medium text-muted-foreground mb-3">Actions</h3>
      <div className="space-y-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleDownload}
          className="w-full justify-start gap-2"
        >
          <DownloadIcon weight="bold" className="w-4 h-4" />
          Download
        </Button>

        {asset.importersCount === 0 && (
          <Button
            variant={ignored ? 'default' : 'outline'}
            size="sm"
            onClick={handleToggleIgnore}
            className="w-full justify-start gap-2"
            title={
              ignored
                ? 'Remove from ignore list - asset will appear in unused filter again'
                : "Mark as intentionally unused - won't appear in unused filter"
            }
          >
            {ignored ? (
              <>
                <EyeIcon weight="bold" className="w-4 h-4" />
                Unmark as Ignored
              </>
            ) : (
              <>
                <EyeSlashIcon weight="bold" className="w-4 h-4" />
                Mark as Ignored
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
})
