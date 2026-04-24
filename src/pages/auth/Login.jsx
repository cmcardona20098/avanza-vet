import { useState } from 'react'
import { Stethoscope, Eye, EyeOff, LogIn, ShieldCheck, Scissors } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import clsx from 'clsx'

const roleInfo = [
  { role: 'admin',   label: 'Administración', icon: ShieldCheck,  color: 'from-blue-500 to-blue-700',    hint: 'Usuario: Admin / Contraseña: Admin' },
  { role: 'vet',     label: 'Doctora',         icon: Stethoscope,  color: 'from-emerald-500 to-emerald-700', hint: 'Usuario: Doctora / Contraseña: Admin' },
  { role: 'groomer', label: 'Groomista',       icon: Scissors,     color: 'from-violet-500 to-violet-700',  hint: 'Usuario: Groomista / Contraseña: Admin' },
]

export default function Login() {
  const { login } = useApp()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    setTimeout(() => {
      const ok = login(username.trim(), password)
      if (!ok) setError('Usuario o contraseña incorrectos')
      setLoading(false)
    }, 600)
  }

  function quickLogin(username, password) {
    setUsername(username)
    setPassword(password)
    setTimeout(() => login(username, password), 100)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
            <Stethoscope size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">VetCare Pro</h1>
          <p className="text-blue-300 text-sm mt-1">Sistema de gestión veterinaria</p>
        </div>

        {/* Card de login */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-6 text-center">Iniciar sesión</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-blue-200 block mb-1.5">Usuario</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Ingresa tu usuario"
                required
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-blue-200 block mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-11 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center bg-red-400/10 border border-red-400/20 rounded-xl py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors mt-2"
            >
              {loading ? (
                <span className="animate-pulse">Verificando...</span>
              ) : (
                <><LogIn size={18} /> Ingresar</>
              )}
            </button>
          </form>

          {/* Acceso rápido */}
          <div className="mt-6">
            <p className="text-white/40 text-xs text-center mb-3">Acceso rápido (desarrollo)</p>
            <div className="grid grid-cols-3 gap-2">
              {roleInfo.map(({ role, label, icon: Icon, color, hint }) => (
                <button
                  key={role}
                  onClick={() => {
                    const creds = { admin: ['Admin','Admin'], vet: ['Doctora','Admin'], groomer: ['Groomista','Admin'] }
                    quickLogin(...creds[role])
                  }}
                  title={hint}
                  className={clsx(
                    'flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gradient-to-br text-white',
                    'hover:scale-105 transition-transform cursor-pointer',
                    color
                  )}
                >
                  <Icon size={18} />
                  <span className="text-xs font-semibold">{label}</span>
                </button>
              ))}
            </div>
            <p className="text-white/30 text-xs text-center mt-2">Todos usan contraseña: Admin</p>
          </div>
        </div>
      </div>
    </div>
  )
}
