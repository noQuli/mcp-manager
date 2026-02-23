import { promises as fs } from 'fs'
import { join } from 'path'
import { app } from 'electron'
import type { MCPServer, RegistryResponse, RegistryServerEntry } from '../../types'

const REGISTRY_BASE = 'https://registry.modelcontextprotocol.io/v0'
const REGISTRY_PAGE_SIZE = 100

export class CatalogService {
  private catalogPath: string
  private servers: MCPServer[] = []
  private isRefreshing = false

  constructor() {
    // Use electron app.getAppPath() which works in both dev and production
    // In test environment, app may not be available
    try {
      const appPath = app.getAppPath()
      this.catalogPath = join(appPath, 'resources', 'catalog.json')
    } catch {
      // Fallback for test environment
      this.catalogPath = join(__dirname, '../../../resources/catalog.json')
    }
  }

  /**
   * Loads the server catalog from disk
   */
  async loadCatalog(): Promise<MCPServer[]> {
    // Start with the default catalog so UI has something to show immediately.
    const defaults = this.getDefaultCatalog()
    this.servers = defaults.slice()

    try {
      console.log('Loading catalog from:', this.catalogPath)
      const content = await fs.readFile(this.catalogPath, 'utf-8')
      const fileServers: MCPServer[] = JSON.parse(content)

      // Merge defaults with file servers: file entries take precedence by `id`.
      const byId = new Map<string, MCPServer>()
      for (const s of defaults) byId.set(s.id, s)
      for (const s of fileServers) byId.set(s.id, s)

      this.servers = Array.from(byId.values())
      console.log('Loaded catalog from file, servers count:', this.servers.length)
      console.log('[CatalogService] Merged default catalog with file entries')
      return this.servers
    } catch (error) {
      console.log('Failed to load catalog from file!', error)
      // Keep defaults in memory
      return this.servers
    }
  }

  /**
   * Gets a paginated + optionally filtered slice of servers.
   * All filtering is done in-memory on the main process to avoid sending
   * thousands of objects over IPC on every keystroke.
   */
  async getServers(
    opts: { query?: string; offset?: number; limit?: number } = {}
  ): Promise<{ servers: MCPServer[]; total: number }> {
    if (this.servers.length === 0) {
      await this.loadCatalog()
    }
    const { query = '', offset = 0, limit = 48 } = opts
    const lowerQ = query.toLowerCase().trim()
    const filtered = lowerQ
      ? this.servers
          .filter(
            s =>
              s.name.toLowerCase().includes(lowerQ) || s.description.toLowerCase().includes(lowerQ)
          )
          .sort((a, b) => {
            const aInName = a.name.toLowerCase().includes(lowerQ)
            const bInName = b.name.toLowerCase().includes(lowerQ)
            if (aInName && !bInName) return -1
            if (!aInName && bInName) return 1
            return 0
          })
      : this.servers
    return {
      servers: filtered.slice(offset, offset + limit),
      total: filtered.length
    }
  }

  /**
   * Gets all servers in the catalog (kept for install lookup etc.)
   */
  async getAllServers(): Promise<MCPServer[]> {
    if (this.servers.length === 0) {
      await this.loadCatalog()
    }
    return this.servers
  }

  /**
   * Searches for servers by name, description, or category
   */
  async searchServers(query: string): Promise<MCPServer[]> {
    const { servers } = await this.getServers({ query, limit: 200 })
    return servers
  }

  /**
   * Gets a server by ID
   */
  async getServerById(id: string): Promise<MCPServer | undefined> {
    const servers = await this.getAllServers()
    return servers.find(s => s.id === id)
  }

  /**
   * Fetches all pages from the official MCP registry using cursor-based pagination.
   * Calls onPage after each page is mapped so the caller can stream results.
   */
  private async fetchFromRegistry(
    signal?: AbortSignal,
    onPage?: (batch: MCPServer[], total: number) => void
  ): Promise<RegistryServerEntry[]> {
    const all: RegistryServerEntry[] = []
    let cursor: string | undefined = undefined
    let mappedSoFar = 0

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const url = new URL(`${REGISTRY_BASE}/servers`)
      url.searchParams.set('limit', String(REGISTRY_PAGE_SIZE))
      if (cursor) url.searchParams.set('cursor', cursor)

      const response = await fetch(url.toString(), signal ? { signal } : undefined)

      if (!response.ok) {
        const body = await response.text().catch(() => '')
        throw new Error(`Registry API error: ${response.status} ${response.statusText} ${body}`)
      }

      const data = (await response.json()) as RegistryResponse
      const entries = Array.isArray(data.servers) ? data.servers : []

      all.push(...entries)

      if (onPage) {
        const batch = entries
          .map(e => this.mapRegistryEntry(e))
          .filter((s): s is MCPServer => s !== null)
        mappedSoFar += batch.length
        onPage(batch, mappedSoFar)
      }

      cursor = data.metadata?.nextCursor
      if (!cursor || entries.length < REGISTRY_PAGE_SIZE) break
    }

