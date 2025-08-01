// Estructura inicial recomendada para Firestore Collections

// 1. Colección: users
{
  // Documento ID: {userId}
  uid: "user-firebase-uid",
  email: "admin@drgroup.com",
  name: "Administrador DR Group",
  role: "admin", // admin, manager, user, readonly
  permissions: [
    "read_all_companies",
    "write_all_companies", 
    "read_all_commitments",
    "write_all_commitments",
    "manage_users",
    "download_receipts"
  ],
  companies: ["company1", "company2"], // IDs de empresas que puede ver
  profilePhoto: "", // URL de la foto de perfil
  preferences: {
    theme: "light", // light, dark
    language: "es",
    notifications: true
  },
  createdAt: "timestamp",
  updatedAt: "timestamp"
}

// 2. Colección: companies
{
  // Documento ID: auto-generado
  name: "DR Group Empresa 1",
  description: "Descripción de la empresa",
  logo: "", // URL del logo
  active: true,
  settings: {
    currency: "COP",
    timezone: "America/Bogota"
  },
  createdAt: "timestamp",
  updatedAt: "timestamp"
}

// 3. Colección: commitments
{
  // Documento ID: auto-generado
  name: "Pago Servicios Públicos",
  description: "Pago mensual de servicios públicos",
  amount: 500000,
  currency: "COP",
  company: "company-id",
  type: "recurring", // recurring, one-time
  category: "services", // services, taxes, rent, salaries, etc.
  status: "pending", // pending, paid, overdue, cancelled
  dueDate: "timestamp",
  frequency: "monthly", // monthly, quarterly, yearly (solo para recurring)
  
  // Información de pago
  paymentMethod: "", // transfer, cash, check
  paymentDate: null, // timestamp cuando se pagó
  receiptUrl: "", // URL del comprobante en Storage
  
  // Metadata
  createdBy: "user-id",
  assignedTo: "user-id",
  tags: ["urgente", "servicios"],
  
  createdAt: "timestamp",
  updatedAt: "timestamp"
}

// 4. Colección: payments
{
  // Documento ID: auto-generado
  commitmentId: "commitment-id",
  amount: 500000,
  paymentDate: "timestamp",
  paymentMethod: "transfer",
  receiptUrl: "storage-url",
  notes: "Pago realizado via transferencia",
  processedBy: "user-id",
  
  createdAt: "timestamp"
}

// 5. Colección: notifications
{
  // Documento ID: auto-generado
  userId: "user-id",
  type: "commitment_due", // commitment_due, payment_overdue, system_alert
  title: "Compromiso próximo a vencer",
  message: "El compromiso 'Pago Servicios' vence en 3 días",
  data: {
    commitmentId: "commitment-id",
    dueDate: "timestamp"
  },
  read: false,
  
  createdAt: "timestamp"
}
