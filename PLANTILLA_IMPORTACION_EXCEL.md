# 📊 Plantilla Excel para Importación de Compromisos

## 🎯 **FORMATO REQUERIDO**

### **Estructura de Columnas (A-K):**

| A | B | C | D | E | F | G | H | I | J | K |
|---|---|---|---|---|---|---|---|---|---|---|
| **Empresa** | **Mes** | **Año** | **Fecha Vencimiento** | **Periodicidad** | **Beneficiario** | **Concepto** | **Valor** | **Método Pago** | **Pago Aplazado** | **Observaciones** |

### **Ejemplo de Datos:**

```
DR Group S.A.S    | 8  | 2025 | 15/08/2025 | Mensual     | ENEL Colombia    | Pago Energía Eléctrica | 450000 | Transferencia | No | Factura mensual
Constructora DR   | 8  | 2025 | 20/08/2025 | Trimestral  | ACME Servicios   | Mantenimiento Edificio | 890000 | Efectivo      | Si | Pago aplazado 30 días
Inversiones DR    | 8  | 2025 | 25/08/2025 | Único       | Juan Pérez       | Consultoría Legal      | 1200000| Cheque        | No | Asesoría jurídica
DR Group S.A.S    | 9  | 2025 | 05/09/2025 | Mensual     | Telefónica       | Plan Corporativo       | 320000 | Transferencia | No | Internet + telefonía
```

## 📋 **VALIDACIONES APLICADAS**

### **Campos Obligatorios:**
- ✅ **Empresa**: Debe existir en el sistema
- ✅ **Concepto**: Mínimo 3 caracteres
- ✅ **Valor**: Número mayor a 0
- ✅ **Año**: Entre 2020 y 2030
- ✅ **Mes**: Entre 1 y 12

### **Valores Válidos:**

#### **Periodicidad:**
- `Único` / `Unico` / `Pago único`
- `Mensual`
- `Bimestral`
- `Trimestral`
- `Cuatrimestral`
- `Semestral`
- `Anual`

#### **Método de Pago:**
- `Transferencia` / `Transfer`
- `Efectivo` / `Cash`
- `Cheque`
- `Tarjeta`
- `Débito` / `Debito`
- `Crédito` / `Credito`

#### **Pago Aplazado:**
- `Si` / `Sí` / `true` / `1` = true
- `No` / `false` / `0` = false

### **Formatos de Fecha:**
- ✅ `DD/MM/YYYY` (15/08/2025)
- ✅ `YYYY-MM-DD` (2025-08-15)
- ✅ Número Excel (fecha serial)

## 🚀 **PROCESO DE IMPORTACIÓN**

### **Paso 1: Preparar Excel**
1. Crear archivo .xlsx con las columnas en orden A-K
2. Llenar datos siguiendo el formato
3. Verificar que las empresas existan en el sistema

### **Paso 2: Importar**
1. Ir a `/commitments`
2. Hacer clic en "Importar Excel"
3. Arrastrar archivo o seleccionar
4. Revisar preview de datos
5. Confirmar importación

### **Paso 3: Validación**
- ✅ Errores mostrados en rojo
- ⚠️ Advertencias en amarillo
- ✅ Registros válidos en verde

## 📁 **EJEMPLO PRÁCTICO**

Para crear un archivo de prueba, copiar esta tabla en Excel:

| Empresa | Mes | Año | Fecha Vencimiento | Periodicidad | Beneficiario | Concepto | Valor | Método Pago | Pago Aplazado | Observaciones |
|---------|-----|-----|-------------------|--------------|--------------|----------|-------|-------------|---------------|---------------|
| DR Group S.A.S | 8 | 2025 | 15/08/2025 | Mensual | ENEL Colombia | Pago Energía | 450000 | Transferencia | No | Factura agosto |
| DR Group S.A.S | 8 | 2025 | 20/08/2025 | Trimestral | Telefónica | Internet | 320000 | Transferencia | No | Plan corporativo |

## ⚠️ **NOTAS IMPORTANTES**

1. **Primera fila**: Debe contener los headers (se omite en importación)
2. **Empresas**: Deben existir previamente en el sistema
3. **Montos**: Solo números, sin separadores de miles
4. **Fechas**: Usar formato consistente
5. **Backup**: Recomendado antes de importación masiva

---

**🎉 ¡Sistema listo para importación masiva de compromisos!**
