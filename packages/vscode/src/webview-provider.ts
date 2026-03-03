import * as vscode from 'vscode'
import * as path from 'path'
import * as fs from 'fs'
import type { AssetManager } from './asset-manager.js'
import { MessageHandler } from './message-handler.js'

interface RequestMsg {
  id: string
  type: 'request'
  method: string
  params: Record<string, string>
}

export class AssetLensWebviewProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView
  private handler?: MessageHandler

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly manager: AssetManager,
    private readonly root: string
  ) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview'),
        vscode.Uri.file(this.root),
        this.manager.thumbnails.storageUri
      ]
    }

    webviewView.webview.html = this.getHtml(webviewView.webview)
    this.handler = new MessageHandler(this.manager, webviewView.webview, this.root)

    // Lazy init: first panel open triggers scan
    this.manager.initIfNeeded().then(() => {
      this.manager.onChange((event, data) => {
        webviewView.webview.postMessage({ type: 'event', event, data })
      })
    })

    webviewView.webview.onDidReceiveMessage(async (msg: unknown) => {
      const req = msg as RequestMsg
      if (req.type !== 'request') return
      const response = await this.handler!.handle(req)
      webviewView.webview.postMessage(response)
    })
  }

  private getHtml(webview: vscode.Webview): string {
    const webviewDist = vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview')
    const indexPath = path.join(webviewDist.fsPath, 'index.html')

    let html: string
    try {
      html = fs.readFileSync(indexPath, 'utf-8')
    } catch {
      return this.getPlaceholderHtml()
    }

    // Rewrite relative asset paths to vscode-resource URIs
    html = html.replace(/(src|href)="(\.[^"]+)"/g, (_match, attr: string, p: string) => {
      const relative = p.startsWith('./') ? p.slice(2) : p.slice(1)
      const uri = webview.asWebviewUri(vscode.Uri.joinPath(webviewDist, relative))
      return `${attr}="${uri}"`
    })

    const nonce = getNonce()

    // Inject CSP
    html = html.replace(
      '<head>',
      `<head>
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src vscode-resource: data: blob: https:; script-src 'nonce-${nonce}'; style-src vscode-resource: 'unsafe-inline'; font-src vscode-resource: data:; connect-src 'none';">`
    )

    // Apply nonce to all script tags
    html = html.replace(/<script/g, `<script nonce="${nonce}"`)

    // Inject VSCode theme bridge CSS variables
    const themeStyles = `
<style>
  :root {
    --background: var(--vscode-editor-background);
    --foreground: var(--vscode-editor-foreground);
    --card: var(--vscode-editorWidget-background, var(--vscode-editor-background));
    --border: var(--vscode-panel-border, var(--vscode-editorGroup-border));
    --muted: var(--vscode-input-background);
    --muted-foreground: var(--vscode-input-placeholderForeground);
    --primary: var(--vscode-button-background);
    --primary-foreground: var(--vscode-button-foreground);
    --secondary: var(--vscode-button-secondaryBackground);
    --secondary-foreground: var(--vscode-button-secondaryForeground);
    --accent: var(--vscode-list-activeSelectionBackground);
    --accent-foreground: var(--vscode-list-activeSelectionForeground);
    --ring: var(--vscode-focusBorder);
    --input: var(--vscode-input-background);
  }
</style>`
    html = html.replace('</head>', `${themeStyles}</head>`)

    return html
  }

  private getPlaceholderHtml(): string {
    return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Asset Lens</title></head>
<body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:var(--vscode-foreground)">
  <p>Building Asset Lens UI... Run <code>pnpm build:vscode:webview</code></p>
</body>
</html>`
  }
}

function getNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let text = ''
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return text
}
