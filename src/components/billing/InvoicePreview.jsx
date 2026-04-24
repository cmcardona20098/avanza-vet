import { useState } from 'react'
import { CheckCircle, Stethoscope, Scissors, Printer, MessageCircle, Banknote, CreditCard, ArrowLeftRight } from 'lucide-react'
import Button from '../ui/Button'
import Badge from '../ui/Badge'

const Q = (n) => `Q${Number(n || 0).toFixed(2)}`

const paymentMethods = [
  { key: 'cash',     label: 'Efectivo',      icon: Banknote,       color: 'border-emerald-400 bg-emerald-50 text-emerald-800' },
  { key: 'card',     label: 'Tarjeta',       icon: CreditCard,     color: 'border-blue-400 bg-blue-50 text-blue-800'          },
  { key: 'transfer', label: 'Transferencia', icon: ArrowLeftRight, color: 'border-violet-400 bg-violet-50 text-violet-800'    },
]

const methodLabel   = { cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia' }
const methodVariant = { cash: 'green',    card: 'blue',    transfer: 'purple'        }

function calcInvoiceTotals(invoice) {
  const fee    = Number(invoice.consultationFee || 0)
  const meds   = (invoice.medications  || []).reduce((s, m) => s + (Number(m.price || 0) * (m.totalQuantity || 1)), 0)
  const treats = (invoice.treatments   || []).reduce((s, t) => s + (Number(t.price || 0) * Number(t.quantity || 1)), 0)
  const vax    = (invoice.vaccines     || []).reduce((s, v) => s + Number(v.price || 0), 0)
  const dew    = (invoice.dewormings   || []).reduce((s, d) => s + Number(d.price || 0), 0)
  const groom  = (invoice.groomingServices || []).reduce((s, g) => s + Number(g.price || 0), 0)
  return { fee, meds, treats, vax, dew, groom, total: fee + meds + treats + vax + dew + groom }
}

function Section({ title, color = 'gray', children }) {
  const colors = {
    gray:   'text-gray-500 border-gray-100',
    blue:   'text-blue-600 border-blue-100',
    green:  'text-green-600 border-green-100',
    yellow: 'text-yellow-600 border-yellow-100',
    violet: 'text-violet-600 border-violet-100',
  }
  return (
    <div>
      <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 pb-1 border-b ${colors[color]}`}>{title}</h4>
      {children}
    </div>
  )
}

function LineItem({ label, sub, qty, price, bold }) {
  return (
    <div className={`flex items-start justify-between py-1.5 ${bold ? 'font-semibold' : ''}`}>
      <div className="flex-1 pr-4">
        <p className={`text-sm ${bold ? 'text-gray-900' : 'text-gray-700'}`}>{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      <div className="text-right shrink-0">
        {qty && <p className="text-xs text-gray-400">{qty}</p>}
        <p className={`text-sm ${bold ? 'text-gray-900 text-base font-bold' : 'text-gray-800'}`}>
          {price !== undefined ? Q(price) : ''}
        </p>
      </div>
    </div>
  )
}

export default function InvoicePreview({ item, pet, owner, onMarkPaid, showPayButton, onWhatsApp }) {
  const inv = item.invoice
  const isConsultation = item.type === 'consultation'
  const { fee, meds, treats, vax, dew, groom, total } = calcInvoiceTotals(inv)

  // Payment method state (only used when showPayButton is true)
  const [selectedMethod, setSelectedMethod] = useState('cash')

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 text-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Avanza Vet</p>
            <h2 className="text-xl font-bold mt-0.5">
              {isConsultation ? 'Evaluación Médica' : 'Servicio de Grooming'}
            </h2>
            <p className="text-gray-400 text-sm mt-0.5">{inv.date}</p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isConsultation ? 'bg-blue-500' : 'bg-violet-500'}`}>
            {isConsultation ? <Stethoscope size={22} /> : <Scissors size={22} />}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-0.5">Mascota</p>
            <p className="font-bold">{pet?.name}</p>
            <p className="text-xs text-gray-300">{pet?.breed}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-0.5">Dueño</p>
            <p className="font-bold">{owner?.name}</p>
            <p className="text-xs text-gray-300">{owner?.phone}</p>
          </div>
        </div>
      </div>

      {/* Detalle por tipo */}
      {isConsultation ? (
        <div className="space-y-4">
          {inv.diagnosis && (
            <Section title="Diagnóstico" color="blue">
              <p className="text-sm text-gray-700 bg-blue-50 rounded-lg p-3">{inv.diagnosis}</p>
            </Section>
          )}

          {inv.medications?.length > 0 && (
            <Section title="Medicamentos recetados" color="blue">
              {inv.medications.map((m, i) => (
                <div key={i} className="mb-2">
                  <LineItem
                    label={m.name}
                    sub={`${m.qtyPerDose} × ${m.frequencyLabel || `cada ${m.frequencyHours}h`} × ${m.durationDays} días`}
                    qty={m.totalQuantity ? `Total: ${m.totalQuantity} ${m.unit || 'unidades'}` : undefined}
                    price={m.price * (m.totalQuantity || 1)}
                  />
                  {m.instructions && (
                    <p className="text-xs text-gray-400 italic ml-2 mb-1">{m.instructions}</p>
                  )}
                </div>
              ))}
            </Section>
          )}

          {inv.treatments?.length > 0 && (
            <Section title="Tratamientos" color="green">
              {inv.treatments.map((t, i) => (
                <LineItem key={i} label={t.name} sub={t.description} qty={t.quantity > 1 ? `x${t.quantity}` : undefined} price={t.price * t.quantity} />
              ))}
            </Section>
          )}

          {inv.vaccines?.length > 0 && (
            <Section title="Vacunas aplicadas" color="yellow">
              {inv.vaccines.map((v, i) => <LineItem key={i} label={v.name} price={v.price} />)}
            </Section>
          )}

          {inv.dewormings?.length > 0 && (
            <Section title="Desparasitantes" color="yellow">
              {inv.dewormings.map((d, i) => <LineItem key={i} label={d.name} price={d.price} />)}
            </Section>
          )}

          {inv.observations && (
            <Section title="Observaciones">
              <p className="text-sm text-gray-600 italic">{inv.observations}</p>
            </Section>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {inv.groomingServices?.length > 0 && (
            <Section title="Servicios de grooming" color="violet">
              {inv.groomingServices.map((g, i) => <LineItem key={i} label={g.name} price={g.price} />)}
            </Section>
          )}
          {inv.timerData && (
            <Section title="Métricas del servicio">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-xs text-gray-400">Inicio</p>
                  <p className="text-sm font-semibold">{inv.timerData.startDisplay}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-xs text-gray-400">Fin</p>
                  <p className="text-sm font-semibold">{inv.timerData.endDisplay}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-xs text-gray-400">Duración</p>
                  <p className="text-sm font-semibold">{inv.timerData.durationDisplay}</p>
                </div>
              </div>
            </Section>
          )}
          {inv.products && (
            <Section title="Productos utilizados">
              <p className="text-sm text-gray-700">{inv.products}</p>
            </Section>
          )}
          {inv.observations && (
            <Section title="Observaciones">
              <p className="text-sm text-gray-600 italic">{inv.observations}</p>
            </Section>
          )}
        </div>
      )}

      {/* Totales en Q */}
      <div className="bg-gray-50 rounded-2xl p-4 space-y-1.5 border border-gray-200">
        {fee   > 0 && <LineItem label="Consulta médica"  price={fee}   />}
        {meds  > 0 && <LineItem label="Medicamentos"     price={meds}  />}
        {treats> 0 && <LineItem label="Tratamientos"     price={treats}/>}
        {vax   > 0 && <LineItem label="Vacunas"          price={vax}   />}
        {dew   > 0 && <LineItem label="Desparasitantes"  price={dew}   />}
        {groom > 0 && <LineItem label="Grooming"         price={groom} />}
        <div className="border-t border-gray-300 pt-2 mt-2">
          <div className="flex items-center justify-between">
            <p className="font-bold text-gray-900 text-base">TOTAL</p>
            <p className="text-2xl font-bold text-gray-900">{Q(total)}</p>
          </div>
        </div>
      </div>

      {/* Método de pago (selector cuando está pendiente) */}
      {showPayButton && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Método de pago</p>
          <div className="grid grid-cols-3 gap-2">
            {paymentMethods.map(pm => {
              const Icon = pm.icon
              return (
                <button
                  key={pm.key}
                  type="button"
                  onClick={() => setSelectedMethod(pm.key)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                    selectedMethod === pm.key ? pm.color : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <Icon size={18} className={selectedMethod === pm.key ? '' : 'text-gray-400'} />
                  <span className={`text-xs font-semibold ${selectedMethod === pm.key ? '' : 'text-gray-600'}`}>
                    {pm.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Estado y remitente */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <span>Enviado por:</span>
        <Badge variant="gray">{item.sentBy}</Badge>
        <span>·</span>
        <span>{item.sentAt}</span>
        {item.status === 'paid' && (
          <>
            <span>·</span>
            <Badge variant="green">✓ Cobrado — {item.paidAt}</Badge>
            {item.paymentMethod && (
              <Badge variant={methodVariant[item.paymentMethod] || 'green'}>
                {methodLabel[item.paymentMethod]}
              </Badge>
            )}
          </>
        )}
        {item.whatsappSent && (
          <><span>·</span><Badge variant="green">✓ Factura enviada por WhatsApp</Badge></>
        )}
      </div>

      {/* Acciones */}
      <div className="flex flex-wrap gap-3 justify-end border-t border-gray-100 pt-4">
        <Button variant="secondary" size="sm" icon={Printer} onClick={() => window.print()}>Imprimir</Button>
        {onWhatsApp && (
          <Button variant="whatsapp" size="sm" icon={MessageCircle} onClick={onWhatsApp}>
            {item.whatsappSent ? 'Reenviar WhatsApp' : 'Enviar por WhatsApp'}
          </Button>
        )}
        {showPayButton && (
          <Button variant="success" icon={CheckCircle} onClick={() => onMarkPaid(selectedMethod)}>
            Cobrar ({methodLabel[selectedMethod]}) — {Q(total)}
          </Button>
        )}
      </div>
    </div>
  )
}
