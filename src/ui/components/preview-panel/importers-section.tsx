import { memo } from 'react'
import { FileCodeIcon, ArrowSquareOutIcon, SpinnerGapIcon } from '@phosphor-icons/react'
import { useImporters } from '@/ui/hooks/useImporters'
import type { Asset, ImportType } from '@/ui/types'

interface ImportersSectionProps {
  asset: Asset
}

const IMPORT_TYPE_LABELS: Record<ImportType, string> = {
  'es-import': 'ES Import',
  'dynamic-import': 'Dynamic Import',
  require: 'Require',
  'css-url': 'CSS url()',
  'html-src': 'HTML src',
  'html-href': 'HTML href'
}

export const ImportersSection = memo(function ImportersSection({ asset }: ImportersSectionProps) {
  const { importers, loading, openInEditor } = useImporters(asset.path)

  return (
    <div className="p-4">
      <h3 className="text-xs font-medium text-muted-foreground mb-2">
        Importers {!loading && `(${importers.length})`}
      </h3>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-2">
          <SpinnerGapIcon className="w-4 h-4 animate-spin" />
          <span className="text-xs">Scanning...</span>
        </div>
      ) : importers.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">No imports found</p>
      ) : (
        <div className="space-y-1">
          {importers.map((importer, index) => (
            <button
              key={`${importer.filePath}:${importer.line}:${index}`}
              onClick={() => openInEditor(importer)}
              className="w-full text-left p-2 rounded-md hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <FileCodeIcon
                    weight="bold"
                    className="w-3.5 h-3.5 text-muted-foreground shrink-0"
                  />
                  <span className="text-xs font-medium truncate">{importer.filePath}</span>
                  <span className="text-xs text-muted-foreground shrink-0">:{importer.line}</span>
                </div>
                <ArrowSquareOutIcon
                  weight="bold"
                  className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                />
              </div>
              <div className="mt-1 pl-5">
                <code className="text-[10px] text-muted-foreground font-mono truncate block">
                  {importer.snippet}
                </code>
                <span className="text-[10px] text-muted-foreground/70">
                  {IMPORT_TYPE_LABELS[importer.importType] || importer.importType}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
})
