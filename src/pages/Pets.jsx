import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, PawPrint, Pencil, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import Input, { Select, Textarea } from '../components/ui/Input'
import Card from '../components/ui/Card'

const DOG_BREEDS = [
  'Mestizo/Criollo','Labrador Retriever','Golden Retriever','Pastor Alemán','Bulldog','Poodle',
  'Chihuahua','Beagle','Rottweiler','Yorkshire Terrier','Boxer','Husky Siberiano','Pug','Shih Tzu',
  'Maltés','Dobermann','Dachshund','Border Collie','Schnauzer','Gran Danés','Cocker Spaniel',
  'Bichón Frisé','Shar Pei','Samoyedo','Otro',
]
const CAT_BREEDS = [
  'Mestizo/Criollo','Persa','Siamés','Maine Coon','Ragdoll','Bengalí',
  'Sphynx','Abisinio','Birmano','Scottish Fold','Angora','Europeo Común','Otro',
]
const PET_COLORS = [
  'Negro','Blanco','Café','Gris','Dorado','Crema','Naranja',
  'Tricolor','Manchado','Atigrado','Bicolor','Rojo','Azul acero','Otro',
]

function calcAgeFromBirth(dateStr) {
  if (!dateStr) return ''
  const birth = new Date(dateStr)
  const now   = new Date()
  const years = (now - birth) / (1000 * 60 * 60 * 24 * 365.25)
  if (isNaN(years) || years < 0) return ''
  if (years < 1) return (Math.round(years * 12) / 12).toFixed(1)
  return Math.floor(years).toString()
}

const sexColors   = { Macho: 'blue', Hembra: 'purple' }
const reproColors = { Entero: 'gray', Esterilizado: 'green', Castrado: 'blue', Otro: 'yellow' }

function displayAge(pet) {
  if (pet.age) return `${pet.age} años`
  if (pet.birthDate) {
    const a = calcAgeFromBirth(pet.birthDate)
    return a ? `${a} años` : null
  }
  return null
}