    return all
  }

  /**
   * Maps a raw registry entry to the app's MCPServer shape.
   * Picks the best available package (npm preferred, then pypi, then oci).
   */
  private mapRegistryEntry(entry: RegistryServerEntry): MCPServer | null {
    const { server } = entry
    if (!server?.name) return null

    // Build a stable id from the registry name (e.g. "ai.autoblocks/contextlayer-mcp" → "ai-autoblocks-contextlayer-mcp")
    const id = server.name
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase()

    const packages = server.packages ?? []
    const npmPkg = packages.find(p => p.registryType === 'npm')
    const pypiPkg = packages.find(p => p.registryType === 'pypi')
    const ociPkg = packages.find(p => p.registryType === 'oci')
    const bestPkg = npmPkg ?? pypiPkg ?? ociPkg ?? packages[0]
    const remotes = server.remotes ?? []

    // Determine run command/args
    let command: string
    let args: string[]

    if (npmPkg) {
      command = 'npx'
      args = ['-y', npmPkg.identifier, ...(npmPkg.runtimeArguments ?? [])]
    } else if (pypiPkg) {
      command = 'uvx'
      args = [pypiPkg.identifier, ...(pypiPkg.runtimeArguments ?? [])]
    } else if (ociPkg) {
      command = 'docker'
      args = ['run', '--rm', '-i', ociPkg.identifier]
    } else if (remotes.length > 0) {
      // Remote/streamable-http server — store URL as "command" for display purposes
      command = remotes[0].url
      args = []
    } else {
      return null // Can't determine how to run this
    }

    // Build env + parameters from environment variables declared in best package
    const envVars = bestPkg?.environmentVariables ?? []
    const env: Record<string, string> = {}
    const parameters: MCPServer['parameters'] = []

    for (const ev of envVars) {
      env[ev.name] = ''
      parameters.push({
        name: ev.name,
        type: ev.isSecret ? 'secret' : 'string',
        description: ev.description ?? ev.name,
        required: false,
        envVar: ev.name
      })
    }

    // Infer category from name/description
    const nameAndDesc = `${server.name} ${server.description ?? ''}`.toLowerCase()
    let category = 'General'
    if (/search|web|browse/.test(nameAndDesc)) category = 'Search'
    else if (/git|github|gitlab|code|dev|repo/.test(nameAndDesc)) category = 'Development'
    else if (/file|filesystem|storage|disk/.test(nameAndDesc)) category = 'Utilities'
    else if (/database|sql|mongo|redis|postgres/.test(nameAndDesc)) category = 'Database'
    else if (/ai|llm|openai|claude|gemini/.test(nameAndDesc)) category = 'AI'
    else if (/slack|discord|email|calendar|notion/.test(nameAndDesc)) category = 'Productivity'

    return {
      id,
      name: server.name.split('/').pop() ?? server.name, // use short name for display
      description: server.description ?? '',
      category,
      author: server.name.split('/')[0] ?? 'Unknown',
      version: server.version ?? bestPkg?.version ?? '0.0.0',
      repository: server.repository?.url,
      command,
      args,
      ...(Object.keys(env).length > 0 ? { env } : {}),
      parameters,
      dependencies: bestPkg
        ? [
            {
              type: npmPkg ? 'npm' : pypiPkg ? 'pip' : 'system',
              name: npmPkg ? 'npx' : pypiPkg ? 'uvx' : 'docker',
              checkCommand: npmPkg
                ? 'npx --version'
                : pypiPkg
                  ? 'uvx --version'
                  : 'docker --version'
            }
          ]
        : []
    }
  }

  /**
   * Fetches all servers from the official MCP registry, maps them to the app
   * format, persists to disk, and refreshes the in-memory cache.
   * Calls onPage(batch, totalSoFar) after each page so callers can stream progress.
   */
  async refreshFromRegistry(
    signal?: AbortSignal,
    onPage?: (batch: MCPServer[], totalSoFar: number) => void
  ): Promise<MCPServer[]> {
    console.log('[CatalogService] Refreshing catalog from registry...')
    if (this.isRefreshing) {
      console.log('[CatalogService] Refresh already in progress, skipping.')
      return this.servers
    }
    this.isRefreshing = true
    this.servers = [] // reset so streaming appends cleanly
    const seenIds = new Set<string>()

    // Wipe the on-disk catalog immediately so a mid-fetch restart never
    // reads stale + partial data and appends on top of it
    try {
      await fs.mkdir(join(this.catalogPath, '..'), { recursive: true })
      await fs.writeFile(this.catalogPath, '[]', 'utf-8')
    } catch {
      /* non-fatal */
    }

    let allEntries: RegistryServerEntry[]
    try {
      allEntries = await this.fetchFromRegistry(signal, (batch, _totalSoFar) => {
        const unique = batch.filter(s => {
          if (seenIds.has(s.id)) return false
          seenIds.add(s.id)
          return true
        })
        this.servers.push(...unique)
        onPage?.(unique, this.servers.length)
      })
    } catch (err) {
      this.isRefreshing = false
      throw err
    }

    console.log(
      `[CatalogService] Fetched ${allEntries.length} raw entries, mapped ${this.servers.length} servers`
    )

    // Persist to catalog.json so it's available offline / on next launch
    const snapshot = [...this.servers]
    fs.mkdir(join(this.catalogPath, '..'), { recursive: true })
      .then(() => fs.writeFile(this.catalogPath, JSON.stringify(snapshot, null, 2), 'utf-8'))
      .then(() =>
        console.log(`[CatalogService] Saved ${snapshot.length} servers to`, this.catalogPath)
      )
      .catch(err => console.warn('[CatalogService] Could not persist catalog:', err))
      .finally(() => {
        this.isRefreshing = false
      })

    return this.servers
  }

  /**
   * Returns a default catalog for demo purposes
   */
  private getDefaultCatalog(): MCPServer[] {
    return [
      {
        id: 'filesystem',
        name: 'Filesystem',
        description: 'Secure file operations for AI assistants',
        category: 'Utilities',
        author: 'MCP Team',
        version: '1.0.0',
        repository: 'https://github.com/modelcontextprotocol/servers',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/home'],
        parameters: [
          {
            name: 'rootPath',
            type: 'path',
            description: 'Root directory path for file operations',
            required: true,
            default: '/home'
          }
        ],
        dependencies: [
          {
            type: 'npm',
            name: 'npx',
            checkCommand: 'npx --version'
          }
        ]
      },
      {
        id: 'brave-search',
        name: 'Brave Search',
        description: 'Web search using Brave Search API',
        category: 'Search',
        author: 'MCP Team',
        version: '1.0.0',
        repository: 'https://github.com/modelcontextprotocol/servers',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-brave-search'],
        env: {
          BRAVE_API_KEY: ''
        },
        parameters: [
          {
            name: 'apiKey',
            type: 'secret',
            description: 'Brave Search API Key',
            required: true,
            envVar: 'BRAVE_API_KEY'
          }
        ],
        dependencies: [
          {
            type: 'npm',
            name: 'npx',
            checkCommand: 'npx --version'
          }
        ]
      },
      {
        id: 'github',
        name: 'GitHub',
        description: 'Repository management and interaction',
        category: 'Development',
        author: 'MCP Team',
        version: '1.0.0',
        repository: 'https://github.com/modelcontextprotocol/servers',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github'],
        env: {
          GITHUB_PERSONAL_ACCESS_TOKEN: ''
        },
        parameters: [
          {
            name: 'token',
            type: 'secret',
            description: 'GitHub Personal Access Token',
            required: true,
            envVar: 'GITHUB_PERSONAL_ACCESS_TOKEN'
          }
        ],
        dependencies: [
          {
            type: 'npm',
            name: 'npx',
            checkCommand: 'npx --version'
          }
        ]
      }
    ]
  }
}

export const catalogService = new CatalogService()
