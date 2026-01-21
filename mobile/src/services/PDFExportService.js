import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Servicio para generar y compartir reportes PDF de asistencias
 * Utiliza HTML/CSS para crear PDF profesional con branding DR Group
 */
class PDFExportService {
  /**
   * Genera HTML profesional para PDF de asistencias
   * @param {Object} params - Parámetros del reporte
   * @returns {string} HTML formateado
   */
  generateHTMLReport({
    employeeName,
    employeeEmail,
    month,
    year,
    asistencias,
    totalHoras,
    totalBreaks,
    totalAlmuerzos,
    diasTrabajados,
    puntualidad,
    primaryColor = '#004A98'
  }) {
    const asistenciasHTML = asistencias.map((asist, index) => {
      const entrada = asist.entrada?.hora ? new Date(asist.entrada.hora.toDate()).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '--:--';
      const salida = asist.salida?.hora ? new Date(asist.salida.hora.toDate()).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '--:--';
      const horas = asist.horasTrabajadas || '00:00:00';
      const estado = asist.salida ? '✅ Completo' : '⚠️ Incompleto';
      
      return `
        <tr style="border-bottom: 1px solid #e0e0e0;">
          <td style="padding: 12px; text-align: center;">${index + 1}</td>
          <td style="padding: 12px;">${asist.fecha || 'N/A'}</td>
          <td style="padding: 12px; text-align: center;">${entrada}</td>
          <td style="padding: 12px; text-align: center;">${salida}</td>
          <td style="padding: 12px; text-align: center; font-weight: 600;">${horas}</td>
          <td style="padding: 12px; text-align: center;">${asist.breaks?.length || 0}</td>
          <td style="padding: 12px; text-align: center;">${asist.almuerzo ? 'Sí' : 'No'}</td>
          <td style="padding: 12px; text-align: center;">${estado}</td>
        </tr>
      `;
    }).join('');

    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte de Asistencias - ${employeeName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Roboto', 'Segoe UI', Arial, sans-serif;
      padding: 40px;
      background: #f5f5f5;
      color: #333;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    }
    
    .header {
      background: linear-gradient(135deg, ${primaryColor} 0%, #667eea 100%);
      color: white;
      padding: 40px;
    }
    
    .header h1 {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }
    
    .header p {
      font-size: 16px;
      opacity: 0.95;
      font-weight: 400;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      padding: 30px 40px;
      border-bottom: 2px solid #f0f0f0;
    }
    
    .info-item {
      display: flex;
      flex-direction: column;
    }
    
    .info-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #666;
      font-weight: 600;
      margin-bottom: 4px;
    }
    
    .info-value {
      font-size: 18px;
      color: #333;
      font-weight: 500;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      padding: 30px 40px;
      background: #f9fafb;
    }
    
    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      border: 1px solid #e5e7eb;
    }
    
    .stat-value {
      font-size: 32px;
      font-weight: 700;
      color: ${primaryColor};
      margin-bottom: 4px;
    }
    
    .stat-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #666;
      font-weight: 500;
    }
    
    .table-container {
      padding: 40px;
      overflow-x: auto;
    }
    
    .section-title {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 24px;
      color: #333;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      background: white;
    }
    
    thead {
      background: ${primaryColor};
      color: white;
    }
    
    thead th {
      padding: 16px 12px;
      text-align: left;
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    tbody tr:hover {
      background: #f9fafb;
    }
    
    td {
      font-size: 14px;
      color: #555;
    }
    
    .footer {
      padding: 30px 40px;
      background: #f9fafb;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #666;
      font-size: 13px;
    }
    
    .footer strong {
      color: ${primaryColor};
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>📊 Reporte de Asistencias</h1>
      <p>${month} ${year} - DR Group</p>
    </div>
    
    <!-- Info Empleado -->
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Empleado</span>
        <span class="info-value">${employeeName}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Correo Electrónico</span>
        <span class="info-value">${employeeEmail}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Período</span>
        <span class="info-value">${month} ${year}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Fecha Generación</span>
        <span class="info-value">${new Date().toLocaleDateString('es-CO')}</span>
      </div>
    </div>
    
    <!-- Estadísticas -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${diasTrabajados}</div>
        <div class="stat-label">Días Trabajados</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${totalHoras}</div>
        <div class="stat-label">Horas Totales</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${totalBreaks}</div>
        <div class="stat-label">Breaks</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${puntualidad}%</div>
        <div class="stat-label">Puntualidad</div>
      </div>
    </div>
    
    <!-- Tabla de Asistencias -->
    <div class="table-container">
      <h2 class="section-title">Detalle de Asistencias</h2>
      <table>
        <thead>
          <tr>
            <th style="text-align: center;">#</th>
            <th>Fecha</th>
            <th style="text-align: center;">Entrada</th>
            <th style="text-align: center;">Salida</th>
            <th style="text-align: center;">Horas</th>
            <th style="text-align: center;">Breaks</th>
            <th style="text-align: center;">Almuerzo</th>
            <th style="text-align: center;">Estado</th>
          </tr>
        </thead>
        <tbody>
          ${asistenciasHTML}
        </tbody>
      </table>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <p>Generado automáticamente por <strong>DR Group Asistencia App</strong></p>
      <p style="margin-top: 8px; font-size: 12px; opacity: 0.8;">Este documento es solo para fines informativos</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Exporta asistencias a PDF y abre menú de compartir
   * @param {Object} params - Parámetros del reporte
   * @returns {Promise<boolean>} true si se compartió exitosamente
   */
  async exportToPDF(params) {
    try {
      console.log('📄 Generando PDF de asistencias...');

      // 1. Generar HTML
      const htmlContent = this.generateHTMLReport(params);

      // 2. Generar PDF desde HTML usando expo-print
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false
      });

      console.log('✅ PDF generado:', uri);

      // 3. Compartir el PDF
      await shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Reporte de Asistencias - ${params.employeeName}`,
        UTI: 'com.adobe.pdf'
      });

      console.log('✅ PDF compartido exitosamente');
      return true;
    } catch (error) {
      console.error('❌ Error exportando PDF:', error);
      throw error;
    }
  }

  /**
   * Calcula estadísticas de asistencias para el reporte
   * @param {Array} asistencias - Lista de registros de asistencia
   * @returns {Object} Estadísticas calculadas
   */
  calculateStats(asistencias) {
    const diasTrabajados = asistencias.length;
    let totalMinutos = 0;
    let totalBreaks = 0;
    let totalAlmuerzos = 0;
    let diasCompletos = 0;

    asistencias.forEach(asist => {
      // Calcular horas trabajadas
      if (asist.horasTrabajadas) {
        const [h, m, s] = asist.horasTrabajadas.split(':').map(Number);
        totalMinutos += (h * 60) + m + (s / 60);
      }

      // Contar breaks y almuerzos
      totalBreaks += asist.breaks?.length || 0;
      if (asist.almuerzo) totalAlmuerzos++;

      // Contar días completos (con salida registrada)
      if (asist.salida) diasCompletos++;
    });

    const totalHoras = Math.floor(totalMinutos / 60);
    const minutosRestantes = Math.round(totalMinutos % 60);
    const puntualidad = diasTrabajados > 0 ? Math.round((diasCompletos / diasTrabajados) * 100) : 0;

    return {
      totalHoras: `${totalHoras}h ${minutosRestantes}m`,
      totalBreaks,
      totalAlmuerzos,
      diasTrabajados,
      puntualidad
    };
  }
}

export default new PDFExportService();
