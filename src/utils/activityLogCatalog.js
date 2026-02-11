// Central catalog for activity log actions/entity types.
// Keep this list in sync with logActivity() usages across the app.

export const humanizeKey = (value) => {
  if (value == null) return 'N/A';
  const text = String(value).trim();
  if (!text) return 'N/A';

  return text
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

export const ACTION_CATALOG = [
  { key: 'create_commitment', label: 'Crear Compromiso' },
  { key: 'update_commitment', label: 'Editar Compromiso' },
  { key: 'delete_commitment', label: 'Eliminar Compromiso' },

  { key: 'create_payment', label: 'Registrar Pago' },
  { key: 'update_payment', label: 'Editar Pago' },
  { key: 'delete_payment', label: 'Eliminar Pago' },

  { key: 'login', label: 'Iniciar Sesión' },
  { key: 'logout', label: 'Cerrar Sesión' },
  { key: 'profile_update', label: 'Actualizar Perfil' },

  // Common admin/system actions seen in logs
  { key: 'create_company', label: 'Crear Empresa' },
  { key: 'update_company', label: 'Editar Empresa' },
  { key: 'delete_company', label: 'Eliminar Empresa' },

  { key: 'create_income', label: 'Crear Ingreso' },
  { key: 'update_income', label: 'Editar Ingreso' },
  { key: 'delete_income', label: 'Eliminar Ingreso' },

  { key: 'create_room', label: 'Crear Sala' },
  { key: 'update_room', label: 'Editar Sala' },
  { key: 'delete_room', label: 'Eliminar Sala' },

  { key: 'update_user', label: 'Editar Usuario' },
  { key: 'create_user', label: 'Crear Usuario' },
  { key: 'delete_user', label: 'Eliminar Usuario' },

  { key: 'create_bank_account', label: 'Crear Cuenta Bancaria' },
  { key: 'update_bank_account', label: 'Editar Cuenta Bancaria' },
  { key: 'delete_bank_account', label: 'Eliminar Cuenta Bancaria' },

  // Reports
  { key: 'view_report', label: 'Ver Reporte' },
  { key: 'download_report', label: 'Descargar Reporte' },
  { key: 'export_data', label: 'Exportar Datos' },
  { key: 'export_report', label: 'Exportar Reporte' },
  { key: 'reports_export', label: 'Exportar Reportes (Resumen)' },
  { key: 'reports_refresh', label: 'Actualizar Resumen de Reportes' },
];

export const ENTITY_TYPE_CATALOG = [
  { key: 'commitment', label: 'Compromiso' },
  { key: 'payment', label: 'Pago' },
  { key: 'company', label: 'Empresa' },
  { key: 'income', label: 'Ingreso' },
  { key: 'room', label: 'Sala' },
  { key: 'user', label: 'Usuario' },
  { key: 'bank_account', label: 'Cuenta Bancaria' },
  { key: 'report', label: 'Reporte' },
  { key: 'auth', label: 'Autenticación' },
  { key: 'system', label: 'Sistema' },
  { key: 'document', label: 'Documento' },
  { key: 'summary', label: 'Resumen' },
];

export const getActionLabel = (actionKey) => {
  const normalized = String(actionKey ?? '').trim();
  const match = ACTION_CATALOG.find((a) => a.key === normalized);
  return match?.label || humanizeKey(normalized);
};

export const getEntityTypeLabel = (entityTypeKey) => {
  const normalized = String(entityTypeKey ?? '').trim();
  const match = ENTITY_TYPE_CATALOG.find((e) => e.key === normalized);
  return match?.label || humanizeKey(normalized);
};
