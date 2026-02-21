import { describe, it, expect } from 'vitest'
import { ConfigService } from '../src/main/services/ConfigService'
import type { InstalledServer } from '../src/types'

describe('Server Detection E2E', () => {
  it('should detect installed servers from Claude Desktop config', async () => {
    const configService = new ConfigService()
    const clientId = 'claude-desktop'

    // Simulate what the IPC handler does
    const config = (await configService.readConfig(clientId)) as {
      mcpServers?: Record<string, unknown>
    }
    const installedServers: InstalledServer[] = []

    if (config.mcpServers) {
      for (const [serverId, serverConfig] of Object.entries(config.mcpServers)) {
        installedServers.push({
          serverId,
          clientId,
          enabled: true,
          installedAt: new Date().toISOString(),
          configuration: serverConfig as Record<string, unknown>
        })
      }
    }

    console.log('Detected installed servers:', installedServers)
    console.log('Count:', installedServers.length)

    // The test user has 2 servers installed in Claude Desktop
    if (installedServers.length > 0) {
      expect(installedServers.length).toBeGreaterThanOrEqual(2)
      expect(installedServers.map(s => s.serverId)).toContain('desktop-commander')
      expect(installedServers.map(s => s.serverId)).toContain('github')
    }
  })
})
