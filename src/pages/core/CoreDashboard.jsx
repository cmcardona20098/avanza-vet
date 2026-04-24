import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShieldCheck, Building2, Users, ArrowRight, Plus, CheckCircle, Clock,
  Pencil, X, Phone, Mail, MapPin, User, FileText, ToggleLeft, ToggleRight,
  Stethoscope, Scissors, Shield, AlertTriangle
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import Card, { CardHeader } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input, { Select } from '../../components/ui/Input'

// ── Helpers ──────────────────────────────────────────────────────────────────
function domainFromName(name = '') {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')
}

function clinicUsers(users, clinicId) {
  return users.filter(u => u.clinicId === clinicId)
}

// ── Formulario de clínica (crear y editar) ────────────────────────────────────
function ClinicForm({ initial = {}, onSubmit, onCancel, isEdit }) {
  const [name, setName] = useState(initial.name || '')
  const domain = domainFromName(name)

  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        const fd = new FormData(e.target)
        onSubmit({
          name:         fd.get('name'),
          fullName:     fd.get('fullName'),
          phone:        fd.get('phone'),
          email:        fd.get('email'),
          address:      fd.get('address'),
          contactName:  fd.get('contactName'),
          status:       fd.get('status'),
          observations: fd.get('observations'),
        })
      }}
      className="space-y-4"
    >
      <Input
        label="Nombre de la veterinaria *"
        name="name"
        defaultValue={initial.name}
        placeholder="Ej. Clínica San Lucas"
        required
        onChange={e => setName(e.target.value)}
      />
      <Input
        label="Razón social / descripción"
        name="fullName"
        defaultValue={initial.fullName}
        placeholder="Ej. Clínica Veterinaria San Lucas"
      />

      <div className="grid grid-cols-2 gap-3">
        <Input label="Teléfono principal" name="phone" defaultValue={initial.phone} placeholder="+502 0000-0000" />
        <Input label="Correo principal"   name="email" defaultValue={initial.email} placeholder="info@clinica.com" />
      </div>

      <Input label="Dirección"        name="address"     defaultValue={initial.address}     placeholder="Ciudad, País" />
      <Input label="Nombre de contacto" name="contactName" defaultValue={initial.contactName} placeholder="Nombre del encargado" />

      <Select label="Estado" name="status" defaultValue={initial.status || 'active'}>
        <option value="active">Activa</option>
        <option value="inactive">Inactiva</option>
      </Select>

      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1.5">Observaciones</label>
        <textarea
          name="observations"
          defaultValue={initial.observations}
          rows={2}
          placeholder="Notas adicionales..."
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {/* Preview de usuarios si es nueva clínica */}
      {!isEdit && name && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
          <p className="text-xs font-semibold text-blue-800 mb-2">Usuarios que se crearán automáticamente:</p>
          <div className="space-y-1">
            {[
              `admin1@${domain}.com  /  admin1`,
              `admin2@${domain}.com  /  admin2`,
              `vet@${domain}.com     /  vet`,
              `grooming@${domain}.com  /  grooming`,
            ].map(u => (
              <p key={u} className="text-xs font-mono text-blue-700">{u}</p>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-end pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" icon={isEdit ? Pencil : Plus}>
          {isEdit ? 'Guardar cambios' : 'Crear veterinaria'}
        </Button>
      </div>
    </form>
  )
}

// ── Tarjeta de veterinaria ────────────────────────────────────────────────────
function ClinicCard({ clinic, users, onEnter, onEdit, onToggle }) {
  const cu       = clinicUsers(users, clinic.id)
  const admins   = cu.filter(u => u.role === 'admin').length
  const vets     = cu.filter(u => u.role === 'vet').length
  const groomers = cu.filter(u => u.role === 'groomer').length
  const isActive = clinic.status === 'active'

  return (
    <Card padding={false}>
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shrink-0 ${clinic.color || 'bg-blue-600'}`}>
              {clinic.name[0]}
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{clinic.name}</h3>
              {clinic.fullName && clinic.fullName !== clinic.name && (
                <p className="text-xs text-gray-500">{clinic.fullName}</p>
              )}
            </div>
          </div>
          <Badge variant={isActive ? 'green' : 'gray'}>
            {isActive
              ? <span className="flex items-center gap-1"><CheckCircle size={11} /> Activa</span>
              : <span className="flex items-center gap-1"><Clock size={11} /> Inactiva</span>}
          </Badge>
        </div>

        {/* Info */}
        <div className="space-y-1.5 mb-4">
          {clinic.email && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Mail size={11} className="shrink-0" />
              <span>{clinic.email}</span>
            </div>
          )}
          {clinic.phone && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Phone size={11} className="shrink-0" />
              <span>{clinic.phone}</span>
            </div>
          )}
          {clinic.address && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <MapPin size={11} className="shrink-0" />
              <span>{clinic.address}</span>
            </div>
          )}
          {clinic.contactName && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <User size={11} className="shrink-0" />
              <span>{clinic.contactName}</span>
            </div>
          )}
        </div>

        {/* User badges */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          <Badge variant="gray">{cu.length} usuarios</Badge>
          {admins   > 0 && <Badge variant="blue">{admins} Admin</Badge>}
          {vets     > 0 && <Badge variant="green">{vets} Doctora</Badge>}
          {groomers > 0 && <Badge variant="purple">{groomers} Groomer</Badge>}
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={() => onEnter(clinic)}
            className={`w-full flex items-center justify-center gap-2 font-semibold py-2.5 rounded-xl transition-colors text-sm ${
              isActive
                ? 'bg-gray-900 hover:bg-gray-700 text-white'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            disabled={!isActive}
          >
            <Building2 size={15} />
            Entrar a {clinic.name}
            <ArrowRight size={15} />
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => onEdit(clinic)}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 py-2 rounded-lg transition-colors border border-gray-200"
            >
              <Pencil size={12} /> Editar
            </button>
            <button
              onClick={() => onToggle(clinic.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg transition-colors border ${
                isActive
                  ? 'text-red-600 hover:bg-red-50 border-red-200'
                  : 'text-emerald-600 hover:bg-emerald-50 border-emerald-200'
              }`}
            >
              {isActive ? <ToggleLeft size={13} /> : <ToggleRight size={13} />}
              {isActive ? 'Desactivar' : 'Activar'}
            </button>
          </div>
        </div>

        {/* Inactive warning */}
        {!isActive && (
          <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <AlertTriangle size={12} className="text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800">
              Esta veterinaria se encuentra inactiva. Los usuarios no pueden iniciar sesión.
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}

// ── Dashboard Core ────────────────────────────────────────────────────────────
export default function CoreDashboard() {
  const navigate = useNavigate()
  const { clinics, users, addClinic, updateClinic, toggleClinicStatus, setActiveClinic } = useApp()

  const [showNewModal,  setShowNewModal]  = useState(false)
  const [editingClinic, setEditingClinic] = useState(null)
  const [inactiveAlert, setInactiveAlert] = useState('')

  const nonCoreUsers      = users.filter(u => u.role !== 'core')
  const activeClinicCount = clinics.filter(c => c.status === 'active').length

  function handleCreate(data) {
    addClinic(data)
    setShowNewModal(false)
  }

  function handleEdit(data) {
    updateClinic(editingClinic.id, data)
    setEditingClinic(null)
  }

  function handleEnter(clinic) {
    if (clinic.status !== 'active') {
      setInactiveAlert(clinic.name)
      return
    }
    setActiveClinic(clinic.id)
    navigate('/')
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* Header global */}
      <div className="bg-gradient-to-br from-rose-600 to-rose-800 rounded-3xl p-8 text-white">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
            <ShieldCheck size={28} className="text-white" />
          </div>
          <div>
            <p className="text-rose-200 text-sm font-semibold uppercase tracking-widest">Panel Global</p>
            <h1 className="text-3xl font-bold">Vet Flow IT</h1>
            <p className="text-rose-200 text-sm">Administración de veterinarias</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-white/15 rounded-2xl p-4">
            <p className="text-rose-200 text-xs font-semibold uppercase tracking-wide mb-1">Veterinarias</p>
            <p className="text-4xl font-bold">{clinics.length}</p>
            <p className="text-rose-200 text-xs mt-1">{activeClinicCount} activa(s)</p>
          </div>
          <div className="bg-white/15 rounded-2xl p-4">
            <p className="text-rose-200 text-xs font-semibold uppercase tracking-wide mb-1">Usuarios totales</p>
            <p className="text-4xl font-bold">{nonCoreUsers.length}</p>
            <p className="text-rose-200 text-xs mt-1">Sin contar Core</p>
          </div>
          <div className="bg-white/15 rounded-2xl p-4 sm:block hidden">
            <p className="text-rose-200 text-xs font-semibold uppercase tracking-wide mb-1">Sistema</p>
            <p className="text-lg font-bold mt-1">Vet Flow IT</p>
            <p className="text-rose-200 text-xs mt-1">Multi-veterinaria</p>
          </div>
        </div>
      </div>

      {/* Alerta clínica inactiva */}
      {inactiveAlert && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 flex items-center gap-3">
          <AlertTriangle size={18} className="text-amber-600 shrink-0" />
          <p className="text-sm text-amber-900 flex-1">
            <strong>{inactiveAlert}</strong> está inactiva. Actívala primero para ingresar a sus tableros.
          </p>
          <button onClick={() => setInactiveAlert('')} className="text-amber-500 hover:text-amber-700">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Lista de veterinarias */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Administración de veterinarias</h2>
            <p className="text-sm text-gray-500">Crea, edita, activa o desactiva veterinarias</p>
          </div>
          <Button icon={Plus} onClick={() => setShowNewModal(true)}>
            Nueva veterinaria
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {clinics.map(clinic => (
            <ClinicCard
              key={clinic.id}
              clinic={clinic}
              users={users}
              onEnter={handleEnter}
              onEdit={c => setEditingClinic(c)}
              onToggle={toggleClinicStatus}
            />
          ))}

          {/* Placeholder */}
          <div
            className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3 hover:border-rose-300 transition-colors cursor-pointer"
            onClick={() => setShowNewModal(true)}
          >
            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center">
              <Plus size={24} className="text-gray-400" />
            </div>
            <div>
              <p className="font-semibold text-gray-500">Agregar veterinaria</p>
              <p className="text-xs text-gray-400 mt-0.5">Haz clic para registrar una nueva</p>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen por veterinaria */}
      <Card>
        <CardHeader
          title="Usuarios registrados por veterinaria"
          subtitle="Resumen de equipos por clínica"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Veterinaria', 'Estado', 'Total', 'Admin', 'Doctoras', 'Groomers', 'Correo', 'Teléfono'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {clinics.map(clinic => {
                const cu      = clinicUsers(users, clinic.id)
                const admins  = cu.filter(u => u.role === 'admin').length
                const vets    = cu.filter(u => u.role === 'vet').length
                const groomers= cu.filter(u => u.role === 'groomer').length
                const isActive= clinic.status === 'active'
                return (
                  <tr key={clinic.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 ${clinic.color || 'bg-blue-600'}`}>
                          {clinic.name[0]}
                        </div>
                        <span className="font-semibold text-gray-900">{clinic.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant={isActive ? 'green' : 'gray'}>
                        {isActive ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 font-bold text-gray-700">{cu.length}</td>
                    <td className="px-3 py-3">
                      {admins > 0 ? <Badge variant="blue">{admins}</Badge> : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-3">
                      {vets > 0 ? <Badge variant="green">{vets}</Badge> : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-3">
                      {groomers > 0 ? <Badge variant="purple">{groomers}</Badge> : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-3 text-gray-500 text-xs">{clinic.email || '—'}</td>
                    <td className="px-3 py-3 text-gray-500 text-xs">{clinic.phone || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Detalle de usuarios por veterinaria */}
      <Card>
        <CardHeader title="Detalle de usuarios del sistema" subtitle="Todos los usuarios, agrupados por clínica" />
        <div className="divide-y divide-gray-50">
          {clinics.map(clinic => {
            const cu = clinicUsers(users, clinic.id)
            if (cu.length === 0) return null
            return (
              <div key={clinic.id} className="py-3">
                <div className="flex items-center gap-2 px-2 mb-2">
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center text-white text-xs font-bold ${clinic.color || 'bg-blue-600'}`}>
                    {clinic.name[0]}
                  </div>
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">{clinic.name}</p>
                  <Badge variant={clinic.status === 'active' ? 'green' : 'gray'} className="ml-auto">
                    {clinic.status === 'active' ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>
                {cu.map(u => {
                  const RoleIcon = u.role === 'admin' ? Shield : u.role === 'vet' ? Stethoscope : Scissors
                  const roleLabel = { admin: 'Admin', vet: 'Doctora', groomer: 'Groomista' }[u.role] || u.role
                  const roleVar   = { admin: 'blue', vet: 'green', groomer: 'purple' }[u.role] || 'gray'
                  return (
                    <div key={u.id} className="flex items-center gap-3 px-2 py-2">
                      <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                        <RoleIcon size={13} className="text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{u.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{u.username}</p>
                      </div>
                      <Badge variant={roleVar}>{roleLabel}</Badge>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Modal: Nueva veterinaria */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Nueva veterinaria"
      >
        <ClinicForm
          onSubmit={handleCreate}
          onCancel={() => setShowNewModal(false)}
          isEdit={false}
        />
      </Modal>

      {/* Modal: Editar veterinaria */}
      <Modal
        isOpen={!!editingClinic}
        onClose={() => setEditingClinic(null)}
        title={`Editar: ${editingClinic?.name || ''}`}
      >
        {editingClinic && (
          <ClinicForm
            initial={editingClinic}
            onSubmit={handleEdit}
            onCancel={() => setEditingClinic(null)}
            isEdit
          />
        )}
      </Modal>
    </div>
  )
}
