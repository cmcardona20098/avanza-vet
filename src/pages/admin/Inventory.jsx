import { useState, useRef } from 'react'
import {
  Plus, Edit2, Trash2, AlertTriangle, Package,
  ArrowUp, ArrowDown, Search, TrendingDown,
  CheckCircle, Download, Upload, X
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import * as XLSX from 'xlsx'
import { useApp } from '../../context/AppContext'
import Card, { CardHeader } from '../../components/ui/Card'
import StatCard from '../../components/ui/StatCard'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input, { Select, Textarea } from '../../components/ui/Input'

const Q = (n) => `Q${Number(n || 0).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const typeConfig = {
  medication:     { label: 'Medicamento',    variant: 'blue',   bg: 'bg-blue-100 text-blue-700'    },
  vaccine:        { label: 'Vacuna',         variant: 'green',  bg: 'bg-green-100 text-green-700'  },
  deworming:      { label: 'Desparasitante', variant: 'yellow', bg: 'bg-yellow-100 text-yellow-700'},
  grooming:       { label: 'Grooming',       variant: 'purple', bg: 'bg-violet-100 text-violet-700'},
  medical_supply: { label: 'Insumo médico',  variant: 'orange', bg: 'bg-orange-100 text-orange-700'},
  other:          { label: 'Otro',           variant: 'gray',   bg: 'bg-gray-100 text-gray-700'    },
}

// Maps Spanish labels from Excel → internal type keys
const labelToType = {
  'medicamento': 'medication', 'medication': 'medication',
  'vacuna': 'vaccine',         'vaccine': 'vaccine',
  'desparasitante': 'deworming', 'deworming': 'deworming',
  'grooming': 'grooming',      'producto de grooming': 'grooming',
  'insumo médico': 'medical_supply', 'insumo medico': 'medical_supply', 'medical_supply': 'medical_supply',
  'otro': 'other',             'other': 'other',
}

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#f97316', '#6b7280']

// Required Excel columns
const REQUIRED_COLUMNS = ['Código', 'Producto', 'Tipo', 'Unidad', 'Disponible', 'Mínimo', 'Precio unitario']

const emptyForm = {
  sku: '', name: '', type: 'medication', unit: 'pastilla',
  quantity: '', minStock: '25', price: '', expiryDate: '',
  proveedor: '', unidadCompra: '', observations: '',
}

export default function Inventory() {
  const {
    inventory,
    addInventoryItem, updateInventoryItem, deleteInventoryItem,
    adjustInventoryQuantity, importInventory,
  } = useApp()

  const [filterType, setFilterType]   = useState('all')
  const [search, setSearch]           = useState('')
  const [showModal, setShowModal]     = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [adjustModal, setAdjustModal] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [form, setForm]               = useState(emptyForm)
  const [adjustAmt, setAdjustAmt]     = useState('')
  const [importResult, setImportResult] = useState(null)  // { created, updated, errors }
  const fileInputRef = useRef(null)

  const today = new Date().toISOString().split('T')[0]

  // ─── Derived ─────────────────────────────────────────
  const filtered = inventory.filter(i => {
    const matchType   = filterType === 'all' || i.type === filterType
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) ||
                        (i.sku || '').toLowerCase().includes(search.toLowerCase())
    return matchType && matchSearch
  })

  const lowStock     = inventory.filter(i => i.quantity > 0 && i.quantity <= i.minStock)
  const outOfStock   = inventory.filter(i => i.quantity <= 0)
  const totalValue   = inventory.reduce((s, i) => s + i.quantity * (i.price || 0), 0)
  const expiringSoon = inventory.filter(i => {
    if (!i.expiryDate) return false
    const diff = (new Date(i.expiryDate) - new Date(today)) / 86400000
    return diff >= 0 && diff <= 30
  })

  // ─── Chart data ───────────────────────────────────────
  const barData = [...inventory]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10)
    .map(i => ({
      name: i.name.length > 13 ? i.name.slice(0, 12) + '…' : i.name,
      disponible: i.quantity, mínimo: i.minStock,
    }))

  const lowStockBar = [...lowStock, ...outOfStock]
    .slice(0, 8)
    .map(i => ({
      name: i.name.length > 13 ? i.name.slice(0, 12) + '…' : i.name,
      disponible: i.quantity, mínimo: i.minStock,
    }))

  const typeCounts = Object.entries(
    inventory.reduce((acc, i) => { acc[i.type] = (acc[i.type] || 0) + 1; return acc }, {})
  ).map(([type, value]) => ({ name: typeConfig[type]?.label || type, value }))

  // ─── Excel Export ─────────────────────────────────────
  function handleExport() {
    const rows = inventory.map(i => ({
      'Código':           i.sku          || '',
      'Producto':         i.name,
      'Tipo':             typeConfig[i.type]?.label || i.type,
      'Unidad':           i.unit,
      'Disponible':       i.quantity,
      'Mínimo':           i.minStock,
      'Precio unitario':  i.price,
      'Vencimiento':      i.expiryDate   || '',
      'Estado':           i.quantity <= 0 ? 'Sin stock' : i.quantity <= i.minStock ? 'Bajo stock' : 'OK',
      'Proveedor':        i.proveedor    || '',
      'Unidad de compra': i.unidadCompra || '',
      'Observaciones':    i.observations || '',
    }))
    const ws  = XLSX.utils.json_to_sheet(rows)
    const wb  = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario')
    // Column widths
    ws['!cols'] = [
      { wch: 12 }, { wch: 25 }, { wch: 16 }, { wch: 12 },
      { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 14 },
      { wch: 12 }, { wch: 22 }, { wch: 18 }, { wch: 25 },
    ]
    const date = new Date().toISOString().split('T')[0]
    XLSX.writeFile(wb, `inventario-avanzavet-${date}.xlsx`)
  }

  // ─── Excel Import ─────────────────────────────────────
  function handleImportFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const wb   = XLSX.read(evt.target.result, { type: 'array' })
        const ws   = wb.Sheets[wb.SheetNames[0]]
        const data = XLSX.utils.sheet_to_json(ws, { defval: '' })

        if (data.length === 0) {
          setImportResult({ created: 0, updated: 0, errors: ['El archivo está vacío'] })
          return
        }

        // Validate required columns
        const cols = Object.keys(data[0])
        const missing = REQUIRED_COLUMNS.filter(c => !cols.includes(c))
        if (missing.length > 0) {
          setImportResult({ created: 0, updated: 0, errors: [`Columnas faltantes: ${missing.join(', ')}`] })
          return
        }

        const rows    = []
        const errors  = []
        let created   = 0
        let updated   = 0

        data.forEach((row, idx) => {
          const sku  = String(row['Código'] || '').trim()
          const name = String(row['Producto'] || '').trim()

          if (!name) {
            errors.push(`Fila ${idx + 2}: el campo "Producto" está vacío`)
            return
          }

          const typeRaw = String(row['Tipo'] || '').trim().toLowerCase()
          const type    = labelToType[typeRaw] || 'other'

          const parsed = {
            sku,
            name,
            type,
            unit:         String(row['Unidad']          || 'unidad').trim(),
            quantity:     Number(row['Disponible'])      || 0,
            minStock:     Number(row['Mínimo'])          || 0,
            price:        Number(row['Precio unitario']) || 0,
            expiryDate:   String(row['Vencimiento']      || '').trim(),
            proveedor:    String(row['Proveedor']        || '').trim(),
            unidadCompra: String(row['Unidad de compra'] || '').trim(),
            observations: String(row['Observaciones']   || '').trim(),
          }

          // Determine if update or create
          const existsInCurrent = sku && inventory.find(i => i.sku === sku)
          if (existsInCurrent) updated++; else created++

          rows.push(parsed)
        })

        if (rows.length > 0) {
          importInventory(rows)
        }

        setImportResult({ created, updated, errors })
      } catch (err) {
        setImportResult({ created: 0, updated: 0, errors: [`Error al leer el archivo: ${err.message}`] })
      }
    }
    reader.readAsArrayBuffer(file)
  }

  // ─── Form handlers ────────────────────────────────────
  function openAdd() {
    setEditingItem(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  function openEdit(item) {
    setEditingItem(item)
    setForm({
      sku:          item.sku          || '',
      name:         item.name,
      type:         item.type,
      unit:         item.unit,
      quantity:     String(item.quantity),
      minStock:     String(item.minStock),
      price:        String(item.price),
      expiryDate:   item.expiryDate   || '',
      proveedor:    item.proveedor    || '',
      unidadCompra: item.unidadCompra || '',
      observations: item.observations || '',
    })
    setShowModal(true)
  }

  function handleSave(e) {
    e.preventDefault()
    const data = {
      sku:          form.sku,
      name:         form.name,
      type:         form.type,
      unit:         form.unit,
      quantity:     Number(form.quantity) || 0,
      minStock:     Number(form.minStock) || 0,
      price:        Number(form.price)    || 0,
      expiryDate:   form.expiryDate,
      proveedor:    form.proveedor,
      unidadCompra: form.unidadCompra,
      observations: form.observations,
      catalogId:    editingItem?.catalogId ?? null,
    }
    if (editingItem) {
      updateInventoryItem(editingItem.id, data)
    } else {
      addInventoryItem(data)
    }
    setShowModal(false)
    setEditingItem(null)
  }

  function handleAdjust(e) {
    e.preventDefault()
    const amt = Number(adjustAmt) || 0
    if (!amt) return
    adjustInventoryQuantity(adjustModal.item.id, adjustModal.mode === 'add' ? amt : -amt)
    setAdjustModal(null)
    setAdjustAmt('')
  }

  function stockStatus(item) {
    if (item.quantity <= 0)             return { variant: 'red',    label: 'Sin stock'  }
    if (item.quantity <= item.minStock) return { variant: 'yellow', label: 'Bajo stock' }
    return { variant: 'green', label: 'OK' }
  }

  function rowBg(item) {
    if (item.quantity <= 0)             return 'bg-red-50 border-red-100'
    if (item.quantity <= item.minStock) return 'bg-amber-50 border-amber-100'
    return 'bg-white border-gray-100'
  }

  // ─── Render ───────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Package size={20} className="text-blue-600" /> Inventario
          </h2>
          <p className="text-sm text-gray-500">{inventory.length} productos registrados</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Import */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleImportFile}
          />
          <Button
            variant="secondary"
            icon={Upload}
            onClick={() => fileInputRef.current?.click()}
          >
            Importar Excel
          </Button>
          <Button variant="secondary" icon={Download} onClick={handleExport}>
            Exportar Excel
          </Button>
          <Button icon={Plus} onClick={openAdd}>Agregar producto</Button>
        </div>
      </div>

      {/* Resultado de importación */}
      {importResult && (
        <div className={`rounded-xl border p-4 flex items-start gap-3 ${importResult.errors.length ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
          <div className="flex-1">
            {importResult.errors.length === 0 ? (
              <p className="text-sm font-semibold text-emerald-800">
                ✓ Importación completada: {importResult.created} creados, {importResult.updated} actualizados
              </p>
            ) : (
              <>
                <p className="text-sm font-semibold text-amber-800">
                  Importación con advertencias: {importResult.created} creados, {importResult.updated} actualizados
                </p>
                <ul className="mt-1 space-y-0.5">
                  {importResult.errors.map((err, i) => (
                    <li key={i} className="text-xs text-amber-700">• {err}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
          <button onClick={() => setImportResult(null)} className="text-gray-400 hover:text-gray-600 shrink-0">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Alertas */}
      {outOfStock.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <AlertTriangle size={16} className="text-red-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">{outOfStock.length} producto(s) sin existencias</p>
            <p className="text-xs text-red-600 mt-0.5">{outOfStock.map(i => i.name).join(' · ')}</p>
          </div>
        </div>
      )}
      {lowStock.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">{lowStock.length} producto(s) con bajo inventario</p>
            <p className="text-xs text-amber-700 mt-0.5">{lowStock.map(i => `${i.name}: ${i.quantity} ${i.unit}`).join(' · ')}</p>
          </div>
        </div>
      )}
      {expiringSoon.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <AlertTriangle size={16} className="text-orange-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-orange-800">{expiringSoon.length} producto(s) próximos a vencer (≤ 30 días)</p>
            <p className="text-xs text-orange-700 mt-0.5">{expiringSoon.map(i => `${i.name} (${i.expiryDate})`).join(' · ')}</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total productos"   value={inventory.length}    icon={Package}       color="blue"   subtitle="registrados" />
        <StatCard title="Bajo stock"        value={lowStock.length}     icon={TrendingDown}  color="yellow" subtitle="por reabastecer" />
        <StatCard title="Sin existencia"    value={outOfStock.length}   icon={AlertTriangle} color="red"    subtitle="agotados" />
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Valor del inventario</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{Q(totalValue)}</p>
          <p className="text-xs text-gray-400 mt-0.5">estimado total</p>
        </div>
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader title="Cantidad disponible por producto" subtitle="Top 10" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} barSize={14} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="disponible" name="Disponible" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="mínimo"     name="Stock mín." fill="#f59e0b" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <CardHeader title="Por tipo de producto" />
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={typeCounts} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {typeCounts.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {lowStockBar.length > 0 && (
        <Card>
          <CardHeader title="Productos con bajo stock" subtitle="Disponible vs. mínimo requerido" />
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={lowStockBar} barSize={18} barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="disponible" name="Disponible" fill="#ef4444" radius={[3, 3, 0, 0]} />
              <Bar dataKey="mínimo"     name="Mínimo"     fill="#f59e0b" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Filtros y búsqueda */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o SKU..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'all', label: 'Todos' },
            { key: 'medication',     label: 'Medicamentos'    },
            { key: 'vaccine',        label: 'Vacunas'         },
            { key: 'deworming',      label: 'Desparasitantes' },
            { key: 'grooming',       label: 'Grooming'        },
            { key: 'medical_supply', label: 'Insumos'         },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilterType(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filterType === f.key ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100">
              <tr>
                {['SKU', 'Producto', 'Tipo', 'Unidad', 'Disponible', 'Mínimo', 'Precio', 'Vencimiento', 'Proveedor', 'Unidad compra', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-12 text-center text-gray-400">
                    <Package size={32} className="mx-auto mb-2 text-gray-200" />
                    <p>Sin productos con estos filtros</p>
                  </td>
                </tr>
              ) : filtered.map(item => {
                const st = stockStatus(item)
                const tc = typeConfig[item.type] || typeConfig.other
                const isExpiring = item.expiryDate && (() => {
                  const diff = (new Date(item.expiryDate) - new Date(today)) / 86400000
                  return diff >= 0 && diff <= 30
                })()

                return (
                  <tr key={item.id} className={`border-b ${rowBg(item)} hover:opacity-90 transition-opacity`}>
                    <td className="px-3 py-3 text-xs font-mono text-gray-500 whitespace-nowrap">
                      {item.sku || <span className="text-gray-300 italic">—</span>}
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-semibold text-gray-900 whitespace-nowrap">{item.name}</p>
                      {item.observations && <p className="text-xs text-gray-400 mt-0.5 max-w-32 truncate">{item.observations}</p>}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${tc.bg}`}>
                        {tc.label}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{item.unit}</td>
                    <td className="px-3 py-3">
                      <span className={`font-bold text-lg ${item.quantity <= 0 ? 'text-red-600' : item.quantity <= item.minStock ? 'text-amber-600' : 'text-gray-900'}`}>
                        {item.quantity}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-gray-500">{item.minStock}</td>
                    <td className="px-3 py-3 text-gray-700 font-medium whitespace-nowrap">{Q(item.price)}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {item.expiryDate ? (
                        <span className={`text-xs ${isExpiring ? 'text-orange-600 font-semibold' : 'text-gray-500'}`}>
                          {isExpiring && '⚠ '}{item.expiryDate}
                        </span>
                      ) : <span className="text-xs text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-500 max-w-32">
                      <span className="truncate block">{item.proveedor || <span className="text-gray-300 italic">—</span>}</span>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {item.unidadCompra || <span className="text-gray-300 italic">—</span>}
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setAdjustModal({ item, mode: 'add' }); setAdjustAmt('') }}
                          className="w-7 h-7 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 flex items-center justify-center"
                          title="Aumentar"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          onClick={() => { setAdjustModal({ item, mode: 'sub' }); setAdjustAmt('') }}
                          className="w-7 h-7 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-700 flex items-center justify-center"
                          title="Disminuir"
                        >
                          <ArrowDown size={13} />
                        </button>
                        <button
                          onClick={() => openEdit(item)}
                          className="w-7 h-7 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 flex items-center justify-center"
                          title="Editar"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(item)}
                          className="w-7 h-7 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center"
                          title="Eliminar"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Nota Excel */}
      <p className="text-xs text-gray-400 text-center">
        La exportación incluye todos los campos incluyendo Proveedor y Unidad de compra. La importación acepta archivos .xlsx con las columnas: Código, Producto, Tipo, Unidad, Disponible, Mínimo, Precio unitario, Vencimiento, Proveedor, Unidad de compra.
      </p>

      {/* ── Modales ── */}

      {/* Agregar / Editar */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingItem(null) }}
        title={editingItem ? 'Editar producto' : 'Agregar producto'}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Código / SKU"
              value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
              placeholder="Ej. MED-001"
            />
            <Input
              label="Nombre del producto" required
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ej. Amoxicilina"
            />
            <Select
              label="Tipo"
              value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            >
              <option value="medication">Medicamento</option>
              <option value="vaccine">Vacuna</option>
              <option value="deworming">Desparasitante</option>
              <option value="grooming">Producto de grooming</option>
              <option value="medical_supply">Insumo médico</option>
              <option value="other">Otro</option>
            </Select>
            <Input
              label="Unidad de medida" required
              value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
              placeholder="Ej. pastilla, dosis, ml"
            />
            <Input
              label="Cantidad disponible" type="number" min="0" required
              value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
              placeholder="0"
            />
            <Input
              label="Stock mínimo" type="number" min="0" required
              value={form.minStock} onChange={e => setForm(f => ({ ...f, minStock: e.target.value }))}
              placeholder="25"
            />
            <Input
              label="Precio unitario (Q)" type="number" min="0" step="0.01" required
              value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
              placeholder="0.00"
            />
            <Input
              label="Fecha de vencimiento (opcional)" type="date"
              value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))}
            />
          </div>

          {/* Campos solo administración */}
          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Datos de compra (solo administración)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Proveedor"
                value={form.proveedor} onChange={e => setForm(f => ({ ...f, proveedor: e.target.value }))}
                placeholder="Ej. Farmacéutica Guatemala"
              />
              <Input
                label="Unidad de compra"
                value={form.unidadCompra} onChange={e => setForm(f => ({ ...f, unidadCompra: e.target.value }))}
                placeholder="Ej. Caja x 100"
              />
            </div>
          </div>

          <Textarea
            label="Observaciones (opcional)"
            value={form.observations} onChange={e => setForm(f => ({ ...f, observations: e.target.value }))}
            placeholder="Notas adicionales..."
            rows={2}
          />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" type="button" onClick={() => { setShowModal(false); setEditingItem(null) }}>
              Cancelar
            </Button>
            <Button type="submit" icon={editingItem ? CheckCircle : Plus}>
              {editingItem ? 'Guardar cambios' : 'Agregar'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Ajuste de cantidad */}
      <Modal
        isOpen={!!adjustModal}
        onClose={() => { setAdjustModal(null); setAdjustAmt('') }}
        title={adjustModal?.mode === 'add' ? '↑ Aumentar existencias' : '↓ Disminuir existencias'}
        size="sm"
      >
        {adjustModal && (
          <form onSubmit={handleAdjust} className="space-y-4">
            <div className={`p-3 rounded-xl text-sm ${adjustModal.mode === 'add' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
              <p className="font-semibold">{adjustModal.item.name}</p>
              {adjustModal.item.sku && <p className="text-xs opacity-70 mt-0.5">SKU: {adjustModal.item.sku}</p>}
              <p className="text-xs mt-0.5">Existencia actual: <strong>{adjustModal.item.quantity} {adjustModal.item.unit}</strong></p>
            </div>
            <Input
              label={`Cantidad a ${adjustModal.mode === 'add' ? 'agregar' : 'descontar'}`}
              type="number" min="1" required
              value={adjustAmt}
              onChange={e => setAdjustAmt(e.target.value)}
              placeholder="Ej. 50"
            />
            {adjustAmt && (
              <p className={`text-sm font-medium ${adjustModal.mode === 'add' ? 'text-emerald-700' : 'text-amber-700'}`}>
                Resultado: {adjustModal.mode === 'add'
                  ? adjustModal.item.quantity + Number(adjustAmt)
                  : Math.max(0, adjustModal.item.quantity - Number(adjustAmt))
                } {adjustModal.item.unit}
              </p>
            )}
            <div className="flex gap-3 justify-end pt-1">
              <Button variant="secondary" type="button" onClick={() => { setAdjustModal(null); setAdjustAmt('') }}>Cancelar</Button>
              <Button
                type="submit"
                icon={adjustModal.mode === 'add' ? ArrowUp : ArrowDown}
                className={adjustModal.mode === 'add'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-amber-600 hover:bg-amber-700 text-white'
                }
              >
                {adjustModal.mode === 'add' ? 'Aumentar' : 'Descontar'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Confirmación eliminación */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Eliminar producto"
        size="sm"
      >
        {deleteConfirm && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle size={18} className="text-red-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-800">¿Eliminar "{deleteConfirm.name}"?</p>
                {deleteConfirm.sku && <p className="text-xs text-red-600 mt-0.5">SKU: {deleteConfirm.sku}</p>}
                <p className="text-xs text-red-600 mt-1">Esta acción no se puede deshacer.</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                icon={Trash2}
                onClick={() => { deleteInventoryItem(deleteConfirm.id); setDeleteConfirm(null) }}
              >
                Eliminar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
