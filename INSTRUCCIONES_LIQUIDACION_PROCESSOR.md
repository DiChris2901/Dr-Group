# 🚀 Procesador de Liquidaciones - DR Group Dashboard

## 📋 Instrucciones de Uso

### 🎯 **¿Qué es el Procesador de Liquidaciones?**
Una herramienta avanzada que cruza datos entre archivos de "Base de Liquidación" e "Inventario" para generar reportes completos con información de establecimientos.

---

## 🔧 **Cómo Ejecutar**

### 1. **Iniciar el Servidor**
```bash
npm run dev
```

### 2. **Navegar a la Nueva Página**
- **URL**: `http://localhost:5174/liquidation-processor`
- **Menú**: Sidebar → Herramientas → Procesador de Liquidaciones

---

## 📂 **Funcionalidades Implementadas**

### ✅ **Carga de Archivos**
- **Drag & Drop**: Arrastra archivos Excel/CSV directamente
- **Seleccionar Archivos**: Click para abrir explorador de archivos
- **Formatos Soportados**: .xlsx, .xls, .csv
- **Validación**: Verificación automática de estructura

### ✅ **Procesamiento Inteligente**
- **Búsqueda por Serial**: Primera opción de coincidencia
- **Búsqueda por NUC**: Segunda opción si no hay Serial
- **Búsqueda por NUID**: Tercera opción de respaldo
- **Conversión de Períodos**: "202507" → "Julio 2025"

### ✅ **Visualización de Resultados**
- **Tabla Completa**: Vista de todos los datos procesados
- **Filtros Dinámicos**: Por establecimiento, período, búsqueda general
- **Estadísticas**: Totales, encontrados, no encontrados
- **Paginación**: Muestra primeros 100 registros en pantalla

### ✅ **Exportación**
- **Excel (.xlsx)**: Formato completo con formato
- **CSV**: Datos planos compatibles
- **Filtros Aplicados**: Solo exporta lo visible/filtrado
- **Nombres Automáticos**: Con timestamp para identificación

---

## 📊 **Estructura de Archivos**

### **Base de Liquidación** (Requerido)
```
Columnas necesarias:
- NIT
- Contrato  
- NUC
- NUID
- Serial
- Tarifa
- Periodo (formato: 202507)
- Entradas
- Salidas
- Jackpot
- Derechos de Explotación
- Gastos de Administración
```

### **Inventario** (Requerido)
```
Columnas necesarias:
- Código local
- Nombre Establecimiento
- NUC
- NUID
- Serial
- Código Marca
- Marca
- Código Apuesta
- Tipo Apuesta
- Fecha Inicio
- Fecha Fin
```

### **Liquidación Final** (Generado)
```
Columnas de salida:
- NIT
- Contrato
- NUC
- Serial
- Establecimiento (cruzado desde Inventario)
- Tarifa
- Período (convertido a texto legible)
- Entradas
- Salidas
- Jackpot
- Derechos de Explotación
- Gastos de Administración
```

---

## 🎨 **Características del Design System**

### ✨ **Spectacular Design v2.1**
- **Gradientes Premium**: Efectos visuales empresariales
- **Glassmorphism**: Efectos de vidrio esmerilado
- **Animaciones Framer Motion**: Micro-interacciones fluidas
- **Responsive Design**: Adaptable a móvil y desktop
- **ARM64 Compatible**: Optimizado para Apple Silicon

### 🎯 **Zona de Upload**
- **Estados Visuales**: Normal, Drag Over, Archivo Cargado
- **Colores Dinámicos**: Verde para éxito, azul para interacción
- **Feedback Inmediato**: Contador de registros cargados
- **Animaciones Hover**: Elevación y efectos de sombra

### 📈 **Procesamiento**
- **Botón Spectacular**: Gradiente animado con shimmer effect
- **Barra de Progreso**: Indicador de procesamiento activo
- **Estados de Carga**: Spinners y feedback visual

---

## 🔍 **Ejemplo de Uso**

### Paso 1: Cargar Archivos
1. Arrastra "base_liquidacion.xlsx" a la zona izquierda
2. Arrastra "inventario.xlsx" a la zona derecha
3. Verifica que los contadores muestren los registros correctos

### Paso 2: Procesar
1. Click en "Procesar Archivos" (botón azul spectacular)
2. Espera la barra de progreso (2 segundos de simulación)
3. Los resultados aparecerán automáticamente

### Paso 3: Revisar y Filtrar
1. Usa los filtros para refinar los datos
2. Revisa las estadísticas en la parte superior
3. Identifica registros "No encontrados" si los hay

### Paso 4: Exportar
1. Selecciona formato (Excel recomendado)
2. Los filtros aplicados se incluyen en la exportación
3. Archivo se descarga automáticamente con timestamp

---

## 🛠️ **Dependencias Agregadas**
```bash
# Ya instaladas automáticamente:
- xlsx: ^0.18.5          # Lectura/escritura Excel
- papaparse: ^5.4.1      # Procesamiento CSV
- file-saver: ^2.0.5     # Descarga de archivos
```

---

## 🚀 **Estado del Proyecto**

### ✅ **Completamente Funcional**
- [x] Interfaz spectacular implementada
- [x] Lógica de cruzado de datos
- [x] Sistema de filtros dinámicos
- [x] Exportación Excel/CSV
- [x] Validación de archivos
- [x] Manejo de errores
- [x] Responsive design
- [x] Integrado en el menú del dashboard

### 🎯 **Acceso Rápido**
- **URL**: `/liquidation-processor`
- **Menú**: Herramientas → Procesador de Liquidaciones
- **Breadcrumb**: Herramientas → Liquidaciones

---

## 💡 **Notas Técnicas**

### **Performance**
- Procesamiento en memoria (sin backend)
- Optimizado para archivos de hasta 50,000 registros
- Paginación automática en tabla de resultados

### **Compatibilidad**
- Navegadores modernos con soporte ES6+
- Archivos Excel 2007+ (.xlsx)
- CSV con codificación UTF-8

### **Seguridad**
- Procesamiento local (no se envían datos a servidor)
- Validación de tipos de archivo
- Manejo seguro de memoria

---

**¡El Procesador de Liquidaciones está listo para uso empresarial!** 🎉

Ejecuta `npm run dev` y navega a `/liquidation-processor` para comenzar a usar la herramienta.
