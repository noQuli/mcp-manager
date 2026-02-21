import { ipcMain, app } from 'electron'
import type { IpcResponse, AppSettings } from '../../types'

// Simple in-memory settings store for MVP
// In production, this would use electron-store properly
let settingsStore: AppSettings = {
  customClientPaths: {},
  autoBackup: true,
  checkUpdates: true,
  theme: 'system'
}

export function registerSettingsHandlers(): void {
  ipcMain.handle('settings:get', async (): Promise<IpcResponse> => {
    try {
      return { success: true, data: settingsStore }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('settings:save', async (_, settings: AppSettings): Promise<IpcResponse> => {
    try {
      settingsStore = { ...settingsStore, ...settings }
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('app:version', async (): Promise<IpcResponse> => {
    try {
      return { success: true, data: app.getVersion() }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })
}
