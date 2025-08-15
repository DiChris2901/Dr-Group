# 📂 Design System 3.0 - Documentación Organizada

## 📋 **ARCHIVOS EN ESTA CARPETA:**

### 🎯 **DOCUMENTOS PRINCIPALES:**
- **`REGLAS_TOKENS_DS_3.0_ESTRICTAS.md`** - Reglas específicas para tokens y validación
- **`MEJORAS_TOKENS_DS_3.0.md`** - Análisis detallado de mejoras implementadas  
- **`CORRECCION_ERRORES_CRITICOS_DS_3.0.md`** - Guía para corregir errores del validador
- **`REGLAS_DESIGN_SYSTEM_3.0_OBLIGATORIAS.md`** - Reglas específicas del DS 3.0

### 📝 **DOCUMENTOS DE SESIÓN:**
- **`DESIGN_SYSTEM_3.0_NOTAS_SESION.md`** - Notas y progreso de implementación

---

## 🎨 **PARA USO DIARIO:**
**Consultar la guía principal en la raíz del proyecto:**
```
../DS_3.0_GUIA_MAESTRA_UNIFICADA.md
```

Esta guía maestra contiene toda la información práctica unificada de todos estos documentos.

---

## 🛡️ **VALIDACIÓN:**
```bash
# Ejecutar desde la raíz del proyecto
npm run validate-tokens
```

---

**Organización:** Documentos de referencia y análisis técnico del Design System 3.0

---

## 🧩 Guía rápida — Tiles suaves y Botones pill

### Botones pill (DS 3.0)
- Filled: `<Button variant="pillGradient" color="primary|secondary" />`
- Outline borde degradado: `<Button variant="pillOutlineGradient" color="primary|secondary" />`
- Neutro: `<Button variant="softNeutral" />`

Recomendaciones:
- Usar en footers de diálogos: Cerrar (softNeutral), Compartir (pillOutlineGradient), Acción primaria (pillGradient).

### Tiles suaves (Paper/Card)
- Glass panel: `<Paper variant="glass" />` o `<Card variant="glass" />`
- Tile suave: `<Paper variant="tile" />` o `<Card variant="tile" />`

Cuándo usar:
- Glass: encabezados de modales/overlays o áreas con blur.
- Tile: bloques informativos secundarios (beneficiario, método de pago, etc.).

---

## ✂️ Snippets de theme listos para pegar

Los `variants` fueron integrados en `src/theme/premiumTheme.js`. Si necesitas replicarlos en otro tema, copia los bloques `components.MuiButton.variants`, `components.MuiPaper.variants` y `components.MuiCard.variants` desde ese archivo.
