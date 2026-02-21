import { ipcMain } from 'electron'
import { homedir } from 'os'
import { join } from 'path'
import type { IpcResponse, AIClient } from '../../types'

export function registerClientHandlers(): void {
  ipcMain.handle('client:detect', async (): Promise<IpcResponse> => {
    try {
      const clients = await detectClients()
      return { success: true, data: clients }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('client:restart', async (_, clientId: string): Promise<IpcResponse> => {
    try {
      // This would need platform-specific implementation
      // For now, just return a message
      return {
        success: true,
        data: `Please restart ${clientId} manually to apply changes`
      }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })
}

async function detectClients(): Promise<AIClient[]> {
  const homeDir = homedir()

  // Return all supported clients regardless of whether config exists
  // The app will create config files when needed
  const clients: AIClient[] = [
    {
      id: 'vscode',
      name: 'VS Code',
      // Use the Copilot Chat globalStorage folder which is commonly used by Copilot
      configPath: join(homeDir, '.config', 'Code', 'User', 'mcp.json'),
      processName: 'code'
    },
    {
      id: 'cursor',
      name: 'Cursor',
      // Cursor stores MCP settings in ~/.cursor/mcp.json on Unix-like systems
      configPath: join(homeDir, '.cursor', 'mcp.json'),
      processName: 'cursor'
    },
    {
      id: 'claude-desktop',
      name: 'Claude Desktop',
      configPath: join(homeDir, '.config', 'Claude', 'claude_desktop_config.json'),
      processName: 'claude'
    },
    {
      id: 'gemini-cli',
      name: 'Gemini CLI',
      configPath: join(homeDir, '.gemini', 'settings.json'),
      processName: 'gemini'
    }
  ]

  return clients
}
