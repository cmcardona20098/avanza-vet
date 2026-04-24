import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Trash2, Send, Eye, Pill, Stethoscope, Syringe, AlertTriangle,
  CheckCircle, Calculator, PawPrint, ClipboardList, ChevronRight, ChevronLeft,
  Clock, MessageCircle, Zap, Activity, FileText, Heart, ChevronDown, ChevronUp, X, Star
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import Button from '../../components/ui/Button'
import Input, { Select, Textarea } from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import InvoicePreview from '../../components/billing/InvoicePreview'

// ── Constants ────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Paciente',    icon: PawPrint     },
  { id: 2, label: 'Consulta',   icon: FileText     },
  { id: 3, label: 'Diagnóstico',icon: Activity     },
  { id: 4, label: 'Tratamiento',icon: Heart        },
  { id: 5, label: 'Medicamentos',icon: Pill        },
  { id: 6, label: 'Vacunas',    icon: Syringe      },
  { id: 7, label: 'Resumen',    icon: ClipboardList },
]

const FREQUENCY_OPTIONS = [
  { label: 'Cada 1h',  value: 1  },
  { label: 'Cada 2h',  value: 2  },
  { label: 'Cada 3h',  value: 3  },
  { label: 'Cada 4h',  value: 4  },
  { label: 'Cada 6h',  value: 6  },
  { label: 'Cada 8h',  value: 8  },
  { label: 'Cada 12h', value: 12 },
  { label: 'Cada 24h', value: 24 },
]

const PET_EMOJI  = { Perro: '🐕', Gato: '🐈', Ave: '🦜', Conejo: '🐇', Hamster: '🐹', Reptil: '🦎' }
const PET_GRAD   = {
  Perro:   'from-blue-500 to-blue-700',
  Gato:    'from-violet-500 to-violet-700',
  Ave:     'from-yellow-500 to-orange-500',
  Conejo:  'from-pink-400 to-rose-500',
  Hamster: 'from-amber-400 to-orange-400',
  Reptil:  'from-green-500 to-teal-600',
}

const TREATMENT_CHIPS = [
  'Limpieza de herida','Sutura','Curación','Vendaje',
  'Inyección I.M.','Inyección I.V.','Extracción cuerpo extraño',
  'Nebulización','Lavado de oídos','Corte de uñas',
  'Radiografía','Ecografía','Biopsia','Sondaje urinario',
]

const FOLLOWUP_OPTIONS = [
  { days: 1,  label: '1 día',  icon: '⚡' },
  { days: 3,  label: '3 días', icon: '📋' },
  { days: 7,  label: '7 días', icon: '📅' },
  { days: 14, label: '2 sem.', icon: '🗓' },
]

// ── Helpers ──────────────────────────────────────────────────────────────────
function calcTotal(qty, freq, days) {
  const q = parseFloat(qty) || 0
  const f = parseFloat(freq) || 0
  const d = parseFloat(days) || 0
  if (!f || !d) return null
  return Math.ceil(q * (24 / f) * d * 100) / 100
}
function calcLabel(qty, freq, days, unit) {
  const total = calcTotal(qty, freq, days)
  if (total === null) return null
  const tpd = +(24 / parseFloat(freq)).toFixed(1)
  return { total, formula: `${tpd}x/día × ${days} días × ${qty} = ${total} ${unit}` }
}
const Q = (n) => `Q${Number(n||0).toLocaleString('es-GT',{minimumFractionDigits:2,maximumFractionDigits:2})}`
const emptyMed   = () => ({ catalogId:'',name:'',qtyPerDose:'1',frequencyHours:'12',durationDays:'',instructions:'',unit:'pastilla' })
const emptyTreat = () => ({ catalogId:'',name:'',description:'',quantity:'1',frequency:'',duration:'',observations:'' })
const emptyVax   = () => ({ catalogId:'',name:'' })
const emptyDew   = () => ({ catalogId:'',name:'' })

// ── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ current, total }) {
  return (
    <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
        style={{ width: `${Math.round((current / total) * 100)}%` }}
      />
    </div>
  )
}

function PetCard({ pet, owner, hasAllergy }) {
  if (!pet) return null
  const emoji = PET_EMOJI[pet.species] || '🐾'
  const grad  = PET_GRAD[pet.species]  || 'from-emerald-500 to-emerald-700'
  return (
    <div className={`bg-gradient-to-br ${grad} rounded-2xl p-5 text-white shadow-lg`}>
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-4xl backdrop-blur-sm">
          {emoji}
        </div>
        <div className="flex-1">
          <h3 className="text-2xl font-bold leading-tight">{pet.name}</h3>
          <p className="text-white/80 text-sm">{pet.species}{pet.breed ? ` · ${pet.breed}` : ''}</p>
          {owner && <p className="text-white/60 text-xs mt-0.5">Dueño: {owner.name}</p>}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-4">
        {[
          { label:'Edad', val: pet.age ? `${pet.age} años` : '—' },
          { label:'Peso', val: pet.weight ? `${pet.weight} kg` : '—' },
          { label:'Sexo', val: pet.sex || '—' },
        ].map(({ label, val }) => (
          <div key={label} className="bg-white/15 rounded-xl p-2.5 text-center backdrop-blur-sm">
            <p className="text-xs text-white/70 font-medium">{label}</p>
            <p className="font-bold text-sm mt-0.5">{val}</p>
          </div>
        ))}
      </div>
      {hasAllergy && (
        <div className="mt-3 flex items-center gap-2 bg-red-500/30 border border-red-300/30 rounded-xl px-3 py-2">
          <AlertTriangle size={14} className="shrink-0" />
          <p className="text-sm font-bold">⚠ Alergia: {pet.allergies}</p>
        </div>
      )}
    </div>
  )
}

