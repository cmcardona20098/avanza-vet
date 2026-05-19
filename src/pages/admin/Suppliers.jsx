import { useState } from 'react'
import { Plus, Edit2, Trash2, Truck, Phone, Mail, MapPin, User, Package, ClipboardList, X, AlertTriangle, CheckCircle } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input, { Textarea } from '../../components/ui/Input'
import { useNavigate } from 'react-router-dom'

const emptyForm = {
  name: '', contact: '', phone: '', email: '', address: '', notes: '',
}

export default function Suppliers() {
  const { suppliers, inventory, addSupplier, updateSupplier, deleteSupplier } = useApp()
  const navigate = useNavigate()

  const [showModal, setShowModal]       = useState(false)
  const [editingItem, setEditingItem]   = useState(null)
  const [form, setForm]                 = useState(emptyForm)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [viewProducts, setViewProducts] = useState(null) // supplier id

  function openAdd() {
    setEditingItem(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  function openEdit(supplier) {
    setEditingItem(supplier)
    setForm({
      name:    supplier.name    || '',
      contact: supplier.contact || '',
      phone:   supplier.phone   || '',
      email:   supplier.email   || '',
      address: supplier.address || '',
      notes:   supplier.notes   || '',
    })
    setShowModal(true)
  }

  function handleSave(e) {
    e.preventDefault()
    if (editingItem) {
      updateSupplier(editingItem.id, { ...form })
    } else {
      addSupplier({ ...form })
    }
    setShowModal(false)
    setEditingItem(null)
  }

  function getSupplierProducts(supplierId) {
    return inventory.filter(i => i.supplierId === supplierId)
  }

  const Q = (n) => `Q${Number(n || 0).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const viewingProducts = viewProducts ? getSupplierProducts(viewProducts) : []
  const viewingSupplier = suppliers.find(s => s.id === viewProducts)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Truck size={20} className="text-blue-600" /> Proveedores
          </h2>
          <p className="text-sm text-gray-500">{suppliers.length} proveedor(es) registrado(s)</p>
        </div>
        <Button icon={Plus} onClick={openAdd}>Agregar proveedor</Button>
      </div>

      {/* Supplier cards grid */}
      {suppliers.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <Truck size={48} className="text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-500 mb-2">Sin proveedores registrados</h3>
          <p className="text-sm text-gray-400 mb-5">Agrega tus proveedores para gestionar órdenes de compra</p>
          <Button icon={Plus} onClick={openAdd}>Agregar primer proveedor</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {suppliers.map(supplier => {
            const products = getSupplierProducts(supplier.id)
            return (
              <div key={supplier.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* Card header */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <Truck size={18} className="text-white" />
                    </div>
                    <Badge variant="blue" className="bg-white/20 text-white border-white/30 text-xs">
                      {products.length} producto(s)
                    </Badge>
                  </div>
                  <h3 className="text-white font-bold text-lg mt-3 leading-tight">{supplier.name}</h3>
                </div>

                {/* Card body */}
                <div className="p-5 space-y-2.5">
                  {supplier.contact && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User size={13} className="text-gray-400 shrink-0" />
                      <span className="truncate">{supplier.contact}</span>
                    </div>
                  )}
                  {supplier.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone size={13} className="text-gray-400 shrink-0" />
                      <span>{supplier.phone}</span>
                    </div>
                  )}
                  {supplier.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail size={13} className="text-gray-400 shrink-0" />
                      <span className="truncate">{supplier.email}</span>
                    </div>
                  )}
                  {supplier.address && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin size={13} className="text-gray-400 shrink-0" />
                      <span className="truncate">{supplier.address}</span>
                    </div>
                  )}
                  {supplier.notes && (
                    <p className="text-xs text-gray-400 italic bg-gray-50 rounded-lg px-3 py-2 mt-2">{supplier.notes}</p>
                  )}
                </div>

                {/* Card actions */}
                <div className="border-t border-gray-100 px-5 py-3 flex gap-2">
                  <Button
                    variant="secondary"
                    className="flex-1 justify-center text-xs py-1.5"
                    icon={Package}
                    onClick={() => setViewProducts(supplier.id)}
                  >
                    Ver productos
                  </Button>
                  <Button
                    variant="secondary"
                    className="flex-1 justify-center text-xs py-1.5"
                    icon={ClipboardList}
                    onClick={() => navigate(`/ordenes-compra?supplier=${supplier.id}`)}
                  >
                    Generar OC
                  </Button>
                  <button
                    onClick={() => openEdit(supplier)}
                    className="w-8 h-8 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 flex items-center justify-center transition-colors"
                    title="Editar"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(supplier)}
                    className="w-8 h-8 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingItem(null) }}
        title={editingItem ? 'Editar proveedor' : 'Agregar proveedor'}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Nombre del proveedor" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej. Farmacéutica Guatemala S.A." />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Persona de contacto" value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} placeholder="Ej. Carlos García" />
            <Input label="Teléfono" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Ej. +502 2234-5678" />
          </div>
          <Input label="Correo electrónico" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Ej. ventas@proveedor.com" />
          <Input label="Dirección" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Ej. Zona 10, Guatemala" />
          <Textarea label="Observaciones" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notas adicionales, condiciones de pago, etc." rows={3} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" type="button" onClick={() => { setShowModal(false); setEditingItem(null) }}>Cancelar</Button>
            <Button type="submit" icon={editingItem ? CheckCircle : Plus}>{editingItem ? 'Guardar cambios' : 'Agregar'}</Button>
          </div>
        </form>
      </Modal>

      {/* Ver productos modal */}
      <Modal
        isOpen={!!viewProducts}
        onClose={() => setViewProducts(null)}
        title={`Productos de ${viewingSupplier?.name || ''}`}
        size="lg"
      >
        {viewingProducts.length === 0 ? (
          <div className="text-center py-10">
            <Package size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">Este proveedor no tiene productos asociados</p>
            <p className="text-xs text-gray-400 mt-1">Edita un producto en inventario y selecciona este proveedor</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Producto</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">P. Compra</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">P. Público</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {viewingProducts.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs font-mono text-gray-500">{item.sku || '—'}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      {item.brand && <p className="text-xs text-gray-400">{item.brand}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${(item.quantity||0) < (item.minStock||0) ? 'text-amber-600' : 'text-gray-900'}`}>{item.quantity || 0}</span>
                      {item.uomSale && <span className="text-xs text-gray-400 ml-1">{item.uomSale}</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{item.purchasePrice ? Q(item.purchasePrice) : '—'}</td>
                    <td className="px-4 py-3 font-semibold text-blue-700">{item.price ? Q(item.price) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex justify-end mt-4">
          <Button onClick={() => { setViewProducts(null); navigate(`/ordenes-compra?supplier=${viewProducts}`) }} icon={ClipboardList}>
            Generar OC para este proveedor
          </Button>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Eliminar proveedor" size="sm">
        {deleteConfirm && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle size={18} className="text-red-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-800">¿Eliminar "{deleteConfirm.name}"?</p>
                <p className="text-xs text-red-600 mt-1">Los productos asociados perderán la referencia al proveedor. Esta acción no se puede deshacer.</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white" icon={Trash2} onClick={() => { deleteSupplier(deleteConfirm.id); setDeleteConfirm(null) }}>Eliminar</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
