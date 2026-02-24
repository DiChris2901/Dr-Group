/**
 * Pure utility functions extracted from NewCommitmentPage.jsx
 * T3.4 — God Component decomposition
 */

// Helper para crear fecha local sin problemas de zona horaria
export const createLocalDate = (dateString) => {
  if (!dateString) return new Date();
  if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(dateString);
};

// Calcular número de compromisos sugerido según periodicidad (limitado al año en curso)
export const getDefaultRecurringCount = (periodicity, baseDate = null) => {
  const currentDate = baseDate || new Date();
  const currentMonth = currentDate.getMonth();
  const remainingMonths = 12 - currentMonth;

  const periodicityMonths = {
    'monthly': 1,
    'bimonthly': 2,
    'quarterly': 3,
    'fourmonthly': 4,
    'biannual': 6,
    'annual': 12
  };

  const intervalMonths = periodicityMonths[periodicity] || 1;
  if (periodicity === 'annual') return 1;
  const maxPossible = Math.ceil(remainingMonths / intervalMonths);
  return Math.max(1, maxPossible);
};

// Formatear NIT/Identificación automáticamente
export const formatNitId = (value) => {
  if (!value) return '';

  let cleanValue = value.replace(/[^\d\s-]/g, '');
  cleanValue = cleanValue.replace(/\s+/g, '-');
  if (!cleanValue) return '';

  const hasHyphen = cleanValue.includes('-');
  const parts = cleanValue.split('-');
  const mainPart = parts[0] || '';
  const verificationPart = parts[1] || '';

  if (mainPart.length < 4 && !hasHyphen) {
    return cleanValue;
  }

  const formattedMain = mainPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  if (hasHyphen) {
    if (verificationPart) {
      const limitedVerification = verificationPart.substring(0, 1);
      return `${formattedMain}-${limitedVerification}`;
    } else {
      return `${formattedMain}-`;
    }
  } else {
    return formattedMain;
  }
};

// Detectar si es compromiso de Coljuegos (pure version — pass beneficiary)
export const isColjuegosCommitment = (beneficiary) => {
  return beneficiary &&
    beneficiary.toLowerCase().includes('coljuegos');
};

// Formateo de moneda colombiana (CON DECIMALES)
export const formatNumberWithCommas = (value) => {
  if (!value && value !== 0) return '';

  const strValue = value.toString();
  const cleanValue = strValue.replace(/[^\d.]/g, '');

  const parts = cleanValue.split('.');
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('');
  }

  if (!cleanValue) return '';

  if (parts.length === 2) {
    const integerPart = parts[0];
    const decimalPart = parts[1];
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return formattedInteger + ',' + decimalPart.substring(0, 2);
  } else {
    return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
};

export const parseFormattedNumber = (value) => {
  if (!value && value !== 0) return '';
  return value.toString()
    .replace(/\./g, '')
    .replace(/,/g, '.');
};

// Factory: creates an amount-change handler for a given form field
export const createAmountChangeHandler = (fieldName, parseFormattedNumberFn, setFormData) => {
  return (e) => {
    const inputValue = e.target.value;
    const cleanValue = parseFormattedNumberFn(inputValue);
    if (cleanValue === '' || /^\d*\.?\d*$/.test(cleanValue)) {
      setFormData(prev => ({
        ...prev,
        [fieldName]: cleanValue
      }));
    }
  };
};

// Calcular total automáticamente
export const calculateTotal = (formData, isColjuegos) => {
  if (isColjuegos) {
    const derechos = parseFloat(formData.derechosExplotacion) || 0;
    const gastos = parseFloat(formData.gastosAdministracion) || 0;
    return derechos + gastos;
  }

  const base = parseFloat(formData.baseAmount) || 0;
  if (!formData.hasTaxes) return base;

  const iva = parseFloat(formData.iva) || 0;
  const retefuente = parseFloat(formData.retefuente) || 0;
  const ica = parseFloat(formData.ica) || 0;
  const discount = parseFloat(formData.discount) || 0;

  return base + iva - retefuente - ica - discount;
};

// Identificar campos faltantes
export const getMissingFields = (formData, isColjuegos) => {
  const missingFields = [];

  if (!formData.companyId) missingFields.push('Empresa');
  if (!formData.month) missingFields.push('Mes');
  if (!formData.periodicity) missingFields.push('Periodicidad');
  if (!formData.beneficiary?.trim()) missingFields.push('Beneficiario');
  if (!formData.concept?.trim()) missingFields.push('Concepto');

  if (isColjuegos) {
    if (!parseFloat(parseFormattedNumber(formData.derechosExplotacion))) {
      missingFields.push('Derechos de Explotación');
    }
    if (formData.gastosAdministracion === '' || formData.gastosAdministracion === null || formData.gastosAdministracion === undefined) {
      missingFields.push('Gastos de Administración');
    }
  } else {
    if (!parseFloat(parseFormattedNumber(formData.baseAmount))) {
      missingFields.push('Valor Base');
    }
  }

  if (!formData.paymentMethod) missingFields.push('Método de Pago');
  if (!formData.dueDate) missingFields.push('Fecha de Vencimiento');

  return missingFields;
};

// Formatear moneda COP (display)
export const formatCurrency = (value) => {
  if (!value) return '';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(value);
};

// Constantes
export const periodicityOptions = [
  { value: 'unique', label: 'Pago único' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'bimonthly', label: 'Bimestral' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'fourmonthly', label: 'Cuatrimestral' },
  { value: 'biannual', label: 'Semestral' },
  { value: 'annual', label: 'Anual' }
];

export const MONTHS = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' }
];
