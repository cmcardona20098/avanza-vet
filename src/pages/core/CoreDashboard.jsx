import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Building2, Users, ArrowRight, Plus, CheckCircle, Clock } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import Card, { CardHeader } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'

export default function CoreDashboard() {
  const navigate   = useNavigate()
  const { clinics, users, setActiveClinic } = useApp()

  function enterClinic(clinicId) {
    setActiveClinic(clinicId)
    navigate('/')
  }

  const totalUsers   = users.filter(u => u.role !== 'core').length
  const activeClinicCount = clinics.filter(c => c.status === 'active').length

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
            <p className="text-4xl font-bold">{totalUsers}</p>
            <p className="text-rose-200 text-xs mt-1">Sin contar Core</p>
          </div>
          <div className="bg-white/15 rounded-2xl p-4 sm:block hidden">
            <p className="text-rose-200 text-xs font-semibold uppercase tracking-wide mb-1">Sistema</p>
            <p className="text-lg font-bold mt-1">Vet Flow IT</p>
            <p className="text-rose-200 text-xs mt-1">Multi-veterinaria</p>
          </div>
        </div>
      </div>

      {/* Lista de veterinarias */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Administración de veterinarias</h2>
            <p className="text-sm text-gray-500">Selecciona una veterinaria para ver su operación</p>
          </div>
          <Button icon={Plus} variant="secondary" onClick={() => {}}>
            Nueva veterinaria
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {clinics.map(clinic => {
            const clinicUsers = users.filter(u => u.clinicId === clinic.id)
            const adminCount  = clinicUsers.filter(u => u.role === 'admin').length
            const vetCount    = clinicUsers.filter(u => u.role === 'vet').length
            const groomerCount= clinicUsers.filter(u => u.role === 'groomer').length

            return (
              <Card key={clinic.id} padding={false}>
                <div className="p-6">
                  {/* Header de la clínica */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg ${clinic.color || 'bg-blue-600'}`}>
                        {clinic.name[0]}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{clinic.name}</h3>
                        <p className="text-sm text-gray-500">{clinic.fullName}</p>
                      </div>
                    </div>
                    <Badge variant={clinic.status === 'active' ? 'green' : 'gray'}>
                      {clinic.status === 'active' ? (
                        <span className="flex items-center gap-1"><CheckCircle size={11} /> Activa</span>
                      ) : (
                        <span className="flex items-center gap-1"><Clock size={11} /> Inactiva</span>
                      )}
                    </Badge>
                  </div>

                  {/* Info */}
                  <div className="space-y-2 mb-5">
                    {clinic.email && (
                      <p className="text-sm text-gray-600">
                        <span className="text-gray-400">Email:</span> {clinic.email}
                      </p>
                    )}
                    <p className="text-sm text-gray-600">
                      <span className="text-gray-400">Usuarios:</span>{' '}
                      {clinicUsers.length} registrados
                    </p>
                  </div>

                  {/* Desglose de usuarios */}
                  <div className="flex gap-2 mb-5">
                    {adminCount > 0   && <Badge variant="blue">{adminCount} Admin</Badge>}
                    {vetCount > 0     && <Badge variant="green">{vetCount} Doctora</Badge>}
                    {groomerCount > 0 && <Badge variant="purple">{groomerCount} Groomer</Badge>}
                  </div>

                  {/* Acción */}
                  <button
                    onClick={() => enterClinic(clinic.id)}
                    className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-700 text-white font-semibold py-3 rounded-xl transition-colors"
                  >
                    <Building2 size={16} />
                    Entrar a {clinic.name}
                    <ArrowRight size={16} />
                  </button>
                </div>
              </Card>
            )
          })}

          {/* Placeholder para futura veterinaria */}
          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3 hover:border-gray-300 transition-colors cursor-pointer"
            onClick={() => {}}>
            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center">
              <Plus size={24} className="text-gray-400" />
            </div>
            <div>
              <p className="font-semibold text-gray-500">Agregar veterinaria</p>
              <p className="text-xs text-gray-400 mt-0.5">Próximamente disponible</p>
            </div>
          </div>
        </div>
      </div>

      {/* Usuarios por veterinaria */}
      <Card>
        <CardHeader title="Usuarios registrados por veterinaria" />
        <div className="divide-y divide-gray-50">
          {users.filter(u => u.role !== 'core').map(u => {
            const clinic = clinics.find(c => c.id === u.clinicId)
            return (
              <div key={u.id} className="flex items-center gap-3 py-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                  {u.name?.[0] || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{u.name}</p>
                  <p className="text-xs text-gray-500">{u.username}</p>
                </div>
                <div className="flex items-center gap-2">
                  {clinic && <Badge variant="gray">{clinic.name}</Badge>}
                  <Badge variant={u.role === 'admin' ? 'blue' : u.role === 'vet' ? 'green' : 'purple'}>
                    {u.role === 'admin' ? 'Admin' : u.role === 'vet' ? 'Doctora' : 'Groomer'}
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
