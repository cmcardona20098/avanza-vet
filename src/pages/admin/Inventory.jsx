import { useState, useRef } from 'react'
import {
  Plus, Edit2, Trash2, AlertTriangle, Package,
  Search, TrendingDown, CheckCircle, Download, Upload, X,
  Sliders, Truck, ClipboardList, ToggleLeft, ToggleRight,
  ArrowUp, ArrowDown, RefreshCw
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { useApp } from '../../context/AppContext'
import Card, { CardHeader } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input, { Select, Textarea } from '../../components/ui/Input'
import { useNavigate } from 'react-router-dom'

const Q = (n) => `Q${Number(n || 0).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const CATEGORIES = ['Medicamentos', 'Vacunas', 'Desparasitantes', 'Alimentos', 'Accesorios', 'Higiene', 'Equipos', 'Otros']

const categoryConfig = {
  Medicamentos:    { variant: 'blue',   bg: 'bg-blue-100 text-blue-700'    },
  Vacunas:         { variant: 'green',  bg: 'bg-green-100 text-green-700'  },
  Desparasitantes: { variant: 'yellow', bg: 'bg-yellow-100 text-yellow-700'},
  Alimentos:       { variant: 'orange', bg: 'bg-orange-100 text-orange-700'},
  Accesorios:      { variant: 'purple', bg: 'bg-violet-100 text-violet-700'},
  Higiene:         { variant: 'cyan',   bg: 'bg-cyan-100 text-cyan-700'    },
  Equipos:         { variant: 'gray',   bg: 'bg-gray-100 text-gray-600'    },
  Otros:           { variant: 'gray',   bg: 'bg-gray-100 text-gray-700'    },
  // Legacy type support
  medication:      { variant: 'blue',   bg: 'bg-blue-100 text-blue-700'    },
  vaccine:         { variant: 'green',  bg: 'bg-green-100 text-green-700'  },
  deworming:       { variant: 'yellow', bg: 'bg-yellow-100 text-yellow-700'},
  grooming:        { variant: 'purple', bg: 'bg-violet-100 text-violet-700'},
  medical_supply:  { variant: 'orange', bg: 'bg-orange-100 text-orange-700'},
  other:           { variant: 'gray',   bg: 'bg-gray-100 text-gray-700'    },
}

function getCategoryLabel(item) {
  if (item.category) return item.category
  const map = { medication: 'Medicamentos', vaccine: 'Vacunas', deworming: 'Desparasitantes', grooming: 'Accesorios', medical_supply: 'Equipos', other: 'Otros' }
  return map[item.type] || item.type || 'Otros'
}

const emptyForm = {
  sku: '', barcode: '', name: '', brand: '',
  category: 'Medicamentos', type: 'medication',
  quantity: '', minStock: '0',
  purchasePrice: '', price: '',
  status: 'active', expiryDate: '',
  uomSale: '', uomPurchase: '', conversionFactor: '1',
  supplierId: '', observations: '',
}

const REQUIRED_COLUMNS = ['Código', 'Producto', 'Tipo', 'Unidad', 'Disponible', 'Mínimo', 'Precio unitario']
const labelToType = {
  'medicamento': 'medication', 'medication': 'medication',
  'vacuna': 'vaccine', 'vaccine': 'vaccine',
  'desparasitante': 'deworming', 'deworming': 'deworming',
  'grooming': 'grooming', 'producto de grooming': 'grooming',
  'insumo médico': 'medical_supply', 'insumo medico': 'medical_supply', 'medical_supply': 'medical_supply',
  'otro': 'other', 'other': 'other',
}

export default function Inventory() {
  const {
    inventory, suppliers, role,
    addInventoryItem, updateInventoryItem, deleteInventoryItem,
    adjustInventoryQuantity, importInventory,
  } = useApp()
  const navigate = useNavigate()

  const [search, setSearch]             = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterSupplier, setFilterSupplier] = useState('all')
  const [showLowStock, setShowLowStock] = useState(false)
  const [showModal, setShowModal]       = useState(false)
  const [editingItem, setEditingItem]   = useState(null)
  const [adjustModal, setAdjustModal]   = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [form, setForm]                 = useState(emptyForm)
  const [adjustAmt, setAdjustAmt]       = useState('')
  const [adjustMode, setAdjustMode]     = useState('add') // add | sub | set
  const [adjustNote, setAdjustNote]     = useState('')
  const [importResult, setImportResult] = useState(null)
  const fileInputRef = useRef(null)

  const today = new Date().toISOString().split('T')[0]
  const canSeePurchasePrice = role === 'admin' || role === 'core'

  // ─── Derived KPIs ─────────────────────────────────────
  const activeItems   = inventory.filter(i => i.status !== 'inactive')
  const totalValue    = inventory.reduce((s, i) => s + (i.quantity || 0) * (i.purchasePrice || i.price || 0), 0)
  const lowStockItems = inventory.filter(i => (i.quantity || 0) < (i.minStock || 0) && i.status !== 'inactive')
  const expiringItems = inventory.filter(i => {
    if (!i.expiryDate) return false
    const diff = (new Date(i.expiryDate) - new Date(today)) / 86400000
    return diff >= 0 && diff <= 30
  })

  // ─── Filtered table rows ────────────────────────────────
  const filtered = inventory.filter(i => {
    const cat = getCategoryLabel(i)
    const matchCat = filterCategory === 'all' || cat === filterCategory || i.type === filterCategory || i.category === filterCategory
    const matchStatus = filterStatus === 'all' || (filterStatus === 'active' ? i.status !== 'inactive' : i.status === 'inactive')
    const matchSupplier = filterSupplier === 'all' || i.supplierId === filterSupplier
    const matchLow = !showLowStock || (i.quantity || 0) < (i.minStock || 0)
    const q = search.toLowerCase()
    const matchSearch = !q || i.name?.toLowerCase().includes(q) || (i.sku || '').toLowerCase().includes(q) || (i.brand || '').toLowerCase().includes(q)
    return matchCat && matchStatus && matchSupplier && matchLow && matchSearch
  })

  // ─── Excel Export ─────────────────────────────────────
  function handleExport() {
    const rows = inventory.map(i => ({
      'Código': i.sku || '',
      'Código de barras': i.barcode || '',
      'Producto': i.name,
      'Marca': i.brand || '',
      'Categoría': getCategoryLabel(i),
      'Tipo': i.type || '',
      'Unidad venta': i.uomSale || i.unit || '',
      'Unidad compra': i.uomPurchase || i.unidadCompra || '',
      'Factor conversión': i.conversionFactor || 1,
      'Disponible': i.quantity || 0,
      'Mínimo': i.minStock || 0,
      'Precio compra': i.purchasePrice || 0,
      'Precio público': i.price || 0,
      'Estado': i.status === 'inactive' ? 'Inactivo' : 'Activo',
      'Vencimiento': i.expiryDate || '',
      'Proveedor': suppliers.find(s => s.id === i.supplierId)?.name || i.proveedor || '',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario')
    XLSX.writeFile(wb, `inventario-vetflow-${today}.xlsx`)
  }

  // ─── Excel Import ─────────────────────────────────────
  function handleImportFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const data = XLSX.utils.sheet_to_json(ws, { defval: '' })
        if (data.length === 0) { setImportResult({ created: 0, updated: 0, errors: ['El archivo está vacío'] }); return }
        const cols = Object.keys(data[0])
        const missing = REQUIRED_COLUMNS.filter(c => !cols.includes(c))
        if (missing.length > 0) { setImportResult({ created: 0, updated: 0, errors: [`Columnas faltantes: ${missing.join(', ')}`] }); return }
        const rows = []; const errors = []; let created = 0; let updated = 0
        data.forEach((row, idx) => {
          const sku = String(row['Código'] || '').trim()
          const name = String(row['Producto'] || '').trim()
          if (!name) { errors.push(`Fila ${idx + 2}: "Producto" está vacío`); return }
          const typeRaw = String(row['Tipo'] || '').trim().toLowerCase()
          const type = labelToType[typeRaw] || 'other'
          const parsed = {
            sku, name, type, category: row['Categoría'] || '',
            unit: String(row['Unidad'] || 'unidad').trim(),
            quantity: Number(row['Disponible']) || 0,
            minStock: Number(row['Mínimo']) || 0,
            price: Number(row['Precio unitario']) || 0,
            expiryDate: String(row['Vencimiento'] || '').trim(),
            proveedor: String(row['Proveedor'] || '').trim(),
            unidadCompra: String(row['Unidad de compra'] || '').trim(),
            observations: String(row['Observaciones'] || '').trim(),
          }
          const existsInCurrent = sku && inventory.find(i => i.sku === sku)
          if (existsInCurrent) updated++; else created++
          rows.push(parsed)
        })
        if (rows.length > 0) importInventory(rows)
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
      sku:              item.sku              || '',
      barcode:          item.barcode          || '',
      name:             item.name             || '',
      brand:            item.brand            || '',
      category:         item.category         || getCategoryLabel(item),
      type:             item.type             || 'medication',
      quantity:         String(item.quantity  ?? ''),
      minStock:         String(item.minStock  ?? '0'),
      purchasePrice:    String(item.purchasePrice ?? ''),
      price:            String(item.price     ?? ''),
      status:           item.status           || 'active',
      expiryDate:       item.expiryDate       || '',
      uomSale:          item.uomSale          || item.unit || '',
      uomPurchase:      item.uomPurchase      || item.unidadCompra || '',
      conversionFactor: String(item.conversionFactor ?? '1'),
      supplierId:       item.supplierId       || '',
      observations:     item.observations     || '',
    })
    setShowModal(true)
  }

  function handleSave(e) {
    e.preventDefault()
    const data = {
      sku:              form.sku,
      barcode:          form.barcode,
      name:             form.name,
      brand:            form.brand,
      category:         form.category,
      type:             form.type,
      quantity:         Number(form.quantity) || 0,
      minStock:         Number(form.minStock) || 0,
      purchasePrice:    Number(form.purchasePrice) || 0,
      price:            Number(form.price) || 0,
      status:           form.status,
      expiryDate:       form.expiryDate,
      uomSale:          form.uomSale,
      unit:             form.uomSale, // keep legacy field in sync
      uomPurchase:      form.uomPurchase,
      unidadCompra:     form.uomPurchase,
      conversionFactor: Number(form.conversionFactor) || 1,
      supplierId:       form.supplierId,
      observations:     form.observations,
      catalogId:        editingItem?.catalogId ?? null,
    }
    if (editingItem) {
      updateInventoryItem(editingItem.id, data)
    } else {
      addInventoryItem(data)
    }
    setShowModal(false)
    setEditingItem(null)
  }

  function openAdjust(item) {
    setAdjustModal(item)
    setAdjustAmt('')
    setAdjustMode('add')
    setAdjustNote('')
  }

  function handleAdjust(e) {
    e.preventDefault()
    const amt = Number(adjustAmt) || 0
    if (!amt && adjustMode !== 'set') return
    const item = adjustModal
    const convFactor = item.conversionFactor || 1
    let delta = 0
    if (adjustMode === 'add') delta = amt * convFactor
    else if (adjustMode === 'sub') delta = -(amt * convFactor)
    else if (adjustMode === 'set') {
      // direct set
      updateInventoryItem(item.id, { quantity: Number(adjustAmt) || 0 })
      setAdjustModal(null)
      setAdjustAmt('')
      return
    }
    adjustInventoryQuantity(item.id, delta)
    setAdjustModal(null)
    setAdjustAmt('')
  }

  function stockStatus(item) {
    if (item.status === 'inactive')            return { variant: 'gray',   label: 'Inactivo'   }
    if ((item.quantity || 0) <= 0)             return { variant: 'red',    label: 'Sin stock'  }
    if ((item.quantity || 0) < (item.minStock || 0)) return { variant: 'yellow', label: 'Bajo stock' }
    return { variant: 'green', label: 'OK' }
  }

  function isExpiring(item) {
    if (!item.expiryDate) return false
    const diff = (new Date(item.expiryDate) - new Date(today)) / 86400000
    return diff >= 0 && diff <= 30
  }

  const previewQty = () => {
    if (!adjustModal) return 0
    const amt = Number(adjustAmt) || 0
    const convFactor = adjustModal.conversionFactor || 1
    if (adjustMode === 'add') return (adjustModal.quantity || 0) + amt * convFactor
    if (adjustMode === 'sub') return Math.max(0, (adjustModal.quantity || 0) - amt * convFactor)
    return amt
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
          <p className="text-sm text-gray-500">{inventory.length} productos registrados · {activeItems.length} activos</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportFile} />
          <Button variant="secondary" icon={Upload} onClick={() => fileInputRef.current?.click()}>Importar Excel</Button>
          <Button variant="secondary" icon={Download} onClick={handleExport}>Exportar Excel</Button>
          <Button variant="secondary" icon={ClipboardList} onClick={() => navigate('/ordenes-compra')}>
            Generar OC
          </Button>
          <Button icon={Plus} onClick={openAdd}>Agregar producto</Button>
        </div>
      </div>

      {/* Import result */}
      {importResult && (
        <div className={`rounded-xl border p-4 flex items-start gap-3 ${importResult.errors.length ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
          <div className="flex-1">
            {importResult.errors.length === 0 ? (
              <p className="text-sm font-semibold text-emerald-800">Importación completada: {importResult.created} creados, {importResult.updated} actualizados</p>
            ) : (
              <>
                <p className="text-sm font-semibold text-amber-800">Importación con advertencias: {importResult.created} creados, {importResult.updated} actualizados</p>
                <ul className="mt-1 space-y-0.5">{importResult.errors.map((err, i) => <li key={i} className="text-xs text-amber-700">• {err}</li>)}</ul>
              </>
            )}
          </div>
          <button onClick={() => setImportResult(null)} className="text-gray-400 hover:text-gray-600 shrink-0"><X size={16} /></button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Package size={18} className="text-blue-600" />
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Productos activos</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{activeItems.length}</p>
          <p className="text-xs text-gray-400 mt-1">de {inventory.length} totales</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <TrendingDown size={18} className="text-emerald-600" />
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Valor inventario</p>
          </div>
          <p className="text-2xl font-bold text-emerald-700">{Q(totalValue)}</p>
          <p className="text-xs text-gray-400 mt-1">precio de costo</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <AlertTriangle size={18} className="text-amber-600" />
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Bajo stock mínimo</p>
          </div>
          <p className="text-3xl font-bold text-amber-600">{lowStockItems.length}</p>
          <p className="text-xs text-gray-400 mt-1">productos por reabastecer</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle size={18} className="text-red-500" />
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Por vencer ≤30 días</p>
          </div>
          <p className="text-3xl font-bold text-red-500">{expiringItems.length}</p>
          <p className="text-xs text-gray-400 mt-1">revisión urgente</p>
        </div>
      </div>

      {/* Alerts */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">{lowStockItems.length} producto(s) bajo stock mínimo</p>
            <p className="text-xs text-amber-700 mt-0.5">{lowStockItems.slice(0,5).map(i => `${i.name}: ${i.quantity || 0} (mín ${i.minStock})`).join(' · ')}{lowStockItems.length > 5 ? ` y ${lowStockItems.length - 5} más...` : ''}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, SKU o marca..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas las categorías</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
            {suppliers.length > 0 && (
              <select
                value={filterSupplier}
                onChange={e => setFilterSupplier(e.target.value)}
                className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos los proveedores</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            )}
            <button
              onClick={() => setShowLowStock(v => !v)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold border transition-colors ${showLowStock ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
            >
              <AlertTriangle size={13} />
              Stock bajo
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-400">{filtered.length} resultado(s) de {inventory.length} productos</p>
      </div>

      {/* Table */}
      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Producto</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Marca</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Categoría</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Stock</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Mín.</th>
                {canSeePurchasePrice && (
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">P. Compra</th>
                )}
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">P. Público</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Vencimiento</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={canSeePurchasePrice ? 11 : 10} className="px-4 py-14 text-center text-gray-400">
                    <Package size={36} className="mx-auto mb-3 text-gray-200" />
                    <p className="font-medium">Sin productos con estos filtros</p>
                  </td>
                </tr>
              ) : filtered.map(item => {
                const st = stockStatus(item)
                const cat = getCategoryLabel(item)
                const cc = categoryConfig[cat] || categoryConfig[item.type] || categoryConfig.other
                const exp = isExpiring(item)
                const isInactive = item.status === 'inactive'
                const isLow = !isInactive && (item.quantity || 0) < (item.minStock || 0)
                const supplierName = suppliers.find(s => s.id === item.supplierId)?.name || ''

                return (
                  <tr key={item.id} className={`border-b transition-colors hover:bg-gray-50/50 ${isInactive ? 'opacity-60 bg-gray-50/50' : isLow ? 'bg-amber-50/40' : 'bg-white'}`}>
                    <td className="px-4 py-3 text-xs font-mono text-gray-500 whitespace-nowrap">
                      {item.sku || <span className="text-gray-300 italic">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <p className={`font-semibold whitespace-nowrap ${isInactive ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{item.name}</p>
                      {supplierName && <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><Truck size={10} />{supplierName}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{item.brand || <span className="text-gray-300 italic">—</span>}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${cc.bg}`}>{cat}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-bold text-lg ${(item.quantity || 0) <= 0 ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-gray-900'}`}>
                        {item.quantity || 0}
                      </span>
                      {item.uomSale && <span className="text-xs text-gray-400 ml-1">{item.uomSale}</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{item.minStock || 0}</td>
                    {canSeePurchasePrice && (
                      <td className="px-4 py-3 text-sm text-gray-700 font-medium whitespace-nowrap">{item.purchasePrice ? Q(item.purchasePrice) : <span className="text-gray-300">—</span>}</td>
                    )}
                    <td className="px-4 py-3 text-sm font-semibold text-blue-700 whitespace-nowrap">{item.price ? Q(item.price) : <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {item.expiryDate ? (
                        <span className={`text-xs ${exp ? 'text-orange-600 font-semibold' : 'text-gray-500'}`}>
                          {exp && '⚠ '}{item.expiryDate}
                        </span>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openAdjust(item)}
                          className="w-7 h-7 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 flex items-center justify-center transition-colors"
                          title="Ajustar stock"
                        >
                          <RefreshCw size={12} />
                        </button>
                        <button
                          onClick={() => openEdit(item)}
                          className="w-7 h-7 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 flex items-center justify-center transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(item)}
                          className="w-7 h-7 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center transition-colors"
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

      {/* ── Modales ── */}

      {/* Agregar / Editar */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingItem(null) }}
        title={editingItem ? 'Editar producto' : 'Agregar producto'}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-5">
          {/* Identificación */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Identificación</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="SKU / Código" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="Ej. MED-001" />
              <Input label="Código de barras" value={form.barcode} onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))} placeholder="Ej. 7501234567890" />
              <Input label="Nombre del producto" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej. Amoxicilina 250mg" />
              <Input label="Marca" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} placeholder="Ej. Pfizer" />
              <Select label="Categoría" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
              <Select label="Estado" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </Select>
            </div>
          </div>

          {/* Stock & Precios */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Stock y precios</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Stock actual" type="number" min="0" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} placeholder="0" />
              <Input label="Stock mínimo" type="number" min="0" value={form.minStock} onChange={e => setForm(f => ({ ...f, minStock: e.target.value }))} placeholder="0" />
              <Input label="Precio compra Q" type="number" min="0" step="0.01" value={form.purchasePrice} onChange={e => setForm(f => ({ ...f, purchasePrice: e.target.value }))} placeholder="0.00" />
              <Input label="Precio público Q" required type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" />
              <Input label="Fecha vencimiento" type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} />
            </div>
          </div>

          {/* Unidades y proveedor */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Unidades y proveedor</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Unidad de venta (UOM)" value={form.uomSale} onChange={e => setForm(f => ({ ...f, uomSale: e.target.value }))} placeholder="pastilla / ml / dosis / unidad" />
              <Input label="Unidad de compra" value={form.uomPurchase} onChange={e => setForm(f => ({ ...f, uomPurchase: e.target.value }))} placeholder="caja / frasco / unidad" />
              <div>
                <Input label="Factor de conversión" type="number" min="1" value={form.conversionFactor} onChange={e => setForm(f => ({ ...f, conversionFactor: e.target.value }))} placeholder="1" />
                {form.uomPurchase && form.uomSale && (
                  <p className="text-xs text-blue-600 mt-1">1 {form.uomPurchase} = {form.conversionFactor || 1} {form.uomSale}(s)</p>
                )}
              </div>
              <Select label="Proveedor" value={form.supplierId} onChange={e => setForm(f => ({ ...f, supplierId: e.target.value }))}>
                <option value="">Sin proveedor</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </div>
            <div className="mt-4">
              <Textarea label="Observaciones" value={form.observations} onChange={e => setForm(f => ({ ...f, observations: e.target.value }))} placeholder="Notas adicionales..." rows={2} />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" type="button" onClick={() => { setShowModal(false); setEditingItem(null) }}>Cancelar</Button>
            <Button type="submit" icon={editingItem ? CheckCircle : Plus}>{editingItem ? 'Guardar cambios' : 'Agregar producto'}</Button>
          </div>
        </form>
      </Modal>

      {/* Ajuste de stock */}
      <Modal
        isOpen={!!adjustModal}
        onClose={() => { setAdjustModal(null); setAdjustAmt('') }}
        title="Ajustar stock"
        size="sm"
      >
        {adjustModal && (
          <form onSubmit={handleAdjust} className="space-y-4">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="font-semibold text-blue-900">{adjustModal.name}</p>
              {adjustModal.sku && <p className="text-xs text-blue-600 mt-0.5">SKU: {adjustModal.sku}</p>}
              <p className="text-sm text-blue-800 mt-1">Stock actual: <strong>{adjustModal.quantity || 0} {adjustModal.uomSale || adjustModal.unit || 'unidades'}</strong></p>
            </div>

            {/* Mode tabs */}
            <div className="flex rounded-xl overflow-hidden border border-gray-200">
              {[{key:'add',label:'Agregar',icon:ArrowUp},{key:'sub',label:'Restar',icon:ArrowDown},{key:'set',label:'Ajuste manual',icon:RefreshCw}].map(m => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setAdjustMode(m.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-colors ${adjustMode === m.key ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                >
                  <m.icon size={12} />{m.label}
                </button>
              ))}
            </div>

            <Input
              label={adjustMode === 'set' ? 'Nueva cantidad total' : `Cantidad a ${adjustMode === 'add' ? 'agregar' : 'restar'} (en ${adjustModal.uomPurchase || 'unidades'})`}
              type="number"
              min="0"
              required
              value={adjustAmt}
              onChange={e => setAdjustAmt(e.target.value)}
              placeholder="0"
            />

            {adjustAmt && adjustModal.conversionFactor > 1 && adjustMode !== 'set' && (
              <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600">
                <p>{adjustAmt} {adjustModal.uomPurchase || 'unidades de compra'} × factor {adjustModal.conversionFactor} = <strong>{Number(adjustAmt) * (adjustModal.conversionFactor || 1)} {adjustModal.uomSale || 'unidades de venta'}</strong></p>
              </div>
            )}

            {adjustAmt !== '' && (
              <p className={`text-sm font-semibold ${adjustMode === 'sub' && previewQty() < (adjustModal.minStock||0) ? 'text-amber-700' : 'text-emerald-700'}`}>
                Resultado: <strong>{previewQty()} {adjustModal.uomSale || adjustModal.unit || 'unidades'}</strong>
              </p>
            )}

            <Input label="Nota (opcional)" value={adjustNote} onChange={e => setAdjustNote(e.target.value)} placeholder="Motivo del ajuste..." />

            <div className="flex gap-3 justify-end pt-1">
              <Button variant="secondary" type="button" onClick={() => { setAdjustModal(null); setAdjustAmt('') }}>Cancelar</Button>
              <Button type="submit" icon={adjustMode === 'add' ? ArrowUp : adjustMode === 'sub' ? ArrowDown : RefreshCw}>
                {adjustMode === 'add' ? 'Agregar' : adjustMode === 'sub' ? 'Restar' : 'Ajustar'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Confirmación eliminación */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Eliminar producto" size="sm">
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
              <Button className="bg-red-600 hover:bg-red-700 text-white" icon={Trash2} onClick={() => { deleteInventoryItem(deleteConfirm.id); setDeleteConfirm(null) }}>Eliminar</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
