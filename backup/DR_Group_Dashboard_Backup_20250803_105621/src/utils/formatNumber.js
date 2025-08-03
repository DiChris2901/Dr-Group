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
 * Main format function (alias for fNumber)
 */
export function formatNumber(num) {
  return fNumber(num);
}
