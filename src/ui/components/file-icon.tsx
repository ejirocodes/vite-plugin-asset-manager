import { memo } from 'react'
import {
  ImageIcon,
  VideoCameraIcon,
  MusicNoteIcon,
  FileTextIcon,
  FileCodeIcon,
  FilePdfIcon,
  FileDocIcon,
  FileXlsIcon,
  FilePptIcon,
  FileCssIcon,
  FileIcon as FileIconPhosphor,
  TableIcon,
  ArticleIcon
} from '@phosphor-icons/react'

interface FileIconProps {
  extension: string
  className?: string
}

type IconConfig = {
  icon: React.ElementType
  color: string
}

const iconMap = new Map<string, IconConfig>([
  // Images
  ['png', { icon: ImageIcon, color: 'text-violet-400' }],
  ['jpg', { icon: ImageIcon, color: 'text-violet-400' }],
  ['jpeg', { icon: ImageIcon, color: 'text-violet-400' }],
  ['gif', { icon: ImageIcon, color: 'text-violet-400' }],
  ['svg', { icon: ImageIcon, color: 'text-violet-400' }],
  ['webp', { icon: ImageIcon, color: 'text-violet-400' }],
  ['avif', { icon: ImageIcon, color: 'text-violet-400' }],
  ['ico', { icon: ImageIcon, color: 'text-violet-400' }],
  ['bmp', { icon: ImageIcon, color: 'text-violet-400' }],
  // Videos
  ['mp4', { icon: VideoCameraIcon, color: 'text-pink-400' }],
  ['webm', { icon: VideoCameraIcon, color: 'text-pink-400' }],
  ['mov', { icon: VideoCameraIcon, color: 'text-pink-400' }],
  ['avi', { icon: VideoCameraIcon, color: 'text-pink-400' }],
  ['ogg', { icon: VideoCameraIcon, color: 'text-pink-400' }],
  // Audio
  ['mp3', { icon: MusicNoteIcon, color: 'text-cyan-400' }],
  ['wav', { icon: MusicNoteIcon, color: 'text-cyan-400' }],
  ['flac', { icon: MusicNoteIcon, color: 'text-cyan-400' }],
  ['aac', { icon: MusicNoteIcon, color: 'text-cyan-400' }],
  // Documents
  ['pdf', { icon: FilePdfIcon, color: 'text-red-400' }],
  ['doc', { icon: FileDocIcon, color: 'text-blue-400' }],
  ['docx', { icon: FileDocIcon, color: 'text-blue-400' }],
  ['xls', { icon: FileXlsIcon, color: 'text-emerald-400' }],
  ['xlsx', { icon: FileXlsIcon, color: 'text-emerald-400' }],
  ['ppt', { icon: FilePptIcon, color: 'text-orange-400' }],
  ['pptx', { icon: FilePptIcon, color: 'text-orange-400' }],
  ['txt', { icon: FileTextIcon, color: 'text-zinc-400' }],
  // Code/Data
  ['json', { icon: FileCodeIcon, color: 'text-amber-400' }],
  ['md', { icon: ArticleIcon, color: 'text-purple-400' }],
  ['csv', { icon: TableIcon, color: 'text-emerald-400' }],
  ['js', { icon: FileCodeIcon, color: 'text-yellow-400' }],
  ['ts', { icon: FileCodeIcon, color: 'text-blue-400' }],
  ['jsx', { icon: FileCodeIcon, color: 'text-cyan-400' }],
  ['tsx', { icon: FileCodeIcon, color: 'text-cyan-400' }],
  ['css', { icon: FileCssIcon, color: 'text-blue-400' }],
  ['html', { icon: FileCodeIcon, color: 'text-orange-400' }]
])

const defaultConfig: IconConfig = { icon: FileIconPhosphor, color: 'text-zinc-500' }

export const FileIcon = memo(function FileIcon({
  extension,
  className = 'w-12 h-12'
}: FileIconProps) {
  const ext = extension.toLowerCase().replace('.', '')
  const config = iconMap.get(ext) ?? defaultConfig
  const Icon = config.icon

  return (
    <div className={`${config.color} ${className}`}>
      <Icon weight="duotone" className="w-full h-full" />
    </div>
  )
})

export function getFileTypeColor(extension: string): string {
  const ext = extension.toLowerCase().replace('.', '')
  return iconMap.get(ext)?.color ?? defaultConfig.color
}
