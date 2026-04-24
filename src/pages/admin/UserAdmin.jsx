import { useState } from 'react'
import { Plus, Pencil, Trash2, ShieldCheck, Shield, Stethoscope, Scissors, Eye, EyeOff } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import Card, { CardHeader } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input, { Select } from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'

const roleLabels  = { core: 'Core', admin: 'Administración', vet: 'Doctora', groomer: 'Groomista' }
const roleVariant = { core: 'red',  admin: 'blue',           vet: 'green',   groomer: 'purple'    }
const roleIcons   = { core: ShieldCheck, admin: Shield, vet: Stethoscope, groomer: Scissors }

export default function UserAdmin() {
  const { users, addUser, deleteUser, updateUser, role, currentUser } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]     = useState(null)
  const [showPass, setShowPass]   = useState(false)

  // ── Solo el rol Core puede acceder ──────────────────
  if (role !== 'core') {
    return (
      <div className="max-w-xl mx-auto text-center py-20">
        <ShieldCheck size={48} className="text-red-200 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Acceso restringido</h2>
        <p className="text-gray-500">Solo el usuario <strong>Core</strong> puede gestionar usuarios del sistema.</p>
      </div>
    )
  }

  function handleSubmit(e) {
    e.preventDefault()
    const fd   = new FormData(e.target)
    const data = {
      username: fd.get('username'),
      password: fd.get('password'),
      role:     fd.get('role'),
      name:     fd.get('name'),
    }
    if (editing) { updateUser(editing.id, data) } else { addUser(data) }
    setShowModal(false)
    setEditing(null)
  }

  function openEdit(user) { setEditing(user); setShowModal(true) }
  function openAdd()      { setEditing(null);  setShowModal(true) }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Gestión de usuarios</h2>
          <p className="text-sm text-gray-500">{users.length} usuarios registrados</p>
        </div>
        <Button icon={Plus} onClick={openAdd}>Nuevo usuario</Button>
      </div>

      {/* Banner informativo */}
      <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 flex items-center gap-3">
        <ShieldCheck size={18} className="text-rose-600 shrink-0" />
        <p className="text-sm text-rose-800">
          Solo el rol <strong>Core</strong> puede crear, editar y eliminar usuarios. Los administradores no tienen acceso a esta sección.
        </p>
      </div>

      {/* Lista de usuarios */}
      <div className="space-y-3">
        {users.map(user => {
          const Icon  = roleIcons[user.role]  || Shield
          const isMe  = user.id === currentUser?.id
          const isCore = user.role === 'core'
          return (
            <Card key={user.id}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isCore ? 'bg-rose-100' : 'bg-gray-100'}`}>
                  <Icon size={22} className={isCore ? 'text-rose-600' : 'text-gray-500'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-gray-900">{user.name}</p>
                    {isMe && <Badge variant="blue">Tú</Badge>}
                    {isCore && <Badge variant="red">Core</Badge>}
                  </div>
                  <p className="text-sm text-gray-500">@{user.username}</p>
                  <Badge variant={roleVariant[user.role] || 'gray'} className="mt-1">
                    {roleLabels[user.role] || user.role}
                  </Badge>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => openEdit(user)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar usuario"
                  >
                    <Pencil size={15} />
                  </button>
                  {!isMe && (
                    <button
                      onClick={() => deleteUser(user.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar usuario"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Modal crear / editar */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditing(null) }}
        title={editing ? 'Editar usuario' : 'Nuevo usuario'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre visible"
            name="name"
            defaultValue={editing?.name}
            placeholder="Ej. Administración, Doctora, Groomista"
            required
          />
          <Input
            label="Usuario (para iniciar sesión)"
            name="username"
            defaultValue={editing?.username}
            placeholder="Ej. Core, vet, grooming"
            required
          />
          <div className="relative">
            <Input
              label="Contraseña"
              name="password"
              type={showPass ? 'text' : 'password'}
              defaultValue={editing?.password}
              placeholder="Contraseña"
              required
            />
            <button
              type="button"
              onClick={() => setShowPass(v => !v)}
              className="absolute right-3 bottom-2 text-gray-400 hover:text-gray-600"
            >
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <Select label="Rol" name="role" defaultValue={editing?.role || 'admin'}>
            <option value="core">Core (control total)</option>
            <option value="admin">Administración</option>
            <option value="vet">Doctora Veterinaria</option>
            <option value="groomer">Groomista</option>
          </Select>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" type="button" onClick={() => { setShowModal(false); setEditing(null) }}>
              Cancelar
            </Button>
            <Button type="submit" icon={Plus}>
              {editing ? 'Guardar cambios' : 'Crear usuario'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
