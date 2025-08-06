// 🎯 DR Group - Configuración Centralizada de Usuarios del Sistema
// Este archivo contiene la configuración de usuarios conocidos del sistema
// para evitar redundancia y mantener datos consistentes

export const SYSTEM_USERS = {
  'admin@drgroup.com': {
    name: 'Administrador DR Group',
    position: 'Administrador del Sistema',
    department: 'Tecnología',
    photoURL: null,
    accountType: 'Administrador',
    role: 'ADMIN',
    permissions: ['ALL'],
    lastLogin: () => new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    joinDate: '2024-01-01T00:00:00.000Z',
    isActive: true,
    isSystemUser: true
  },
  'diego@drgroup.com': {
    name: 'Diego Rodriguez',
    position: 'Director Ejecutivo',
    department: 'Dirección General',
    photoURL: null,
    accountType: 'Administrador',
    role: 'ADMIN',
    permissions: ['ALL'],
    lastLogin: () => new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    joinDate: '2024-01-01T00:00:00.000Z',
    isActive: true,
    isSystemUser: true
  },
  'daruedagu@gmail.com': {
    name: 'Daruedagu',
    position: 'Analista de Sistemas',
    department: 'Tecnología',
    photoURL: null,
    accountType: 'Usuario',
    role: 'USER',
    permissions: ['READ', 'WRITE'],
    lastLogin: () => new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    joinDate: '2024-06-01T00:00:00.000Z',
    isActive: true,
    isSystemUser: true
  }
};

/**
 * Obtiene un usuario del sistema por email
 * @param {string} email - Email del usuario
 * @returns {Object|null} - Datos del usuario o null si no existe
 */
export const getSystemUser = (email) => {
  if (!email) return null;
  
  const normalizedEmail = email.toLowerCase().trim();
  const user = SYSTEM_USERS[normalizedEmail];
  
  if (!user) return null;
  
  // Ejecutar funciones dinámicas (como lastLogin)
  const processedUser = { ...user };
  Object.keys(processedUser).forEach(key => {
    if (typeof processedUser[key] === 'function') {
      processedUser[key] = processedUser[key]();
    }
  });
  
  return {
    email: normalizedEmail,
    ...processedUser
  };
};

/**
 * Verifica si un email pertenece a un usuario del sistema
 * @param {string} email - Email a verificar
 * @returns {boolean} - true si es usuario del sistema
 */
export const isSystemUser = (email) => {
  return email ? SYSTEM_USERS.hasOwnProperty(email.toLowerCase().trim()) : false;
};

/**
 * Obtiene todos los administradores del sistema
 * @returns {Array} - Lista de administradores
 */
export const getSystemAdmins = () => {
  return Object.entries(SYSTEM_USERS)
    .filter(([email, user]) => user.role === 'ADMIN')
    .map(([email, user]) => ({ email, ...user }));
};

/**
 * Obtiene lista de todos los usuarios del sistema
 * @returns {Array} - Lista completa de usuarios
 */
export const getAllSystemUsers = () => {
  return Object.entries(SYSTEM_USERS)
    .map(([email, user]) => getSystemUser(email));
};

export default SYSTEM_USERS;
