/**
 * Pure utility functions extracted from CompaniesPage.jsx
 * T3.5 — God Component decomposition
 */

// Formatear tipo de documento de MIME a nombre amigable
export const formatDocumentType = (type) => {
  if (!type) return 'Documento';

  const mimeToFriendly = {
    'application/pdf': 'PDF',
    'image/jpeg': 'JPEG',
    'image/jpg': 'JPG',
    'image/png': 'PNG',
    'image/gif': 'GIF',
    'image/webp': 'WEBP',
    'application/msword': 'Word',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
    'application/vnd.ms-excel': 'Excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
    'text/plain': 'Texto',
    'text/csv': 'CSV'
  };

  if (mimeToFriendly[type]) {
    return mimeToFriendly[type];
  }

  if (type.length <= 10 && !type.includes('/')) {
    return type;
  }

  if (type.includes('/')) {
    const parts = type.split('/');
    const subtype = parts[1];
    return subtype.toUpperCase();
  }

  return type;
};

// Formatear tamaño de archivo
export const formatFileSize = (bytes, isEstimated = false) => {
  if (!bytes) return 'Tamaño desconocido';

  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  const formattedSize = size < 10 ? size.toFixed(1) : Math.round(size);
  return `${formattedSize} ${units[unitIndex]}${isEstimated ? ' (aprox.)' : ''}`;
};

// Color chip para roles de usuario (reused)
export const getRoleChipColor = (role) => {
  switch (role) {
    case 'ADMIN': return 'error';
    case 'MANAGER': return 'warning';
    case 'EMPLOYEE': return 'primary';
    case 'VIEWER': return 'default';
    default: return 'default';
  }
};
