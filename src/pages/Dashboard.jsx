import { PawPrint, CalendarDays, Syringe, MessageCircle, AlertTriangle, Clock } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useNavigate } from 'react-router-dom'
import Card, { CardHeader } from '../components/ui/Card'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { stats, appointments, pets, owners, vaccines, whatsappFollowUps } from '../data/mockData'

function getOwner(ownerId) { return owners.find(o => o.id === ownerId) }
function getPet(petId) { return pets.find(p => p.id === petId) }

const statusColors = { scheduled: 'blue', completed: 'green', cancelled: 'red' }
const statusLabels = { scheduled: 'Agendada', completed: 'Completada', cancelled: 'Cancelada' }

const overdueVaccines = vaccines.filter(v => v.status === 'overdue')
const dueSoonVaccines = vaccines.filter(v => v.status === 'due_soon')

export default function Dashboard() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Alerta urgente */}
      {overdueVaccines.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <AlertTriangle size={18} className="text-red-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">
              {overdueVaccines.length} vacuna(s) vencida(s)
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              {overdueVaccines.map(v => {
                const pet = getPet(v.petId)
                return `${pet?.name} — ${v.name}`
              }).join(' · ')}
            </p>
          </div>
          <Button size="sm" variant="danger" onClick={() => navigate('/vacunas')}>
            Ver ahora
          </Button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Mascotas"
          value={stats.totalPets}
          icon={PawPrint}
          color="blue"
          subtitle="Pacientes activos"
        />
        <StatCard
          title="Citas esta semana"
          value={stats.appointmentsThisWeek}
          icon={CalendarDays}
          color="purple"
          subtitle="Próximos 7 días"
        />
        <StatCard
          title="Vacunas pendientes"
          value={stats.pendingVaccines + stats.overdueVaccines}
          icon={Syringe}
          color="yellow"
          subtitle={`${stats.overdueVaccines} vencida(s)`}
        />
        <StatCard
          title="Seguimientos IA"
          value={stats.pendingFollowUps}
          icon={MessageCircle}
          color="green"
          subtitle="Por enviar hoy"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfica */}
        <Card className="lg:col-span-2">
          <CardHeader title="Consultas por mes" subtitle="Últimos 6 meses" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.monthlyConsultations} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                cursor={{ fill: '#f8fafc' }}
              />
              <Bar dataKey="count" name="Consultas" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Citas de hoy */}
        <Card>
          <CardHeader
            title="Próximas citas"
            action={
              <Button size="sm" variant="ghost" onClick={() => navigate('/citas')}>
                Ver todas
              </Button>
            }
          />
          <ul className="space-y-3">
            {appointments.slice(0, 4).map(appt => {
              const pet = getPet(appt.petId)
              const owner = getOwner(appt.ownerId)
              return (
                <li key={appt.id} className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
                    <PawPrint size={16} className="text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{pet?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{owner?.name}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Clock size={11} className="text-gray-400" />
                      <span className="text-xs text-gray-500">{appt.date} · {appt.time}</span>
                    </div>
                  </div>
                  <Badge variant={statusColors[appt.status]}>{statusLabels[appt.status]}</Badge>
                </li>
              )
            })}
          </ul>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vacunas próximas */}
        <Card>
          <CardHeader
            title="Vacunas próximas a vencer"
            action={
              <Button size="sm" variant="ghost" onClick={() => navigate('/vacunas')}>Ver todas</Button>
            }
          />
          {dueSoonVaccines.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Todo al día ✓</p>
          ) : (
            <ul className="space-y-3">
              {dueSoonVaccines.map(v => {
                const pet = getPet(v.petId)
                return (
                  <li key={v.id} className="flex items-center gap-3 p-3 bg-yellow-50 rounded-xl border border-yellow-100">
                    <Syringe size={16} className="text-yellow-600 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{pet?.name} — {v.name}</p>
                      <p className="text-xs text-yellow-700">Vence: {v.nextDueDate}</p>
                    </div>
                    <Badge variant="yellow">Pronto</Badge>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        {/* Seguimientos pendientes */}
        <Card>
          <CardHeader
            title="Seguimientos IA pendientes"
            action={
              <Button size="sm" variant="ghost" onClick={() => navigate('/seguimiento')}>Ver todos</Button>
            }
          />
          <ul className="space-y-3">
            {whatsappFollowUps.filter(f => f.status === 'pending').map(f => {
              const pet = getPet(f.petId)
              const owner = getOwner(f.ownerId)
              const typeLabels = {
                post_consultation: 'Post consulta',
                vaccine_reminder: 'Recordatorio vacuna',
                deworming_reminder: 'Desparasitante',
              }
              return (
                <li key={f.id} className="flex items-start gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                  <MessageCircle size={16} className="text-green-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{pet?.name} · {owner?.name}</p>
                    <p className="text-xs text-gray-500">{typeLabels[f.type]} · {f.scheduledDate}</p>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{f.message}</p>
                  </div>
                  <Badge variant="green">Pendiente</Badge>
                </li>
              )
            })}
          </ul>
        </Card>
      </div>
    </div>
  )
}
