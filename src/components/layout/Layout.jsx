import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { useApp } from '../../context/AppContext'

const pageTitles = {
  '/':               { admin: 'Dashboard', vet: 'Mi Dashboard', groomer: 'Mi Dashboard' },
  '/agenda':         { admin: 'Agenda General' },
  '/mi-agenda':      { vet: 'Mi Agenda', groomer: 'Mi Agenda' },
  '/bandeja':        { admin: 'Bandeja de Servicios' },
  '/nueva-consulta': { vet: 'Nueva Consulta Médica' },
  '/nuevo-grooming': { groomer: 'Registrar Grooming' },
  '/mascotas':       { admin: 'Mascotas', vet: 'Mascotas', groomer: 'Mascotas' },
  '/historial':      { admin: 'Historial Médico', vet: 'Historial Médico' },
  '/vacunas':        { admin: 'Vacunas & Desparasitantes', vet: 'Vacunas' },
  '/citas':          { admin: 'Citas' },
  '/duenos':         { admin: 'Dueños' },
  '/seguimiento':    { admin: 'Seguimiento con IA' },
}

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { role } = useApp()
  const location = useLocation()

  const basePath = '/' + location.pathname.split('/')[1]
  const titles = pageTitles[basePath] || {}
  // core ve los mismos títulos que admin
  const effectiveRole = role === 'core' ? 'admin' : role
  const title = titles[effectiveRole] || titles['admin'] || 'Avanza Vet'

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} title={title} />
        <main className="flex-1 overflow-y-auto bg-gray-50/70 p-4 md:p-6">
          <div className="slide-up">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
