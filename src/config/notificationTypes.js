/**
 * 📧 CATÁLOGO CENTRALIZADO DE TIPOS DE NOTIFICACIONES
 * DR Group Dashboard - Sistema de Notificaciones v2.0
 * 
 * Este archivo define todos los tipos de notificaciones disponibles en el sistema,
 * sus configuraciones, templates y reglas de envío.
 */

export const NOTIFICATION_CATEGORIES = {
  USER_MANAGEMENT: 'user_management',
  COMMITMENTS_DUE: 'commitments_due',
  COMMITMENTS_CRITICAL: 'commitments_critical',
  CONTRACTS: 'contracts',
  PAYMENTS: 'payments',
  INCOMES: 'incomes',
  REPORTS: 'reports',
  SECURITY: 'security',
  SYSTEM: 'system'
};

export const NOTIFICATION_TYPES = {
  // 🧑‍💼 GESTIÓN DE USUARIOS
  USER_CREATED: {
    id: 'user_created',
    category: NOTIFICATION_CATEGORIES.USER_MANAGEMENT,
    name: 'Nuevo Usuario Creado',
    description: 'Cuando se crea un nuevo usuario en el sistema',
    icon: '✅',
    color: '#4caf50',
    enabled: true,
    instantSend: true,
    emailSubject: '🎉 Bienvenido a DR Group Dashboard',
    priority: 'normal'
  },
  
  USER_UPDATED: {
    id: 'user_updated',
    category: NOTIFICATION_CATEGORIES.USER_MANAGEMENT,
    name: 'Usuario Actualizado',
    description: 'Cuando se actualiza información del usuario',
    icon: '✏️',
    color: '#ff9800',
    enabled: true,
    instantSend: true,
    emailSubject: '📝 Tu información ha sido actualizada - DR Group',
    priority: 'normal'
  },
  
  ROLE_CHANGED: {
    id: 'role_changed',
    category: NOTIFICATION_CATEGORIES.USER_MANAGEMENT,
    name: 'Cambio de Rol',
    description: 'Cuando cambian roles o permisos de usuario',
    icon: '🔄',
    color: '#f44336',
    enabled: true,
    instantSend: true,
    emailSubject: '🔐 Tus permisos han cambiado - DR Group',
    priority: 'high'
  },

  // 📅 COMPROMISOS PRÓXIMOS A VENCER
  DUE_IN_15_DAYS: {
    id: 'due_in_15_days',
    category: NOTIFICATION_CATEGORIES.COMMITMENTS_DUE,
    name: '15 días antes del vencimiento',
    description: 'Alerta temprana de compromiso próximo',
    icon: '📅',
    color: '#2196f3',
    enabled: true,
    instantSend: false,
    scheduledTime: '09:00', // 9:00 AM
    emailSubject: '📅 Recordatorio: Compromiso vence en 15 días',
    priority: 'normal'
  },
  
  DUE_IN_7_DAYS: {
    id: 'due_in_7_days',
    category: NOTIFICATION_CATEGORIES.COMMITMENTS_DUE,
    name: '1 semana antes del vencimiento',
    description: 'Alerta de compromiso próximo en 7 días',
    icon: '⏰',
    color: '#ff9800',
    enabled: true,
    instantSend: false,
    scheduledTime: '09:00',
    emailSubject: '⚠️ Importante: Compromiso vence en 7 días',
    priority: 'high'
  },
  
  DUE_IN_2_DAYS: {
    id: 'due_in_2_days',
    category: NOTIFICATION_CATEGORIES.COMMITMENTS_DUE,
    name: '2 días antes del vencimiento',
    description: 'Alerta urgente de compromiso muy próximo',
    icon: '🔔',
    color: '#f44336',
    enabled: true,
    instantSend: false,
    scheduledTime: '08:00', // 8:00 AM
    emailSubject: '🚨 URGENTE: Compromiso vence en 2 días',
    priority: 'critical'
  },
  
  DUE_TODAY: {
    id: 'due_today',
    category: NOTIFICATION_CATEGORIES.COMMITMENTS_DUE,
    name: 'El día del vencimiento',
    description: 'Alerta crítica el día de vencimiento',
    icon: '🔴',
    color: '#d32f2f',
    enabled: true,
    instantSend: false,
    scheduledTime: '07:00', // 7:00 AM
    emailSubject: '🔴 CRÍTICO: Compromiso vence HOY',
    priority: 'critical'
  },

  // 🚨 COMPROMISOS CRÍTICOS (NUEVOS - FASE 1)
  COMMITMENT_OVERDUE: {
    id: 'commitment_overdue',
    category: NOTIFICATION_CATEGORIES.COMMITMENTS_CRITICAL,
    name: 'Compromiso Vencido',
    description: 'Cuando un compromiso pasa de la fecha de vencimiento sin pagarse',
    icon: '❌',
    color: '#c62828',
    enabled: true,
    instantSend: false,
    scheduledTime: '10:00', // 10:00 AM diario
    frequency: 'daily', // Se envía diariamente mientras esté vencido
    emailSubject: '❌ COMPROMISO VENCIDO - Acción requerida',
    priority: 'critical'
  },

  COMMITMENT_HIGH_VALUE: {
    id: 'commitment_high_value',
    category: NOTIFICATION_CATEGORIES.COMMITMENTS_CRITICAL,
    name: 'Compromiso de Alto Valor',
    description: 'Cuando se crea o vence un compromiso mayor al umbral configurado',
    icon: '💎',
    color: '#7b1fa2',
    enabled: true,
    instantSend: true,
    threshold: 50000000, // $50M COP por defecto (configurable)
    emailSubject: '💎 ALERTA: Compromiso de Alto Valor',
    priority: 'high'
  },

  COMMITMENT_COMPLETED: {
    id: 'commitment_completed',
    category: NOTIFICATION_CATEGORIES.COMMITMENTS_CRITICAL,
    name: 'Compromiso Completado',
    description: 'Cuando se completa el pago total de un compromiso',
    icon: '✅',
    color: '#2e7d32',
    enabled: true,
    instantSend: true,
    emailSubject: '✅ Compromiso Completado - DR Group',
    priority: 'normal'
  },

  // � CONTRATOS DE EMPRESAS (NUEVOS - FASE 2)
  CONTRACT_365_DAYS: {
    id: 'contract_365_days',
    category: NOTIFICATION_CATEGORIES.CONTRACTS,
    name: 'Contrato vence en 1 año',
    description: 'Alerta temprana de vencimiento de contrato (365 días)',
    icon: '📄',
    color: '#0288d1',
    enabled: true,
    instantSend: false,
    scheduledTime: '09:00',
    emailSubject: '📄 Recordatorio: Contrato vence en 1 año',
    priority: 'low'
  },

  CONTRACT_180_DAYS: {
    id: 'contract_180_days',
    category: NOTIFICATION_CATEGORIES.CONTRACTS,
    name: 'Contrato vence en 6 meses',
    description: 'Alerta de vencimiento de contrato (180 días)',
    icon: '📋',
    color: '#0288d1',
    enabled: true,
    instantSend: false,
    scheduledTime: '09:00',
    emailSubject: '📋 Importante: Contrato vence en 6 meses',
    priority: 'normal'
  },

  CONTRACT_90_DAYS: {
    id: 'contract_90_days',
    category: NOTIFICATION_CATEGORIES.CONTRACTS,
    name: 'Contrato vence en 3 meses',
    description: 'Alerta de vencimiento de contrato (90 días)',
    icon: '📌',
    color: '#f57c00',
    enabled: true,
    instantSend: false,
    scheduledTime: '09:00',
    emailSubject: '⚠️ Atención: Contrato vence en 3 meses',
    priority: 'high'
  },

  CONTRACT_30_DAYS: {
    id: 'contract_30_days',
    category: NOTIFICATION_CATEGORIES.CONTRACTS,
    name: 'Contrato vence en 1 mes',
    description: 'Alerta urgente de vencimiento de contrato (30 días)',
    icon: '⚠️',
    color: '#f44336',
    enabled: true,
    instantSend: false,
    scheduledTime: '08:00',
    emailSubject: '🚨 URGENTE: Contrato vence en 30 días',
    priority: 'high'
  },

  CONTRACT_DUE_TODAY: {
    id: 'contract_due_today',
    category: NOTIFICATION_CATEGORIES.CONTRACTS,
    name: 'Contrato vence hoy',
    description: 'Notificación el día del vencimiento del contrato',
    icon: '🔴',
    color: '#d32f2f',
    enabled: true,
    instantSend: true,
    emailSubject: '🚨 CRÍTICO: Contrato vence HOY',
    priority: 'critical'
  },

  CONTRACT_EXPIRED: {
    id: 'contract_expired',
    category: NOTIFICATION_CATEGORIES.CONTRACTS,
    name: 'Contrato Vencido',
    description: 'Contrato ya vencido (envío diario durante 30 días)',
    icon: '❌',
    color: '#b71c1c',
    enabled: true,
    instantSend: true,
    emailSubject: '❌ CRÍTICO: Contrato VENCIDO',
    priority: 'critical'
  },

  // �💳 PAGOS (NUEVOS - FASE 1)
  PAYMENT_REGISTERED: {
    id: 'payment_registered',
    category: NOTIFICATION_CATEGORIES.PAYMENTS,
    name: 'Pago Registrado',
    description: 'Cuando se registra un pago en el sistema',
    icon: '💸',
    color: '#1976d2',
    enabled: true,
    instantSend: true,
    emailSubject: '💸 Pago Registrado - DR Group',
    priority: 'normal'
  },

  PAYMENT_PARTIAL: {
    id: 'payment_partial',
    category: NOTIFICATION_CATEGORIES.PAYMENTS,
    name: 'Pago Parcial',
    description: 'Cuando se registra un abono parcial a un compromiso',
    icon: '💰',
    color: '#0288d1',
    enabled: true,
    instantSend: true,
    emailSubject: '💰 Abono Parcial Registrado',
    priority: 'low'
  },

  // 📈 INGRESOS (NUEVOS - FASE 2)
  INCOME_RECEIVED: {
    id: 'income_received',
    category: NOTIFICATION_CATEGORIES.INCOMES,
    name: 'Ingreso Recibido',
    description: 'Cuando se registra un ingreso o consignación',
    icon: '📈',
    color: '#388e3c',
    enabled: true,
    instantSend: true,
    emailSubject: '📈 Ingreso Registrado - DR Group',
    priority: 'normal'
  },

  BANK_BALANCE_LOW: {
    id: 'bank_balance_low',
    category: NOTIFICATION_CATEGORIES.INCOMES,
    name: 'Saldo Bancario Bajo',
    description: 'Cuando el balance de una cuenta es menor al umbral',
    icon: '⚠️',
    color: '#f57c00',
    enabled: false, // Deshabilitado por defecto (requiere configuración)
    instantSend: true,
    threshold: 5000000, // $5M COP por defecto
    emailSubject: '⚠️ ALERTA: Saldo Bancario Bajo',
    priority: 'high'
  },

  // 📊 REPORTES Y RESÚMENES (NUEVOS - FASE 2)
  WEEKLY_SUMMARY: {
    id: 'weekly_summary',
    category: NOTIFICATION_CATEGORIES.REPORTS,
    name: 'Resumen Semanal',
    description: 'Resumen de actividad semanal cada lunes',
    icon: '📧',
    color: '#0097a7',
    enabled: true,
    instantSend: false,
    scheduledTime: '08:00',
    frequency: 'weekly',
    dayOfWeek: 1, // Lunes
    emailSubject: '📊 Resumen Semanal - DR Group',
    priority: 'normal'
  },

  MONTHLY_SUMMARY: {
    id: 'monthly_summary',
    category: NOTIFICATION_CATEGORIES.REPORTS,
    name: 'Resumen Mensual',
    description: 'Cierre mensual el primer día del mes',
    icon: '📅',
    color: '#00796b',
    enabled: true,
    instantSend: false,
    scheduledTime: '09:00',
    frequency: 'monthly',
    dayOfMonth: 1, // Día 1 de cada mes
    emailSubject: '📈 Cierre Mensual - DR Group',
    priority: 'normal'
  },

  CASH_FLOW_ALERT: {
    id: 'cash_flow_alert',
    category: NOTIFICATION_CATEGORIES.REPORTS,
    name: 'Alerta de Flujo de Caja',
    description: 'Proyección de flujo negativo en próximos 30 días',
    icon: '💰',
    color: '#d84315',
    enabled: false, // Deshabilitado (requiere análisis predictivo)
    instantSend: true,
    emailSubject: '⚠️ ALERTA: Flujo de Caja Negativo Proyectado',
    priority: 'critical'
  },

  // 🔐 SEGURIDAD (NUEVOS - FASE 3)
  CRITICAL_PERMISSION_CHANGE: {
    id: 'critical_permission_change',
    category: NOTIFICATION_CATEGORIES.SECURITY,
    name: 'Cambio de Permiso Crítico',
    description: 'Cuando se asigna rol Admin o Super Admin',
    icon: '🛡️',
    color: '#c62828',
    enabled: true,
    instantSend: true,
    emailSubject: '🔐 SEGURIDAD: Cambio Crítico de Permisos',
    priority: 'critical',
    notifyAdmins: true // Notifica a todos los admins
  },

  SUSPICIOUS_ACCESS: {
    id: 'suspicious_access',
    category: NOTIFICATION_CATEGORIES.SECURITY,
    name: 'Acceso Sospechoso',
    description: 'Intentos de login fallidos (3+ consecutivos)',
    icon: '🚨',
    color: '#b71c1c',
    enabled: false, // Deshabilitado (implementación futura)
    instantSend: true,
    threshold: 3, // Intentos fallidos
    emailSubject: '🚨 SEGURIDAD: Acceso Sospechoso Detectado',
    priority: 'critical',
    notifyAdmins: true
  },

  DATA_EXPORT: {
    id: 'data_export',
    category: NOTIFICATION_CATEGORIES.SECURITY,
    name: 'Exportación de Datos',
    description: 'Cuando se exporta un reporte importante',
    icon: '📥',
    color: '#6a1b9a',
    enabled: false, // Deshabilitado (auditoría avanzada)
    instantSend: true,
    emailSubject: '📥 Exportación de Datos Realizada',
    priority: 'low'
  },

  // 📋 OTROS
  NEW_COMMITMENT: {
    id: 'new_commitment',
    category: NOTIFICATION_CATEGORIES.SYSTEM,
    name: 'Nuevo Compromiso Agregado',
    description: 'Cuando se crea un nuevo compromiso',
    icon: '✨',
    color: '#1976d2',
    enabled: true,
    instantSend: true,
    emailSubject: '✨ Nuevo Compromiso Creado - DR Group',
    priority: 'low'
  },

  AUTOMATIC_EVENTS: {
    id: 'automatic_events',
    category: NOTIFICATION_CATEGORIES.SYSTEM,
    name: 'Eventos Automáticos',
    description: 'Coljuegos, Parafiscales, UIAF, etc.',
    icon: '🤖',
    color: '#00897b',
    enabled: true,
    instantSend: false,
    scheduledTime: '06:00', // 6:00 AM
    emailSubject: '🤖 Recordatorio: Eventos Automáticos',
    priority: 'normal'
  }
};

