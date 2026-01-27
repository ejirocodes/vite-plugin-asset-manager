/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
  readonly hot?: {
    on: (event: string, callback: (data: any) => void) => void
    off: (event: string, callback: (data: any) => void) => void
  }
}
