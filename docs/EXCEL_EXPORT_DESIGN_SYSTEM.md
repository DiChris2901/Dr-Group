# 📊 SISTEMA DE DISEÑO PARA EXPORTACIÓN DE EXCEL - DR GROUP

> **Documento de especificaciones técnicas y visuales para exportación de reportes Excel**  
> Versión: 1.0 | Fecha: Septiembre 2025 | Sistema: DR Group Dashboard

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

## 🎨 PALETA DE COLORES CORPORATIVA

### Colores Principales
```scss
// Azul Corporativo DR Group
$primary-blue: #1565C0
$primary-blue-light: #E3F2FD
$primary-blue-bg: #F3F2FD

// Naranja Empresarial (Pendientes)
$orange-primary: #F57C00
$orange-light: #FFF3E0
$orange-bg: #FFFBF0

// Verde Éxito (Completados)
$success-green: #2E7D32
$success-green-light: #E8F5E8
$success-green-accent: #4CAF50

// Rojo Alerta (Vencidos)
$danger-red: #D32F2F
$danger-red-light: #FFEBEE
$danger-red-bg: #FFEAEA

// Púrpura Detalle
$purple-primary: #7B1FA2
$purple-light: #F3E5F5

// Gris Neutro
$neutral-gray: #424242
$border-gray: #E0E0E0
$bg-alternate: #FFFFF3
```

---

## 🔤 SISTEMA TIPOGRÁFICO

### Fuente Base
```css
font-family: 'Arial', sans-serif
```

### Jerarquía Tipográfica

#### Headers Principales (Títulos de Hojas)
```css
font-size: 16px
font-weight: bold
color: #FFFFFF (blanco sobre fondo de color)
text-align: center
vertical-align: middle
height: 30-35px
```

#### Headers Secundarios (Subtítulos)
```css
font-size: 12px
font-weight: bold
color: Varía según contexto
text-align: center
vertical-align: middle
height: 22-25px
```

#### Headers de Tabla (Columnas)
```css
font-size: 11px
font-weight: bold
color: #FFFFFF
text-align: center
vertical-align: middle
height: 25px
border: medium style
```

#### Contenido de Datos
```css
font-size: 9px
font-weight: normal
color: #424242
text-align: Varía según tipo de datos
height: 18px
```

#### Totales y Resúmenes
```css
font-size: 11-12px
font-weight: bold
color: #FFFFFF (sobre fondos de color)
```

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

## 🔧 FUNCIONES DE EXPORTACIÓN TÉCNICAS

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

## 🎨 PATRONES DE FORMATO VISUAL

### Borders y Separadores
```css
/* Headers principales */
border: {
  top: thick, color: #FFFFFF
  bottom: thick, color: #FFFFFF  
}

/* Headers de tabla */
border: {
  top: medium, color: [color del header]
  bottom: medium, color: [color del header]
}

/* Contenido de celdas */
border: {
  top: thin, color: #E0E0E0
  bottom: thin, color: #E0E0E0
  left: thin, color: #E0E0E0
  right: thin, color: #E0E0E0
}
```

### Alternancia de Fondos
```javascript
// Patrón de alternancia para mejor legibilidad
const bgColor = (index % 2 === 0) ? 'FFFFFBF0' : 'FFFFFFFF';
```

### Formato de Números y Monedas
```css
/* Montos */
numFmt: '$#,##0.00'
alignment: right

/* Porcentajes */
numFmt: '0.00%'
alignment: center

/* Enteros */
numFmt: '#,##0'
alignment: right
```

---

## 📱 RESPONSIVIDAD Y ADAPTABILIDAD

### Anchos de Columna Inteligentes
```javascript
// Sistema de anchos adaptativos
const columnWidths = [
  20, 25, 15, 25, 15, 12, 12, 12, 15, 12, 12, 12, 15, 15 // Básicas
];

// Agregar anchos dinámicos para pagos parciales
for (let i = 0; i < maxPartialPayments; i++) {
  columnWidths.push(15); // Monto
  columnWidths.push(12); // Fecha
}
```

### Alturas de Filas Optimizadas
```css
/* Headers principales */
row-height: 30-35px

/* Headers secundarios */
row-height: 22-25px

/* Headers de tabla */
row-height: 25px

/* Contenido */
row-height: 18px
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

## 📋 CHECKLIST DE CALIDAD

### Antes de Exportar
- [ ] Verificar clasificación correcta de compromisos
- [ ] Validar fechas de pagos desde colección `payments`
- [ ] Confirmar formato de números y monedas
- [ ] Revisar alternancia de colores de filas
- [ ] Validar anchos de columnas dinámicas

### Después de Exportar
- [ ] Verificar integridad de datos en cada hoja
- [ ] Confirmar formatos visuales aplicados
- [ ] Validar totales y cálculos
- [ ] Revisar headers y títulos
- [ ] Confirmar información contextual clara

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
- [ ] Gráficos integrados en Excel
- [ ] Filtros automáticos en headers
- [ ] Formato condicional avanzado
- [ ] Hipervínculos entre hojas

### Consideraciones Técnicas
- **Performance:** Optimización de consultas para grandes volúmenes
- **Memoria:** Manejo eficiente de datos en cliente
- **UX:** Indicadores de progreso durante exportación
- **Compatibilidad:** Soporte para Excel 2016+

---

**Documento creado por:** Sistema DR Group  
**Última actualización:** Septiembre 2025  
**Revisión:** v1.0 - Sistema completo implementado  
**URLs de Referencia:** 
- Reportes Resumen: [`http://localhost:5173/reports/summary`](http://localhost:5173/reports/summary)
- Reportes Empresa: [`http://localhost:5173/reports/company`](http://localhost:5173/reports/company)
- Reportes Temporales: [`http://localhost:5173/reports/period`](http://localhost:5173/reports/period)
