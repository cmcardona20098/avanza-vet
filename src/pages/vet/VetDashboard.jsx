import { useNavigate } from 'react-router-dom'
import { FilePlus, PawPrint, Syringe, ClipboardList, Clock, AlertTriangle, Play, Send, CheckCircle } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import Card, { CardHeader } from '../../components/ui/Card'
import StatCard from '../../components/ui/StatCard'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'

function getWeekRange() {
  const now = new Date()
  const day  = now.getDay()
  const mon  = new Date(now); mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
  const sun  = new Date(mon); sun.setDate(mon.getDate() + 6)
  return { start: mon.toISOString().split('T')[0], end: sun.toISOString().split('T')[0] }
}

function getMonthRange() {
  const now = new Date()
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
    end:   new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0],
  }
}

const consultStatus = {
  confirmed:    { label: 'Confirmada',   variant: 'blue'   },
  scheduled:    { label: 'Agendada',     variant: 'blue'   },
  initiated:    { label: 'En curso ⏱',  variant: 'purple' },
  sent_to_admin:{ label: 'Enviada',      variant: 'green'  },
  cancelled:    { label: 'Cancelada',    variant: 'red'    },
}

export default function VetDashboard() {
  const navigate = useNavigate()
  const { appointments, pets, owners, vaccineRecords, initiateAppointment } = useApp()

  const today = new Date().toISOString().split('T')[0]
  const week  = getWeekRange()
  const month = getMonthRange()

  const vetAppts = appointments.filter(a => a.assignedTo === 'vet' || a.serviceType === 'consultation')
  const todayAppts = vetAppts.filter(a => a.date === today)
  const upcoming   = vetAppts.filter(a => a.date > today && a.status !== 'cancelled').slice(0, 3)

  const completedStatuses = ['sent_to_admin', 'paid', 'completed']
  const attendedToday = vetAppts.filter(a => a.date === today && completedStatuses.includes(a.status)).length
  const attendedWeek  = vetAppts.filter(a => a.date >= week.start && a.date <= week.end && completedStatuses.includes(a.status)).length
  const attendedMonth = vetAppts.filter(a => a.date >= month.start && a.date <= month.end && completedStatuses.includes(a.status)).length

  const overdueVax  = vaccineRecords.filter(v => v.status === 'overdue')
  const dueSoonVax  = vaccineRecords.filter(v => v.status === 'due_soon')
  const recentPets  = pets.slice(-3).reverse()

  function getPet(id)   { return pets.find(p => p.id === id) }
  function getOwner(id) { return owners.find(o => o.id === id) }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Consultas hoy"    value={todayAppts.length} icon={ClipboardList} color="green"  />
        <StatCard title="Atendidas hoy"    value={attendedToday}     icon={CheckCircle}   color="blue"   />
        <StatCard title="Esta semana"      value={attendedWeek}      icon={FilePlus}      color="purple" />
        <StatCard title="Este mes"         value={attendedMonth}     icon={FilePlus}      color="yellow" />
      </div>

      {/* Alerta vacunas */}
      {overdueVax.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <AlertTriangle size={16} className="text-red-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">{overdueVax.length} vacuna(s) vencida(s)</p>
            <p className="text-xs text-red-600 mt-0.5">
              {overdueVax.map(v => `${getPet(v.petId)?.name} — ${v.name}`).join(' · ')}
            </p>
          </div>
          <Button size="sm" variant="danger" onClick={() => navigate('/vacunas')}>Ver</Button>
        </div>
      )}

      {/* Acceso rápido */}
      <Button icon={FilePlus} onClick={() => navigate('/nueva-consulta')} className="w-full sm:w-auto">
        Registrar nueva consulta médica
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Consultas del día */}
        <Card>
          <CardHeader
            title="Mis consultas de hoy"
            subtitle={today}
            action={<Button size="sm" variant="ghost" onClick={() => navigate('/mi-agenda')}>Ver agenda</Button>}
          />
          {todayAppts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <ClipboardList size={32} className="mx-auto mb-2 text-gray-200" />
              <p className="text-sm">Sin consultas programadas hoy</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayAppts.map(a => {
                const pet   = getPet(a.petId)
                const owner = getOwner(a.ownerId)
                const st = consultStatus[a.status] || consultStatus.confirmed

                return (
                  <div key={a.id} className={`rounded-xl border p-3 space-y-2 ${
                    a.status === 'initiated' ? 'border-purple-200 bg-purple-50' :
                    a.status === 'sent_to_admin' ? 'border-green-200 bg-green-50' :
                    'border-gray-100 bg-emerald-50'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                        <span className="font-bold text-emerald-700 text-sm">{pet?.name?.[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{pet?.name}</p>
                        <p className="text-xs text-gray-500">{owner?.name} · {a.reason}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1 text-sm font-bold text-emerald-700">
                          <Clock size={12} /> {a.time}
                        </div>
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </div>
                    </div>

                    {a.status === 'initiated' && a.startedAt && (
                      <p className="text-xs text-purple-600 font-medium">
                        ⏱ Iniciada: {new Date(a.startedAt).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}

                    <div className="flex gap-2 flex-wrap pt-1">
                      {(a.status === 'confirmed' || a.status === 'scheduled') && (
                        <button
                          onClick={() => initiateAppointment(a.id)}
                          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors"
                        >
                          <Play size={11} /> Iniciar consulta
                        </button>
                      )}
                      {a.status === 'initiated' && (
                        <button
                          onClick={() => navigate('/nueva-consulta')}
                          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors"
                        >
                          <Send size={11} /> Registrar y enviar
                        </button>
                      )}
                      {a.status === 'sent_to_admin' && (
                        <div className="flex items-center gap-1.5 text-green-700 text-xs font-semibold">
                          <CheckCircle size={13} /> Enviada a administración
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Próximas consultas */}
        <Card>
          <CardHeader title="Próximas consultas" action={<Button size="sm" variant="ghost" onClick={() => navigate('/mi-agenda')}>Ver todas</Button>} />
          {upcoming.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Sin consultas próximas</p>
          ) : (
            <ul className="space-y-3">
              {upcoming.map(a => {
                const pet   = getPet(a.petId)
                const owner = getOwner(a.ownerId)
                return (
                  <li key={a.id} className="flex items-center gap-3 border border-gray-100 rounded-xl p-3">
                    <div className="text-center w-16 shrink-0">
                      <p className="text-xs text-gray-400">{a.date}</p>
                      <p className="text-sm font-bold text-emerald-700">{a.time}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{pet?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{a.reason}</p>
                    </div>
                    <Badge variant="blue">Confirmada</Badge>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pacientes recientes */}
        <Card>
          <CardHeader title="Pacientes recientes" action={<Button size="sm" variant="ghost" onClick={() => navigate('/mascotas')}>Ver todos</Button>} />
          {recentPets.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Sin pacientes registrados</p>
          ) : (
            <ul className="space-y-3">
              {recentPets.map(pet => {
                const owner = getOwner(pet.ownerId)
                return (
                  <li key={pet.id} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-xl p-2 transition-colors"
                    onClick={() => navigate(`/mascotas/${pet.id}`)}>
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
                      <PawPrint size={16} className="text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{pet.name}</p>
                      <p className="text-xs text-gray-500">{pet.breed} · {owner?.name}</p>
                    </div>
                    {pet.allergies && !['Ninguna', 'Ninguna conocida', ''].includes(pet.allergies) && (
                      <Badge variant="red" className="shrink-0">⚠ Alergia</Badge>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        {/* Control de vacunas */}
        <Card>
          <CardHeader title="Control de vacunas" action={<Button size="sm" variant="ghost" onClick={() => navigate('/vacunas')}>Ver todo</Button>} />
          <div className="space-y-2">
            {[...overdueVax, ...dueSoonVax].slice(0, 5).map(v => {
              const pet = getPet(v.petId)
              return (
                <div key={v.id} className={`flex items-center gap-3 p-3 rounded-xl ${v.status === 'overdue' ? 'bg-red-50' : 'bg-yellow-50'}`}>
                  <Syringe size={14} className={v.status === 'overdue' ? 'text-red-500' : 'text-yellow-500'} />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-900">{pet?.name} — {v.name}</p>
                    <p className="text-xs text-gray-500">{v.nextDueDate}</p>
                  </div>
                  <Badge variant={v.status === 'overdue' ? 'red' : 'yellow'}>
                    {v.status === 'overdue' ? 'Vencida' : 'Pronto'}
                  </Badge>
                </div>
              )
            })}
            {overdueVax.length === 0 && dueSoonVax.length === 0 && (
              <p className="text-sm text-center text-gray-400 py-4">Todas las vacunas al día ✓</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
