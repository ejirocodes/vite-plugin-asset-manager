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
  ArticleIcon,
  TextTIcon
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
  // Images — soft violet
  ['png', { icon: ImageIcon, color: 'text-violet-500' }],
  ['jpg', { icon: ImageIcon, color: 'text-violet-500' }],
  ['jpeg', { icon: ImageIcon, color: 'text-violet-500' }],
  ['gif', { icon: ImageIcon, color: 'text-violet-500' }],
  ['svg', { icon: ImageIcon, color: 'text-violet-500' }],
  ['webp', { icon: ImageIcon, color: 'text-violet-500' }],
  ['avif', { icon: ImageIcon, color: 'text-violet-500' }],
  ['ico', { icon: ImageIcon, color: 'text-violet-500' }],
  ['bmp', { icon: ImageIcon, color: 'text-violet-500' }],
  // Video — warm rose
  ['mp4', { icon: VideoCameraIcon, color: 'text-rose-400' }],
  ['webm', { icon: VideoCameraIcon, color: 'text-rose-400' }],
  ['mov', { icon: VideoCameraIcon, color: 'text-rose-400' }],
  ['avi', { icon: VideoCameraIcon, color: 'text-rose-400' }],
  ['ogg', { icon: VideoCameraIcon, color: 'text-rose-400' }],
  // Audio — cool teal
  ['mp3', { icon: MusicNoteIcon, color: 'text-teal-400' }],
  ['wav', { icon: MusicNoteIcon, color: 'text-teal-400' }],
  ['flac', { icon: MusicNoteIcon, color: 'text-teal-400' }],
  ['aac', { icon: MusicNoteIcon, color: 'text-teal-400' }],
  // Documents — warm amber
  ['pdf', { icon: FilePdfIcon, color: 'text-amber-500' }],
  ['doc', { icon: FileDocIcon, color: 'text-amber-500' }],
  ['docx', { icon: FileDocIcon, color: 'text-amber-500' }],
  ['xls', { icon: FileXlsIcon, color: 'text-amber-500' }],
  ['xlsx', { icon: FileXlsIcon, color: 'text-amber-500' }],
  ['ppt', { icon: FilePptIcon, color: 'text-amber-500' }],
  ['pptx', { icon: FilePptIcon, color: 'text-amber-500' }],
  ['txt', { icon: FileTextIcon, color: 'text-amber-500' }],
  // Fonts — indigo
  ['woff', { icon: TextTIcon, color: 'text-indigo-400' }],
  ['woff2', { icon: TextTIcon, color: 'text-indigo-400' }],
  ['ttf', { icon: TextTIcon, color: 'text-indigo-400' }],
  ['otf', { icon: TextTIcon, color: 'text-indigo-400' }],
  ['eot', { icon: TextTIcon, color: 'text-indigo-400' }],
  // Code & data — emerald
  ['json', { icon: FileCodeIcon, color: 'text-emerald-400' }],
  ['md', { icon: ArticleIcon, color: 'text-emerald-400' }],
  ['csv', { icon: TableIcon, color: 'text-emerald-400' }],
  ['js', { icon: FileCodeIcon, color: 'text-emerald-400' }],
  ['ts', { icon: FileCodeIcon, color: 'text-emerald-400' }],
  ['jsx', { icon: FileCodeIcon, color: 'text-emerald-400' }],
  ['tsx', { icon: FileCodeIcon, color: 'text-emerald-400' }],
  ['css', { icon: FileCssIcon, color: 'text-emerald-400' }],
  ['html', { icon: FileCodeIcon, color: 'text-emerald-400' }]
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
