// ─── Inventario por defecto ──────────────────────────────────────────────────
export const defaultInventory = [
  // Medicamentos
  // Medicamentos
  { id: 'inv1',  sku: 'MED-001', name: 'Amoxicilina',            type: 'medication',     unit: 'pastilla', quantity: 100, minStock: 25, price: 15,  catalogId: 'm1',   expiryDate: '2026-06-30', observations: '', proveedor: 'Farmacéutica Guatemala', unidadCompra: 'Caja x 100' },
  { id: 'inv2',  sku: 'MED-002', name: 'Meloxicam',               type: 'medication',     unit: 'pastilla', quantity: 50,  minStock: 20, price: 20,  catalogId: 'm2',   expiryDate: '2026-09-30', observations: '', proveedor: 'Farmacéutica Guatemala', unidadCompra: 'Blíster x 10' },
  { id: 'inv3',  sku: 'MED-003', name: 'Diclofenaco',             type: 'medication',     unit: 'pastilla', quantity: 80,  minStock: 20, price: 8,   catalogId: 'm3',   expiryDate: '2027-01-31', observations: '', proveedor: 'Distribuidora Médica SA', unidadCompra: 'Caja x 50' },
  { id: 'inv4',  sku: 'MED-004', name: 'Panadol',                 type: 'medication',     unit: 'pastilla', quantity: 120, minStock: 30, price: 5,   catalogId: 'm4',   expiryDate: '2026-12-31', observations: '', proveedor: 'Distribuidora Médica SA', unidadCompra: 'Caja x 100' },
  { id: 'inv5',  sku: 'MED-005', name: 'Metronidazol',            type: 'medication',     unit: 'pastilla', quantity: 60,  minStock: 20, price: 12,  catalogId: 'm5',   expiryDate: '2026-08-31', observations: '', proveedor: 'Farmacéutica Guatemala', unidadCompra: 'Blíster x 20' },
  { id: 'inv6',  sku: 'MED-006', name: 'Ivermectina',             type: 'medication',     unit: 'dosis',    quantity: 30,  minStock: 10, price: 25,  catalogId: 'm6',   expiryDate: '2026-03-31', observations: '', proveedor: 'VetSupply GT',           unidadCompra: 'Frasco x 30ml' },
  { id: 'inv7',  sku: 'MED-007', name: 'Prednisona',              type: 'medication',     unit: 'pastilla', quantity: 45,  minStock: 15, price: 10,  catalogId: 'm7',   expiryDate: '2026-11-30', observations: '', proveedor: 'Farmacéutica Guatemala', unidadCompra: 'Blíster x 15' },
  { id: 'inv8',  sku: 'MED-008', name: 'Cefalexina',              type: 'medication',     unit: 'pastilla', quantity: 70,  minStock: 20, price: 18,  catalogId: 'm8',   expiryDate: '2027-02-28', observations: '', proveedor: 'VetSupply GT',           unidadCompra: 'Caja x 50' },
  // Vacunas
  { id: 'inv9',  sku: 'VAC-001', name: 'Polivalente DHPP',        type: 'vaccine',        unit: 'dosis',    quantity: 20,  minStock: 5,  price: 150, catalogId: 'vac1', expiryDate: '2026-06-30', observations: '', proveedor: 'Biogenics GT',           unidadCompra: 'Caja x 10' },
  { id: 'inv10', sku: 'VAC-002', name: 'Antirrábica',             type: 'vaccine',        unit: 'dosis',    quantity: 15,  minStock: 5,  price: 100, catalogId: 'vac2', expiryDate: '2026-07-31', observations: '', proveedor: 'Biogenics GT',           unidadCompra: 'Caja x 10' },
  { id: 'inv11', sku: 'VAC-003', name: 'Bordetella',              type: 'vaccine',        unit: 'dosis',    quantity: 12,  minStock: 4,  price: 120, catalogId: 'vac3', expiryDate: '2026-05-31', observations: '', proveedor: 'Biogenics GT',           unidadCompra: 'Caja x 10' },
  { id: 'inv12', sku: 'VAC-004', name: 'Leptospirosis',           type: 'vaccine',        unit: 'dosis',    quantity: 10,  minStock: 4,  price: 130, catalogId: 'vac4', expiryDate: '2026-08-31', observations: '', proveedor: 'Biogenics GT',           unidadCompra: 'Caja x 10' },
  // Desparasitantes
  { id: 'inv13', sku: 'DEW-001', name: 'Drontal Plus',            type: 'deworming',      unit: 'tableta',  quantity: 40,  minStock: 10, price: 80,  catalogId: 'dew1', expiryDate: '2026-09-30', observations: '', proveedor: 'VetSupply GT',           unidadCompra: 'Caja x 20' },
  { id: 'inv14', sku: 'DEW-002', name: 'Frontline Plus',          type: 'deworming',      unit: 'pipeta',   quantity: 25,  minStock: 10, price: 120, catalogId: 'dew2', expiryDate: '2026-08-31', observations: '', proveedor: 'VetSupply GT',           unidadCompra: 'Caja x 6' },
  { id: 'inv15', sku: 'DEW-003', name: 'Milbemax',                type: 'deworming',      unit: 'tableta',  quantity: 20,  minStock: 8,  price: 90,  catalogId: 'dew3', expiryDate: '2026-07-31', observations: '', proveedor: 'Farmacéutica Guatemala', unidadCompra: 'Blíster x 10' },
  { id: 'inv16', sku: 'DEW-004', name: 'Nexgard',                 type: 'deworming',      unit: 'tableta',  quantity: 18,  minStock: 8,  price: 110, catalogId: 'dew4', expiryDate: '2026-10-31', observations: '', proveedor: 'VetSupply GT',           unidadCompra: 'Caja x 6' },
  // Grooming
  { id: 'inv17', sku: 'GRM-001', name: 'Shampoo hipoalergénico',  type: 'grooming',       unit: 'botella',  quantity: 8,   minStock: 3,  price: 85,  catalogId: null,   expiryDate: '',           observations: 'Para mascotas sensibles', proveedor: 'PetCare Supplies',  unidadCompra: 'Caja x 12' },
  { id: 'inv18', sku: 'GRM-002', name: 'Acondicionador',          type: 'grooming',       unit: 'botella',  quantity: 6,   minStock: 3,  price: 70,  catalogId: null,   expiryDate: '',           observations: '',                        proveedor: 'PetCare Supplies',  unidadCompra: 'Caja x 12' },
  { id: 'inv19', sku: 'GRM-003', name: 'Perfume para mascotas',   type: 'grooming',       unit: 'frasco',   quantity: 4,   minStock: 2,  price: 45,  catalogId: null,   expiryDate: '',           observations: '',                        proveedor: 'PetCare Supplies',  unidadCompra: 'Caja x 24' },
  // Insumos médicos
  { id: 'inv20', sku: 'INS-001', name: 'Jeringa 5ml',             type: 'medical_supply', unit: 'unidad',   quantity: 150, minStock: 50, price: 2,   catalogId: null,   expiryDate: '',           observations: '',                        proveedor: 'Insumed Guatemala',  unidadCompra: 'Caja x 100' },
  { id: 'inv21', sku: 'INS-002', name: 'Guantes de látex',        type: 'medical_supply', unit: 'par',      quantity: 100, minStock: 30, price: 3,   catalogId: null,   expiryDate: '',           observations: '',                        proveedor: 'Insumed Guatemala',  unidadCompra: 'Caja x 100' },
  { id: 'inv22', sku: 'INS-003', name: 'Gasas estériles',         type: 'medical_supply', unit: 'paquete',  quantity: 60,  minStock: 20, price: 8,   catalogId: null,   expiryDate: '2027-06-30', observations: '',                        proveedor: 'Insumed Guatemala',  unidadCompra: 'Caja x 50' },
  { id: 'inv23', sku: 'INS-004', name: 'Algodón',                 type: 'medical_supply', unit: 'rollo',    quantity: 25,  minStock: 10, price: 12,  catalogId: null,   expiryDate: '',           observations: '',                        proveedor: 'Insumed Guatemala',  unidadCompra: 'Bolsa x 500g' },
]

