import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ClipboardList, Plus, Truck, Package, CheckCircle, AlertTriangle,
  ChevronRight, ChevronLeft, Eye, X, Check, Clock
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input, { Select, Textarea } from '../../components/ui/Input'

const Q = (n) => `Q${Number(n || 0).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const STATUS_CONFIG = {
  draft:    { label: 'Borrador', variant: 'gray',   bg: 'bg-gray-100 text-gray-700'   },
  sent:     { label: 'Enviada',  variant: 'blue',   bg: 'bg-blue-100 text-blue-700'   },
  received: { label: 'Recibida', variant: 'green',  bg: 'bg-green-100 text-green-700' },
}

export default function PurchaseOrders() {
  const {
    purchaseOrders, suppliers, inventory,
    addPurchaseOrder, updatePurchaseOrder, receivePurchaseOrder,
  } = useApp()
  const [searchParams] = useSearchParams()

  const [showWizard, setShowWizard]     = useState(false)
  const [wizardStep, setWizardStep]     = useState(1)
  const [selectedSupplier, setSelectedSupplier] = useState(searchParams.get('supplier') || '')
  const [poItems, setPOItems]           = useState([])
  const [poNotes, setPONotes]           = useState('')
  const [viewModal, setViewModal]       = useState(null) // po id
  const [receiveModal, setReceiveModal] = useState(null) // po
  const [receivedQtys, setReceivedQtys] = useState({})

  // Open wizard if supplier param given
  useEffect(() => {
    const sup = searchParams.get('supplier')
    if (sup) {
      setSelectedSupplier(sup)
      setShowWizard(true)
      setWizardStep(1)
    }
  }, []) // eslint-disable-line

  // When supplier selected in step 1, build product list for step 2
  function loadSupplierProducts(supplierId) {
    const products = inventory.filter(i => i.supplierId === supplierId && i.status !== 'inactive')
    const items = products.map(p => ({
      productId:     p.id,
      sku:           p.sku || '',
      name:          p.name,
      currentStock:  p.quantity || 0,
      minStock:      p.minStock || 0,
      purchasePrice: p.purchasePrice || 0,
      suggestedQty:  Math.max(0, (p.minStock || 0) - (p.quantity || 0)),
      orderedQty:    Math.max(0, (p.minStock || 0) - (p.quantity || 0)),
      included:      Math.max(0, (p.minStock || 0) - (p.quantity || 0)) > 0,
      uomPurchase:   p.uomPurchase || p.unidadCompra || 'unidad',
      uomSale:       p.uomSale || p.unit || 'unidad',
      conversionFactor: p.conversionFactor || 1,
    }))
    setPOItems(items)
  }

  function goToStep2() {
    if (!selectedSupplier) return
    loadSupplierProducts(selectedSupplier)
    setWizardStep(2)
  }

  function handleCreatePO(status) {
    const includedItems = poItems.filter(i => i.included && i.orderedQty > 0)
    if (includedItems.length === 0) return
    addPurchaseOrder({
      supplierId: selectedSupplier,
      status,
      notes: poNotes,
      items: includedItems,
    })
    setShowWizard(false)
    resetWizard()
  }

  function resetWizard() {
    setWizardStep(1)
    setSelectedSupplier('')
    setPOItems([])
    setPONotes('')
  }

  const totalCost = poItems
    .filter(i => i.included)
    .reduce((s, i) => s + (i.orderedQty || 0) * (i.purchasePrice || 0), 0)

  const supplier = useMemo(() => suppliers.find(s => s.id === selectedSupplier), [suppliers, selectedSupplier])
  const viewPO   = purchaseOrders.find(p => p.id === viewModal)

  function openReceive(po) {
    setReceiveModal(po)
    const init = {}
    po.items?.forEach(item => { init[item.productId] = item.orderedQty || 0 })
    setReceivedQtys(init)
  }

  function handleReceive() {
    if (!receiveModal) return
    const receivedItems = receiveModal.items?.map(item => ({
      productId:     item.productId,
      receivedQty:   Number(receivedQtys[item.productId] || 0),
      purchasePrice: item.purchasePrice,
    })) || []
    receivePurchaseOrder(receiveModal.id, receivedItems)
    setReceiveModal(null)
    setReceivedQtys({})
  }

  // Sort POs newest first
  const sortedPOs = [...purchaseOrders].sort((a, b) => b.date?.localeCompare(a.date))

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList size={20} className="text-blue-600" /> Órdenes de Compra
          </h2>
          <p className="text-sm text-gray-500">{purchaseOrders.length} órdenes registradas</p>
        </div>
        <Button icon={Plus} onClick={() => { resetWizard(); setShowWizard(true) }}>Nueva orden</Button>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-3 gap-4">
        {['draft','sent','received'].map(status => {
          const count = purchaseOrders.filter(p => p.status === status).length
          const cfg = STATUS_CONFIG[status]
          return (
            <div key={status} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm text-center">
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-1 ${cfg.bg}`}>{cfg.label}</span>
            </div>
          )
        })}
      </div>

      {/* PO list */}
      {sortedPOs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <ClipboardList size={48} className="text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-500 mb-2">Sin órdenes de compra</h3>
          <p className="text-sm text-gray-400 mb-5">Crea tu primera orden para gestionar el abastecimiento</p>
          <Button icon={Plus} onClick={() => { resetWizard(); setShowWizard(true) }}>Nueva orden</Button>
        </div>
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Proveedor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Items</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sortedPOs.map(po => {
                  const sup = suppliers.find(s => s.id === po.supplierId)
                  const cfg = STATUS_CONFIG[po.status] || STATUS_CONFIG.draft
                  const total = (po.items || []).reduce((s, i) => s + (i.orderedQty || 0) * (i.purchasePrice || 0), 0)
                  return (
                    <tr key={po.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-gray-400">{po.id.slice(-6).toUpperCase()}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{sup?.name || 'Proveedor desconocido'}</p>
                        {sup?.contact && <p className="text-xs text-gray-400">{sup.contact}</p>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{po.date}</td>
                      <td className="px-4 py-3 text-gray-600">{(po.items || []).filter(i=>i.orderedQty>0).length} producto(s)</td>
                      <td className="px-4 py-3 font-semibold text-blue-700">{Q(total)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg}`}>{cfg.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setViewModal(po.id)}
                            className="w-7 h-7 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 flex items-center justify-center transition-colors"
                            title="Ver detalle"
                          >
                            <Eye size={13} />
                          </button>
                          {po.status === 'draft' && (
                            <button
                              onClick={() => updatePurchaseOrder(po.id, { status: 'sent' })}
                              className="w-7 h-7 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 flex items-center justify-center transition-colors"
                              title="Marcar como enviada"
                            >
                              <Truck size={13} />
                            </button>
                          )}
                          {po.status === 'sent' && (
                            <button
                              onClick={() => openReceive(po)}
                              className="w-7 h-7 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 flex items-center justify-center transition-colors"
                              title="Recibir mercadería"
                            >
                              <Check size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Wizard Modal ── */}
      <Modal
        isOpen={showWizard}
        onClose={() => { setShowWizard(false); resetWizard() }}
        title="Nueva orden de compra"
        size="lg"
      >
        {/* Steps indicator */}
        <div className="flex items-center mb-6">
          {[1,2,3].map((s, idx) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${wizardStep === s ? 'bg-blue-600 border-blue-600 text-white' : wizardStep > s ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-200 text-gray-400'}`}>
                {wizardStep > s ? <Check size={14} /> : s}
              </div>
              <div className={`flex-1 h-0.5 mx-1 ${s < 3 ? (wizardStep > s ? 'bg-emerald-500' : 'bg-gray-200') : 'hidden'}`} />
              {idx < 2 && <div className={`flex-1 h-0.5 mx-1 ${wizardStep > s ? 'bg-emerald-500' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-400 mb-5 px-1">
          <span className={wizardStep === 1 ? 'text-blue-600 font-semibold' : ''}>Proveedor</span>
          <span className={wizardStep === 2 ? 'text-blue-600 font-semibold' : ''}>Productos</span>
          <span className={wizardStep === 3 ? 'text-blue-600 font-semibold' : ''}>Resumen</span>
        </div>

        {/* Step 1: Supplier */}
        {wizardStep === 1 && (
          <div className="space-y-4">
            <Select
              label="Seleccionar proveedor"
              value={selectedSupplier}
              onChange={e => setSelectedSupplier(e.target.value)}
            >
              <option value="">— Selecciona un proveedor —</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
            {supplier && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-1">
                <p className="font-semibold text-blue-900">{supplier.name}</p>
                {supplier.contact && <p className="text-sm text-blue-700">{supplier.contact}</p>}
                {supplier.phone && <p className="text-sm text-blue-600">{supplier.phone}</p>}
                {supplier.email && <p className="text-sm text-blue-600">{supplier.email}</p>}
              </div>
            )}
            {suppliers.length === 0 && (
              <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-xl p-3">
                No hay proveedores registrados. Ve a Proveedores para agregar uno.
              </p>
            )}
            <div className="flex justify-end pt-2">
              <Button disabled={!selectedSupplier} onClick={goToStep2} icon={ChevronRight}>
                Siguiente: Productos
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Products */}
        {wizardStep === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Productos de <strong>{supplier?.name}</strong>. Ajusta las cantidades a ordenar.</p>
            {poItems.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl">
                <Package size={36} className="text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No hay productos asociados a este proveedor</p>
                <p className="text-xs text-gray-400">Edita los productos en inventario y asigna este proveedor</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-80 overflow-y-auto border border-gray-100 rounded-xl">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs text-gray-400 uppercase"></th>
                      <th className="px-3 py-2 text-left text-xs text-gray-400 uppercase">SKU</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-400 uppercase">Producto</th>
                      <th className="px-3 py-2 text-right text-xs text-gray-400 uppercase">Stock</th>
                      <th className="px-3 py-2 text-right text-xs text-gray-400 uppercase">Mín.</th>
                      <th className="px-3 py-2 text-right text-xs text-gray-400 uppercase">P. Compra</th>
                      <th className="px-3 py-2 text-right text-xs text-gray-400 uppercase">Sugerido</th>
                      <th className="px-3 py-2 text-right text-xs text-gray-400 uppercase">Ordenar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {poItems.map((item, idx) => (
                      <tr key={item.productId} className={item.included ? 'bg-white' : 'bg-gray-50 opacity-50'}>
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={item.included}
                            onChange={e => {
                              const updated = [...poItems]
                              updated[idx] = { ...updated[idx], included: e.target.checked }
                              setPOItems(updated)
                            }}
                            className="rounded"
                          />
                        </td>
                        <td className="px-3 py-2 text-xs font-mono text-gray-400">{item.sku || '—'}</td>
                        <td className="px-3 py-2 font-medium text-gray-900">{item.name}</td>
                        <td className="px-3 py-2 text-right">
                          <span className={item.currentStock < item.minStock ? 'text-amber-600 font-bold' : 'text-gray-700'}>{item.currentStock}</span>
                        </td>
                        <td className="px-3 py-2 text-right text-gray-500">{item.minStock}</td>
                        <td className="px-3 py-2 text-right text-gray-700">{item.purchasePrice ? Q(item.purchasePrice) : '—'}</td>
                        <td className="px-3 py-2 text-right">
                          <span className={item.suggestedQty > 0 ? 'text-amber-600 font-semibold' : 'text-gray-400'}>{item.suggestedQty}</span>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            value={item.orderedQty}
                            onChange={e => {
                              const updated = [...poItems]
                              updated[idx] = { ...updated[idx], orderedQty: Number(e.target.value) || 0 }
                              setPOItems(updated)
                            }}
                            className="w-20 text-right px-2 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={!item.included}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {poItems.length > 0 && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 flex justify-between text-sm">
                <span className="text-blue-700">{poItems.filter(i=>i.included && i.orderedQty>0).length} producto(s) incluidos</span>
                <span className="font-bold text-blue-900">Total estimado: {Q(totalCost)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2">
              <Button variant="secondary" icon={ChevronLeft} onClick={() => setWizardStep(1)}>Atrás</Button>
              <Button disabled={poItems.filter(i=>i.included && i.orderedQty>0).length===0} onClick={() => setWizardStep(3)} icon={ChevronRight}>
                Siguiente: Resumen
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Summary */}
        {wizardStep === 3 && (
          <div className="space-y-4">
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2">
              <p className="font-semibold text-gray-900">Proveedor: <span className="text-blue-700">{supplier?.name}</span></p>
              {supplier?.contact && <p className="text-sm text-gray-600">Contacto: {supplier.contact} {supplier.phone ? `· ${supplier.phone}` : ''}</p>}
            </div>
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs text-gray-400 uppercase">Producto</th>
                    <th className="px-4 py-2 text-right text-xs text-gray-400 uppercase">Cant.</th>
                    <th className="px-4 py-2 text-right text-xs text-gray-400 uppercase">P. Compra</th>
                    <th className="px-4 py-2 text-right text-xs text-gray-400 uppercase">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {poItems.filter(i => i.included && i.orderedQty > 0).map(item => (
                    <tr key={item.productId}>
                      <td className="px-4 py-2 text-gray-900">{item.name}</td>
                      <td className="px-4 py-2 text-right text-gray-700">{item.orderedQty} {item.uomPurchase}</td>
                      <td className="px-4 py-2 text-right text-gray-600">{Q(item.purchasePrice)}</td>
                      <td className="px-4 py-2 text-right font-semibold text-gray-900">{Q(item.orderedQty * item.purchasePrice)}</td>
                    </tr>
                  ))}
                  <tr className="bg-blue-50">
                    <td colSpan={3} className="px-4 py-3 text-right font-bold text-blue-900">Total:</td>
                    <td className="px-4 py-3 text-right font-bold text-blue-700 text-base">{Q(totalCost)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <Textarea label="Notas" value={poNotes} onChange={e => setPONotes(e.target.value)} placeholder="Observaciones para el proveedor, condiciones de pago, etc." rows={2} />
            <div className="flex flex-col sm:flex-row justify-between gap-3 pt-2">
              <Button variant="secondary" icon={ChevronLeft} onClick={() => setWizardStep(2)}>Atrás</Button>
              <div className="flex gap-2">
                <Button variant="secondary" icon={Clock} onClick={() => handleCreatePO('draft')}>Guardar borrador</Button>
                <Button icon={Truck} onClick={() => handleCreatePO('sent')}>Marcar como enviada</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* View PO Modal */}
      <Modal
        isOpen={!!viewModal}
        onClose={() => setViewModal(null)}
        title="Detalle de orden"
        size="lg"
      >
        {viewPO && (() => {
          const sup = suppliers.find(s => s.id === viewPO.supplierId)
          const cfg = STATUS_CONFIG[viewPO.status] || STATUS_CONFIG.draft
          const total = (viewPO.items || []).reduce((s, i) => s + (i.orderedQty || 0) * (i.purchasePrice || 0), 0)
          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-lg text-gray-900">{sup?.name || 'Proveedor'}</p>
                  <p className="text-sm text-gray-500">Fecha: {viewPO.date}</p>
                  {viewPO.receivedDate && <p className="text-sm text-gray-500">Recibida: {viewPO.receivedDate}</p>}
                </div>
                <span className={`text-sm font-semibold px-3 py-1 rounded-full ${cfg.bg}`}>{cfg.label}</span>
              </div>
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs text-gray-400 uppercase">SKU</th>
                      <th className="px-4 py-2 text-left text-xs text-gray-400 uppercase">Producto</th>
                      <th className="px-4 py-2 text-right text-xs text-gray-400 uppercase">Ordenado</th>
                      <th className="px-4 py-2 text-right text-xs text-gray-400 uppercase">P. Compra</th>
                      <th className="px-4 py-2 text-right text-xs text-gray-400 uppercase">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(viewPO.items || []).map(item => (
                      <tr key={item.productId}>
                        <td className="px-4 py-2 text-xs font-mono text-gray-400">{item.sku || '—'}</td>
                        <td className="px-4 py-2 text-gray-900">{item.name}</td>
                        <td className="px-4 py-2 text-right text-gray-700">{item.orderedQty} {item.uomPurchase || ''}</td>
                        <td className="px-4 py-2 text-right text-gray-600">{Q(item.purchasePrice)}</td>
                        <td className="px-4 py-2 text-right font-semibold">{Q((item.orderedQty||0)*(item.purchasePrice||0))}</td>
                      </tr>
                    ))}
                    <tr className="bg-blue-50">
                      <td colSpan={4} className="px-4 py-3 text-right font-bold text-blue-900">Total:</td>
                      <td className="px-4 py-3 text-right font-bold text-blue-700">{Q(total)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {viewPO.notes && <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{viewPO.notes}</p>}
              <div className="flex justify-between items-center pt-2">
                <Button variant="secondary" onClick={() => setViewModal(null)}>Cerrar</Button>
                {viewPO.status === 'sent' && (
                  <Button icon={Check} onClick={() => { setViewModal(null); openReceive(viewPO) }}>Recibir mercadería</Button>
                )}
                {viewPO.status === 'draft' && (
                  <Button icon={Truck} onClick={() => { updatePurchaseOrder(viewPO.id, { status: 'sent' }); setViewModal(null) }}>Marcar como enviada</Button>
                )}
              </div>
            </div>
          )
        })()}
      </Modal>

      {/* Receive Modal */}
      <Modal
        isOpen={!!receiveModal}
        onClose={() => { setReceiveModal(null); setReceivedQtys({}) }}
        title="Recibir mercadería"
        size="lg"
      >
        {receiveModal && (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
              <p className="text-sm font-semibold text-emerald-800">Registrar cantidades recibidas</p>
              <p className="text-xs text-emerald-600 mt-0.5">El stock se actualizará automáticamente usando el factor de conversión de cada producto</p>
            </div>
            <div className="overflow-x-auto border border-gray-100 rounded-xl">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs text-gray-400 uppercase">Producto</th>
                    <th className="px-4 py-2 text-right text-xs text-gray-400 uppercase">Ordenado</th>
                    <th className="px-4 py-2 text-right text-xs text-gray-400 uppercase">Recibido</th>
                    <th className="px-4 py-2 text-right text-xs text-gray-400 uppercase">Nuevo stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(receiveModal.items || []).map(item => {
                    const invItem = inventory.find(i => i.id === item.productId)
                    const convFactor = invItem?.conversionFactor || 1
                    const rqty = Number(receivedQtys[item.productId] || 0)
                    const newStock = (invItem?.quantity || 0) + rqty * convFactor
                    return (
                      <tr key={item.productId}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          {convFactor > 1 && (
                            <p className="text-xs text-blue-600">Factor: {convFactor} · Costo/ud: {Q((item.purchasePrice||0)/convFactor)}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">{item.orderedQty} {item.uomPurchase || ''}</td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            value={receivedQtys[item.productId] ?? item.orderedQty}
                            onChange={e => setReceivedQtys(prev => ({ ...prev, [item.productId]: e.target.value }))}
                            className="w-24 text-right px-2 py-1.5 border-2 border-emerald-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-emerald-50"
                          />
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-700">{newStock}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="secondary" onClick={() => { setReceiveModal(null); setReceivedQtys({}) }}>Cancelar</Button>
              <Button icon={CheckCircle} onClick={handleReceive}>Confirmar recepción</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
