import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Send, Eye, Pill, Stethoscope, Syringe, AlertTriangle, CheckCircle, Calculator } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import Card, { CardHeader } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input, { Select, Textarea } from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import InvoicePreview from '../../components/billing/InvoicePreview'

const FREQUENCY_OPTIONS = [
  { label: 'Cada 1h',  value: 1  },
  { label: 'Cada 2h',  value: 2  },
  { label: 'Cada 3h',  value: 3  },
  { label: 'Cada 4h',  value: 4  },
  { label: 'Cada 6h',  value: 6  },
  { label: 'Cada 8h',  value: 8  },
  { label: 'Cada 12h', value: 12 },
  { label: 'Cada 24h', value: 24 },
]

function calcTotal(qtyPerDose, frequencyHours, durationDays) {
  const q = parseFloat(qtyPerDose) || 0
  const f = parseFloat(frequencyHours) || 0
  const d = parseFloat(durationDays) || 0
  if (!f || !d) return null
  return Math.ceil(q * (24 / f) * d * 100) / 100
}

function calcLabel(qtyPerDose, frequencyHours, durationDays, unit) {
  const total = calcTotal(qtyPerDose, frequencyHours, durationDays)
  if (total === null) return null
  const timesPerDay = 24 / parseFloat(frequencyHours)
  return {
    total,
    formula: `${timesPerDay} toma(s)/día × ${durationDays} días × ${qtyPerDose} = ${total} ${unit || 'unidades'}`,
  }
}

const emptyMed   = () => ({ catalogId: '', name: '', qtyPerDose: '1', frequencyHours: '12', durationDays: '', instructions: '', unit: 'pastilla' })
const emptyTreat = () => ({ catalogId: '', name: '', description: '', quantity: '1', frequency: '', duration: '', observations: '' })
const emptyVax   = () => ({ catalogId: '', name: '' })
const emptyDew   = () => ({ catalogId: '', name: '' })