function BillingSummary({ consultationFee, medications, treatments, vaccinesApplied, dewormingsApplied, availableMeds, availableVax, availableDews, catalog }) {
  const medTotal   = medications.filter(m=>m.name).reduce((s,m) => {
    const inv = availableMeds.find(c=>c.id===m.catalogId)
    return s + (inv?.price||0) * (calcTotal(m.qtyPerDose,m.frequencyHours,m.durationDays)||0)
  },0)
  const treatTotal = treatments.filter(t=>t.name).reduce((s,t) => {
    const cat = catalog.treatments.find(c=>c.id===t.catalogId)
    return s + (cat?.price||0) * Number(t.quantity||1)
  },0)
  const vaxTotal   = vaccinesApplied.filter(v=>v.name).reduce((s,v) => {
    const inv = availableVax.find(c=>c.id===v.catalogId)
    return s + (inv?.price||0)
  },0)
  const dewTotal   = dewormingsApplied.filter(d=>d.name).reduce((s,d) => {
    const inv = availableDews.find(c=>c.id===d.catalogId)
    return s + (inv?.price||0)
  },0)
  const total = (consultationFee||0) + medTotal + treatTotal + vaxTotal + dewTotal

  const rows = [
    { label:'Consulta médica',  amount: consultationFee||0, icon: Stethoscope,  show: true },
    { label:`${medications.filter(m=>m.name).length} medicamento(s)`,  amount:medTotal,   icon:Pill,       show: medications.some(m=>m.name) },
    { label:`${treatments.filter(t=>t.name).length} tratamiento(s)`,   amount:treatTotal, icon:Heart,      show: treatments.some(t=>t.name)  },
    { label:`${vaccinesApplied.filter(v=>v.name).length} vacuna(s)`,   amount:vaxTotal,   icon:Syringe,    show: vaccinesApplied.some(v=>v.name) },
    { label:`${dewormingsApplied.filter(d=>d.name).length} desparasitante(s)`, amount:dewTotal, icon:Syringe, show: dewormingsApplied.some(d=>d.name) },
  ].filter(r=>r.show)

  return (
    <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100 sticky top-4">
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 px-4 py-4">
        <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest mb-1">Resumen en tiempo real</p>
        <p className="text-white text-3xl font-bold">{Q(total)}</p>
        <p className="text-emerald-200 text-xs mt-0.5">Total estimado de la consulta</p>
      </div>
      <div className="bg-white p-4 space-y-2.5">
        {rows.map(({ label, amount, icon:Icon }) => (
          <div key={label} className="flex items-center gap-2 text-sm">
            <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
              <Icon size={12} className="text-gray-400" />
            </div>
            <span className="flex-1 text-gray-600 text-xs">{label}</span>
            <span className="font-bold text-gray-800 text-xs">{Q(amount)}</span>
          </div>
        ))}
        {rows.length <= 1 && (
          <p className="text-xs text-gray-400 text-center py-1">Agrega items para ver el desglose</p>
        )}
        <div className="border-t border-gray-100 pt-2.5 flex justify-between items-center">
          <span className="text-sm font-bold text-gray-900">Total</span>
          <span className="text-base font-bold text-emerald-600">{Q(total)}</span>
        </div>
      </div>
    </div>
  )
}

