import { useNavigate } from 'react-router-dom'
import { FilePlus, Clock, PawPrint, AlertTriangle, Play, Send, CheckCircle } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'

const statusConfig = {
  confirmed:    { label: 'Confirmada',      variant: 'blue'   },
  scheduled:    { label: 'Agendada',        variant: 'blue'   },
  initiated:    { label: 'En ejecución ⏱', variant: 'purple' },
  sent_to_admin:{ label: 'Enviada',         variant: 'green'  },
  paid:         { label: 'Cobrada',         variant: 'green'  },
  cancelled:    { label: 'Cancelada',       variant: 'red'    },
}

export default function VetAgenda() {
  const navigate = useNavigate()
  const { appointments, pets, owners, initiateAppointment } = useApp()

  const myAppts = appointments
    .filter(a => a.assignedTo === 'vet' || a.serviceType === 'consultation')
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))

  const activeAppts    = myAppts.filter(a => !['sent_to_admin', 'paid', 'cancelled'].includes(a.status))
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
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-base shrink-0">
              <Clock size={14} /> {a.time}
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <PawPrint size={14} className="text-gray-400 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-gray-900">{pet?.name}</p>
                  <p className="text-xs text-gray-500">
                    {pet?.breed}{pet?.age && ` · ${pet.age} años`}{pet?.weight && ` · ${pet.weight}kg`}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-700">{a.reason}</p>
                <p className="text-xs text-gray-500">{owner?.name} · {owner?.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {hasAllergy && (
                <div className="flex items-center gap-1 text-xs text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded-full">
                  <AlertTriangle size={10} /> Alergia
                </div>
              )}
              <Badge variant={st.variant}>{st.label}</Badge>
            </div>
          </div>

          {a.status === 'initiated' && a.startedAt && (
            <p className="text-xs text-purple-600 font-medium mt-2">
              ⏱ Iniciada: {new Date(a.startedAt).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}

          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
            {(a.status === 'confirmed' || a.status === 'scheduled') && (
              <button
                onClick={() => initiateAppointment(a.id)}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors"
              >
                <Play size={12} /> Iniciar consulta
              </button>
            )}
            {a.status === 'initiated' && (
              <button
                onClick={() => navigate('/nueva-consulta')}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors"
              >
                <Send size={12} /> Registrar consulta y enviar
              </button>
            )}
            {a.status === 'sent_to_admin' && (
              <div className="flex items-center gap-1.5 text-green-700 text-xs font-semibold">
                <CheckCircle size={13} /> Enviada a administración
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
          <h2 className="text-xl font-bold text-gray-900">Mi agenda</h2>
          <p className="text-sm text-gray-500">{myAppts.length} consultas programadas</p>
        </div>
        <Button icon={FilePlus} onClick={() => navigate('/nueva-consulta')}>Nueva consulta</Button>
      </div>

      {/* Citas activas */}
      {Object.entries(grouped).map(([date, appts]) => (
        <div key={date}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sm font-bold text-gray-700">{date}</span>
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">{appts.length} consulta(s)</span>
          </div>
          <div className="space-y-2">
            {appts.map(a => <AppointmentCard key={a.id} a={a} />)}
          </div>
        </div>
      ))}

      {activeAppts.length === 0 && (
        <div className="text-center py-16 text-gray-400">Sin consultas programadas</div>
      )}

      {/* Consultas completadas */}
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
