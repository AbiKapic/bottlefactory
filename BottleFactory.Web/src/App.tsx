import { FillingStation } from './features/filling-station/FillingStation'
import { stationSignals, useMachineStatus } from './features/filling-station/useMachineStatus'
import './App.css'

function App() {
  const { machine, error } = useMachineStatus()
  const connection = machine ? 'PLC CONNECTED' : error ? 'TELEMETRY UNAVAILABLE' : 'CONNECTING'

  return (
    <main className="dashboard">
      <header>
        <div>

          <h1>BottleFactory Control Center</h1>

        </div>
        <span role="status" className={`status ${machine ? 'online' : error ? 'offline' : 'pending'}`}>
          {connection}
        </span>
      </header>

      {error && <p className="error" role="alert">{error}</p>}

      <section className="metrics" aria-label="Machine status">
        <article className="metric">
          <span>Completed bottles</span>
          <strong>{machine?.completedBottles ?? '—'}</strong>
          <small>Live PLC production counter</small>
        </article>
        <article className="metric">
          <span>ADS telemetry</span>
          <strong className="time">{machine ? machine.missingSymbols.length ? 'PARTIAL' : 'LIVE' : '—'}</strong>
          <small>Local TwinCAT runtime · port 851</small>
        </article>
        <article className="metric">
          <span>Sample time</span>
          <strong className="time">{machine ? new Date(machine.sampledAt).toLocaleTimeString() : '—'}</strong>
          <small>Polls every 250 ms after each response</small>
        </article>
      </section>

      <section className="panel">

        <FillingStation
          bottlePresent={machine?.bottlePresent ?? null}
          valveOpen={machine?.valveOpen ?? null}
          conveyorPosition={machine?.conveyorPosition ?? null}
          cappingProgress={machine?.cappingProgress ?? null}
          bottleCapped={machine?.bottleCapped ?? null}
          fillPercent={machine?.fillPercent ?? null}
          transferPhase={machine?.transferPhase ?? null}
          placeProgress={machine?.placeProgress ?? null}
        />
        {machine && machine.conveyorPosition == null && <p>Conveyor positions unavailable</p>}
        <dl className="signals">
          {stationSignals.map(([key, label]) => {
            const value = machine?.[key]
            return (
              <div key={key}>
                <dt>{label}</dt>
                <dd data-active={value === true}>{value == null ? 'Unavailable' : value ? 'On' : 'Off'}</dd>
              </div>
            )
          })}
        </dl>

        {machine && machine.missingSymbols.length > 0 && (
          <p>Missing ADS symbols · {machine.missingSymbols.join(', ')}</p>
        )}
      </section>
    </main>
  )
}

export default App
