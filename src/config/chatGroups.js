/**
 * Configuración de grupos de chat disponibles para compartir contenido
 * 
 * NOTA: Los IDs deben coincidir con los documentos reales en Firestore collection 'conversations'
 */

export const CHAT_GROUPS = {
  // Chat general para todos los usuarios
  GENERAL: {
    id: 'general',
    name: '💬 Chat General',
    description: 'Todos los usuarios del sistema',
    icon: '💬'
  },
  
  // Chat de gerencia (solo directivos)
  GERENCIA: {
    id: 'gerencia',
    name: '👔 Chat de Gerencia',
    description: 'Equipo directivo y gerencia',
    icon: '👔'
  },
  
  // Chat de finanzas (contabilidad, tesorería)
  FINANZAS: {
    id: 'finanzas',
    name: '💰 Chat de Finanzas',
    description: 'Equipo de finanzas y contabilidad',
    icon: '💰'
  },
  
  // Chat de operaciones
  OPERACIONES: {
    id: 'operaciones',
    name: '⚙️ Chat de Operaciones',
    description: 'Equipo operativo',
    icon: '⚙️'
  }
};

/**
 * Obtener lista de grupos disponibles como array
 */
export const getChatGroupsList = () => {
  return Object.values(CHAT_GROUPS);
};

/**
 * Obtener grupo por ID
 */
export const getChatGroupById = (id) => {
  return Object.values(CHAT_GROUPS).find(group => group.id === id);
};
