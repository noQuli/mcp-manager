import { contextBridge, ipcRenderer } from 'electron'

// Custom APIs for renderer
const api = {
  // Config operations
  configRead: (clientId: string) => ipcRenderer.invoke('config:read', clientId),
  configSave: (clientId: string, config: unknown) =>
    ipcRenderer.invoke('config:save', clientId, config),
  configBackup: (clientId: string) => ipcRenderer.invoke('config:backup', clientId),
  configRestore: (backupPath: string, clientId: string) =>
    ipcRenderer.invoke('config:restore', backupPath, clientId),
  configListBackups: (clientId?: string) => ipcRenderer.invoke('config:list-backups', clientId),
  configOpen: (clientId: string) => ipcRenderer.invoke('config:open', clientId),

  // Catalog operations
  catalogList: (opts?: { query?: string; offset?: number; limit?: number }) =>
    ipcRenderer.invoke('catalog:list', opts ?? {}),
  catalogSearch: (query: string) => ipcRenderer.invoke('catalog:search', query),
  catalogInstall: (request: unknown) => ipcRenderer.invoke('catalog:install', request),
  catalogUninstall: (serverId: string, clientId: string) =>
    ipcRenderer.invoke('catalog:uninstall', serverId, clientId),
  catalogRefresh: () => ipcRenderer.invoke('catalog:refresh'),
  onCatalogProgress: (cb: (data: { count?: number; error?: string; done?: boolean }) => void) => {
    const handler = (
      _: Electron.IpcRendererEvent,
      data: { count?: number; error?: string; done?: boolean }
    ) => cb(data)
    ipcRenderer.on('catalog:progress', handler)
    return () => ipcRenderer.off('catalog:progress', handler)
  },

  // Server operations
  serverList: (clientId: string) => ipcRenderer.invoke('server:list', clientId),
  // Process operations
  processCheck: (processName: string) => ipcRenderer.invoke('process:check', processName),
  processKill: (processName: string) => ipcRenderer.invoke('process:kill', processName),
  processSafeToModify: (clientId: string) => ipcRenderer.invoke('process:safe-to-modify', clientId),

  // Client operations
  clientDetect: () => ipcRenderer.invoke('client:detect'),
  clientRestart: (clientId: string) => ipcRenderer.invoke('client:restart', clientId),

  // Settings
  settingsGet: () => ipcRenderer.invoke('settings:get'),
  settingsSave: (settings: unknown) => ipcRenderer.invoke('settings:save', settings),
  appVersion: () => ipcRenderer.invoke('app:version')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.api = api
}
