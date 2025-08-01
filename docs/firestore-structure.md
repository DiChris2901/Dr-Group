# Estructura de Firestore para DR Group Dashboard

## Colecciones principales:

### 1. **users** - Información de usuarios
```javascript
{
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
  companies: ["company1", "company2"],
  profilePhoto: "",
  preferences: {
    theme: "light",
    language: "es", 
    notifications: true
  },
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```

### 2. **companies** - Empresas del grupo
```javascript
{
  name: "DR Group Empresa 1",
  description: "Descripción de la empresa", 
  logo: "",
  active: true,
  settings: {
    currency: "COP",
    timezone: "America/Bogota"
  },
  createdAt: "timestamp",
  updatedAt: "timestamp" 
}
```

### 3. **commitments** - Compromisos financieros
```javascript
{
  name: "Pago Servicios Públicos",
  description: "Pago mensual de servicios públicos",
  amount: 500000,
  currency: "COP", 
  company: "company-id",
  type: "recurring", // recurring, one-time
  category: "services", // services, taxes, rent, salaries
  status: "pending", // pending, paid, overdue, cancelled
  dueDate: "timestamp",
  frequency: "monthly", // monthly, quarterly, yearly
  
  paymentMethod: "",
  paymentDate: null,
  receiptUrl: "",
  
  createdBy: "user-id", 
  assignedTo: "user-id",
  tags: ["urgente", "servicios"],
  
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```

### 4. **payments** - Registro de pagos
```javascript  
{
  commitmentId: "commitment-id",
  amount: 500000,
  paymentDate: "timestamp",
  paymentMethod: "transfer", 
  receiptUrl: "storage-url",
  notes: "Pago realizado via transferencia",
  processedBy: "user-id",
  
  createdAt: "timestamp"
}
```

### 5. **notifications** - Notificaciones del sistema
```javascript
{
  userId: "user-id",
  type: "commitment_due",
  title: "Compromiso próximo a vencer", 
  message: "El compromiso 'Pago Servicios' vence en 3 días",
  data: {
    commitmentId: "commitment-id",
    dueDate: "timestamp"
  },
  read: false,
  
  createdAt: "timestamp"
}
```

## Configuración recomendada en Firebase Console:

1. **Authentication**: Crear usuario administrador inicial
2. **Firestore**: Configurar reglas de seguridad
3. **Storage**: Configurar reglas para archivos
