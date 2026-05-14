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

export const defaultServices = [
  { id: 'srv1',  code: 'CON-001', name: 'Consulta general',          category: 'Consultas',    type: 'Médico',          price: 200 },
  { id: 'srv2',  code: 'CON-002', name: 'Consulta de urgencia',      category: 'Consultas',    type: 'Médico',          price: 350 },
  { id: 'srv3',  code: 'GRM-001', name: 'Grooming completo',         category: 'Grooming',     type: 'Estética',        price: 250 },
  { id: 'srv4',  code: 'GRM-002', name: 'Baño y secado',             category: 'Grooming',     type: 'Estética',        price: 150 },
  { id: 'srv5',  code: 'GRM-003', name: 'Corte de uñas',             category: 'Grooming',     type: 'Estética',        price: 50  },
  { id: 'srv6',  code: 'PRV-001', name: 'Vacuna antirrábica',        category: 'Preventivo',   type: 'Vacunación',      price: 150 },
  { id: 'srv7',  code: 'PRV-002', name: 'Desparasitación interna',   category: 'Preventivo',   type: 'Desparasitación', price: 100 },
  { id: 'srv8',  code: 'PRV-003', name: 'Desparasitación externa',   category: 'Preventivo',   type: 'Desparasitación', price: 80  },
  { id: 'srv9',  code: 'CIR-001', name: 'Limpieza dental',           category: 'Cirugía',      type: 'Procedimiento',   price: 500 },
  { id: 'srv10', code: 'CIR-002', name: 'Esterilización/Castración', category: 'Cirugía',      type: 'Procedimiento',   price: 800 },
  { id: 'srv11', code: 'CUR-001', name: 'Curación de herida',        category: 'Tratamientos', type: 'Procedimiento',   price: 120 },
  { id: 'srv12', code: 'CUR-002', name: 'Sutura',                    category: 'Tratamientos', type: 'Procedimiento',   price: 300 },
  { id: 'srv13', code: 'LAB-001', name: 'Hemograma completo',        category: 'Laboratorio',  type: 'Diagnóstico',     price: 200 },
  { id: 'srv14', code: 'LAB-002', name: 'Química sanguínea',         category: 'Laboratorio',  type: 'Diagnóstico',     price: 350 },
  { id: 'srv15', code: 'IMG-001', name: 'Radiografía',               category: 'Imágenes',     type: 'Diagnóstico',     price: 400 },
  { id: 'srv16', code: 'IMG-002', name: 'Ecografía',                 category: 'Imágenes',     type: 'Diagnóstico',     price: 500 },
]
