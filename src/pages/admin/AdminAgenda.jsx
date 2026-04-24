import { useState } from 'react'
import { Plus, Stethoscope, Scissors, CalendarDays, Clock, User, PawPrint } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import Card, { CardHeader } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input, { Select, Textarea } from '../../components/ui/Input'

const statusColors = { confirmed: 'blue', pending: 'yellow', cancelled: 'red', completed: 'green' }
const statusLabels = { confirmed: 'Confirmada', pending: 'Pendiente', cancelled: 'Cancelada', completed: 'Completada' }

export default function AdminAgenda() {
  const { appointments, addAppointment, updateAppointmentStatus, pets, owners, users } = useApp()
  function getPet(id)    { return pets.find(p => p.id === id) }
  function getOwner(id)  { return owners.find(o => o.id === id) }
  function getUserName(a) {
    if (a.vetId) return users.find(u => u.id === a.vetId)?.name || a.vet || '—'
    return a.vet || '—'
  }
  const [showModal, setShowModal] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const [filterDate, setFilterDate] = useState('')

  const filtered = appointments.filter(a => {
    const matchType = filterType === 'all' || a.serviceType === filterType || a.assignedTo === filterType
    const matchDate = !filterDate || a.date === filterDate
    return matchType && matchDate
  }).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))

  const grouped = filtered.reduce((acc, a) => {
    if (!acc[a.date]) acc[a.date] = []
    acc[a.date].push(a)
    return acc
  }, {})

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Agenda General</h2>
          <p className="text-sm text-gray-500">{appointments.length} citas programadas</p>
        </div>
        <Button icon={Plus} onClick={() => setShowModal(true)}>Agendar cita</Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-2">
          {[
            { key: 'all',          label: 'Todas' },
            { key: 'consultation', label: '🩺 Consultas' },
            { key: 'grooming',     label: '✂️ Grooming' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilterType(f.key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filterType === f.key ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          type="date"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        {filterDate && (
          <button onClick={() => setFilterDate('')} className="text-xs text-gray-500 hover:text-gray-800">Limpiar fecha</button>
        )}
      </div>

      {/* Citas agrupadas */}
      {Object.entries(grouped).map(([date, dayAppts]) => (
        <div key={date}>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-2">
              <CalendarDays size={16} className="text-primary-500" />
              <span className="text-sm font-bold text-gray-700">{date}</span>
            </div>
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">{dayAppts.length} cita(s)</span>
          </div>

          <div className="space-y-2">
            {dayAppts.map(a => {
              const pet = getPet(a.petId)
              const owner = getOwner(a.ownerId)
              const isConsultation = a.serviceType === 'consultation'

              return (
                <Card key={a.id} padding={false}>
                  <div className="p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isConsultation ? 'bg-blue-100' : 'bg-violet-100'}`}>
                      {isConsultation
                        ? <Stethoscope size={18} className="text-blue-600" />
                        : <Scissors size={18} className="text-violet-600" />
                      }
                    </div>

                    <div className="flex items-center gap-1.5 text-sm font-bold shrink-0">
                      <Clock size={13} className="text-gray-400" />
                      <span className={isConsultation ? 'text-blue-700' : 'text-violet-700'}>{a.time}</span>
                    </div>

                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="flex items-center gap-2">
                        <PawPrint size={13} className="text-gray-400 shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{pet?.name}</p>
                          <p className="text-xs text-gray-500">{pet?.breed}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <User size={13} className="text-gray-400 shrink-0" />
                        <div>
                          <p className="text-sm text-gray-800">{owner?.name}</p>
                          <p className="text-xs text-gray-500">{owner?.phone}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 truncate">{a.reason}</p>
                        <p className="text-xs text-gray-400">{getUserName(a)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={statusColors[a.status]}>{statusLabels[a.status]}</Badge>
                      {a.status === 'confirmed' && (
                        <button
                          onClick={() => updateAppointmentStatus(a.id, 'cancelled')}
                          className="text-xs text-red-500 hover:text-red-700 hover:underline"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <CalendarDays size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">No hay citas con estos filtros</p>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Agendar nueva cita" size="lg">
        <NewAppointmentForm onClose={() => setShowModal(false)} onSave={addAppointment} pets={pets} owners={owners} />
      </Modal>
    </div>
  )
}

function NewAppointmentForm({ onClose, onSave, pets, owners }) {
  const { users } = useApp()
  const [serviceType, setServiceType] = useState('consultation')

  const vetUser     = users.find(u => u.role === 'vet')
  const groomerUser = users.find(u => u.role === 'groomer')
  const assignedUser = serviceType === 'consultation' ? vetUser : groomerUser

  function handleSubmit(e) {
    e.preventDefault()
    const fd = new FormData(e.target)
    const petId = fd.get('petId')
    const pet = pets.find(p => p.id === petId)
    onSave({
      petId,
      ownerId: pet?.ownerId,
      date: fd.get('date'),
      time: fd.get('time'),
      serviceType,
      reason: fd.get('reason'),
      assignedTo: serviceType === 'consultation' ? 'vet' : 'groomer',
      vetId: assignedUser?.id,           // ID para resolución dinámica
      vet:   assignedUser?.name || '—',  // nombre como fallback
    })
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Tipo de servicio */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">Tipo de servicio</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setServiceType('consultation')}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
              serviceType === 'consultation'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
              <Stethoscope size={20} className="text-blue-600" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm text-gray-900">Consulta médica</p>
              <p className="text-xs text-gray-500">{vetUser?.name || 'Doctora Vet.'}</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setServiceType('grooming')}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
              serviceType === 'grooming'
                ? 'border-violet-500 bg-violet-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
              <Scissors size={20} className="text-violet-600" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm text-gray-900">Grooming</p>
              <p className="text-xs text-gray-500">{groomerUser?.name || 'Groomista'}</p>
            </div>
          </button>
        </div>
      </div>

      <Select label="Mascota" name="petId" required>
        <option value="">— Seleccionar mascota —</option>
        {pets.map(p => {
          const o = owners.find(ow => ow.id === p.ownerId)
          return <option key={p.id} value={p.id}>{p.name} — {o?.name}</option>
        })}
      </Select>

      <div className="grid grid-cols-2 gap-3">
        <Input label="Fecha" name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
        <Input label="Hora" name="time" type="time" required defaultValue="10:00" />
      </div>

      <Input label="Motivo de la cita" name="reason" placeholder="Describe el motivo..." required />

      <div className={`p-3 rounded-xl text-sm ${serviceType === 'consultation' ? 'bg-blue-50 text-blue-800' : 'bg-violet-50 text-violet-800'}`}>
        Esta cita aparecerá en la agenda de <strong>{assignedUser?.name || (serviceType === 'consultation' ? 'Doctora' : 'Groomista')}</strong>
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
        <Button type="submit" icon={Plus}>Confirmar cita</Button>
      </div>
    </form>
  )
}
