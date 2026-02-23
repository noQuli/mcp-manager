import { promises as fs } from 'fs'
import { join, dirname } from 'path'
import { homedir } from 'os'
import writeFileAtomic from 'write-file-atomic'
import type { ConfigBackup } from '../../types'

export class ConfigService {
  private backupDir: string

  constructor() {
    const homeDir = homedir()
    this.backupDir = join(homeDir, '.mcp-manager', 'backups')
  }

  private getServersKey(clientId: string): 'mcpServers' | 'servers' {
    return clientId === 'vscode' ? 'servers' : 'mcpServers'
  }

  /**
   * Ensures the backup directory exists
   */
  private async ensureBackupDir(): Promise<void> {
    try {
      await fs.mkdir(this.backupDir, { recursive: true })
    } catch (error) {
      console.error('Failed to create backup directory:', error)
      throw error
    }
  }

  /**
   * Gets the default config path for a client
   */
  getClientConfigPath(clientId: string): string {
    const homeDir = homedir()
    const paths: Record<string, string> = {
      // Use Copilot Chat globalStorage path for VS Code
      vscode: join(homeDir, '.config', 'Code', 'User', 'mcp.json'),
      // Cursor uses a local ~/.cursor/mcp.json file on Unix-like systems
      cursor: join(homeDir, '.cursor', 'mcp.json'),
      'claude-desktop': join(homeDir, '.config', 'Claude', 'claude_desktop_config.json'),
      'gemini-cli': join(homeDir, '.gemini', 'settings.json')
    }

    return paths[clientId] || ''
  }

  /**
   * Reads a configuration file
   */
  async readConfig(clientId: string): Promise<unknown> {
    const configPath = this.getClientConfigPath(clientId)
    console.log('[ConfigService] readConfig called for client:', clientId)
    console.log('[ConfigService] Config path:', configPath)

    try {
      const content = await fs.readFile(configPath, 'utf-8')
      console.log('[ConfigService] Config file read successfully, length:', content.length)
      const parsed = JSON.parse(content)
      console.log('[ConfigService] Config parsed, keys:', Object.keys(parsed))
      // Normalize: some tools use `servers` instead of `mcpServers`
      const mutableConfig = parsed as Record<string, unknown>
      if (mutableConfig.servers && !mutableConfig.mcpServers) {
        mutableConfig.mcpServers = mutableConfig.servers
        delete mutableConfig.servers
        console.log(
          '[ConfigService] Normalized `servers` -> `mcpServers` and removed original `servers` key'
        )
      }
      return parsed
    } catch (error) {
      console.error('[ConfigService] Error reading config:', error)
      // Return empty config if file doesn't exist
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        console.log('[ConfigService] Config file not found, returning empty config')
        return { mcpServers: {} }
      }
      throw error
    }
  }

  /**
   * Creates a backup of a config file before modification
   */
  async createBackup(clientId: string): Promise<ConfigBackup> {
    await this.ensureBackupDir()

    const configPath = this.getClientConfigPath(clientId)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupFileName = `${clientId}-${timestamp}.json`
    const backupPath = join(this.backupDir, backupFileName)

    try {
      const content = await fs.readFile(configPath, 'utf-8')
      await fs.writeFile(backupPath, content, 'utf-8')

      return {
        clientId,
        path: backupPath,
        timestamp: new Date().toISOString(),
        content
      }
    } catch (error) {
      console.error('Backup creation failed:', error)
      throw error
    }
  }

  /**
   * Atomically saves a configuration file
   */
  async saveConfig(clientId: string, config: unknown): Promise<void> {
    const configPath = this.getClientConfigPath(clientId)
    const normalizedConfig = structuredClone(config as Record<string, unknown>)
    const serversKey = this.getServersKey(clientId)

    if (serversKey === 'servers') {
      if ((normalizedConfig as any).mcpServers && !(normalizedConfig as any).servers) {
        (normalizedConfig as any).servers = (normalizedConfig as any).mcpServers
        delete (normalizedConfig as any).mcpServers
      }
    } else {
      if ((normalizedConfig as any).servers && !(normalizedConfig as any).mcpServers) {
        (normalizedConfig as any).mcpServers = (normalizedConfig as any).servers
        delete (normalizedConfig as any).servers
      }
    }

    // Ensure the directory exists
    await fs.mkdir(dirname(configPath), { recursive: true })

    // Create backup before writing
    try {
      await this.createBackup(clientId)
    } catch (error) {
      // Backup might fail if file doesn't exist yet - that's okay
      console.log('Backup skipped (file may not exist yet)')
    }

    try {
      // Use atomic write to prevent corruption
      const configString = JSON.stringify(normalizedConfig, null, 2)
      await writeFileAtomic(configPath, configString, { encoding: 'utf-8' })

      // Verify the write was successful
      await this.verifyConfig(configPath)
    } catch (error) {
      console.error('Config save failed:', error)
      throw error
    }
  }

  /**
   * Verifies that a config file is valid JSON
   */
  private async verifyConfig(configPath: string): Promise<void> {
    try {
      const content = await fs.readFile(configPath, 'utf-8')
      JSON.parse(content)
    } catch (error) {
      throw new Error(`Configuration verification failed: ${error}`)
    }
  }

  /**
   * Restores a configuration from backup
   */
  async restoreBackup(backupPath: string, clientId: string): Promise<void> {
    const configPath = this.getClientConfigPath(clientId)

    try {
      const backupContent = await fs.readFile(backupPath, 'utf-8')
      await writeFileAtomic(configPath, backupContent, { encoding: 'utf-8' })
    } catch (error) {
      console.error('Backup restoration failed:', error)
      throw error
    }
  }

  /**
   * Lists all available backups
   */
  async listBackups(clientId?: string): Promise<ConfigBackup[]> {
    await this.ensureBackupDir()

    try {
      const files = await fs.readdir(this.backupDir)
      const backups: ConfigBackup[] = []

      for (const file of files) {
        if (clientId && !file.startsWith(clientId)) {
          continue
        }

        const backupPath = join(this.backupDir, file)
        const stats = await fs.stat(backupPath)
        const content = await fs.readFile(backupPath, 'utf-8')

        backups.push({
          clientId: file.split('-')[0],
          path: backupPath,
          timestamp: stats.mtime.toISOString(),
          content
        })
      }

      return backups.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    } catch (error) {
      console.error('Failed to list backups:', error)
      return []
    }
  }
}

export const configService = new ConfigService()
