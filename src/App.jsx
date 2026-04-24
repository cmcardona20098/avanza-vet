import { Routes, Route, Navigate } from 'react-router-dom'
import { useApp } from './context/AppContext'
import Layout from './components/layout/Layout'
import Login from './pages/auth/Login'

// Páginas compartidas
import Pets             from './pages/Pets'
import PetProfile       from './pages/PetProfile'
import MedicalHistory   from './pages/MedicalHistory'
import Vaccines         from './pages/Vaccines'
import Appointments     from './pages/Appointments'
import Owners           from './pages/Owners'
import WhatsAppFollowUp from './pages/WhatsAppFollowUp'

// Admin
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminAgenda    from './pages/admin/AdminAgenda'
import AdminInbox     from './pages/admin/AdminInbox'
import PriceAdmin     from './pages/admin/PriceAdmin'
import UserAdmin      from './pages/admin/UserAdmin'
import Inventory      from './pages/admin/Inventory'

// Vet
import VetDashboard    from './pages/vet/VetDashboard'
import VetAgenda       from './pages/vet/VetAgenda'
import NewConsultation from './pages/vet/NewConsultation'

// Groomer
import GroomerDashboard   from './pages/groomer/GroomerDashboard'
import GroomerAgenda      from './pages/groomer/GroomerAgenda'
import NewGroomingService from './pages/groomer/NewGroomingService'

// Core (superadmin global)
import CoreDashboard from './pages/core/CoreDashboard'

function DashboardRouter() {
  const { role, activeClinicId } = useApp()
  if (role === 'vet')                       return <VetDashboard />
  if (role === 'groomer')                   return <GroomerDashboard />
  if (role === 'core' && !activeClinicId)   return <CoreDashboard />
  return <AdminDashboard />  // admin, y Core cuando está viendo una clínica
}

function AgendaRouter() {
  const { role } = useApp()
  if (role === 'vet')     return <VetAgenda />
  if (role === 'groomer') return <GroomerAgenda />
  return <Navigate to="/agenda" replace />
}

export default function App() {
  const { isLoggedIn } = useApp()

  if (!isLoggedIn) return <Login />

  return (
    <Layout>
      <Routes>
        <Route path="/"               element={<DashboardRouter />} />
        {/* Admin */}
        <Route path="/agenda"         element={<AdminAgenda />} />
        <Route path="/bandeja"        element={<AdminInbox />} />
        <Route path="/precios"        element={<PriceAdmin />} />
        <Route path="/usuarios"       element={<UserAdmin />} />
        <Route path="/inventario"     element={<Inventory />} />
        {/* Vet */}
        <Route path="/mi-agenda"      element={<AgendaRouter />} />
        <Route path="/nueva-consulta" element={<NewConsultation />} />
        {/* Groomer */}
        <Route path="/nuevo-grooming" element={<NewGroomingService />} />
        {/* Compartidas */}
        <Route path="/mascotas"       element={<Pets />} />
        <Route path="/mascotas/:id"   element={<PetProfile />} />
        <Route path="/historial"      element={<MedicalHistory />} />
        <Route path="/vacunas"        element={<Vaccines />} />
        <Route path="/citas"          element={<Appointments />} />
        <Route path="/duenos"         element={<Owners />} />
        <Route path="/seguimiento"    element={<WhatsAppFollowUp />} />
        <Route path="*"               element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
