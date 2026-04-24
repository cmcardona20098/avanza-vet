import { useState } from 'react'
import { MessageCircle, Send, Bot, CheckCircle, Sparkles, Scissors, Stethoscope, Plus, Clock } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Card, { CardHeader } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input, { Select, Textarea } from '../components/ui/Input'

const typeConfig = {
  post_consultation:   { label: 'Post consulta',   color: 'blue',   icon: Stethoscope, bg: 'bg-blue-50   border-blue-100'  },
  vaccine_reminder:    { label: 'Vacuna',           color: 'yellow', icon: Bot,         bg: 'bg-yellow-50 border-yellow-100'},
  grooming_followup:   { label: 'Seguimiento grooming', color: 'purple', icon: Scissors, bg: 'bg-violet-50 border-violet-100'},
  deworming_reminder:  { label: 'Desparasitante',   color: 'green',  icon: Bot,         bg: 'bg-green-50  border-green-100' },
}

function FollowUpCard({ fu, pet, owner, onSend, onEdit, onMarkSent }) {
  const [editing, setEditing] = useState(false)
  const [msg, setMsg] = useState(fu.message)
  const type = typeConfig[fu.type] || typeConfig.post_consultation
  const TypeIcon = type.icon

  function handleSave() {
    onEdit(fu.id, msg)
    setEditing(false)
  }

  function handleSend() {
    const number = owner?.whatsapp?.replace(/\D/g, '') || owner?.phone?.replace(/\D/g, '')
    if (number) {
      window.open(`https://wa.me/${number}?text=${encodeURIComponent(msg)}`, '_blank')
    }
    onMarkSent(fu.id)
  }

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${fu.type === 'grooming_followup' ? 'bg-violet-100' : 'bg-blue-100'}`}>
              <TypeIcon size={18} className={fu.type === 'grooming_followup' ? 'text-violet-600' : 'text-blue-600'} />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{pet?.name || '—'} <span className="text-gray-400 font-normal">·</span> <span className="text-gray-600 font-normal text-sm">{owner?.name}</span></p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <Badge variant={type.color}>{type.label}</Badge>
                <Badge variant={fu.status === 'sent' ? 'green' : 'yellow'}>{fu.status === 'sent' ? 'Enviado' : 'Pendiente'}</Badge>
                {fu.scheduledDate && (
                  <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={10} />{fu.scheduledDate}</span>
                )}
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-400 shrink-0">{owner?.whatsapp || owner?.phone}</div>
        </div>

        {/* Mensaje */}
        <div className={`rounded-xl p-4 border ${type.bg}`}>
          <div className="flex items-center gap-1.5 mb-2">
            <Bot size={13} className="text-gray-500" />
            <span className="text-xs font-semibold text-gray-500">Mensaje sugerido por IA</span>
          </div>
          {editing ? (
            <textarea
              value={msg}
              onChange={e => setMsg(e.target.value)}
              rows={4}
              className="w-full text-sm bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          ) : (
            <p className="text-sm text-gray-800 leading-relaxed">{fu.message}</p>
          )}
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap gap-2 justify-end">
          {editing ? (
            <>
              <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>Cancelar</Button>
              <Button size="sm" icon={CheckCircle} onClick={handleSave}>Guardar</Button>
            </>
          ) : (
            <>
              {fu.status === 'pending' && (
                <Button size="sm" variant="ghost" icon={Sparkles} onClick={() => setEditing(true)}>Editar</Button>
              )}
              {fu.status === 'pending' && (
                <>
                  <Button size="sm" variant="whatsapp" icon={Send} onClick={handleSend}>
                    Enviar por WhatsApp
                  </Button>
                  <Button size="sm" variant="secondary" icon={CheckCircle} onClick={() => onMarkSent(fu.id)}>
                    Marcar como enviado
                  </Button>
                </>
              )}
              {fu.status === 'sent' && (
                <div className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                  <CheckCircle size={15} /> Enviado
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  )
}

export default function WhatsAppFollowUp() {
  const { followUpSuggestions, pets, owners, addFollowUpSuggestion, markFollowUpSent, updateFollowUpMessage } = useApp()
  const [tab, setTab] = useState('consultation')
  const [showModal, setShowModal] = useState(false)

  function getPet(id)   { return pets.find(p => p.id === id) }
  function getOwner(id) { return owners.find(o => o.id === id) }

  const consultationFollowUps = followUpSuggestions.filter(f => ['post_consultation', 'vaccine_reminder', 'deworming_reminder'].includes(f.type))
  const groomingFollowUps     = followUpSuggestions.filter(f => f.type === 'grooming_followup')
  const current = tab === 'consultation' ? consultationFollowUps : groomingFollowUps

  function handleCreate(e) {
    e.preventDefault()
    const fd = new FormData(e.target)
    const petId = fd.get('petId')
    const pet   = pets.find(p => p.id === petId)
    const owner = owners.find(o => o.id === pet?.ownerId)
    const type  = fd.get('type')
    const templates = {
      post_consultation:  `Hola ${owner?.name}, queríamos saber cómo siguió ${pet?.name} después de su última consulta. ¿Ha mejorado? Si nota algo diferente, no dude en contactarnos. 🐾`,
      vaccine_reminder:   `Hola ${owner?.name}, le recordamos que ${pet?.name} tiene una vacuna pendiente. ¿Le gustaría agendar una cita? Estamos para ayudarle. 💉`,
      deworming_reminder: `Hola ${owner?.name}, es momento de aplicar el desparasitante de ${pet?.name}. ¿Cuándo podemos agendarle? 💊`,
      grooming_followup:  `Hola ${owner?.name}, vimos que ${pet?.name} estuvo en nuestro salón de grooming hace un tiempo. ¿Le gustaría agendar un nuevo baño? ✂️🐾`,
    }
    addFollowUpSuggestion({
      type,
      petId,
      ownerId: pet?.ownerId,
      scheduledDate: fd.get('scheduledDate'),
      message: templates[type] || fd.get('customMsg'),
      status: 'pending',
      createdAt: new Date().toISOString(),
    })
    setShowModal(false)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">Seguimiento con IA</h2>
            <span className="inline-flex items-center gap-1 text-xs bg-gradient-to-r from-violet-100 to-purple-100 text-purple-700 border border-purple-200 px-2.5 py-0.5 rounded-full font-medium">
              <Sparkles size={10} /> IA
            </span>
          </div>
          <p className="text-sm text-gray-500">Mensajes automáticos sugeridos por IA para WhatsApp</p>
        </div>
        <Button icon={Plus} onClick={() => setShowModal(true)}>Nuevo seguimiento</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pendientes',    value: followUpSuggestions.filter(f => f.status === 'pending').length, color: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
          { label: 'Enviados',      value: followUpSuggestions.filter(f => f.status === 'sent').length,    color: 'bg-green-50 border-green-200 text-green-800'  },
          { label: 'Total',         value: followUpSuggestions.length,                                      color: 'bg-blue-50 border-blue-200 text-blue-800'     },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 text-center ${s.color}`}>
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-xs font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs principales */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setTab('consultation')}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === 'consultation' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <Stethoscope size={14} /> Consultas médicas
          <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{consultationFollowUps.length}</span>
        </button>
        <button
          onClick={() => setTab('grooming')}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === 'grooming' ? 'border-violet-600 text-violet-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <Scissors size={14} /> Grooming
          <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{groomingFollowUps.length}</span>
        </button>
      </div>

      {/* Lista */}
      <div className="space-y-4">
        {current.length === 0 ? (
          <div className="text-center py-16">
            <MessageCircle size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Sin seguimientos en esta sección</p>
            <p className="text-gray-400 text-sm mt-1">
              {tab === 'consultation'
                ? 'Se generan automáticamente después de cada consulta médica'
                : 'Crea un seguimiento de grooming para agendar el próximo baño'}
            </p>
          </div>
        ) : (
          current.map(fu => (
            <FollowUpCard
              key={fu.id}
              fu={fu}
              pet={getPet(fu.petId)}
              owner={getOwner(fu.ownerId)}
              onEdit={updateFollowUpMessage}
              onMarkSent={markFollowUpSent}
            />
          ))
        )}
      </div>

      {/* Modal nuevo seguimiento */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Crear seguimiento" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <Select label="Mascota" name="petId" required>
            <option value="">— Seleccionar —</option>
            {pets.map(p => {
              const o = owners.find(o => o.id === p.ownerId)
              return <option key={p.id} value={p.id}>{p.name} — {o?.name}</option>
            })}
          </Select>
          <Select label="Tipo de seguimiento" name="type">
            <option value="post_consultation">Post consulta médica</option>
            <option value="vaccine_reminder">Recordatorio de vacuna</option>
            <option value="deworming_reminder">Recordatorio desparasitante</option>
            <option value="grooming_followup">Seguimiento de grooming</option>
          </Select>
          <Input label="Fecha programada" name="scheduledDate" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit" icon={Plus}>Crear</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
