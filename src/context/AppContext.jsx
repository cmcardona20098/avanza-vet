import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { defaultCatalog, defaultUsers, defaultInventory, defaultClinics, domainFromName, CLINIC_COLORS } from '../data/mockData'

const AppContext = createContext(null)

const LS_KEY = 'vetcare_v6'

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return null
}

function getInitial() {
  const saved = loadState()
  return {
    isLoggedIn:  saved?.isLoggedIn  ?? false,
    currentUser: saved?.currentUser ?? null,
    users: saved?.users ?? defaultUsers,
    catalog: saved?.catalog ?? defaultCatalog,
    pets:            saved?.pets            ?? [],
    owners:          saved?.owners          ?? [],
    appointments:    saved?.appointments    ?? [],
    medicalRecords:  saved?.medicalRecords  ?? [],
    vaccineRecords:  saved?.vaccineRecords  ?? [],
    dewormingRecords:saved?.dewormingRecords?? [],
    inbox:           saved?.inbox           ?? [],
    groomingSessions:saved?.groomingSessions?? [],
    followUpSuggestions: saved?.followUpSuggestions ?? [],
    inventory:           saved?.inventory           ?? defaultInventory,
    clinics:             saved?.clinics             ?? defaultClinics,
    activeClinicId:      saved?.activeClinicId      ?? null,
  }
}

