export {}

type IpcResult<T = unknown> = { success: boolean; data?: T; error?: string }

declare global {
  interface Window {
    api: {
      // Config operations
      configRead: (clientId: string) => Promise<IpcResult>
      configSave: (clientId: string, config: unknown) => Promise<IpcResult>
      configBackup: (clientId: string) => Promise<IpcResult>
      configRestore: (backupPath: string, clientId: string) => Promise<IpcResult>
      configListBackups: (clientId?: string) => Promise<IpcResult>
      configOpen: (clientId: string) => Promise<IpcResult>

      // Catalog operations
      catalogList: (opts?: {
        query?: string
        offset?: number
        limit?: number
      }) => Promise<IpcResult>
      catalogSearch: (query: string) => Promise<IpcResult>
      catalogInstall: (request: unknown) => Promise<IpcResult>
      catalogUninstall: (serverId: string, clientId: string) => Promise<IpcResult>
      catalogRefresh: () => Promise<IpcResult>
      onCatalogProgress: (
        cb: (data: { count?: number; error?: string; done?: boolean }) => void
      ) => () => void

      // Server operations
      serverList: (clientId: string) => Promise<any>

      // Secret operations
      secretsSave: (key: string, value: string) => Promise<IpcResult>
      secretsGet: (key: string) => Promise<IpcResult>
      secretsDelete: (key: string) => Promise<IpcResult>

      // Process operations
      processCheck: (processName: string) => Promise<IpcResult>
      processKill: (processName: string) => Promise<IpcResult>
      processSafeToModify: (clientId: string) => Promise<IpcResult>

      // Client operations
      clientDetect: () => Promise<any>
      clientRestart: (clientId: string) => Promise<IpcResult>

      // Settings
      settingsGet: () => Promise<any>
      settingsSave: (settings: unknown) => Promise<IpcResult>
      appVersion: () => Promise<any>
    }
  }
}
