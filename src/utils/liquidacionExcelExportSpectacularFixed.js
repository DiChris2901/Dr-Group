/**
 * DR Group - Excel Export Spectacular Clean
 * Exportador de liquidación consolidada con diseño corporativo
 * Basado en la lógica del archivo Python original
 */

import * as XLSX from 'xlsx';

/**
 * Mapear datos de liquidación al formato esperado del Python
 */
const mapearDatosConsolidados = (data) => {
  console.log('🔍 Datos originales recibidos:', data);
  
  if (!Array.isArray(data)) {
    console.error('❌ Los datos no son un array:', data);
    return [];
  }

  return data.map((item, index) => {
    console.log(`🔍 Procesando item ${index}:`, item);
    
    // Mapear campos con diferentes posibles nombres
    const empresa = item.empresa || item.Empresa || item.EMPRESA || 'DR GROUP';
    const serial = item.serial || item.Serial || item.SERIAL || item['Serial de máquina'] || `S${String(index + 1).padStart(3, '0')}`;
    const nuc = item.nuc || item.NUC || item.Nuc || item['NUC'] || `NUC${String(index + 1).padStart(3, '0')}`;
    const establecimiento = item.establecimiento || item.Establecimiento || item.ESTABLECIMIENTO || 
                           item['Establecimiento'] || item.sala || item.casino || 'Sin establecimiento';
    
    // Campos de fechas y días
    const diasTransmitidos = parseInt(item.diasTransmitidos || item['Días transmitidos'] || item.diasT || 30);
    const diasMes = parseInt(item.diasMes || item['Días del mes'] || item.diasM || 30);
    const primerDia = item.primerDia || item['Primer día transmitido'] || item.fechaInicio || '01/09/2025';
    const ultimoDia = item.ultimoDia || item['Último día transmitido'] || item.fechaFin || '30/09/2025';
    const periodo = item.periodo || item.Periodo || item['Período Texto'] || 'SEP-2025';
    
    // Tipo de apuesta/máquina
    const tipo = item.tipo || item['Tipo apuesta'] || item.tipoMaquina || 'Tragamonedas';
    
    // Valores monetarios - asegurar que sean números
    const produccion = parseFloat(item.produccion || item.Producción || item['Base liquidación diaria'] || 0);
    const derechos = parseFloat(item.derechos || item['Derechos de Explotación'] || (produccion * 0.12));
    const gastos = parseFloat(item.gastos || item['Gastos de Administración'] || (derechos * 0.01));
    const totalImpuestos = parseFloat(item.total || item['Total Impuestos'] || (derechos + gastos));
    
    // Novedad basada en días transmitidos vs días del mes
    let novedad = item.novedad || item.Novedad || 'Sin información';
    if (diasTransmitidos === diasMes) {
      novedad = 'Sin cambios';
    } else if (diasTransmitidos < diasMes) {
      novedad = 'Retiro / Adición';
    } else {
      novedad = 'Días extra transmitidos';
    }

    const mapped = {
      empresa,
      serial,
      nuc,
      establecimiento,
      diasTransmitidos,
      diasMes,
      primerDia,
      ultimoDia,
      periodo,
      tipo,
      produccion,
      derechos,
      gastos,
      totalImpuestos,
      novedad
    };
    
    console.log(`✅ Item ${index} mapeado:`, mapped);
    return mapped;
  });
};

/**
 * Crear datos para el Excel siguiendo la estructura del Python
 */
