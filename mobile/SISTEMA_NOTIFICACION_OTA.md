# 🔄 Sistema de Notificación de Actualizaciones OTA

## 📋 Descripción

Sistema de banner persistente que notifica a los usuarios cuando hay una actualización OTA (Over-The-Air) disponible. Implementado siguiendo el diseño sobrio empresarial de la APK móvil.

---

## 🎨 Diseño

### **Características Visuales:**
- ✅ **BorderRadius:** 16px (sobrio empresarial)
- ✅ **Sombras:** shadowOpacity 0.06 (sutiles)
- ✅ **Colores dinámicos:** Usa getPrimaryColor() del ThemeContext
- ✅ **Animación:** Spring suave de entrada desde arriba
- ✅ **Safe Area:** Respeta notch y status bar con insets

### **Estados:**
1. **Actualización disponible:** Muestra botón "Actualizar" + botón cerrar
2. **Descargando:** Muestra spinner + texto "Descargando actualización..."
3. **Oculto:** No se renderiza si no hay actualización o fue descartado

---

## 🛠️ Implementación Técnica

### **Archivos Modificados:**

#### 1. `mobile/src/components/UpdateBanner.js` ✅ **NUEVO**
Componente principal del banner.

**Funcionalidades:**
- Verifica actualizaciones OTA con `Updates.checkForUpdateAsync()`
- Descarga actualización con `Updates.fetchUpdateAsync()`
- Reinicia app con `Updates.reloadAsync()`
- Animación de entrada/salida con Animated API
- Respeta áreas seguras con `useSafeAreaInsets()`

**Props:** Ninguna (usa context para colores)

**Estados internos:**
- `updateAvailable`: Indica si hay actualización disponible
- `isDownloading`: Indica si está descargando
- `isDismissed`: Usuario descartó el banner
- `slideAnim`: Control de animación

---

#### 2. `mobile/App.js` ✅ **MODIFICADO**
Integración del banner en el layout principal.

**Cambios:**
```javascript
import UpdateBanner from './src/components/UpdateBanner';

// En el return de AppContent():
<PaperProvider theme={theme}>
  <NotificationsProvider>
    <StatusBar ... />
    <UpdateBanner />  {/* ← Nuevo */}
    <AppNavigator ref={navigationRef} />
  </NotificationsProvider>
</PaperProvider>
```

**Posicionamiento:**
- `position: absolute` con `zIndex: 1000`
- Se renderiza sobre el navigator
- Top con margin de safe area

---

#### 3. `mobile/src/components/index.js` ✅ **MODIFICADO**
Exportación centralizada del componente.

```javascript
export { default as UpdateBanner } from './UpdateBanner';
```

---

## 🔄 Flujo de Usuario

```
1. App inicia → UpdateBanner verifica actualizaciones (Updates.checkForUpdateAsync)
   ↓
2. ¿Hay actualización?
   ├─ NO → No renderiza banner
   └─ SÍ → Anima entrada del banner desde arriba
       ↓
3. Usuario ve banner con opciones:
   ├─ Presiona "Actualizar" → Descarga OTA → Reinicia app automáticamente
   └─ Presiona "X" (cerrar) → Banner se oculta con animación
```

---

## 🚨 Comportamiento en Desarrollo vs Producción

### **Modo Desarrollo (`__DEV__ = true`):**
- ❌ **NO verifica** actualizaciones (evita consultas innecesarias)
- ❌ **NO renderiza** el banner
- ✅ **Muestra logs** en consola

### **Modo Producción (`__DEV__ = false`):**
- ✅ **Verifica** actualizaciones al iniciar
- ✅ **Renderiza** banner si hay actualización disponible
- ✅ **Descarga** y aplica actualizaciones OTA

---

## 🎯 Casos de Uso

### **Caso 1: Actualización OTA Publicada**
```bash
# En tu PC:
Set-Location mobile; eas update --branch production --platform android

# En el celular del usuario:
1. Usuario abre la app
2. App consulta Expo Cloud
3. Detecta nueva actualización OTA
4. Muestra banner: "Actualización disponible"
5. Usuario toca "Actualizar"
6. Descarga cambios (solo JS/assets modificados)
7. App se reinicia automáticamente
8. ¡Usuario ya tiene la última versión!
```

**Tiempo:** ~5-15 segundos (dependiendo del tamaño de los cambios)

---

