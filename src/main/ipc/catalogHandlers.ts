import { ipcMain, BrowserWindow } from 'electron'
import { catalogService } from '../services/CatalogService'
import { configService } from '../services/ConfigService'
import type { IpcResponse, ServerInstallRequest, InstalledServer } from '../../types'

type McpClientConfig = { mcpServers?: Record<string, Record<string, unknown>> }

export function registerCatalogHandlers(): void {
  ipcMain.handle(
    'catalog:list',
    async (
      _,
      opts: { query?: string; offset?: number; limit?: number } = {}
    ): Promise<IpcResponse> => {
      try {
        const result = await catalogService.getServers(opts)
        return { success: true, data: result }
      } catch (error) {
        return { success: false, error: String(error) }
      }
    }
  )

  ipcMain.handle('catalog:search', async (_, query: string): Promise<IpcResponse> => {
    try {
      const servers = await catalogService.searchServers(query)
      return { success: true, data: servers }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle(
    'catalog:install',
    async (_, request: ServerInstallRequest): Promise<IpcResponse> => {
      try {
        const { serverId, clientId, parameters } = request

        // Get server details
        const server = await catalogService.getServerById(serverId)
        if (!server) {
          return { success: false, error: 'Server not found' }
        }

        // Read current config
        const config = (await configService.readConfig(clientId)) as McpClientConfig

        // Ensure mcpServers object exists
        if (!config.mcpServers) {
          config.mcpServers = {}
        }

        // Build server configuration
        const serverConfig: Record<string, unknown> = {
          command: server.command
        }

        if (server.args && server.args.length > 0) {
          serverConfig.args = server.args
        }

        // Add environment variables
        if (server.env || server.parameters.some(p => p.envVar)) {
          const env: Record<string, string> = server.env ? { ...server.env } : {}
          for (const param of server.parameters) {
            if (param.envVar && parameters[param.name]) {
              env[param.envVar] = String(parameters[param.name])
            }
          }
          serverConfig.env = env
        }

        // Add server to config
        config.mcpServers[serverId] = serverConfig

        // Save config
        await configService.saveConfig(clientId, config)

        return { success: true }
      } catch (error) {
        return { success: false, error: String(error) }
      }
    }
  )

  ipcMain.handle(
    'catalog:uninstall',
    async (_, serverId: string, clientId: string): Promise<IpcResponse> => {
      try {
        // Read current config
        const config = (await configService.readConfig(clientId)) as McpClientConfig

        if (!config.mcpServers || !config.mcpServers[serverId]) {
          return { success: false, error: 'Server not installed' }
        }

        // Remove server from config
        delete config.mcpServers[serverId]

        // Save config
        await configService.saveConfig(clientId, config)

        return { success: true }
      } catch (error) {
        return { success: false, error: String(error) }
      }
    }
  )

  ipcMain.handle('catalog:refresh', async (event): Promise<IpcResponse> => {
    // Return immediately — refresh runs in background and streams progress
    const win = BrowserWindow.fromWebContents(event.sender)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5 * 60 * 1000)

    catalogService
      .refreshFromRegistry(controller.signal, (_batch, totalSoFar) => {
        win?.webContents.send('catalog:progress', { count: totalSoFar })
      })
      .then(servers => {
        clearTimeout(timeout)
        win?.webContents.send('catalog:progress', { count: servers.length, done: true })
      })
      .catch(err => {
        clearTimeout(timeout)
        win?.webContents.send('catalog:progress', { error: String(err), done: true })
      })

    return { success: true, data: { started: true } }
  })

  ipcMain.handle('server:list', async (_, clientId: string): Promise<IpcResponse> => {
    try {
      console.log('[catalogHandlers] server:list called for client:', clientId)
      const configPath = configService.getClientConfigPath(clientId)
      console.log('[catalogHandlers] Config path:', configPath)

      const config = (await configService.readConfig(clientId)) as McpClientConfig
      console.log('[catalogHandlers] Read config:', JSON.stringify(config, null, 2))

      const installedServers: InstalledServer[] = []

      if (config.mcpServers) {
        console.log('[catalogHandlers] Found mcpServers, processing...')
        for (const [serverId, serverConfig] of Object.entries(config.mcpServers)) {
          console.log('[catalogHandlers] Processing server:', serverId, serverConfig)
          installedServers.push({
            serverId,
            clientId,
            enabled: true, // We'll track this in a separate metadata file later
            installedAt: new Date().toISOString(),
            configuration: serverConfig as Record<string, unknown>
          })
        }
      } else {
        console.log('[catalogHandlers] No mcpServers found in config')
      }

      console.log('[catalogHandlers] Returning installed servers:', installedServers.length)
      return { success: true, data: installedServers }
    } catch (error) {
      console.error('[catalogHandlers] Error in server:list:', error)
      return { success: false, error: String(error) }
    }
  })
}