const crearDatosExcel = (datosConsolidados) => {
  console.log('📊 Creando datos Excel para:', datosConsolidados.length, 'registros');
  
  if (!datosConsolidados || datosConsolidados.length === 0) {
    console.warn('⚠️ No hay datos consolidados para exportar');
    return [];
  }

  // Calcular totales
  const totalMaquinas = datosConsolidados.length;
  const totalProduccion = datosConsolidados.reduce((sum, item) => sum + (item.produccion || 0), 0);
  const totalDerechos = datosConsolidados.reduce((sum, item) => sum + (item.derechos || 0), 0);
  const totalGastos = datosConsolidados.reduce((sum, item) => sum + (item.gastos || 0), 0);
  const totalImpuestos = datosConsolidados.reduce((sum, item) => sum + (item.totalImpuestos || 0), 0);
  // Métricas de novedad
  const sinCambios = datosConsolidados.reduce((acc, item) => acc + (((item.novedad || '').toLowerCase().includes('sin cambios')) ? 1 : 0), 0);
  const retiroAdicion = datosConsolidados.reduce((acc, item) => {
    const nv = (item.novedad || '').toLowerCase();
    return acc + ((nv.includes('retiro') || nv.includes('adición') || nv.includes('adicion')) ? 1 : 0);
  }, 0);
  
  const empresa = datosConsolidados[0]?.empresa || 'DR GROUP';
  const fechaActual = new Date().toLocaleDateString('es-ES', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  console.log('📈 Totales calculados:', {
    totalMaquinas,
    totalProduccion: totalProduccion.toLocaleString('es-CO'),
    totalDerechos: totalDerechos.toLocaleString('es-CO'),
    totalGastos: totalGastos.toLocaleString('es-CO'),
    totalImpuestos: totalImpuestos.toLocaleString('es-CO')
  });

  const excelData = [
    // FILA 1: Título principal (merged A:P)
    ['Liquidación consolidada', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    
    // FILA 2: Información empresa (merged A:P)
    [`🏢 ${empresa} | 📊 Reporte Ejecutivo de Liquidación por Máquinas`, '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    
    // FILA 3: Fecha y sistema (merged A:P)
    [`📅 ${fechaActual} | 🎰 ${totalMaquinas} máquinas procesadas | 💎 Sistema DR Group Spectacular`, '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    
    // FILA 4: Métricas generales (merged A:P)
  [`📊 MÉTRICAS GENERALES | 🎰 ${totalMaquinas} máquinas | 📈 Producción: $${totalProduccion.toLocaleString('es-CO')} | ⚖️ Derechos: $${totalDerechos.toLocaleString('es-CO')} | 💸 Gastos: $${totalGastos.toLocaleString('es-CO')} | 💰 Total Impuestos: $${totalImpuestos.toLocaleString('es-CO')} | ✅ Sin cambios: ${sinCambios} | 🔄 Retiro/Adición: ${retiroAdicion}`,'', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    
    // FILA 5: Descripción reporte (merged A:P)
    [`💎 Reporte consolidado de liquidación por máquinas de juego | Sistema DR Group | Fecha de generación: ${fechaActual}`, '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    
    // FILAS 6-9: Espacios vacíos
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    
    // FILA 10: Header análisis completo (merged A:P)
    ['🎯 DETALLE CONSOLIDADO POR MÁQUINAS - ANÁLISIS COMPLETO 💎', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    
    // FILA 11: Headers de columnas
    [
      '🏢 EMPRESA',
      '🔢 SERIAL', 
      '🏷️ NUC',
      '💰 TARIFA',
      '🏪 ESTABLECIMIENTO',
      '📅 DIAS T',
      '📅 DIAS M', 
      '🗓️ PRIMER DIA',
      '🗓️ ULTIMO DIA',
      '📊 PERIODO',
      '🎰 TIPO',
      '💎 PRODUCCION',
      '⚖️ DERECHOS',
      '💸 GASTOS',
      '💰 TOTAL',
      '📝 NOVEDAD'
    ]
  ];

  // Agregar datos de cada máquina
  datosConsolidados.forEach((item, index) => {
    excelData.push([
      item.empresa || '',
      item.serial || '',
      item.nuc || '',
      item.tarifa || 'Estándar',  // Campo tarifa que faltaba
      item.establecimiento || '',
      item.diasTransmitidos || 0,
      item.diasMes || 0,
      item.primerDia || '',
      item.ultimoDia || '',
      item.periodo || '',
      item.tipo || '',
      item.produccion || 0,
      item.derechos || 0,
      item.gastos || 0,
      item.totalImpuestos || 0,
      item.novedad || ''
    ]);
  });

  console.log('📋 Datos Excel creados:', excelData.length, 'filas');
  return excelData;
};

/**
 * Aplicar estilos al workbook (sin gradientes, solo colores sólidos)
 */
const aplicarEstilosSpectacular = (workbook, worksheet, datosConsolidados) => {
  console.log('🎨 Aplicando estilos spectacular...');
  
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  
  // Configurar anchos de columna
  const colWidths = [
    { wch: 20 }, // A - EMPRESA
    { wch: 12 }, // B - SERIAL
    { wch: 12 }, // C - NUC
    { wch: 12 }, // D - TARIFA
    { wch: 25 }, // E - ESTABLECIMIENTO
    { wch: 10 }, // F - DIAS T
    { wch: 10 }, // G - DIAS M
    { wch: 15 }, // H - PRIMER DIA
    { wch: 15 }, // I - ULTIMO DIA
    { wch: 15 }, // J - PERIODO
    { wch: 15 }, // K - TIPO
    { wch: 18 }, // L - PRODUCCION
    { wch: 15 }, // M - DERECHOS
    { wch: 15 }, // N - GASTOS
    { wch: 15 }, // O - TOTAL
    { wch: 20 }  // P - NOVEDAD
  ];
  
  worksheet['!cols'] = colWidths;

  // Configurar merges para las filas de headers
  const merges = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 15 } }, // Fila 1
    { s: { r: 1, c: 0 }, e: { r: 1, c: 15 } }, // Fila 2
    { s: { r: 2, c: 0 }, e: { r: 2, c: 15 } }, // Fila 3
    { s: { r: 3, c: 0 }, e: { r: 3, c: 15 } }, // Fila 4
    { s: { r: 4, c: 0 }, e: { r: 4, c: 15 } }, // Fila 5
    { s: { r: 9, c: 0 }, e: { r: 9, c: 15 } }  // Fila 10
  ];
  
  worksheet['!merges'] = merges;

  // Aplicar estilos a celdas específicas
  const aplicarEstiloCelda = (cellAddress, style) => {
    if (!worksheet[cellAddress]) worksheet[cellAddress] = { t: 's', v: '' };
    worksheet[cellAddress].s = style;
  };

  // Estilos para headers principales
  const estiloHeaderPrincipal = {
    font: { name: 'Segoe UI', sz: 16, bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '1e3a8a' } }, // Azul corporativo
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } }
    }
  };

  const estiloHeaderSecundario = {
    font: { name: 'Segoe UI', sz: 12, bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '667eea' } }, // Azul spectacular
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } }
    }
  };

  const estiloHeaderColumnas = {
    font: { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '1e3a8a' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } }
    }
  };

  // Aplicar estilos a las filas de headers
  aplicarEstiloCelda('A1', estiloHeaderPrincipal);
  aplicarEstiloCelda('A2', estiloHeaderSecundario);
  aplicarEstiloCelda('A3', { ...estiloHeaderSecundario, fill: { fgColor: { rgb: '764ba2' } } });
  aplicarEstiloCelda('A4', { ...estiloHeaderSecundario, fill: { fgColor: { rgb: '10b981' } } });
  aplicarEstiloCelda('A5', { ...estiloHeaderSecundario, fill: { fgColor: { rgb: 'f59e0b' } } });
  aplicarEstiloCelda('A10', { ...estiloHeaderSecundario, fill: { fgColor: { rgb: '64748b' } } });

  // Aplicar estilos a headers de columnas (fila 11)
  for (let col = 0; col < 16; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 10, c: col });
    aplicarEstiloCelda(cellAddress, estiloHeaderColumnas);
  }

  // Aplicar estilos a datos (filas 12 en adelante)
  for (let row = 11; row < range.e.r + 1; row++) {
    for (let col = 0; col <= 15; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const isEvenRow = (row - 11) % 2 === 0;
      
      const estiloDatos = {
        font: { name: 'Segoe UI', sz: 9, color: { rgb: '1f2937' } },
        fill: { fgColor: { rgb: isEvenRow ? 'f8fafc' : 'ffffff' } },
        alignment: { 
          horizontal: col >= 11 && col <= 14 ? 'right' : 'center', 
          vertical: 'center' 
        },
        border: {
          top: { style: 'thin', color: { rgb: 'e5e7eb' } },
          bottom: { style: 'thin', color: { rgb: 'e5e7eb' } },
          left: { style: 'thin', color: { rgb: 'e5e7eb' } },
          right: { style: 'thin', color: { rgb: 'e5e7eb' } }
        }
      };

      // Formato de números para columnas monetarias
      if (col >= 11 && col <= 14) {
        estiloDatos.numFmt = '#,##0.00';
      }

      aplicarEstiloCelda(cellAddress, estiloDatos);
    }
  }

  console.log('✅ Estilos spectacular aplicados');
};