### **Caso 2: Usuario Descarta el Banner**
```
1. Banner aparece con actualización disponible
2. Usuario presiona "X" (cerrar)
3. Banner se oculta con animación
4. No vuelve a aparecer en esta sesión
5. En próximo inicio de app, volverá a verificar
```

---

### **Caso 3: No Hay Actualizaciones**
```
1. App inicia
2. Verifica actualizaciones
3. No encuentra ninguna
4. Banner NO se renderiza
5. Usuario usa la app normalmente
```

---

## 📊 Métricas y Monitoreo

### **Logs en Consola:**

**Actualización disponible:**
```
🔄 Actualización OTA disponible
⬇️ Descargando actualización OTA...
✅ Actualización descargada, reiniciando app...
```

**Sin actualización:**
```
✅ App actualizada (OTA)
```

**Error:**
```
❌ Error verificando actualizaciones OTA: [detalles]
❌ Error descargando actualización: [detalles]
```

---

## 🔧 Mantenimiento

### **Modificar Estilos:**
Editar `mobile/src/components/UpdateBanner.js` líneas 170-240 (StyleSheet)

**Colores:**
- Primario: `getPrimaryColor()` (dinámico desde ThemeContext)
- Fondo banner: `primaryColor + '10'` (6% opacidad)
- Ícono background: `primaryColor + '15'` (9% opacidad)
- Texto oscuro: `#1a1a1a`
- Texto gris: `#666`

**Espaciado:**
- Padding banner: `16px vertical, 20px horizontal`
- Margin horizontal: `16px`
- BorderRadius: `16px` (NO CAMBIAR, es estándar sobrio)

---

### **Modificar Comportamiento:**

**Cambiar tiempo de reintentos:**
```javascript
// Línea ~87 en UpdateBanner.js
setTimeout(checkForUpdates, 30000); // 30 segundos
```

**Deshabilitar banner temporalmente:**
```javascript
// En App.js, comentar:
{/* <UpdateBanner /> */}
```

---

## 🚀 Deployment

### **Publicar Actualización OTA:**
```powershell
Set-Location mobile
eas update --branch production --platform android --message "Descripción del cambio"
```

### **Verificar Actualización en Expo Dashboard:**
1. Ir a: https://expo.dev/accounts/daruedagu/projects/dr-group-mobile/updates
2. Ver branch: `production`
3. Confirmar que el update se publicó

### **Testing:**
1. **En desarrollo:** Banner NO aparece (comportamiento esperado)
2. **En producción:** 
   - Instala APK compilado en celular
   - Publica OTA update
   - Cierra y abre la app
   - Verifica que el banner aparezca

---

## ⚠️ Limitaciones

1. **Solo funciona en producción:** Banner no se renderiza en `__DEV__`
2. **Requiere internet:** Necesita conexión para verificar actualizaciones
3. **Solo OTA:** No detecta nuevas versiones APK (para eso está `checkForNewAPK()` en UpdateService)
4. **Sin progreso detallado:** No muestra porcentaje de descarga (solo spinner)

---

## 🔮 Mejoras Futuras (Opcionales)

1. **Barra de progreso:** Mostrar % de descarga en tiempo real
2. **Changelog:** Mostrar lista de cambios en el banner
3. **Programar descarga:** Opción "Actualizar esta noche"
4. **Notificación push:** Avisar cuando hay actualización (sin abrir la app)
5. **Rollback automático:** Detectar errores y volver a versión anterior

---

## 📚 Referencias

- **Expo Updates API:** https://docs.expo.dev/versions/latest/sdk/updates/
- **React Native Animated:** https://reactnative.dev/docs/animated
- **Safe Area Insets:** https://github.com/th3rdwave/react-native-safe-area-context
- **Diseño Sobrio APK:** `mobile/DESIGN_SPECS.md`
- **Sistema de Actualizaciones:** `mobile/SISTEMA_ACTUALIZACION_APK.md`

---

## ✅ Checklist de Implementación Completada

- [x] Componente UpdateBanner.js creado
- [x] Integrado en App.js
- [x] Exportado en components/index.js
- [x] Safe area insets implementado
- [x] Animaciones suaves agregadas
- [x] Colores dinámicos del tema
- [x] Diseño sobrio aplicado (borderRadius 16px, sombras 0.06)
- [x] Logs de debugging
- [x] Manejo de errores con reintentos
- [x] Comportamiento diferenciado dev/prod
- [x] Sin errores de sintaxis validado

---

**Fecha de implementación:** 20 de enero de 2026  
**Versión:** 1.0.0  
**Autor:** Arquitecto Senior - DR Group Dashboard
