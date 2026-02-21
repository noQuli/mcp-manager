import { ipcMain } from 'electron'
import { processService } from '../services/ProcessService'
import type { IpcResponse } from '../../types'

export function registerProcessHandlers(): void {
  ipcMain.handle('process:check', async (_, processName: string): Promise<IpcResponse> => {
    try {
      const isRunning = await processService.isProcessRunning(processName)
      return { success: true, data: isRunning }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('process:kill', async (_, processName: string): Promise<IpcResponse> => {
    try {
      await processService.stopProcess(processName)
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('process:safe-to-modify', async (_, clientId: string): Promise<IpcResponse> => {
    try {
      const isSafe = await processService.isSafeToModifyConfig(clientId)
      return { success: true, data: isSafe }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })
}
