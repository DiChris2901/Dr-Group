// Ejemplo de datos de prueba para el Procesador de Liquidaciones

// BASE DE LIQUIDACIÓN (base_liquidacion_ejemplo.js)
export const baseLiquidacionEjemplo = [
  {
    NIT: "900123456-1",
    Contrato: "CNT-001",
    NUC: "NUC-001",
    NUID: "NUID-001", 
    Serial: "SER-001",
    Tarifa: 15000,
    Periodo: "202507",
    Entradas: 1500000,
    Salidas: 1200000,
    Jackpot: 50000,
    "Derechos de Explotación": 75000,
    "Gastos de Administración": 25000
  },
  {
    NIT: "900123456-1",
    Contrato: "CNT-002",
    NUC: "NUC-002",
    NUID: "NUID-002",
    Serial: "SER-002", 
    Tarifa: 18000,
    Periodo: "202507",
    Entradas: 1800000,
    Salidas: 1450000,
    Jackpot: 60000,
    "Derechos de Explotación": 85000,
    "Gastos de Administración": 30000
  },
  {
    NIT: "900123456-1",
    Contrato: "CNT-003", 
    NUC: "NUC-003",
    NUID: "NUID-003",
    Serial: "SER-999", // Este serial no existe en inventario
    Tarifa: 12000,
    Periodo: "202508",
    Entradas: 1200000,
    Salidas: 950000,
    Jackpot: 40000,
    "Derechos de Explotación": 65000,
    "Gastos de Administración": 20000
  }
];

// INVENTARIO (inventario_ejemplo.js)
export const inventarioEjemplo = [
  {
    "Código local": "LOC-001",
    "Nombre Establecimiento": "Casino Principal Bogotá",
    NUC: "NUC-001",
    NUID: "NUID-001",
    Serial: "SER-001",
    "Código Marca": "MRC-001",
    Marca: "Novomatic",
    "Código Apuesta": "APU-001", 
    "Tipo Apuesta": "Slot Machine",
    "Fecha Inicio": "2024-01-01",
    "Fecha Fin": "2025-12-31"
  },
  {
    "Código local": "LOC-002",
    "Nombre Establecimiento": "Sala VIP Medellín",
    NUC: "NUC-002", 
    NUID: "NUID-002",
    Serial: "SER-002",
    "Código Marca": "MRC-002",
    Marca: "IGT",
    "Código Apuesta": "APU-002",
    "Tipo Apuesta": "Video Poker",
    "Fecha Inicio": "2024-02-01", 
    "Fecha Fin": "2025-12-31"
  },
  {
    "Código local": "LOC-003",
    "Nombre Establecimiento": "Centro de Apuestas Cali",
    NUC: "NUC-003", // Solo coincidirá por NUC ya que Serial SER-999 no existe
    NUID: "NUID-003",
    Serial: "SER-003", // Diferente serial
    "Código Marca": "MRC-003",
    Marca: "Aristocrat", 
    "Código Apuesta": "APU-003",
    "Tipo Apuesta": "Ruleta Electrónica",
    "Fecha Inicio": "2024-03-01",
    "Fecha Fin": "2025-12-31"
  }
];

// RESULTADO ESPERADO (resultado_esperado.js)
export const resultadoEsperado = [
  {
    NIT: "900123456-1",
    Contrato: "CNT-001", 
    NUC: "NUC-001",
    Serial: "SER-001",
    Establecimiento: "Casino Principal Bogotá", // ✅ Encontrado por Serial
    Tarifa: 15000,
    Periodo: "Julio 2025", // ✅ Convertido de 202507
    Entradas: 1500000,
    Salidas: 1200000,
    Jackpot: 50000,
    "Derechos de Explotación": 75000,
    "Gastos de Administración": 25000
  },
  {
    NIT: "900123456-1",
    Contrato: "CNT-002",
    NUC: "NUC-002", 
    Serial: "SER-002",
    Establecimiento: "Sala VIP Medellín", // ✅ Encontrado por Serial
    Tarifa: 18000,
    Periodo: "Julio 2025",
    Entradas: 1800000,
    Salidas: 1450000, 
    Jackpot: 60000,
    "Derechos de Explotación": 85000,
    "Gastos de Administración": 30000
  },
  {
    NIT: "900123456-1",
    Contrato: "CNT-003",
    NUC: "NUC-003",
    Serial: "SER-999",
    Establecimiento: "Centro de Apuestas Cali", // ✅ Encontrado por NUC (Serial no coincide)
    Tarifa: 12000,
    Periodo: "Agosto 2025", // ✅ Convertido de 202508
    Entradas: 1200000,
    Salidas: 950000,
    Jackpot: 40000,
    "Derechos de Explotación": 65000,
    "Gastos de Administración": 20000
  }
];

// INSTRUCCIONES DE PRUEBA
/*
Para probar el sistema:

1. Copia baseLiquidacionEjemplo a un Excel con las columnas correctas
2. Copia inventarioEjemplo a otro Excel con las columnas correctas  
3. Sube ambos archivos al procesador
4. Verifica que el resultado coincida con resultadoEsperado

Escenarios de prueba:
- SER-001: Coincidencia exacta por Serial → Casino Principal Bogotá
- SER-002: Coincidencia exacta por Serial → Sala VIP Medellín  
- SER-999: No existe Serial, coincide por NUC → Centro de Apuestas Cali

Conversiones de período:
- 202507 → "Julio 2025"
- 202508 → "Agosto 2025"
*/
