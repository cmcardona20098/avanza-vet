import { useParams, useNavigate } from 'react-router-dom'
import { PawPrint, User, Phone, Mail, MapPin, ArrowLeft, MessageCircle, Edit, AlertTriangle, Calendar } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Card, { CardHeader } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3">
      <Icon size={15} className="text-gray-400 mt-0.5 shrink-0" />
      <div><p className="text-xs text-gray-500">{label}</p><p className="text-sm font-medium text-gray-800">{value}</p></div>
    </div>
  )
}

export default function PetProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { pets, owners, medicalRecords } = useApp()

  const pet   = pets.find(p => p.id === id)
  const owner = owners.find(o => o.id === pet?.ownerId)
  const petRecords = medicalRecords.filter(r => r.petId === id)

  if (!pet) {
    return (
      <div className="max-w-xl mx-auto text-center py-20">
        <PawPrint size={48} className="text-gray-200 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Mascota no encontrada</h2>
        <Button onClick={() => navigate('/mascotas')} icon={ArrowLeft} variant="secondary">Volver a mascotas</Button>
      </div>
    )
  }

  const hasAllergy = pet.allergies && !['Ninguna', 'Ninguna conocida', ''].includes(pet.allergies)
  const waNumber = owner?.whatsapp?.replace(/\D/g, '') || owner?.phone?.replace(/\D/g, '')
  const waUrl = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(`Hola ${owner?.name}, queríamos saber cómo sigue ${pet.name}. 🐾`)}`
    : '#'

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <button onClick={() => navigate('/mascotas')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors">
        <ArrowLeft size={16} /> Volver a mascotas
      </button>

      {/* Hero */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center shrink-0">
            <PawPrint size={48} className="text-primary-500" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{pet.name}</h1>
                <p className="text-gray-500 text-sm">{pet.breed} · {pet.species}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {pet.sex    && <Badge variant={pet.sex === 'Macho' ? 'blue' : 'purple'}>{pet.sex}</Badge>}
                  {pet.age    && <Badge variant="gray">{pet.age} años</Badge>}
                  {pet.weight && <Badge variant="gray">{pet.weight} kg</Badge>}
                  {pet.color  && <Badge variant="gray">{pet.color}</Badge>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" icon={Edit}>Editar</Button>
                <a href={waUrl} target="_blank" rel="noreferrer">
                  <Button variant="whatsapp" size="sm" icon={MessageCircle}>WhatsApp</Button>
                </a>
              </div>
            </div>
            {hasAllergy && (
              <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertTriangle size={14} className="text-red-600 shrink-0" />
                <p className="text-xs font-medium text-red-700">Alergia: {pet.allergies}</p>
              </div>
            )}
            {pet.notes && <p className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">{pet.notes}</p>}
          </div>
        </div>
      </Card>

      {/* Dueño */}
      {owner && (
        <Card>
          <CardHeader title="Dueño" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow icon={User}   label="Nombre"    value={owner.name}    />
            <InfoRow icon={Phone}  label="Teléfono"  value={owner.phone}   />
            <InfoRow icon={Mail}   label="Email"     value={owner.email}   />
            <InfoRow icon={MapPin} label="Dirección" value={owner.address} />
          </div>
        </Card>
      )}

      {/* Historial médico */}
      <Card>
        <CardHeader
          title="Historial médico"
          subtitle={petRecords.length > 0 ? `${petRecords.length} consulta(s)` : 'Sin consultas registradas'}
          action={<Button size="sm" variant="ghost" onClick={() => navigate('/historial')}>Ver historial</Button>}
        />
        {petRecords.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Sin registros médicos aún</p>
        ) : (
          <div className="space-y-3">
            {petRecords.slice().reverse().slice(0, 3).map(r => {
              const isStructured = r.autoCreated || Array.isArray(r.medicationsList)
              const billingBadge = r.billingStatus === 'paid'
                ? { label: '✓ Cobrado', cls: 'bg-green-100 text-green-700' }
                : r.billingStatus === 'pending'
                ? { label: '⏳ Por cobrar', cls: 'bg-yellow-100 text-yellow-700' }
                : null
              return (
                <div key={r.id} className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-wrap justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-gray-900 text-sm">{r.reason || 'Consulta médica'}</p>
                      {billingBadge && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${billingBadge.cls}`}>{billingBadge.label}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full">
                      <Calendar size={11} /> {r.date}
                    </div>
                  </div>
                  {r.diagnosis && <p className="text-sm text-gray-700 mb-1"><span className="font-medium text-gray-500">Dx:</span> {r.diagnosis}</p>}
                  {isStructured && r.medicationsList?.length > 0 && (
                    <p className="text-xs text-gray-500">
                      💊 {r.medicationsList.map(m => m.name).join(', ')}
                    </p>
                  )}
                  {isStructured && r.vaccinesList?.length > 0 && (
                    <p className="text-xs text-gray-500">
                      💉 {r.vaccinesList.map(v => v.name).join(', ')}
                    </p>
                  )}
                  {!isStructured && r.medications && (
                    <p className="text-xs text-gray-500">💊 {r.medications}</p>
                  )}
                  {r.vet && <p className="text-xs text-gray-400 mt-1">Dr/a: {r.vet}</p>}
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
