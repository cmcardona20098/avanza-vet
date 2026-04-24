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
  { id: 'u1', username: 'Admin',    password: 'Amelia20098*!_', role: 'admin',   name: 'Administración' },
  { id: 'u2', username: 'vet',      password: 'vet',            role: 'vet',     name: 'Doctora'        },
  { id: 'u3', username: 'grooming', password: 'grooming',       role: 'groomer', name: 'Groomista'      },
  { id: 'u4', username: 'Macde',    password: 'Macde',          role: 'admin',   name: 'Administración' },
  { id: 'u5', username: 'Mirka',    password: 'Mirka',          role: 'admin',   name: 'Administración' },
]
