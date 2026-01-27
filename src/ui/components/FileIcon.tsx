interface FileIconProps {
  extension: string
  className?: string
}

export function FileIcon({ extension, className = '' }: FileIconProps) {
  const ext = extension.toLowerCase().replace('.', '')

  const getIconColor = () => {
    switch (ext) {
      case 'pdf':
        return 'text-red-400'
      case 'doc':
      case 'docx':
        return 'text-blue-400'
      case 'xls':
      case 'xlsx':
        return 'text-green-400'
      case 'ppt':
      case 'pptx':
        return 'text-orange-400'
      case 'json':
        return 'text-yellow-400'
      case 'md':
        return 'text-purple-400'
      case 'txt':
        return 'text-slate-400'
      case 'mp4':
      case 'webm':
      case 'mov':
        return 'text-pink-400'
      case 'mp3':
      case 'wav':
        return 'text-cyan-400'
      default:
        return 'text-slate-400'
    }
  }

  const getIcon = () => {
    switch (ext) {
      case 'mp4':
      case 'webm':
      case 'mov':
      case 'avi':
      case 'ogg':
        return (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )
      case 'mp3':
      case 'wav':
      case 'flac':
      case 'aac':
        return (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        )
      case 'json':
        return (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        )
      case 'md':
        return (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      default:
        return (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        )
    }
  }

  return (
    <div className={getIconColor()}>
      {getIcon()}
    </div>
  )
}
