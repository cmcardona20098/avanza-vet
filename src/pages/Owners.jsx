import { useState } from 'react'
import { Plus, Search, Phone, Mail, MapPin, PawPrint, MessageCircle, Pencil, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input, { Textarea } from '../components/ui/Input'

export default function Owners() {
  const { owners, pets, addOwner, updateOwner, deleteOwner } = useApp()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingOwner, setEditingOwner] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  function getOwnerPets(id) { return pets.filter(p => p.ownerId === id) }

  const filtered = owners.filter(o =>
    o.name?.toLowerCase().includes(search.toLowerCase()) ||
    o.email?.toLowerCase().includes(search.toLowerCase()) ||
    o.phone?.includes(search)
  )

  function handleSubmit(e) {
    e.preventDefault()
    const fd = new FormData(e.target)
    const data = {
      name:     fd.get('name'),
      phone:    fd.get('phone'),
      whatsapp: fd.get('whatsapp'),
      email:    fd.get('email'),
      address:  fd.get('address'),
    }
    if (editingOwner) {
      updateOwner(editingOwner.id, data)
    } else {
      addOwner(data)
    }
    setShowModal(false)
    setEditingOwner(null)
    e.target.reset()
  }

  function openAdd()         { setEditingOwner(null); setShowModal(true) }
  function openEdit(owner)   { setEditingOwner(owner); setShowModal(true) }
  function closeModal()      { setShowModal(false); setEditingOwner(null) }

  function handleDelete(owner) {
    deleteOwner(owner.id)
    setConfirmDelete(null)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Dueños</h2>
          <p className="text-sm text-gray-500">{owners.length} propietario(s)</p>
        </div>
        <Button icon={Plus} onClick={openAdd}>Nuevo dueño</Button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
      </div>

      {owners.length === 0 ? (
        <div className="text-center py-20">
          <PawPrint size={48} className="text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No hay dueños registrados</p>
          <p className="text-gray-400 text-sm mb-4">Registra el primer dueño para comenzar</p>
          <Button icon={Plus} onClick={openAdd}>Registrar primer dueño</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(owner => {
            const ownerPets = getOwnerPets(owner.id)
            const wa = owner.whatsapp?.replace(/\D/g, '') || owner.phone?.replace(/\D/g, '')
            return (
              <Card key={owner.id}>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center shrink-0">
                    <span className="text-xl font-bold text-purple-600">
                      {owner.name?.split(' ').map(n => n[0]).slice(0, 2).join('') || '?'}
                    </span>
                  </div>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <h3 className="font-bold text-gray-900">{owner.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Desde: {owner.createdAt}</p>
                    </div>
                    <div className="space-y-1.5">
                      {owner.phone   && <div className="flex items-center gap-2"><Phone size={12} className="text-gray-400 shrink-0" /><span className="text-sm text-gray-700">{owner.phone}</span></div>}
                      {owner.email   && <div className="flex items-center gap-2"><Mail size={12} className="text-gray-400 shrink-0" /><span className="text-sm text-gray-700 truncate">{owner.email}</span></div>}
                      {owner.address && <div className="flex items-start gap-2"><MapPin size={12} className="text-gray-400 shrink-0 mt-0.5" /><span className="text-xs text-gray-500 line-clamp-2">{owner.address}</span></div>}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Mascotas</p>
                      {ownerPets.length === 0
                        ? <p className="text-xs text-gray-400">Sin mascotas registradas</p>
                        : <div className="flex flex-wrap gap-1">
                            {ownerPets.map(p => (
                              <span key={p.id} className="inline-flex items-center gap-1 text-xs bg-primary-50 text-primary-700 border border-primary-200 px-2 py-0.5 rounded-full">
                                <PawPrint size={9} /> {p.name}
                              </span>
                            ))}
                          </div>
                      }
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col gap-2 items-end">
                    {wa && (
                      <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer">
                        <Button variant="whatsapp" size="sm" icon={MessageCircle}>WhatsApp</Button>
                      </a>
                    )}
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(owner)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setConfirmDelete(owner)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal isOpen={showModal} onClose={closeModal} title={editingOwner ? 'Editar dueño' : 'Registrar nuevo dueño'}>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input label="Nombre completo" name="name" placeholder="Ej. Carlos Mendoza" required defaultValue={editingOwner?.name} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Teléfono" name="phone" type="tel" placeholder="+502 1234 5678" required defaultValue={editingOwner?.phone} />
            <Input label="WhatsApp" name="whatsapp" type="tel" placeholder="+502 1234 5678" defaultValue={editingOwner?.whatsapp} />
          </div>
          <Input label="Correo electrónico" name="email" type="email" placeholder="nombre@email.com" defaultValue={editingOwner?.email} />
          <Textarea label="Dirección" name="address" placeholder="Dirección completa..." defaultValue={editingOwner?.address} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" type="button" onClick={closeModal}>Cancelar</Button>
            <Button type="submit" icon={Plus}>{editingOwner ? 'Guardar cambios' : 'Registrar dueño'}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Eliminar dueño">
        <div className="space-y-4">
          <p className="text-gray-700">¿Estás seguro de eliminar a <strong>{confirmDelete?.name}</strong>?</p>
          {getOwnerPets(confirmDelete?.id).length > 0 && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Este dueño tiene {getOwnerPets(confirmDelete?.id).length} mascota(s) asociada(s). Las mascotas quedarán sin dueño asignado.
            </p>
          )}
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button variant="danger" icon={Trash2} onClick={() => handleDelete(confirmDelete)}>Eliminar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
