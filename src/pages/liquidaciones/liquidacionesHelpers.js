/**
 * Pure utility functions extracted from LiquidacionesPage.jsx
 * These functions have no React/state dependencies.
 */

export const LOG_COLORS_BY_TYPE = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'error'
};

export function formatCurrencyCompact(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '$ 0';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_000_000_000) return `${sign}$ ${(abs / 1_000_000_000).toFixed(1)} B`;
  if (abs >= 1_000_000) return `${sign}$ ${(abs / 1_000_000).toFixed(1)} M`;
  if (abs >= 1_000) return `${sign}$ ${(abs / 1_000).toFixed(1)} K`;
  return `${sign}$ ${Math.round(abs).toLocaleString('es-CO')}`;
}

export function formatCurrencyCOP(value) {
  const n = Number(value) || 0;
  return n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
}

export function parseFechaToDate(str) {
  if (!str) return null;
  if (str instanceof Date) return str;
  const parts = String(str).split(/[/-]/);
  if (parts.length === 3) {
    const [d, m, y] = parts.map(Number);
    const dt = new Date(y, m - 1, d);
    return isNaN(dt.getTime()) ? null : dt;
  }
  const fallback = new Date(str);
  return isNaN(fallback.getTime()) ? null : fallback;
}

export function formatearFechaSinTimezone(fecha) {
  try {
    if (!fecha || isNaN(fecha.getTime())) return '';
    const dia = String(fecha.getUTCDate()).padStart(2, '0');
    const mes = String(fecha.getUTCMonth() + 1).padStart(2, '0');
    const año = fecha.getUTCFullYear();
    return `${dia}/${mes}/${año}`;
  } catch {
    return '';
  }
}

export function calcularDiasMes(fecha) {
  try {
    if (!fecha) return 31;
    const fechaObj = new Date(fecha);
    if (isNaN(fechaObj.getTime())) return 31;
    const year = fechaObj.getFullYear();
    const month = fechaObj.getMonth();
    return new Date(year, month + 1, 0).getDate();
  } catch {
    return 31;
  }
}

export function determinarNovedad(diasTransmitidos, diasMes) {
  try {
    const dias = parseInt(diasTransmitidos);
    const totalDias = parseInt(diasMes);
    if (dias === totalDias) return 'Sin cambios';
    if (dias < totalDias) return 'Retiro / Adición';
    return 'Retiro / Adición';
  } catch {
    return 'Sin cambios';
  }
}

export function convertirFechaAPeriodo(fecha) {
  try {
    if (!fecha) return '';
    const fechaObj = new Date(fecha);
    if (isNaN(fechaObj.getTime())) return '';
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${meses[fechaObj.getMonth()]} ${fechaObj.getFullYear()}`;
  } catch {
    return '';
  }
}
