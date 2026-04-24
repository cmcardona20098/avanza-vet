import { useState } from 'react'
import { Stethoscope, Scissors, CheckCircle, Eye, MessageCircle, Clock, Banknote, CreditCard, ArrowLeftRight } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import InvoicePreview from '../../components/billing/InvoicePreview'

const Q = (n) => `Q${Number(n || 0).toFixed(2)}`

const paymentMethods = [
  { key: 'cash',     label: 'Efectivo',      icon: Banknote,         color: 'border-emerald-400 bg-emerald-50 text-emerald-800' },
  { key: 'card',     label: 'Tarjeta',       icon: CreditCard,       color: 'border-blue-400 bg-blue-50 text-blue-800'           },
  { key: 'transfer', label: 'Transferencia', icon: ArrowLeftRight,   color: 'border-violet-400 bg-violet-50 text-violet-800'     },
]

const methodLabel = { cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia' }
const methodVariant = { cash: 'green', card: 'blue', transfer: 'purple' }

function calcTotal(invoice) {
  const fee    = Number(invoice.consultationFee || 0)
  const meds   = (invoice.medications     || []).reduce((s, m) => s + Number(m.price || 0) * (m.totalQuantity || 1), 0)
  const treats = (invoice.treatments      || []).reduce((s, t) => s + Number(t.price || 0) * Number(t.quantity || 1), 0)
  const vax    = (invoice.vaccines        || []).reduce((s, v) => s + Number(v.price || 0), 0)
  const dew    = (invoice.dewormings      || []).reduce((s, d) => s + Number(d.price || 0), 0)
  const groom  = (invoice.groomingServices|| []).reduce((s, g) => s + Number(g.price || 0), 0)
  return fee + meds + treats + vax + dew + groom
}

export default function AdminInbox() {
  const { inbox, pets, owners, markAsPaid, markWhatsAppSent } = useApp()
  const [selected, setSelected]     = useState(null)
  const [tab, setTab]               = useState('pending')
  const [payModal, setPayModal]     = useState(null)   // { itemId, amount }
  const [payMethod, setPayMethod]   = useState('cash')

  const filtered = tab === 'all' ? inbox : inbox.filter(i => i.status === tab)

  function getPet(id)   { return pets.find(p => p.id === id) }
  function getOwner(id) { return owners.find(o => o.id === id) }

  function openPayModal(item) {
    setPayMethod('cash')
    setPayModal({ itemId: item.id, amount: calcTotal(item.invoice) })
  }

  function confirmPay() {
    markAsPaid(payModal.itemId, payMethod)
    setPayModal(null)
    if (selected?.id === payModal.itemId) setSelected(null)
  }

  function handleMarkPaidFromInvoice(paymentMethod) {
    markAsPaid(selected.id, paymentMethod)
    setSelected(null)
  }

  function handleWhatsApp(item) {
    const owner = getOwner(item.ownerId)
    const pet   = getPet(item.petId)
    const total = calcTotal(item.invoice)
    const text  = encodeURIComponent(
      `Hola ${owner?.name}, le enviamos el detalle de los servicios de ${pet?.name} en Avanza Vet.\n\n` +
      `Servicio: ${item.invoice.serviceType}\nFecha: ${item.invoice.date}\nTotal: ${Q(total)}\n\nMuchas gracias por su preferencia. 🐾`
    )
    const number = owner?.whatsapp?.replace(/\D/g, '') || owner?.phone?.replace(/\D/g, '')
    window.open(`https://wa.me/${number}?text=${text}`, '_blank')
    markWhatsAppSent(item.id)
    if (selected?.id === item.id) setSelected(prev => ({ ...prev, whatsappSent: true }))
  }

  const pendingTotal = inbox
    .filter(i => i.status === 'pending')
    .reduce((s, i) => s + calcTotal(i.invoice), 0)

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Bandeja de servicios</h2>
        <p className="text-sm text-gray-500">Servicios completados pendientes de cobro</p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pendientes', value: inbox.filter(i => i.status === 'pending').length, color: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
          { label: 'Cobrados',   value: inbox.filter(i => i.status === 'paid').length,    color: 'bg-green-50 border-green-200 text-green-800'  },
          { label: 'Por cobrar', value: Q(pendingTotal),                                   color: 'bg-blue-50 border-blue-200 text-blue-800'     },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 text-center ${s.color}`}>
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-xs font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[{ key: 'pending', label: 'Pendientes' }, { key: 'paid', label: 'Cobrados' }, { key: 'all', label: 'Todos' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${tab === t.key ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {filtered.map(item => {
          const pet   = getPet(item.petId)
          const owner = getOwner(item.ownerId)
          const total = calcTotal(item.invoice)
          const TypeIcon = item.type === 'consultation' ? Stethoscope : Scissors

          return (
            <Card key={item.id} padding={false}>
              <div className="p-5 flex flex-col sm:flex-row gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${item.type === 'consultation' ? 'bg-blue-100' : 'bg-violet-100'}`}>
                  <TypeIcon size={22} className={item.type === 'consultation' ? 'text-blue-600' : 'text-violet-600'} />
                </div>

                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-gray-900">{pet?.name || 'Sin mascota'}</h3>
                    <Badge variant={item.type === 'consultation' ? 'blue' : 'purple'}>
                      {item.type === 'consultation' ? 'Evaluación médica' : 'Grooming'}
                    </Badge>
                    <Badge variant={item.status === 'pending' ? 'yellow' : 'green'}>
                      {item.status === 'pending' ? 'Pendiente' : 'Cobrado'}
                    </Badge>
                    {item.status === 'paid' && item.paymentMethod && (
                      <Badge variant={methodVariant[item.paymentMethod] || 'green'}>
                        {methodLabel[item.paymentMethod]}
                      </Badge>
                    )}
                    {item.whatsappSent && (
                      <Badge variant="green">
                        {item.whatsappSendCount > 1 ? `✓ Reenviado (${item.whatsappSendCount}x)` : '✓ WhatsApp enviado'}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">Dueño: <strong>{owner?.name}</strong></p>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Clock size={10} /> {item.sentAt}</span>
                    <span>Por: {item.sentBy}</span>
                    {item.status === 'paid' && item.paidAt && <span className="text-green-600">Cobrado: {item.paidAt}</span>}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Total</p>
                    <p className="text-xl font-bold text-gray-900">{Q(total)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-end">
                    <Button size="sm" variant="secondary" icon={Eye} onClick={() => setSelected(item)}>Detalle</Button>
                    <Button size="sm" variant="whatsapp" icon={MessageCircle} onClick={() => handleWhatsApp(item)}>
                      {item.whatsappSendCount > 1 ? 'Reenviar' : item.whatsappSent ? 'Reenviar' : 'WhatsApp'}
                    </Button>
                    {item.status === 'pending' && (
                      <Button size="sm" variant="success" icon={CheckCircle} onClick={() => openPayModal(item)}>
                        Cobrar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <CheckCircle size={40} className="text-green-200 mx-auto mb-3" />
            <p className="text-gray-500">Sin servicios en esta sección</p>
          </div>
        )}
      </div>

      {/* Modal detalle / factura */}
      {selected && (
        <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Detalle del servicio" size="xl">
          <InvoicePreview
            item={selected}
            pet={getPet(selected.petId)}
            owner={getOwner(selected.ownerId)}
            onMarkPaid={handleMarkPaidFromInvoice}
            showPayButton={selected.status === 'pending'}
            onWhatsApp={() => handleWhatsApp(selected)}
          />
        </Modal>
      )}

      {/* Modal selección método de pago */}
      <Modal
        isOpen={!!payModal}
        onClose={() => setPayModal(null)}
        title="Seleccionar método de pago"
        size="sm"
      >
        {payModal && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 text-center">
              Total a cobrar: <span className="text-xl font-bold text-gray-900">{Q(payModal.amount)}</span>
            </p>

            <div className="grid grid-cols-1 gap-3">
              {paymentMethods.map(pm => {
                const Icon = pm.icon
                return (
                  <button
                    key={pm.key}
                    type="button"
                    onClick={() => setPayMethod(pm.key)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      payMethod === pm.key ? pm.color + ' border-2' : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <Icon size={20} className={payMethod === pm.key ? '' : 'text-gray-400'} />
                    <span className={`font-semibold text-sm ${payMethod === pm.key ? '' : 'text-gray-700'}`}>
                      {pm.label}
                    </span>
                    {payMethod === pm.key && (
                      <CheckCircle size={16} className="ml-auto text-current" />
                    )}
                  </button>
                )
              })}
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1" onClick={() => setPayModal(null)}>Cancelar</Button>
              <Button variant="success" className="flex-1" icon={CheckCircle} onClick={confirmPay}>
                Confirmar cobro
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