export function AppProvider({ children }) {
  const [state, setState] = useState(getInitial)

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(state))
  }, [state])

  const update = useCallback((patch) => setState(s => ({ ...s, ...patch })), [])

  // ─── Effective clinic for the current session ─────────
  const _currentRole        = state.currentUser?.role || 'admin'
  const _isCore             = _currentRole === 'core'
  const effectiveClinicId   = _isCore ? state.activeClinicId : (state.currentUser?.clinicId || null)

  // ─── Auth ────────────────────────────────────────────
  function login(username, password) {
    const user = state.users.find(u => u.username === username && u.password === password)
    if (!user) return false
    // Block login if clinic is inactive (except Core)
    if (user.role !== 'core' && user.clinicId) {
      const clinic = state.clinics.find(c => c.id === user.clinicId)
      if (clinic && clinic.status !== 'active') return 'inactive'
    }
    update({ isLoggedIn: true, currentUser: user })
    return true
  }
  function logout() { update({ isLoggedIn: false, currentUser: null }) }

  // ─── Users ───────────────────────────────────────────
  function addUser(user) {
    update({ users: [...state.users, { ...user, id: `u${Date.now()}` }] })
  }
  function updateUser(id, data) {
    update({ users: state.users.map(u => u.id === id ? { ...u, ...data } : u) })
  }
  function deleteUser(id) {
    update({ users: state.users.filter(u => u.id !== id) })
  }

  // ─── Catalog ─────────────────────────────────────────
  function updateCatalog(section, items) {
    update({ catalog: { ...state.catalog, [section]: items } })
  }
  function updateConsultationFee(fee) {
    update({ catalog: { ...state.catalog, consultationFee: fee } })
  }

  // ─── Owners ──────────────────────────────────────────
  function addOwner(owner) {
    const newOwner = { ...owner, id: `o${Date.now()}`, clinicId: effectiveClinicId || owner.clinicId || null, createdAt: new Date().toISOString().split('T')[0] }
    update({ owners: [...state.owners, newOwner] })
    return newOwner
  }
  function updateOwner(id, data) {
    update({ owners: state.owners.map(o => o.id === id ? { ...o, ...data } : o) })
  }
  function deleteOwner(id) {
    update({ owners: state.owners.filter(o => o.id !== id) })
  }

  // ─── Pets ────────────────────────────────────────────
  function addPet(pet) {
    const newPet = { ...pet, id: `p${Date.now()}`, clinicId: effectiveClinicId || pet.clinicId || null, createdAt: new Date().toISOString().split('T')[0], status: 'active' }
    update({ pets: [...state.pets, newPet] })
    return newPet
  }
  function updatePet(id, data) {
    update({ pets: state.pets.map(p => p.id === id ? { ...p, ...data } : p) })
  }
  function deletePet(id) {
    update({ pets: state.pets.filter(p => p.id !== id) })
  }

  // ─── Appointments ────────────────────────────────────
  function addAppointment(appt) {
    const newAppt = { ...appt, id: `a${Date.now()}`, clinicId: effectiveClinicId || appt.clinicId || null, status: 'confirmed' }
    update({ appointments: [...state.appointments, newAppt] })
    return newAppt
  }
  function updateAppointmentStatus(id, status, extra = {}) {
    update({
      appointments: state.appointments.map(a =>
        a.id === id ? { ...a, status, ...extra } : a
      )
    })
  }
  function initiateAppointment(id) {
    update({
      appointments: state.appointments.map(a =>
        a.id === id
          ? { ...a, status: 'initiated', startedAt: new Date().toISOString() }
          : a
      )
    })
  }

  // ─── Medical Records ─────────────────────────────────
  function addMedicalRecord(record) {
    const newRecord = { ...record, id: `mr${Date.now()}` }
    const updatedRecords = [...state.medicalRecords, newRecord]
    const pet = state.pets.find(p => p.id === record.petId)
    const owner = state.owners.find(o => o.id === pet?.ownerId)
    if (pet && owner) {
      const suggestion = {
        id: `fu${Date.now()}`,
        type: 'post_consultation',
        petId: record.petId,
        ownerId: pet.ownerId,
        recordId: newRecord.id,
        scheduledDate: addDays(1),
        message: `Hola ${owner.name}, queríamos saber cómo siguió ${pet.name} después de su última consulta. ¿Ha mejorado? Si nota algo diferente, no dude en contactarnos. 🐾`,
        status: 'pending',
        createdAt: new Date().toISOString(),
      }
      update({ medicalRecords: updatedRecords, followUpSuggestions: [...state.followUpSuggestions, suggestion] })
    } else {
      update({ medicalRecords: updatedRecords })
    }
    return newRecord
  }

  // ─── Vaccine Records ─────────────────────────────────
  function addVaccineRecord(record) {
    update({ vaccineRecords: [...state.vaccineRecords, { ...record, id: `vr${Date.now()}` }] })
  }

  // ─── Deworming Records ───────────────────────────────
  function addDewormingRecord(record) {
    update({ dewormingRecords: [...state.dewormingRecords, { ...record, id: `dr${Date.now()}` }] })
  }

  // ─── Inbox ───────────────────────────────────────────
  function addInboxItem(item) {
    const today = new Date().toISOString().split('T')[0]
    const newItem = { ...item, id: `inbox${Date.now()}`, sentAt: new Date().toLocaleString('es-GT'), date: today }
    const updatedInbox = [newItem, ...state.inbox]

    // Auto-deduct inventory for consultation prescriptions
    let updatedInventory = state.inventory
    if (item.type === 'consultation' && item.invoice) {
      updatedInventory = _deductInventory(item.invoice, state.inventory)
    }

    // Auto-create medical record for consultations
    let updatedMedicalRecords = state.medicalRecords
    let updatedFollowUp = state.followUpSuggestions
    if (item.type === 'consultation' && item.invoice) {
      const pet   = state.pets.find(p => p.id === item.petId)
      const owner = state.owners.find(o => o.id === item.ownerId)
      const autoRecord = {
        id: `mr${Date.now() + 2}`,
        petId: item.petId,
        ownerId: item.ownerId,
        date: item.invoice?.date || today,
        doctor: item.sentBy || 'Doctora',
        vet: item.sentBy || 'Doctora',
        reason: item.invoice?.reason || '',
        diagnosis: item.invoice?.diagnosis || '',
        medicationsList: item.invoice?.medications || [],
        treatmentsList:  item.invoice?.treatments  || [],
        vaccinesList:    item.invoice?.vaccines    || [],
        dewormingsList:  item.invoice?.dewormings  || [],
        observations:    item.invoice?.observations || '',
        nextAppointment: item.invoice?.nextAppointment || '',
        inboxItemId: newItem.id,
        billingStatus: 'pending',
        autoCreated: true,
      }
      updatedMedicalRecords = [...state.medicalRecords, autoRecord]
      // Post-consultation follow-up suggestion
      if (pet && owner) {
        const followUp = {
          id: `fu${Date.now() + 3}`,
          type: 'post_consultation',
          petId: item.petId,
          ownerId: item.ownerId,
          recordId: autoRecord.id,
          scheduledDate: addDays(1),
          message: `Hola ${owner.name}, queríamos saber cómo siguió ${pet.name} después de su última consulta. ¿Ha mejorado? Si nota algo diferente, no dude en contactarnos. 🐾`,
          status: 'pending',
          createdAt: new Date().toISOString(),
        }
        updatedFollowUp = [...state.followUpSuggestions, followUp]
      }
    }

    // Auto-generate grooming follow-up suggestion
    if (item.type === 'grooming') {
      const pet   = state.pets.find(p => p.id === item.petId)
      const owner = state.owners.find(o => o.id === item.ownerId)
      if (pet && owner) {
        const services = item.invoice?.groomingServices?.map(s => s.name).join(', ') || 'grooming'
        const suggestion = {
          id: `fu${Date.now() + 1}`,
          type: 'grooming_followup',
          petId: item.petId,
          ownerId: item.ownerId,
          scheduledDate: addDays(14),
          message: `Hola ${owner.name}, vimos que ${pet.name} recibió ${services} hace unas semanas. ¿Le gustaría agendar su próximo servicio de grooming? Estamos para ayudarle. ✂️🐾`,
          status: 'pending',
          createdAt: new Date().toISOString(),
        }
        update({ inbox: updatedInbox, inventory: updatedInventory, medicalRecords: updatedMedicalRecords, followUpSuggestions: [...updatedFollowUp, suggestion] })
        return newItem
      }
    }

    update({ inbox: updatedInbox, inventory: updatedInventory, medicalRecords: updatedMedicalRecords, followUpSuggestions: updatedFollowUp })
    return newItem
  }
  function markAsPaid(id, paymentMethod = 'cash') {
    const paidAt = new Date().toLocaleString('es-GT')
    update({
      inbox: state.inbox.map(i =>
        i.id === id ? { ...i, status: 'paid', paidAt, paymentMethod } : i
      ),
      medicalRecords: state.medicalRecords.map(r =>
        r.inboxItemId === id ? { ...r, billingStatus: 'paid', paidAt } : r
      ),
    })
  }

  // Import inventory from parsed Excel rows (upsert by SKU)
  function importInventory(rows) {
    let updated = [...state.inventory]
    rows.forEach(row => {
      const idx = row.sku ? updated.findIndex(i => i.sku === row.sku) : -1
      if (idx >= 0) {
        updated[idx] = { ...updated[idx], ...row }
      } else {
        updated.push({ ...row, id: `inv${Date.now()}${Math.random().toString(36).slice(2, 7)}`, catalogId: null })
      }
    })
    update({ inventory: updated })
  }
  function markWhatsAppSent(id) {
    update({
      inbox: state.inbox.map(i => {
        if (i.id !== id) return i
        return {
          ...i,
          whatsappSent: true,
          whatsappSentAt: new Date().toLocaleString('es-GT'),
          whatsappSendCount: (i.whatsappSendCount || 0) + 1,
        }
      })
    })
  }

  // ─── Grooming Sessions (timer) ───────────────────────
  function startGroomingSession(apptId, petId, ownerId) {
    const session = {
      id: `gs${Date.now()}`,
      apptId, petId, ownerId,
      startTime: new Date().toISOString(),
      endTime: null,
      durationMinutes: null,
      status: 'running',
      groomer: state.currentUser?.name || 'Groomista',
    }
    update({ groomingSessions: [...state.groomingSessions, session] })
    return session.id
  }
  function stopGroomingSession(sessionId) {
    const endTime = new Date().toISOString()
    update({
      groomingSessions: state.groomingSessions.map(s => {
        if (s.id !== sessionId) return s
        const start = new Date(s.startTime)
        const end = new Date(endTime)
        const durationMinutes = Math.round((end - start) / 60000)
        return { ...s, endTime, durationMinutes, status: 'completed' }
      })
    })
  }

  // ─── Inventory ───────────────────────────────────────
  function addInventoryItem(item) {
    update({ inventory: [...state.inventory, { ...item, id: `inv${Date.now()}`, createdAt: new Date().toISOString().split('T')[0] }] })
  }
  function updateInventoryItem(id, data) {
    update({ inventory: state.inventory.map(i => i.id === id ? { ...i, ...data } : i) })
  }
  function deleteInventoryItem(id) {
    update({ inventory: state.inventory.filter(i => i.id !== id) })
  }
  function adjustInventoryQuantity(id, delta) {
    update({ inventory: state.inventory.map(i => i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i) })
  }
  // Internal: deduct medications/vaccines/dewormings from inventory
  // Matches by inventory item id first (new records), falls back to catalogId field (legacy records like 'm1')
  function _deductInventory(invoice, baseInventory) {
    let inv = [...baseInventory]
    const deduct = (itemId, qty) => {
      if (!itemId || !qty) return
      let idx = inv.findIndex(i => i.id === itemId)
      if (idx < 0) idx = inv.findIndex(i => i.catalogId === itemId)
      if (idx >= 0) inv[idx] = { ...inv[idx], quantity: Math.max(0, inv[idx].quantity - qty) }
    }
    invoice.medications?.forEach(m => deduct(m.catalogId, m.totalQuantity || 0))
    invoice.vaccines?.forEach(v => deduct(v.catalogId, 1))
    invoice.dewormings?.forEach(d => deduct(d.catalogId, 1))
    return inv
  }

  // ─── Follow-up suggestions ───────────────────────────
  function addFollowUpSuggestion(suggestion) {
    update({ followUpSuggestions: [...state.followUpSuggestions, { ...suggestion, id: `fu${Date.now()}` }] })
  }
  function markFollowUpSent(id) {
    update({ followUpSuggestions: state.followUpSuggestions.map(f => f.id === id ? { ...f, status: 'sent', sentAt: new Date().toISOString() } : f) })
  }
  function updateFollowUpMessage(id, message) {
    update({ followUpSuggestions: state.followUpSuggestions.map(f => f.id === id ? { ...f, message } : f) })
  }

  // ─── Clear all data ──────────────────────────────────
  function clearAllData() {
    update({
      pets: [], owners: [], appointments: [], medicalRecords: [],
      vaccineRecords: [], dewormingRecords: [], inbox: [],
      groomingSessions: [], followUpSuggestions: [], activeClinicId: null,
    })
  }

  // ─── Clinics ─────────────────────────────────────────
  function addClinic(clinicData) {
    const id     = `clinic_${Date.now()}`
    const domain = domainFromName(clinicData.name)
    const color  = CLINIC_COLORS[state.clinics.length % CLINIC_COLORS.length]

    const newClinic = {
      id,
      name:        clinicData.name        || '',
      fullName:    clinicData.fullName    || clinicData.name || '',
      email:       clinicData.email       || '',
      phone:       clinicData.phone       || '',
      address:     clinicData.address     || '',
      contactName: clinicData.contactName || '',
      observations:clinicData.observations|| '',
      status:      clinicData.status      || 'active',
      createdAt:   new Date().toISOString().split('T')[0],
      color,
    }

    // Auto-generate 4 base users
    const baseUsers = [
      { id: `u_${id}_a1`, username: `admin1@${domain}.com`, password: 'admin1',   role: 'admin',   name: 'Administración', clinicId: id },
      { id: `u_${id}_a2`, username: `admin2@${domain}.com`, password: 'admin2',   role: 'admin',   name: 'Administración', clinicId: id },
      { id: `u_${id}_v`,  username: `vet@${domain}.com`,    password: 'vet',      role: 'vet',     name: 'Doctora',        clinicId: id },
      { id: `u_${id}_g`,  username: `grooming@${domain}.com`,password:'grooming', role: 'groomer', name: 'Groomista',      clinicId: id },
    ]

    update({ clinics: [...state.clinics, newClinic], users: [...state.users, ...baseUsers] })
    return newClinic
  }
  function updateClinic(id, data) {
    update({ clinics: state.clinics.map(c => c.id === id ? { ...c, ...data } : c) })
  }
  function toggleClinicStatus(clinicId) {
    update({
      clinics: state.clinics.map(c =>
        c.id === clinicId ? { ...c, status: c.status === 'active' ? 'inactive' : 'active' } : c
      )
    })
  }
  function deleteClinic(clinicId) {
    update({
      clinics:             state.clinics.filter(c => c.id !== clinicId),
      users:               state.users.filter(u => u.clinicId !== clinicId),
      pets:                state.pets.filter(p => p.clinicId !== clinicId),
      owners:              state.owners.filter(o => o.clinicId !== clinicId),
      appointments:        state.appointments.filter(a => a.clinicId !== clinicId),
      inbox:               state.inbox.filter(i => i.clinicId !== clinicId),
      medicalRecords:      state.medicalRecords.filter(r => r.clinicId !== clinicId),
      vaccineRecords:      state.vaccineRecords.filter(r => r.clinicId !== clinicId),
      dewormingRecords:    state.dewormingRecords.filter(r => r.clinicId !== clinicId),
      groomingSessions:    state.groomingSessions.filter(s => s.clinicId !== clinicId),
      followUpSuggestions: state.followUpSuggestions.filter(f => f.clinicId !== clinicId),
      inventory:           state.inventory.filter(i => i.clinicId !== clinicId),
      activeClinicId:      state.activeClinicId === clinicId ? null : state.activeClinicId,
    })
  }
  function setActiveClinic(clinicId) {
    update({ activeClinicId: clinicId })
  }

  // ─── Multi-tenant data filtering ─────────────────────
  // Each clinic sees only its own records. Core sees clinic data when inside one.
  const _filter = (arr) =>
    effectiveClinicId
      ? arr.filter(r => !r.clinicId || r.clinicId === effectiveClinicId)
      : arr

  const filteredPets             = _filter(state.pets)
  const filteredOwners           = _filter(state.owners)
  const filteredAppointments     = _filter(state.appointments)
  const filteredInbox            = _filter(state.inbox)
  const filteredMedicalRecords   = _filter(state.medicalRecords)
  const filteredVaccineRecords   = _filter(state.vaccineRecords)
  const filteredDewormingRecords = _filter(state.dewormingRecords)
  const filteredGroomingSessions = _filter(state.groomingSessions)
  const filteredFollowUp         = _filter(state.followUpSuggestions)
  const filteredInventory        = effectiveClinicId
    ? state.inventory.filter(i => !i.clinicId || i.clinicId === effectiveClinicId)
    : state.inventory

  const pendingCount   = filteredInbox.filter(i => i.status === 'pending').length
  const role           = _currentRole
  const isCore         = _isCore
  const activeClinicId = state.activeClinicId
  const currentClinic  = state.clinics.find(c => c.id === (state.currentUser?.clinicId || state.activeClinicId)) || null

  return (
    <AppContext.Provider value={{
      ...state,
      // Filtered / computed overrides
      pets:               filteredPets,
      owners:             filteredOwners,
      appointments:       filteredAppointments,
      inbox:              filteredInbox,
      medicalRecords:     filteredMedicalRecords,
      vaccineRecords:     filteredVaccineRecords,
      dewormingRecords:   filteredDewormingRecords,
      groomingSessions:   filteredGroomingSessions,
      followUpSuggestions:filteredFollowUp,
      inventory:          filteredInventory,
      // Meta
      role, isCore, pendingCount, activeClinicId, currentClinic, effectiveClinicId,
      login, logout,
      addUser, updateUser, deleteUser,
      updateCatalog, updateConsultationFee,
      addOwner, updateOwner, deleteOwner,
      addPet, updatePet, deletePet,
      addAppointment, updateAppointmentStatus, initiateAppointment,
      addMedicalRecord, addVaccineRecord, addDewormingRecord,
      addInboxItem, markAsPaid, markWhatsAppSent,
      startGroomingSession, stopGroomingSession,
      addFollowUpSuggestion, markFollowUpSent, updateFollowUpMessage,
      addInventoryItem, updateInventoryItem, deleteInventoryItem, adjustInventoryQuantity, importInventory,
      addClinic, updateClinic, toggleClinicStatus, deleteClinic, setActiveClinic,
      clearAllData,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be inside AppProvider')
  return ctx
}

function addDays(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}
