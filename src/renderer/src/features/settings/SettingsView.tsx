import { useState, useEffect } from 'react'
import type { AppSettings } from '../../../../types'

export function SettingsView() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [version, setVersion] = useState('')

  useEffect(() => {
    loadSettings()
    loadVersion()
  }, [])

  const loadSettings = async () => {
    try {
      console.log('Loading settings...')
      const response = await window.api.settingsGet()
      console.log('Settings response:', response)
      if (response.success && response.data) {
        setSettings(response.data)
      } else {
        console.error('Failed to load settings:', response.error)
        // Set default settings as fallback
        setSettings({
          customClientPaths: {},
          autoBackup: true,
          checkUpdates: true,
          theme: 'system'
        })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      // Set default settings as fallback
      setSettings({
        customClientPaths: {},
        autoBackup: true,
        checkUpdates: true,
        theme: 'system'
      })
    }
  }

  const loadVersion = async () => {
    try {
      console.log('Loading version...')
      const response = await window.api.appVersion()
      console.log('Version response:', response)
      if (response.success && response.data) {
        setVersion(response.data)
      } else {
        setVersion(APP_VERSION)
      }
    } catch (error) {
      console.error('Error loading version:', error)
      setVersion(APP_VERSION)
    }
  }

  const handleSave = async () => {
    if (!settings) return

    const response = await window.api.settingsSave(settings)
    if (response.success) {
      alert('Settings saved successfully!')
    } else {
      alert(`Failed to save settings: ${response.error}`)
    }
  }

  if (!settings) {
    return (
      <div className="p-6">
        <p className="text-gray-600 dark:text-gray-400">Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Settings</h2>
        <p className="text-gray-600 dark:text-gray-400">Configure MCP Installer preferences</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 max-w-2xl">
        <div className="space-y-6">
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.autoBackup}
                onChange={e => setSettings({ ...settings, autoBackup: e.target.checked })}
                className="mr-2"
              />
              <span className="text-gray-900 dark:text-white">
                Automatically backup configurations before changes
              </span>
            </label>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.checkUpdates}
                onChange={e => setSettings({ ...settings, checkUpdates: e.target.checked })}
                className="mr-2"
              />
              <span className="text-gray-900 dark:text-white">Check for updates on startup</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Theme
            </label>
            <select
              value={settings.theme}
              onChange={e =>
                setSettings({ ...settings, theme: e.target.value as 'light' | 'dark' | 'system' })
              }
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
        <p>MCP Installer v{version}</p>
        <p className="mt-1">Built with Electron, React, and Vite</p>
      </div>
    </div>
  )
}