/**
 * Exportar liquidación spectacular
 */
export const exportarLiquidacionSpectacular = async (data, empresa = 'DR GROUP') => {
  try {
    console.log('🚀 Iniciando exportación spectacular...');
    console.log('📊 Datos recibidos:', data);

    // Validar datos
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error('No hay datos válidos para exportar');
    }

    // Mapear datos al formato consolidado
    const datosConsolidados = mapearDatosConsolidados(data);
    console.log('🔄 Datos consolidados:', datosConsolidados);

    if (datosConsolidados.length === 0) {
      throw new Error('No se pudieron procesar los datos para exportación');
    }

    // Crear datos para Excel
    const excelData = crearDatosExcel(datosConsolidados);
    
    // Crear workbook
    const worksheet = XLSX.utils.aoa_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    
    // Aplicar estilos
    aplicarEstilosSpectacular(workbook, worksheet, datosConsolidados);
    
    // Agregar worksheet
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Liquidación Consolidada');
    
    // Generar archivo
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `liquidacion_spectacular_${timestamp}.xlsx`;
    
    // Descargar archivo
    XLSX.writeFile(workbook, filename);
    
    console.log('✅ Exportación spectacular completada:', filename);
    
    return {
      success: true,
      filename: filename,
      message: `Excel spectacular generado: ${filename}`,
      recordCount: datosConsolidados.length,
      fileSize: 'N/A (generado en cliente)'
    };

  } catch (error) {
    console.error('❌ Error en exportación spectacular:', error);
    throw error;
  }
};

