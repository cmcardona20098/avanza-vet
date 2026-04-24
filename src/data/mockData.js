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
export const defaultUsers = [
  { id: 'u1', username: 'admin',    password: 'admin',    role: 'admin',   name: 'Administración'     },
  { id: 'u2', username: 'vet',      password: 'vet',      role: 'vet',     name: 'Dra. Sofía Ramírez' },
  { id: 'u3', username: 'grooming', password: 'grooming', role: 'groomer', name: 'Mario López'        },
]
