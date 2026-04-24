import { useState, useEffect, useRef } from 'react'
import { Play, Square, Clock } from 'lucide-react'

function pad(n) { return String(n).padStart(2, '0') }

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

export default function GroomingTimer({ onStart, onStop }) {
  const [status, setStatus] = useState('idle') // idle | running | stopped
  const [elapsed, setElapsed] = useState(0)
  const [startTime, setStartTime] = useState(null)
  const [endTime, setEndTime] = useState(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (status === 'running') {
      intervalRef.current = setInterval(() => setElapsed(s => s + 1), 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [status])

  function handleStart() {
    const now = new Date()
    setStartTime(now)
    setElapsed(0)
    setStatus('running')
    onStart?.(now.toISOString())
  }

  function handleStop() {
    const now = new Date()
    setEndTime(now)
    setStatus('stopped')
    const minutes = Math.round(elapsed / 60)
    onStop?.({
      startTime: startTime?.toISOString(),
      endTime: now.toISOString(),
      durationMinutes: minutes,
      durationDisplay: formatDuration(elapsed),
    })
  }

  const colors = {
    idle:    'bg-gray-50 border-gray-200 text-gray-600',
    running: 'bg-green-50 border-green-300 text-green-800',
    stopped: 'bg-blue-50 border-blue-200 text-blue-800',
  }

  return (
    <div className={`rounded-2xl border-2 p-4 transition-colors ${colors[status]}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            status === 'running' ? 'bg-green-100' : status === 'stopped' ? 'bg-blue-100' : 'bg-gray-100'
          }`}>
            <Clock size={20} className={status === 'running' ? 'text-green-600 animate-pulse' : 'text-gray-500'} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
              {status === 'idle' ? 'Cronómetro' : status === 'running' ? 'Servicio en curso' : 'Servicio finalizado'}
            </p>
            <p className="text-3xl font-mono font-bold tracking-tight">{formatDuration(elapsed)}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {status === 'idle' && (
            <button
              onClick={handleStart}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-xl transition-colors text-sm"
            >
              <Play size={16} /> Iniciar
            </button>
          )}
          {status === 'running' && (
            <button
              onClick={handleStop}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-xl transition-colors text-sm"
            >
              <Square size={16} /> Detener
            </button>
          )}
          {status === 'stopped' && (
            <div className="text-sm font-semibold text-blue-700 bg-blue-100 px-3 py-2 rounded-xl">
              ✓ Registrado
            </div>
          )}
        </div>
      </div>

      {/* Métricas detalladas */}
      {status !== 'idle' && (
        <div className="mt-3 grid grid-cols-3 gap-2 pt-3 border-t border-current/10">
          <div className="text-center">
            <p className="text-xs opacity-60">Inicio</p>
            <p className="text-sm font-semibold">{startTime ? startTime.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' }) : '—'}</p>
          </div>
          <div className="text-center">
            <p className="text-xs opacity-60">Fin</p>
            <p className="text-sm font-semibold">{endTime ? endTime.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' }) : '—'}</p>
          </div>
          <div className="text-center">
            <p className="text-xs opacity-60">Duración</p>
            <p className="text-sm font-semibold">{Math.round(elapsed / 60)} min</p>
          </div>
        </div>
      )}
    </div>
  )
}
