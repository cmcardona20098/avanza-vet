import { Menu, Bell, Search, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import clsx from 'clsx'

const roleAccent = {
  core:    'bg-rose-500',
  admin:   'bg-blue-600',
  vet:     'bg-emerald-600',
  groomer: 'bg-violet-600',
}

const roleLabel = {
  core:    'Core',
  admin:   'Admin',
  vet:     'Doctora',
  groomer: 'Groomer',
}

export default function Header({ onMenuClick, title }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const { role, pendingCount, currentUser } = useApp()
  const navigate = useNavigate()

  const accent   = roleAccent[role] || 'bg-blue-600'
  const showBell = role === 'admin' || role === 'core'
  const initials = currentUser?.name?.split(' ').map(w => w[0]).slice(0,2).join('') || '?'

  return (
    <header className="h-14 bg-white/95 backdrop-blur-sm border-b border-gray-100 flex items-center px-4 gap-3 sticky top-0 z-10">
      {/* Mobile menu */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <Menu size={20} />
      </button>

      {/* Title / Search */}
      <div className="flex-1 flex items-center gap-2 min-w-0">
        {searchOpen ? (
          <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
            <Search size={14} className="text-gray-400 shrink-0" />
            <input
              autoFocus
              type="text"
              placeholder="Buscar mascota, dueño, cita..."
              className="flex-1 text-sm bg-transparent outline-none text-gray-900 placeholder:text-gray-400"
              onBlur={() => setSearchOpen(false)}
            />
            <button onClick={() => setSearchOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          </div>
        ) : (
          <h1 className="text-sm font-semibold text-gray-900 truncate">{title}</h1>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {!searchOpen && (
          <button
            onClick={() => setSearchOpen(true)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Search size={17} />
          </button>
        )}

        {showBell && (
          <button
            onClick={() => navigate('/bandeja')}
            className="relative p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Bell size={17} />
            {pendingCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            )}
          </button>
        )}

        {/* User chip */}
        <div className="flex items-center gap-2 ml-1 pl-2 border-l border-gray-100">
          <div className="hidden sm:block text-right">
            <p className="text-xs font-semibold text-gray-800 leading-tight">{currentUser?.name || 'Usuario'}</p>
            <p className="text-[10px] text-gray-400 leading-tight capitalize">{roleLabel[role] || role}</p>
          </div>
          <div className={clsx(
            'w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0',
            accent
          )}>
            {initials}
          </div>
        </div>
      </div>
    </header>
  )
}
