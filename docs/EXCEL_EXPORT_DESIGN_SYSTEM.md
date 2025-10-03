# 📊 SISTEMA DE DISEÑO PARA EXPORTACIÓN DE EXCEL - DR GROUP

> **Documento de especificaciones técnicas y visuales para exportación de reportes Excel**  
> **FORMATO PYTHON PROFESIONAL - Estándar Corporativo DR Group**  
> Versión: 2.0 | Fecha: Octubre 2025 | Sistema: DR Group Dashboard

## 🔗 REFERENCIAS Y UBICACIONES

### URLs de Exportación Excel
Los archivos Excel siguiendo este sistema de diseño se pueden generar desde:

- **📊 Reportes de Resumen:** [`http://localhost:5173/reports/summary`](http://localhost:5173/reports/summary)
  - Análisis consolidado multi-empresa
  - Métricas globales y comparativas
  - Visualización de tendencias generales

- **🏢 Reportes por Empresa:** [`http://localhost:5173/reports/company`](http://localhost:5173/reports/company) 
  - Análisis detallado por empresa específica
  - Compromisos completados, pendientes y vencidos
  - Historial de pagos parciales dinámicos

- **📈 Reportes Temporales:** [`http://localhost:5173/reports/period`](http://localhost:5173/reports/period)
  - Análisis temporal por período (mensual/semanal)
  - Serie temporal con métricas por período
  - Comparación de crecimiento y tendencias

### Archivos de Implementación
- **Código fuente empresa:** `src/pages/reports/ReportsCompanyPage.jsx`
- **Código fuente temporal:** `src/pages/reports/ReportsPeriodPage.jsx`
- **Utilidades de estado:** `src/utils/commitmentStatusUtils.js` 
- **Hook de pagos:** `src/hooks/useCommitmentPaymentStatus.js`
- **Componente visual:** `src/components/commitments/CommitmentStatusChip.jsx`

---

## 🎨 PALETA DE COLORES CORPORATIVA - FORMATO PYTHON

### ⚠️ BIBLIOTECA OBLIGATORIA: ExcelJS
```javascript
import ExcelJS from 'exceljs';
```
**NUNCA usar XLSX (SheetJS)** - Limitaciones de estilo y formato profesional insuficiente.

### Colores Principales (ARGB Format)
```javascript
// 🎨 FORMATO PYTHON PROFESIONAL - OBLIGATORIO
const BRAND_COLORS = {
  // Colores de Encabezados (Oscuros Corporativos)
  titleBg: '0B3040',        // Azul oscuro corporativo (títulos principales)
  subtitleBg: '1A5F7A',     // Azul medio (subtítulos)
  metricsBg: '334155',      // Gris azulado (métricas)
  dateBg: '475569',         // Gris oscuro (fecha de generación)
  headerBg: '0B3040',       // Azul oscuro (headers de columnas)
  
  // Colores de Texto
  white: 'FFFFFF',          // Texto sobre fondos oscuros
  textDark: '223344',       // Texto de contenido (#223344)
  
  // Colores de Bordes
  borderLight: 'E2E8F0',    // Bordes sutiles (#E2E8F0)
  borderMedium: 'C0CCDA',   // Bordes medios (#C0CCDA)
  borderDark: '94A3B8'      // Bordes acentuados (#94A3B8)
};
```

### 🚫 COLORES PROHIBIDOS
```javascript
// ❌ NO USAR colores brillantes o saturados
// ❌ NO USAR #1565C0, #E3F2FD, #F57C00, #FFF3E0 (colores antiguos)
// ❌ NO USAR glassmorphism o efectos de transparencia
// ❌ NO USAR emojis en la estructura de datos (solo en alertas de usuario)
```

### ✅ PALETA APROBADA (ARGB)
```scss
// Formato correcto con prefijo FF para opacidad total
fill: { 
  type: 'pattern', 
  pattern: 'solid', 
  fgColor: { argb: 'FF0B3040' } // ✅ CORRECTO
}

// ❌ INCORRECTO - Sin prefijo FF
fgColor: { argb: '0B3040' } // ❌ NO USAR
```

---

## 🔤 SISTEMA TIPOGRÁFICO - FORMATO PYTHON

### Fuente Base Obligatoria
```javascript
font: { 
  name: 'Segoe UI',  // ✅ OBLIGATORIO - Fuente corporativa moderna
  // ❌ NO USAR: Arial, Calibri, Times New Roman
}
```

### Jerarquía Tipográfica Estricta

#### 1. Fila 1: Título Principal
```javascript
// Ejemplo: "DR GROUP"
font: { 
  name: 'Segoe UI', 
  size: 18, 
  bold: true, 
  color: { argb: 'FFFFFFFF' } 
}
fill: { 
  type: 'pattern', 
  pattern: 'solid', 
  fgColor: { argb: 'FF0B3040' } 
}
alignment: { horizontal: 'center', vertical: 'middle' }
height: 30px
```

#### 2. Fila 2: Subtítulo Descriptivo
```javascript
// Ejemplo: "Directorio de Clientes y Propietarios de Salas"
font: { 
  name: 'Segoe UI', 
  size: 11, 
  bold: true, 
  color: { argb: 'FFFFFFFF' } 
}
fill: { 
  type: 'pattern', 
  pattern: 'solid', 
  fgColor: { argb: 'FF1A5F7A' } 
}
alignment: { horizontal: 'center', vertical: 'middle', wrapText: true }
height: 22px
```

#### 3. Fila 3: Métricas Consolidadas
```javascript
// Ejemplo: "Clientes: 45 | Salas: 120 | Empresas: 8..."
font: { 
  name: 'Segoe UI', 
  size: 10, 
  bold: true, 
  color: { argb: 'FFFFFFFF' } 
}
fill: { 
  type: 'pattern', 
  pattern: 'solid', 
  fgColor: { argb: 'FF334155' } 
}
alignment: { horizontal: 'center', vertical: 'middle', wrapText: true }
height: 22px
```

#### 4. Fila 4: Fecha de Generación
```javascript
// Ejemplo: "Generado: 02/10/2025 14:30:45"
font: { 
  name: 'Segoe UI', 
  size: 10, 
  bold: false,  // ⚠️ NO BOLD
  color: { argb: 'FFFFFFFF' } 
}
fill: { 
  type: 'pattern', 
  pattern: 'solid', 
  fgColor: { argb: 'FF475569' } 
}
alignment: { horizontal: 'center', vertical: 'middle' }
height: 18px
```

#### 5-6. Filas Espaciadoras
```javascript
// Fila 5: Espaciador pequeño
row.height = 5;

// Fila 6: Espaciador mediano
row.height = 8;
```

#### 7. Fila 7: Headers de Columnas
```javascript
// Ejemplo: "Nombre", "Email", "Teléfono"...
font: { 
  name: 'Segoe UI', 
  size: 10, 
  bold: true, 
  color: { argb: 'FFFFFFFF' } 
}
fill: { 
  type: 'pattern', 
  pattern: 'solid', 
  fgColor: { argb: 'FF0B3040' } 
}
alignment: { horizontal: 'center', vertical: 'middle', wrapText: true }
border: {
  top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
  left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
  bottom: { style: 'thin', color: { argb: 'FF666666' } },
  right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
}
height: 28px
```

#### 8+. Filas de Datos
```javascript
// Contenido de celdas
font: { 
  name: 'Segoe UI', 
  size: 9,  // ⚠️ Tamaño pequeño para densidad de información
  color: { argb: 'FF223344' }  // Gris oscuro legible
}
alignment: { 
  horizontal: 'left',  // 'center' para números, 'right' para montos
  vertical: 'middle', 
  wrapText: false  // ⚠️ NO WRAP en datos
}
border: {
  top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  bottom: { style: 'thin', color: { argb: 'FFC0CCDA' } },
  right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
}
height: 18px
```

---

## 🏗️ ESTRUCTURA OBLIGATORIA DE 7 FILAS - FORMATO PYTHON

### ⚠️ REGLA CRÍTICA: Sistema de Encabezado de 7 Filas

**TODAS las hojas de Excel exportadas DEBEN seguir esta estructura exacta:**

```javascript
// ESTRUCTURA OBLIGATORIA
const ws = wb.addWorksheet('Nombre de la Hoja', { 
  views: [{ state: 'frozen', ySplit: 7 }]  // ✅ FREEZE PANES en fila 7
});

// FILA 1: Título principal - BRAND_COLORS.titleBg (#0B3040)
ws.mergeCells(1, 1, 1, totalColumns);
titleCell.value = 'DR GROUP';
titleCell.font = { name: 'Segoe UI', size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B3040' } };
titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
ws.getRow(1).height = 30;

// FILA 2: Subtítulo descriptivo - BRAND_COLORS.subtitleBg (#1A5F7A)
ws.mergeCells(2, 1, 2, totalColumns);
subCell.value = 'Descripción del Reporte / Directorio';
subCell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A5F7A' } };
subCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
ws.getRow(2).height = 22;

// FILA 3: Métricas consolidadas - BRAND_COLORS.metricsBg (#334155)
ws.mergeCells(3, 1, 3, totalColumns);
metricsCell.value = 'Métrica 1: X | Métrica 2: Y | Métrica 3: Z...';
metricsCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
metricsCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
metricsCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
ws.getRow(3).height = 22;

// FILA 4: Fecha de generación - BRAND_COLORS.dateBg (#475569)
ws.mergeCells(4, 1, 4, totalColumns);
dateCell.value = `Generado: ${new Date().toLocaleString('es-CO')}`;
dateCell.font = { name: 'Segoe UI', size: 10, bold: false, color: { argb: 'FFFFFFFF' } };
dateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF475569' } };
dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
ws.getRow(4).height = 18;

// FILA 5: Espaciador pequeño
ws.getRow(5).height = 5;

// FILA 6: Espaciador mediano
ws.getRow(6).height = 8;

// FILA 7: Headers de columnas - BRAND_COLORS.headerBg (#0B3040)
const headers = ['Columna 1', 'Columna 2', 'Columna 3', ...];
const headerRow = ws.getRow(7);
headers.forEach((h, i) => {
  const cell = headerRow.getCell(i + 1);
  cell.value = h;
  cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B3040' } };
  cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  cell.border = {
    top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
    left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
    bottom: { style: 'thin', color: { argb: 'FF666666' } },
    right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
  };
});
headerRow.height = 28;

// FILA 8+: Datos con formato consistente
data.forEach((item, i) => {
  const row = ws.getRow(i + 8);
  // ... poblar celdas con datos
  for (let col = 1; col <= totalColumns; col++) {
    const cell = row.getCell(col);
    cell.font = { name: 'Segoe UI', size: 9, color: { argb: 'FF223344' } };
    cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: false };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'FFC0CCDA' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
    };
  }
  row.height = 18;
});
```

### 🎯 Características Clave del Sistema de 7 Filas

1. **Freeze Panes Obligatorio**: `ySplit: 7` - Headers siempre visibles al hacer scroll
2. **Merge Cells**: Filas 1-4 se fusionan en todas las columnas
3. **Sin Colores Alternados**: Fondo blanco uniforme en datos (NO alternar colores)
4. **Bordes Profesionales**: Thin style con colores específicos ARGB
5. **Espaciadores**: Filas 5-6 vacías para separación visual limpia
6. **Headers en Fila 7**: Siempre la última fila antes de datos

---

## 📋 ESTRUCTURA DE HOJAS Y FUNCIONALIDADES

### 1. HOJA RESUMEN EJECUTIVO
**Nombre:** `Resumen Ejecutivo`

#### Propósito
Presentar KPIs principales y métricas consolidadas del análisis empresarial.

#### Estructura Visual
```
┌─────────────────────────────────────────────────────┐
│ 🏢 DR GROUP - ANÁLISIS EMPRESARIAL PREMIUM         │ ← Header Principal
├─────────────────────────────────────────────────────┤
│ 📅 Generado: [fecha] | 🏢 Empresas: [lista] | ⏰... │ ← Info Contextual
├─────────────────────────────────────────────────────┤
│ 📊 INDICADORES CLAVE DE RENDIMIENTO                │ ← Sección KPIs
└─────────────────────────────────────────────────────┘
```

#### Especificaciones Técnicas
- **Merge Range:** `A1:H1` (header), `A2:H2` (info)
- **Colores:** Azul corporativo `#1565C0` y `#E3F2FD`
- **Contenido:** Métricas consolidadas en formato tabular empresarial

### 2. HOJA DETALLE POR EMPRESA
**Nombre:** `Detalle por Empresa`

#### Propósito
Análisis granular por empresa con métricas individuales.

#### Columnas Principales
1. **Empresa** (width: 25)
2. **Compromisos Totales** (width: 15)
3. **Completados** (width: 15)
4. **Pendientes** (width: 15)
5. **Vencidos** (width: 15)
6. **Monto Total** (width: 20)
7. **% Cumplimiento** (width: 15)

#### Formato Visual
- **Headers:** Púrpura `#7B1FA2` con texto blanco
- **Datos:** Alternancia de fondos `#FFFFFBF0` y `#FFFFFFFF`
- **Montos:** Formato `$#,##0.00` alineado a la derecha
- **Porcentajes:** Formato `0.00%` centrado

### 3. HOJA ANÁLISIS HISTÓRICO TEMPORAL
**Nombre:** `Análisis Histórico`

#### Propósito
Tendencias temporales y evolución de compromisos por empresa.

#### Características Especiales
- **Agrupación por períodos:** Mensual/Trimestral según rango
- **Colores:** Naranja `#FF6F00` y `#FFF3E0`
- **Datos dinámicos:** Se adapta al período seleccionado

### 4. HOJA COMPROMISOS COMPLETADOS
**Nombre:** `Compromisos Completados`

#### Propósito
Detalle exhaustivo de compromisos pagados completamente.

#### Columnas Detalladas (15 columnas)
1. **EMPRESA** (width: 20)
2. **BENEFICIARIO/PROVEEDOR** (width: 25)
3. **NIT** (width: 15)
4. **CONCEPTO** (width: 25)
5. **VALOR BASE** (width: 15)
6. **IVA** (width: 12)
7. **RETEFUENTE** (width: 12)
8. **ICA** (width: 12)
9. **DERECHOS EXPLOTACIÓN** (width: 15)
10. **GASTOS ADMIN** (width: 12)
11. **INTERESES** (width: 12)
12. **DESCUENTOS** (width: 12)
13. **VALOR TOTAL** (width: 15)
14. **FECHA DE PAGO** (width: 15) ← **FECHA REAL desde colección payments**
15. **MÉTODO DE PAGO** (width: 15)

#### Lógica de Datos Avanzada
```javascript
// Consulta real de fechas de pago
const commitmentPayments = paymentsByCommitmentId[commitment.id] || [];
const latestPayment = sortedPayments[0]; // Más reciente
const paymentDate = latestPayment.date?.toDate() || fallback;
```

#### Formato Visual Específico
- **Headers:** Verde éxito `#2E7D32` con texto blanco
- **Totales:** Resaltados en verde con formato moneda
- **Fechas:** Formato español `dd/mm/aaaa`
- **Alternancia:** Fondos sutiles para mejor lectura

### 5. HOJA COMPROMISOS PENDIENTES (CON PAGOS PARCIALES)
**Nombre:** `Compromisos Pendientes`

#### Propósito
Análisis detallado de compromisos con pagos parciales, incluyendo historial completo de pagos.

#### Sistema de Columnas Dinámicas
```javascript
// Cálculo automático del número máximo de pagos parciales
let maxPartialPayments = 0;
pendingCommitments.forEach(commitment => {
  const payments = paymentsByCommitmentId[commitment.id] || [];
  maxPartialPayments = Math.max(maxPartialPayments, payments.length);
});
```

#### Estructura de Columnas
**Columnas Básicas (14):**
1-14. [Mismas que compromisos completados, sin fecha de pago final]

**Columnas Dinámicas (2 × N pagos):**
- **PAGO PARCIAL 1** (width: 15) - Monto del primer pago
- **FECHA PAGO 1** (width: 12) - Fecha del primer pago
- **PAGO PARCIAL 2** (width: 15) - Monto del segundo pago
- **FECHA PAGO 2** (width: 12) - Fecha del segundo pago
- [... continúa según maxPartialPayments]

#### Lógica de Ordenamiento de Pagos
```javascript
// Pagos ordenados cronológicamente (más antiguo primero)
const sortedPayments = commitmentPayments.sort((a, b) => {
  const dateA = a.date?.toDate() || new Date(a.date || a.createdAt);
  const dateB = b.date?.toDate() || new Date(b.date || b.createdAt);
  return dateA - dateB; // Más antiguo primero
});
```

#### Formato Visual Diferenciado
- **Headers Básicos:** Naranja `#E65100`
- **Headers de Pagos:** Verde `#4CAF50` (diferenciación visual)
- **Montos de Pagos:** Verde bold `#4CAF50` con formato `$#,##0.00`
- **Fechas de Pagos:** Verde bold cuando existe dato
- **Celdas Vacías:** Sin formato cuando no hay más pagos

#### Subtítulo Informativo
```
Total compromisos pendientes: X | Monto total: $XXX.XXX | Máx. pagos parciales: N
```

### 7. HOJA ANÁLISIS TEMPORAL (Página `/reports/period`)
**Nombre:** `Resumen Temporal`

#### Propósito
Presentar métricas consolidadas de análisis temporal por períodos (mensual/semanal).

#### Estructura Visual
- **Colores:** Azul corporativo `#1565C0` y `#E3F2FD`
- **Métricas:** Total períodos, monto total, compromisos, tasa de completado
- **Cálculos:** Crecimiento automático entre períodos

### 8. HOJA SERIE TEMPORAL (Página `/reports/period`) 
**Nombre:** `Serie Temporal`

#### Propósito
Análisis detallado período por período con métricas individuales.

#### Columnas Específicas (8 columnas)
1. **PERÍODO** (width: 15) - Fecha formateada del período
2. **MONTO TOTAL** (width: 15) - Monto consolidado del período
3. **COMPROMISOS** (width: 12) - Número total de compromisos
4. **COMPLETADOS** (width: 12) - Compromisos completados en el período
5. **PENDIENTES** (width: 12) - Compromisos pendientes
6. **VENCIDOS** (width: 12) - Compromisos vencidos
7. **TICKET PROMEDIO** (width: 15) - Promedio por compromiso
8. **% COMPLETADO** (width: 15) - Porcentaje de completado

#### Lógica de Clasificación Temporal
```javascript
// Filtro por fecha de creación
const monthCommitments = commitments.filter(c => {
  const createdDate = c.createdAt?.toDate() || new Date(c.createdAt);
  return createdDate >= monthStart && createdDate <= monthEnd;
});

// Clasificación usando determineCommitmentStatus
const status = determineCommitmentStatus(commitment);
```

#### Formato Visual Específico
- **Headers:** Naranja temporal `#FF6F00` con texto blanco
- **Períodos:** Naranja bold para identificación temporal
- **Montos:** Verde bold `#2E7D32` con formato COP
- **Totales:** Fila consolidada al final

### 6. HOJA COMPROMISOS VENCIDOS
**Nombre:** `Compromisos Vencidos`

#### Propósito
Detalle de compromisos que han superado su fecha de vencimiento sin pago completo.

#### Columnas Específicas (15 columnas)
1-13. [Columnas financieras estándar]
14. **FECHA VENCIMIENTO** (width: 15) ← Destacada en rojo
15. **DÍAS VENCIDOS** (width: 12) ← Cálculo automático

#### Lógica de Cálculo de Vencimiento
```javascript
// Cálculo de días vencidos
const today = new Date();
const dueDate = commitment.dueDate?.toDate() || new Date(commitment.dueDate);
const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
```

#### Formato Visual de Alerta
- **Headers:** Rojo alerta `#D32F2F` con texto blanco
- **Días vencidos:** Rojo bold con formato numérico
- **Fechas vencimiento:** Rojo cuando está vencido
- **Fondo de filas:** Alternancia con tonos rojizos sutiles
**Nombre:** `Compromisos Vencidos`

#### Propósito
Detalle de compromisos que han superado su fecha de vencimiento sin pago completo.

#### Columnas Específicas (15 columnas)
1-13. [Columnas financieras estándar]
14. **FECHA VENCIMIENTO** (width: 15) ← Destacada en rojo
15. **DÍAS VENCIDOS** (width: 12) ← Cálculo automático

#### Lógica de Cálculo de Vencimiento
```javascript
// Cálculo de días vencidos
const today = new Date();
const dueDate = commitment.dueDate?.toDate() || new Date(commitment.dueDate);
const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
```

#### Formato Visual de Alerta
- **Headers:** Rojo alerta `#D32F2F` con texto blanco
- **Días vencidos:** Rojo bold con formato numérico
- **Fechas vencimiento:** Rojo cuando está vencido
- **Fondo de filas:** Alternancia con tonos rojizos sutiles

---

## � EJEMPLO COMPLETO: DIRECTORIO DE CLIENTES

### Implementación de Referencia
**Archivo:** `src/utils/clientesExcelExportSpectacular.js`

```javascript
import ExcelJS from 'exceljs';

// PALETA DE COLORES - FORMATO PYTHON
const BRAND_COLORS = {
  titleBg: '0B3040',
  subtitleBg: '1A5F7A',
  metricsBg: '334155',
  dateBg: '475569',
  headerBg: '0B3040',
  white: 'FFFFFF',
  textDark: '223344',
  borderLight: 'E2E8F0',
  borderMedium: 'C0CCDA'
};

export const exportarClientesSpectacular = async (clientes) => {
  // Calcular métricas
  const totalClientes = clientes.length;
  const totalSalas = clientes.reduce((sum, c) => sum + (c.salas?.length || 0), 0);
  
  // Crear workbook con 2 hojas
  const wb = new ExcelJS.Workbook();
  wb.creator = 'DR Group Dashboard';
  wb.created = new Date();
  
  // HOJA 1: DIRECTORIO DE CLIENTES
  const ws = wb.addWorksheet('Directorio de Clientes', { 
    views: [{ state: 'frozen', ySplit: 7 }]
  });
  
  ws.columns = [
    { width: 30 }, { width: 35 }, { width: 18 }, { width: 10 }, 
    { width: 25 }, { width: 25 }, { width: 50 }, { width: 10 }, { width: 40 }
  ];
  
  // Implementar estructura de 7 filas... (ver código completo arriba)
  
  // HOJA 2: DIRECTORIO DE ADMINISTRADORES
  // Extraer administradores únicos y agregar segunda hoja con mismo formato
  
  // Generar y descargar
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `DR-Group-Clientes-${timestamp}.xlsx`;
  link.click();
  URL.revokeObjectURL(link.href);
  
  return { 
    success: true, 
    filename, 
    message: `Excel generado con 2 hojas`, 
    recordCount: clientes.length 
  };
};
```

### Características del Ejemplo:
- ✅ **2 hojas**: Directorio de Clientes + Directorio de Administradores
- ✅ **Formato Python**: Estructura de 7 filas en ambas hojas
- ✅ **Métricas calculadas**: Totales, promedios, porcentajes (formato colombiano)
- ✅ **Freeze panes**: Headers siempre visibles (ySplit: 7)
- ✅ **Consolidación inteligente**: Administradores únicos con clientes agrupados usando Map
- ✅ **Metadata completa**: Creator, created date, columnas con anchos apropiados
- ✅ **Sin decimales**: Montos formateados como `"$"#,##0`
- ✅ **Sin headers automáticos**: Configuración manual en fila 7
- ✅ **Limpieza de memoria**: URL.revokeObjectURL después de descarga

---

## 📊 FORMATOS REUTILIZABLES - CONSTANTES DE ESTILO

### Definir Formatos Como Constantes
```javascript
// ⚠️ BEST PRACTICE: Definir formatos como constantes reutilizables

// Formato título principal (Fila 1)
const fmtTitle = { 
  font: { name: 'Segoe UI', size: 18, bold: true, color: { argb: 'FFFFFFFF' } }, 
  alignment: { horizontal: 'center', vertical: 'middle' }, 
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B3040' } } 
};

// Formato subtítulo (Fila 2)
const fmtSubTitle = { 
  font: { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }, 
  alignment: { horizontal: 'center', vertical: 'middle', wrapText: true }, 
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A5F7A' } } 
};

// Formato headers de columnas (Fila 7)
const fmtHeader = { 
  font: { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }, 
  alignment: { horizontal: 'center', vertical: 'middle', wrapText: true }, 
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B3040' } }, 
  border: { 
    top: { style: 'thin', color: { argb: 'FFCCCCCC' } }, 
    left: { style: 'thin', color: { argb: 'FFCCCCCC' } }, 
    bottom: { style: 'thin', color: { argb: 'FF666666' } }, 
    right: { style: 'thin', color: { argb: 'FFCCCCCC' } } 
  } 
};

// Formato datos base (Fila 8+)
const fmtDataBase = { 
  font: { name: 'Segoe UI', size: 9, color: { argb: 'FF223344' } }, 
  alignment: { vertical: 'middle', horizontal: 'left', wrapText: false }, 
  border: { 
    top: { style: 'thin', color: { argb: 'FFE2E8F0' } }, 
    left: { style: 'thin', color: { argb: 'FFE2E8F0' } }, 
    bottom: { style: 'thin', color: { argb: 'FFC0CCDA' } }, 
    right: { style: 'thin', color: { argb: 'FFE2E8F0' } } 
  } 
};

// Formato datos monetarios (sin decimales)
const fmtDataMoney = { 
  ...fmtDataBase, 
  alignment: { horizontal: 'right', vertical: 'middle' }, 
  numFmt: '"$"#,##0'  // ⚠️ Sin .00 decimales
};

// Aplicar formato usando Object.assign
Object.assign(titleCell, { style: fmtTitle });
Object.assign(cell, { style: fmtDataMoney });
```

---

## �🔧 FUNCIONES DE EXPORTACIÓN TÉCNICAS

### Sistema de Clasificación de Compromisos
```javascript
// Usando la nueva lógica de estado basada en payments
const { 
  completedCommitments,
  pendingCommitments, 
  overdueCommitments 
} = await filterCommitmentsByStatus(
  filteredCommitments, 
  'all', // status filter
  { includePayments: true }
);
```

### Consulta Optimizada de Pagos
```javascript
// Fetch de todos los pagos con indexación
const paymentsQuery = query(
  collection(db, 'payments'),
  where('companyId', 'in', selectedCompanies)
);
const paymentsSnapshot = await getDocs(paymentsQuery);

// Crear índice para búsqueda eficiente
const paymentsByCommitmentId = {};
paymentsSnapshot.forEach(doc => {
  const payment = { id: doc.id, ...doc.data() };
  if (!paymentsByCommitmentId[payment.commitmentId]) {
    paymentsByCommitmentId[payment.commitmentId] = [];
  }
  paymentsByCommitmentId[payment.commitmentId].push(payment);
});
```

### Sistema de Headers Dinámicos
```javascript
// Cálculo automático de rangos de merge
const totalColumns = basicHeaders.length + (maxPartialPayments * 2);
const mergeRange = `A1:${String.fromCharCode(64 + totalColumns)}1`;
```

---

## 🎨 PATRONES DE FORMATO VISUAL - FORMATO PYTHON

### Borders y Separadores (ARGB Obligatorio)

#### Headers de Columnas (Fila 7)
```javascript
border: {
  top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
  left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
  bottom: { style: 'thin', color: { argb: 'FF666666' } },  // ⚠️ Bottom más oscuro
  right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
}
```

#### Contenido de Datos (Fila 8+)
```javascript
border: {
  top: { style: 'thin', color: { argb: 'FFE2E8F0' } },     // Border light
  left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  bottom: { style: 'thin', color: { argb: 'FFC0CCDA' } },  // Border medium
  right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
}
```

### 🚫 ALTERNANCIA DE FONDOS - PROHIBIDA

```javascript
// ❌ NO USAR alternancia de colores en filas de datos
// Formato Python usa fondo BLANCO UNIFORME para todos los datos

// ❌ INCORRECTO:
const bgColor = (index % 2 === 0) ? 'FFFFFBF0' : 'FFFFFFFF';

// ✅ CORRECTO:
// NO aplicar fill a celdas de datos - dejar fondo blanco por defecto
```

### Formato de Números y Monedas

#### Montos (Pesos Colombianos) - SIN DECIMALES
```javascript
// ⚠️ IMPORTANTE: Formato Python usa montos SIN decimales
cell.numFmt = '"$"#,##0';  // ✅ CORRECTO - Sin .00
cell.alignment = { horizontal: 'right', vertical: 'middle' };
cell.font = { name: 'Segoe UI', size: 9, color: { argb: 'FF223344' } };

// ❌ INCORRECTO - Con decimales
cell.numFmt = '$#,##0.00';  // NO USAR
```

#### Formato de Métricas en Fila 3
```javascript
// Para mostrar métricas con formato colombiano en texto
const fmtCOP = (n) => `$${Math.round(n).toLocaleString('es-CO')}`;
metricsCell.value = `Producción Total: ${fmtCOP(totalProduccion)} | Derechos: ${fmtCOP(totalDerechos)}...`;
// Resultado: "Producción Total: $1.234.567 | Derechos: $148.148..."
```

#### Porcentajes
```javascript
cell.numFmt = '0.00%';
cell.alignment = { horizontal: 'center', vertical: 'middle' };
```

#### Enteros (Contadores)
```javascript
cell.numFmt = '#,##0';
cell.alignment = { horizontal: 'center', vertical: 'middle' };
```

#### Fechas (Formato Español Colombiano)
```javascript
// ✅ Usar toLocaleString('es-CO') para formato colombiano
cell.value = new Date().toLocaleString('es-CO');
// Resultado: "02/10/2025, 14:30:45"

// ✅ Para formato personalizado de fecha
const dateStr = fecha.toLocaleDateString('es-CO');
// Resultado: "02/10/2025"
```

---

## 📱 RESPONSIVIDAD Y ADAPTABILIDAD

### Anchos de Columna Inteligentes (ExcelJS)
```javascript
// Configuración directa de columnas
ws.columns = [
  { width: 30 },  // Nombre
  { width: 35 },  // Email
  { width: 18 },  // Teléfono
  { width: 10 },  // Contadores (# Salas, # Admins)
  { width: 25 },  // Empresas/Ciudades
  { width: 50 },  // Listas (Salas Asignadas, Clientes)
  // ... continuar según necesidad
];

// Para columnas dinámicas (pagos parciales, etc.)
const dynamicColumns = [];
for (let i = 0; i < maxPartialPayments; i++) {
  dynamicColumns.push({ width: 15 }); // Monto
  dynamicColumns.push({ width: 12 }); // Fecha
}
ws.columns = [...baseColumns, ...dynamicColumns];
```

### Alturas de Filas Optimizadas (FORMATO PYTHON)
```javascript
// ⚠️ ALTURAS EXACTAS - NO MODIFICAR

// FILA 1: Título principal
ws.getRow(1).height = 30;

// FILA 2: Subtítulo
ws.getRow(2).height = 22;

// FILA 3: Métricas
ws.getRow(3).height = 22;

// FILA 4: Fecha
ws.getRow(4).height = 18;

// FILA 5: Espaciador pequeño
ws.getRow(5).height = 5;

// FILA 6: Espaciador mediano
ws.getRow(6).height = 8;

// FILA 7: Headers de columnas
ws.getRow(7).height = 28;

// FILAS 8+: Datos
data.forEach((item, i) => {
  ws.getRow(i + 8).height = 18;
});
```

### Metadata del Workbook
```javascript
// ✅ OBLIGATORIO - Agregar metadata
const wb = new ExcelJS.Workbook();
wb.creator = 'DR Group Dashboard';
wb.created = new Date();
wb.modified = new Date();
```

---

## 🔍 LOGGING Y DEBUGGING

### Sistema de Trazabilidad
```javascript
console.log(`📊 Máximo de pagos parciales encontrados: ${maxPartialPayments}`);
console.log(`💰 Compromiso ${commitment.id}: ${payments.length} pagos parciales`);
console.log(`📅 Fecha más reciente: ${paymentDate}`);
```

### Métricas de Exportación
- Total de compromisos por estado
- Número de empresas analizadas  
- Rango temporal del análisis
- Estadísticas de pagos parciales

---

## 📋 CHECKLIST DE CALIDAD - FORMATO PYTHON

### ✅ Antes de Implementar
- [ ] **Biblioteca**: Confirmar uso de ExcelJS (NO XLSX/SheetJS)
- [ ] **Paleta de colores**: Usar BRAND_COLORS (#0B3040, #1A5F7A, #334155, #475569)
- [ ] **Fuente**: Segoe UI en todos los textos
- [ ] **Estructura**: Implementar sistema de 7 filas obligatorio
- [ ] **Freeze panes**: Configurar `ySplit: 7` en todas las hojas
- [ ] **Formatos constantes**: Definir fmtTitle, fmtSubTitle, fmtHeader, fmtDataBase, fmtDataMoney
- [ ] **Sin decimales**: Configurar montos como `"$"#,##0` (sin .00)

### ✅ Durante la Implementación
- [ ] **Fila 1**: Título "DR GROUP" o empresa - #0B3040, 18pt bold, altura 30px, merge cells
- [ ] **Fila 2**: Subtítulo descriptivo - #1A5F7A, 11pt bold, altura 22px, wrapText: true
- [ ] **Fila 3**: Métricas consolidadas con formato colombiano - #334155, 10pt bold, altura 22px
- [ ] **Fila 4**: Fecha generación con toLocaleString('es-CO') - #475569, 10pt normal, altura 18px
- [ ] **Fila 5**: Espaciador 5px (vacía)
- [ ] **Fila 6**: Espaciador 8px (vacía)
- [ ] **Fila 7**: Headers columnas - #0B3040, 10pt bold, altura 28px, configuración manual
- [ ] **Fila 8+**: Datos - Segoe UI 9pt, #223344, altura 18px
- [ ] **Sin alternancia**: Fondo blanco uniforme en datos (NO aplicar fill)
- [ ] **Bordes**: Usar colores ARGB específicos (E2E8F0, C0CCDA, CCCCCC, 666666)
- [ ] **Merge cells**: Filas 1-4 fusionadas en todas las columnas
- [ ] **ws.columns**: Configurar SIN propiedad `header` para evitar inyección automática
- [ ] **Redondeo**: Aplicar Math.round() a todos los montos antes de mostrar
- [ ] **Consolidación**: Usar Map/Set para extraer datos únicos (empresas, administradores)

### ✅ Después de Exportar
- [ ] **Freeze panes funcional**: Headers visibles al hacer scroll (validar en Excel)
- [ ] **Colores correctos**: Validar paleta Python oscura corporativa (#0B3040, #1A5F7A, etc.)
- [ ] **Fuente consistente**: Segoe UI en toda la hoja (todas las celdas)
- [ ] **Metadata**: wb.creator = 'DR Group Dashboard' y wb.created presentes
- [ ] **Columnas apropiadas**: Anchos correctos para contenido (sin desbordamiento)
- [ ] **Sin emojis**: Estructura libre de emojis (solo permitidos en alertas al usuario)
- [ ] **Formato de fecha**: Español colombiano validado (02/10/2025, 14:30:45)
- [ ] **Montos sin decimales**: Validar que todos los montos aparezcan como $1.234.567 (no .00)
- [ ] **Múltiples hojas**: Si aplica, todas con mismo formato de 7 filas
- [ ] **Limpieza de memoria**: Confirmar URL.revokeObjectURL() después de download
- [ ] **Sin headers duplicados**: Fila 1 no debe tener headers, solo en fila 7
- [ ] **Totales correctos**: Validar sumas y cálculos en métricas de fila 3

---

## 🧪 TESTING Y VALIDACIÓN

### Cómo Probar los Excel Exportados

#### 1. Reportes de Resumen (`/reports/summary`)
```bash
# Navegar a la página
http://localhost:5173/reports/summary

# Pasos de testing:
1. Seleccionar filtros de empresas
2. Configurar rango temporal
3. Hacer clic en "Exportar Excel"
4. Validar todas las hojas generadas
```

#### 3. Reportes Temporales (`/reports/period`)
```bash
# Navegar a la página
http://localhost:5173/reports/period

# Pasos de testing:
1. Seleccionar tipo de período (mensual/semanal)
2. Configurar fechas de inicio y fin
3. Configurar modo de comparación
4. Exportar y verificar:
   ✅ Métricas consolidadas en "Resumen Temporal"
   ✅ Serie temporal detallada por período
   ✅ Cálculos de crecimiento correctos
   ✅ Clasificación real de compromisos por período
   ✅ Formato temporal con colores naranja/azul
```

#### 2. Reportes por Empresa (`/reports/company`)
```bash
# Navegar a la página
http://localhost:5173/reports/company

# Pasos de testing:
1. Filtrar por empresas específicas (1-13 empresas)
2. Aplicar filtros de búsqueda si necesario
3. Exportar y verificar:
   ✅ Formato de nombres de empresas (no apiñados)
   ✅ Fechas reales de pagos en compromisos completados
   ✅ Columnas dinámicas en compromisos pendientes
   ✅ Cálculo de días vencidos
```
```bash
# Navegar a la página
http://localhost:5173/reports/company

# Pasos de testing:
1. Filtrar por empresas específicas (1-13 empresas)
2. Aplicar filtros de búsqueda si necesario
3. Exportar y verificar:
   ✅ Formato de nombres de empresas (no apiñados)
   ✅ Fechas reales de pagos en compromisos completados
   ✅ Columnas dinámicas en compromisos pendientes
   ✅ Cálculo de días vencidos
```

### Escenarios de Validación

#### Empresas Seleccionadas
- **1-2 empresas:** Nombres unidos con "y"
- **3 empresas:** Lista completa separada por comas
- **4-5 empresas:** Primeras 2 + "y X más"
- **6+ empresas:** "X empresas seleccionadas"

#### Pagos Parciales Dinámicos
- **Sin pagos:** Solo columnas básicas
- **1-3 pagos:** Columnas visibles con datos
- **4+ pagos:** Validar que todas las columnas se crean correctamente
- **Fechas:** Verificar orden cronológico (más antiguo primero)

### Checklist de Exportación
```
□ Títulos y headers con formato correcto
□ Colores corporativos aplicados
□ Fechas en formato español (dd/mm/aaaa)
□ Montos con formato de moneda ($#,##0.00)
□ Alternancia de colores en filas
□ Información contextual clara en segunda fila
□ Anchos de columna apropiados
□ Borders y separadores consistentes
```

---

## � FUTURAS MEJORAS

### En Desarrollo
- [ ] Gráficos integrados en Excel (ExcelJS Charts API)
- [ ] Filtros automáticos en headers (autoFilter)
- [ ] Formato condicional avanzado (conditional formatting)
- [ ] Hipervínculos entre hojas
- [ ] Validación de datos en celdas
- [ ] Protección de hojas con contraseña

### Consideraciones Técnicas
- **Performance:** Optimización de consultas para grandes volúmenes
- **Memoria:** Manejo eficiente de datos en cliente
- **UX:** Indicadores de progreso durante exportación
- **Compatibilidad:** Soporte para Excel 2016+
- **Accesibilidad:** Contraste WCAG AA/AAA en colores
- **Internacionalización:** Soporte multi-idioma en reportes

---

## 🚫 REGLAS PROHIBIDAS - FORMATO PYTHON

### ❌ NO HACER - Lista Negra

1. **Biblioteca XLSX/SheetJS**
   ```javascript
   // ❌ PROHIBIDO
   import XLSX from 'xlsx';
   XLSX.utils.book_new();
   ```

2. **Colores Brillantes/Saturados**
   ```javascript
   // ❌ PROHIBIDO
   fgColor: { argb: 'FF1565C0' }  // Azul brillante antiguo
   fgColor: { argb: 'FFF57C00' }  // Naranja brillante
   fgColor: { argb: 'FFE3F2FD' }  // Azul claro pastel
   ```

3. **Fuente Arial o Calibri**
   ```javascript
   // ❌ PROHIBIDO
   font: { name: 'Arial' }
   font: { name: 'Calibri' }
   font: { name: 'Times New Roman' }
   ```

4. **Alternancia de Colores en Datos**
   ```javascript
   // ❌ PROHIBIDO
   const bgColor = (index % 2 === 0) ? 'FFFFFBF0' : 'FFFFFFFF';
   cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
   ```

5. **Emojis en Estructura de Datos**
   ```javascript
   // ❌ PROHIBIDO
   titleCell.value = '🏢 DR GROUP';
   metricsCell.value = '📊 Clientes: 45 | 📈 Salas: 120';
   ```

6. **Estructura sin Freeze Panes**
   ```javascript
   // ❌ PROHIBIDO
   const ws = wb.addWorksheet('Hoja', {}); // Sin views
   ```

7. **Sistema de Headers No Estándar**
   ```javascript
   // ❌ PROHIBIDO - NO usar menos o más de 7 filas de encabezado
   // Estructura debe ser EXACTAMENTE: Título, Subtítulo, Métricas, Fecha, 2 espaciadores, Headers
   ```

8. **Montos con Decimales**
   ```javascript
   // ❌ PROHIBIDO
   cell.numFmt = '$#,##0.00';  // Con decimales .00
   
   // ✅ CORRECTO
   cell.numFmt = '"$"#,##0';   // Sin decimales
   ```

9. **Configurar Headers con Propiedad `header` en ws.columns**
   ```javascript
   // ❌ PROHIBIDO - Inyecta headers automáticamente en fila 1
   ws.columns = [
     { header: 'Nombre', key: 'nombre', width: 30 }
   ];
   
   // ✅ CORRECTO - Configurar solo width y key, headers manuales en fila 7
   ws.columns = [
     { key: 'nombre', width: 30 }
   ];
   ```

10. **No Limpiar URLs Temporales**
    ```javascript
    // ❌ PROHIBIDO - Memory leak
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.click();
    // Falta limpieza!
    
    // ✅ CORRECTO
    URL.revokeObjectURL(link.href);
    ```

---

## ✅ REGLAS OBLIGATORIAS - FORMATO PYTHON

### 📌 SIEMPRE HACER - Checklist de Oro

1. **✅ ExcelJS como biblioteca única**
   ```javascript
   import ExcelJS from 'exceljs';
   const wb = new ExcelJS.Workbook();
   ```

2. **✅ Paleta BRAND_COLORS estricta**
   ```javascript
   const BRAND_COLORS = {
     titleBg: '0B3040',
     subtitleBg: '1A5F7A',
     metricsBg: '334155',
     dateBg: '475569',
     headerBg: '0B3040',
     white: 'FFFFFF',
     textDark: '223344',
     borderLight: 'E2E8F0',
     borderMedium: 'C0CCDA'
   };
   ```

3. **✅ Fuente Segoe UI universal**
   ```javascript
   font: { name: 'Segoe UI', size: [9|10|11|18], bold: [true|false] }
   ```

4. **✅ Estructura de 7 filas con freeze panes**
   ```javascript
   const ws = wb.addWorksheet('Nombre', { 
     views: [{ state: 'frozen', ySplit: 7 }]
   });
   ```

5. **✅ Fondo blanco uniforme en datos**
   ```javascript
   // NO aplicar fill a celdas de datos
   // Dejar fondo blanco por defecto
   ```

6. **✅ Metadata del workbook**
   ```javascript
   wb.creator = 'DR Group Dashboard';
   wb.created = new Date();
   ```

7. **✅ Merge cells en filas 1-4**
   ```javascript
   ws.mergeCells(1, 1, 1, totalColumns); // Fila 1
   ws.mergeCells(2, 1, 2, totalColumns); // Fila 2
   ws.mergeCells(3, 1, 3, totalColumns); // Fila 3
   ws.mergeCells(4, 1, 4, totalColumns); // Fila 4
   ```

8. **✅ Configuración de columnas sin headers automáticos**
   ```javascript
   // ⚠️ IMPORTANTE: NO usar `header` en columns para evitar inyección automática
   const COLUMNS_NO_HEADER = columnDefs.map(({ header, ...rest }) => ({ ...rest }));
   ws.columns = COLUMNS_NO_HEADER;
   
   // Luego configurar headers manualmente en fila 7
   const headerRow = ws.getRow(7);
   columnDefs.forEach((col, idx) => {
     const cell = headerRow.getCell(idx + 1);
     cell.value = col.header;
     // ... aplicar formato
   });
   ```

---

## 🎯 CARACTERÍSTICAS TÉCNICAS AVANZADAS

### Redondeo de Montos (Sin Decimales)
```javascript
// ✅ OBLIGATORIO: Redondear todos los montos antes de mostrar
const roundInt = (v) => Math.round(v || 0);

// Aplicar en cálculos de totales
const totalProduccion = mapped.reduce((s, r) => s + r.produccion, 0);
const prodInt = roundInt(totalProduccion);

// Mostrar en métricas
const fmtCOP = (n) => `$${n.toLocaleString('es-CO')}`;
metricsCell.value = `Producción Total: ${fmtCOP(prodInt)}`;
```

### Prevención de Inyección de Headers Duplicados
```javascript
// ❌ PROBLEMA: Si usas ws.columns con `header`, ExcelJS inyecta headers en fila 1
ws.columns = [
  { header: 'Nombre', key: 'nombre', width: 30 }  // ❌ Sobreescribe fila 1
];

// ✅ SOLUCIÓN: Configurar columnas sin header, luego agregar headers manualmente en fila 7
const COLUMN_DEFS = [
  { header: 'Nombre', key: 'nombre', width: 30 }
];

const COLUMNS_NO_HEADER = COLUMN_DEFS.map(({ header, ...rest }) => ({ ...rest }));
ws.columns = COLUMNS_NO_HEADER;  // ✅ Solo width y key

// Agregar headers manualmente en fila 7
const headerRow = ws.getRow(7);
COLUMN_DEFS.forEach((col, idx) => {
  const cell = headerRow.getCell(idx + 1);
  cell.value = col.header;
  Object.assign(cell, { style: fmtHeader });
});
```

### Generación y Descarga de Archivo
```javascript
// ✅ Proceso completo de exportación
const timestamp = new Date().toISOString().replace(/[:]/g, '-').slice(0, 19);
const filename = `DR-Group-Nombre-${timestamp}.xlsx`;

// Generar buffer
const buffer = await wb.xlsx.writeBuffer();

// Crear blob con tipo MIME correcto
const blob = new Blob([buffer], { 
  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
});

// Crear link temporal y descargar
const link = document.createElement('a');
link.href = URL.createObjectURL(blob);
link.download = filename;
link.click();

// Limpiar URL temporal (importante para memoria)
URL.revokeObjectURL(link.href);
```

### Consolidación de Datos Únicos
```javascript
// ✅ Extraer datos únicos con Set
const totalEmpresas = new Set(clientes.flatMap(c => 
  c.salas?.map(s => s.empresa) || []
)).size;

// ✅ Consolidar administradores únicos por email
const adminsMap = new Map();
clientes.forEach(cliente => {
  cliente.administradores?.forEach(admin => {
    if (!admin.email) return;
    
    if (!adminsMap.has(admin.email)) {
      adminsMap.set(admin.email, {
        nombre: admin.nombre,
        email: admin.email,
        clientes: [],
        totalSalas: 0
      });
    }
    
    const adminData = adminsMap.get(admin.email);
    adminData.clientes.push(cliente.nombre);
    adminData.totalSalas += cliente.salas?.length || 0;
  });
});

const administradores = Array.from(adminsMap.values());
```

---

## 📚 REFERENCIAS Y DOCUMENTACIÓN

### 📁 Archivos con Formato Python Implementado

#### ✅ Exportadores Excel - Formato Python Completo

1. **📊 Liquidaciones - Formato Python**
   - **Archivo:** `src/utils/liquidacionExcelExportPythonFormat.js`
   - **Función:** `exportarLiquidacionPythonFormat(data, empresaFallback, options)`
   - **Descripción:** Exportador de liquidaciones por máquinas con formato Python profesional
   - **Características:**
     - 16 columnas: Empresa, Serial, NUC, Establecimiento, Días transmitidos, etc.
     - Estructura de 7 filas obligatoria
     - Freeze panes en fila 7
     - Colores BRAND_COLORS (#0B3040, #1A5F7A, #334155, #475569)
     - Segoe UI exclusiva
     - Montos sin decimales (`"$"#,##0`)
     - Fila de métricas con: Máquinas, Salas, Producción Total, Derechos, Gastos Admin, Total Impuestos
     - Totales al final con formato destacado
   - **Usado en:** Página de Liquidaciones
   - **Estado:** ✅ PRODUCCIÓN

2. **👥 Clientes - Formato Python**
   - **Archivo:** `src/utils/clientesExcelExportSpectacular.js`
   - **Función:** `exportarClientesSpectacular(clientes)`
   - **Descripción:** Exportador de directorio de clientes y administradores con formato Python
   - **Características:**
     - **Hoja 1:** Directorio de Clientes (9 columnas)
       - Nombre, Email, Teléfono, # Salas, Empresas, Ciudades, Salas Asignadas, # Admins, Administradores
     - **Hoja 2:** Directorio de Administradores (8 columnas)
       - Nombre, Email, Teléfono, # Clientes, # Salas, Empresas, Ciudades, Clientes Asignados
     - Estructura de 7 filas en ambas hojas
     - Freeze panes en fila 7
     - Consolidación de administradores únicos con Map
     - Métricas calculadas: Total clientes, salas, empresas, admins, porcentajes
     - Formato colombiano con toLocaleString('es-CO')
   - **Usado en:** Página de Clientes (`src/pages/ClientesPage.jsx`)
   - **Estado:** ✅ PRODUCCIÓN

### 🌐 URLs de Testing y Acceso

#### Páginas con Exportación Formato Python ✅

1. **👥 Clientes (Formato Python Completo)**
   - **URL:** [`http://localhost:5173/clientes`](http://localhost:5173/clientes)
   - **Exportador:** `clientesExcelExportSpectacular.js`
   - **Botón:** "Exportar" (arriba a la derecha)
   - **Archivo generado:** `DR-Group-Clientes-[timestamp].xlsx`
   - **Hojas:** 2 (Directorio de Clientes + Directorio de Administradores)
   - **Estado:** ✅ FORMATO PYTHON IMPLEMENTADO

2. **📊 Liquidaciones (Formato Python Completo)**
   - **URL:** Página de Liquidaciones (módulo de liquidaciones)
   - **Exportador:** `liquidacionExcelExportPythonFormat.js`
   - **Archivo generado:** `DR-Group-Liquidacion-[empresa]-[timestamp].xlsx`
   - **Hojas:** 1 (Liquidación Consolidada)
   - **Estado:** ✅ FORMATO PYTHON IMPLEMENTADO

### 📖 Documentación Externa
- **ExcelJS GitHub:** [`https://github.com/exceljs/exceljs`](https://github.com/exceljs/exceljs)
- **ExcelJS API Docs:** [`https://github.com/exceljs/exceljs#interface`](https://github.com/exceljs/exceljs#interface)

---

## 🔄 MIGRACIÓN DE FORMATOS ANTIGUOS A PYTHON

### Estado de Exportadores - Formato Python

| Módulo | Archivo | Formato | Estado |
|--------|---------|---------|--------|
| **Clientes** | `clientesExcelExportSpectacular.js` | ✅ Python | ✅ PRODUCCIÓN |
| **Liquidaciones** | `liquidacionExcelExportPythonFormat.js` | ✅ Python | ✅ PRODUCCIÓN |

### ✅ Módulos con Formato Python Completo

1. **Liquidaciones** - Formato Python completo con 16 columnas, freeze panes, BRAND_COLORS
2. **Clientes** - Formato Python con 2 hojas (Clientes + Administradores), consolidación inteligente

> **Nota:** Las páginas de reportes (Resumen, Empresa, Período) utilizan formatos diferentes y NO están basadas en el formato Python documentado en este archivo.

### 📋 Checklist para Nuevos Exportadores

Para crear un nuevo exportador con formato Python desde cero:

- [ ] **1. Biblioteca:** Usar ExcelJS (`import ExcelJS from 'exceljs'`)
- [ ] **2. Colores:** Definir BRAND_COLORS (#0B3040, #1A5F7A, #334155, #475569)
- [ ] **3. Fuente:** Segoe UI exclusiva en todos los textos
- [ ] **4. Estructura:** Implementar sistema de 7 filas obligatorio
- [ ] **5. Freeze panes:** Agregar `views: [{ state: 'frozen', ySplit: 7 }]`
- [ ] **6. Montos:** Formato `"$"#,##0` (sin decimales)
- [ ] **7. Fechas:** Usar `toLocaleString('es-CO')`
- [ ] **8. Headers:** Configurar manualmente en fila 7 (sin propiedad header en ws.columns)
- [ ] **9. Bordes:** Usar colores ARGB específicos (E2E8F0, C0CCDA)
- [ ] **10. Metadata:** Agregar wb.creator y wb.created
- [ ] **11. Limpieza:** Incluir URL.revokeObjectURL() después de descarga
- [ ] **12. Error handling:** Try-catch con logging informativo
- [ ] **13. Testing:** Validar en Excel que freeze panes, colores y formatos funcionen

---

## 🐛 MANEJO DE ERRORES Y LOGGING

### Try-Catch Obligatorio
```javascript
export const exportarDatosSpectacular = async (datos) => {
  try {
    console.log('[ExcelExport] Iniciando exportacion formato Python...');
    
    // Validación de datos
    if (!datos || !Array.isArray(datos) || datos.length === 0) {
      throw new Error('No hay datos validos para exportar');
    }
    
    // ... lógica de exportación
    
    console.log('[ExcelExport] Completado:', filename);
    console.log(`[ExcelExport] Registros exportados: ${datos.length}`);
    
    return { 
      success: true, 
      filename, 
      message: `Excel generado: ${filename}`, 
      recordCount: datos.length 
    };
    
  } catch (error) {
    console.error('[ExcelExport] Error:', error);
    throw error;  // Re-lanzar para manejo en UI
  }
};
```

### Logging Informativo
```javascript
// ✅ Logs útiles durante la exportación
console.log('[ExcelExport] Iniciando exportacion formato Python...');
console.log(`[ExcelExport] Total registros: ${datos.length}`);
console.log(`[ExcelExport] Empresa fallback recibida:`, empresaFallback);
console.log(`[ExcelExport] Empresa final usada para título:`, empresa);
console.log(`[ExcelExport] Máximo de pagos parciales encontrados: ${maxPartialPayments}`);
console.log(`[ExcelExport] Hoja 1: ${clientes.length} clientes | Hoja 2: ${administradores.length} administradores`);
console.log('[ExcelExport] Completado:', filename);
```

### Validaciones de Datos
```javascript
// ✅ Validar y normalizar datos antes de exportar
const validarDatos = (datos) => {
  if (!datos || !Array.isArray(datos)) {
    throw new Error('Datos inválidos: debe ser un array');
  }
  
  if (datos.length === 0) {
    throw new Error('No hay registros para exportar');
  }
  
  // Normalizar datos faltantes
  return datos.map((item, index) => ({
    ...item,
    id: item.id || `registro-${index + 1}`,
    nombre: item.nombre || 'Sin nombre',
    email: item.email || 'Sin email',
    telefono: item.telefono || 'Sin telefono'
  }));
};

// Uso
const datosValidados = validarDatos(datosOriginales);
```

### Respuesta Estructurada
```javascript
// ✅ Retornar objeto estructurado con información completa
return { 
  success: true,                          // Estado de operación
  filename,                               // Nombre del archivo generado
  message: `Excel generado con 2 hojas`,  // Mensaje descriptivo
  recordCount: clientes.length,           // Cantidad de registros
  sheetsCount: 2,                         // Número de hojas generadas
  timestamp: new Date().toISOString(),    // Timestamp de generación
  adminsCount: administradores.length     // Datos adicionales si aplica
};
```

---

## 📝 RESUMEN EJECUTIVO - REGLAS DE ORO

### 🎯 5 Reglas Fundamentales Innegociables

1. **ExcelJS Únicamente** ✅
   - NO usar XLSX/SheetJS
   - `import ExcelJS from 'exceljs'`

2. **Estructura de 7 Filas Exacta** ✅
   - Título (#0B3040) → Subtítulo (#1A5F7A) → Métricas (#334155) → Fecha (#475569) → 2 Espaciadores → Headers (#0B3040)
   - Freeze panes: `ySplit: 7`

3. **Segoe UI Exclusiva** ✅
   - NO Arial, NO Calibri
   - Tamaños: 18pt (título), 11pt (subtítulo), 10pt (headers/métricas), 9pt (datos)

4. **Montos Sin Decimales** ✅
   - Formato: `"$"#,##0` (NO .00)
   - Redondear con Math.round()

5. **Fondo Blanco Uniforme** ✅
   - NO alternancia de colores en datos
   - Solo colores en filas 1-4 y headers (fila 7)

### 🚀 Implementación Rápida (Copy-Paste Template)
```javascript
import ExcelJS from 'exceljs';

const BRAND_COLORS = {
  titleBg: '0B3040', subtitleBg: '1A5F7A', metricsBg: '334155', dateBg: '475569',
  headerBg: '0B3040', white: 'FFFFFF', textDark: '223344',
  borderLight: 'E2E8F0', borderMedium: 'C0CCDA'
};

export const exportar = async (datos) => {
  try {
    if (!datos || datos.length === 0) throw new Error('Sin datos');
    
    const wb = new ExcelJS.Workbook();
    wb.creator = 'DR Group Dashboard';
    wb.created = new Date();
    
    const ws = wb.addWorksheet('Hoja 1', { views: [{ state: 'frozen', ySplit: 7 }] });
    ws.columns = [{ width: 30 }, { width: 35 }]; // Sin header
    
    // Fila 1-7: Implementar estructura...
    // Fila 8+: Datos...
    
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `DR-Group-Export-${Date.now()}.xlsx`;
    link.click();
    URL.revokeObjectURL(link.href);
    
    return { success: true, recordCount: datos.length };
  } catch (error) {
    console.error('[ExcelExport] Error:', error);
    throw error;
  }
};
```

---

**Documento actualizado por:** Sistema DR Group  
**Última actualización:** Octubre 2025  
**Revisión:** v2.0 - **FORMATO PYTHON PROFESIONAL IMPLEMENTADO**  
**Estado:** ✅ Estándar corporativo oficial DR Group  
**Completitud:** 100% - Todas las normas documentadas