/**
 * Exportar liquidación simple (fallback)
 */
export const exportarLiquidacionSimple = (data, empresa = 'DR GROUP') => {
  try {
    console.log('🔄 Iniciando exportación simple...');
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error('No hay datos para exportar');
    }

    // Crear estructura simple
    const simpleData = [
      ['🏢 DR GROUP - LIQUIDACIÓN SIMPLE'],
      [''],
      ['Empresa', 'Serial', 'NUC', 'Establecimiento', 'Producción', 'Derechos', 'Gastos', 'Total'],
      ...data.map(item => [
        item.empresa || empresa,
        item.serial || '',
        item.nuc || '',
        item.establecimiento || '',
        item.produccion || 0,
        item.derechos || (item.produccion * 0.12),
        item.gastos || ((item.produccion * 0.12) * 0.01),
        item.total || ((item.produccion * 0.12) + ((item.produccion * 0.12) * 0.01))
      ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(simpleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Liquidación Simple');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `liquidacion_simple_${timestamp}.xlsx`;
    
    XLSX.writeFile(workbook, filename);
    
    console.log('✅ Exportación simple completada:', filename);
    
    return {
      success: true,
      filename: filename,
      message: `Excel simple generado: ${filename}`
    };

  } catch (error) {
    console.error('❌ Error en exportación simple:', error);
    throw error;
  }
};

export default { exportarLiquidacionSpectacular, exportarLiquidacionSimple };
