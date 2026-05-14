import { useParams, useNavigate } from 'react-router-dom'
import {
  PawPrint, User, Phone, Mail, MapPin, ArrowLeft, MessageCircle,
  Edit, AlertTriangle, Calendar, Syringe, Activity, CheckCircle, Clock
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import Card, { CardHeader } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'

function calcAgeFromBirth(dateStr) {
  if (!dateStr) return null
  const birth = new Date(dateStr)
  const now   = new Date()
  const years = (now - birth) / (1000 * 60 * 60 * 24 * 365.25)
  if (isNaN(years) || years < 0) return null
  if (years < 1) return `${Math.round(years * 12)} meses`
  return `${Math.floor(years)} años`
}

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3">
      <Icon size={15} className="text-gray-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-800">{value}</p>
      </div>
    </div>
  )
}

const statusCfg = {
  current:  { label: 'Al día',  variant: 'green',  Icon: CheckCircle   },
  due_soon: { label: 'Pronto',  variant: 'yellow', Icon: Clock         },
  overdue:  { label: 'Vencida', variant: 'red',    Icon: AlertTriangle },
}
const reproColors = { Entero: 'gray', Esterilizado: 'green', Castrado: 'blue', Otro: 'yellow' }

export default function PetProfile() {
  const { id }  = useParams()
  const navigate = useNavigate()
  const { pets, owners, medicalRecords, vaccineRecords, dewormingRecords } = useApp()

  const pet        = pets.find(p => p.id === id)
  const owner      = owners.find(o => o.id === pet?.ownerId)
  const petRecords = medicalRecords.filter(r => r.petId === id)
  const petVax     = vaccineRecords.filter(v => v.petId === id).sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate))
  const petDew     = dewormingRecords.filter(d => d.petId === id).sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate))

  if (!pet) {
    return (
      <div className="max-w-xl mx-auto text-center py-20">
        <PawPrint size={48} className="text-gray-200 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Mascota no encontrada</h2>
        <Button onClick={() => navigate('/mascotas')} icon={ArrowLeft} variant="secondary">Volver</Button>
      </div>
    )
  }

  const hasAllergy = pet.allergies && !['Ninguna', 'Ninguna conocida', ''].includes(pet.allergies)
  const waNumber   = owner?.whatsapp?.replace(/\D/g, '') || owner?.phone?.replace(/\D/g, '')
  const waUrl      = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(`Hola ${owner?.name}, queríamos saber cómo sigue ${pet.name}. 🐾`)}`
    : '#'
  const displayAge = pet.age ? `${pet.age} años` : calcAgeFromBirth(pet.birthDate)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <button onClick={() => navigate('/mascotas')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors">
        <ArrowLeft size={16} /> Volver a mascotas
      </button>

      {/* Hero */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shrink-0">
            <PawPrint size={48} className="text-blue-500" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{pet.name}</h1>
                <p className="text-gray-500 text-sm">{pet.breed} · {pet.species}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {pet.sex    && <Badge variant={pet.sex === 'Macho' ? 'blue' : 'purple'}>{pet.sex}</Badge>}
                  {displayAge && <Badge variant="gray">{displayAge}</Badge>}
                  {pet.weight && <Badge variant="gray">{pet.weight} kg</Badge>}
                  {pet.color  && <Badge variant="gray">{pet.color}</Badge>}
                  {pet.reproductiveStatus && <Badge variant={reproColors[pet.reproductiveStatus] || 'gray'}>{pet.reproductiveStatus}</Badge>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" icon={Edit}>Editar</Button>
                {waNumber && (
                  <a href={waUrl} target="_blank" rel="noreferrer">
                    <Button variant="whatsapp" size="sm" icon={MessageCircle}>WhatsApp</Button>
                  </a>
                )}
              </div>
            </div>
            {hasAllergy && (
              <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                <AlertTriangle size={14} className="text-red-600 shrink-0" />
                <p className="text-xs font-medium text-red-700">⚠ Alergia conocida: {pet.allergies}</p>
              </div>
            )}
            {pet.birthDate && <p className="mt-2 text-xs text-gray-400">Fecha de nacimiento: {pet.birthDate}</p>}
            {pet.notes && <p className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2">{pet.notes}</p>}
          </div>
        </div>
      </Card>

      {/* Dueño */}
      {owner && (
        <Card>
          <CardHeader title="Dueño / Propietario" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow icon={User}   label="Nombre"    value={owner.name}    />
            <InfoRow icon={Phone}  label="Teléfono"  value={owner.phone}   />
            <InfoRow icon={Mail}   label="Email"     value={owner.email}   />
            <InfoRow icon={MapPin} label="Dirección" value={owner.address} />
          </div>
          {owner.contact2Name && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Segundo contacto {owner.contact2Relation && `· ${owner.contact2Relation}`}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoRow icon={User}  label="Nombre"   value={owner.contact2Name}  />
                <InfoRow icon={Phone} label="Teléfono" value={owner.contact2Phone} />
                {owner.contact2Email && <InfoRow icon={Mail} label="Email" value={owner.contact2Email} />}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Vacunas */}
      <Card>
        <CardHeader
          title="Vacunas aplicadas"
          subtitle={petVax.length > 0 ? `${petVax.length} registro(s)` : 'Sin registros'}
          action={<Button size="sm" variant="ghost" onClick={() => navigate('/vacunas')}>Ver todas</Button>}
        />
        {petVax.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 rounded-xl">
            <Syringe size={28} className="text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Sin vacunas registradas para esta mascota</p>
          </div>
        ) : (
          <div className="space-y-3">
            {petVax.map(v => {
              const st = statusCfg[v.status] || statusCfg.current
              const StIcon = st.Icon
              return (
                <div key={v.id} className="flex gap-3 items-start p-3 rounded-xl bg-gray-50 hover:bg-violet-50 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                    <Syringe size={15} className="text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{v.name}</p>
                      {v.brand && <span className="text-xs text-gray-400">· {v.brand}</span>}
                      <Badge variant={st.variant}><StIcon size={10} /> {st.label}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1">
                      <span className="text-xs text-gray-500 flex items-center gap-1"><Calendar size={10} /> Aplicado: {v.appliedDate}</span>
                      {v.nextDueDate && <span className="text-xs text-gray-500 flex items-center gap-1"><Calendar size={10} /> Próximo: {v.nextDueDate}</span>}
                      {v.vet && <span className="text-xs text-gray-400">Dr/a: {v.vet}</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Desparasitantes */}
      <Card>
        <CardHeader
          title="Desparasitantes"
          subtitle={petDew.length > 0 ? `${petDew.length} registro(s)` : 'Sin registros'}
          action={<Button size="sm" variant="ghost" onClick={() => navigate('/vacunas')}>Ver todos</Button>}
        />
        {petDew.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 rounded-xl">
            <Activity size={28} className="text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Sin desparasitantes registrados</p>
          </div>
        ) : (
          <div className="space-y-3">
            {petDew.map(d => {
              const st = statusCfg[d.status] || statusCfg.current
              const StIcon = st.Icon
              return (
                <div key={d.id} className="flex gap-3 items-start p-3 rounded-xl bg-gray-50 hover:bg-teal-50 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
                    <Activity size={15} className="text-teal-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{d.product}</p>
                      {d.type && <span className="text-xs text-gray-400">· {d.type === 'internal' ? 'Interno' : 'Externo'}</span>}
                      <Badge variant={st.variant}><StIcon size={10} /> {st.label}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1">
                      <span className="text-xs text-gray-500 flex items-center gap-1"><Calendar size={10} /> Aplicado: {d.appliedDate}</span>
                      {d.nextDueDate && <span className="text-xs text-gray-500 flex items-center gap-1"><Calendar size={10} /> Próximo: {d.nextDueDate}</span>}
                      {d.dose && <span className="text-xs text-blue-600 font-medium">Dosis: {d.dose}</span>}
                      {d.vet && <span className="text-xs text-gray-400">Dr/a: {d.vet}</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Historial médico */}
      <Card>
        <CardHeader
          title="Historial médico"
          subtitle={petRecords.length > 0 ? `${petRecords.length} consulta(s)` : 'Sin consultas'}
          action={<Button size="sm" variant="ghost" onClick={() => navigate('/historial')}>Ver historial</Button>}
        />
        {petRecords.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Sin registros médicos aún</p>
        ) : (
          <div className="space-y-3">
            {petRecords.slice().reverse().slice(0, 3).map(r => {
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
                      {billingBadge && <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${billingBadge.cls}`}>{billingBadge.label}</span>}
                    </div>
                    <span className="text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Calendar size={11} /> {r.date}
                    </span>
                  </div>
                  {r.diagnosis && <p className="text-sm text-gray-700 mb-1"><span className="font-medium text-gray-500">Dx:</span> {r.diagnosis}</p>}
                  {Array.isArray(r.medicationsList) && r.medicationsList.length > 0 && (
                    <p className="text-xs text-gray-500">💊 {r.medicationsList.map(m => m.name).join(', ')}</p>
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
