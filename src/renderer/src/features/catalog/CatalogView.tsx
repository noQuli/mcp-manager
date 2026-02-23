import { useState, useEffect, useRef, useCallback } from 'react'
import type { MCPServer, AIClient, ServerInstallRequest } from '../../../../types'
import { ServerCard } from './ServerCard'
import { InstallModal } from './InstallModal'

interface CatalogViewProps {
  selectedClient: AIClient | null
}

const PAGE_SIZE = 48

export function CatalogView({ selectedClient }: CatalogViewProps) {
  const [servers, setServers] = useState<MCPServer[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [selectedServer, setSelectedServer] = useState<MCPServer | null>(null)
  const [isInstalling, setIsInstalling] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [progressCount, setProgressCount] = useState<number | null>(null)
  const [progressDone, setProgressDone] = useState(false)
  const [progressError, setProgressError] = useState('')
  const sentinelRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const progressRefreshRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestQueryRef = useRef('')

  // Debounce search input 300ms before firing IPC
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedQuery(query), 300)
  }

  // Re-fetch from offset 0 whenever the debounced query changes
  useEffect(() => {
    latestQueryRef.current = debouncedQuery
    setOffset(0)
    setServers([])
    fetchPage(0, debouncedQuery)
  }, [debouncedQuery])

  // On mount: subscribe to streaming progress events
  useEffect(() => {
    // Subscribe to streaming progress events
    const unsub = window.api.onCatalogProgress(data => {
      if (data.error) {
        setProgressError(data.error)
        setProgressDone(true)
      } else {
        setProgressCount(data.count ?? null)
        if (data.done) {
          setProgressDone(true)
          // Reload first page with fresh data
          setOffset(0)
          setServers([])
          fetchPage(0, latestQueryRef.current)
        } else if (!progressRefreshRef.current) {
          progressRefreshRef.current = setTimeout(() => {
            progressRefreshRef.current = null
            setOffset(0)
            setServers([])
            fetchPage(0, latestQueryRef.current)
          }, 300)
        }
      }
    })
    return () => {
      unsub()
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (progressRefreshRef.current) clearTimeout(progressRefreshRef.current)
    }
  }, [])

  const fetchPage = useCallback(async (pageOffset: number, query: string) => {
    if (pageOffset === 0) setIsLoading(true)
    else setIsFetchingMore(true)
    try {
      const res = await window.api.catalogList({ query, offset: pageOffset, limit: PAGE_SIZE })
      if (res.success && res.data) {
        const { servers: batch, total: t } = res.data as { servers: MCPServer[]; total: number }
        setTotal(t)
        setServers(prev => (pageOffset === 0 ? batch : [...prev, ...batch]))
        setOffset(pageOffset + batch.length)
      }
    } finally {
      setIsLoading(false)
      setIsFetchingMore(false)
    }
  }, [])

  // IntersectionObserver — load next page when sentinel enters viewport
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingMore && !isLoading && servers.length < total) {
          fetchPage(offset, debouncedQuery)
        }
      },
      { rootMargin: '200px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [isFetchingMore, isLoading, servers.length, total, offset, debouncedQuery, fetchPage])

  const handleInstall = async (parameters: Record<string, unknown>) => {
    if (!selectedClient || !selectedServer) return
    setIsInstalling(true)
    const request: ServerInstallRequest = {
      serverId: selectedServer.id,
      clientId: selectedClient.id,
      parameters
    }
    const response = await window.api.catalogInstall(request)
    setIsInstalling(false)
    if (response.success) {
      alert('Server installed successfully!')
      setSelectedServer(null)
    } else {
      alert(`Installation failed: ${response.error}`)
    }
  }

  const refreshing = progressCount !== null && !progressDone

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            MCP Server Catalog
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {total > 0 ? `${total.toLocaleString()} servers` : 'Loading…'} for{' '}
            {selectedClient?.name || 'your AI client'}
          </p>
        </div>
        <button
          onClick={() => {
            setProgressCount(null)
            setProgressDone(false)
            setProgressError('')
            window.api.catalogRefresh()
          }}
          disabled={refreshing}
          className="shrink-0 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
        >
          {refreshing ? `⏳ ${progressCount?.toLocaleString()} fetched…` : '🔄 Refresh'}
        </button>
      </div>

      {progressError && (
        <div className="mb-4 px-4 py-2 rounded-lg text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">
          Registry error: {progressError}
        </div>
      )}

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search servers…"
          value={searchQuery}
          onChange={e => handleSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>

      {!selectedClient && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <p className="text-yellow-800 dark:text-yellow-200">
            Please select a target client from the sidebar to install servers.
          </p>
        </div>
      )}

      {isLoading && servers.length === 0 ? (
        <div className="flex items-center justify-center py-24 text-gray-400">Loading servers…</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {servers.map(server => (
              <ServerCard
                key={server.id}
                server={server}
                onInstall={() => setSelectedServer(server)}
                disabled={!selectedClient}
              />
            ))}
          </div>

          {/* Sentinel for infinite scroll */}
          <div ref={sentinelRef} className="h-8 flex items-center justify-center mt-4">
            {isFetchingMore && <span className="text-sm text-gray-400">Loading more…</span>}
            {!isFetchingMore && servers.length >= total && total > 0 && (
              <span className="text-sm text-gray-400">
                All {total.toLocaleString()} servers loaded
              </span>
            )}
          </div>
        </>
      )}

      {selectedServer && (
        <InstallModal
          server={selectedServer}
          onClose={() => setSelectedServer(null)}
          onInstall={handleInstall}
          isInstalling={isInstalling}
        />
      )}
    </div>
  )
}
