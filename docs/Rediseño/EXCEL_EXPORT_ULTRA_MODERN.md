# 📊 Excel Export Design - Ultra Modern

**Versión:** 1.0.0  
**Fecha:** Enero 2026  
**Referencia:** Ultra Modern Design System

---

## 📋 Índice
1. [Botón de Exportación](#botón-de-exportación)
2. [Modal de Configuración](#modal-de-configuración)
3. [Estados y Feedback](#estados-y-feedback)
4. [Formato Excel](#formato-excel)
5. [Implementación](#implementación)

---

## 🎯 Botón de Exportación

### **Ubicación:**

- **Toolbar principal** de la página (junto a filtros/búsqueda)
- **Header de tabla** (esquina superior derecha)
- **Action menu** de cada fila (exportar individual)

### **Diseño del Botón:**

```html
<button class="export-button">
  <span class="material-icons">file_download</span>
  <span class="button-text">Exportar a Excel</span>
  <div class="button-shimmer"></div>
</button>
```

### **Estilos:**

```css
.export-button {
  padding: 12px 24px;
  background: linear-gradient(135deg, #10b981, #059669);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
  position: relative;
  overflow: hidden;
}

.export-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: left 0.5s ease;
}

.export-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(16, 185, 129, 0.5);
}

.export-button:hover::before {
  left: 100%;
}

.export-button:active {
  transform: scale(0.98);
}

/* Icon */
.export-button .material-icons {
  font-size: 20px;
}

/* Variante compacta (icon only) */
.export-button.compact {
  width: 44px;
  height: 44px;
  padding: 0;
  justify-content: center;
}

.export-button.compact .button-text {
  display: none;
}
```

### **Variantes de Color:**

```css
/* Primary (Default - Success green) */
background: linear-gradient(135deg, #10b981, #059669);

/* Secondary (Blue - para reportes) */
background: linear-gradient(135deg, #0ea5e9, #0284c7);
box-shadow: 0 8px 20px rgba(14, 165, 233, 0.3);

/* Warning (Amber - para exports con advertencias) */
background: linear-gradient(135deg, #f59e0b, #d97706);
box-shadow: 0 8px 20px rgba(245, 158, 11, 0.3);
```

---

## 🪟 Modal de Configuración

### **Cuando Usar Modal:**

- Exportación con múltiples opciones (formato, rango de fechas, columnas)
- Exportaciones grandes (>1000 registros)
- Necesidad de configurar previamente

### **Estructura del Modal:**

```html
<div class="export-modal">
  <div class="modal-header">
    <div class="modal-icon">📊</div>
    <div class="modal-title-section">
      <h2 class="modal-title">Exportar a Excel</h2>
      <p class="modal-subtitle">Configurar opciones de exportación</p>
    </div>
    <button class="close-button">
      <span class="material-icons">close</span>
    </button>
  </div>

  <div class="modal-body">
    <!-- Opciones de exportación -->
    <div class="export-options">
      
      <!-- Formato -->
      <div class="option-group">
        <label class="option-label">Formato de archivo</label>
        <div class="radio-group">
          <label class="radio-option">
            <input type="radio" name="format" value="xlsx" checked />
            <span class="radio-custom"></span>
            <div class="radio-content">
              <span class="radio-title">Excel (.xlsx)</span>
              <span class="radio-description">Formato moderno con estilos</span>
            </div>
          </label>
          <label class="radio-option">
            <input type="radio" name="format" value="csv" />
            <span class="radio-custom"></span>
            <div class="radio-content">
              <span class="radio-title">CSV (.csv)</span>
              <span class="radio-description">Compatible con cualquier software</span>
            </div>
          </label>
        </div>
      </div>

      <!-- Rango de datos -->
      <div class="option-group">
        <label class="option-label">Rango de exportación</label>
        <div class="radio-group">
          <label class="radio-option">
            <input type="radio" name="range" value="visible" checked />
            <span class="radio-custom"></span>
            <div class="radio-content">
              <span class="radio-title">Datos visibles</span>
              <span class="radio-description">Solo los registros filtrados (125 items)</span>
            </div>
          </label>
          <label class="radio-option">
            <input type="radio" name="range" value="all" />
            <span class="radio-custom"></span>
            <div class="radio-content">
              <span class="radio-title">Todos los datos</span>
              <span class="radio-description">Sin aplicar filtros (450 items)</span>
            </div>
          </label>
          <label class="radio-option">
            <input type="radio" name="range" value="selected" />
            <span class="radio-custom"></span>
            <div class="radio-content">
              <span class="radio-title">Solo seleccionados</span>
              <span class="radio-description">Registros marcados con checkbox (8 items)</span>
            </div>
          </label>
        </div>
      </div>

      <!-- Columnas -->
      <div class="option-group">
        <label class="option-label">Columnas a incluir</label>
        <div class="checkbox-group">
          <label class="checkbox-option">
            <input type="checkbox" checked />
            <span class="checkbox-custom"></span>
            <span>Empresa</span>
          </label>
          <label class="checkbox-option">
            <input type="checkbox" checked />
            <span class="checkbox-custom"></span>
            <span>Concepto</span>
          </label>
          <label class="checkbox-option">
            <input type="checkbox" checked />
            <span class="checkbox-custom"></span>
            <span>Beneficiario</span>
          </label>
          <label class="checkbox-option">
            <input type="checkbox" checked />
            <span class="checkbox-custom"></span>
            <span>Fecha de Pago</span>
          </label>
          <label class="checkbox-option">
            <input type="checkbox" checked />
            <span class="checkbox-custom"></span>
            <span>Monto</span>
          </label>
          <label class="checkbox-option">
            <input type="checkbox" checked />
            <span class="checkbox-custom"></span>
            <span>Estado</span>
          </label>
        </div>
      </div>

      <!-- Preview info -->
      <div class="export-preview">
        <span class="material-icons">info</span>
        <div class="preview-text">
          <strong>Vista previa:</strong> Se exportarán 125 registros con 6 columnas
        </div>
      </div>
    </div>
  </div>

  <div class="modal-footer">
    <button class="button-secondary">Cancelar</button>
    <button class="button-primary">
      <span class="material-icons">file_download</span>
      <span>Exportar</span>
    </button>
  </div>
</div>
```

### **Estilos del Modal:**

```css
/* Option Group */
.option-group {
  margin-bottom: 28px;
}

.option-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #cbd5e1;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

/* Radio Options */
.radio-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.radio-option {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.radio-option:hover {
  background: rgba(15, 23, 42, 0.6);
  border-color: rgba(14, 165, 233, 0.3);
}

.radio-option input[type="radio"] {
  display: none;
}

.radio-custom {
  width: 20px;
  height: 20px;
  border: 2px solid #64748b;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
  margin-top: 2px;
}

.radio-custom::after {
  content: '';
  width: 10px;
  height: 10px;
  background: #0ea5e9;
  border-radius: 50%;
  transform: scale(0);
  transition: transform 0.2s ease;
}

.radio-option input[type="radio"]:checked + .radio-custom {
  border-color: #0ea5e9;
}

.radio-option input[type="radio"]:checked + .radio-custom::after {
  transform: scale(1);
}

.radio-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.radio-title {
  font-size: 14px;
  font-weight: 600;
  color: #f8fafc;
}

.radio-description {
  font-size: 13px;
  color: #64748b;
}

/* Checkbox Options */
.checkbox-group {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.checkbox-option {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.checkbox-option input[type="checkbox"] {
  display: none;
}

.checkbox-custom {
  width: 20px;
  height: 20px;
  border: 2px solid #64748b;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.checkbox-custom::after {
  content: '✓';
  color: white;
  font-size: 14px;
  font-weight: 700;
  opacity: 0;
  transform: scale(0);
  transition: all 0.2s ease;
}

.checkbox-option input[type="checkbox"]:checked + .checkbox-custom {
  background: #0ea5e9;
  border-color: #0ea5e9;
}

.checkbox-option input[type="checkbox"]:checked + .checkbox-custom::after {
  opacity: 1;
  transform: scale(1);
}

.checkbox-option span:last-child {
  font-size: 14px;
  color: #f8fafc;
  font-weight: 500;
}

/* Export Preview */
.export-preview {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: rgba(14, 165, 233, 0.08);
  border: 1px solid rgba(14, 165, 233, 0.2);
  border-radius: 12px;
  margin-top: 24px;
}

.export-preview .material-icons {
  color: #0ea5e9;
  font-size: 22px;
  flex-shrink: 0;
}

.preview-text {
  font-size: 14px;
  color: #cbd5e1;
  line-height: 1.5;
}

.preview-text strong {
  color: #f8fafc;
  font-weight: 600;
}
```

---

## 🔄 Estados y Feedback

### **1. Loading State:**

```html
<button class="export-button loading" disabled>
  <div class="spinner"></div>
  <span class="button-text">Exportando...</span>
</button>
```

```css
.export-button.loading {
  pointer-events: none;
  opacity: 0.8;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

### **2. Success State (Toast Notification):**

```html
<div class="export-toast success">
  <div class="toast-icon">
    <span class="material-icons">check_circle</span>
  </div>
  <div class="toast-content">
    <div class="toast-title">¡Exportación exitosa!</div>
    <div class="toast-message">El archivo se descargó correctamente</div>
  </div>
  <button class="toast-close">
    <span class="material-icons">close</span>
  </button>
</div>
```

```css
.export-toast {
  position: fixed;
  bottom: 32px;
  right: 32px;
  min-width: 380px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  z-index: 9999;
  animation: slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideInRight {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  flex-shrink: 0;
}

.export-toast.success .toast-icon {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.export-toast.success .toast-icon .material-icons {
  font-size: 28px;
}

.toast-content {
  flex: 1;
}

.toast-title {
  font-size: 15px;
  font-weight: 700;
  color: #f8fafc;
  margin-bottom: 4px;
}

.toast-message {
  font-size: 13px;
  color: #94a3b8;
}

.toast-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(148, 163, 184, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 8px;
  color: #cbd5e1;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toast-close:hover {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;
}
```

### **3. Error State:**

```html
<div class="export-toast error">
  <div class="toast-icon">
    <span class="material-icons">error</span>
  </div>
  <div class="toast-content">
    <div class="toast-title">Error al exportar</div>
    <div class="toast-message">No se pudo generar el archivo. Intenta nuevamente.</div>
  </div>
  <button class="toast-close">
    <span class="material-icons">close</span>
  </button>
</div>
```

```css
.export-toast.error .toast-icon {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}
```

### **4. Progress State (para exports grandes):**

```html
<div class="export-progress-modal">
  <div class="progress-header">
    <span class="material-icons progress-icon">cloud_download</span>
    <h3 class="progress-title">Exportando datos...</h3>
  </div>
  <div class="progress-bar-container">
    <div class="progress-bar" style="width: 65%;"></div>
  </div>
  <div class="progress-info">
    <span class="progress-text">325 de 500 registros</span>
    <span class="progress-percentage">65%</span>
  </div>
</div>
```

```css
.export-progress-modal {
  padding: 32px;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(30px);
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 20px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
  min-width: 400px;
}

.progress-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.progress-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2));
  border-radius: 16px;
  color: #10b981;
  font-size: 28px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.progress-title {
  font-size: 18px;
  font-weight: 700;
  color: #f8fafc;
  margin: 0;
}

.progress-bar-container {
  width: 100%;
  height: 8px;
  background: rgba(148, 163, 184, 0.15);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #059669);
  border-radius: 4px;
  transition: width 0.3s ease;
  position: relative;
  overflow: hidden;
}

.progress-bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-text {
  font-size: 13px;
  color: #94a3b8;
  font-weight: 500;
}

.progress-percentage {
  font-size: 16px;
  font-weight: 700;
  color: #10b981;
}
```

---

## 📊 Formato Excel

### **Estructura del Archivo (ExcelJS):**

```javascript
import ExcelJS from 'exceljs';

// Brand colors
const BRAND_COLORS = {
  primary: '0EA5E9',      // Cyan
  secondary: '8B5CF6',    // Purple
  success: '10B981',      // Green
  danger: 'EF4444',       // Red
  warning: 'F59E0B',      // Amber
};

async function exportToExcel(data, fileName) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Compromisos');

  // Header principal (fila 1)
  worksheet.mergeCells('A1:F1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'DR GROUP - REPORTE DE COMPROMISOS';
  titleCell.font = { size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF' + BRAND_COLORS.primary }
  };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(1).height = 40;

  // Metadata (filas 2-4)
  worksheet.getCell('A2').value = `Fecha de generación: ${new Date().toLocaleDateString()}`;
  worksheet.getCell('A3').value = `Total de registros: ${data.length}`;
  worksheet.getCell('A4').value = `Generado por: ${currentUser.name}`;
  
  // Estilo metadata
  ['A2', 'A3', 'A4'].forEach(cell => {
    worksheet.getCell(cell).font = { size: 11, color: { argb: 'FF64748B' } };
  });

  // Espacio
  worksheet.addRow([]);

  // Headers de columnas (fila 6)
  const headerRow = worksheet.addRow([
    'Empresa',
    'Concepto',
    'Beneficiario',
    'Fecha de Pago',
    'Monto',
    'Estado'
  ]);
  
  headerRow.eachCell((cell) => {
    cell.font = { size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF' + BRAND_COLORS.secondary }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
    };
  });
  worksheet.getRow(6).height = 30;

  // Datos
  data.forEach((item, index) => {
    const row = worksheet.addRow([
      item.empresa,
      item.concepto,
      item.beneficiario,
      new Date(item.fecha).toLocaleDateString(),
      item.monto,
      item.estado.toUpperCase()
    ]);

    // Alternar colores de fila
    if (index % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' }
        };
      });
    }

    // Formato de monto (columna E)
    row.getCell(5).numFmt = '"$"#,##0.00';
    row.getCell(5).alignment = { horizontal: 'right' };

    // Formato de estado (columna F)
    const estadoCell = row.getCell(6);
    estadoCell.alignment = { horizontal: 'center' };
    estadoCell.font = { bold: true };
    
    switch (item.estado.toLowerCase()) {
      case 'pagado':
        estadoCell.font.color = { argb: 'FF' + BRAND_COLORS.success };
        estadoCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD1FAE5' }
        };
        break;
      case 'pendiente':
        estadoCell.font.color = { argb: 'FF' + BRAND_COLORS.warning };
        estadoCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFEF3C7' }
        };
        break;
      case 'vencido':
        estadoCell.font.color = { argb: 'FF' + BRAND_COLORS.danger };
        estadoCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFECACA' }
        };
        break;
    }

    // Bordes
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
    });
  });

  // Ancho de columnas
  worksheet.getColumn(1).width = 20; // Empresa
  worksheet.getColumn(2).width = 25; // Concepto
  worksheet.getColumn(3).width = 25; // Beneficiario
  worksheet.getColumn(4).width = 15; // Fecha
  worksheet.getColumn(5).width = 15; // Monto
  worksheet.getColumn(6).width = 12; // Estado

  // Freeze panes (fijar header)
  worksheet.views = [
    { state: 'frozen', xSplit: 0, ySplit: 6 }
  ];

  // Auto-filter
  worksheet.autoFilter = {
    from: 'A6',
    to: 'F6'
  };

  // Generar archivo
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
}
```

---

## 🧩 Implementación Completa

### **ExportButton Component:**

```jsx
import React, { useState } from 'react';
import { Button, CircularProgress, alpha } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ExportConfigModal from './ExportConfigModal';
import { exportToExcel } from '../utils/excelExport';
import { showToast } from '../utils/toast';

