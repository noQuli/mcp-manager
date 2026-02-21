import { ipcMain, shell } from 'electron'
import { configService } from '../services/ConfigService'
import type { IpcResponse } from '../../types'

export function registerConfigHandlers(): void {
  ipcMain.handle('config:open', async (_, clientId: string): Promise<IpcResponse> => {
    try {
      const configPath = configService.getClientConfigPath(clientId)
      const err = await shell.openPath(configPath)
      if (err) return { success: false, error: err }
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })
  ipcMain.handle('config:read', async (_, clientId: string): Promise<IpcResponse> => {
    try {
      const config = await configService.readConfig(clientId)
      return { success: true, data: config }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle(
    'config:save',
    async (_, clientId: string, config: unknown): Promise<IpcResponse> => {
      try {
        await configService.saveConfig(clientId, config)
        return { success: true }
      } catch (error) {
        return { success: false, error: String(error) }
      }
    }
  )

  ipcMain.handle('config:backup', async (_, clientId: string): Promise<IpcResponse> => {
    try {
      const backup = await configService.createBackup(clientId)
      return { success: true, data: backup }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle(
    'config:restore',
    async (_, backupPath: string, clientId: string): Promise<IpcResponse> => {
      try {
        await configService.restoreBackup(backupPath, clientId)
        return { success: true }
      } catch (error) {
        return { success: false, error: String(error) }
      }
    }
  )

  ipcMain.handle('config:list-backups', async (_, clientId?: string): Promise<IpcResponse> => {
    try {
      const backups = await configService.listBackups(clientId)
      return { success: true, data: backups }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })
}
