import launch from 'launch-editor'
import type { EditorType } from '../shared/types.js'

/**
 * Opens a file in the configured editor at the specified line and column.
 *
 * @param absolutePath - Absolute path to the file
 * @param line - Line number (1-indexed)
 * @param column - Column number (1-indexed)
 * @param editor - Editor to open the file in
 */
export function launchEditor(
  absolutePath: string,
  line: number,
  column: number,
  editor: EditorType
): Promise<void> {
  return new Promise((resolve, reject) => {
    const fileSpec = `${absolutePath}:${line}:${column}`

    launch(fileSpec, editor, (_fileName: string, errorMsg: string | null) => {
      if (errorMsg) {
        reject(new Error(errorMsg))
      } else {
        resolve()
      }
    })
  })
}
