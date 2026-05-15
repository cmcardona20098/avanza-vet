import { useState, useMemo } from 'react'
import { DollarSign, TrendingUp, CreditCard, ArrowLeftRight, Banknote, Stethoscope, Scissors, ShoppingCart, Lock, Unlock, ChevronDown, ChevronUp } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import Card, { CardHeader } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'

const Q = (n) => `Q${Number(n || 0).toFixed(2)}`

function getLocalToday() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export default function Caja() {
  const { inbox, sales } = useApp()
  const [cajaOpen, setCajaOpen] = useState(false)
  const [cajaNote, setCajaNote] = useState('')
  const [showTransactions, setShowTransactions] = useState(false)

  const today = getLocalToday()

  // Today's paid inbox items
  const todayPaid = useMemo(() => {
    return inbox.filter(i => i.status === 'paid' && (i.date === today || (i.paidAt && i.paidAt.startsWith && typeof i.paidAt === 'string')))
  }, [inbox, today])

  // Today's sales (petshop)
  const todaySales = useMemo(() => {
    return (sales || []).filter(s => s.date === today)
  }, [sales, today])

  // Helper to get payments from item
  function getPayments(item) {
    if (item.payments && typeof item.payments === 'object') return item.payments
    if (item.paymentMethod === 'cash')     return { cash: calcItemTotal(item), card: 0, transfer: 0 }
    if (item.paymentMethod === 'card')     return { cash: 0, card: calcItemTotal(item), transfer: 0 }
    if (item.paymentMethod === 'transfer') return { cash: 0, card: 0, transfer: calcItemTotal(item) }
    return { cash: calcItemTotal(item), card: 0, transfer: 0 }
  }

  function calcItemTotal(item) {
    if (!item.invoice) return item.total || 0
    const inv = item.invoice
    return (Number(inv.consultationFee||0))
      + (inv.medications||[]).reduce((s,m)=>s+Number(m.price||0)*(m.totalQuantity||1),0)
      + (inv.treatments||[]).reduce((s,t)=>s+Number(t.price||0)*Number(t.quantity||1),0)
      + (inv.auxiliares||[]).reduce((s,a)=>s+Number(a.price||0)*Number(a.quantity||1),0)
      + (inv.vaccines||[]).reduce((s,v)=>s+Number(v.price||0),0)
      + (inv.dewormings||[]).reduce((s,d)=>s+Number(d.price||0),0)
      + (inv.groomingServices||[]).reduce((s,g)=>s+Number(g.price||0),0)
  }

  const totalConsultas = todayPaid.filter(i=>i.type==='consultation').reduce((s,i)=>s+calcItemTotal(i),0)
  const totalGrooming  = todayPaid.filter(i=>i.type==='grooming').reduce((s,i)=>s+calcItemTotal(i),0)
  const totalPetshop   = todaySales.reduce((s,x)=>s+Number(x.total||0),0)
  const totalDia       = totalConsultas+totalGrooming+totalPetshop

  // By payment method
  const byMethod = { cash:0, card:0, transfer:0 }
  todayPaid.forEach(i=>{const p=getPayments(i);byMethod.cash+=p.cash||0;byMethod.card+=p.card||0;byMethod.transfer+=p.transfer||0})
  todaySales.forEach(s=>{const p=s.payments||{};byMethod.cash+=p.cash||0;byMethod.card+=p.card||0;byMethod.transfer+=p.transfer||0})

  const allTodayTransactions = [
    ...todayPaid.map(i=>({
      id:i.id,label:i.type==='consultation'?'Consulta médica':'Grooming',
      total:calcItemTotal(i),payments:getPayments(i),time:i.paidAt||i.sentAt||'—',icon:'🏥'
    })),
    ...todaySales.map(s=>({
      id:s.id,label:'Petshop',total:s.total||0,payments:s.payments||{},time:s.createdAt||'—',icon:'🛒'
    })),
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign size={20} className="text-emerald-600"/> Cuadre de Caja
          </h2>
          <p className="text-sm text-gray-500">{new Date().toLocaleDateString('es-GT',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={cajaOpen?'green':'gray'}>
            {cajaOpen ? '🟢 Caja abierta' : '🔴 Caja cerrada'}
          </Badge>
          <button
            onClick={()=>setCajaOpen(v=>!v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm border-2 transition-all ${cajaOpen?'border-red-300 bg-red-50 text-red-700 hover:bg-red-100':'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
            {cajaOpen?<><Lock size={14}/> Cerrar caja</>:<><Unlock size={14}/> Abrir caja</>}
          </button>
        </div>
      </div>

      {/* Total del día hero */}
      <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 rounded-3xl p-6 text-white shadow-lg shadow-emerald-200/40">
        <p className="text-emerald-200 text-sm font-medium uppercase tracking-wide">Total del día</p>
        <p className="text-5xl font-bold mt-1">{Q(totalDia)}</p>
        <div className="grid grid-cols-3 gap-4 mt-5">
          {[
            {label:'Consultas',val:totalConsultas},
            {label:'Grooming', val:totalGrooming},
            {label:'Petshop',  val:totalPetshop},
          ].map(({label,val})=>(
            <div key={label} className="bg-white/15 rounded-2xl p-3 backdrop-blur-sm">
              <p className="text-emerald-200 text-xs font-medium">{label}</p>
              <p className="text-white text-xl font-bold mt-0.5">{Q(val)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Por método de pago */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {label:'Efectivo',    amount:byMethod.cash,     icon:Banknote,       color:'bg-emerald-50 border-emerald-200 text-emerald-700'},
          {label:'Tarjeta',     amount:byMethod.card,     icon:CreditCard,     color:'bg-blue-50 border-blue-200 text-blue-700'},
          {label:'Transferencia',amount:byMethod.transfer,icon:ArrowLeftRight, color:'bg-violet-50 border-violet-200 text-violet-700'},
        ].map(({label,amount,icon:Icon,color})=>(
          <div key={label} className={`rounded-2xl border p-5 ${color}`}>
            <div className="flex items-center gap-2 mb-3">
              <Icon size={16}/><p className="text-sm font-bold">{label}</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{Q(amount)}</p>
            <p className="text-xs mt-1 opacity-70">{Math.round(totalDia>0?amount/totalDia*100:0)}% del total</p>
          </div>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center hover:shadow-md transition-shadow">
          <Stethoscope size={20} className="text-blue-500 mx-auto mb-2"/>
          <p className="text-2xl font-bold text-gray-900">{todayPaid.filter(i=>i.type==='consultation').length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Consultas cobradas</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center hover:shadow-md transition-shadow">
          <Scissors size={20} className="text-violet-500 mx-auto mb-2"/>
          <p className="text-2xl font-bold text-gray-900">{todayPaid.filter(i=>i.type==='grooming').length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Grooming cobrados</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center hover:shadow-md transition-shadow">
          <ShoppingCart size={20} className="text-orange-500 mx-auto mb-2"/>
          <p className="text-2xl font-bold text-gray-900">{todaySales.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Ventas petshop</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center hover:shadow-md transition-shadow">
          <TrendingUp size={20} className="text-emerald-500 mx-auto mb-2"/>
          <p className="text-2xl font-bold text-gray-900">{allTodayTransactions.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Transacciones totales</p>
        </div>
      </div>

      {/* Transactions list */}
      <Card>
        <div className="flex items-center justify-between cursor-pointer" onClick={()=>setShowTransactions(v=>!v)}>
          <div>
            <p className="text-base font-bold text-gray-900">Transacciones de hoy</p>
            <p className="text-sm text-gray-500">{allTodayTransactions.length} movimientos</p>
          </div>
          {showTransactions?<ChevronUp size={16} className="text-gray-400"/>:<ChevronDown size={16} className="text-gray-400"/>}
        </div>
        {showTransactions && (
          <div className="mt-3 space-y-2">
            {allTodayTransactions.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Sin transacciones hoy</p>
            ) : allTodayTransactions.map(t=>(
              <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <span className="text-xl shrink-0">{t.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{t.label}</p>
                  <div className="flex flex-wrap gap-2 mt-0.5">
                    {t.payments.cash > 0 && <span className="text-xs text-emerald-600">💵 {Q(t.payments.cash)}</span>}
                    {t.payments.card > 0 && <span className="text-xs text-blue-600">💳 {Q(t.payments.card)}</span>}
                    {t.payments.transfer > 0 && <span className="text-xs text-violet-600">🏦 {Q(t.payments.transfer)}</span>}
                  </div>
                </div>
                <span className="text-sm font-bold text-gray-900 shrink-0">{Q(t.total)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Observaciones de cierre */}
      <Card>
        <div>
          <p className="text-base font-bold text-gray-900">Observaciones de caja</p>
        </div>
        <textarea value={cajaNote} onChange={e=>setCajaNote(e.target.value)}
          placeholder="Diferencias, notas del día, observaciones al cierre..."
          rows={3}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none mt-3"/>
      </Card>
    </div>
  )
}
