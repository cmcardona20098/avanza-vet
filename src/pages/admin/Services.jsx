import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, Check, Search, Shield, Package } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input, { Select } from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'

const Q = (n) => `Q${Number(n || 0).toFixed(2)}`

const SERVICE_CATEGORIES = ['Consultas', 'Grooming', 'Preventivo', 'Cirugía', 'Tratamientos', 'Laboratorio', 'Imágenes', 'Otros']
const SERVICE_TYPES       = ['Médico', 'Estética', 'Vacunación', 'Desparasitación', 'Procedimiento', 'Diagnóstico', 'Otro']

const CAT_BADGE = {
  Consultas: 'blue', Grooming: 'purple', Preventivo: 'green',
  Cirugía: 'red', Tratamientos: 'yellow', Laboratorio: 'gray',
  Imágenes: 'blue', Otros: 'gray',
}

function ServiceForm({ initial, onSave, onCancel }) {
  const [v, setV] = useState(initial || { code: '', name: '', category: 'Consultas', type: 'Médico', price: '' })
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Código" value={v.code} onChange={e => setV(x => ({ ...x, code: e.target.value }))} placeholder="Ej. CON-001" />
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Precio (Q)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">Q</span>
            <input type="number" min="0" step="0.01" value={v.price} onChange={e => setV(x => ({ ...x, price: e.target.value }))}
              className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>
      <Input label="Nombre del servicio" value={v.name} onChange={e => setV(x => ({ ...x, name: e.target.value }))} placeholder="Ej. Consulta general" required />
      <div className="grid grid-cols-2 gap-3">
        <Select label="Categoría" value={v.category} onChange={e => setV(x => ({ ...x, category: e.target.value }))}>
          {SERVICE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </Select>
        <Select label="Tipo" value={v.type} onChange={e => setV(x => ({ ...x, type: e.target.value }))}>
          {SERVICE_TYPES.map(t => <option key={t}>{t}</option>)}
        </Select>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>Cancelar</Button>
        <Button onClick={() => onSave({ ...v, price: Number(v.price) || 0 })} icon={Check}>{initial?.id ? 'Guardar' : 'Agregar servicio'}</Button>
      </div>
    </div>
  )
}

export default function Services() {
  const { services, addService, updateService, deleteService, role } = useApp()
  const canEdit = role === 'admin' || role === 'core'
  const [search, setSearch]         = useState('')
  const [catFilter, setCatFilter]   = useState('Todos')
  const [showModal, setShowModal]   = useState(false)
  const [editingSvc, setEditingSvc] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)

  const categories = useMemo(() => ['Todos', ...SERVICE_CATEGORIES.filter(c => services.some(s => s.category === c))], [services])

  const filtered = services.filter(s => {
    const matchCat = catFilter === 'Todos' || s.category === catFilter
    const q = search.toLowerCase()
    const matchQ = !q || s.name?.toLowerCase().includes(q) || s.code?.toLowerCase().includes(q) || s.category?.toLowerCase().includes(q)
    return matchCat && matchQ
  })

  function handleSave(data) {
    if (editingSvc) {
      updateService(editingSvc.id, data)
    } else {
      addService(data)
    }
    setShowModal(false)
    setEditingSvc(null)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Módulo de Servicios</h2>
          <p className="text-sm text-gray-500">{services.length} servicio(s) registrado(s)</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="blue" className="flex items-center gap-1"><Shield size={11} /> Solo Administración</Badge>
          {canEdit && (
            <Button icon={Plus} onClick={() => { setEditingSvc(null); setShowModal(true) }}>Nuevo servicio</Button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar servicio..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {categories.map(cat => (
            <button key={cat} onClick={() => setCatFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${catFilter === cat ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {['Consultas', 'Grooming', 'Preventivo', 'Tratamientos'].map(cat => {
          const items = services.filter(s => s.category === cat)
          const avg   = items.length ? items.reduce((a, s) => a + s.price, 0) / items.length : 0
          return (
            <div key={cat} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide truncate">{cat}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{items.length}</p>
              <p className="text-xs text-gray-500">Prom: {Q(avg)}</p>
            </div>
          )
        })}
      </div>

      <Card padding={false}>
        <div className="overflow-x-auto rounded-2xl">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Código</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Categoría</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Precio</th>
                {canEdit && <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(svc => (
                <tr key={svc.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-5 py-3">
                    <span className="text-xs font-mono font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">{svc.code || '—'}</span>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-sm font-semibold text-gray-900">{svc.name}</p>
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant={CAT_BADGE[svc.category] || 'gray'}>{svc.category}</Badge>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">{svc.type}</td>
                  <td className="px-5 py-3">
                    <Badge variant="green" className="font-mono font-bold">{Q(svc.price)}</Badge>
                  </td>
                  {canEdit && (
                    <td className="px-5 py-3">
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingSvc(svc); setShowModal(true) }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => setConfirmDel(svc)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <Package size={36} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">{search ? `Sin resultados para "${search}"` : 'Sin servicios registrados'}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingSvc(null) }}
        title={editingSvc ? 'Editar servicio' : 'Nuevo servicio'}>
        <ServiceForm initial={editingSvc} onSave={handleSave} onCancel={() => { setShowModal(false); setEditingSvc(null) }} />
      </Modal>

      <Modal isOpen={!!confirmDel} onClose={() => setConfirmDel(null)} title="Eliminar servicio">
        <div className="space-y-4">
          <p className="text-gray-700">¿Eliminar <strong>{confirmDel?.name}</strong>? Esta acción no se puede deshacer.</p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setConfirmDel(null)}>Cancelar</Button>
            <Button variant="danger" icon={Trash2} onClick={() => { deleteService(confirmDel.id); setConfirmDel(null) }}>Eliminar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
