// Utilidad para manejar salario mínimo y auxilio de transporte por año en Colombia.
// ACTUALIZACIÓN ANUAL: añadir entrada al objeto SALARIOS_ANUALES y ajustar anioActualReferencia si se desea forzar.
// Estructura: { [año]: { salario: number, auxilio: number, decreto?: string } }

export const SALARIOS_ANUALES = {
  2024: { salario: 1300000, auxilio: 162000, decreto: 'Decreto XXXX de 2023' }, // Ejemplo / placeholder
  2025: { salario: 1300000, auxilio: 162000, decreto: 'Decreto XXXX de 2024' } // Ajustar al valor real
};

// Permite override manual si se requiere fijar un año distinto al del sistema
export const anioActualReferencia = new Date().getFullYear();

export function obtenerDatosSalario(year = anioActualReferencia) {
  const y = SALARIOS_ANUALES[year] ? year : Math.max(...Object.keys(SALARIOS_ANUALES).map(Number));
  return { year: y, ...SALARIOS_ANUALES[y] };
}

export function formatearCOP(valor) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor || 0);
}

// Valor combinado (salario + auxilio) para referencia en pantalla
export function obtenerIngresoBaseReferencia(year) {
  const { salario, auxilio } = obtenerDatosSalario(year);
  return salario + (auxilio || 0);
}

// Wrappers retro-compatibles (evitan romper imports existentes)
export function formatearSalarioMinimo(valor) {
  if (valor == null) {
    const { salario } = obtenerDatosSalario();
    return formatearCOP(salario);
  }
  return formatearCOP(valor);
}

export function obtenerSalarioMinimoActual() {
  return obtenerDatosSalario().salario;
}

export function obtenerAuxilioTransporteActual() {
  return obtenerDatosSalario().auxilio;
}

export function obtenerSalarioYAuxilioFormateado(year) {
  const { year: y, salario, auxilio } = obtenerDatosSalario(year);
  return {
    year: y,
    salario: formatearCOP(salario),
    auxilio: formatearCOP(auxilio),
    total: formatearCOP(salario + (auxilio || 0))
  };
}
