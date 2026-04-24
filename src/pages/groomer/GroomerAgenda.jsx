import { useNavigate } from 'react-router-dom'
import { Scissors, Clock, AlertTriangle, Play, Send, CheckCircle } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'

const statusConfig = {
  confirmed:    { label: 'Confirmada',   variant: 'blue'   },
  scheduled:    { label: 'Agendada',     variant: 'blue'   },
  initiated:    { label: 'En ejecución ⏱', variant: 'purple' },
  sent_to_admin:{ label: 'Enviada',      variant: 'green'  },
  paid:         { label: 'Cobrada',      variant: 'green'  },
  cancelled:    { label: 'Cancelada',    variant: 'red'    },
}

export default function GroomerAgenda() {
  const navigate = useNavigate()
  const { appointments, pets, owners, initiateAppointment } = useApp()

  const myAppts = appointments
    .filter(a => a.assignedTo === 'groomer' || a.serviceType === 'grooming')
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))

  const activeAppts = myAppts.filter(a => !['sent_to_admin', 'paid', 'cancelled'].includes(a.status))
  const completedAppts = myAppts.filter(a => ['sent_to_admin', 'paid'].includes(a.status))

  const grouped = activeAppts.reduce((acc, a) => {
    if (!acc[a.date]) acc[a.date] = []
    acc[a.date].push(a)
    return acc
  }, {})

  function getPet(id)   { return pets.find(p => p.id === id) }
  function getOwner(id) { return owners.find(o => o.id === id) }

  function AppointmentCard({ a }) {
    const pet   = getPet(a.petId)
    const owner = getOwner(a.ownerId)
    const hasAllergy = pet?.allergies && !['Ninguna', 'Ninguna conocida', ''].includes(pet.allergies)
    const st = statusConfig[a.status] || statusConfig.confirmed

    return (
      <Card padding={false}>
        <div className={`p-4 ${a.status === 'initiated' ? 'bg-purple-50 border-l-4 border-purple-500' : ''}`}>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex items-center gap-1.5 text-violet-700 font-bold shrink-0">
              <Clock size={14} /> {a.time}
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <p className="text-sm font-bold text-gray-900">{pet?.name}</p>
                <p className="text-xs text-gray-500">{pet?.breed} · {pet?.age && `${pet.age} años`} {pet?.weight && `· ${pet.weight}kg`}</p>
                {hasAllergy && (
                  <p className="text-xs text-red-600 flex items-center gap-1 mt-0.5">
                    <AlertTriangle size={10} /> {pet.allergies}
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-700">{a.reason}</p>
                <p className="text-xs text-gray-500">{owner?.name} · {owner?.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <Badge variant={st.variant}>{st.label}</Badge>
            </div>
          </div>

          {a.status === 'initiated' && a.startedAt && (
            <p className="text-xs text-purple-600 font-medium mt-2">
              ⏱ Iniciado: {new Date(a.startedAt).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}

          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
            {(a.status === 'confirmed' || a.status === 'scheduled') && (
              <button
                onClick={() => initiateAppointment(a.id)}
                className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors"
              >
                <Play size={12} /> Iniciar servicio
              </button>
            )}
            {a.status === 'initiated' && (
              <button
                onClick={() => navigate('/nuevo-grooming')}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors"
              >
                <Send size={12} /> Registrar y enviar a administración
              </button>
            )}
            {a.status === 'sent_to_admin' && (
              <div className="flex items-center gap-1.5 text-green-700 text-xs font-semibold">
                <CheckCircle size={13} /> Enviado a administración
              </div>
            )}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Mi agenda de grooming</h2>
          <p className="text-sm text-gray-500">{myAppts.length} citas programadas</p>
        </div>
      </div>

      {/* Citas activas */}
      {Object.entries(grouped).map(([date, appts]) => (
        <div key={date}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sm font-bold text-gray-700">{date}</span>
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">{appts.length} cita(s)</span>
          </div>
          <div className="space-y-2">
            {appts.map(a => <AppointmentCard key={a.id} a={a} />)}
          </div>
        </div>
      ))}

      {activeAppts.length === 0 && (
        <div className="text-center py-16 text-gray-400">Sin citas de grooming programadas</div>
      )}

      {/* Citas completadas */}
      {completedAppts.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sm font-bold text-gray-500">Completadas</span>
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">{completedAppts.length}</span>
          </div>
          <div className="space-y-2">
            {completedAppts.map(a => <AppointmentCard key={a.id} a={a} />)}
          </div>
        </div>
      )}
    </div>
  )
}
