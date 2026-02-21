// Shared TypeScript interfaces for MCP Installer

export interface MCPServer {
  id: string
  name: string
  description: string
  category: string
  author: string
  version: string
  repository?: string
  command: string
  args?: string[]
  env?: Record<string, string>
  parameters: ServerParameter[]
  dependencies: Dependency[]
}

export interface ServerParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'secret' | 'path'
  description: string
  required: boolean
  default?: string | number | boolean
  envVar?: string
}

export interface Dependency {
  type: 'npm' | 'pip' | 'system'
  name: string
  command?: string
  checkCommand?: string
}

export interface AIClient {
  id: string
  name: string
  configPath: string
  processName: string
  icon?: string
}

export interface InstalledServer {
  serverId: string
  clientId: string
  enabled: boolean
  installedAt: string
  configuration: Record<string, unknown>
}

export interface ConfigBackup {
  clientId: string
  path: string
  timestamp: string
  content: string
}

export interface IpcResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface ServerInstallRequest {
  serverId: string
  clientId: string
  parameters: Record<string, unknown>
}

export interface ServerToggleRequest {
  serverId: string
  clientId: string
  enabled: boolean
}

export interface AppSettings {
  customClientPaths: Record<string, string>
  autoBackup: boolean
  checkUpdates: boolean
  theme: 'light' | 'dark' | 'system'
}

// ─── Registry API types ──────────────────────────────────────────────────────

export interface RegistryPackage {
  registryType: 'npm' | 'pypi' | 'oci' | string
  identifier: string
  version?: string
  transport?: { type: 'stdio' | 'streamable-http' | string }
  runtimeArguments?: string[]
  environmentVariables?: RegistryEnvVar[]
}

export interface RegistryEnvVar {
  name: string
  description?: string
  format?: string
  isSecret?: boolean
}

export interface RegistryServerEntry {
  server: {
    name: string
    description?: string
    version?: string
    repository?: { url?: string; source?: string }
    packages?: RegistryPackage[]
    remotes?: Array<{ type: string; url: string }>
  }
  _meta?: {
    'io.modelcontextprotocol.registry/official'?: {
      status?: string
      publishedAt?: string
      updatedAt?: string
    }
  }
}

export interface RegistryResponse {
  servers: RegistryServerEntry[]
  metadata?: {
    nextCursor?: string
    count?: number
  }
}

// IPC Channel Types
export interface IpcChannels {
  // Config operations
  'config:read': (clientId: string) => Promise<IpcResponse<unknown>>
  'config:save': (clientId: string, config: unknown) => Promise<IpcResponse<void>>
  'config:backup': (clientId: string) => Promise<IpcResponse<ConfigBackup>>
  'config:restore': (backupId: string) => Promise<IpcResponse<void>>

  // Catalog operations
  'catalog:list': () => Promise<IpcResponse<MCPServer[]>>
  'catalog:search': (query: string) => Promise<IpcResponse<MCPServer[]>>
  'catalog:install': (request: ServerInstallRequest) => Promise<IpcResponse<void>>
  'catalog:uninstall': (serverId: string, clientId: string) => Promise<IpcResponse<void>>
  'catalog:refresh': () => Promise<IpcResponse<{ count: number }>>

  // Server operations
  'server:toggle': (request: ServerToggleRequest) => Promise<IpcResponse<void>>
  'server:list': (clientId: string) => Promise<IpcResponse<InstalledServer[]>>

  // Secret operations
  'secrets:save': (key: string, value: string) => Promise<IpcResponse<void>>
  'secrets:get': (key: string) => Promise<IpcResponse<string>>
  'secrets:delete': (key: string) => Promise<IpcResponse<void>>

  // Process operations
  'process:check': (processName: string) => Promise<IpcResponse<boolean>>
  'process:kill': (processName: string) => Promise<IpcResponse<void>>

  // Client operations
  'client:detect': () => Promise<IpcResponse<AIClient[]>>
  'client:restart': (clientId: string) => Promise<IpcResponse<void>>

  // Settings
  'settings:get': () => Promise<IpcResponse<AppSettings>>
  'settings:save': (settings: AppSettings) => Promise<IpcResponse<void>>
}
