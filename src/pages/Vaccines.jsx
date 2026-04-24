import { useState } from 'react'
import { Plus, Syringe, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input, { Select } from '../components/ui/Input'

const statusConfig = {
  current:  { label: 'Al día',   variant: 'green',  icon: CheckCircle,   iconColor: 'text-green-500' },
  due_soon: { label: 'Pronto',   variant: 'yellow', icon: Clock,         iconColor: 'text-yellow-500' },
  overdue:  { label: 'Vencida',  variant: 'red',    icon: AlertTriangle, iconColor: 'text-red-500' },
}

function VaccineRow({ v, type = 'vaccine', pets }) {
  const pet = pets.find(p => p.id === v.petId)
  const st = statusConfig[v.status] || statusConfig.current
  const StatusIcon = st.icon

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-primary-700">{pet?.name?.[0]}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{pet?.name}</p>
            <p className="text-xs text-gray-500">{pet?.breed}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-700">{type === 'vaccine' ? v.name : v.product}</td>
      {type === 'vaccine' && <td className="px-4 py-3 text-xs text-gray-500">{v.brand}</td>}
      <td className="px-4 py-3 text-xs text-gray-600">{v.appliedDate}</td>
      <td className="px-4 py-3 text-xs font-medium text-gray-900">{v.nextDueDate}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <StatusIcon size={14} className={st.iconColor} />
          <Badge variant={st.variant}>{st.label}</Badge>
        </div>
      </td>
      <td className="px-4 py-3 text-xs text-gray-500">{v.vet}</td>
    </tr>
  )
}

export default function Vaccines() {
  const { pets, vaccineRecords, dewormingRecords, addVaccineRecord, addDewormingRecord } = useApp()
  const [tab, setTab] = useState('vaccines')
  const [showModal, setShowModal] = useState(false)

  const overdueVaccines = vaccineRecords.filter(v => v.status === 'overdue')
  const dueSoon = vaccineRecords.filter(v => v.status === 'due_soon')
  const overdueDew = dewormingRecords.filter(d => d.status === 'overdue')

  function handleSubmit(e) {
    e.preventDefault()
    const fd = new FormData(e.target)
    if (tab === 'vaccines') {
      addVaccineRecord({
        petId:       fd.get('petId'),
        name:        fd.get('name'),
        brand:       fd.get('brand'),
        lot:         fd.get('lot'),
        appliedDate: fd.get('appliedDate'),
        nextDueDate: fd.get('nextDueDate'),
        vet:         fd.get('vet'),
        status:      'current',
      })
    } else {
      addDewormingRecord({
        petId:       fd.get('petId'),
        product:     fd.get('product'),
        type:        fd.get('type'),
        appliedDate: fd.get('appliedDate'),
        nextDueDate: fd.get('nextDueDate'),
        vet:         fd.get('vet'),
        status:      'current',
      })
    }
    setShowModal(false)
    e.target.reset()
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Control Preventivo</h2>
          <p className="text-sm text-gray-500">Vacunas y desparasitantes de todos los pacientes</p>
        </div>
        <Button icon={Plus} onClick={() => setShowModal(true)}>
          {tab === 'vaccines' ? 'Registrar vacuna' : 'Registrar desparasitante'}
        </Button>
      </div>

      {/* Alertas */}
      {(overdueVaccines.length > 0 || overdueDew.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {overdueVaccines.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle size={18} className="text-red-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-800">{overdueVaccines.length} vacuna(s) vencida(s)</p>
                <ul className="mt-1 space-y-0.5">
                  {overdueVaccines.map(v => (
                    <li key={v.id} className="text-xs text-red-600">{pets.find(p => p.id === v.petId)?.name} — {v.name} (vence {v.nextDueDate})</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          {overdueDew.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle size={18} className="text-orange-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-orange-800">{overdueDew.length} desparasitante(s) vencido(s)</p>
                {overdueDew.map(d => (
                  <p key={d.id} className="text-xs text-orange-600">{pets.find(p => p.id === d.petId)?.name} — {d.product}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Al día',  value: vaccineRecords.filter(v => v.status === 'current').length,   color: 'bg-green-50 border-green-200 text-green-700' },
          { label: 'Pronto',  value: dueSoon.length,                                               color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
          { label: 'Vencida', value: overdueVaccines.length,                                       color: 'bg-red-50 border-red-200 text-red-700' },
        ].map(item => (
          <div key={item.label} className={`rounded-xl border p-4 text-center ${item.color}`}>
            <p className="text-2xl font-bold">{item.value}</p>
            <p className="text-xs font-medium mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { key: 'vaccines',   label: 'Vacunas',         count: vaccineRecords.length },
          { key: 'dewormings', label: 'Desparasitantes', count: dewormingRecords.length },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            <span className="ml-1.5 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{t.count}</span>
          </button>
        ))}
      </div>

      {/* Tabla */}
      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Mascota</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {tab === 'vaccines' ? 'Vacuna' : 'Producto'}
                </th>
                {tab === 'vaccines' && (
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Marca</th>
                )}
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Aplicado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Próxima</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Veterinario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tab === 'vaccines'
                ? vaccineRecords.length === 0
                  ? <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">Sin vacunas registradas</td></tr>
                  : vaccineRecords.map(v => <VaccineRow key={v.id} v={v} type="vaccine" pets={pets} />)
                : dewormingRecords.length === 0
                  ? <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">Sin desparasitantes registrados</td></tr>
                  : dewormingRecords.map(d => <VaccineRow key={d.id} v={d} type="deworming" pets={pets} />)
              }
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}
        title={tab === 'vaccines' ? 'Registrar vacuna' : 'Registrar desparasitante'}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Select label="Mascota" name="petId" required>
            <option value="">— Seleccionar —</option>
            {pets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          {tab === 'vaccines' ? (
            <>
              <Input label="Nombre de la vacuna" name="name" placeholder="Ej. Polivalente DHPP" required />
              <Input label="Marca / Laboratorio" name="brand" placeholder="Ej. Nobivac" />
              <Input label="Número de lote" name="lot" placeholder="LOT2024-XX" />
            </>
          ) : (
            <>
              <Input label="Producto" name="product" placeholder="Ej. Drontal Plus" required />
              <Select label="Tipo" name="type">
                <option value="internal">Interno</option>
                <option value="external">Externo</option>
              </Select>
            </>
          )}
          <Input label="Fecha de aplicación" name="appliedDate" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
          <Input label="Próxima fecha" name="nextDueDate" type="date" required />
          <Input label="Veterinario" name="vet" placeholder="Nombre del veterinario" />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit" icon={Plus}>Guardar</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
