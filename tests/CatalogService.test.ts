import { describe, it, expect } from 'vitest'
import { CatalogService } from '../src/main/services/CatalogService'

describe('CatalogService', () => {
  const catalogService = new CatalogService()

  it('should load default catalog', async () => {
    const servers = await catalogService.getAllServers()
    expect(servers.length).toBeGreaterThan(0)
    expect(servers[0]).toHaveProperty('id')
    expect(servers[0]).toHaveProperty('name')
    expect(servers[0]).toHaveProperty('command')
  })

  it('should search servers by name', async () => {
    const results = await catalogService.searchServers('filesystem')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].name.toLowerCase()).toContain('filesystem')
  })

  it('should search servers by description', async () => {
    // 'document-processing' matches "file" only in description, not in name
    const results = await catalogService.searchServers('file')
    const descOnlyMatch = results.find(
      s => !s.name.toLowerCase().includes('file') && s.description.toLowerCase().includes('file')
    )
    expect(descOnlyMatch).toBeDefined()
  })

  it('should prioritize name matches over description-only matches', async () => {
    const query = 'github'
    const results = await catalogService.searchServers(query)
    expect(results.length).toBeGreaterThan(0)

    const firstDescOnlyIdx = results.findIndex(
      s => !s.name.toLowerCase().includes(query) && s.description.toLowerCase().includes(query)
    )
    const lastNameMatchIdx = results.reduce(
      (last, s, i) => (s.name.toLowerCase().includes(query) ? i : last),
      -1
    )

    // Only assert ordering when both groups are present
    if (firstDescOnlyIdx !== -1 && lastNameMatchIdx !== -1) {
      expect(lastNameMatchIdx).toBeLessThan(firstDescOnlyIdx)
    }
  })

  it('should get server by id', async () => {
    const server = await catalogService.getServerById('filesystem')
    expect(server).toBeDefined()
    expect(server?.id).toBe('filesystem')
  })

  it('should return empty array for invalid search', async () => {
    const results = await catalogService.searchServers('nonexistentserverxyz123')
    expect(results).toEqual([])
  })
})
