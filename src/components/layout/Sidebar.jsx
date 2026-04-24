import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, PawPrint, ClipboardList, Syringe, CalendarDays,
  Users, MessageCircle, Stethoscope, Scissors,
  Inbox, FilePlus, Calendar, Tag, LogOut, UserCog, Package,
  ShieldCheck, ArrowLeft, Building2
} from 'lucide-react'
import clsx from 'clsx'
import { useApp } from '../../context/AppContext'

// Core en modo clínica: nav completo de admin + gestión usuarios
const coreClinicNav = [
  { to: '/',            icon: LayoutDashboard, label: 'Dashboard'        },
  { to: '/agenda',      icon: CalendarDays,    label: 'Agenda General'   },
  { to: '/bandeja',     icon: Inbox,           label: 'Bandeja', badge: 'inbox' },
  { to: '/precios',     icon: Tag,             label: 'Precios'          },
  { to: '/usuarios',    icon: UserCog,         label: 'Usuarios'         },
  { to: '/mascotas',    icon: PawPrint,        label: 'Mascotas'         },
  { to: '/historial',   icon: ClipboardList,   label: 'Historial Médico' },
  { to: '/vacunas',     icon: Syringe,         label: 'Vacunas'          },
  { to: '/citas',       icon: CalendarDays,    label: 'Citas'            },
  { to: '/duenos',      icon: Users,           label: 'Dueños'           },
  { to: '/inventario',  icon: Package,         label: 'Inventario'       },
  { to: '/seguimiento', icon: MessageCircle,   label: 'Seguimiento IA'   },
]

// Core en modo global: solo panel global
const coreGlobalNav = [
  { to: '/', icon: LayoutDashboard, label: 'Panel Global' },
]

// Admin: sin gestión de usuarios
const adminNav = [
  { to: '/',            icon: LayoutDashboard, label: 'Dashboard'        },
  { to: '/agenda',      icon: CalendarDays,    label: 'Agenda General'   },
  { to: '/bandeja',     icon: Inbox,           label: 'Bandeja', badge: 'inbox' },
  { to: '/precios',     icon: Tag,             label: 'Precios'          },
  { to: '/mascotas',    icon: PawPrint,        label: 'Mascotas'         },
  { to: '/historial',   icon: ClipboardList,   label: 'Historial Médico' },
  { to: '/vacunas',     icon: Syringe,         label: 'Vacunas'          },
  { to: '/citas',       icon: CalendarDays,    label: 'Citas'            },
  { to: '/duenos',      icon: Users,           label: 'Dueños'           },
  { to: '/inventario',  icon: Package,         label: 'Inventario'       },
  { to: '/seguimiento', icon: MessageCircle,   label: 'Seguimiento IA'   },
]

const vetNav = [
  { to: '/',               icon: LayoutDashboard, label: 'Mi Dashboard'   },
  { to: '/mi-agenda',      icon: Calendar,        label: 'Mi Agenda'      },
  { to: '/nueva-consulta', icon: FilePlus,        label: 'Nueva Consulta' },
  { to: '/mascotas',       icon: PawPrint,        label: 'Mascotas'       },
  { to: '/historial',      icon: ClipboardList,   label: 'Historial'      },
  { to: '/vacunas',        icon: Syringe,         label: 'Vacunas'        },
]

const groomerNav = [
  { to: '/',          icon: LayoutDashboard, label: 'Mi Dashboard' },
  { to: '/mi-agenda', icon: Calendar,        label: 'Mi Agenda'    },
  { to: '/mascotas',  icon: PawPrint,        label: 'Mascotas'     },
]

const roleColors = {
  core:    { accent: 'bg-rose-600',    light: 'bg-rose-50 text-rose-700',       name: 'Core'          },
  admin:   { accent: 'bg-blue-600',    light: 'bg-blue-50 text-blue-700',       name: 'Administración'},
  vet:     { accent: 'bg-emerald-600', light: 'bg-emerald-50 text-emerald-700', name: 'Doctora Vet.'  },
  groomer: { accent: 'bg-violet-600',  light: 'bg-violet-50 text-violet-700',   name: 'Groomista'     },
}

export default function Sidebar({ isOpen, onClose }) {
  const { role, pendingCount, currentUser, logout, activeClinicId, currentClinic, setActiveClinic } = useApp()
  const navigate = useNavigate()

  const rc = roleColors[role] || roleColors.admin

  // Selección de nav según rol y contexto
  let nav
  if (role === 'core') {
    nav = activeClinicId ? coreClinicNav : coreGlobalNav
  } else if (role === 'admin') {
    nav = adminNav
  } else if (role === 'vet') {
    nav = vetNav
  } else {
    nav = groomerNav
  }

  function exitClinic() {
    setActiveClinic(null)
    navigate('/')
    onClose()
  }

  // Nombre de la clínica activa (para mostrar en el sidebar)
  const clinicName = currentClinic?.name || (role !== 'core' ? 'Avanza' : 'Panel Global')

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={onClose} />}
      <aside className={clsx(
        'fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-100 z-30',
        'flex flex-col transition-transform duration-300 ease-in-out',
        'lg:translate-x-0 lg:static lg:z-auto',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>

        {/* Logo */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center', rc.accent)}>
              <Stethoscope size={18} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 leading-tight text-sm">Vet Flow IT</p>
              <div className="flex items-center gap-1 mt-0.5">
                {role === 'core' && <ShieldCheck size={10} className="text-rose-500" />}
                <span className={clsx('text-xs font-semibold px-1.5 py-0.5 rounded-full', rc.light)}>
                  {rc.name}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Banner: Core viendo clínica */}
        {role === 'core' && activeClinicId && currentClinic && (
          <div className="px-3 py-2 border-b border-rose-100 bg-rose-50">
            <div className="flex items-center gap-2 mb-1.5">
              <Building2 size={13} className="text-rose-600" />
              <p className="text-xs font-semibold text-rose-700">Viendo clínica</p>
            </div>
            <p className="text-sm font-bold text-rose-900 mb-2">{currentClinic.name}</p>
            <button
              onClick={exitClinic}
              className="w-full flex items-center gap-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 px-2 py-1.5 rounded-lg transition-colors"
            >
              <ArrowLeft size={12} /> Salir al panel global
            </button>
          </div>
        )}

        {/* Clínica del usuario (para admin, vet, groomer) */}
        {role !== 'core' && (
          <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <Building2 size={12} className="text-gray-400" />
              <p className="text-xs text-gray-500">Clínica: <strong className="text-gray-700">{clinicName}</strong></p>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Menú</p>
          <ul className="space-y-0.5">
            {nav.map(({ to, icon: Icon, label, badge }) => (
              <li key={to + label}>
                <NavLink to={to} end={to === '/'} onClick={onClose}
                  className={({ isActive }) => clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group',
                    isActive ? `${rc.light} font-semibold` : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={17} className={isActive ? '' : 'text-gray-400 group-hover:text-gray-600'} />
                      <span className="flex-1">{label}</span>
                      {badge === 'inbox' && pendingCount > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                          {pendingCount}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 space-y-1">
          <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg">
            <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white', rc.accent)}>
              {currentUser?.name?.[0] || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{currentUser?.name || 'Usuario'}</p>
              <p className="text-xs text-gray-500 truncate">{currentUser?.username}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={15} /> Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  )
}
