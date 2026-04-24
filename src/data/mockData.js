// ─── Genera dominio limpio a partir del nombre de la veterinaria ─────────────
// Ej: "Clínica San Lucas" → "clinicasanlucas"
export function domainFromName(name = '') {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita acentos
    .replace(/[^a-z0-9]/g, '')       // solo letras y números
}

// Paleta de colores para nuevas clínicas (rota automáticamente)
export const CLINIC_COLORS = [
  'bg-blue-600', 'bg-emerald-600', 'bg-violet-600', 'bg-orange-500',
  'bg-pink-600',  'bg-teal-600',   'bg-indigo-600', 'bg-cyan-600',
]

// ─── Clínicas registradas en el sistema ──────────────────────────────────────
export const defaultClinics = [
  {
    id: 'avanza',
    name: 'Avanza',
    fullName: 'Clínica Veterinaria Avanza',
    email: 'info@avanza.com',
    phone: '',
    address: 'Guatemala',
    status: 'active',
    createdAt: '2025-01-01',
    color: 'bg-blue-600',
  },
]

// ─── Inventario por defecto — vacío, se carga desde Excel ────────────────────
export const defaultInventory = []

// ─── Catálogo por defecto — vacío, se configura desde la app ─────────────────
export const defaultCatalog = {
  medications:     [],
  treatments:      [],
  groomingServices:[],
  vaccines:        [],
  dewormings:      [],
  consultationFee: 200,
}

// ─── Usuarios del sistema ─────────────────────────────────────────────────────
// clinicId: null → superadmin global (Core)
// clinicId: 'avanza' → pertenece a la veterinaria Avanza
export const defaultUsers = [
  { id: 'u1', username: 'Core',                password: 'Amelia20098*!_', role: 'core',    name: 'Administración', clinicId: null      },
  { id: 'u2', username: 'macde@avanza.com',    password: 'Macde',          role: 'admin',   name: 'Administración', clinicId: 'avanza'  },
  { id: 'u3', username: 'mirka@avanza.com',    password: 'Mirka',          role: 'admin',   name: 'Administración', clinicId: 'avanza'  },
  { id: 'u4', username: 'vet@avanza.com',      password: 'vet',            role: 'vet',     name: 'Doctora',        clinicId: 'avanza'  },
  { id: 'u5', username: 'grooming@avanza.com', password: 'grooming',       role: 'groomer', name: 'Groomista',      clinicId: 'avanza'  },
]
