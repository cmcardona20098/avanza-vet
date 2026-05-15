import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Trash2, Send, Eye, Pill, Stethoscope, Syringe, AlertTriangle,
  CheckCircle, Calculator, PawPrint, ClipboardList, ChevronRight, ChevronLeft,
  Clock, MessageCircle, Zap, Activity, FileText, Heart, ChevronDown, ChevronUp,
  X, Star, FlaskConical, Pencil, Microscope
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import Button from '../../components/ui/Button'
import Input, { Select, Textarea } from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import InvoicePreview from '../../components/billing/InvoicePreview'

// ── Constants ────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Paciente',    icon: PawPrint      },
  { id: 2, label: 'Anamnesis',  icon: FileText      },
  { id: 3, label: 'Examen',     icon: Stethoscope   },
  { id: 4, label: 'Auxiliares', icon: Microscope    },
  { id: 5, label: 'Diagnóstico',icon: Activity      },
  { id: 6, label: 'Tratamientos',icon: Heart        },
  { id: 7, label: 'Receta',     icon: Pill          },
  { id: 8, label: 'Resumen',    icon: ClipboardList },
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

const PET_EMOJI = { Perro: '🐕', Gato: '🐈', Ave: '🦜', Conejo: '🐇', Hamster: '🐹', Reptil: '🦎' }
const PET_GRAD  = {
  Perro:   'from-blue-500 to-blue-700',
  Gato:    'from-violet-500 to-violet-700',
  Ave:     'from-yellow-500 to-orange-500',
  Conejo:  'from-pink-400 to-rose-500',
  Hamster: 'from-amber-400 to-orange-400',
  Reptil:  'from-green-500 to-teal-600',
}

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
const emptyMed = () => ({ source: 'inventory', catalogId: '', name: '', qtyPerDose: '1', frequencyHours: '12', durationDays: '', instructions: '', unit: 'pastilla' })

// ── Sub-components ───────────────────────────────────────────────────────────
function ProgressBar({ current, total }) {
  return (
    <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
        style={{ width: `${Math.round((current / total) * 100)}%` }} />
    </div>
  )
}