function HistoryTimeline({ records }) {
  if (records.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-2xl">
        <Star size={28} className="text-gray-200 mx-auto mb-2" />
        <p className="text-sm text-gray-400 font-medium">Primera visita registrada</p>
        <p className="text-xs text-gray-300 mt-0.5">No hay consultas previas</p>
      </div>
    )
  }
  return (
    <div className="space-y-0">
      {records.map((r, i) => (
        <div key={r.id} className="flex gap-3 group">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-emerald-100 border-2 border-white shadow flex items-center justify-center shrink-0 group-hover:bg-emerald-200 transition-colors">
              <Stethoscope size={13} className="text-emerald-600" />
            </div>
            {i < records.length - 1 && <div className="w-0.5 flex-1 bg-gray-100 my-1" />}
          </div>
          <div className="flex-1 pb-4">
            <div className="bg-gray-50 hover:bg-emerald-50 rounded-xl p-3 transition-colors cursor-default">
              <p className="text-xs text-gray-400 font-semibold">{r.date}</p>
              <p className="text-sm font-bold text-gray-800 mt-0.5 line-clamp-1">
                {r.diagnosis || r.reason || 'Consulta general'}
              </p>
              {r.medicationsList?.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  💊 {r.medicationsList.slice(0,3).map(m => m.name || m).join(' · ')}
                  {r.medicationsList.length > 3 && ` +${r.medicationsList.length-3}`}
                </p>
              )}
              {r.autoCreated && <Badge variant="gray" className="mt-1.5 text-xs">Auto-generado</Badge>}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function NewConsultation() {
  const navigate = useNavigate()
  const { pets, owners, catalog, inventory, medicalRecords, addInboxItem, currentUser, appointments, updateAppointmentStatus } = useApp()

  const availableMeds = inventory.filter(i => i.type === 'medication')
  const availableVax  = inventory.filter(i => i.type === 'vaccine')
  const availableDews = inventory.filter(i => i.type === 'deworming')

  // ── Wizard state ──────────────────────────────────────
  const [step,      setStep]      = useState(1)
  const [quickMode, setQuickMode] = useState(false)

  // ── Form state ────────────────────────────────────────
  const [selectedPetId,     setSelectedPetId]     = useState(pets[0]?.id || '')
  const [reason,            setReason]            = useState('')
  const [diagnosis,         setDiagnosis]         = useState('')
  const [observations,      setObservations]      = useState('')
  const [nextAppt,          setNextAppt]          = useState('')
  const [medications,       setMedications]       = useState([emptyMed()])
  const [treatments,        setTreatments]        = useState([])
  const [vaccinesApplied,   setVaccinesApplied]   = useState([])
  const [dewormingsApplied, setDewormingsApplied] = useState([])

  // ── Follow-up state ───────────────────────────────────
  const [followUpDays,  setFollowUpDays]  = useState(null)
  const [followUpMsg,   setFollowUpMsg]   = useState('')
  const [showFollowUp,  setShowFollowUp]  = useState(false)

  // ── UI state ──────────────────────────────────────────
  const [showPreview,   setShowPreview]   = useState(false)
  const [showBilling,   setShowBilling]   = useState(false) // mobile billing toggle
  const [sent,          setSent]          = useState(false)

  const pet      = pets.find(p => p.id === selectedPetId)
  const owner    = owners.find(o => o.id === pet?.ownerId)
  const hasAllergy = pet?.allergies && !['Ninguna','Ninguna conocida',''].includes(pet.allergies)

  // Pet history
  const petHistory = useMemo(() =>
    medicalRecords
      .filter(r => r.petId === selectedPetId)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 4)
  , [medicalRecords, selectedPetId])

  // AI suggestion
  const aiSuggestion = useMemo(() => {
    const d = diagnosis.toLowerCase()
    if (d.includes('infección') || d.includes('infeccion') || d.includes('bacteria'))
      return 'Amoxicilina 10 mg/kg cada 12h por 7-10 días. Agregar Meloxicam para manejo de inflamación.'
    if (d.includes('dolor') || d.includes('inflamación') || d.includes('artritis'))
      return 'Meloxicam 0.1 mg/kg cada 24h con alimento. Evitar en pacientes con compromiso renal.'
    if (d.includes('parásito') || d.includes('parasito') || d.includes('diarrea'))
      return 'Considerar desparasitación: Fenbendazol 50 mg/kg/día por 3-5 días. Evaluar copro.'
    if (d.includes('alergia') || d.includes('dermatitis') || d.includes('prurito'))
      return 'Difenhidramina o Loratadina según peso. Revisar alimentación y alérgenos ambientales.'
    return null
  }, [diagnosis])

  // ── Med handlers ──────────────────────────────────────
  function updateMed(i, field, val) {
    setMedications(prev => prev.map((m, idx) => {
      if (idx !== i) return m
      const next = { ...m, [field]: val }
      if (field === 'catalogId') {
        const item = availableMeds.find(c => c.id === val)
        if (item) { next.name = item.name; next.unit = item.unit || 'pastilla' }
      }
      return next
    }))
  }

  // ── Treatment chip toggle ─────────────────────────────
  function toggleTreatChip(name) {
    setTreatments(prev => {
      const exists = prev.find(t => t.name === name)
      if (exists) return prev.filter(t => t.name !== name)
      // Check catalog for price
      const catItem = catalog.treatments.find(c => c.name === name)
      return [...prev, { catalogId: catItem?.id||'', name, description:'', quantity:'1', frequency:'', duration:'', observations:'' }]
    })
  }

  // ── Vax / Dew handlers ────────────────────────────────
  function updateVax(i, val) {
    setVaccinesApplied(prev => prev.map((v, idx) => {
      if (idx !== i) return v
      const item = availableVax.find(c => c.id === val)
      return item ? { catalogId: val, name: item.name } : { ...v, catalogId: val }
    }))
  }
  function updateDew(i, val) {
    setDewormingsApplied(prev => prev.map((d, idx) => {
      if (idx !== i) return d
      const item = availableDews.find(c => c.id === val)
      return item ? { catalogId: val, name: item.name } : { ...d, catalogId: val }
    }))
  }

  // ── Build invoice ─────────────────────────────────────
  function buildInvoice() {
    return {
      id: `inv${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      serviceType: 'Consulta Médica',
      diagnosis, reason,
      medications: medications.filter(m => m.name).map(m => {
        const inv = availableMeds.find(c => c.id === m.catalogId)
        return {
          name: m.name, catalogId: m.catalogId,
          qtyPerDose: m.qtyPerDose, frequencyHours: m.frequencyHours,
          frequencyLabel: FREQUENCY_OPTIONS.find(f => f.value === Number(m.frequencyHours))?.label || `Cada ${m.frequencyHours}h`,
          durationDays: m.durationDays, instructions: m.instructions, unit: m.unit,
          totalQuantity: calcTotal(m.qtyPerDose, m.frequencyHours, m.durationDays),
          price: inv?.price || 0,
        }
      }),
      treatments: treatments.filter(t => t.name).map(t => {
        const cat = catalog.treatments.find(c => c.id === t.catalogId)
        return { name: t.name, description: t.description, quantity: t.quantity,
          frequency: t.frequency, duration: t.duration, observations: t.observations,
          price: cat?.price || 0 }
      }),
      vaccines:   vaccinesApplied.filter(v=>v.name).map(v => {
        const inv = availableVax.find(c=>c.id===v.catalogId)
        return { name:v.name, catalogId:v.catalogId, price:inv?.price||0 }
      }),
      dewormings: dewormingsApplied.filter(d=>d.name).map(d => {
        const inv = availableDews.find(c=>c.id===d.catalogId)
        return { name:d.name, catalogId:d.catalogId, price:inv?.price||0 }
      }),
      consultationFee: catalog.consultationFee,
      observations, nextAppointment: nextAppt,
    }
  }

  const previewItem = {
    id: `tmp${Date.now()}`, type:'consultation', status:'pending',
    sentAt: new Date().toLocaleString('es-GT'),
    petId: selectedPetId, ownerId: pet?.ownerId,
    sentBy: currentUser?.name || 'Dra. Veterinaria',
    invoice: buildInvoice(),
  }

  function handleSend() {
    addInboxItem(previewItem)
    const relatedAppt = appointments.find(a =>
      a.petId === selectedPetId &&
      (a.assignedTo==='vet'||a.serviceType==='consultation') &&
      a.status==='initiated'
    )
    if (relatedAppt) updateAppointmentStatus(relatedAppt.id,'sent_to_admin',{finishedAt:new Date().toISOString()})
    setSent(true)
    setTimeout(() => navigate('/mi-agenda'), 2000)
  }

  function handleFollowUpWhatsApp() {
    if (!owner?.phone || !followUpDays) return
    const petN = pet?.name || 'su mascota'
    const msg = followUpMsg || `Hola ${owner.name}, queríamos saber cómo sigue ${petN} después de su consulta. ¿Ha mejorado? Estamos aquí si necesita algo. 🐾`
    window.open(`https://wa.me/${owner.phone.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  // ── Guard ─────────────────────────────────────────────
  if (pets.length === 0) {
    return (
      <div className="max-w-xl mx-auto text-center py-20">
        <PawPrint size={48} className="text-gray-200 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Sin mascotas registradas</h2>
        <p className="text-gray-500">Pide a Administración que registre mascotas primero.</p>
      </div>
    )
  }

  if (sent) {
    return (
      <div className="max-w-xl mx-auto text-center py-20">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={40} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Consulta enviada!</h2>
        <p className="text-gray-500">La evaluación de <strong>{pet?.name}</strong> fue enviada a Administración.</p>
        <p className="text-xs text-gray-400 mt-2">El historial médico se actualizó automáticamente.</p>
        <div className="mt-6 w-8 h-8 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  // ── Step renderers ────────────────────────────────────
  function renderStep1() {
    return (
      <div className="space-y-5">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Seleccionar mascota</label>
          <select
            value={selectedPetId}
            onChange={e => setSelectedPetId(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {pets.map(p => {
              const o = owners.find(o => o.id === p.ownerId)
              return <option key={p.id} value={p.id}>{PET_EMOJI[p.species]||'🐾'} {p.name} — {o?.name}</option>
            })}
          </select>
        </div>

        {pet && (
          <>
            <PetCard pet={pet} owner={owner} hasAllergy={hasAllergy} />

            {/* History */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={15} className="text-gray-400" />
                <p className="text-sm font-bold text-gray-700">Historial de consultas</p>
                <Badge variant="gray">{petHistory.length}</Badge>
              </div>
              <HistoryTimeline records={petHistory} />
            </div>
          </>
        )}
      </div>
    )
  }

  function renderStep2() {
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 flex items-center gap-3 border border-blue-100">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
            <span className="text-xl">{PET_EMOJI[pet?.species]||'🐾'}</span>
          </div>
          <div>
            <p className="font-bold text-gray-900">{pet?.name}</p>
            <p className="text-xs text-gray-500">{pet?.species} · {pet?.breed} · {pet?.age} años</p>
          </div>
          {hasAllergy && <Badge variant="red" className="ml-auto">⚠ Alergia</Badge>}
        </div>

        <Textarea
          label="Motivo de consulta"
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="¿Por qué viene hoy el paciente? Describe los síntomas observados..."
          rows={4}
        />

        <Input
          label="Temperatura corporal (opcional)"
          placeholder="Ej. 38.5 °C"
        />

        <div className="grid grid-cols-2 gap-3">
          <Input label="Peso en consulta (kg)" type="number" placeholder={pet?.weight ? `Actual: ${pet.weight} kg` : 'kg'} />
          <Input label="Frecuencia cardíaca (opcional)" placeholder="lpm" />
        </div>
      </div>
    )
  }

  function renderStep3() {
    return (
      <div className="space-y-4">
        <Textarea
          label="Diagnóstico clínico"
          value={diagnosis}
          onChange={e => setDiagnosis(e.target.value)}
          placeholder="Describe el diagnóstico basado en la evaluación física y síntomas presentados..."
          rows={5}
        />

        {/* AI Suggestion */}
        {aiSuggestion && (
          <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
                <Star size={14} className="text-violet-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-violet-700 uppercase tracking-wide mb-1">Sugerencia IA · Protocolo común</p>
                <p className="text-sm text-violet-800">{aiSuggestion}</p>
              </div>
            </div>
          </div>
        )}

        <Textarea
          label="Observaciones adicionales"
          value={observations}
          onChange={e => setObservations(e.target.value)}
          placeholder="Notas para el expediente, recomendaciones al dueño..."
          rows={3}
        />
      </div>
    )
  }

  function renderStep4() {
    const allChips = catalog.treatments.length > 0
      ? catalog.treatments.map(t => t.name)
      : TREATMENT_CHIPS
    const selectedNames = treatments.map(t => t.name)

    return (
      <div className="space-y-5">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Selecciona los tratamientos aplicados</p>
          <div className="flex flex-wrap gap-2">
            {allChips.map(name => {
              const isSelected = selectedNames.includes(name)
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggleTreatChip(name)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border ${
                    isSelected
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm scale-105'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
                  }`}
                >
                  {isSelected && <CheckCircle size={12} />}
                  {name}
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected treatments with details */}
        {treatments.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <CheckCircle size={14} className="text-emerald-500" />
              {treatments.length} tratamiento(s) seleccionado(s)
            </p>
            {treatments.map((t, i) => (
              <div key={i} className="border border-emerald-100 bg-emerald-50/40 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <Heart size={13} className="text-emerald-500" /> {t.name}
                  </span>
                  <button onClick={() => toggleTreatChip(t.name)} className="text-gray-300 hover:text-red-400 transition-colors">
                    <X size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Cantidad" type="number" min="1"
                    value={t.quantity}
                    onChange={e => setTreatments(prev => prev.map((x,xi) => xi===i ? {...x, quantity: e.target.value} : x))}
                  />
                  <Input
                    label="Observaciones"
                    value={t.observations}
                    placeholder="Opcional"
                    onChange={e => setTreatments(prev => prev.map((x,xi) => xi===i ? {...x, observations: e.target.value} : x))}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {treatments.length === 0 && (
          <div className="text-center py-6 bg-gray-50 rounded-2xl">
            <Heart size={28} className="text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Selecciona los tratamientos aplicados arriba</p>
          </div>
        )}
      </div>
    )
  }

  function renderStep5() {
    return (
      <div className="space-y-4">
        {availableMeds.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2">
            <AlertTriangle size={15} className="text-amber-600" />
            <p className="text-sm text-amber-800">No hay medicamentos en inventario. Contacta a Administración.</p>
          </div>
        )}

        {medications.map((med, i) => {
          const calc     = med.name && med.qtyPerDose && med.frequencyHours && med.durationDays
            ? calcLabel(med.qtyPerDose, med.frequencyHours, med.durationDays, med.unit) : null
          const invItem  = availableMeds.find(c => c.id === med.catalogId)
          const needed   = calcTotal(med.qtyPerDose, med.frequencyHours, med.durationDays) || 0

          return (
            <div key={i} className="border border-blue-100 rounded-2xl overflow-hidden">
              <div className="bg-blue-50 px-4 py-2.5 flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-bold text-blue-800">
                  <Pill size={14} /> Medicamento {i + 1}
                  {med.name && <Badge variant="blue">{med.name}</Badge>}
                </span>
                {medications.length > 1 && (
                  <button onClick={() => setMedications(p => p.filter((_,idx)=>idx!==i))} className="text-blue-300 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <div className="p-4 space-y-3">
                <Select value={med.catalogId} onChange={e => updateMed(i,'catalogId',e.target.value)}>
                  <option value="">— Seleccionar medicamento —</option>
                  {availableMeds.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} · Stock: {c.quantity} {c.unit}{c.quantity<=0?' (Agotado)':c.quantity<=c.minStock?' ⚠':''}
                    </option>
                  ))}
                </Select>

                {med.catalogId && invItem && (
                  <p className={`text-xs font-medium ${
                    invItem.quantity<=0 ? 'text-red-600' :
                    needed>invItem.quantity ? 'text-red-600' :
                    invItem.quantity<=invItem.minStock ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                    {invItem.quantity<=0 ? '⚠ Sin stock disponible' :
                     needed>invItem.quantity ? `⚠ Stock insuficiente: necesitas ${needed}, hay ${invItem.quantity} ${invItem.unit}` :
                     invItem.quantity<=invItem.minStock ? `⚠ Bajo stock: ${invItem.quantity} ${invItem.unit} disponibles` :
                     `✓ Disponible: ${invItem.quantity} ${invItem.unit}`}
                  </p>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <Input
                    label="Dosis" type="number" min="0.1" step="0.5"
                    value={med.qtyPerDose}
                    onChange={e => updateMed(i,'qtyPerDose',e.target.value)}
                    placeholder="Ej. 1"
                  />
                  <Select
                    label="Frecuencia"
                    value={med.frequencyHours}
                    onChange={e => updateMed(i,'frequencyHours',e.target.value)}
                  >
                    {FREQUENCY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </Select>
                  <Input
                    label="Días"
                    type="number" min="1"
                    value={med.durationDays}
                    onChange={e => updateMed(i,'durationDays',e.target.value)}
                    placeholder="7"
                  />
                </div>

                <Input
                  label="Indicaciones"
                  value={med.instructions}
                  onChange={e => updateMed(i,'instructions',e.target.value)}
                  placeholder="Ej. Administrar después de comida"
                />

                {calc && (
                  <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                    <Calculator size={16} className="text-blue-500 shrink-0" />
                    <div>
                      <p className="text-xs text-blue-600">{calc.formula}</p>
                      <p className="text-sm font-bold text-blue-800">Total: {calc.total} {med.unit}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        <button
          onClick={() => setMedications(p => [...p, emptyMed()])}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-blue-200 rounded-2xl text-sm font-semibold text-blue-500 hover:border-blue-400 hover:bg-blue-50 transition-all"
        >
          <Plus size={16} /> Agregar medicamento
        </button>
      </div>
    )
  }

  function renderStep6() {
    return (
      <div className="space-y-5">
        {/* Vacunas */}
        <div className="border border-violet-100 rounded-2xl overflow-hidden">
          <div className="bg-violet-50 px-4 py-2.5 flex items-center justify-between">
            <span className="text-sm font-bold text-violet-800 flex items-center gap-2">
              <Syringe size={14} /> Vacunas aplicadas
              {vaccinesApplied.filter(v=>v.name).length > 0 && (
                <Badge variant="purple">{vaccinesApplied.filter(v=>v.name).length}</Badge>
              )}
            </span>
            <button
              onClick={() => setVaccinesApplied(p => [...p, emptyVax()])}
              className="flex items-center gap-1 text-xs font-semibold text-violet-600 hover:bg-violet-100 px-2 py-1 rounded-lg transition-colors"
            >
              <Plus size={12} /> Agregar
            </button>
          </div>
          <div className="p-4 space-y-2">
            {availableVax.length === 0 && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">Sin vacunas en inventario</p>
            )}
            {vaccinesApplied.length === 0
              ? <p className="text-sm text-gray-400 text-center py-4">Ninguna vacuna aplicada</p>
              : vaccinesApplied.map((v, i) => {
                const invV = availableVax.find(c => c.id === v.catalogId)
                return (
                  <div key={i} className="flex gap-2 items-center">
                    <Select value={v.catalogId} onChange={e => updateVax(i, e.target.value)} className="flex-1">
                      <option value="">— Seleccionar vacuna —</option>
                      {availableVax.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} · Stock: {c.quantity}{c.quantity<=0?' (Agotado)':''}
                        </option>
                      ))}
                    </Select>
                    <button onClick={() => setVaccinesApplied(p=>p.filter((_,xi)=>xi!==i))} className="text-gray-300 hover:text-red-400 p-2 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )
              })
            }
          </div>
        </div>

        {/* Desparasitantes */}
        <div className="border border-teal-100 rounded-2xl overflow-hidden">
          <div className="bg-teal-50 px-4 py-2.5 flex items-center justify-between">
            <span className="text-sm font-bold text-teal-800 flex items-center gap-2">
              <Activity size={14} /> Desparasitantes
              {dewormingsApplied.filter(d=>d.name).length > 0 && (
                <Badge variant="green">{dewormingsApplied.filter(d=>d.name).length}</Badge>
              )}
            </span>
            <button
              onClick={() => setDewormingsApplied(p => [...p, emptyDew()])}
              className="flex items-center gap-1 text-xs font-semibold text-teal-600 hover:bg-teal-100 px-2 py-1 rounded-lg transition-colors"
            >
              <Plus size={12} /> Agregar
            </button>
          </div>
          <div className="p-4 space-y-2">
            {availableDews.length === 0 && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">Sin desparasitantes en inventario</p>
            )}
            {dewormingsApplied.length === 0
              ? <p className="text-sm text-gray-400 text-center py-4">Ningún desparasitante aplicado</p>
              : dewormingsApplied.map((d, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Select value={d.catalogId} onChange={e => updateDew(i, e.target.value)} className="flex-1">
                    <option value="">— Seleccionar —</option>
                    {availableDews.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} · Stock: {c.quantity}{c.quantity<=0?' (Agotado)':''}
                      </option>
                    ))}
                  </Select>
                  <button onClick={() => setDewormingsApplied(p=>p.filter((_,xi)=>xi!==i))} className="text-gray-300 hover:text-red-400 p-2 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            }
          </div>
        </div>

        {/* Próxima cita */}
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
          <p className="text-sm font-semibold text-blue-800 mb-2">📅 Próxima cita recomendada</p>
          <Input type="date" value={nextAppt} onChange={e => setNextAppt(e.target.value)} />
        </div>
      </div>
    )
  }

  function renderStep7() {
    const inv = buildInvoice()
    return (
      <div className="space-y-5">
        {/* Summary card */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{PET_EMOJI[pet?.species]||'🐾'}</span>
            <div>
              <h3 className="font-bold text-lg">{pet?.name}</h3>
              <p className="text-gray-400 text-sm">{pet?.species} · {owner?.name}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {reason && <div className="bg-white/10 rounded-xl p-3"><p className="text-gray-400 text-xs">Motivo</p><p className="font-medium mt-0.5">{reason}</p></div>}
            {diagnosis && <div className="bg-white/10 rounded-xl p-3"><p className="text-gray-400 text-xs">Diagnóstico</p><p className="font-medium mt-0.5 line-clamp-2">{diagnosis}</p></div>}
            {inv.medications.length > 0 && <div className="bg-white/10 rounded-xl p-3"><p className="text-gray-400 text-xs">Medicamentos</p><p className="font-bold mt-0.5">{inv.medications.length}</p></div>}
            {inv.treatments.length > 0  && <div className="bg-white/10 rounded-xl p-3"><p className="text-gray-400 text-xs">Tratamientos</p><p className="font-bold mt-0.5">{inv.treatments.length}</p></div>}
            {inv.vaccines.length > 0    && <div className="bg-white/10 rounded-xl p-3"><p className="text-gray-400 text-xs">Vacunas</p><p className="font-bold mt-0.5">{inv.vaccines.length}</p></div>}
            {inv.dewormings.length > 0  && <div className="bg-white/10 rounded-xl p-3"><p className="text-gray-400 text-xs">Desparasitantes</p><p className="font-bold mt-0.5">{inv.dewormings.length}</p></div>}
          </div>
        </div>

        {/* Follow-up */}
        <div className="border border-emerald-200 rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowFollowUp(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 bg-emerald-50 hover:bg-emerald-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <MessageCircle size={16} className="text-emerald-600" />
              <span className="text-sm font-bold text-emerald-800">¿Programar seguimiento por WhatsApp?</span>
            </div>
            {showFollowUp ? <ChevronUp size={16} className="text-emerald-500" /> : <ChevronDown size={16} className="text-emerald-500" />}
          </button>
          {showFollowUp && (
            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-500">Selecciona cuándo enviar el mensaje de seguimiento:</p>
              <div className="grid grid-cols-4 gap-2">
                {FOLLOWUP_OPTIONS.map(opt => (
                  <button
                    key={opt.days}
                    onClick={() => {
                      setFollowUpDays(opt.days)
                      setFollowUpMsg(`Hola ${owner?.name||''}, queríamos saber cómo sigue ${pet?.name||'su mascota'} después de su consulta. ¿Ha mejorado? Estamos aquí si necesita algo. 🐾`)
                    }}
                    className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all ${
                      followUpDays===opt.days
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 hover:border-emerald-200 text-gray-600'
                    }`}
                  >
                    <span className="text-lg">{opt.icon}</span>
                    <span className="text-xs font-bold">{opt.label}</span>
                  </button>
                ))}
              </div>
              {followUpDays && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Mensaje para WhatsApp</label>
                  <textarea
                    value={followUpMsg}
                    onChange={e => setFollowUpMsg(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    onClick={handleFollowUpWhatsApp}
                    className="flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
                  >
                    <MessageCircle size={15} /> Enviar por WhatsApp
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center justify-center gap-2 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold py-3 rounded-2xl transition-all"
          >
            <Eye size={17} /> Ver factura
          </button>
          <button
            onClick={handleSend}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold py-3 rounded-2xl shadow-lg shadow-emerald-200 transition-all"
          >
            <Send size={17} /> Enviar a Administración
          </button>
        </div>
      </div>
    )
  }

  // ── Quick mode ────────────────────────────────────────
  function renderQuickMode() {
    return (
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2">
          <Zap size={16} className="text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800 font-medium">Modo rápido — para casos simples y seguimientos</p>
        </div>

        <Select label="Mascota" value={selectedPetId} onChange={e => setSelectedPetId(e.target.value)}>
          {pets.map(p => {
            const o = owners.find(o=>o.id===p.ownerId)
            return <option key={p.id} value={p.id}>{PET_EMOJI[p.species]||'🐾'} {p.name} — {o?.name}</option>
          })}
        </Select>
        {pet && hasAllergy && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            <AlertTriangle size={14} className="text-red-600" />
            <p className="text-sm font-bold text-red-700">Alergia: {pet.allergies}</p>
          </div>
        )}
        <Input label="Motivo" value={reason} onChange={e=>setReason(e.target.value)} placeholder="Motivo de consulta" />
        <Textarea label="Diagnóstico" value={diagnosis} onChange={e=>setDiagnosis(e.target.value)} placeholder="Diagnóstico..." rows={2} />
        {availableMeds.length > 0 && (
          <Select label="Medicamento principal" value={medications[0]?.catalogId||''} onChange={e => {
            const item = availableMeds.find(c=>c.id===e.target.value)
            if(item) setMedications([{...emptyMed(), catalogId:e.target.value, name:item.name, unit:item.unit||'pastilla'}])
          }}>
            <option value="">— Sin medicamento —</option>
            {availableMeds.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        )}
        <Textarea label="Observaciones" value={observations} onChange={e=>setObservations(e.target.value)} rows={2} placeholder="Notas finales..." />
        <button
          onClick={handleSend}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold py-3 rounded-2xl shadow-lg shadow-emerald-200 transition-all"
        >
          <Send size={17} /> Guardar y enviar
        </button>
      </div>
    )
  }

  // ── Main render ───────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Stethoscope size={22} className="text-emerald-500" />
            Nueva consulta médica
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">{currentUser?.name} · {new Date().toLocaleDateString('es-GT',{weekday:'long',day:'numeric',month:'long'})}</p>
        </div>
        <button
          onClick={() => { setQuickMode(v=>!v); setStep(1) }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm border-2 transition-all ${
            quickMode
              ? 'bg-amber-500 text-white border-amber-500'
              : 'bg-white text-amber-600 border-amber-300 hover:bg-amber-50'
          }`}
        >
          <Zap size={15} />
          {quickMode ? 'Modo completo' : 'Consulta rápida'}
        </button>
      </div>

      {quickMode ? renderQuickMode() : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 items-start">

          {/* Wizard */}
          <div className="space-y-4">
            {/* Step tabs */}
            <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm">
              <div className="flex gap-1 overflow-x-auto pb-1">
                {STEPS.map(s => {
                  const Icon = s.icon
                  const isDone = s.id < step
                  const isCurrent = s.id === step
                  return (
                    <button
                      key={s.id}
                      onClick={() => setStep(s.id)}
                      className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl min-w-[60px] transition-all duration-200 ${
                        isCurrent
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : isDone
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'text-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      {isDone ? <CheckCircle size={16} /> : <Icon size={16} />}
                      <span className="text-xs font-semibold whitespace-nowrap">{s.label}</span>
                    </button>
                  )
                })}
              </div>
              <div className="mt-2">
                <ProgressBar current={step} total={STEPS.length} />
                <p className="text-xs text-gray-400 text-right mt-1">Paso {step} de {STEPS.length}</p>
              </div>
            </div>

            {/* Step content */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm min-h-[300px]">
              {renderStep()}
            </div>

            {/* Navigation */}
            {step < 7 && (
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setStep(s => Math.max(1, s-1))}
                  disabled={step === 1}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={16} /> Anterior
                </button>
                <span className="text-xs text-gray-400 font-medium">{step}/{STEPS.length}</span>
                <button
                  onClick={() => setStep(s => Math.min(7, s+1))}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-sm shadow-emerald-200 transition-all"
                >
                  Siguiente <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Billing panel (desktop) */}
          <div className="hidden lg:block">
            <BillingSummary
              consultationFee={catalog.consultationFee}
              medications={medications}
              treatments={treatments}
              vaccinesApplied={vaccinesApplied}
              dewormingsApplied={dewormingsApplied}
              availableMeds={availableMeds}
              availableVax={availableVax}
              availableDews={availableDews}
              catalog={catalog}
            />
          </div>
        </div>
      )}

      {/* Mobile billing toggle */}
      {!quickMode && (
        <div className="lg:hidden">
          <button
            onClick={() => setShowBilling(v=>!v)}
            className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm"
          >
            <span className="text-sm font-semibold text-gray-700">Ver resumen de consulta</span>
            {showBilling ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>
          {showBilling && (
            <div className="mt-2">
              <BillingSummary
                consultationFee={catalog.consultationFee}
                medications={medications}
                treatments={treatments}
                vaccinesApplied={vaccinesApplied}
                dewormingsApplied={dewormingsApplied}
                availableMeds={availableMeds}
                availableVax={availableVax}
                availableDews={availableDews}
                catalog={catalog}
              />
            </div>
          )}
        </div>
      )}

      {/* Invoice preview modal */}
      <Modal isOpen={showPreview} onClose={() => setShowPreview(false)} title="Previsualización de factura" size="xl">
        <InvoicePreview item={previewItem} pet={pet} owner={owner} showPayButton={false} />
      </Modal>
    </div>
  )
}
