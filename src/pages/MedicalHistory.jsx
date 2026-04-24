import { useState } from 'react'
import { Plus, Search, Paperclip, Calendar, ChevronDown, ChevronUp, Pill, Syringe, Stethoscope, DollarSign } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input, { Select, Textarea } from '../components/ui/Input'

// ── Helpers ──────────────────────────────────────────────────────────────────
function isStructured(record) {
  return record.autoCreated === true || Array.isArray(record.medicationsList)
}

function RecordCard({ record, pets, owners }) {
  const [expanded, setExpanded] = useState(false)
  const pet   = pets.find(p => p.id === record.petId)
  const owner = owners.find(o => o.id === pet?.ownerId)
  const structured = isStructured(record)

  // Structured meds text (for collapsed summary)
  const medsText = structured
    ? (record.medicationsList?.length
        ? record.medicationsList.map(m => `${m.name}${m.totalQuantity ? ` (${m.totalQuantity} ${m.unit || ''})` : ''}`).join(', ')
        : 'Ninguno')
    : (record.medications || '—')

  const treatText = structured
    ? (record.treatmentsList?.length
        ? record.treatmentsList.map(t => t.name).join(', ')
        : record.treatment || 'Ninguno')
    : (record.treatment || '—')

  const billingBadge = record.billingStatus === 'paid'
    ? { label: '✓ Cobrado', variant: 'green' }
    : record.billingStatus === 'pending'
    ? { label: '⏳ Por cobrar', variant: 'yellow' }
    : null

  return (
    <Card padding={false}>
      <div className="p-5">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-blue-700">{pet?.name?.[0]}</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {pet?.name} <span className="text-gray-400 font-normal">·</span>{' '}
                <span className="font-normal text-gray-600">{record.reason || 'Consulta médica'}</span>
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-500">{owner?.name} · {record.vet || record.doctor}</span>
                {record.autoCreated && <Badge variant="blue">Automático</Badge>}
                {billingBadge && <Badge variant={billingBadge.variant}>{billingBadge.label}</Badge>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-200">
              <Calendar size={12} />
              {record.date}
            </div>
            <button
              onClick={() => setExpanded(v => !v)}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {/* Summary boxes */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Diagnóstico</p>
            <p className="text-sm text-gray-800">{record.diagnosis || '—'}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">Tratamiento</p>
            <p className="text-sm text-gray-800">{treatText}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">Medicamentos</p>
            <p className="text-sm text-gray-800">{medsText}</p>
          </div>
        </div>

        {/* Expanded detail */}
        {expanded && (
          <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">

            {/* Structured: medications list */}
            {structured && record.medicationsList?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Pill size={12} /> Medicamentos recetados
                </p>
                <div className="space-y-2">
                  {record.medicationsList.map((m, i) => (
                    <div key={i} className="bg-blue-50 rounded-lg px-3 py-2">
                      <p className="text-sm font-medium text-gray-800">{m.name}</p>
                      {m.qtyPerDose && m.frequencyHours && m.durationDays && (
                        <p className="text-xs text-gray-500">
                          {m.qtyPerDose} {m.unit} · {m.frequencyLabel || `Cada ${m.frequencyHours}h`} · {m.durationDays} días
                          {m.totalQuantity ? ` → Total: ${m.totalQuantity} ${m.unit}` : ''}
                        </p>
                      )}
                      {m.instructions && <p className="text-xs text-blue-600 italic mt-0.5">{m.instructions}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Structured: treatments */}
            {structured && record.treatmentsList?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Stethoscope size={12} /> Tratamientos aplicados
                </p>
                <div className="space-y-1">
                  {record.treatmentsList.map((t, i) => (
                    <div key={i} className="bg-green-50 rounded-lg px-3 py-2">
                      <p className="text-sm font-medium text-gray-800">{t.name}</p>
                      {t.description && <p className="text-xs text-gray-500">{t.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Structured: vaccines */}
            {structured && record.vaccinesList?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Syringe size={12} /> Vacunas aplicadas
                </p>
                <div className="flex flex-wrap gap-2">
                  {record.vaccinesList.map((v, i) => (
                    <Badge key={i} variant="yellow">{v.name}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Structured: dewormings */}
            {structured && record.dewormingsList?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Desparasitantes</p>
                <div className="flex flex-wrap gap-2">
                  {record.dewormingsList.map((d, i) => (
                    <Badge key={i} variant="green">{d.name}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Observations */}
            {record.observations && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Observaciones</p>
                <p className="text-sm text-gray-700">{record.observations}</p>
              </div>
            )}

            {/* Billing & next appointment */}
            <div className="flex flex-wrap gap-4">
              {record.nextAppointment && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={14} className="text-blue-500" />
                  <span className="text-gray-600">Próxima cita: <strong className="text-gray-900">{record.nextAppointment}</strong></span>
                </div>
              )}
              {billingBadge && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign size={14} className="text-gray-400" />
                  <span className="text-gray-600">Facturación: <Badge variant={billingBadge.variant}>{billingBadge.label}</Badge></span>
                </div>
              )}
              {record.attachments?.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Paperclip size={14} className="text-gray-400" />
                  <span className="text-gray-600">{record.attachments.length} archivo(s)</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MedicalHistory() {
  const { pets, owners, medicalRecords, addMedicalRecord } = useApp()
  const [search, setSearch]       = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedPet, setSelectedPet] = useState('all')

  const filtered = medicalRecords.filter(r => {
    const pet = pets.find(p => p.id === r.petId)
    const matchesSearch = search === '' ||
      pet?.name.toLowerCase().includes(search.toLowerCase()) ||
      r.reason?.toLowerCase().includes(search.toLowerCase()) ||
      r.diagnosis?.toLowerCase().includes(search.toLowerCase())
    const matchesPet = selectedPet === 'all' || r.petId === selectedPet
    return matchesSearch && matchesPet
  }).slice().reverse()   // most recent first

  const autoCount = medicalRecords.filter(r => r.autoCreated).length

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Historial Médico</h2>
          <p className="text-sm text-gray-500">
            {medicalRecords.length} consultas registradas
            {autoCount > 0 && <span className="ml-2 text-blue-500">· {autoCount} generadas automáticamente</span>}
          </p>
        </div>
        <Button icon={Plus} onClick={() => setShowModal(true)}>Registrar consulta</Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por mascota, motivo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={selectedPet}
          onChange={e => setSelectedPet(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">Todas las mascotas</option>
          {pets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* Lista */}
      <div className="space-y-4">
        {filtered.map(r => <RecordCard key={r.id} record={r} pets={pets} owners={owners} />)}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            No se encontraron registros médicos
          </div>
        )}
      </div>

      {/* Modal nueva consulta manual */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Registrar consulta médica" size="xl">
        <MedicalForm onClose={() => setShowModal(false)} pets={pets} addMedicalRecord={addMedicalRecord} />
      </Modal>
    </div>
  )
}

function MedicalForm({ onClose, pets, addMedicalRecord }) {
  function handleSubmit(e) {
    e.preventDefault()
    const fd = new FormData(e.target)
    addMedicalRecord({
      petId:           fd.get('petId'),
      date:            fd.get('date'),
      vet:             fd.get('vet'),
      reason:          fd.get('reason'),
      diagnosis:       fd.get('diagnosis'),
      treatment:       fd.get('treatment'),
      medications:     fd.get('medications'),
      observations:    fd.get('observations'),
      nextAppointment: fd.get('nextAppointment'),
    })
    onClose()
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select label="Mascota" name="petId" required>
          {pets.map(p => <option key={p.id} value={p.id}>{p.name} ({p.breed})</option>)}
        </Select>
        <Input label="Fecha de consulta" name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
        <Input label="Veterinario" name="vet" placeholder="Nombre del veterinario" className="sm:col-span-2" />
      </div>
      <Input label="Motivo de consulta" name="reason" placeholder="¿Por qué viene el paciente?" required />
      <Textarea label="Diagnóstico" name="diagnosis" placeholder="Diagnóstico clínico..." rows={2} />
      <Textarea label="Tratamiento aplicado" name="treatment" placeholder="Procedimientos realizados..." rows={2} />
      <Textarea label="Medicamentos recetados" name="medications" placeholder="Nombre, dosis, frecuencia y duración..." rows={2} />
      <Textarea label="Observaciones del veterinario" name="observations" placeholder="Notas adicionales..." rows={2} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Próxima cita" name="nextAppointment" type="date" />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Adjuntar archivos</label>
          <input type="file" multiple accept="image/*,.pdf"
            className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
          />
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
        <Button type="submit" icon={Plus}>Guardar consulta</Button>
      </div>
    </form>
  )
}
