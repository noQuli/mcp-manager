import type { AIClient } from '../../../types'

interface SidebarProps {
  currentView: string
  onViewChange: (view: 'catalog' | 'triggers' | 'settings') => void
  selectedClient: AIClient | null
  clients: AIClient[]
  onClientSelect: (client: AIClient) => void
}

export function Sidebar({
  currentView,
  onViewChange,
  selectedClient,
  clients,
  onClientSelect
}: SidebarProps) {
  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">MCP Installer</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Model Context Protocol</p>
      </div>

      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Target Client
        </label>
        <select
          value={selectedClient?.id || ''}
          onChange={e => {
            const client = clients.find(c => c.id === e.target.value)
            if (client) onClientSelect(client)
          }}
          disabled={clients.length === 0}
          className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {clients.length === 0 && <option>Loading clients...</option>}
          {clients.map(client => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => selectedClient && window.api.configOpen(selectedClient.id)}
          disabled={!selectedClient}
          className="mt-2 w-full px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 rounded-md transition-colors text-left"
        >
          📄 Open Config File
        </button>
      </div>

      <nav className="flex-1 p-4">
        <button
          onClick={() => onViewChange('catalog')}
          className={`w-full text-left px-4 py-2 rounded-md mb-2 ${
            currentView === 'catalog'
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          📚 Catalog
        </button>
        <button
          onClick={() => onViewChange('triggers')}
          className={`w-full text-left px-4 py-2 rounded-md mb-2 ${
            currentView === 'triggers'
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          ⚡ Installed Servers
        </button>
        <button
          onClick={() => onViewChange('settings')}
          className={`w-full text-left px-4 py-2 rounded-md ${
            currentView === 'settings'
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          ⚙️ Settings
        </button>
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
        v{APP_VERSION}
      </div>
    </aside>
  )
}
