import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

type PsProcess = { name: string; pid: number }
type PsListFn = () => Promise<PsProcess[]>

// Dynamic import for ES module
let psListModule: unknown = null
const getPsList = async (): Promise<PsListFn> => {
  if (!psListModule) {
    psListModule = await import('ps-list')
  }
  return (psListModule as { default: PsListFn }).default
}

export class ProcessService {
  /**
   * Checks if a process is currently running
   */
  async isProcessRunning(processName: string): Promise<boolean> {
    try {
      const psList = await getPsList()
      const processes = await psList()
      return processes.some(p => p.name.toLowerCase().includes(processName.toLowerCase()))
    } catch (error) {
      console.error('Failed to check process:', error)
      return false
    }
  }

  /**
   * Gets all running processes matching a pattern
   */
  async findProcesses(pattern: string): Promise<Array<{ pid: number; name: string }>> {
    try {
      const psList = await getPsList()
      const processes = await psList()
      return processes
        .filter(p => p.name.toLowerCase().includes(pattern.toLowerCase()))
        .map(p => ({ pid: p.pid, name: p.name }))
    } catch (error) {
      console.error('Failed to find processes:', error)
      return []
    }
  }

  /**
   * Attempts to gracefully stop a process
   */
  async stopProcess(processName: string): Promise<void> {
    const processes = await this.findProcesses(processName)

    if (processes.length === 0) {
      throw new Error(`No process found matching: ${processName}`)
    }

    for (const proc of processes) {
      try {
        if (process.platform === 'win32') {
          await execAsync(`taskkill /PID ${proc.pid} /F`)
        } else {
          await execAsync(`kill -15 ${proc.pid}`)
        }
      } catch (error) {
        console.error(`Failed to stop process ${proc.pid}:`, error)
      }
    }
  }

  /**
   * Checks if it's safe to modify config files (no active clients)
   */
  async isSafeToModifyConfig(clientId: string): Promise<boolean> {
    const processPatterns: Record<string, string[]> = {
      vscode: ['code', 'vscode'],
      cursor: ['cursor'],
      'claude-desktop': ['claude'],
      'gemini-cli': ['gemini']
    }

    const patterns = processPatterns[clientId] || []

    for (const pattern of patterns) {
      const isRunning = await this.isProcessRunning(pattern)
      if (isRunning) {
        return false
      }
    }

    return true
  }
}

export const processService = new ProcessService()