// Datos vaciados — se ingresan desde la aplicación
export const defaultCatalog = {
  medications: [
    { id: 'm1', name: 'Amoxicilina',       price: 15,  unit: 'pastilla' },
    { id: 'm2', name: 'Meloxicam',          price: 20,  unit: 'pastilla' },
    { id: 'm3', name: 'Diclofenaco',        price: 8,   unit: 'pastilla' },
    { id: 'm4', name: 'Panadol',            price: 5,   unit: 'pastilla' },
    { id: 'm5', name: 'Metronidazol',       price: 12,  unit: 'pastilla' },
    { id: 'm6', name: 'Ivermectina',        price: 25,  unit: 'dosis'    },
    { id: 'm7', name: 'Prednisona',         price: 10,  unit: 'pastilla' },
    { id: 'm8', name: 'Cefalexina',         price: 18,  unit: 'pastilla' },
  ],
  treatments: [
    { id: 't1', name: 'Limpieza de herida',       price: 75,  description: 'Limpieza y desinfección de herida' },
    { id: 't2', name: 'Sutura',                   price: 200, description: 'Sutura de herida con hilo' },
    { id: 't3', name: 'Curación',                 price: 50,  description: 'Curación y cambio de vendaje' },
    { id: 't4', name: 'Aplicación de medicamento',price: 30,  description: 'Aplicación inyectable o tópica' },
    { id: 't5', name: 'Vendaje protector',         price: 40,  description: 'Vendaje estéril protector' },
    { id: 't6', name: 'Inyección',                price: 35,  description: 'Aplicación de inyección' },
  ],
  groomingServices: [
    { id: 'gs1', name: 'Baño y secado',      price: 150 },
    { id: 'gs2', name: 'Corte de pelo',      price: 100 },
    { id: 'gs3', name: 'Limpieza de oídos',  price: 50  },
    { id: 'gs4', name: 'Corte de uñas',      price: 40  },
    { id: 'gs5', name: 'Cepillado dental',   price: 60  },
    { id: 'gs6', name: 'Deslanado',          price: 80  },
    { id: 'gs7', name: 'Baño medicado',      price: 200 },
    { id: 'gs8', name: 'Grooming completo',  price: 350 },
    { id: 'gs9', name: 'Perfume',            price: 30  },
  ],
  vaccines: [
    { id: 'vac1', name: 'Polivalente DHPP', price: 150 },
    { id: 'vac2', name: 'Antirrábica',      price: 100 },
    { id: 'vac3', name: 'Bordetella',       price: 120 },
    { id: 'vac4', name: 'Leptospirosis',    price: 130 },
  ],
  dewormings: [
    { id: 'dew1', name: 'Drontal Plus (interno)',  price: 80  },
    { id: 'dew2', name: 'Frontline Plus (externo)',price: 120 },
    { id: 'dew3', name: 'Milbemax',               price: 90  },
    { id: 'dew4', name: 'Nexgard',                price: 110 },
  ],
  consultationFee: 200,
}

export const defaultUsers = [
  { id: 'u1', username: 'Admin',    password: 'Admin', role: 'admin',   name: 'Administración'    },
  { id: 'u2', username: 'Doctora',  password: 'Admin', role: 'vet',     name: 'Dra. Sofía Ramírez' },
  { id: 'u3', username: 'Groomista',password: 'Admin', role: 'groomer', name: 'Mario López'        },
]
