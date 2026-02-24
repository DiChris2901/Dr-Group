/**
 * DR Group - Excel Export Clientes
 * FORMATO PYTHON (IDÉNTICO A LIQUIDACIONES)
 */

import ExcelJS from 'exceljs';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';

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

    // Configurar columnas (8 columnas - eliminada "Ciudades")
    ws.columns = [
      { width: 30 }, { width: 35 }, { width: 18 }, { width: 10 }, 
      { width: 25 }, { width: 60 }, { width: 10 }, { width: 40 }
    ];
    
    // FILA 1: TITULO
    ws.mergeCells(1, 1, 1, 8);
    const titleCell = ws.getCell(1, 1);
    titleCell.value = 'DR GROUP';
    titleCell.font = { name: 'Segoe UI', size: 18, bold: true, color: { argb: `FF${BRAND_COLORS.white}` } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${BRAND_COLORS.titleBg}` } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 30;

    // FILA 2: SUBTITULO
    ws.mergeCells(2, 1, 2, 8);
    const subCell = ws.getCell(2, 1);
    subCell.value = 'Directorio de Clientes y Propietarios de Salas';
    subCell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: `FF${BRAND_COLORS.white}` } };
    subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${BRAND_COLORS.subtitleBg}` } };
    subCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    ws.getRow(2).height = 22;

    // FILA 3: METRICAS
    ws.mergeCells(3, 1, 3, 8);
    const metricsCell = ws.getCell(3, 1);
    metricsCell.value = `Clientes: ${totalClientes} | Salas: ${totalSalas} | Empresas: ${totalEmpresas} | Administradores: ${totalAdmins} | Con Email: ${clientesConEmail} (${Math.round((clientesConEmail/totalClientes)*100)}%) | Con Telefono: ${clientesConTelefono} (${Math.round((clientesConTelefono/totalClientes)*100)}%) | Promedio Salas: ${promedioSalas}`;
    metricsCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: `FF${BRAND_COLORS.white}` } };
    metricsCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${BRAND_COLORS.metricsBg}` } };
    metricsCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    ws.getRow(3).height = 22;

    // FILA 4: FECHA
    ws.mergeCells(4, 1, 4, 8);
    const dateCell = ws.getCell(4, 1);
    dateCell.value = `Generado: ${new Date().toLocaleString('es-CO')}`;
    dateCell.font = { name: 'Segoe UI', size: 10, bold: false, color: { argb: `FF${BRAND_COLORS.white}` } };
    dateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${BRAND_COLORS.dateBg}` } };
    dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(4).height = 18;

    // Filas vacias
    ws.getRow(5).height = 5;
    ws.getRow(6).height = 8;

    // FILA 7: HEADERS (eliminada columna "Ciudades")
    const headers = ['Nombre', 'Email', 'Telefono', '# Salas', 'Empresas', 'Salas Asignadas', '# Admins', 'Administradores'];
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
      
      // ✅ NUEVO: Salas con formato "Nombre Sala (Ciudad)"
      row.getCell(6).value = c.salas?.length > 0 
        ? c.salas.map(s => `${s.nombre}${s.ciudad ? ` (${s.ciudad})` : ''}`).join(', ')
        : 'Sin salas';
      
      row.getCell(7).value = c.administradores?.length || 0;
      row.getCell(8).value = c.administradores?.map(a => a.nombre).join(', ') || 'Sin administradores';

      for (let col = 1; col <= 8; col++) {
        const cell = row.getCell(col);
        cell.font = { name: 'Segoe UI', size: 9, color: { argb: `FF${BRAND_COLORS.textDark}` } };
        cell.alignment = { horizontal: col === 4 || col === 7 ? 'center' : 'left', vertical: 'middle', wrapText: false };
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
    
    // ✅ CORREGIDO: Extraer administradores únicos con sus salas específicas
    const adminsMap = new Map();
    
    clientes.forEach(cliente => {
      if (cliente.administradores && Array.isArray(cliente.administradores)) {
        cliente.administradores.forEach(admin => {
          // Usar email como clave única, o nombre si no hay email
          const adminKey = admin.email || admin.nombre.toLowerCase().trim();
          
          if (!adminsMap.has(adminKey)) {
            adminsMap.set(adminKey, {
              nombre: admin.nombre || 'Sin nombre',
              email: admin.email || '',
              telefono: admin.telefono || 'Sin telefono',
              clientesSet: new Set(), // Para evitar duplicados
              salas: [], // Array para almacenar salas específicas
              empresas: new Set(),
              ciudades: new Set()
            });
          }
          
          const adminData = adminsMap.get(adminKey);
          
          // Agregar cliente (sin duplicados)
          adminData.clientesSet.add(cliente.nombre);
          
          // ✅ Agregar solo las salas que este admin gestiona (salasAsociadas)
          if (admin.salasAsociadas && Array.isArray(admin.salasAsociadas)) {
            admin.salasAsociadas.forEach(nombreSala => {
              // Buscar la sala completa en el cliente para obtener ciudad y empresa
              const salaCompleta = cliente.salas?.find(s => s.nombre === nombreSala);
              if (salaCompleta) {
                // Verificar si la sala ya fue agregada (evitar duplicados)
                const salaYaExiste = adminData.salas.some(s => s.nombre === salaCompleta.nombre);
                if (!salaYaExiste) {
                  adminData.salas.push({
                    nombre: salaCompleta.nombre,
                    ciudad: salaCompleta.ciudad
                  });
                  if (salaCompleta.empresa) adminData.empresas.add(salaCompleta.empresa);
                  if (salaCompleta.ciudad) adminData.ciudades.add(salaCompleta.ciudad);
                }
              }
            });
          }
        });
      }
    });
    
    const administradores = Array.from(adminsMap.values()).map(admin => ({
      ...admin,
      empresas: Array.from(admin.empresas),
      ciudades: Array.from(admin.ciudades),
      clientes: Array.from(admin.clientesSet), // Convertir Set a Array
      numClientes: admin.clientesSet.size,
      totalSalas: admin.salas.length
    })).sort((a, b) => a.nombre.localeCompare(b.nombre));
    
    // METRICAS ADMINISTRADORES
    const totalAdministradores = administradores.length;
    const adminsConTelefono = administradores.filter(a => a.telefono && a.telefono !== 'Sin telefono').length;
    const totalSalasGestionadas = administradores.reduce((sum, a) => sum + a.totalSalas, 0);
    const promedioClientesPorAdmin = totalAdministradores > 0 ? (administradores.reduce((sum, a) => sum + a.numClientes, 0) / totalAdministradores).toFixed(1) : 0;
    const promedioSalasPorAdmin = totalAdministradores > 0 ? (totalSalasGestionadas / totalAdministradores).toFixed(1) : 0;
    
    const ws2 = wb.addWorksheet('Directorio Administradores', { 
      views: [{ state: 'frozen', ySplit: 7 }]
    });
    
    // Configurar columnas (7 columnas - eliminadas "Empresas" y "Ciudades", agregada "Salas Asignadas")
    ws2.columns = [
      { width: 30 }, { width: 35 }, { width: 18 }, { width: 12 }, 
      { width: 12 }, { width: 60 }, { width: 50 }
    ];
    
    // FILA 1: TITULO
    ws2.mergeCells(1, 1, 1, 7);
    const titleCell2 = ws2.getCell(1, 1);
    titleCell2.value = 'DR GROUP';
    titleCell2.font = { name: 'Segoe UI', size: 18, bold: true, color: { argb: `FF${BRAND_COLORS.white}` } };
    titleCell2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${BRAND_COLORS.titleBg}` } };
    titleCell2.alignment = { horizontal: 'center', vertical: 'middle' };
    ws2.getRow(1).height = 30;

    // FILA 2: SUBTITULO
    ws2.mergeCells(2, 1, 2, 7);
    const subCell2 = ws2.getCell(2, 1);
    subCell2.value = 'Directorio de Administradores de Salas';
    subCell2.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: `FF${BRAND_COLORS.white}` } };
    subCell2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${BRAND_COLORS.subtitleBg}` } };
    subCell2.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    ws2.getRow(2).height = 22;

    // FILA 3: METRICAS
    ws2.mergeCells(3, 1, 3, 7);
    const metricsCell2 = ws2.getCell(3, 1);
    metricsCell2.value = `Administradores: ${totalAdministradores} | Salas Gestionadas: ${totalSalasGestionadas} | Con Telefono: ${adminsConTelefono} (${Math.round((adminsConTelefono/totalAdministradores)*100)}%) | Promedio Clientes: ${promedioClientesPorAdmin} | Promedio Salas: ${promedioSalasPorAdmin}`;
    metricsCell2.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: `FF${BRAND_COLORS.white}` } };
    metricsCell2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${BRAND_COLORS.metricsBg}` } };
    metricsCell2.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    ws2.getRow(3).height = 22;

    // FILA 4: FECHA
    ws2.mergeCells(4, 1, 4, 7);
    const dateCell2 = ws2.getCell(4, 1);
    dateCell2.value = `Generado: ${new Date().toLocaleString('es-CO')}`;
    dateCell2.font = { name: 'Segoe UI', size: 10, bold: false, color: { argb: `FF${BRAND_COLORS.white}` } };
    dateCell2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${BRAND_COLORS.dateBg}` } };
    dateCell2.alignment = { horizontal: 'center', vertical: 'middle' };
    ws2.getRow(4).height = 18;

    // Filas vacias
    ws2.getRow(5).height = 5;
    ws2.getRow(6).height = 8;

    // FILA 7: HEADERS (eliminadas "Empresas" y "Ciudades", agregada "Salas Asignadas")
    const headers2 = ['Nombre', 'Email', 'Telefono', '# Clientes', '# Salas', 'Salas Asignadas', 'Clientes Asignados'];
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
      
      // ✅ NUEVO: Salas con formato "Nombre Sala (Ciudad)"
      row.getCell(6).value = admin.salas?.length > 0 
        ? admin.salas.map(s => `${s.nombre}${s.ciudad ? ` (${s.ciudad})` : ''}`).join(', ')
        : 'Sin salas';
      
      row.getCell(7).value = admin.clientes.join(', ');

      for (let col = 1; col <= 7; col++) {
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

    // ========== HOJA 3: HISTORIAL DE CAMBIOS ==========
    
    // Consultar cambios de Firebase
    const changesQuery = query(collection(db, 'sala_changes'), orderBy('timestamp', 'desc'));
    const changesSnapshot = await getDocs(changesQuery);
    
    const cambios = changesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        fecha: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp),
        sala: data.salaName || 'Sin nombre',
        campo: data.field || 'Desconocido',
        valorAnterior: data.oldValue !== undefined && data.oldValue !== null ? String(data.oldValue) : 'N/A',
        valorNuevo: data.newValue !== undefined && data.newValue !== null ? String(data.newValue) : 'N/A',
        usuario: data.userName || 'Sistema',
        rol: data.userRole || 'N/A'
      };
    });

    const ws3 = wb.addWorksheet('Historial de Cambios', { 
      views: [{ state: 'frozen', ySplit: 7 }]
    });

    // Columnas (7 columnas)
    ws3.columns = [
      { width: 18 },  // Fecha
      { width: 30 },  // Sala
      { width: 25 },  // Campo Modificado
      { width: 30 },  // Valor Anterior
      { width: 30 },  // Valor Nuevo
      { width: 25 },  // Usuario
      { width: 15 }   // Rol
    ];

    // FILA 1: TÍTULO PRINCIPAL
    ws3.mergeCells('A1:G1');
    const title3 = ws3.getCell('A1');
    title3.value = '📋 HISTORIAL DE CAMBIOS - DR GROUP';
    title3.font = { name: 'Segoe UI', size: 18, bold: true, color: { argb: `FF${BRAND_COLORS.white}` } };
    title3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${BRAND_COLORS.titleBg}` } };
    title3.alignment = { horizontal: 'center', vertical: 'middle' };
    title3.border = {
      top: { style: 'medium', color: { argb: `FF${BRAND_COLORS.titleBg}` } },
      left: { style: 'medium', color: { argb: `FF${BRAND_COLORS.titleBg}` } },
      bottom: { style: 'medium', color: { argb: `FF${BRAND_COLORS.titleBg}` } },
      right: { style: 'medium', color: { argb: `FF${BRAND_COLORS.titleBg}` } }
    };
    ws3.getRow(1).height = 35;

    // FILA 2: SUBTÍTULO
    ws3.mergeCells('A2:G2');
    const subtitle3 = ws3.getCell('A2');
    subtitle3.value = 'Control de modificaciones y auditoría de salas';
    subtitle3.font = { name: 'Segoe UI', size: 11, italic: true, color: { argb: `FF${BRAND_COLORS.white}` } };
    subtitle3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${BRAND_COLORS.subtitleBg}` } };
    subtitle3.alignment = { horizontal: 'center', vertical: 'middle' };
    subtitle3.border = {
      top: { style: 'thin', color: { argb: `FF${BRAND_COLORS.borderLight}` } },
      left: { style: 'medium', color: { argb: `FF${BRAND_COLORS.subtitleBg}` } },
      bottom: { style: 'thin', color: { argb: `FF${BRAND_COLORS.borderLight}` } },
      right: { style: 'medium', color: { argb: `FF${BRAND_COLORS.subtitleBg}` } }
    };
    ws3.getRow(2).height = 22;

    // FILA 3: MÉTRICAS
    const totalCambios = cambios.length;
    const cambiosUltimos30Dias = cambios.filter(c => {
      const diffTime = Date.now() - c.fecha.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      return diffDays <= 30;
    }).length;
    const salasModificadas = new Set(cambios.map(c => c.sala)).size;

    ws3.mergeCells('A3:G3');
    const metrics3 = ws3.getCell('A3');
    metrics3.value = `📊 Total Cambios: ${totalCambios} | 📅 Últimos 30 días: ${cambiosUltimos30Dias} | 🏢 Salas Modificadas: ${salasModificadas}`;
    metrics3.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: `FF${BRAND_COLORS.white}` } };
    metrics3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${BRAND_COLORS.metricsBg}` } };
    metrics3.alignment = { horizontal: 'center', vertical: 'middle' };
    metrics3.border = {
      top: { style: 'thin', color: { argb: `FF${BRAND_COLORS.borderLight}` } },
      left: { style: 'medium', color: { argb: `FF${BRAND_COLORS.metricsBg}` } },
      bottom: { style: 'thin', color: { argb: `FF${BRAND_COLORS.borderLight}` } },
      right: { style: 'medium', color: { argb: `FF${BRAND_COLORS.metricsBg}` } }
    };
    ws3.getRow(3).height = 22;

    // FILA 4: FECHA DE GENERACIÓN
    ws3.mergeCells('A4:G4');
    const dateCell3 = ws3.getCell('A4');
    const now3 = new Date();
    dateCell3.value = `📅 Generado: ${now3.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} a las ${now3.toLocaleTimeString('es-CO')}`;
    dateCell3.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: `FF${BRAND_COLORS.white}` } };
    dateCell3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${BRAND_COLORS.dateBg}` } };
    dateCell3.alignment = { horizontal: 'center', vertical: 'middle' };
    dateCell3.border = {
      top: { style: 'thin', color: { argb: `FF${BRAND_COLORS.borderLight}` } },
      left: { style: 'medium', color: { argb: `FF${BRAND_COLORS.dateBg}` } },
      bottom: { style: 'thin', color: { argb: `FF${BRAND_COLORS.borderLight}` } },
      right: { style: 'medium', color: { argb: `FF${BRAND_COLORS.dateBg}` } }
    };
    ws3.getRow(4).height = 20;

    // FILA 5: SEPARADOR VACÍO
    ws3.mergeCells('A5:G5');
    ws3.getCell('A5').border = {
      top: { style: 'thin', color: { argb: `FF${BRAND_COLORS.borderLight}` } },
      left: { style: 'medium', color: { argb: `FF${BRAND_COLORS.borderLight}` } },
      bottom: { style: 'thin', color: { argb: `FF${BRAND_COLORS.borderLight}` } },
      right: { style: 'medium', color: { argb: `FF${BRAND_COLORS.borderLight}` } }
    };
    ws3.getRow(5).height = 8;

    // FILA 6: ENCABEZADO DE SECCIÓN
    ws3.mergeCells('A6:G6');
    const sectionTitle3 = ws3.getCell('A6');
    sectionTitle3.value = '🔍 REGISTRO DETALLADO DE MODIFICACIONES';
    sectionTitle3.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: `FF${BRAND_COLORS.white}` } };
    sectionTitle3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${BRAND_COLORS.subtitleBg}` } };
    sectionTitle3.alignment = { horizontal: 'center', vertical: 'middle' };
    sectionTitle3.border = {
      top: { style: 'medium', color: { argb: `FF${BRAND_COLORS.subtitleBg}` } },
      left: { style: 'medium', color: { argb: `FF${BRAND_COLORS.subtitleBg}` } },
      bottom: { style: 'medium', color: { argb: `FF${BRAND_COLORS.subtitleBg}` } },
      right: { style: 'medium', color: { argb: `FF${BRAND_COLORS.subtitleBg}` } }
    };
    ws3.getRow(6).height = 25;

    // FILA 7: ENCABEZADOS DE TABLA
    const headers3 = ['Fecha', 'Sala', 'Campo Modificado', 'Valor Anterior', 'Valor Nuevo', 'Usuario', 'Rol'];
    headers3.forEach((header, index) => {
      const cell = ws3.getCell(7, index + 1);
      cell.value = header;
      cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: `FF${BRAND_COLORS.white}` } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${BRAND_COLORS.headerBg}` } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'medium', color: { argb: `FF${BRAND_COLORS.headerBg}` } },
        left: { style: 'thin', color: { argb: `FF${BRAND_COLORS.borderLight}` } },
        bottom: { style: 'medium', color: { argb: `FF${BRAND_COLORS.headerBg}` } },
        right: { style: 'thin', color: { argb: `FF${BRAND_COLORS.borderLight}` } }
      };
    });
    ws3.getRow(7).height = 30;

    // FILAS DE DATOS
    cambios.forEach((cambio, index) => {
      const rowNum = 8 + index;
      const row = ws3.getRow(rowNum);
      
      row.getCell(1).value = cambio.fecha;
      row.getCell(1).numFmt = 'dd/mm/yyyy hh:mm:ss';
      row.getCell(2).value = cambio.sala;
      row.getCell(3).value = cambio.campo;
      row.getCell(4).value = cambio.valorAnterior;
      row.getCell(5).value = cambio.valorNuevo;
      row.getCell(6).value = cambio.usuario;
      row.getCell(7).value = cambio.rol;

      for (let col = 1; col <= 7; col++) {
        const cell = row.getCell(col);
        cell.font = { name: 'Segoe UI', size: 9, color: { argb: `FF${BRAND_COLORS.textDark}` } };
        cell.alignment = { horizontal: col === 1 || col === 7 ? 'center' : 'left', vertical: 'middle', wrapText: false };
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
    
    
    return { 
      success: true, 
      filename, 
      message: `Excel generado con 3 hojas: ${clientes.length} clientes, ${administradores.length} administradores y ${cambios.length} cambios`, 
      recordCount: clientes.length,
      adminsCount: administradores.length,
      changesCount: cambios.length
    };

  } catch (error) {
    console.error('[ExcelExport] Error:', error);
    throw error;
  }
};

export default { exportarClientesSpectacular };
