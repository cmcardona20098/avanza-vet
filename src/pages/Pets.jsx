import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, PawPrint, Pencil, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import Input, { Select, Textarea } from '../components/ui/Input'
import Card from '../components/ui/Card'

const sexColors = { Macho: 'blue', Hembra: 'purple' }

export default function Pets() {
  const navigate = useNavigate()
  const { pets, owners, deletePet } = useApp()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingPet, setEditingPet] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  function getOwner(id) { return owners.find(o => o.id === id) }

  const filtered = pets.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.breed?.toLowerCase().includes(search.toLowerCase()) ||
    getOwner(p.ownerId)?.name?.toLowerCase().includes(search.toLowerCase())
  )

  function handleDelete(pet) {
    deletePet(pet.id)
    setConfirmDelete(null)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Mascotas registradas</h2>
          <p className="text-sm text-gray-500">{pets.length} paciente(s)</p>
        </div>
        <Button icon={Plus} onClick={() => { setEditingPet(null); setShowModal(true) }}>Nueva mascota</Button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Buscar por nombre, raza o dueño..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
      </div>

      {pets.length === 0 ? (
        <div className="text-center py-20">
          <PawPrint size={48} className="text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No hay mascotas registradas</p>
          <p className="text-gray-400 text-sm mb-4">Empieza registrando la primera mascota</p>
          <Button icon={Plus} onClick={() => { setEditingPet(null); setShowModal(true) }}>Registrar primera mascota</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(pet => {
            const owner = getOwner(pet.ownerId)
            return (
              <Card key={pet.id} padding={false} className="hover:shadow-md hover:border-primary-200 transition-all duration-200">
                <div className="p-5 cursor-pointer" onClick={() => navigate(`/mascotas/${pet.id}`)}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center shrink-0">
                      <PawPrint size={28} className="text-primary-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900">{pet.name}</h3>
                      <p className="text-xs text-gray-500 truncate">{pet.breed}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {pet.age    && <div className="flex justify-between"><span className="text-xs text-gray-500">Edad</span><span className="text-xs font-medium text-gray-700">{pet.age} años</span></div>}
                    {pet.weight && <div className="flex justify-between"><span className="text-xs text-gray-500">Peso</span><span className="text-xs font-medium text-gray-700">{pet.weight} kg</span></div>}
                    {pet.sex    && <div className="flex justify-between"><span className="text-xs text-gray-500">Sexo</span><Badge variant={sexColors[pet.sex]}>{pet.sex}</Badge></div>}
                  </div>
                  {owner && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-500">Dueño</p>
                      <p className="text-sm font-medium text-gray-800 truncate">{owner.name}</p>
                    </div>
                  )}
                  {pet.allergies && !['Ninguna', 'Ninguna conocida', ''].includes(pet.allergies) && (
                    <div className="mt-3"><Badge variant="red">⚠ {pet.allergies}</Badge></div>
                  )}
                </div>
                <div className="px-5 pb-4 flex gap-2 border-t border-gray-50 pt-3">
                  <button onClick={() => navigate(`/mascotas/${pet.id}`)} className="flex-1 text-xs font-medium text-primary-600 hover:bg-primary-50 py-1.5 px-3 rounded-lg transition-colors">
                    Ver perfil
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); setEditingPet(pet); setShowModal(true) }}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); setConfirmDelete(pet) }}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </Card>
            )
          })}
          {filtered.length === 0 && search && (
            <div className="col-span-full text-center py-10">
              <p className="text-gray-400">Sin resultados para "{search}"</p>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingPet(null) }} title={editingPet ? 'Editar mascota' : 'Registrar nueva mascota'} size="lg">
        <PetForm onClose={() => { setShowModal(false); setEditingPet(null) }} editingPet={editingPet} />
      </Modal>

      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Eliminar mascota">
        <div className="space-y-4">
          <p className="text-gray-700">¿Estás seguro de que deseas eliminar a <strong>{confirmDelete?.name}</strong>? Esta acción no se puede deshacer.</p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button variant="danger" icon={Trash2} onClick={() => handleDelete(confirmDelete)}>Eliminar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function PetForm({ onClose, editingPet }) {
  const { owners, addOwner, addPet, updatePet } = useApp()
  const [ownerMode, setOwnerMode] = useState(editingPet ? 'existing' : (owners.length === 0 ? 'new' : 'existing'))

  function handleSubmit(e) {
    e.preventDefault()
    const fd = new FormData(e.target)
    let ownerId = fd.get('ownerId')

    if (ownerMode === 'new') {
      const newOwner = addOwner({
        name: fd.get('newOwnerName'),
        phone: fd.get('newOwnerPhone'),
        whatsapp: fd.get('newOwnerWhatsapp'),
        email: fd.get('newOwnerEmail'),
        address: fd.get('newOwnerAddress'),
      })
      ownerId = newOwner.id
    }

    const petData = {
      name:      fd.get('name'),
      species:   fd.get('species'),
      breed:     fd.get('breed'),
      sex:       fd.get('sex'),
      birthDate: fd.get('birthDate'),
      age:       fd.get('age'),
      weight:    fd.get('weight'),
      color:     fd.get('color'),
      ownerId,
      allergies: fd.get('allergies'),
      notes:     fd.get('notes'),
    }

    if (editingPet) {
      updatePet(editingPet.id, petData)
    } else {
      addPet(petData)
    }
    onClose()
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Nombre de la mascota" name="name" placeholder="Ej. Luke" required defaultValue={editingPet?.name} />
        <Select label="Especie" name="species" defaultValue={editingPet?.species}>
          <option>Perro</option><option>Gato</option><option>Otro</option>
        </Select>
        <Input label="Raza" name="breed" placeholder="Ej. Labrador Retriever" defaultValue={editingPet?.breed} />
        <Select label="Sexo" name="sex" defaultValue={editingPet?.sex}>
          <option>Macho</option><option>Hembra</option>
        </Select>
        <Input label="Fecha de nacimiento" name="birthDate" type="date" defaultValue={editingPet?.birthDate} />
        <Input label="Edad (años)" name="age" type="number" min="0" step="0.1" placeholder="Ej. 3" defaultValue={editingPet?.age} />
        <Input label="Peso (kg)" name="weight" type="number" step="0.1" placeholder="Ej. 10.5" defaultValue={editingPet?.weight} />
        <Input label="Color" name="color" placeholder="Ej. Dorado" defaultValue={editingPet?.color} />
        <Input label="Alergias" name="allergies" placeholder="Ej. Penicilina" defaultValue={editingPet?.allergies} />
      </div>

      {/* Sección dueño */}
      <div className="border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700">Dueño</p>
          {owners.length > 0 && !editingPet && (
            <div className="flex gap-1">
              <button type="button" onClick={() => setOwnerMode('existing')}
                className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${ownerMode === 'existing' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                Existente
              </button>
              <button type="button" onClick={() => setOwnerMode('new')}
                className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${ownerMode === 'new' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                Nuevo dueño
              </button>
            </div>
          )}
        </div>

        {ownerMode === 'existing' && owners.length > 0 ? (
          <Select label="" name="ownerId" required defaultValue={editingPet?.ownerId}>
            <option value="">— Seleccionar dueño —</option>
            {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </Select>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ownerMode === 'existing' && owners.length === 0 && (
              <p className="text-xs text-gray-500 col-span-2">No hay dueños registrados. Ingresa los datos del nuevo dueño:</p>
            )}
            <Input label="Nombre completo *" name="newOwnerName" placeholder="Ej. Carlos Mendoza" required={ownerMode === 'new' || owners.length === 0} />
            <Input label="Teléfono *" name="newOwnerPhone" type="tel" placeholder="+502 1234 5678" required={ownerMode === 'new' || owners.length === 0} />
            <Input label="WhatsApp" name="newOwnerWhatsapp" type="tel" placeholder="+502 1234 5678" />
            <Input label="Correo electrónico" name="newOwnerEmail" type="email" placeholder="nombre@email.com" />
            <Textarea label="Dirección" name="newOwnerAddress" placeholder="Dirección completa..." className="col-span-2" />
          </div>
        )}
      </div>

      <Textarea label="Observaciones" name="notes" placeholder="Notas importantes..." defaultValue={editingPet?.notes} />
      <div className="flex gap-3 justify-end pt-2">
        <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
        <Button type="submit" icon={Plus}>{editingPet ? 'Guardar cambios' : 'Registrar mascota'}</Button>
      </div>
    </form>
  )
}
