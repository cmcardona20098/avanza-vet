import { Stethoscope, Scissors, ShieldCheck } from 'lucide-react'
import { useApp } from '../context/AppContext'
import clsx from 'clsx'

const roles = [
  { key: 'admin',   label: 'Administración', icon: ShieldCheck, color: 'bg-blue-600'   },
  { key: 'vet',     label: 'Doctora',         icon: Stethoscope, color: 'bg-emerald-600' },
  { key: 'groomer', label: 'Groomista',       icon: Scissors,    color: 'bg-violet-600'  },
]

export function RoleBadge() {
  const { role } = useApp()
  const r = roles.find(r => r.key === role)
  const Icon = r.icon
  return (
    <span className={clsx('inline-flex items-center gap-1.5 text-xs font-semibold text-white px-2.5 py-1 rounded-full', r.color)}>
      <Icon size={11} /> {r.label}
    </span>
  )
}

export default function RoleSwitcher() {
  const { role, setRole } = useApp()

  return (
    <div className="px-3 py-3 border-b border-gray-100">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">Cambiar perfil</p>
      <div className="space-y-1">
        {roles.map(({ key, label, icon: Icon, color }) => (
          <button
            key={key}
            onClick={() => setRole(key)}
            className={clsx(
              'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all',
              role === key
                ? 'bg-gray-900 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            )}
          >
            <span className={clsx('w-6 h-6 rounded-md flex items-center justify-center shrink-0', color)}>
              <Icon size={13} className="text-white" />
            </span>
            {label}
            {role === key && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
