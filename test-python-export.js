// Prueba de integración Python Excel spectacular
// Script para probar la exportación desde React

import { exportarLiquidacionSpectacular, verificarServidorPython } from '../src/utils/pythonExcelExporter.js';

// Datos de prueba
const datosEjemplo = [
  {
    empresa: "JUEGOS 777 SAS",
    serial: "001",
    nuc: "ABC123",
    tarifa: "5000",
    establecimiento: "Local Central Plaza",
    diasT: "30",
    diasM: "30", 
    primerDia: "2025-09-01",
    ultimoDia: "2025-09-30",
    periodo: "SEP-2025",
    tipo: "Tragamonedas",
    produccion: 1500000,
    derechos: 150000,
    gastos: 50000,
    total: 1300000,
    novedad: "Funcionamiento Normal"
  },
  {
    empresa: "DIVERSIONES DEL VALLE",
    serial: "002", 
    nuc: "DEF456",
    tarifa: "8000",
    establecimiento: "Centro Comercial Norte",
    diasT: "30",
    diasM: "28",
    primerDia: "2025-09-01",
    ultimoDia: "2025-09-28", 
    periodo: "SEP-2025",
    tipo: "Multijuegos",
    produccion: 2200000,
    derechos: 220000,
    gastos: 75000,
    total: 1905000,
    novedad: "Alto Rendimiento"
  }
];

async function probarExportacion() {
  console.log('🧪 Iniciando prueba de exportación spectacular...');
  
  try {
    // Verificar servidor
    console.log('🔍 Verificando servidor Python...');
    const serverCheck = await verificarServidorPython();
    
    if (!serverCheck.success) {
      console.error('❌ Servidor no disponible:', serverCheck.message);
      return;
    }
    
    console.log('✅ Servidor Python disponible');
    
    // Exportar datos
    console.log('📊 Iniciando exportación...');
    const resultado = await exportarLiquidacionSpectacular(datosEjemplo);
    
    if (resultado.success) {
      console.log('🎉 ¡Exportación exitosa!');
      console.log(`📁 Archivo: ${resultado.filename}`);
      console.log(`📏 Tamaño: ${(resultado.fileSize / 1024).toFixed(1)} KB`);
      console.log(`📊 Registros: ${resultado.recordCount}`);
    }
    
  } catch (error) {
    console.error('❌ Error en prueba:', error.message);
  }
}

// Ejecutar prueba
probarExportacion();
