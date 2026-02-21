import { useState, useEffect } from 'react'
import type { AIClient, InstalledServer } from '../../../../types'

interface TriggersViewProps {
  selectedClient: AIClient | null
}

export function TriggersView({ selectedClient }: TriggersViewProps) {
  const [installedServers, setInstalledServers] = useState<InstalledServer[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (selectedClient) {
      loadInstalledServers()
    }
  }, [selectedClient])

  const loadInstalledServers = async () => {
    if (!selectedClient) return

    setLoading(true)
    const response = await window.api.serverList(selectedClient.id)
    setLoading(false)

    if (response.success) {
      setInstalledServers(response.data)
    }
  }

  const handleUninstall = async (serverId: string) => {
    if (!selectedClient) return

    if (!confirm(`Are you sure you want to uninstall ${serverId}?`)) {
      return
    }

    const response = await window.api.catalogUninstall(serverId, selectedClient.id)
    if (response.success) {
      alert('Server uninstalled successfully!')
      loadInstalledServers()
    } else {
      alert(`Uninstall failed: ${response.error}`)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Installed Servers</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Manage servers installed for {selectedClient?.name || 'your AI client'}
        </p>
      </div>

      {!selectedClient && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-yellow-800 dark:text-yellow-200">
            Please select a target client from the sidebar.
          </p>
        </div>
      )}

      {loading && (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      )}

      {!loading && installedServers.length === 0 && selectedClient && (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            No servers installed yet. Visit the Catalog to install servers.
          </p>
        </div>
      )}

      {!loading && installedServers.length > 0 && (
        <div className="space-y-4">
          {installedServers.map(server => (
            <div
              key={server.serverId}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {server.serverId}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Installed: {new Date(server.installedAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      server.enabled
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {server.enabled ? 'Enabled' : 'Disabled'}
                  </span>

                  <button
                    onClick={() => handleUninstall(server.serverId)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Uninstall
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
