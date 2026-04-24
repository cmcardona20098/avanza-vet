import { useNavigate } from 'react-router-dom'
import { Scissors, PawPrint, Clock, AlertTriangle, Play, CheckCircle, Send } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import Card, { CardHeader } from '../../components/ui/Card'
import StatCard from '../../components/ui/StatCard'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'

function getWeekRange() {
  const now = new Date()
  const day  = now.getDay() // 0=Sun
  const mon  = new Date(now); mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
  const sun  = new Date(mon); sun.setDate(mon.getDate() + 6)
  return {
    start: mon.toISOString().split('T')[0],
    end:   sun.toISOString().split('T')[0],
  }
}

function getMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
  return { start, end }
}

const groomingStatus = {
  confirmed:    { label: 'Confirmada',   variant: 'blue'   },
  initiated:    { label: 'En curso ⏱',  variant: 'purple' },
  sent_to_admin:{ label: 'Enviada',      variant: 'green'  },
  cancelled:    { label: 'Cancelada',    variant: 'red'    },
}

export default function GroomerDashboard() {
  const navigate = useNavigate()
  const { appointments, pets, owners, initiateAppointment } = useApp()

  const today = new Date().toISOString().split('T')[0]
  const week  = getWeekRange()
  const month = getMonthRange()

  const groomerAppts = appointments.filter(a =>
    a.assignedTo === 'groomer' || a.serviceType === 'grooming'
  )
  const todayAppts = groomerAppts.filter(a => a.date === today)
  const completedStatuses = ['sent_to_admin', 'paid', 'completed']

  const attendedToday = groomerAppts.filter(a =>
    a.date === today && completedStatuses.includes(a.status)
  ).length
  const attendedWeek = groomerAppts.filter(a =>
    a.date >= week.start && a.date <= week.end && completedStatuses.includes(a.status)
  ).length
  const attendedMonth = groomerAppts.filter(a =>
    a.date >= month.start && a.date <= month.end && completedStatuses.includes(a.status)
  ).length

  function getPet(id)   { return pets.find(p => p.id === id) }
  function getOwner(id) { return owners.find(o => o.id === id) }

  function handleIniciar(apptId) {
    initiateAppointment(apptId)
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Atendidas hoy"     value={attendedToday} icon={Scissors} color="purple" />
        <StatCard title="Esta semana"        value={attendedWeek}  icon={Scissors} color="blue"   />
        <StatCard title="Este mes"           value={attendedMonth} icon={Scissors} color="green"  />
      </div>

      {/* Grooming de hoy */}
      <Card>
        <CardHeader
          title="Grooming de hoy"
          subtitle={today}
          action={<Button size="sm" variant="ghost" onClick={() => navigate('/mi-agenda')}>Ver agenda</Button>}
        />
        {todayAppts.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Scissors size={32} className="mx-auto mb-2 text-gray-200" />
            <p className="text-sm">Sin citas de grooming hoy</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayAppts.map(a => {
              const pet   = getPet(a.petId)
              const owner = getOwner(a.ownerId)
              const hasAllergy = pet?.allergies && !['Ninguna', 'Ninguna conocida', ''].includes(pet.allergies)
              const st = groomingStatus[a.status] || groomingStatus.confirmed

              return (
                <div key={a.id} className={`rounded-xl border-2 p-4 space-y-3 transition-colors ${
                  a.status === 'initiated' ? 'border-purple-300 bg-purple-50' :
                  a.status === 'sent_to_admin' ? 'border-green-200 bg-green-50' :
                  'border-gray-100 bg-white'
                }`}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
                        <span className="font-bold text-violet-700 text-sm">{pet?.name?.[0]}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{pet?.name}</p>
                        <p className="text-xs text-gray-500">{pet?.breed} · {owner?.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-violet-700 font-bold text-sm">
                        <Clock size={13} /> {a.time}
                      </div>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </div>
                  </div>

                  {hasAllergy && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
                      <AlertTriangle size={13} className="text-red-600 shrink-0" />
                      <p className="text-xs font-semibold text-red-700">Alergia: {pet.allergies}</p>
                    </div>
                  )}

                  {/* Info mascota */}
                  <div className="flex flex-wrap gap-2">
                    {pet?.age    && <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{pet.age} años</span>}
                    {pet?.weight && <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{pet.weight} kg</span>}
                    {a.reason    && <span className="text-xs bg-violet-100 text-violet-700 rounded-full px-2 py-0.5">{a.reason}</span>}
                  </div>

                  {a.status === 'initiated' && a.startedAt && (
                    <p className="text-xs text-purple-600 font-medium">
                      ⏱ Iniciado: {new Date(a.startedAt).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}

                  {/* Botones de acción */}
                  <div className="flex gap-2 flex-wrap pt-1">
                    {(a.status === 'confirmed' || a.status === 'scheduled') && (
                      <button
                        onClick={() => handleIniciar(a.id)}
                        className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                      >
                        <Play size={14} /> Iniciar servicio
                      </button>
                    )}
                    {a.status === 'initiated' && (
                      <button
                        onClick={() => navigate('/nuevo-grooming')}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                      >
                        <Send size={14} /> Registrar y enviar a administración
                      </button>
                    )}
                    {a.status === 'sent_to_admin' && (
                      <div className="flex items-center gap-2 text-green-700 text-sm font-semibold">
                        <CheckCircle size={16} /> Enviado a administración
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Próximas citas */}
      <Card>
        <CardHeader
          title="Próximas citas"
          action={<Button size="sm" variant="ghost" onClick={() => navigate('/mi-agenda')}>Ver todas</Button>}
        />
        {appointments.filter(a => (a.assignedTo === 'groomer' || a.serviceType === 'grooming') && a.date > today && a.status !== 'cancelled').length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Sin citas próximas</p>
        ) : (
          <ul className="space-y-3">
            {appointments
              .filter(a => (a.assignedTo === 'groomer' || a.serviceType === 'grooming') && a.date > today && a.status !== 'cancelled')
              .slice(0, 4)
              .map(a => {
                const pet   = getPet(a.petId)
                const owner = getOwner(a.ownerId)
                const hasAllergy = pet?.allergies && !['Ninguna', 'Ninguna conocida', ''].includes(pet.allergies)
                return (
                  <li key={a.id} className="border border-gray-100 rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <div className="text-center w-16 shrink-0">
                        <p className="text-xs text-gray-400">{a.date}</p>
                        <p className="text-sm font-bold text-violet-700">{a.time}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{pet?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{owner?.name} · {a.reason}</p>
                        {hasAllergy && (
                          <span className="text-xs text-red-600 flex items-center gap-1 mt-0.5">
                            <AlertTriangle size={10} /> {pet.allergies}
                          </span>
                        )}
                      </div>
                      <Badge variant="blue">Confirmada</Badge>
                    </div>
                  </li>
                )
              })}
          </ul>
        )}
      </Card>
    </div>
  )
}
