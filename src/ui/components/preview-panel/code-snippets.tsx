import { memo, useState, useMemo, useCallback } from 'react'
import { CopyIcon, CheckIcon } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/ui/components/ui/tabs'
import { Button } from '@/ui/components/ui/button'
import { generateCodeSnippets, type SnippetType } from '@/ui/lib/code-snippets'
import type { Asset } from '@/ui/types'

interface CodeSnippetsProps {
  asset: Asset
}

export const CodeSnippets = memo(function CodeSnippets({ asset }: CodeSnippetsProps) {
  const [copiedTab, setCopiedTab] = useState<SnippetType | null>(null)
  const snippets = useMemo(() => generateCodeSnippets(asset), [asset])

  const handleCopy = useCallback(async (code: string, type: SnippetType) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedTab(type)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopiedTab(null), 2000)
    } catch (_err) {
      toast.error('Failed to copy')
    }
  }, [])

  if (snippets.length === 0) return null

  return (
    <div className="p-4">
      <Tabs defaultValue={snippets[0].type}>
        <div className="flex items-center justify-between mb-3">
          <TabsList variant="line" activateOnFocus>
            {snippets.map(snippet => (
              <TabsTrigger key={snippet.type} value={snippet.type}>
                {snippet.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {snippets.map(snippet => (
          <TabsContent key={snippet.type} value={snippet.type}>
            <div className="relative">
              <pre className="bg-muted/50 rounded-lg p-4 pr-12 overflow-x-auto text-xs font-mono">
                <code className="text-foreground/80">{snippet.code}</code>
              </pre>
              <Button
                variant="ghost"
                size="icon-sm"
                className="absolute top-2 right-2"
                onClick={() => handleCopy(snippet.code, snippet.type)}
                aria-label="Copy code"
              >
                {copiedTab === snippet.type ? (
                  <CheckIcon weight="bold" className="w-4 h-4 text-emerald-500" />
                ) : (
                  <CopyIcon weight="bold" className="w-4 h-4" />
                )}
              </Button>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
})
