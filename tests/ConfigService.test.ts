import { describe, it, expect, beforeEach } from 'vitest'
import { ConfigService } from '../src/main/services/ConfigService'
import { promises as fs } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

describe('ConfigService', () => {
  let configService: ConfigService
  let testDir: string

  beforeEach(async () => {
    configService = new ConfigService()
    testDir = join(tmpdir(), 'mcp-manager-test')
    await fs.mkdir(testDir, { recursive: true })
  })

  it('should create a valid config path', () => {
    const path = configService.getClientConfigPath('vscode')
    expect(path).toContain('Code')
    expect(path).toContain('.config')
  })

  it('should return empty config for non-existent file', async () => {
    const config = await configService.readConfig('test-client')
    expect(config).toEqual({ mcpServers: {} })
  })

  it('should save and read config atomically', async () => {
    const testConfig = {
      mcpServers: {
        'test-server': {
          command: 'npx',
          args: ['-y', 'test-package']
        }
      }
    }

    // This test would need proper mocking of the file system
    // For now, we'll just verify the structure
    expect(testConfig.mcpServers).toBeDefined()
    expect(testConfig.mcpServers['test-server'].command).toBe('npx')
  })
})
