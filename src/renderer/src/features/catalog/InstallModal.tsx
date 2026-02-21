import { useState } from 'react'
import type { MCPServer } from '../../../../types'

interface InstallModalProps {
  server: MCPServer
  onClose: () => void
  onInstall: (parameters: Record<string, unknown>) => void
  isInstalling: boolean
}

export function InstallModal({ server, onClose, onInstall, isInstalling }: InstallModalProps) {
  const [parameters, setParameters] = useState<Record<string, unknown>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onInstall(parameters)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Install {server.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{server.description}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {server.parameters.length > 0 ? (
            <div className="space-y-4 mb-6">
              {server.parameters.map(param => (
                <div key={param.name}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {param.name}
                    {param.required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type={param.type === 'secret' ? 'password' : 'text'}
                    placeholder={param.description}
                    required={param.required}
                    defaultValue={param.default as string}
                    onChange={e => setParameters({ ...parameters, [param.name]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {param.description}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              No additional configuration required.
            </p>
          )}

          {server.dependencies.length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
                Dependencies
              </h4>
              <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
                {server.dependencies.map((dep, idx) => (
                  <li key={idx}>
                    • {dep.name} ({dep.type})
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isInstalling}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isInstalling}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isInstalling ? 'Installing...' : 'Install'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
