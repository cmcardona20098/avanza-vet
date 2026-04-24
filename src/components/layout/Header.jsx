import { Menu, Bell, Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { RoleBadge } from '../RoleSwitcher'
import clsx from 'clsx'

const roleAccent = {
  admin:   'bg-blue-600',
  vet:     'bg-emerald-600',
  groomer: 'bg-violet-600',
}

export default function Header({ onMenuClick, title }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const { role, pendingCount } = useApp()
  const navigate = useNavigate()

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center px-4 gap-4 sticky top-0 z-10">
      <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
        <Menu size={20} />
      </button>

      <div className="flex-1 flex items-center gap-3">
        {searchOpen ? (
          <input
            autoFocus
            type="text"
            placeholder="Buscar mascota, dueño..."
            className="flex-1 text-sm border-0 outline-none bg-transparent text-gray-900 placeholder:text-gray-400"
            onBlur={() => setSearchOpen(false)}
          />
        ) : (
          <>
            <h1 className="text-base font-semibold text-gray-900">{title}</h1>
            <RoleBadge />
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => setSearchOpen(true)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
          <Search size={18} />
        </button>

        {role === 'admin' && (
          <button
            onClick={() => navigate('/bandeja')}
            className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Bell size={18} />
            {pendingCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
        )}

        <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ml-1', roleAccent[role])}>
          {role === 'admin' ? 'A' : role === 'vet' ? 'V' : 'G'}
        </div>
      </div>
    </header>
  )
}
