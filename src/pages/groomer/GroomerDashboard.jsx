import { useNavigate } from 'react-router-dom'
import {
  Scissors, PawPrint, Clock, AlertTriangle, Play, CheckCircle, Send,
  ArrowRight, Calendar, Sparkles
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import Card, { CardHeader } from '../../components/ui/Card'
import StatCard from '../../components/ui/StatCard'
import Badge from '../../components/ui/Badge'

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
  confirmed:    { label: 'Confirmada', variant: 'blue'   },
  initiated:    { label: 'En curso',   variant: 'purple' },
  sent_to_admin:{ label: 'Enviada ✓', variant: 'green'  },
  cancelled:    { label: 'Cancelada',  variant: 'red'    },
}
const DONE = ['sent_to_admin', 'paid', 'completed']
const PET_EMOJI = { Perro:'🐕', Gato:'🐈', Ave:'🦜', Conejo:'🐇' }

export default function GroomerDashboard() {
  const navigate  = useNavigate()
  const { appointments, pets, owners, initiateAppointment, currentUser } = useApp()

  const today = new Date().toISOString().split('T')[0]
  const week  = getWeekRange()
  const month = getMonthRange()

  const groomerAppts = appointments.filter(a => a.assignedTo === 'groomer' || a.serviceType === 'grooming')
  const todayAppts   = groomerAppts.filter(a => a.date === today)
  const pending      = todayAppts.filter(a => !DONE.includes(a.status))
  const attended     = todayAppts.filter(a => DONE.includes(a.status)).length
  const weekCount    = groomerAppts.filter(a => a.date >= week.start && a.date <= week.end && DONE.includes(a.status)).length
  const monthCount   = groomerAppts.filter(a => a.date >= month.start && a.date <= month.end && DONE.includes(a.status)).length

  const upcoming = groomerAppts
    .filter(a => a.date > today && a.status !== 'cancelled')
    .slice(0, 4)

  const getPet   = id => pets.find(p => p.id === id)
  const getOwner = id => owners.find(o => o.id === id)

  const greet = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Buenos días'
    if (h < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }

  return (
    <div className="space-y-5 max-w-5xl mx-auto">

      {/* Hero */}
      <div className="bg-gradient-to-br from-violet-500 via-violet-600 to-purple-700 rounded-3xl p-6 text-white shadow-lg shadow-violet-200/40 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 60%)'
        }} />
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-violet-200 text-sm font-medium">{greet()},</p>
            <h1 className="text-2xl font-bold mt-0.5 leading-tight">{currentUser?.name || 'Groomista'}</h1>
            <p className="text-violet-200 text-sm mt-1.5">
              {pending.length > 0
                ? `${pending.length} servicio(s) pendiente(s) hoy · ${attended} completado(s)`
                : attended > 0
                ? `${attended} servicio(s) completados hoy ✓`
                : 'Sin servicios programados para hoy'}
            </p>
            <button
              onClick={() => navigate('/mi-agenda')}
              className="mt-4 inline-flex items-center gap-2 bg-white text-violet-700 font-bold px-4 py-2 rounded-xl hover:bg-violet-50 transition-colors text-sm shadow-sm"
            >
              <Calendar size={15} /> Ver mi agenda
            </button>
          </div>
          <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm shrink-0">
            <Scissors size={28} className="text-white" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard title="Atendidas hoy"  value={attended}    icon={Scissors}  color="purple" subtitle={`${pending.length} pendientes`} />
        <StatCard title="Esta semana"    value={weekCount}   icon={Calendar}  color="blue"   subtitle="completados" />
        <StatCard title="Este mes"       value={monthCount}  icon={Scissors}  color="green"  subtitle="completados" />
      </div>

      {/* Grooming del día */}
      <Card>
        <CardHeader
          title="Servicios de hoy"
          subtitle={new Date().toLocaleDateString('es-GT',{weekday:'long',day:'numeric',month:'long'})}
          action={
            <button onClick={() => navigate('/mi-agenda')} className="text-xs font-semibold text-violet-600 hover:text-violet-700 flex items-center gap-1">
              Ver agenda <ArrowRight size={12} />
            </button>
          }
        />

        {todayAppts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Scissors size={24} className="text-violet-300" />
            </div>
            <p className="text-sm text-gray-400 font-medium">Sin citas de grooming hoy</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayAppts.map(a => {
              const pet      = getPet(a.petId)
              const owner    = getOwner(a.ownerId)
              const hasAllergy = pet?.allergies && !['Ninguna','Ninguna conocida',''].includes(pet.allergies)
              const st       = STATUS[a.status] || STATUS.confirmed
              const isDone   = DONE.includes(a.status)
              const isActive = a.status === 'initiated'
              const petEmoji = PET_EMOJI[pet?.species] || '🐾'

              return (
                <div key={a.id} className={`rounded-2xl border-2 p-4 space-y-3 transition-all ${
                  isActive ? 'border-violet-300 bg-violet-50/60 shadow-sm shadow-violet-100' :
                  isDone   ? 'border-emerald-200 bg-emerald-50/30' :
                  'border-gray-100 bg-white hover:border-violet-100 hover:shadow-sm'
                }`}>
                  <div className="flex items-center gap-3">
                    {/* Pet avatar */}
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-xl ${
                      isActive ? 'bg-violet-100' : isDone ? 'bg-emerald-100' : 'bg-violet-50'
                    }`}>
                      {petEmoji}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900">{pet?.name}</p>
                      <p className="text-xs text-gray-400">{pet?.breed} · {owner?.name}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold text-violet-700 bg-violet-50 px-2 py-1 rounded-lg flex items-center gap-1">
                        <Clock size={10} /> {a.time}
                      </span>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </div>
                  </div>

                  {/* Allergy */}
                  {hasAllergy && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                      <AlertTriangle size={12} className="text-red-600 shrink-0" />
                      <p className="text-xs font-bold text-red-700">Alergia: {pet.allergies}</p>
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {pet?.age    && <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 font-medium">{pet.age} años</span>}
                    {pet?.weight && <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 font-medium">{pet.weight} kg</span>}
                    {a.reason    && <span className="text-xs bg-violet-100 text-violet-700 rounded-full px-2 py-0.5 font-medium">{a.reason}</span>}
                  </div>

                  {isActive && a.startedAt && (
                    <div className="flex items-center gap-2 bg-violet-100 rounded-xl px-3 py-2">
                      <span className="w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
                      <p className="text-xs font-bold text-violet-700">
                        En curso desde {new Date(a.startedAt).toLocaleTimeString('es-GT',{hour:'2-digit',minute:'2-digit'})}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  {!isDone && (
                    <div className="flex gap-2 pt-0.5">
                      {(a.status === 'confirmed' || a.status === 'scheduled') && (
                        <button
                          onClick={() => initiateAppointment(a.id)}
                          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors shadow-sm shadow-violet-200"
                        >
                          <Play size={14} /> Iniciar servicio
                        </button>
                      )}
                      {isActive && (
                        <button
                          onClick={() => navigate('/nuevo-grooming')}
                          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors shadow-sm shadow-emerald-200"
                        >
                          <Send size={14} /> Registrar y enviar
                        </button>
                      )}
                    </div>
                  )}
                  {isDone && (
                    <p className="text-xs text-emerald-600 font-bold flex items-center gap-1.5">
                      <CheckCircle size={13} /> Enviado a administración
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Próximas citas */}
      {upcoming.length > 0 && (
        <Card>
          <CardHeader
            title="Próximas citas"
            action={<button onClick={() => navigate('/mi-agenda')} className="text-xs font-semibold text-violet-600 hover:text-violet-700 flex items-center gap-1">Ver todas <ArrowRight size={12} /></button>}
          />
          <ul className="space-y-2">
            {upcoming.map(a => {
              const pet      = getPet(a.petId)
              const owner    = getOwner(a.ownerId)
              const hasAllergy = pet?.allergies && !['Ninguna','Ninguna conocida',''].includes(pet.allergies)
              const petEmoji = PET_EMOJI[pet?.species] || '🐾'
              return (
                <li key={a.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-10 text-center shrink-0">
                    <p className="text-[10px] text-gray-400 font-medium">{a.date?.slice(5)}</p>
                    <p className="text-sm font-bold text-violet-600">{a.time}</p>
                  </div>
                  <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center shrink-0 text-lg">
                    {petEmoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">{pet?.name}</p>
                    <p className="text-xs text-gray-400 truncate">{owner?.name} · {a.reason}</p>
                    {hasAllergy && (
                      <span className="text-[10px] text-red-500 font-semibold flex items-center gap-0.5 mt-0.5">
                        <AlertTriangle size={9} /> {pet.allergies}
                      </span>
                    )}
                  </div>
                  <Badge variant="blue">Confirmada</Badge>
                </li>
              )
            })}
          </ul>
        </Card>
      )}
    </div>
  )
}
