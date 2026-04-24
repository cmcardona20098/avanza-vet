import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays, PawPrint, Users, Inbox, DollarSign,
  Stethoscope, Scissors, CheckCircle, Eye, EyeOff, UserCog,
  AlertTriangle, Package, ChevronDown, ChevronUp, Clock,
  Banknote, CreditCard, ArrowLeftRight
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useApp } from '../../context/AppContext'
import Card, { CardHeader } from '../../components/ui/Card'
import StatCard from '../../components/ui/StatCard'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'

const Q = (n) => `Q${Number(n || 0).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const monthlyData = [
  { month: 'Nov', consultas: 8,  grooming: 5  },
  { month: 'Dic', consultas: 12, grooming: 8  },
  { month: 'Ene', consultas: 10, grooming: 6  },
  { month: 'Feb', consultas: 15, grooming: 10 },
  { month: 'Mar', consultas: 11, grooming: 9  },
  { month: 'Abr', consultas: 7,  grooming: 4  },
]

const statusLabels = { confirmed: 'Confirmada', pending: 'Pendiente', cancelled: 'Cancelada', completed: 'Completada', initiated: 'En curso', sent_to_admin: 'Completada' }
const statusColors = { confirmed: 'blue', pending: 'yellow', cancelled: 'red', completed: 'green', initiated: 'purple', sent_to_admin: 'green' }

const PENDING_STATUSES   = ['confirmed', 'pending', 'initiated']
const COMPLETED_STATUSES = ['sent_to_admin', 'completed', 'paid']

function calcItemAmount(item) {
  const inv  = item.invoice || {}
  const meds   = inv.medications?.reduce((s, m) => s + (m.price || 0) * (m.totalQuantity || 1), 0) || 0
  const treats = inv.treatments?.reduce((s, t) => s + (t.price || 0) * Number(t.quantity || 1), 0) || 0
  const groom  = inv.groomingServices?.reduce((s, g) => s + (g.price || 0), 0) || 0
  return (inv.consultationFee || 0) + meds + treats + groom
}

// ── Appointment indicator mini-card ─────────────────────────────────────────
function ApptIndicator({ label, pending, completed, color }) {
  const colors = {
    gray:   { bg: 'bg-gray-50 border-gray-200', title: 'text-gray-700', pending: 'bg-yellow-100 text-yellow-800', done: 'bg-green-100 text-green-800' },
    blue:   { bg: 'bg-blue-50 border-blue-200',   title: 'text-blue-800', pending: 'bg-yellow-100 text-yellow-800', done: 'bg-green-100 text-green-800' },
    violet: { bg: 'bg-violet-50 border-violet-200', title: 'text-violet-800', pending: 'bg-yellow-100 text-yellow-800', done: 'bg-green-100 text-green-800' },
  }
  const c = colors[color] || colors.gray
  return (
    <div className={`rounded-xl border p-4 ${c.bg}`}>
      <p className={`text-xs font-bold uppercase tracking-wide mb-3 ${c.title}`}>{label}</p>
      <div className="flex gap-2">
        <div className={`flex-1 rounded-lg px-2 py-1.5 text-center ${c.pending}`}>
          <p className="text-xl font-bold">{pending}</p>
          <p className="text-xs font-medium">Pendientes</p>
        </div>
        <div className={`flex-1 rounded-lg px-2 py-1.5 text-center ${c.done}`}>
          <p className="text-xl font-bold">{completed}</p>
          <p className="text-xs font-medium">Completadas</p>
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { appointments, inbox, pendingCount, pets, owners, users, inventory } = useApp()
  const [showIncome, setShowIncome]             = useState(false)
  const [showIncomeDetail, setShowIncomeDetail] = useState(false)

  function getPet(id)    { return pets.find(p => p.id === id) }
  function getOwner(id)  { return owners.find(o => o.id === id) }
  function getUserName(a) {
    if (a.vetId) return users.find(u => u.id === a.vetId)?.name || a.vet || '—'
    return a.vet || '—'
  }

  const today = new Date().toISOString().split('T')[0]
  const todayAppts   = appointments.filter(a => a.date === today)
  const vetAppts     = todayAppts.filter(a => a.assignedTo === 'vet'    || a.serviceType === 'consultation')
  const groomerAppts = todayAppts.filter(a => a.assignedTo === 'groomer' || a.serviceType === 'grooming')
  const upcoming     = appointments.filter(a => a.date > today && a.status !== 'cancelled').slice(0, 4)

  // ── Appointment indicators ────────────────────────────
  const totalPending    = todayAppts.filter(a => PENDING_STATUSES.includes(a.status)).length
  const totalCompleted  = todayAppts.filter(a => COMPLETED_STATUSES.includes(a.status)).length
  const vetPending      = vetAppts.filter(a => PENDING_STATUSES.includes(a.status)).length
  const vetCompleted    = vetAppts.filter(a => COMPLETED_STATUSES.includes(a.status)).length
  const groomPending    = groomerAppts.filter(a => PENDING_STATUSES.includes(a.status)).length
  const groomCompleted  = groomerAppts.filter(a => COMPLETED_STATUSES.includes(a.status)).length

  // ── Next appointment banner ───────────────────────────
  const now = new Date()
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const nextAppt = todayAppts
    .filter(a => PENDING_STATUSES.includes(a.status) && a.time >= currentTime)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''))[0]
  const nextPet   = nextAppt ? getPet(nextAppt.petId)   : null
  const nextOwner = nextAppt ? getOwner(nextAppt.ownerId) : null

  // ── Income ───────────────────────────────────────────
  const todayInbox = inbox.filter(i => i.date === today)
  const dayIncome  = todayInbox.reduce((s, i) => s + calcItemAmount(i), 0)
  const dayPaid    = todayInbox.filter(i => i.status === 'paid').reduce((s, i) => s + calcItemAmount(i), 0)
  const dayPending = todayInbox.filter(i => i.status === 'pending').reduce((s, i) => s + calcItemAmount(i), 0)

  const dayByMethod = ['cash', 'card', 'transfer'].reduce((acc, m) => {
    acc[m] = todayInbox.filter(i => i.status === 'paid' && i.paymentMethod === m).reduce((s, i) => s + calcItemAmount(i), 0)
    return acc
  }, {})

  const pendingBilling = inbox.filter(i => i.status === 'pending')

  // ── Inventory alerts ─────────────────────────────────
  const lowStockItems = (inventory || []).filter(i => i.quantity > 0 && i.quantity <= i.minStock)
  const outOfStock    = (inventory || []).filter(i => i.quantity <= 0)

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Accesos rápidos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Nueva cita',    icon: CalendarDays, color: 'bg-blue-600',    onClick: () => navigate('/agenda') },
          { label: 'Nueva mascota', icon: PawPrint,     color: 'bg-emerald-600', onClick: () => navigate('/mascotas') },
          { label: 'Nuevo dueño',   icon: Users,        color: 'bg-violet-600',  onClick: () => navigate('/duenos') },
          { label: 'Facturación',   icon: Inbox,        color: 'bg-orange-500',  onClick: () => navigate('/bandeja') },
        ].map(({ label, icon: Icon, color, onClick }) => (
          <button key={label} onClick={onClick}
            className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3 hover:shadow-md transition-all group">
            <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center shrink-0`}>
              <Icon size={18} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">{label}</span>
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Citas hoy" value={todayAppts.length} icon={CalendarDays} color="blue"
          subtitle={`${vetAppts.length} médicas · ${groomerAppts.length} grooming`} />
        <StatCard title="Pendientes cobro" value={pendingCount} icon={Inbox} color="yellow" subtitle="En bandeja" />
        <StatCard title="Mascotas activas" value={pets.length} icon={PawPrint} color="purple" subtitle={`${owners.length} dueños`} />
        <StatCard title="Usuarios del sistema" value={users.length} icon={UserCog} color="green"
          subtitle={`${users.filter(u => u.role === 'vet').length} vet · ${users.filter(u => u.role === 'groomer').length} groomer`} />
      </div>

      {/* ── Indicadores de citas + próxima cita ──────────── */}
      <Card>
        <CardHeader
          title="Citas del día"
          subtitle={`${today} · ${todayAppts.length} total`}
          action={<Button size="sm" variant="ghost" onClick={() => navigate('/agenda')}>Ver agenda</Button>}
        />

        {/* Indicators grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <ApptIndicator label="Total citas" pending={totalPending} completed={totalCompleted} color="gray" />
          <ApptIndicator label="Consultas médicas" pending={vetPending} completed={vetCompleted} color="blue" />
          <ApptIndicator label="Grooming" pending={groomPending} completed={groomCompleted} color="violet" />
        </div>

        {/* Next appointment banner */}
        {nextAppt ? (
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl px-4 py-3 flex items-center gap-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <Clock size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-blue-200 uppercase tracking-wide">Próxima cita por atender</p>
              <div className="flex flex-wrap items-baseline gap-2 mt-0.5">
                <span className="text-xl font-bold text-white">{nextAppt.time}</span>
                <span className="text-white font-semibold">{nextPet?.name}</span>
                {nextOwner && <span className="text-blue-200 text-sm">· {nextOwner.name}</span>}
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-blue-200">
                <span className="flex items-center gap-1">
                  {nextAppt.serviceType === 'consultation' ? <Stethoscope size={11} /> : <Scissors size={11} />}
                  {nextAppt.serviceType === 'consultation' ? 'Consulta médica' : 'Grooming'}
                </span>
                {getUserName(nextAppt) !== '—' && (
                  <span>· {getUserName(nextAppt)}</span>
                )}
                <span className={`px-2 py-0.5 rounded-full font-semibold ${
                  nextAppt.status === 'initiated' ? 'bg-purple-400/30 text-purple-100' : 'bg-white/15 text-blue-100'
                }`}>
                  {statusLabels[nextAppt.status] || nextAppt.status}
                </span>
              </div>
            </div>
            {nextAppt.reason && (
              <div className="hidden sm:block text-right shrink-0 max-w-[160px]">
                <p className="text-xs text-blue-300">Motivo</p>
                <p className="text-sm text-white font-medium">{nextAppt.reason}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-3">
            <CheckCircle size={18} className="text-green-500 shrink-0" />
            <p className="text-sm text-gray-500">
              {todayAppts.length === 0
                ? 'No hay citas agendadas para hoy.'
                : 'No hay más citas pendientes para atender hoy. ✓'}
            </p>
          </div>
        )}
      </Card>

      {/* Ingreso del día */}
      <div className="rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <DollarSign size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-emerald-100 text-sm font-medium">Ingreso del día</p>
            {showIncome ? (
              <>
                <p className="text-3xl font-bold text-white">{Q(dayIncome)}</p>
                <div className="flex flex-wrap gap-3 mt-1">
                  <span className="text-emerald-200 text-xs">✓ Cobrado: {Q(dayPaid)}</span>
                  <span className="text-emerald-200 text-xs">⏳ Pendiente: {Q(dayPending)}</span>
                </div>
                {dayPaid > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[
                      { key: 'cash',     label: 'Efectivo',      Icon: Banknote       },
                      { key: 'card',     label: 'Tarjeta',       Icon: CreditCard     },
                      { key: 'transfer', label: 'Transferencia', Icon: ArrowLeftRight },
                    ].map(({ key, label, Icon }) => dayByMethod[key] > 0 && (
                      <div key={key} className="flex items-center gap-1 bg-white/15 rounded-lg px-2.5 py-1">
                        <Icon size={12} className="text-white" />
                        <span className="text-xs text-white font-medium">{label}: {Q(dayByMethod[key])}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="text-3xl font-bold text-white">••••••</p>
                <p className="text-emerald-200 text-xs mt-0.5">{todayInbox.length} servicio(s) hoy</p>
              </>
            )}
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <button
              onClick={() => { setShowIncome(v => !v); if (!showIncome) setShowIncomeDetail(false) }}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
            >
              {showIncome ? <EyeOff size={16} /> : <Eye size={16} />}
              {showIncome ? 'Ocultar' : 'Mostrar'}
            </button>
            {showIncome && todayInbox.length > 0 && (
              <button
                onClick={() => setShowIncomeDetail(v => !v)}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-xs font-medium px-4 py-2 rounded-xl transition-colors"
              >
                {showIncomeDetail ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {showIncomeDetail ? 'Ocultar detalle' : 'Ver detalle'}
              </button>
            )}
          </div>
        </div>

        {showIncome && showIncomeDetail && (
          <div className="bg-emerald-700 px-5 pb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-emerald-600">
                  {['Mascota', 'Tipo', 'Enviado por', 'Estado', 'Monto'].map(h => (
                    <th key={h} className="py-2 px-2 text-left text-xs font-semibold text-emerald-200 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {todayInbox.length === 0 ? (
                  <tr><td colSpan={5} className="py-4 text-center text-emerald-300 text-xs">Sin servicios registrados hoy</td></tr>
                ) : todayInbox.map(item => {
                  const pet = getPet(item.petId)
                  return (
                    <tr key={item.id} className="border-b border-emerald-600/40">
                      <td className="py-2 px-2 text-white font-medium">{pet?.name || '—'}</td>
                      <td className="py-2 px-2 text-emerald-200">{item.type === 'consultation' ? '🩺 Consulta' : '✂️ Grooming'}</td>
                      <td className="py-2 px-2 text-emerald-200 text-xs">{item.sentBy || '—'}</td>
                      <td className="py-2 px-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${item.status === 'paid' ? 'bg-green-400/20 text-green-200' : 'bg-yellow-400/20 text-yellow-200'}`}>
                          {item.status === 'paid' ? 'Cobrado' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-white font-bold">{Q(calcItemAmount(item))}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} className="pt-2 px-2 text-emerald-200 text-xs font-semibold text-right">TOTAL DEL DÍA</td>
                  <td className="pt-2 px-2 text-white font-bold text-base">{Q(dayIncome)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Alerta inventario bajo */}
      {(lowStockItems.length > 0 || outOfStock.length > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            {outOfStock.length > 0 && (
              <p className="text-sm font-semibold text-red-800">
                {outOfStock.length} producto(s) sin stock: {outOfStock.map(i => i.name).join(', ')}
              </p>
            )}
            {lowStockItems.length > 0 && (
              <p className="text-sm font-medium text-amber-800 mt-0.5">
                {lowStockItems.length} producto(s) con bajo inventario: {lowStockItems.map(i => `${i.name} (${i.quantity} ${i.unit})`).join(', ')}
              </p>
            )}
          </div>
          <Button size="sm" onClick={() => navigate('/inventario')} className="bg-amber-600 hover:bg-amber-700 text-white shrink-0">
            <Package size={13} className="mr-1" /> Ver inventario
          </Button>
        </div>
      )}

      {/* Alerta bandeja */}
      {pendingCount > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <Inbox size={18} className="text-orange-600 shrink-0" />
          <p className="text-sm font-medium text-orange-800 flex-1">
            Tienes <strong>{pendingCount}</strong> servicio(s) completado(s) pendiente(s) de cobro.
          </p>
          <Button size="sm" onClick={() => navigate('/bandeja')} className="bg-orange-600 hover:bg-orange-700 text-white shrink-0">
            Ver bandeja
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfica */}
        <Card className="lg:col-span-2">
          <CardHeader title="Servicios por mes" subtitle="Consultas médicas vs Grooming" />
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={monthlyData} barSize={20} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="consultas" name="Consultas" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              <Bar dataKey="grooming"  name="Grooming"  fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Bandeja */}
        <Card>
          <CardHeader
            title="Bandeja de servicios"
            action={<Button size="sm" variant="ghost" onClick={() => navigate('/bandeja')}>Ver todo</Button>}
          />
          {pendingBilling.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle size={32} className="text-green-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Todo cobrado ✓</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {pendingBilling.slice(0, 4).map(item => {
                const pet = getPet(item.petId)
                const TypeIcon = item.type === 'consultation' ? Stethoscope : Scissors
                return (
                  <li key={item.id}
                    className="flex items-start gap-3 p-3 bg-orange-50 rounded-xl border border-orange-100 cursor-pointer hover:bg-orange-100 transition-colors"
                    onClick={() => navigate('/bandeja')}>
                    <TypeIcon size={16} className={item.type === 'consultation' ? 'text-blue-500' : 'text-violet-500'} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{pet?.name}</p>
                      <p className="text-xs text-gray-500">{item.type === 'consultation' ? 'Evaluación médica' : 'Grooming'} · {item.sentAt}</p>
                    </div>
                    <Badge variant="yellow">Cobrar</Badge>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>

      {/* Agendas del día */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Consultas médicas hoy"
            action={<div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-xs text-gray-500">Hoy</span></div>} />
          {vetAppts.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Sin consultas hoy</p>
          ) : (
            <ul className="space-y-3">
              {vetAppts.map(a => {
                const pet   = getPet(a.petId)
                const owner = getOwner(a.ownerId)
                return (
                  <li key={a.id} className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl">
                    <div className="text-center w-12 shrink-0">
                      <p className="text-sm font-bold text-emerald-700">{a.time}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{pet?.name}</p>
                      <p className="text-xs text-gray-500">{owner?.name} · {a.reason}</p>
                    </div>
                    <Badge variant={statusColors[a.status] || 'blue'}>{statusLabels[a.status] || a.status}</Badge>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Grooming hoy"
            action={<div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-violet-500" /><span className="text-xs text-gray-500">Hoy</span></div>} />
          {groomerAppts.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Sin citas de grooming hoy</p>
          ) : (
            <ul className="space-y-3">
              {groomerAppts.map(a => {
                const pet   = getPet(a.petId)
                const owner = getOwner(a.ownerId)
                return (
                  <li key={a.id} className="flex items-center gap-3 p-3 bg-violet-50 rounded-xl">
                    <div className="text-center w-12 shrink-0">
                      <p className="text-sm font-bold text-violet-700">{a.time}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{pet?.name}</p>
                      <p className="text-xs text-gray-500">{owner?.name} · {a.reason}</p>
                    </div>
                    <Badge variant={statusColors[a.status] || 'blue'}>{statusLabels[a.status] || a.status}</Badge>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>

      {/* Próximas citas */}
      {upcoming.length > 0 && (
        <Card>
          <CardHeader
            title="Próximas citas"
            action={<Button size="sm" variant="ghost" onClick={() => navigate('/agenda')}>Ver agenda completa</Button>}
          />
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Fecha', 'Hora', 'Mascota', 'Dueño', 'Tipo', 'Asignado a', 'Estado'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {upcoming.map(a => {
                  const pet   = getPet(a.petId)
                  const owner = getOwner(a.ownerId)
                  return (
                    <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-3 text-sm text-gray-700">{a.date}</td>
                      <td className="px-3 py-3 text-sm font-medium text-gray-900">{a.time}</td>
                      <td className="px-3 py-3 text-sm font-medium text-gray-900">{pet?.name}</td>
                      <td className="px-3 py-3 text-sm text-gray-600">{owner?.name}</td>
                      <td className="px-3 py-3">
                        <Badge variant={a.serviceType === 'consultation' ? 'blue' : 'purple'}>
                          {a.serviceType === 'consultation' ? '🩺 Consulta' : '✂️ Grooming'}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-600">{getUserName(a)}</td>
                      <td className="px-3 py-3">
                        <Badge variant={statusColors[a.status] || 'gray'}>{statusLabels[a.status] || a.status}</Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
