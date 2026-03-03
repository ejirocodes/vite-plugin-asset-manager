import * as vscode from 'vscode'
import { AssetLensWebviewProvider } from './webview-provider.js'
import { AssetManager } from './asset-manager.js'
import type { ExtensionSettings } from './types.js'

let manager: AssetManager | undefined
let statusBarItem: vscode.StatusBarItem | undefined

export function activate(context: vscode.ExtensionContext): void {
  const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath

  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100)
  statusBarItem.command = 'assetLens.openPanel'
  context.subscriptions.push(statusBarItem)

  if (!root) {
    statusBarItem.text = '$(file-media) Asset Lens'
    statusBarItem.tooltip = 'Open a folder to use Asset Lens'
    statusBarItem.show()
    return
  }

  const settings = getSettings()
  manager = new AssetManager(root, settings, context.globalStorageUri)

  const provider = new AssetLensWebviewProvider(context.extensionUri, manager, root)

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('assetLens.panel', provider, {
      webviewOptions: { retainContextWhenHidden: true }
    }),

    vscode.commands.registerCommand('assetLens.openPanel', () => {
      vscode.commands.executeCommand('assetLens.panel.focus')
    }),

    vscode.workspace.onDidChangeConfiguration(e => {
      if (!e.affectsConfiguration('assetLens')) return
      manager?.destroy()
      const newSettings = getSettings()
      manager = new AssetManager(root, newSettings, context.globalStorageUri)
      const newProvider = new AssetLensWebviewProvider(context.extensionUri, manager, root)
      // Re-register provider with new manager
      vscode.window.registerWebviewViewProvider('assetLens.panel', newProvider, {
        webviewOptions: { retainContextWhenHidden: true }
      })
    })
  )

  statusBarItem.text = '$(file-media) Asset Lens'
  statusBarItem.tooltip = 'Open Asset Lens panel'
  statusBarItem.show()
}

export function deactivate(): void {
  manager?.destroy()
  statusBarItem?.dispose()
}

function getSettings(): ExtensionSettings {
  const cfg = vscode.workspace.getConfiguration('assetLens')
  return {
    include: cfg.get<string[]>('include') ?? [],
    exclude: cfg.get<string[]>('exclude') ?? [
      'node_modules', '.git', 'dist', 'build', 'target',
      '.next', '.nuxt', 'coverage', '.cache', 'android/build', 'ios/build'
    ],
    thumbnailSize: cfg.get<number>('thumbnailSize') ?? 200,
    aliases: cfg.get<Record<string, string>>('aliases') ?? { '@/': 'src/' }
  }
}
