import { useState, useEffect } from 'react'
import { Sidebar } from './components/Sidebar'
import { CatalogView } from './features/catalog/CatalogView'
import { TriggersView } from './features/triggers/TriggersView'
import { SettingsView } from './features/settings/SettingsView'
import type { AIClient } from '../../types'

type View = 'catalog' | 'triggers' | 'settings'

function App() {
  const [currentView, setCurrentView] = useState<View>('catalog')
  const [selectedClient, setSelectedClient] = useState<AIClient | null>(null)
  const [clients, setClients] = useState<AIClient[]>([])

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    try {
      console.log('Loading clients...')
      const response = await window.api.clientDetect()
      console.log('Client detection response:', response)
      if (response.success && response.data) {
        setClients(response.data)
        if (response.data.length > 0) {
          setSelectedClient(response.data[0])
        }
      } else {
        console.error('Failed to load clients:', response.error)
        // Set default clients as fallback
        const defaultClients: AIClient[] = [
          { id: 'vscode', name: 'VS Code', configPath: '', processName: 'code' },
          { id: 'cursor', name: 'Cursor', configPath: '', processName: 'cursor' },
          { id: 'claude-desktop', name: 'Claude Desktop', configPath: '', processName: 'claude' },
          { id: 'gemini-cli', name: 'Gemini CLI', configPath: '', processName: 'gemini' }
        ]
        setClients(defaultClients)
        setSelectedClient(defaultClients[0])
      }
    } catch (error) {
      console.error('Error loading clients:', error)
      // Set default clients as fallback
      const defaultClients: AIClient[] = [
        { id: 'vscode', name: 'VS Code', configPath: '', processName: 'code' },
        { id: 'cursor', name: 'Cursor', configPath: '', processName: 'cursor' },
        { id: 'claude-desktop', name: 'Claude Desktop', configPath: '', processName: 'claude' },
        { id: 'gemini-cli', name: 'Gemini CLI', configPath: '', processName: 'gemini' }
      ]
      setClients(defaultClients)
      setSelectedClient(defaultClients[0])
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        selectedClient={selectedClient}
        clients={clients}
        onClientSelect={setSelectedClient}
      />

      <main className="flex-1 overflow-auto">
        {currentView === 'catalog' && <CatalogView selectedClient={selectedClient} />}
        {currentView === 'triggers' && <TriggersView selectedClient={selectedClient} />}
        {currentView === 'settings' && <SettingsView />}
      </main>
    </div>
  )
}

export default App
