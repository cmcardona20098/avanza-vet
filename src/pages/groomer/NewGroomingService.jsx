import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, Eye, Scissors, AlertTriangle, CheckCircle } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import Card, { CardHeader } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Select, Textarea } from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import InvoicePreview from '../../components/billing/InvoicePreview'
import GroomingTimer from '../../components/groomer/GroomingTimer'

export default function NewGroomingService() {
  const navigate = useNavigate()
  const { pets, owners, catalog, addInboxItem, updateAppointmentStatus, appointments, currentUser } = useApp()

  const [selectedPetId, setSelectedPetId] = useState(pets[0]?.id || '')
  const [selectedServices, setSelectedServices] = useState([]) // array of catalogId strings
  const [products, setProducts] = useState('')
  const [observations, setObservations] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [sent, setSent] = useState(false)
  const [timerData, setTimerData] = useState(null)

  const pet   = pets.find(p => p.id === selectedPetId)
  const owner = owners.find(o => o.id === pet?.ownerId)
  const hasAllergy = pet?.allergies && !['Ninguna', 'Ninguna conocida', ''].includes(pet.allergies)

  function toggleService(catalogId) {
    setSelectedServices(prev =>
      prev.includes(catalogId)
        ? prev.filter(id => id !== catalogId)
        : [...prev, catalogId]
    )
  }

  const selectedCatalogItems = catalog.groomingServices.filter(c => selectedServices.includes(c.id))
  const total = selectedCatalogItems.reduce((s, c) => s + Number(c.price || 0), 0)

  function buildInvoice() {
    return {
      id: `ginv${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      serviceType: 'Grooming',
      groomingServices: selectedCatalogItems.map(c => ({ name: c.name, price: Number(c.price) || 0 })),
      products,
      observations,
      consultationFee: 0,
      timerData: timerData ? {
        startDisplay: new Date(timerData.startTime).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' }),
        endDisplay:   new Date(timerData.endTime).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' }),
        durationDisplay: timerData.durationDisplay,
        durationMinutes: timerData.durationMinutes,
        groomer: currentUser?.name,
      } : null,
    }
  }

  const previewItem = {
    id:       `gtmp${Date.now()}`,
    type:     'grooming',
    status:   'pending',
    sentAt:   new Date().toLocaleString('es-GT'),
    petId:    selectedPetId,
    ownerId:  pet?.ownerId,
    sentBy:   currentUser?.name || 'Groomista',
    invoice:  buildInvoice(),
  }

  function handleSend() {
    addInboxItem({ ...previewItem, invoice: buildInvoice() })
    // Mark the related initiated appointment as sent_to_admin
    const relatedAppt = appointments.find(a =>
      a.petId === selectedPetId &&
      (a.assignedTo === 'groomer' || a.serviceType === 'grooming') &&
      a.status === 'initiated'
    )
    if (relatedAppt) {
      updateAppointmentStatus(relatedAppt.id, 'sent_to_admin', {
        finishedAt: new Date().toISOString(),
      })
    }
    setSent(true)
    setTimeout(() => navigate('/mi-agenda'), 1800)
  }

  if (pets.length === 0) {
    return (
      <div className="max-w-xl mx-auto text-center py-20">
        <Scissors size={48} className="text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Sin mascotas registradas</h2>
        <p className="text-gray-500">Pide a Administración que registre mascotas primero.</p>
      </div>
    )
  }

  if (sent) {
    return (
      <div className="max-w-xl mx-auto text-center py-20">
        <div className="w-20 h-20 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={40} className="text-violet-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Grooming enviado</h2>
        <p className="text-gray-500">El servicio de <strong>{pet?.name}</strong> fue enviado a Administración.</p>
        {timerData && (
          <p className="text-sm text-gray-400 mt-2">Duración del servicio: {timerData.durationDisplay}</p>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Registrar grooming</h2>
          <p className="text-sm text-gray-500">{currentUser?.name} · {new Date().toLocaleDateString('es-GT')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={Eye} onClick={() => setShowPreview(true)}>Previsualizar</Button>
          <Button className="bg-violet-600 hover:bg-violet-700 text-white" icon={Send} onClick={handleSend}
            disabled={selectedServices.length === 0}>
            Enviar a administración
          </Button>
        </div>
      </div>

      {/* Cronómetro */}
      <GroomingTimer
        onStart={(startTime) => setTimerData({ startTime })}
        onStop={(data) => setTimerData(data)}
      />

      {/* Mascota */}
      <Card>
        <CardHeader title="Mascota" />
        <Select label="Seleccionar mascota" value={selectedPetId} onChange={e => setSelectedPetId(e.target.value)}>
          {pets.map(p => {
            const o = owners.find(ow => ow.id === p.ownerId)
            return <option key={p.id} value={p.id}>{p.name} — {o?.name}</option>
          })}
        </Select>
        {pet && (
          <div className="mt-3 flex flex-wrap gap-3 text-sm bg-gray-50 rounded-xl p-3">
            {pet.breed  && <span><span className="text-gray-400">Raza:</span> <strong>{pet.breed}</strong></span>}
            {pet.age    && <span><span className="text-gray-400">Edad:</span> <strong>{pet.age} años</strong></span>}
            {pet.weight && <span><span className="text-gray-400">Peso:</span> <strong>{pet.weight} kg</strong></span>}
          </div>
        )}
        {hasAllergy && (
          <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
            <AlertTriangle size={16} className="text-red-600 shrink-0" />
            <p className="text-sm font-bold text-red-700">⚠ Alergia: {pet.allergies}</p>
          </div>
        )}
      </Card>

      {/* Servicios — botones chip */}
      <Card>
        <CardHeader
          title="Servicios realizados"
          subtitle={selectedServices.length > 0 ? `${selectedServices.length} seleccionado(s)` : 'Selecciona uno o más servicios'}
        />
        <div className="flex flex-wrap gap-2">
          {catalog.groomingServices.map(c => {
            const isSelected = selectedServices.includes(c.id)
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleService(c.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${
                  isSelected
                    ? 'border-violet-500 bg-violet-100 text-violet-800'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-violet-300 hover:bg-violet-50'
                }`}
              >
                {isSelected && <span className="w-4 h-4 bg-violet-500 rounded-full flex items-center justify-center text-white text-xs">✓</span>}
                {c.name}
              </button>
            )
          })}
        </div>
        {selectedServices.length === 0 && (
          <p className="mt-3 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Selecciona al menos un servicio para poder enviar a administración.
          </p>
        )}
        <p className="mt-3 text-xs text-gray-400">Los precios los gestiona Administración.</p>
      </Card>

      {/* Productos y observaciones */}
      <Card>
        <CardHeader title="Detalle del servicio" />
        <div className="space-y-4">
          <Textarea label="Productos utilizados" value={products} onChange={e => setProducts(e.target.value)} placeholder="Ej. Shampoo hipoalergénico, acondicionador..." rows={2} />
          <Textarea label="Observaciones" value={observations} onChange={e => setObservations(e.target.value)} placeholder="Estado de la mascota, comportamiento, recomendaciones..." rows={3} />
        </div>
      </Card>

      {/* Métricas del timer */}
      {timerData?.durationDisplay && (
        <Card>
          <CardHeader title="Métricas del servicio" />
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: 'Groomista', value: currentUser?.name || 'Groomista' },
              { label: 'Mascota',   value: pet?.name || '—' },
              { label: 'Duración',  value: timerData.durationDisplay },
            ].map(({ label, value }) => (
              <div key={label} className="bg-violet-50 rounded-xl p-3">
                <p className="text-xs text-violet-500 font-medium">{label}</p>
                <p className="text-sm font-bold text-violet-900 mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="flex gap-3 justify-end pb-6">
        <Button variant="secondary" icon={Eye} onClick={() => setShowPreview(true)}>Previsualizar factura</Button>
        <Button className="bg-violet-600 hover:bg-violet-700 text-white" icon={Send} onClick={handleSend}
          disabled={selectedServices.length === 0}>
          Enviar a administración
        </Button>
      </div>

      <Modal isOpen={showPreview} onClose={() => setShowPreview(false)} title="Previsualización" size="lg">
        <InvoicePreview item={{ ...previewItem, invoice: buildInvoice() }} pet={pet} owner={owner} showPayButton={false} />
      </Modal>
    </div>
  )
}
