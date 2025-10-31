/**
 * Format number utilities
 * Adapted from Minimal template for DR Group Dashboard
 */

/**
 * Format number with abbreviations (K, M, B)
 */
export function fShortenNumber(num) {
  if (num === null || num === undefined) return '0';
  
  const number = Number(num);
  if (isNaN(number)) return '0';

  if (number >= 1e9) {
    return (number / 1e9).toFixed(1) + 'B';
  }
  if (number >= 1e6) {
    return (number / 1e6).toFixed(1) + 'M';
  }
  if (number >= 1e3) {
    return (number / 1e3).toFixed(1) + 'K';
  }
  return number.toString();
}

/**
 * Format number with commas
 */
export function fNumber(num) {
  if (num === null || num === undefined) return '0';
  
  const number = Number(num);
  if (isNaN(number)) return '0';
  
  return number.toLocaleString();
}

/**
 * Format percentage
 */
export function fPercent(num) {
  if (num === null || num === undefined) return '0%';
  
  const number = Number(num);
  if (isNaN(number)) return '0%';
  
  return `${number.toFixed(1)}%`;
}

/**
 * Format currency (COP for Colombian Pesos)
 */
export function fCurrency(num) {
  if (num === null || num === undefined) return '$0';
  
  const number = Number(num);
  if (isNaN(number)) return '$0';
  
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(number);
}

/**
 * Format percentage from integer (15 -> 15%)
 */
export function fPercentInteger(num) {
  if (num === null || num === undefined) return '0%';
  
  const number = Number(num);
  if (isNaN(number)) return '0%';
  
  return `${number.toFixed(1)}%`;
}

/**
 * Get number suffix for abbreviations
 */
export function getNumberSuffix(num) {
  if (num === null || num === undefined) return '';
  
  const number = Number(num);
  if (isNaN(number)) return '';

  if (number >= 1e9) return 'B';
  if (number >= 1e6) return 'M';
  if (number >= 1e3) return 'K';
  return '';
}

/**
 * Validate if a value is a valid number
 */
export function isValidNumber(value) {
  const number = Number(value);
  return !isNaN(number) && number !== null && number !== undefined;
}

/**
 * Main format function (alias for fNumber)
 */
export function formatNumber(num) {
  return fNumber(num);
}

/**
 * Format payment method for consistent display
 */
export function fPaymentMethod(method) {
  if (!method) return 'Transferencia';
  
  const paymentMethods = {
    'transfer': 'Transferencia',
    'cash': 'Efectivo', 
    'pse': 'PSE',
    // Retrocompatibilidad con posibles valores antiguos
    'check': 'Cheque',
    'card': 'Tarjeta',
    'transferencia': 'Transferencia',
    'efectivo': 'Efectivo',
    'tarjeta': 'Tarjeta',
    'cheque': 'Cheque'
  };
  
  return paymentMethods[method?.toLowerCase()] || method || 'Transferencia';
}

/**
 * Get payment method options for forms
 */
export function getPaymentMethodOptions() {
  return [
    { value: 'Transferencia', label: 'Transferencia' },
    { value: 'PSE', label: 'PSE' },
    { value: 'Efectivo', label: 'Efectivo' }
  ];
}
