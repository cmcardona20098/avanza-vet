import { useState } from 'react'
import { Plus, Pencil, Trash2, Check, X, DollarSign, Pill, Stethoscope, Scissors, Syringe, Shield } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import Card, { CardHeader } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input, { Select } from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'

const Q = (n) => `Q${Number(n).toFixed(2)}`

const tabs = [
  { key: 'medications',     label: 'Medicamentos',    icon: Pill        },
  { key: 'treatments',      label: 'Tratamientos',    icon: Stethoscope },
  { key: 'groomingServices',label: 'Grooming',        icon: Scissors    },
  { key: 'vaccines',        label: 'Vacunas',         icon: Syringe     },
  { key: 'dewormings',      label: 'Desparasitantes', icon: Shield      },
  { key: 'consultationFee', label: 'Consulta',        icon: DollarSign  },
]

function EditRow({ item, onSave, onCancel, section }) {
  const [values, setValues] = useState({ ...item })
  return (
    <tr className="bg-yellow-50">
      <td className="px-4 py-2">
        <input className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
          value={values.name} onChange={e => setValues(v => ({ ...v, name: e.target.value }))} placeholder="Nombre" />
      </td>
      {section === 'medications' && (
        <td className="px-4 py-2">
          <input className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
            value={values.unit || ''} onChange={e => setValues(v => ({ ...v, unit: e.target.value }))} placeholder="pastilla/dosis/ml" />
        </td>
      )}
      {section === 'treatments' && (
        <td className="px-4 py-2">
          <input className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
            value={values.description || ''} onChange={e => setValues(v => ({ ...v, description: e.target.value }))} placeholder="Descripción" />
        </td>
      )}
      <td className="px-4 py-2">
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium text-gray-500">Q</span>
          <input type="number" min="0" step="0.01"
            className="w-24 text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
            value={values.price} onChange={e => setValues(v => ({ ...v, price: e.target.value }))} />
        </div>
      </td>
      <td className="px-4 py-2">
        <div className="flex gap-2">
          <button onClick={() => onSave(values)} className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"><Check size={14} /></button>
          <button onClick={onCancel}             className="p-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"><X size={14} /></button>
        </div>
      </td>
    </tr>
  )
}

function CatalogTable({ section, items, onUpdate, onDelete, onAdd }) {
  const [editingId, setEditingId] = useState(null)
  const [adding, setAdding] = useState(false)
  const hasDescription = section === 'treatments'
  const hasUnit = section === 'medications'

  function handleSave(updated) {
    onUpdate(items.map(i => i.id === updated.id ? { ...i, ...updated, price: Number(updated.price) } : i))
    setEditingId(null)
  }

  function handleAdd(values) {
    onAdd({ ...values, id: `${section.slice(0,2)}${Date.now()}`, price: Number(values.price) })
    setAdding(false)
  }

  const newItem = { id: '__new__', name: '', price: '', ...(hasUnit && { unit: 'pastilla' }), ...(hasDescription && { description: '' }) }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <Button size="sm" icon={Plus} onClick={() => setAdding(true)}>Agregar</Button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre</th>
              {hasUnit        && <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Unidad</th>}
              {hasDescription && <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Descripción</th>}
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Precio</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {adding && (
              <EditRow item={newItem} section={section}
                onSave={handleAdd}
                onCancel={() => setAdding(false)}
              />
            )}
            {items.map(item => (
              editingId === item.id
                ? <EditRow key={item.id} item={item} section={section} onSave={handleSave} onCancel={() => setEditingId(null)} />
                : (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                    {hasUnit        && <td className="px-4 py-3 text-xs text-gray-500">{item.unit}</td>}
                    {hasDescription && <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">{item.description}</td>}
                    <td className="px-4 py-3">
                      <Badge variant="green" className="font-mono font-semibold">{Q(item.price)}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setEditingId(item.id)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => onDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
            ))}
            {items.length === 0 && !adding && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">Sin registros. Agrega el primero.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function PriceAdmin() {
  const { catalog, updateCatalog, updateConsultationFee, role } = useApp()
  const [activeTab, setActiveTab] = useState('medications')
  const [consultFee, setConsultFee] = useState(String(catalog.consultationFee))

  if (role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto text-center py-20">
        <Shield size={48} className="text-red-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Acceso restringido</h2>
        <p className="text-gray-500">Solo el rol Administración puede acceder a esta sección.</p>
      </div>
    )
  }

  function handleUpdate(section, items) {
    updateCatalog(section, items)
  }
  function handleDelete(section, id) {
    updateCatalog(section, catalog[section].filter(i => i.id !== id))
  }
  function handleAdd(section, item) {
    updateCatalog(section, [...catalog[section], item])
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Administración de precios</h2>
          <p className="text-sm text-gray-500">Solo visible para Administración</p>
        </div>
        <Badge variant="blue" className="flex items-center gap-1"><Shield size={11} /> Protegido</Badge>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-gray-200 pb-0">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
              activeTab === key
                ? 'border-primary-600 text-primary-700 bg-primary-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <Card>
        {activeTab === 'consultationFee' ? (
          <div className="max-w-sm space-y-4">
            <CardHeader title="Precio de consulta médica" subtitle="Tarifa base por consulta" />
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Precio (Q)</label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">Q</span>
                  <input
                    type="number" min="0" step="0.01"
                    value={consultFee}
                    onChange={e => setConsultFee(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <Button onClick={() => updateConsultationFee(Number(consultFee))} icon={Check}>Guardar</Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Precio actual: <strong>{Q(catalog.consultationFee)}</strong></p>
            </div>
          </div>
        ) : (
          <div>
            <CardHeader
              title={tabs.find(t => t.key === activeTab)?.label}
              subtitle={`${catalog[activeTab]?.length || 0} registros`}
            />
            <CatalogTable
              section={activeTab}
              items={catalog[activeTab] || []}
              onUpdate={(items) => handleUpdate(activeTab, items)}
              onDelete={(id) => handleDelete(activeTab, id)}
              onAdd={(item) => handleAdd(activeTab, item)}
            />
          </div>
        )}
      </Card>
    </div>
  )
}