function PetCard({ pet, owner, hasAllergy }) {
  if (!pet) return null
  const emoji = PET_EMOJI[pet.species] || '🐾'
  const grad  = PET_GRAD[pet.species]  || 'from-emerald-500 to-emerald-700'
  const displayAge = pet.age ? `${pet.age} años` : (pet.birthDate ? (() => {
    const y = (new Date() - new Date(pet.birthDate)) / (365.25*24*3600*1000)
    return y < 1 ? `${Math.round(y*12)} meses` : `${Math.floor(y)} años`
  })() : '—')
  return (
    <div className={`bg-gradient-to-br ${grad} rounded-2xl p-5 text-white shadow-lg`}>
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-4xl backdrop-blur-sm">{emoji}</div>
        <div className="flex-1">
          <h3 className="text-2xl font-bold leading-tight">{pet.name}</h3>
          <p className="text-white/80 text-sm">{pet.species}{pet.breed ? ` · ${pet.breed}` : ''}</p>
          {owner && <p className="text-white/60 text-xs mt-0.5">Dueño: {owner.name}</p>}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-4">
        {[
          { label: 'Edad', val: displayAge },
          { label: 'Peso', val: pet.weight ? `${pet.weight} kg` : '—' },
          { label: 'Sexo', val: pet.sex || '—' },
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

function BillingSummary({ consultationFee, auxiliares, treatmentsApplied, medications, vaccinesApplied, dewormingsApplied, availableMeds, availableVax, availableDews, services }) {
  const auxTotal  = auxiliares.filter(s=>s.name).reduce((s,x)=>s+x.price*Number(x.quantity||1),0)
  const treatTotal= treatmentsApplied.filter(s=>s.name).reduce((s,x)=>s+x.price*Number(x.quantity||1),0)
  const medTotal  = medications.filter(m=>m.name).reduce((s,m)=>{
    if (m.source === 'manual') return s
    const inv = availableMeds.find(c=>c.id===m.catalogId)
    return s + (inv?.price||0)*(calcTotal(m.qtyPerDose,m.frequencyHours,m.durationDays)||0)
  },0)
  const vaxTotal  = vaccinesApplied.filter(v=>v.name).reduce((s,v)=>{const inv=availableVax.find(c=>c.id===v.catalogId);return s+(inv?.price||0)},0)
  const dewTotal  = dewormingsApplied.filter(d=>d.name).reduce((s,d)=>{const inv=availableDews.find(c=>c.id===d.catalogId);return s+(inv?.price||0)},0)
  const total = (consultationFee||0)+auxTotal+treatTotal+medTotal+vaxTotal+dewTotal

  const rows = [
    { label:'Consulta médica',      amount:consultationFee||0, icon:Stethoscope, show:true },
    { label:`${auxiliares.filter(s=>s.name).length} examen(es) auxiliar(es)`,   amount:auxTotal,   icon:Microscope, show:auxiliares.some(s=>s.name) },
    { label:`${treatmentsApplied.filter(s=>s.name).length} tratamiento(s)`,  amount:treatTotal, icon:Heart,      show:treatmentsApplied.some(s=>s.name) },
    { label:`${medications.filter(m=>m.name).length} medicamento(s)`,         amount:medTotal,   icon:Pill,       show:medications.some(m=>m.name) },
    { label:`${vaccinesApplied.filter(v=>v.name).length} vacuna(s)`,         amount:vaxTotal,   icon:Syringe,    show:vaccinesApplied.some(v=>v.name) },
    { label:`${dewormingsApplied.filter(d=>d.name).length} desparasitante(s)`,amount:dewTotal,  icon:Activity,   show:dewormingsApplied.some(d=>d.name) },
  ].filter(r=>r.show)

  return (
    <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100 sticky top-4">
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 px-4 py-4">
        <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest mb-1">Total estimado</p>
        <p className="text-white text-3xl font-bold">{Q(total)}</p>
        <p className="text-emerald-200 text-xs mt-0.5">Actualizado en tiempo real</p>
      </div>
      <div className="bg-white p-4 space-y-2.5">
        {rows.map(({ label, amount, icon:Icon }) => (
          <div key={label} className="flex items-center gap-2 text-sm">
            <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center shrink-0"><Icon size={12} className="text-gray-400"/></div>
            <span className="flex-1 text-gray-600 text-xs">{label}</span>
            <span className="font-bold text-gray-800 text-xs">{Q(amount)}</span>
          </div>
        ))}
        {rows.length <= 1 && <p className="text-xs text-gray-400 text-center py-1">Agrega items para ver el desglose</p>}
        <div className="border-t border-gray-100 pt-2.5 flex justify-between items-center">
          <span className="text-sm font-bold text-gray-900">Total</span>
          <span className="text-base font-bold text-emerald-600">{Q(total)}</span>
        </div>
      </div>
    </div>
  )
}

function HistoryTimeline({ records }) {
  if (records.length === 0) return (
    <div className="text-center py-8 bg-gray-50 rounded-2xl">
      <Star size={28} className="text-gray-200 mx-auto mb-2"/>
      <p className="text-sm text-gray-400 font-medium">Primera visita</p>
      <p className="text-xs text-gray-300 mt-0.5">No hay consultas previas</p>
    </div>
  )
  return (
    <div className="space-y-0">
      {records.map((r, i) => (
        <div key={r.id} className="flex gap-3 group">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-emerald-100 border-2 border-white shadow flex items-center justify-center shrink-0">
              <Stethoscope size={13} className="text-emerald-600"/>
            </div>
            {i < records.length-1 && <div className="w-0.5 flex-1 bg-gray-100 my-1"/>}
          </div>
          <div className="flex-1 pb-4">
            <div className="bg-gray-50 hover:bg-emerald-50 rounded-xl p-3 transition-colors">
              <p className="text-xs text-gray-400 font-semibold">{r.date}</p>
              <p className="text-sm font-bold text-gray-800 mt-0.5 line-clamp-1">{r.diagnosis||r.reason||'Consulta general'}</p>
              {r.medicationsList?.length>0 && <p className="text-xs text-gray-500 mt-1">💊 {r.medicationsList.slice(0,3).map(m=>m.name||m).join(' · ')}</p>}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Service Selector (for auxiliares and treatments) ──────────────────────────
function ServiceSelector({ services, selected, onToggle, onQtyChange }) {
  const [catFilter, setCatFilter] = useState('Todos')
  const filtered = catFilter==='Todos' ? services : services.filter(s=>s.category===catFilter)
  const selectedIds = selected.map(s=>s.serviceId)
  const cats = ['Todos', ...new Set(services.map(s=>s.category))]

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {cats.map(c=>(
          <button key={c} type="button" onClick={()=>setCatFilter(c)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${catFilter===c?'bg-gray-800 text-white':'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            {c}
          </button>
        ))}
      </div>
      {services.length===0 && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">Sin servicios configurados en esta categoría. Pide a Administración que los configure.</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {filtered.map(svc=>{
          const isSel=selectedIds.includes(svc.id)
          const selItem=selected.find(s=>s.serviceId===svc.id)
          return (
            <div key={svc.id} className={`rounded-xl border-2 transition-all ${isSel?'border-emerald-400 bg-emerald-50':'border-gray-100 bg-white hover:border-emerald-200'}`}>
              <button type="button" onClick={()=>onToggle(svc)}
                className="w-full flex items-center gap-3 p-3 text-left">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isSel?'bg-emerald-500':'bg-gray-100'}`}>
                  {isSel?<CheckCircle size={14} className="text-white"/>:<Heart size={14} className="text-gray-400"/>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${isSel?'text-emerald-800':'text-gray-800'}`}>{svc.name}</p>
                  <p className="text-xs text-gray-500">{svc.category}</p>
                </div>
                <span className={`text-xs font-bold shrink-0 ${isSel?'text-emerald-700':'text-gray-500'}`}>Q{svc.price}</span>
              </button>
              {isSel && (
                <div className="px-3 pb-3 flex items-center gap-2">
                  <span className="text-xs text-gray-500">Cantidad:</span>
                  <input type="number" min="1" value={selItem.quantity}
                    onChange={e=>onQtyChange(svc.id, e.target.value)}
                    className="w-14 text-center border border-gray-200 rounded-lg py-1 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"/>
                  <span className="text-xs font-bold text-emerald-700 ml-auto">
                    Q{(svc.price * Number(selItem.quantity||1)).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>
      {selected.length>0 && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5 flex items-center justify-between">
          <span className="text-sm font-bold text-emerald-800">{selected.length} seleccionado(s)</span>
          <span className="text-sm font-bold text-emerald-700">
            Q{selected.reduce((s,x)=>s+x.price*Number(x.quantity||1),0).toFixed(2)}
          </span>
        </div>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function NewConsultation() {
  const navigate = useNavigate()
  const { pets, owners, catalog, inventory, medicalRecords, addInboxItem, currentUser, appointments, updateAppointmentStatus, services } = useApp()

  const availableMeds = inventory.filter(i=>i.type==='medication')
  const availableVax  = inventory.filter(i=>i.type==='vaccine')
  const availableDews = inventory.filter(i=>i.type==='deworming')

  // Services by category
  const auxServices   = services.filter(s=>['Laboratorio','Imágenes'].includes(s.category))
  const treatServices = services.filter(s=>['Tratamientos','Cirugía','Preventivo','Consultas'].includes(s.category))

  // ── Wizard state ──────────────────────────────────────
  const [step,      setStep]      = useState(1)
  const [quickMode, setQuickMode] = useState(false)

  // ── Form state ────────────────────────────────────────
  const [selectedPetId,    setSelectedPetId]    = useState(pets[0]?.id||'')
  // Step 2: Anamnesis
  const [motivo,           setMotivo]           = useState('')
  const [anamnesis,        setAnamnesis]        = useState('')
  // Step 3: Examen clínico
  const [examen,           setExamen]           = useState({ fc:'', fr:'', tlc:'', temp:'', peso:'', hallazgos:'' })
  // Step 4: Auxiliares (lab/imágenes)
  const [auxiliares,       setAuxiliares]       = useState([])
  // Step 5: Diagnóstico
  const [presumptiveDx,    setPresumptiveDx]    = useState('')
  const [diagnosis,        setDiagnosis]        = useState('')
  const [observations,     setObservations]     = useState('')
  // Step 6: Tratamientos en clínica
  const [treatmentsApplied,setTreatmentsApplied]= useState([])
  // Step 7: Receta médica (flexible)
  const [medications,      setMedications]      = useState([emptyMed()])
  const [vaccinesApplied,  setVaccinesApplied]  = useState([])
  const [dewormingsApplied,setDewormingsApplied]= useState([])
  const [nextAppt,         setNextAppt]         = useState('')
  // Follow-up
  const [followUpDays,     setFollowUpDays]     = useState(null)
  const [followUpMsg,      setFollowUpMsg]      = useState('')
  const [showFollowUp,     setShowFollowUp]     = useState(false)
  // UI
  const [showPreview,      setShowPreview]      = useState(false)
  const [showBilling,      setShowBilling]      = useState(false)
  const [sent,             setSent]             = useState(false)

  const pet      = pets.find(p=>p.id===selectedPetId)
  const owner    = owners.find(o=>o.id===pet?.ownerId)
  const hasAllergy = pet?.allergies && !['Ninguna','Ninguna conocida',''].includes(pet.allergies)

  const petHistory = useMemo(()=>
    medicalRecords.filter(r=>r.petId===selectedPetId)
      .sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,4)
  ,[medicalRecords,selectedPetId])

  // AI suggestion
  const aiSuggestion = useMemo(()=>{
    const d=diagnosis.toLowerCase()
    if(d.includes('infección')||d.includes('bacteria')) return 'Amoxicilina 10mg/kg cada 12h por 7-10 días. Considerar Meloxicam para inflamación.'
    if(d.includes('dolor')||d.includes('inflamación')||d.includes('artritis')) return 'Meloxicam 0.1mg/kg cada 24h con alimento. Evaluar función renal previa.'
    if(d.includes('parásito')||d.includes('diarrea')) return 'Fenbendazol 50mg/kg/día por 3-5 días. Evaluar copro. Considerar probióticos.'
    if(d.includes('alergia')||d.includes('dermatitis')) return 'Difenhidramina o Loratadina según peso. Revisar dieta y alérgenos ambientales.'
    return null
  },[diagnosis])

  // ── Service toggle helpers ────────────────────────────
  function toggleAux(svc) {
    setAuxiliares(p=>{
      const ex=p.find(s=>s.serviceId===svc.id)
      if(ex) return p.filter(s=>s.serviceId!==svc.id)
      return [...p,{serviceId:svc.id,name:svc.name,category:svc.category,price:svc.price,quantity:'1'}]
    })
  }
  function toggleTreat(svc) {
    setTreatmentsApplied(p=>{
      const ex=p.find(s=>s.serviceId===svc.id)
      if(ex) return p.filter(s=>s.serviceId!==svc.id)
      return [...p,{serviceId:svc.id,name:svc.name,category:svc.category,price:svc.price,quantity:'1'}]
    })
  }

  // ── Med handlers ──────────────────────────────────────
  function updateMed(i,field,val) {
    setMedications(prev=>prev.map((m,idx)=>{
      if(idx!==i) return m
      const next={...m,[field]:val}
      if(field==='catalogId'){
        const item=availableMeds.find(c=>c.id===val)
        if(item){next.name=item.name;next.unit=item.unit||'pastilla'}
      }
      if(field==='source' && val==='manual'){
        next.catalogId='';next.name='';next.unit='pastilla'
      }
      return next
    }))
  }

  // ── Vax/Dew handlers ──────────────────────────────────
  function updateVax(i,val) {
    setVaccinesApplied(prev=>prev.map((v,idx)=>{
      if(idx!==i) return v
      const item=availableVax.find(c=>c.id===val)
      return item?{catalogId:val,name:item.name}:{...v,catalogId:val}
    }))
  }
  function updateDew(i,val) {
    setDewormingsApplied(prev=>prev.map((d,idx)=>{
      if(idx!==i) return d
      const item=availableDews.find(c=>c.id===val)
      return item?{catalogId:val,name:item.name}:{...d,catalogId:val}
    }))
  }

  // ── Build invoice ─────────────────────────────────────
  function buildInvoice() {
    return {
      id:`inv${Date.now()}`,
      date:new Date().toISOString().split('T')[0],
      serviceType:'Consulta Médica',
      motivo, anamnesis, presumptiveDx, diagnosis, observations,
      examenClinico: examen,
      auxiliares: auxiliares.filter(s=>s.name),
      treatments: treatmentsApplied.filter(s=>s.name).map(s=>({
        name:s.name,serviceId:s.serviceId,category:s.category,
        quantity:Number(s.quantity||1),price:s.price,total:s.price*Number(s.quantity||1)
      })),
      medications: medications.filter(m=>m.name).map(m=>{
        const inv=availableMeds.find(c=>c.id===m.catalogId)
        return {
          name:m.name,catalogId:m.catalogId||null,source:m.source||'inventory',
          qtyPerDose:m.qtyPerDose,frequencyHours:m.frequencyHours,
          frequencyLabel:FREQUENCY_OPTIONS.find(f=>f.value===Number(m.frequencyHours))?.label||`Cada ${m.frequencyHours}h`,
          durationDays:m.durationDays,instructions:m.instructions,unit:m.unit,
          totalQuantity:calcTotal(m.qtyPerDose,m.frequencyHours,m.durationDays),
          price:inv?.price||0,
        }
      }),
      vaccines: vaccinesApplied.filter(v=>v.name).map(v=>{const inv=availableVax.find(c=>c.id===v.catalogId);return{name:v.name,catalogId:v.catalogId,price:inv?.price||0}}),
      dewormings: dewormingsApplied.filter(d=>d.name).map(d=>{const inv=availableDews.find(c=>c.id===d.catalogId);return{name:d.name,catalogId:d.catalogId,price:inv?.price||0}}),
      consultationFee:catalog.consultationFee,
      nextAppointment:nextAppt,
    }
  }

  const previewItem = {
    id:`tmp${Date.now()}`,type:'consultation',status:'pending',
    sentAt:new Date().toLocaleString('es-GT'),
    petId:selectedPetId,ownerId:pet?.ownerId,
    sentBy:currentUser?.name||'Dra. Veterinaria',
    invoice:buildInvoice(),
  }

  function handleSend() {
    addInboxItem(previewItem)
    const relatedAppt=appointments.find(a=>
      a.petId===selectedPetId&&(a.assignedTo==='vet'||a.serviceType==='consultation')&&a.status==='initiated'
    )
    if(relatedAppt) updateAppointmentStatus(relatedAppt.id,'sent_to_admin',{finishedAt:new Date().toISOString()})
    setSent(true)
    setTimeout(()=>navigate('/mi-agenda'),2000)
  }

  function handleFollowUpWhatsApp() {
    if(!owner?.phone||!followUpDays) return
    const msg=followUpMsg||`Hola ${owner.name}, queríamos saber cómo sigue ${pet?.name} después de su consulta. 🐾`
    window.open(`https://wa.me/${owner.phone.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`,'_blank')
  }

  // ── Guards ────────────────────────────────────────────
  if(pets.length===0) return (
    <div className="max-w-xl mx-auto text-center py-20">
      <PawPrint size={48} className="text-gray-200 mx-auto mb-4"/>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Sin mascotas registradas</h2>
      <p className="text-gray-500">Pide a Administración que registre mascotas primero.</p>
    </div>
  )

  if(sent) return (
    <div className="max-w-xl mx-auto text-center py-20">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
        <CheckCircle size={40} className="text-green-600"/>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Consulta enviada!</h2>
      <p className="text-gray-500">La evaluación de <strong>{pet?.name}</strong> fue enviada a Administración.</p>
      <p className="text-xs text-gray-400 mt-2">El historial médico se actualizó automáticamente.</p>
      <div className="mt-6 w-8 h-8 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto"/>
    </div>
  )

  // ── Step renders ──────────────────────────────────────
  function renderStep1() {
    return (
      <div className="space-y-5">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Seleccionar paciente</label>
          <select value={selectedPetId} onChange={e=>setSelectedPetId(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500">
            {pets.map(p=>{const o=owners.find(o=>o.id===p.ownerId);return<option key={p.id} value={p.id}>{PET_EMOJI[p.species]||'🐾'} {p.name} — {o?.name}</option>})}
          </select>
        </div>
        {pet && (
          <>
            <PetCard pet={pet} owner={owner} hasAllergy={hasAllergy}/>
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={15} className="text-gray-400"/>
                <p className="text-sm font-bold text-gray-700">Historial de consultas</p>
                <Badge variant="gray">{petHistory.length}</Badge>
              </div>
              <HistoryTimeline records={petHistory}/>
            </div>
          </>
        )}
      </div>
    )
  }

  function renderStep2() {
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-0.5">Anamnesis</p>
          <p className="text-xs text-blue-600">Historia clínica completa — motivo, antecedentes y "el chisme" de por qué llegó el paciente</p>
        </div>
        <Textarea label="Motivo de consulta" value={motivo} onChange={e=>setMotivo(e.target.value)}
          placeholder="¿Por qué viene hoy el paciente? ¿Qué le preocupa al dueño?..." rows={3}/>
        <Textarea label="Anamnesis / Historia clínica" value={anamnesis} onChange={e=>setAnamnesis(e.target.value)}
          placeholder="¿Cuándo comenzaron los síntomas? ¿Ha tenido episodios similares? ¿Cambios en comportamiento, alimentación, ambiente? ¿Medicamentos previos? ¿Vacunas al día?..." rows={5}/>
        {pet && (
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              {label:'Peso previo', val:pet.weight?`${pet.weight}kg`:'—'},
              {label:'Alergias', val:hasAllergy?pet.allergies:'Ninguna'},
              {label:'Estado rep.', val:pet.reproductiveStatus||'—'},
            ].map(({label,val})=>(
              <div key={label} className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-sm font-bold text-gray-800 mt-0.5 truncate">{val}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  function renderStep3() {
    const vitals = [
      { key:'fc',    label:'Frecuencia cardíaca',    placeholder:'lpm', unit:'lpm' },
      { key:'fr',    label:'Frecuencia respiratoria',placeholder:'rpm', unit:'rpm' },
      { key:'tlc',   label:'Tiempo llenado capilar', placeholder:'seg', unit:'seg' },
      { key:'temp',  label:'Temperatura corporal',   placeholder:'°C',  unit:'°C'  },
      { key:'peso',  label:'Peso en consulta',       placeholder:'kg',  unit:'kg'  },
    ]
    return (
      <div className="space-y-4">
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-0.5">Examen Clínico</p>
          <p className="text-xs text-emerald-600">Constantes vitales y hallazgos del examen físico</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {vitals.map(v=>(
            <div key={v.key}>
              <label className="text-xs font-medium text-gray-600 block mb-1">{v.label}</label>
              <div className="relative">
                <input type="number" step="0.1" placeholder={v.placeholder} value={examen[v.key]}
                  onChange={e=>setExamen(x=>({...x,[v.key]:e.target.value}))}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-emerald-500"/>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">{v.unit}</span>
              </div>
            </div>
          ))}
        </div>
        <Textarea label="Hallazgos clínicos" value={examen.hallazgos}
          onChange={e=>setExamen(x=>({...x,hallazgos:e.target.value}))}
          placeholder="Describe los hallazgos del examen físico: mucosas, hidratación, ganglios, ausculación, palpación abdominal, condición corporal..." rows={4}/>
      </div>
    )
  }

  function renderStep4() {
    return (
      <div className="space-y-4">
        <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4">
          <p className="text-xs font-bold text-violet-700 uppercase tracking-wide mb-0.5">Exámenes Auxiliares</p>
          <p className="text-xs text-violet-600">Selecciona los exámenes de laboratorio e imágenes solicitados. El precio se carga automáticamente del módulo de servicios.</p>
        </div>
        <ServiceSelector
          services={auxServices}
          selected={auxiliares}
          onToggle={toggleAux}
          onQtyChange={(id,qty)=>setAuxiliares(p=>p.map(s=>s.serviceId===id?{...s,quantity:qty}:s))}
        />
      </div>
    )
  }

  function renderStep5() {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
          <p className="text-xs font-bold text-red-700 uppercase tracking-wide mb-0.5">Diagnóstico</p>
          <p className="text-xs text-red-600">Diagnóstico clínico definitivo basado en anamnesis, examen físico y exámenes auxiliares</p>
        </div>
        <Textarea label="Diagnóstico presuntivo" value={presumptiveDx} onChange={e=>setPresumptiveDx(e.target.value)}
          placeholder="Hipótesis diagnóstica inicial..." rows={2}/>
        <Textarea label="Diagnóstico definitivo" value={diagnosis} onChange={e=>setDiagnosis(e.target.value)}
          placeholder="Diagnóstico clínico basado en todos los hallazgos..." rows={4}/>
        {aiSuggestion && (
          <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
                <Star size={14} className="text-violet-600"/>
              </div>
              <div>
                <p className="text-xs font-bold text-violet-700 uppercase tracking-wide mb-1">Sugerencia IA · Protocolo común</p>
                <p className="text-sm text-violet-800">{aiSuggestion}</p>
              </div>
            </div>
          </div>
        )}
        <Textarea label="Observaciones y recomendaciones" value={observations} onChange={e=>setObservations(e.target.value)}
          placeholder="Notas para el expediente, recomendaciones al dueño..." rows={3}/>
      </div>
    )
  }

  function renderStep6() {
    return (
      <div className="space-y-4">
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
          <p className="text-xs font-bold text-orange-700 uppercase tracking-wide mb-0.5">Tratamientos en Clínica</p>
          <p className="text-xs text-orange-600">Procedimientos aplicados durante la consulta: inyecciones, curaciones, vendajes, etc. (NO recetas para llevar a casa)</p>
        </div>
        <ServiceSelector
          services={treatServices}
          selected={treatmentsApplied}
          onToggle={toggleTreat}
          onQtyChange={(id,qty)=>setTreatmentsApplied(p=>p.map(s=>s.serviceId===id?{...s,quantity:qty}:s))}
        />
      </div>
    )
  }

  function renderStep7() {
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-0.5">Receta Médica</p>
          <p className="text-xs text-blue-600">Medicamentos para llevar a casa. Puedes seleccionar del inventario o escribir manualmente (para medicamentos externos o de uso humano)</p>
        </div>

        {medications.map((med,i)=>{
          const calc = med.name&&med.qtyPerDose&&med.frequencyHours&&med.durationDays
            ? calcLabel(med.qtyPerDose,med.frequencyHours,med.durationDays,med.unit) : null
          const invItem = availableMeds.find(c=>c.id===med.catalogId)
          const needed  = calcTotal(med.qtyPerDose,med.frequencyHours,med.durationDays)||0
          return (
            <div key={i} className="border border-blue-100 rounded-2xl overflow-hidden">
              <div className="bg-blue-50 px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Pill size={14} className="text-blue-600"/>
                  <span className="text-sm font-bold text-blue-800">Medicamento {i+1}</span>
                  {med.name&&<Badge variant="blue">{med.name}</Badge>}
                </div>
                {medications.length>1&&(
                  <button onClick={()=>setMedications(p=>p.filter((_,xi)=>xi!==i))} className="text-blue-300 hover:text-red-400 transition-colors">
                    <Trash2 size={14}/>
                  </button>
                )}
              </div>
              <div className="p-4 space-y-3">
                {/* Source toggle */}
                <div className="flex gap-2">
                  <button type="button" onClick={()=>updateMed(i,'source','inventory')}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${med.source!=='manual'?'border-blue-400 bg-blue-50 text-blue-800':'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                    📦 Desde inventario
                  </button>
                  <button type="button" onClick={()=>updateMed(i,'source','manual')}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${med.source==='manual'?'border-orange-400 bg-orange-50 text-orange-800':'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                    ✏️ Escribir manualmente
                  </button>
                </div>

                {med.source==='manual' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <Input label="Nombre del medicamento" value={med.name} onChange={e=>updateMed(i,'name',e.target.value)} placeholder="Ej. Amoxicilina 500mg, Ibuprofeno..." />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Unidad</label>
                      <input value={med.unit} onChange={e=>updateMed(i,'unit',e.target.value)} placeholder="pastilla/ml/mg"
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                    </div>
                    <Input label="Dosis" type="number" min="0.1" step="0.1" value={med.qtyPerDose} onChange={e=>updateMed(i,'qtyPerDose',e.target.value)} placeholder="1"/>
                  </div>
                ) : (
                  <>
                    {availableMeds.length===0&&<p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">Sin medicamentos en inventario. Usa la opción manual.</p>}
                    <Select value={med.catalogId} onChange={e=>updateMed(i,'catalogId',e.target.value)}>
                      <option value="">— Seleccionar del inventario —</option>
                      {availableMeds.map(c=>(
                        <option key={c.id} value={c.id}>
                          {c.name} · Stock: {c.quantity} {c.unit}{c.quantity<=0?' (Agotado)':c.quantity<=(c.minStock||0)?' ⚠':''}
                        </option>
                      ))}
                    </Select>
                    {med.catalogId&&invItem&&(
                      <p className={`text-xs font-medium ${invItem.quantity<=0?'text-red-600':needed>invItem.quantity?'text-red-600':invItem.quantity<=(invItem.minStock||0)?'text-amber-600':'text-emerald-600'}`}>
                        {invItem.quantity<=0?'⚠ Sin stock disponible':
                         needed>invItem.quantity?`⚠ Stock insuficiente: necesitas ${needed}, hay ${invItem.quantity}`:
                         invItem.quantity<=(invItem.minStock||0)?`⚠ Bajo stock: ${invItem.quantity} disponibles`:
                         `✓ Disponible: ${invItem.quantity} ${invItem.unit}`}
                      </p>
                    )}
                  </>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <Input label="Dosis" type="number" min="0.1" step="0.5" value={med.qtyPerDose} onChange={e=>updateMed(i,'qtyPerDose',e.target.value)} placeholder="1"/>
                  <Select label="Frecuencia" value={med.frequencyHours} onChange={e=>updateMed(i,'frequencyHours',e.target.value)}>
                    {FREQUENCY_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                  </Select>
                  <Input label="Días" type="number" min="1" value={med.durationDays} onChange={e=>updateMed(i,'durationDays',e.target.value)} placeholder="7"/>
                </div>
                <Input label="Indicaciones" value={med.instructions} onChange={e=>updateMed(i,'instructions',e.target.value)} placeholder="Ej. Administrar después de comida"/>
                {calc&&(
                  <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                    <Calculator size={16} className="text-blue-500 shrink-0"/>
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

        <button onClick={()=>setMedications(p=>[...p,emptyMed()])}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-blue-200 rounded-2xl text-sm font-semibold text-blue-500 hover:border-blue-400 hover:bg-blue-50 transition-all">
          <Plus size={16}/> Agregar medicamento
        </button>

        {/* Vacunas */}
        <div className="border border-violet-100 rounded-2xl overflow-hidden">
          <div className="bg-violet-50 px-4 py-2.5 flex items-center justify-between">
            <span className="text-sm font-bold text-violet-800 flex items-center gap-2"><Syringe size={14}/> Vacunas aplicadas</span>
            <button onClick={()=>setVaccinesApplied(p=>[...p,{catalogId:'',name:''}])}
              className="flex items-center gap-1 text-xs font-semibold text-violet-600 hover:bg-violet-100 px-2 py-1 rounded-lg transition-colors">
              <Plus size={12}/> Agregar
            </button>
          </div>
          <div className="p-4 space-y-2">
            {vaccinesApplied.length===0?<p className="text-sm text-gray-400 text-center py-3">Sin vacunas aplicadas</p>
            :vaccinesApplied.map((v,i)=>(
              <div key={i} className="flex gap-2 items-center">
                <Select value={v.catalogId} onChange={e=>updateVax(i,e.target.value)} className="flex-1">
                  <option value="">— Seleccionar vacuna —</option>
                  {availableVax.map(c=><option key={c.id} value={c.id}>{c.name} · Stock: {c.quantity}</option>)}
                </Select>
                <button onClick={()=>setVaccinesApplied(p=>p.filter((_,xi)=>xi!==i))} className="text-gray-300 hover:text-red-400 p-2 transition-colors"><Trash2 size={14}/></button>
              </div>
            ))}
          </div>
        </div>

        {/* Desparasitantes */}
        <div className="border border-teal-100 rounded-2xl overflow-hidden">
          <div className="bg-teal-50 px-4 py-2.5 flex items-center justify-between">
            <span className="text-sm font-bold text-teal-800 flex items-center gap-2"><Activity size={14}/> Desparasitantes</span>
            <button onClick={()=>setDewormingsApplied(p=>[...p,{catalogId:'',name:''}])}
              className="flex items-center gap-1 text-xs font-semibold text-teal-600 hover:bg-teal-100 px-2 py-1 rounded-lg transition-colors">
              <Plus size={12}/> Agregar
            </button>
          </div>
          <div className="p-4 space-y-2">
            {dewormingsApplied.length===0?<p className="text-sm text-gray-400 text-center py-3">Sin desparasitantes</p>
            :dewormingsApplied.map((d,i)=>(
              <div key={i} className="flex gap-2 items-center">
                <Select value={d.catalogId} onChange={e=>updateDew(i,e.target.value)} className="flex-1">
                  <option value="">— Seleccionar —</option>
                  {availableDews.map(c=><option key={c.id} value={c.id}>{c.name} · Stock: {c.quantity}</option>)}
                </Select>
                <button onClick={()=>setDewormingsApplied(p=>p.filter((_,xi)=>xi!==i))} className="text-gray-300 hover:text-red-400 p-2 transition-colors"><Trash2 size={14}/></button>
              </div>
            ))}
          </div>
        </div>

        {/* Próxima cita */}
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
          <p className="text-sm font-semibold text-blue-800 mb-2">📅 Próxima cita recomendada</p>
          <Input type="date" value={nextAppt} onChange={e=>setNextAppt(e.target.value)}/>
        </div>
      </div>
    )
  }

  function renderStep8() {
    const inv=buildInvoice()
    return (
      <div className="space-y-5">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{PET_EMOJI[pet?.species]||'🐾'}</span>
            <div>
              <h3 className="font-bold text-lg">{pet?.name}</h3>
              <p className="text-gray-400 text-sm">{pet?.species} · {owner?.name}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {motivo&&<div className="bg-white/10 rounded-xl p-3"><p className="text-gray-400 text-xs">Motivo</p><p className="font-medium mt-0.5 line-clamp-2">{motivo}</p></div>}
            {diagnosis&&<div className="bg-white/10 rounded-xl p-3"><p className="text-gray-400 text-xs">Diagnóstico</p><p className="font-medium mt-0.5 line-clamp-2">{diagnosis}</p></div>}
            {inv.auxiliares?.length>0&&<div className="bg-white/10 rounded-xl p-3"><p className="text-gray-400 text-xs">Auxiliares</p><p className="font-bold mt-0.5">{inv.auxiliares.length}</p></div>}
            {inv.treatments?.length>0&&<div className="bg-white/10 rounded-xl p-3"><p className="text-gray-400 text-xs">Tratamientos</p><p className="font-bold mt-0.5">{inv.treatments.length}</p></div>}
            {inv.medications?.length>0&&<div className="bg-white/10 rounded-xl p-3"><p className="text-gray-400 text-xs">Receta</p><p className="font-bold mt-0.5">{inv.medications.length} med.</p></div>}
            {inv.vaccines?.length>0&&<div className="bg-white/10 rounded-xl p-3"><p className="text-gray-400 text-xs">Vacunas</p><p className="font-bold mt-0.5">{inv.vaccines.length}</p></div>}
          </div>
        </div>

        {/* Follow-up WhatsApp */}
        <div className="border border-emerald-200 rounded-2xl overflow-hidden">
          <button onClick={()=>setShowFollowUp(v=>!v)}
            className="w-full flex items-center justify-between px-4 py-3 bg-emerald-50 hover:bg-emerald-100 transition-colors">
            <div className="flex items-center gap-2">
              <MessageCircle size={16} className="text-emerald-600"/>
              <span className="text-sm font-bold text-emerald-800">¿Programar seguimiento por WhatsApp?</span>
            </div>
            {showFollowUp?<ChevronUp size={16} className="text-emerald-500"/>:<ChevronDown size={16} className="text-emerald-500"/>}
          </button>
          {showFollowUp&&(
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-4 gap-2">
                {FOLLOWUP_OPTIONS.map(opt=>(
                  <button key={opt.days} onClick={()=>{
                    setFollowUpDays(opt.days)
                    setFollowUpMsg(`Hola ${owner?.name||''}, queríamos saber cómo sigue ${pet?.name||'su mascota'} después de su consulta. ¿Ha mejorado? Estamos aquí si necesita algo. 🐾`)
                  }} className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all ${followUpDays===opt.days?'border-emerald-400 bg-emerald-50 text-emerald-700':'border-gray-200 hover:border-emerald-200 text-gray-600'}`}>
                    <span className="text-lg">{opt.icon}</span>
                    <span className="text-xs font-bold">{opt.label}</span>
                  </button>
                ))}
              </div>
              {followUpDays&&(
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Mensaje WhatsApp</label>
                  <textarea value={followUpMsg} onChange={e=>setFollowUpMsg(e.target.value)} rows={3}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"/>
                  <button onClick={handleFollowUpWhatsApp}
                    className="flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
                    <MessageCircle size={15}/> Enviar por WhatsApp
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button onClick={()=>setShowPreview(true)}
            className="flex items-center justify-center gap-2 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold py-3 rounded-2xl transition-all">
            <Eye size={17}/> Ver factura
          </button>
          <button onClick={handleSend}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold py-3 rounded-2xl shadow-lg shadow-emerald-200 transition-all">
            <Send size={17}/> Enviar a Administración
          </button>
        </div>
      </div>
    )
  }

  function renderStep() {
    switch(step){
      case 1: return renderStep1()
      case 2: return renderStep2()
      case 3: return renderStep3()
      case 4: return renderStep4()
      case 5: return renderStep5()
      case 6: return renderStep6()
      case 7: return renderStep7()
      case 8: return renderStep8()
      default: return renderStep1()
    }
  }

  // Quick mode
  function renderQuickMode() {
    return (
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2">
          <Zap size={16} className="text-amber-600 shrink-0"/>
          <p className="text-sm text-amber-800 font-medium">Modo rápido — casos simples y seguimientos</p>
        </div>
        <Select label="Mascota" value={selectedPetId} onChange={e=>setSelectedPetId(e.target.value)}>
          {pets.map(p=>{const o=owners.find(o=>o.id===p.ownerId);return<option key={p.id} value={p.id}>{PET_EMOJI[p.species]||'🐾'} {p.name} — {o?.name}</option>})}
        </Select>
        {pet&&hasAllergy&&(
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            <AlertTriangle size={14} className="text-red-600"/>
            <p className="text-sm font-bold text-red-700">Alergia: {pet.allergies}</p>
          </div>
        )}
        <Input label="Motivo" value={motivo} onChange={e=>setMotivo(e.target.value)} placeholder="Motivo de consulta"/>
        <Textarea label="Diagnóstico" value={diagnosis} onChange={e=>setDiagnosis(e.target.value)} placeholder="Diagnóstico..." rows={2}/>
        <Textarea label="Observaciones" value={observations} onChange={e=>setObservations(e.target.value)} rows={2} placeholder="Notas..."/>
        <button onClick={handleSend}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold py-3 rounded-2xl shadow-lg shadow-emerald-200 transition-all">
          <Send size={17}/> Guardar y enviar
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-10">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Stethoscope size={22} className="text-emerald-500"/> Nueva consulta médica
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">{currentUser?.name} · {new Date().toLocaleDateString('es-GT',{weekday:'long',day:'numeric',month:'long'})}</p>
        </div>
        <button onClick={()=>{setQuickMode(v=>!v);setStep(1)}}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm border-2 transition-all ${quickMode?'bg-amber-500 text-white border-amber-500':'bg-white text-amber-600 border-amber-300 hover:bg-amber-50'}`}>
          <Zap size={15}/> {quickMode?'Modo completo':'Consulta rápida'}
        </button>
      </div>

      {quickMode ? renderQuickMode() : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 items-start">
          <div className="space-y-4">
            {/* Step tabs */}
            <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm">
              <div className="flex gap-1 overflow-x-auto pb-1">
                {STEPS.map(s=>{
                  const Icon=s.icon; const isDone=s.id<step; const isCur=s.id===step
                  return (
                    <button key={s.id} onClick={()=>setStep(s.id)}
                      className={`flex flex-col items-center gap-1 px-2.5 py-2 rounded-xl min-w-[56px] transition-all duration-200 ${isCur?'bg-emerald-500 text-white shadow-sm':isDone?'bg-emerald-50 text-emerald-600':'text-gray-400 hover:bg-gray-50'}`}>
                      {isDone?<CheckCircle size={16}/>:<Icon size={16}/>}
                      <span className="text-[10px] font-semibold whitespace-nowrap">{s.label}</span>
                    </button>
                  )
                })}
              </div>
              <div className="mt-2">
                <ProgressBar current={step} total={STEPS.length}/>
                <p className="text-xs text-gray-400 text-right mt-1">Paso {step} de {STEPS.length}</p>
              </div>
            </div>

            {/* Step content */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm min-h-[300px]">
              {renderStep()}
            </div>

            {/* Navigation */}
            {step<8&&(
              <div className="flex items-center justify-between">
                <button onClick={()=>setStep(s=>Math.max(1,s-1))} disabled={step===1}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                  <ChevronLeft size={16}/> Anterior
                </button>
                <span className="text-xs text-gray-400 font-medium">{step}/{STEPS.length}</span>
                <button onClick={()=>setStep(s=>Math.min(8,s+1))}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-sm shadow-emerald-200 transition-all">
                  Siguiente <ChevronRight size={16}/>
                </button>
              </div>
            )}
          </div>

          {/* Billing panel */}
          <div className="hidden lg:block">
            <BillingSummary
              consultationFee={catalog.consultationFee}
              auxiliares={auxiliares}
              treatmentsApplied={treatmentsApplied}
              medications={medications}
              vaccinesApplied={vaccinesApplied}
              dewormingsApplied={dewormingsApplied}
              availableMeds={availableMeds}
              availableVax={availableVax}
              availableDews={availableDews}
              services={services}
            />
          </div>
        </div>
      )}

      {/* Mobile billing toggle */}
      {!quickMode&&(
        <div className="lg:hidden">
          <button onClick={()=>setShowBilling(v=>!v)}
            className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
            <span className="text-sm font-semibold text-gray-700">Ver resumen de consulta</span>
            {showBilling?<ChevronUp size={16} className="text-gray-400"/>:<ChevronDown size={16} className="text-gray-400"/>}
          </button>
          {showBilling&&(
            <div className="mt-2">
              <BillingSummary
                consultationFee={catalog.consultationFee}
                auxiliares={auxiliares}
                treatmentsApplied={treatmentsApplied}
                medications={medications}
                vaccinesApplied={vaccinesApplied}
                dewormingsApplied={dewormingsApplied}
                availableMeds={availableMeds}
                availableVax={availableVax}
                availableDews={availableDews}
                services={services}
              />
            </div>
          )}
        </div>
      )}

      <Modal isOpen={showPreview} onClose={()=>setShowPreview(false)} title="Previsualización de factura" size="xl">
        <InvoicePreview item={previewItem} pet={pet} owner={owner} showPayButton={false}/>
      </Modal>
    </div>
  )
}
