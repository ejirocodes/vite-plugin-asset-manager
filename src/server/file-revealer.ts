import { spawn } from 'child_process'
import path from 'path'

/**
 * Opens the file in the system's file explorer and highlights it
 * @param absolutePath Absolute path to the file to reveal
 */
export async function revealInFileExplorer(absolutePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const platform = process.platform

    let command: string
    let args: string[]

    switch (platform) {
      case 'darwin': // macOS
        command = 'open'
        args = ['-R', absolutePath]
        break

      case 'win32': // Windows
        command = 'explorer'
        args = ['/select,', absolutePath]
        break

      case 'linux': {
        // Linux - xdg-open doesn't support file selection, so open the containing directory
        const directory = path.dirname(absolutePath)
        command = 'xdg-open'
        args = [directory]
        break
      }

      default:
        return reject(new Error(`Unsupported platform: ${platform}`))
    }

    const child = spawn(command, args)

    child.on('error', error => {
      reject(new Error(`Failed to reveal file: ${error.message}`))
    })

    child.on('close', code => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Reveal command exited with code ${code}`))
      }
    })
  })
}
