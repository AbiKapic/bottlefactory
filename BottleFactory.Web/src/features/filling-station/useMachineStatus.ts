import { useEffect, useState } from 'react'

export const stationSignals = [
  ['busy', 'Station busy'],
  ['valveOpen', 'Filling valve open'],
  ['done', 'Cycle done'],
  ['bottlePresent', 'Bottle present'],
  ['runRequest', 'Run request'],
  ['stopRequest', 'Stop request'],
] as const

type Signal = (typeof stationSignals)[number][0]

type MachineStatus = Record<Signal, boolean | null> & {
  connected: true
  completedBottles: number
  conveyorPosition?: number | null
  cappingProgress?: number | null
  bottleCapped?: boolean | null
  fillPercent?: number | null
  transferPhase?: number | null
  placeProgress?: number | null
  sampledAt: string
  missingSymbols: string[]
}

function isMachineStatus(data: unknown): data is MachineStatus {
  if (!data || typeof data !== 'object') return false
  const status = data as Partial<MachineStatus>

  return status.connected === true &&
    typeof status.completedBottles === 'number' &&
    Number.isInteger(status.completedBottles) &&
    status.completedBottles >= 0 &&
    status.completedBottles <= 0xffffffff &&
    typeof status.sampledAt === 'string' &&
    Number.isFinite(Date.parse(status.sampledAt)) &&
    Array.isArray(status.missingSymbols) &&
    status.missingSymbols.every(path => typeof path === 'string') &&
    (status.conveyorPosition == null || (Number.isInteger(status.conveyorPosition) &&
      status.conveyorPosition >= 0 && status.conveyorPosition <= 0xffffffff)) &&
    (status.cappingProgress == null || (Number.isInteger(status.cappingProgress) &&
      status.cappingProgress >= 0 && status.cappingProgress <= 100)) &&
    (status.bottleCapped == null || typeof status.bottleCapped === 'boolean') &&
    [status.fillPercent, status.placeProgress].every(value =>
      value == null || (Number.isInteger(value) && value >= 0 && value <= 100),
    ) &&
    (status.transferPhase == null || (Number.isInteger(status.transferPhase) &&
      status.transferPhase >= 0 && status.transferPhase <= 4)) &&
    stationSignals.every(([key]) => status[key] === null || typeof status[key] === 'boolean')
}

export function useMachineStatus() {
  const [machine, setMachine] = useState<MachineStatus | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const lifetime = new AbortController()
    let nextPoll: ReturnType<typeof setTimeout>

    async function poll() {
      try {
        const response = await fetch('/api/machine/status', {
          cache: 'no-store',
          signal: AbortSignal.any([lifetime.signal, AbortSignal.timeout(5000)]),
        })
        if (!response.ok) {
          const problem = await response.json().catch(() => null)
          throw new Error(problem?.detail ?? `Status request failed (HTTP ${response.status}).`)
        }

        const data: unknown = await response.json()
        if (!isMachineStatus(data)) throw new Error('The API returned an invalid status sample.')

        if (!lifetime.signal.aborted) {
          setMachine(data)
          setError('')
        }
      } catch (err) {
        if (!lifetime.signal.aborted) {
          setMachine(null)
          setError(err instanceof Error ? err.message : 'Status request failed.')
        }
      } finally {
        if (!lifetime.signal.aborted) nextPoll = setTimeout(poll, 250)
      }
    }

    void poll()
    return () => {
      lifetime.abort()
      clearTimeout(nextPoll)
    }
  }, [])

  return { machine, error }
}