/**
 * Obtener configuración de notificación por ID
 */
export const getNotificationType = (typeId) => {
  return Object.values(NOTIFICATION_TYPES).find(type => type.id === typeId) || null;
};

/**
 * Obtener notificaciones por categoría
 */
export const getNotificationsByCategory = (category) => {
  return Object.values(NOTIFICATION_TYPES).filter(type => type.category === category);
};

/**
 * Obtener notificaciones habilitadas
 */
export const getEnabledNotifications = () => {
  return Object.values(NOTIFICATION_TYPES).filter(type => type.enabled);
};

/**
 * Obtener notificaciones instantáneas
 */
export const getInstantNotifications = () => {
  return Object.values(NOTIFICATION_TYPES).filter(type => type.instantSend && type.enabled);
};

/**
 * Obtener notificaciones programadas
 */
export const getScheduledNotifications = () => {
  return Object.values(NOTIFICATION_TYPES).filter(type => !type.instantSend && type.enabled);
};

/**
 * Obtener configuración por defecto para nuevos usuarios
 */
export const getDefaultNotificationSettings = () => {
  const settings = {};
  Object.values(NOTIFICATION_TYPES).forEach(type => {
    settings[type.id] = {
      email: type.enabled,
      telegram: false, // Telegram deshabilitado por defecto
      push: false // Push deshabilitado por defecto
    };
  });
  return settings;
};

export default NOTIFICATION_TYPES;
