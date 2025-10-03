/**
 * DR Group - Excel Export Clientes
 * FORMATO PYTHON (IDÉNTICO A LIQUIDACIONES)
 */

import ExcelJS from 'exceljs';

// PALETA DE COLORES - FORMATO PYTHON
const BRAND_COLORS = {
  titleBg: '0B3040',        // Azul oscuro corporativo
  subtitleBg: '1A5F7A',     // Azul medio
  metricsBg: '334155',      // Gris azulado
  dateBg: '475569',         // Gris oscuro
  headerBg: '0B3040',       // Azul oscuro headers
  white: 'FFFFFF',
  textDark: '223344',
  borderLight: 'E2E8F0',
  borderMedium: 'C0CCDA'
};

/**
 * Exportar clientes - FORMATO PYTHON
 */
export const exportarClientesSpectacular = async (clientes) => {
  try {
    console.log('[ExcelExport] Iniciando exportacion formato Python...');

    if (!clientes || !Array.isArray(clientes) || clientes.length === 0) {
      throw new Error('No hay datos validos de clientes para exportar');
    }

    // CALCULAR METRICAS
    const totalClientes = clientes.length;
    const totalSalas = clientes.reduce((sum, c) => sum + (c.salas?.length || 0), 0);
    const clientesConEmail = clientes.filter(c => c.email && c.email.trim()).length;
    const clientesConTelefono = clientes.filter(c => c.telefono && c.telefono.trim()).length;
    const promedioSalas = totalClientes > 0 ? (totalSalas / totalClientes).toFixed(1) : 0;
    const totalAdmins = clientes.reduce((sum, c) => sum + (c.administradores?.length || 0), 0);
    const totalEmpresas = new Set(clientes.flatMap(c => c.salas?.map(s => s.empresa) || [])).size;

    // CREAR WORKBOOK
    const wb = new ExcelJS.Workbook();
    wb.creator = 'DR Group Dashboard';
    wb.created = new Date();
    
    // ========== HOJA 1: DIRECTORIO DE CLIENTES ==========
    const ws = wb.addWorksheet('Directorio de Clientes', { 
      views: [{ state: 'frozen', ySplit: 7 }]
    });

    // Configurar columnas
    ws.columns = [
      { width: 30 }, { width: 35 }, { width: 18 }, { width: 10 }, 
      { width: 25 }, { width: 25 }, { width: 50 }, { width: 10 }, { width: 40 }
    ];
    
    // FILA 1: TITULO
    ws.mergeCells(1, 1, 1, 9);
    const titleCell = ws.getCell(1, 1);
    titleCell.value = 'DR GROUP';
    titleCell.font = { name: 'Segoe UI', size: 18, bold: true, color: { argb: `FF${BRAND_COLORS.white}` } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${BRAND_COLORS.titleBg}` } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 30;

    // FILA 2: SUBTITULO
    ws.mergeCells(2, 1, 2, 9);
    const subCell = ws.getCell(2, 1);
    subCell.value = 'Directorio de Clientes y Propietarios de Salas';
    subCell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: `FF${BRAND_COLORS.white}` } };
    subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${BRAND_COLORS.subtitleBg}` } };
    subCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    ws.getRow(2).height = 22;

    // FILA 3: METRICAS
    ws.mergeCells(3, 1, 3, 9);
    const metricsCell = ws.getCell(3, 1);
    metricsCell.value = `Clientes: ${totalClientes} | Salas: ${totalSalas} | Empresas: ${totalEmpresas} | Administradores: ${totalAdmins} | Con Email: ${clientesConEmail} (${Math.round((clientesConEmail/totalClientes)*100)}%) | Con Telefono: ${clientesConTelefono} (${Math.round((clientesConTelefono/totalClientes)*100)}%) | Promedio Salas: ${promedioSalas}`;
    metricsCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: `FF${BRAND_COLORS.white}` } };
    metricsCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${BRAND_COLORS.metricsBg}` } };
    metricsCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    ws.getRow(3).height = 22;

    // FILA 4: FECHA
    ws.mergeCells(4, 1, 4, 9);
    const dateCell = ws.getCell(4, 1);
    dateCell.value = `Generado: ${new Date().toLocaleString('es-CO')}`;
    dateCell.font = { name: 'Segoe UI', size: 10, bold: false, color: { argb: `FF${BRAND_COLORS.white}` } };
    dateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${BRAND_COLORS.dateBg}` } };
    dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(4).height = 18;

    // Filas vacias
    ws.getRow(5).height = 5;
    ws.getRow(6).height = 8;

    // FILA 7: HEADERS
    const headers = ['Nombre', 'Email', 'Telefono', '# Salas', 'Empresas', 'Ciudades', 'Salas Asignadas', '# Admins', 'Administradores'];
    const headerRow = ws.getRow(7);
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: `FF${BRAND_COLORS.white}` } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${BRAND_COLORS.headerBg}` } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'FF666666' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
      };
    });
    headerRow.height = 28;

    // DATOS
    clientes.forEach((c, i) => {
      const row = ws.getRow(i + 8);
      row.getCell(1).value = c.nombre || 'Sin nombre';
      row.getCell(2).value = c.email || 'Sin email';
      row.getCell(3).value = c.telefono || 'Sin telefono';
      row.getCell(4).value = c.salas?.length || 0;
      row.getCell(5).value = [...new Set(c.salas?.map(s => s.empresa).filter(Boolean))].join(', ') || 'N/A';
      row.getCell(6).value = [...new Set(c.salas?.map(s => s.ciudad).filter(Boolean))].join(', ') || 'N/A';
      row.getCell(7).value = c.salas?.map(s => s.nombre).join(', ') || 'Sin salas';
      row.getCell(8).value = c.administradores?.length || 0;
      row.getCell(9).value = c.administradores?.map(a => a.nombre).join(', ') || 'Sin administradores';

      for (let col = 1; col <= 9; col++) {
        const cell = row.getCell(col);
        cell.font = { name: 'Segoe UI', size: 9, color: { argb: `FF${BRAND_COLORS.textDark}` } };
        cell.alignment = { horizontal: col === 4 || col === 8 ? 'center' : 'left', vertical: 'middle', wrapText: false };
        cell.border = {
          top: { style: 'thin', color: { argb: `FF${BRAND_COLORS.borderLight}` } },
          left: { style: 'thin', color: { argb: `FF${BRAND_COLORS.borderLight}` } },
          bottom: { style: 'thin', color: { argb: `FF${BRAND_COLORS.borderMedium}` } },
          right: { style: 'thin', color: { argb: `FF${BRAND_COLORS.borderLight}` } }
        };
      }
      row.height = 18;
    });

    // ========== HOJA 2: DIRECTORIO DE ADMINISTRADORES ==========
    
    // Extraer todos los administradores únicos con sus clientes
    const adminsMap = new Map();
    
    clientes.forEach(cliente => {
      if (cliente.administradores && Array.isArray(cliente.administradores)) {
        cliente.administradores.forEach(admin => {
          if (!admin.email) return;
          
          if (!adminsMap.has(admin.email)) {
            adminsMap.set(admin.email, {
              nombre: admin.nombre || 'Sin nombre',
              email: admin.email,
              telefono: admin.telefono || 'Sin telefono',
              clientes: [],
              totalSalas: 0,
              empresas: new Set(),
              ciudades: new Set()
            });
          }
          
          const adminData = adminsMap.get(admin.email);
          adminData.clientes.push({
            nombre: cliente.nombre,
            salas: cliente.salas || []
          });
          
          if (cliente.salas) {
            adminData.totalSalas += cliente.salas.length;
            cliente.salas.forEach(sala => {
              if (sala.empresa) adminData.empresas.add(sala.empresa);
              if (sala.ciudad) adminData.ciudades.add(sala.ciudad);
            });
          }
        });
      }
    });
    
    const administradores = Array.from(adminsMap.values()).map(admin => ({
      ...admin,
      empresas: Array.from(admin.empresas),
      ciudades: Array.from(admin.ciudades),
      numClientes: admin.clientes.length
    }));
    
    // METRICAS ADMINISTRADORES
    const totalAdministradores = administradores.length;
    const adminsConTelefono = administradores.filter(a => a.telefono && a.telefono !== 'Sin telefono').length;
    const totalSalasGestionadas = administradores.reduce((sum, a) => sum + a.totalSalas, 0);
    const promedioClientesPorAdmin = totalAdministradores > 0 ? (administradores.reduce((sum, a) => sum + a.numClientes, 0) / totalAdministradores).toFixed(1) : 0;
    const promedioSalasPorAdmin = totalAdministradores > 0 ? (totalSalasGestionadas / totalAdministradores).toFixed(1) : 0;
    
    const ws2 = wb.addWorksheet('Directorio Administradores', { 
      views: [{ state: 'frozen', ySplit: 7 }]
    });
    
    // Configurar columnas
    ws2.columns = [
      { width: 30 }, { width: 35 }, { width: 18 }, { width: 12 }, 
      { width: 12 }, { width: 25 }, { width: 25 }, { width: 50 }
    ];
    
    // FILA 1: TITULO
    ws2.mergeCells(1, 1, 1, 8);
    const titleCell2 = ws2.getCell(1, 1);
    titleCell2.value = 'DR GROUP';
    titleCell2.font = { name: 'Segoe UI', size: 18, bold: true, color: { argb: `FF${BRAND_COLORS.white}` } };
    titleCell2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${BRAND_COLORS.titleBg}` } };
    titleCell2.alignment = { horizontal: 'center', vertical: 'middle' };
    ws2.getRow(1).height = 30;

    // FILA 2: SUBTITULO
    ws2.mergeCells(2, 1, 2, 8);
    const subCell2 = ws2.getCell(2, 1);
    subCell2.value = 'Directorio de Administradores de Salas';
    subCell2.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: `FF${BRAND_COLORS.white}` } };
    subCell2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${BRAND_COLORS.subtitleBg}` } };
    subCell2.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    ws2.getRow(2).height = 22;

    // FILA 3: METRICAS
    ws2.mergeCells(3, 1, 3, 8);
    const metricsCell2 = ws2.getCell(3, 1);
    metricsCell2.value = `Administradores: ${totalAdministradores} | Salas Gestionadas: ${totalSalasGestionadas} | Con Telefono: ${adminsConTelefono} (${Math.round((adminsConTelefono/totalAdministradores)*100)}%) | Promedio Clientes: ${promedioClientesPorAdmin} | Promedio Salas: ${promedioSalasPorAdmin}`;
    metricsCell2.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: `FF${BRAND_COLORS.white}` } };
    metricsCell2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${BRAND_COLORS.metricsBg}` } };
    metricsCell2.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    ws2.getRow(3).height = 22;

    // FILA 4: FECHA
    ws2.mergeCells(4, 1, 4, 8);
    const dateCell2 = ws2.getCell(4, 1);
    dateCell2.value = `Generado: ${new Date().toLocaleString('es-CO')}`;
    dateCell2.font = { name: 'Segoe UI', size: 10, bold: false, color: { argb: `FF${BRAND_COLORS.white}` } };
    dateCell2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${BRAND_COLORS.dateBg}` } };
    dateCell2.alignment = { horizontal: 'center', vertical: 'middle' };
    ws2.getRow(4).height = 18;

    // Filas vacias
    ws2.getRow(5).height = 5;
    ws2.getRow(6).height = 8;

    // FILA 7: HEADERS
    const headers2 = ['Nombre', 'Email', 'Telefono', '# Clientes', '# Salas', 'Empresas', 'Ciudades', 'Clientes Asignados'];
    const headerRow2 = ws2.getRow(7);
    headers2.forEach((h, i) => {
      const cell = headerRow2.getCell(i + 1);
      cell.value = h;
      cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: `FF${BRAND_COLORS.white}` } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${BRAND_COLORS.headerBg}` } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'FF666666' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
      };
    });
    headerRow2.height = 28;

    // DATOS ADMINISTRADORES
    administradores.forEach((admin, i) => {
      const row = ws2.getRow(i + 8);
      row.getCell(1).value = admin.nombre;
      row.getCell(2).value = admin.email;
      row.getCell(3).value = admin.telefono;
      row.getCell(4).value = admin.numClientes;
      row.getCell(5).value = admin.totalSalas;
      row.getCell(6).value = admin.empresas.join(', ') || 'N/A';
      row.getCell(7).value = admin.ciudades.join(', ') || 'N/A';
      row.getCell(8).value = admin.clientes.map(c => c.nombre).join(', ');

      for (let col = 1; col <= 8; col++) {
        const cell = row.getCell(col);
        cell.font = { name: 'Segoe UI', size: 9, color: { argb: `FF${BRAND_COLORS.textDark}` } };
        cell.alignment = { horizontal: col === 4 || col === 5 ? 'center' : 'left', vertical: 'middle', wrapText: false };
        cell.border = {
          top: { style: 'thin', color: { argb: `FF${BRAND_COLORS.borderLight}` } },
          left: { style: 'thin', color: { argb: `FF${BRAND_COLORS.borderLight}` } },
          bottom: { style: 'thin', color: { argb: `FF${BRAND_COLORS.borderMedium}` } },
          right: { style: 'thin', color: { argb: `FF${BRAND_COLORS.borderLight}` } }
        };
      }
      row.height = 18;
    });

    // GENERAR Y DESCARGAR
    const timestamp = new Date().toISOString().replace(/[:]/g, '-').slice(0, 19);
    const filename = `DR-Group-Clientes-${timestamp}.xlsx`;
    
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
    
    console.log('[ExcelExport] Completado:', filename);
    console.log(`[ExcelExport] Hoja 1: ${clientes.length} clientes | Hoja 2: ${administradores.length} administradores`);
    
    return { 
      success: true, 
      filename, 
      message: `Excel generado con 2 hojas: ${clientes.length} clientes y ${administradores.length} administradores`, 
      recordCount: clientes.length,
      adminsCount: administradores.length
    };

  } catch (error) {
    console.error('[ExcelExport] Error:', error);
    throw error;
  }
};

export default { exportarClientesSpectacular };