export default function NewConsultation() {
  const navigate = useNavigate()
  const { pets, owners, catalog, inventory, addInboxItem, currentUser, appointments, updateAppointmentStatus } = useApp()

  // Inventory slices by type (source of truth for meds/vax/dews)
  const availableMeds = inventory.filter(i => i.type === 'medication')
  const availableVax  = inventory.filter(i => i.type === 'vaccine')
  const availableDews = inventory.filter(i => i.type === 'deworming')

  const [selectedPetId, setSelectedPetId] = useState(pets[0]?.id || '')
  const [reason, setReason]               = useState('')
  const [diagnosis, setDiagnosis]         = useState('')
  const [observations, setObservations]   = useState('')
  const [nextAppt, setNextAppt]           = useState('')
  const [medications, setMedications]     = useState([emptyMed()])
  const [treatments, setTreatments]       = useState([emptyTreat()])
  const [vaccinesApplied, setVaccinesApplied]   = useState([])
  const [dewormingsApplied, setDewormingsApplied] = useState([])
  const [showPreview, setShowPreview]     = useState(false)
  const [sent, setSent]                   = useState(false)

  const pet   = pets.find(p => p.id === selectedPetId)
  const owner = owners.find(o => o.id === pet?.ownerId)
  const hasAllergy = pet?.allergies && !['Ninguna', 'Ninguna conocida', ''].includes(pet.allergies)

  // ── Medicamentos ──────────────────────────────────────
  function updateMed(i, field, val) {
    setMedications(prev => prev.map((m, idx) => {
      if (idx !== i) return m
      const next = { ...m, [field]: val }
      if (field === 'catalogId') {
        const item = availableMeds.find(c => c.id === val)
        if (item) { next.name = item.name; next.unit = item.unit || 'pastilla' }
      }
      return next
    }))
  }

  // ── Tratamientos (desde catálogo, son procedimientos clínicos) ──
  function updateTreat(i, field, val) {
    setTreatments(prev => prev.map((t, idx) => {
      if (idx !== i) return t
      const next = { ...t, [field]: val }
      if (field === 'catalogId') {
        const item = catalog.treatments.find(c => c.id === val)
        if (item) { next.name = item.name; next.description = item.description || '' }
      }
      return next
    }))
  }

  // ── Vacunas ───────────────────────────────────────────
  function updateVax(i, field, val) {
    setVaccinesApplied(prev => prev.map((v, idx) => {
      if (idx !== i) return v
      const next = { ...v, [field]: val }
      if (field === 'catalogId') {
        const item = availableVax.find(c => c.id === val)
        if (item) next.name = item.name
      }
      return next
    }))
  }

  // ── Desparasitantes ───────────────────────────────────
  function updateDew(i, field, val) {
    setDewormingsApplied(prev => prev.map((d, idx) => {
      if (idx !== i) return d
      const next = { ...d, [field]: val }
      if (field === 'catalogId') {
        const item = availableDews.find(c => c.id === val)
        if (item) next.name = item.name
      }
      return next
    }))
  }

  // ── Construir invoice con precios desde inventario (no visibles para doctora) ──
  function buildInvoice() {
    return {
      id: `inv${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      serviceType: 'Consulta Médica',
      diagnosis,
      reason,
      medications: medications.filter(m => m.name).map(m => {
        const invItem = availableMeds.find(c => c.id === m.catalogId)
        const total = calcTotal(m.qtyPerDose, m.frequencyHours, m.durationDays)
        return {
          name: m.name,
          catalogId: m.catalogId,       // inventory item id — used for deduction
          qtyPerDose: m.qtyPerDose,
          frequencyHours: m.frequencyHours,
          frequencyLabel: FREQUENCY_OPTIONS.find(f => f.value === Number(m.frequencyHours))?.label || `Cada ${m.frequencyHours}h`,
          durationDays: m.durationDays,
          instructions: m.instructions,
          unit: m.unit,
          totalQuantity: total,
          price: invItem?.price || 0,   // price from inventory, hidden from vet UI
        }
      }),
      treatments: treatments.filter(t => t.name).map(t => {
        const catItem = catalog.treatments.find(c => c.id === t.catalogId)
        return {
          name: t.name,
          description: t.description,
          quantity: t.quantity,
          frequency: t.frequency,
          duration: t.duration,
          observations: t.observations,
          price: catItem?.price || 0,
        }
      }),
      vaccines: vaccinesApplied.filter(v => v.name).map(v => {
        const invItem = availableVax.find(c => c.id === v.catalogId)
        return { name: v.name, catalogId: v.catalogId, price: invItem?.price || 0 }
      }),
      dewormings: dewormingsApplied.filter(d => d.name).map(d => {
        const invItem = availableDews.find(c => c.id === d.catalogId)
        return { name: d.name, catalogId: d.catalogId, price: invItem?.price || 0 }
      }),
      consultationFee: catalog.consultationFee,
      observations,
      nextAppointment: nextAppt,
    }
  }

  const previewItem = {
    id: `tmp${Date.now()}`,
    type: 'consultation',
    status: 'pending',
    sentAt: new Date().toLocaleString('es-GT'),
    petId: selectedPetId,
    ownerId: pet?.ownerId,
    sentBy: currentUser?.name || 'Dra. Veterinaria',
    invoice: buildInvoice(),
  }

  function handleSend() {
    addInboxItem(previewItem)
    const relatedAppt = appointments.find(a =>
      a.petId === selectedPetId &&
      (a.assignedTo === 'vet' || a.serviceType === 'consultation') &&
      a.status === 'initiated'
    )
    if (relatedAppt) {
      updateAppointmentStatus(relatedAppt.id, 'sent_to_admin', { finishedAt: new Date().toISOString() })
    }
    setSent(true)
    setTimeout(() => navigate('/mi-agenda'), 1800)
  }

  if (pets.length === 0) {
    return (
      <div className="max-w-xl mx-auto text-center py-20">
        <Stethoscope size={48} className="text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Sin mascotas registradas</h2>
        <p className="text-gray-500">Pide a Administración que registre mascotas primero.</p>
      </div>
    )
  }

  if (sent) {
    return (
      <div className="max-w-xl mx-auto text-center py-20">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={40} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Consulta enviada</h2>
        <p className="text-gray-500">La evaluación de <strong>{pet?.name}</strong> fue enviada a Administración.</p>
        <p className="text-xs text-gray-400 mt-2">El historial médico se actualizó automáticamente.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Nueva consulta médica</h2>
          <p className="text-sm text-gray-500">{currentUser?.name} · {new Date().toLocaleDateString('es-GT')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={Eye} onClick={() => setShowPreview(true)}>Previsualizar</Button>
          <Button variant="whatsapp" icon={Send} onClick={handleSend}>Enviar a administración</Button>
        </div>
      </div>

      {/* Paciente */}
      <Card>
        <CardHeader title="Paciente" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Mascota" value={selectedPetId} onChange={e => setSelectedPetId(e.target.value)}>
            {pets.map(p => {
              const o = owners.find(o => o.id === p.ownerId)
              return <option key={p.id} value={p.id}>{p.name} — {o?.name}</option>
            })}
          </Select>
          <Input label="Motivo de consulta" value={reason} onChange={e => setReason(e.target.value)} placeholder="¿Por qué viene?" />
        </div>
        {pet && (
          <div className="mt-3 flex flex-wrap gap-3 text-sm bg-gray-50 rounded-xl p-3">
            <span><span className="text-gray-400">Raza:</span> <strong>{pet.breed}</strong></span>
            <span><span className="text-gray-400">Edad:</span> <strong>{pet.age} años</strong></span>
            <span><span className="text-gray-400">Peso:</span> <strong>{pet.weight} kg</strong></span>
            <span><span className="text-gray-400">Sexo:</span> <strong>{pet.sex}</strong></span>
          </div>
        )}
        {hasAllergy && (
          <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
            <AlertTriangle size={16} className="text-red-600 shrink-0" />
            <p className="text-sm font-bold text-red-700">⚠ Alergia: {pet.allergies}</p>
          </div>
        )}
      </Card>

      {/* Diagnóstico */}
      <Card>
        <CardHeader title="Diagnóstico" />
        <Textarea value={diagnosis} onChange={e => setDiagnosis(e.target.value)} placeholder="Diagnóstico clínico..." rows={3} />
      </Card>

      {/* Medicamentos */}
      <Card>
        <CardHeader
          title="Medicamentos recetados"
          action={<Button size="sm" variant="secondary" icon={Plus} onClick={() => setMedications(p => [...p, emptyMed()])}>Agregar</Button>}
        />
        {availableMeds.length === 0 && (
          <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-3">
            No hay medicamentos en inventario. Contacta a Administración para cargar el Excel.
          </p>
        )}
        <div className="space-y-4">
          {medications.map((med, i) => {
            const calc = med.name && med.qtyPerDose && med.frequencyHours && med.durationDays
              ? calcLabel(med.qtyPerDose, med.frequencyHours, med.durationDays, med.unit)
              : null
            const invItem = availableMeds.find(c => c.id === med.catalogId)
            const needed  = calcTotal(med.qtyPerDose, med.frequencyHours, med.durationDays) || 0

            return (
              <div key={i} className="border border-blue-100 rounded-xl p-4 bg-blue-50/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Pill size={14} className="text-blue-500" /> Medicamento {i + 1}
                  </span>
                  {medications.length > 1 && (
                    <button onClick={() => setMedications(p => p.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 p-1">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Select
                      label="Medicamento (inventario)"
                      value={med.catalogId}
                      onChange={e => updateMed(i, 'catalogId', e.target.value)}
                    >
                      <option value="">— Seleccionar —</option>
                      {availableMeds.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} · Stock: {c.quantity} {c.unit}{c.quantity <= 0 ? ' (Agotado)' : c.quantity <= c.minStock ? ' ⚠' : ''}
                        </option>
                      ))}
                    </Select>
                    {/* Stock indicator — no price shown */}
                    {med.catalogId && invItem && (() => {
                      if (invItem.quantity <= 0)
                        return <p className="mt-1 text-xs text-red-600 font-medium">⚠ Sin stock disponible</p>
                      if (needed > invItem.quantity)
                        return <p className="mt-1 text-xs text-red-600 font-medium">⚠ Stock insuficiente: necesitas {needed}, disponibles {invItem.quantity} {invItem.unit}</p>
                      if (invItem.quantity <= invItem.minStock)
                        return <p className="mt-1 text-xs text-amber-600 font-medium">⚠ Bajo stock: {invItem.quantity} {invItem.unit} disponibles</p>
                      return <p className="mt-1 text-xs text-green-600 font-medium">✓ Disponible: {invItem.quantity} {invItem.unit}</p>
                    })()}
                  </div>

                  <Input
                    label="Cantidad por toma"
                    type="number" min="0.1" step="0.5"
                    value={med.qtyPerDose}
                    onChange={e => updateMed(i, 'qtyPerDose', e.target.value)}
                    placeholder="Ej. 1, 0.5, 2"
                  />

                  <Select
                    label="Frecuencia"
                    value={med.frequencyHours}
                    onChange={e => updateMed(i, 'frequencyHours', e.target.value)}
                  >
                    {FREQUENCY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </Select>

                  <Input
                    label="Duración (días)"
                    type="number" min="1"
                    value={med.durationDays}
                    onChange={e => updateMed(i, 'durationDays', e.target.value)}
                    placeholder="Ej. 7"
                  />
                </div>

                <Input
                  label="Indicaciones adicionales"
                  value={med.instructions}
                  onChange={e => updateMed(i, 'instructions', e.target.value)}
                  placeholder="Ej. Administrar después de comida"
                />

                {calc && (
                  <div className="flex items-start gap-2 bg-blue-100 border border-blue-200 rounded-xl px-4 py-3">
                    <Calculator size={16} className="text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-blue-600 font-medium">{calc.formula}</p>
                      <p className="text-sm font-bold text-blue-800 mt-0.5">
                        Cantidad total: <strong>{calc.total} {med.unit}</strong>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Tratamientos */}
      <Card>
        <CardHeader
          title="Tratamientos aplicados"
          action={<Button size="sm" variant="secondary" icon={Plus} onClick={() => setTreatments(p => [...p, emptyTreat()])}>Agregar</Button>}
        />
        <div className="space-y-4">
          {treatments.map((t, i) => (
            <div key={i} className="border border-green-100 rounded-xl p-4 bg-green-50/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Stethoscope size={14} className="text-green-500" /> Tratamiento {i + 1}
                </span>
                {treatments.length > 1 && (
                  <button onClick={() => setTreatments(p => p.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={14} /></button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select label="Tratamiento" value={t.catalogId} onChange={e => updateTreat(i, 'catalogId', e.target.value)}>
                  <option value="">— Seleccionar —</option>
                  {catalog.treatments.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
                <Input label="Cantidad" type="number" min="1" value={t.quantity} onChange={e => updateTreat(i, 'quantity', e.target.value)} />
                <Input label="Frecuencia (si aplica)" value={t.frequency} onChange={e => updateTreat(i, 'frequency', e.target.value)} placeholder="Ej. Diario" />
                <Input label="Duración (si aplica)" value={t.duration} onChange={e => updateTreat(i, 'duration', e.target.value)} placeholder="Ej. 5 días" />
              </div>
              <Textarea label="Observaciones" value={t.observations} onChange={e => updateTreat(i, 'observations', e.target.value)} rows={2} />
            </div>
          ))}
        </div>
      </Card>

      {/* Vacunas y Desparasitantes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Vacunas aplicadas" action={<Button size="sm" variant="secondary" icon={Plus} onClick={() => setVaccinesApplied(p => [...p, emptyVax()])}>+</Button>} />
          {availableVax.length === 0 && (
            <p className="text-xs text-amber-500 mb-2">Sin vacunas en inventario</p>
          )}
          {vaccinesApplied.length === 0
            ? <p className="text-xs text-gray-400 text-center py-3">Ninguna</p>
            : vaccinesApplied.map((v, i) => {
              const invV = availableVax.find(c => c.id === v.catalogId)
              return (
                <div key={i} className="mb-2 space-y-1">
                  <div className="flex gap-2">
                    <Select value={v.catalogId} onChange={e => updateVax(i, 'catalogId', e.target.value)} className="flex-1">
                      <option value="">— Seleccionar —</option>
                      {availableVax.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} · Stock: {c.quantity}{c.quantity <= 0 ? ' (Agotado)' : ''}
                        </option>
                      ))}
                    </Select>
                    <button onClick={() => setVaccinesApplied(p => p.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={14} /></button>
                  </div>
                  {v.catalogId && invV && invV.quantity <= 0 && (
                    <p className="text-xs text-red-600">⚠ Sin stock</p>
                  )}
                </div>
              )
            })
          }
        </Card>

        <Card>
          <CardHeader title="Desparasitantes" action={<Button size="sm" variant="secondary" icon={Plus} onClick={() => setDewormingsApplied(p => [...p, emptyDew()])}>+</Button>} />
          {availableDews.length === 0 && (
            <p className="text-xs text-amber-500 mb-2">Sin desparasitantes en inventario</p>
          )}
          {dewormingsApplied.length === 0
            ? <p className="text-xs text-gray-400 text-center py-3">Ninguno</p>
            : dewormingsApplied.map((d, i) => {
              const invD = availableDews.find(c => c.id === d.catalogId)
              return (
                <div key={i} className="mb-2 space-y-1">
                  <div className="flex gap-2">
                    <Select value={d.catalogId} onChange={e => updateDew(i, 'catalogId', e.target.value)} className="flex-1">
                      <option value="">— Seleccionar —</option>
                      {availableDews.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} · Stock: {c.quantity}{c.quantity <= 0 ? ' (Agotado)' : ''}
                        </option>
                      ))}
                    </Select>
                    <button onClick={() => setDewormingsApplied(p => p.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={14} /></button>
                  </div>
                  {d.catalogId && invD && invD.quantity <= 0 && (
                    <p className="text-xs text-red-600">⚠ Sin stock</p>
                  )}
                </div>
              )
            })
          }
        </Card>
      </div>

      {/* Observaciones y próxima cita */}
      <Card>
        <CardHeader title="Cierre de consulta" />
        <div className="space-y-4">
          <Textarea label="Observaciones y recomendaciones" value={observations} onChange={e => setObservations(e.target.value)} rows={3} placeholder="Recomendaciones al dueño, seguimiento..." />
          <Input label="Próxima cita recomendada" type="date" value={nextAppt} onChange={e => setNextAppt(e.target.value)} />
        </div>
      </Card>

      <div className="flex gap-3 justify-end pb-6">
        <Button variant="secondary" icon={Eye} onClick={() => setShowPreview(true)}>Previsualizar factura</Button>
        <Button variant="whatsapp" icon={Send} onClick={handleSend}>Enviar a administración</Button>
      </div>

      <Modal isOpen={showPreview} onClose={() => setShowPreview(false)} title="Previsualización de factura" size="xl">
        <InvoicePreview item={previewItem} pet={pet} owner={owner} showPayButton={false} />
      </Modal>
    </div>
  )
}