export default function Pets() {
  const navigate = useNavigate()
  const { pets, owners, deletePet } = useApp()
  const [search, setSearch]         = useState('')
  const [showModal, setShowModal]   = useState(false)
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
        <input type="text" placeholder="Buscar por nombre, raza o dueño..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
            const owner  = getOwner(pet.ownerId)
            const ageStr = displayAge(pet)
            return (
              <Card key={pet.id} padding={false} className="hover:shadow-md hover:border-blue-200 transition-all duration-200">
                <div className="p-5 cursor-pointer" onClick={() => navigate(`/mascotas/${pet.id}`)}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shrink-0">
                      <PawPrint size={28} className="text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900">{pet.name}</h3>
                      <p className="text-xs text-gray-500 truncate">{pet.breed}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {ageStr && <div className="flex justify-between"><span className="text-xs text-gray-500">Edad</span><span className="text-xs font-medium text-gray-700">{ageStr}</span></div>}
                    {pet.weight && <div className="flex justify-between"><span className="text-xs text-gray-500">Peso</span><span className="text-xs font-medium text-gray-700">{pet.weight} kg</span></div>}
                    {pet.sex    && <div className="flex justify-between"><span className="text-xs text-gray-500">Sexo</span><Badge variant={sexColors[pet.sex] || 'gray'}>{pet.sex}</Badge></div>}
                    {pet.reproductiveStatus && <div className="flex justify-between"><span className="text-xs text-gray-500">Estado rep.</span><Badge variant={reproColors[pet.reproductiveStatus] || 'gray'}>{pet.reproductiveStatus}</Badge></div>}
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
                  <button onClick={() => navigate(`/mascotas/${pet.id}`)} className="flex-1 text-xs font-medium text-blue-600 hover:bg-blue-50 py-1.5 px-3 rounded-lg transition-colors">
                    Ver perfil
                  </button>
                  <button onClick={e => { e.stopPropagation(); setEditingPet(pet); setShowModal(true) }}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                    <Pencil size={14} />
                  </button>
                  <button onClick={e => { e.stopPropagation(); setConfirmDelete(pet) }}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
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

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingPet(null) }}
        title={editingPet ? 'Editar mascota' : 'Registrar nueva mascota'} size="lg">
        <PetForm onClose={() => { setShowModal(false); setEditingPet(null) }} editingPet={editingPet} />
      </Modal>

      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Eliminar mascota">
        <div className="space-y-4">
          <p className="text-gray-700">¿Eliminar a <strong>{confirmDelete?.name}</strong>? Esta acción no se puede deshacer.</p>
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
  const [species,   setSpecies]   = useState(editingPet?.species || 'Perro')
  const [birthDate, setBirthDate] = useState(editingPet?.birthDate || '')
  const [autoAge,   setAutoAge]   = useState(editingPet?.birthDate ? calcAgeFromBirth(editingPet.birthDate) : '')

  const breeds = species === 'Gato' ? CAT_BREEDS : DOG_BREEDS

  function onBirthChange(val) {
    setBirthDate(val)
    setAutoAge(calcAgeFromBirth(val))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const fd = new FormData(e.target)
    let ownerId = fd.get('ownerId')

    if (ownerMode === 'new') {
      const newOwner = addOwner({
        name:     fd.get('newOwnerName'),
        phone:    fd.get('newOwnerPhone'),
        whatsapp: fd.get('newOwnerWhatsapp'),
        email:    fd.get('newOwnerEmail'),
        address:  fd.get('newOwnerAddress'),
      })
      ownerId = newOwner.id
    }

    const ageVal = fd.get('age') || autoAge || ''
    const petData = {
      name:               fd.get('name'),
      species,
      breed:              fd.get('breed'),
      sex:                fd.get('sex'),
      birthDate,
      age:                ageVal,
      weight:             fd.get('weight'),
      color:              fd.get('color'),
      reproductiveStatus: fd.get('reproductiveStatus'),
      ownerId,
      allergies:          fd.get('allergies'),
      notes:              fd.get('notes'),
    }

    if (editingPet) updatePet(editingPet.id, petData)
    else addPet(petData)
    onClose()
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Nombre de la mascota" name="name" placeholder="Ej. Luke" required defaultValue={editingPet?.name} />

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Especie</label>
          <select name="species" value={species} onChange={e => setSpecies(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>Perro</option><option>Gato</option><option>Ave</option><option>Conejo</option><option>Otro</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Raza</label>
          <input name="breed" list="breed-list-pet" placeholder="Escribe o selecciona raza..."
            defaultValue={editingPet?.breed}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <datalist id="breed-list-pet">
            {breeds.map(b => <option key={b} value={b} />)}
          </datalist>
        </div>

        <Select label="Sexo" name="sex" defaultValue={editingPet?.sex}>
          <option>Macho</option><option>Hembra</option>
        </Select>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Fecha de nacimiento</label>
          <input name="birthDate" type="date" value={birthDate} onChange={e => onBirthChange(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {autoAge && (
            <p className="text-xs text-emerald-600 mt-1 font-medium">✓ Edad calculada: {autoAge} años</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Edad (años)</label>
          <input name="age" type="number" min="0" step="0.1"
            placeholder={autoAge ? `Auto: ${autoAge}` : 'Ej. 3'}
            defaultValue={editingPet?.age}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {autoAge && !editingPet?.age && <p className="text-xs text-gray-400 mt-1">Deja vacío para usar la edad calculada</p>}
        </div>

        <Input label="Peso (kg)" name="weight" type="number" step="0.1" placeholder="Ej. 10.5" defaultValue={editingPet?.weight} />

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Color</label>
          <input name="color" list="color-list-pet" placeholder="Selecciona o escribe..."
            defaultValue={editingPet?.color}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <datalist id="color-list-pet">
            {PET_COLORS.map(c => <option key={c} value={c} />)}
          </datalist>
        </div>

        <Select label="Estado reproductivo" name="reproductiveStatus" defaultValue={editingPet?.reproductiveStatus}>
          <option value="">— Seleccionar —</option>
          <option>Entero</option><option>Esterilizado</option><option>Castrado</option><option>Otro</option>
        </Select>

        <Input label="Alergias" name="allergies" placeholder="Ej. Penicilina" defaultValue={editingPet?.allergies} />
      </div>

      <div className="border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700">Dueño</p>
          {owners.length > 0 && !editingPet && (
            <div className="flex gap-1">
              <button type="button" onClick={() => setOwnerMode('existing')}
                className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${ownerMode === 'existing' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                Existente
              </button>
              <button type="button" onClick={() => setOwnerMode('new')}
                className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${ownerMode === 'new' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
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
              <p className="text-xs text-gray-500 col-span-2">No hay dueños registrados. Ingresa los datos:</p>
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
