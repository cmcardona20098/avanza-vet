import { useState } from 'react'
import { Plus, Clock, User, PawPrint, CalendarDays } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input, { Select, Textarea } from '../components/ui/Input'

const statusConfig = {
  scheduled:  { label: 'Agendada',   variant: 'blue'  },
  confirmed:  { label: 'Confirmada', variant: 'blue'  },
  completed:  { label: 'Completada', variant: 'green' },
  cancelled:  { label: 'Cancelada',  variant: 'red'   },
  no_show:    { label: 'No asistió', variant: 'gray'  },
}

const vets = ['Dra. Sofía Ramírez', 'Dr. Pablo Torres']

export default function Appointments() {
  const { appointments, pets, owners, addAppointment } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all' ? appointments : appointments.filter(a => a.status === filter)

  const grouped = filtered.reduce((acc, a) => {
    const d = a.date
    if (!acc[d]) acc[d] = []
    acc[d].push(a)
    return acc
  }, {})

  function handleSubmit(e) {
    e.preventDefault()
    const fd = new FormData(e.target)
    const petId = fd.get('petId')
    const pet = pets.find(p => p.id === petId)
    addAppointment({
      petId,
      ownerId: pet?.ownerId,
      date:   fd.get('date'),
      time:   fd.get('time'),
      reason: fd.get('reason'),
      vet:    fd.get('vet'),
      notes:  fd.get('notes'),
    })
    setShowModal(false)
    e.target.reset()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Citas</h2>
          <p className="text-sm text-gray-500">{appointments.length} citas programadas</p>
        </div>
        <Button icon={Plus} onClick={() => setShowModal(true)}>Nueva cita</Button>
      </div>

      {/* Filtros por estado */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all',       label: 'Todas',     count: appointments.length },
          { key: 'scheduled', label: 'Agendadas', count: appointments.filter(a => a.status === 'scheduled' || a.status === 'confirmed').length },
          { key: 'completed', label: 'Completadas' },
          { key: 'cancelled', label: 'Canceladas' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f.key
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {f.label}
            {f.count !== undefined && (
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${filter === f.key ? 'bg-primary-500' : 'bg-gray-100 text-gray-600'}`}>
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Citas agrupadas por día */}
      {Object.entries(grouped).sort().map(([date, dayAppts]) => (
        <div key={date}>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <CalendarDays size={16} className="text-primary-500" />
              {date}
            </div>
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">{dayAppts.length} cita(s)</span>
          </div>

          <div className="space-y-3">
            {dayAppts.map(appt => {
              const pet = pets.find(p => p.id === appt.petId)
              const owner = owners.find(o => o.id === appt.ownerId)
              const st = statusConfig[appt.status] || statusConfig.scheduled

              return (
                <Card key={appt.id} padding={false}>
                  <div className="p-4 flex flex-col sm:flex-row gap-4 items-start">
                    {/* Hora */}
                    <div className="flex items-center gap-2 sm:flex-col sm:items-center sm:w-16 shrink-0">
                      <Clock size={14} className="text-primary-400 sm:hidden" />
                      <div className="sm:text-center">
                        <p className="text-base font-bold text-primary-700">{appt.time}</p>
                        <p className="text-xs text-gray-400 hidden sm:block">{appt.date}</p>
                      </div>
                    </div>

                    <div className="w-px bg-gray-100 hidden sm:block self-stretch" />

                    {/* Info */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="flex items-center gap-2">
                        <PawPrint size={14} className="text-primary-400 shrink-0" />
                        <div>
                          <p className="text-xs text-gray-400">Mascota</p>
                          <p className="text-sm font-semibold text-gray-900">{pet?.name}</p>
                          <p className="text-xs text-gray-500">{pet?.breed}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-400 shrink-0" />
                        <div>
                          <p className="text-xs text-gray-400">Dueño</p>
                          <p className="text-sm font-medium text-gray-800">{owner?.name}</p>
                          <p className="text-xs text-gray-500">{owner?.phone}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Motivo</p>
                        <p className="text-sm text-gray-800">{appt.reason}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{appt.vet}</p>
                      </div>
                    </div>

                    {/* Estado */}
                    <div className="flex items-center gap-2">
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </div>
                  </div>
                  {appt.notes && (
                    <div className="px-4 pb-3 border-t border-gray-50 pt-2">
                      <p className="text-xs text-gray-500 italic">{appt.notes}</p>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <CalendarDays size={40} className="text-gray-300 mx-auto mb-3" />
          <p>No hay citas con este filtro</p>
        </div>
      )}

      {/* Modal nueva cita */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Agendar nueva cita">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Select label="Mascota" name="petId" required>
            <option value="">— Seleccionar —</option>
            {pets.map(p => {
              const o = owners.find(ow => ow.id === p.ownerId)
              return <option key={p.id} value={p.id}>{p.name} — {o?.name}</option>
            })}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Fecha" name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
            <Input label="Hora" name="time" type="time" required defaultValue="10:00" />
          </div>
          <Input label="Motivo de la cita" name="reason" placeholder="Motivo de la consulta" required />
          <Select label="Veterinario" name="vet">
            {vets.map(v => <option key={v}>{v}</option>)}
          </Select>
          <Textarea label="Notas adicionales" name="notes" placeholder="Instrucciones al dueño, preparación especial..." />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit" icon={Plus}>Agendar cita</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
