import type { MCPServer } from '../../../../types'

interface ServerCardProps {
  server: MCPServer
  onInstall: () => void
  disabled?: boolean
}

export function ServerCard({ server, onInstall, disabled }: ServerCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{server.name}</h3>
        <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
          {server.category}
        </span>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{server.description}</p>

      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
        <span>by {server.author}</span>
        <span>v{server.version}</span>
      </div>

      <button
        onClick={onInstall}
        disabled={disabled}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        Install
      </button>
    </div>
  )
}
