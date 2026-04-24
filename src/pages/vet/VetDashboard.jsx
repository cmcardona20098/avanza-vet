import { useNavigate } from 'react-router-dom'
import {
  FilePlus, PawPrint, Syringe, ClipboardList, Clock, AlertTriangle,
  Play, Send, CheckCircle, Stethoscope, ArrowRight, Calendar
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import Card, { CardHeader } from '../../components/ui/Card'
import StatCard from '../../components/ui/StatCard'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'

function getWeekRange() {
  const now = new Date()
  const day = now.getDay()
  const mon = new Date(now); mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
  return { start: mon.toISOString().split('T')[0], end: sun.toISOString().split('T')[0] }
}
function getMonthRange() {
  const now = new Date()
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
    end:   new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0],
  }
}

const STATUS = {
  confirmed:    { label: 'Confirmada',  variant: 'blue'   },
  scheduled:    { label: 'Agendada',    variant: 'blue'   },
  initiated:    { label: 'En curso',    variant: 'purple' },
  sent_to_admin:{ label: 'Enviada ✓',  variant: 'green'  },
  cancelled:    { label: 'Cancelada',   variant: 'red'    },
}

const DONE = ['sent_to_admin', 'paid', 'completed']

export default function VetDashboard() {
  const navigate = useNavigate()
  const { appointments, pets, owners, vaccineRecords, initiateAppointment, currentUser } = useApp()

  const today = new Date().toISOString().split('T')[0]
  const week  = getWeekRange()
  const month = getMonthRange()

  const vetAppts    = appointments.filter(a => a.assignedTo === 'vet' || a.serviceType === 'consultation')
  const todayAppts  = vetAppts.filter(a => a.date === today)
  const upcoming    = vetAppts.filter(a => a.date > today && a.status !== 'cancelled').slice(0, 3)
  const pending     = todayAppts.filter(a => !DONE.includes(a.status))
  const attended    = todayAppts.filter(a => DONE.includes(a.status)).length
  const weekCount   = vetAppts.filter(a => a.date >= week.start && a.date <= week.end && DONE.includes(a.status)).length
  const monthCount  = vetAppts.filter(a => a.date >= month.start && a.date <= month.end && DONE.includes(a.status)).length

  const overdueVax  = vaccineRecords.filter(v => v.status === 'overdue')
  const dueSoonVax  = vaccineRecords.filter(v => v.status === 'due_soon')
  const recentPets  = pets.slice(-3).reverse()

  const getPet   = id => pets.find(p => p.id === id)
  const getOwner = id => owners.find(o => o.id === id)

  const greet = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Buenos días'
    if (h < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }

  return (
    <div className="space-y-5 max-w-6xl mx-auto">

      {/* Hero */}
      <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 rounded-3xl p-6 text-white shadow-lg shadow-emerald-200/40 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 60%)'
        }} />
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-emerald-200 text-sm font-medium">{greet()},</p>
            <h1 className="text-2xl font-bold mt-0.5 leading-tight">{currentUser?.name || 'Doctora'}</h1>
            <p className="text-emerald-200 text-sm mt-1.5">
              {pending.length > 0
                ? `${pending.length} consulta(s) pendiente(s) hoy · ${attended} completada(s)`
                : attended > 0
                ? `${attended} consulta(s) completadas hoy ✓`
                : 'Sin consultas programadas para hoy'}
            </p>
            <button
              onClick={() => navigate('/nueva-consulta')}
              className="mt-4 inline-flex items-center gap-2 bg-white text-emerald-700 font-bold px-4 py-2 rounded-xl hover:bg-emerald-50 transition-colors text-sm shadow-sm"
            >
              <FilePlus size={15} /> Nueva consulta
            </button>
          </div>
          <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm shrink-0">
            <Stethoscope size={28} className="text-white" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Consultas hoy"  value={todayAppts.length} icon={ClipboardList} color="green"  subtitle={`${attended} atendidas`} />
        <StatCard title="Pendientes"     value={pending.length}    icon={Clock}         color="yellow" />
        <StatCard title="Esta semana"    value={weekCount}         icon={Calendar}      color="purple" subtitle="completadas" />
        <StatCard title="Este mes"       value={monthCount}        icon={FilePlus}      color="blue"   subtitle="completadas" />
      </div>

      {/* Alerta vacunas */}
      {overdueVax.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle size={15} className="text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-red-800">{overdueVax.length} vacuna(s) vencida(s)</p>
            <p className="text-xs text-red-500 truncate">
              {overdueVax.map(v => `${getPet(v.petId)?.name} — ${v.name}`).join(' · ')}
            </p>
          </div>
          <button onClick={() => navigate('/vacunas')} className="text-xs font-bold text-red-700 hover:text-red-900 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg transition-colors shrink-0">
            Ver →
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Consultas del día */}
        <Card>
          <CardHeader
            title="Mis consultas de hoy"
            subtitle={new Date().toLocaleDateString('es-GT',{weekday:'long',day:'numeric',month:'long'})}
            action={
              <button onClick={() => navigate('/mi-agenda')} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                Ver agenda <ArrowRight size={12} />
              </button>
            }
          />
          {todayAppts.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <ClipboardList size={22} className="text-gray-300" />
              </div>
              <p className="text-sm text-gray-400 font-medium">Sin consultas hoy</p>
              <button onClick={() => navigate('/nueva-consulta')} className="mt-3 text-xs font-semibold text-emerald-600 hover:underline">
                Registrar consulta →
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {todayAppts.map(a => {
                const pet   = getPet(a.petId)
                const owner = getOwner(a.ownerId)
                const st    = STATUS[a.status] || STATUS.confirmed
                const isDone = DONE.includes(a.status)
                const isActive = a.status === 'initiated'

                return (
                  <div key={a.id} className={`rounded-xl border p-3 space-y-2.5 transition-colors ${
                    isActive  ? 'border-violet-200 bg-violet-50/50' :
                    isDone    ? 'border-emerald-100 bg-emerald-50/30' :
                    'border-gray-100 bg-white hover:bg-gray-50'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${
                        isActive ? 'bg-violet-100 text-violet-700' :
                        isDone   ? 'bg-emerald-100 text-emerald-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {pet?.name?.[0] || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900">{pet?.name}</p>
                        <p className="text-xs text-gray-400 truncate">{owner?.name} · {a.reason}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-bold text-gray-600 flex items-center gap-1">
                          <Clock size={10} /> {a.time}
                        </span>
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </div>
                    </div>

                    {isActive && a.startedAt && (
                      <p className="text-xs text-violet-600 font-semibold flex items-center gap-1">
                        ⏱ Iniciada: {new Date(a.startedAt).toLocaleTimeString('es-GT',{hour:'2-digit',minute:'2-digit'})}
                      </p>
                    )}

                    {!isDone && (
                      <div className="flex gap-2">
                        {(a.status === 'confirmed' || a.status === 'scheduled') && (
                          <button
                            onClick={() => initiateAppointment(a.id)}
                            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors"
                          >
                            <Play size={11} /> Iniciar
                          </button>
                        )}
                        {a.status === 'initiated' && (
                          <button
                            onClick={() => navigate('/nueva-consulta')}
                            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors"
                          >
                            <Send size={11} /> Registrar y enviar
                          </button>
                        )}
                      </div>
                    )}
                    {isDone && (
                      <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle size={12} /> Enviada a administración
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Próximas */}
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Próximas consultas"
              action={<button onClick={() => navigate('/mi-agenda')} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">Ver agenda <ArrowRight size={12} /></button>}
            />
            {upcoming.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Sin consultas próximas</p>
            ) : (
              <ul className="space-y-2">
                {upcoming.map(a => {
                  const pet = getPet(a.petId)
                  return (
                    <li key={a.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="w-10 text-center shrink-0">
                        <p className="text-[10px] text-gray-400 font-medium">{a.date?.slice(5)}</p>
                        <p className="text-sm font-bold text-emerald-600">{a.time}</p>
                      </div>
                      <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold text-emerald-600">
                        {pet?.name?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{pet?.name}</p>
                        <p className="text-xs text-gray-400 truncate">{a.reason}</p>
                      </div>
                      <Badge variant="blue">Confirmada</Badge>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>

          {/* Pacientes recientes */}
          <Card>
            <CardHeader
              title="Pacientes recientes"
              action={<button onClick={() => navigate('/mascotas')} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">Ver todos <ArrowRight size={12} /></button>}
            />
            {recentPets.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Sin pacientes</p>
            ) : (
              <ul className="space-y-1.5">
                {recentPets.map(pet => {
                  const owner = getOwner(pet.ownerId)
                  const hasAllergy = pet.allergies && !['Ninguna','Ninguna conocida',''].includes(pet.allergies)
                  return (
                    <li key={pet.id}
                      onClick={() => navigate(`/mascotas/${pet.id}`)}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                        <PawPrint size={13} className="text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{pet.name}</p>
                        <p className="text-xs text-gray-400">{pet.breed} · {owner?.name}</p>
                      </div>
                      {hasAllergy && <Badge variant="red">⚠ Alergia</Badge>}
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {/* Control de vacunas */}
      {(overdueVax.length > 0 || dueSoonVax.length > 0) && (
        <Card>
          <CardHeader
            title="Control de vacunas"
            action={<button onClick={() => navigate('/vacunas')} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">Ver todo <ArrowRight size={12} /></button>}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[...overdueVax, ...dueSoonVax].slice(0, 6).map(v => {
              const pet = getPet(v.petId)
              return (
                <div key={v.id} className={`flex items-center gap-3 p-3 rounded-xl ${v.status === 'overdue' ? 'bg-red-50 border border-red-100' : 'bg-amber-50 border border-amber-100'}`}>
                  <Syringe size={13} className={v.status === 'overdue' ? 'text-red-500' : 'text-amber-500'} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">{pet?.name} — {v.name}</p>
                    <p className="text-xs text-gray-400">{v.nextDueDate}</p>
                  </div>
                  <Badge variant={v.status === 'overdue' ? 'red' : 'yellow'}>
                    {v.status === 'overdue' ? 'Vencida' : 'Pronto'}
                  </Badge>
                </div>
              )
            })}
          </div>
          {overdueVax.length === 0 && dueSoonVax.length === 0 && (
            <p className="text-sm text-emerald-600 text-center py-4 font-medium">✓ Todas las vacunas al día</p>
          )}
        </Card>
      )}
    </div>
  )
}