const ExportButton = ({ data, fileName = 'export', columns, compact = false }) => {
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const handleExport = async (config) => {
    setLoading(true);
    try {
      await exportToExcel(data, fileName, config);
      showToast('success', '¡Exportación exitosa!', 'El archivo se descargó correctamente');
    } catch (error) {
      console.error('Error exporting:', error);
      showToast('error', 'Error al exportar', 'No se pudo generar el archivo');
    } finally {
      setLoading(false);
      setModalOpen(false);
    }
  };

  const handleQuickExport = async () => {
    // Export directo sin configuración
    await handleExport({
      format: 'xlsx',
      range: 'visible',
      columns: columns || 'all'
    });
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <FileDownloadIcon />}
        disabled={loading}
        onClick={data.length > 100 ? () => setModalOpen(true) : handleQuickExport}
        sx={{
          px: compact ? 1.5 : 3,
          py: 1.5,
          background: 'linear-gradient(135deg, #10b981, #059669)',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            background: 'linear-gradient(135deg, #10b981, #059669)',
            transform: 'translateY(-2px)',
            boxShadow: '0 12px 30px rgba(16, 185, 129, 0.5)',
          },
          '&:active': {
            transform: 'scale(0.98)',
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
            transition: 'left 0.5s ease',
          },
          '&:hover::before': {
            left: '100%',
          },
        }}
      >
        {!compact && (loading ? 'Exportando...' : 'Exportar a Excel')}
      </Button>

      <ExportConfigModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onExport={handleExport}
        dataCount={data.length}
        columns={columns}
      />
    </>
  );
};

export default ExportButton;
```

---

## ♿ Accesibilidad

- **ARIA labels** en botones
- **Keyboard shortcuts** (Ctrl+S para exportar rápido)
- **Loading indicators** claros
- **Error messages** descriptivos

---

## ✅ Checklist

- [ ] Crear componente ExportButton
- [ ] Implementar modal de configuración
- [ ] Integrar ExcelJS con formato profesional
- [ ] Implementar estados de loading/success/error
- [ ] Toast notifications para feedback
- [ ] Progress modal para exports grandes
- [ ] Testing con datasets grandes
- [ ] Documentar ejemplos de uso

---

**Versión:** 1.0.0  
**Librería:** ExcelJS 4.4.0  
**Referencia:** Ultra Modern Design System
