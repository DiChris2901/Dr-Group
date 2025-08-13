# 🛠️ GUÍA DE SOLUCIÓN DE PROBLEMAS - OPTIMIZACIONES FIREBASE

## 🚨 Errores Comunes y Soluciones

### 1. **Error: "Failed to load module script: Expected JavaScript-or-Wasm module"**

**Causa**: El navegador intenta cargar archivos JSON como módulos JavaScript o hay problemas con el Service Worker.

**Soluciones**:
```bash
# 1. Limpiar cache del navegador (Ctrl+Shift+Del)
# 2. Verificar que no hay archivos problemáticos en public/
# 3. Deshabilitar Service Worker temporalmente:
```

Crear archivo `.env.local`:
```bash
VITE_ENABLE_SW=false
VITE_ENABLE_PERFORMANCE_LOG=false
```

### 2. **Error: "Duplicate key 'border' in object literal"**

**Solución**: Ya corregido en CommitmentsList.jsx línea 245.

### 3. **Error: Import modules not found**

**Verificar que estos archivos existen**:
```
src/hooks/useDebounce.js
src/hooks/useServiceWorker.js
src/hooks/useLazyData.js
src/utils/FirestoreCache.js
src/utils/PerformanceLogger.js
src/utils/FirestoreQueryOptimizer.js
src/components/common/VirtualScrollList.jsx
```

## 🔧 MODO DESARROLLO SEGURO

### Configuración Mínima (.env.local)
```bash
# Configuración Firebase (requerido)
VITE_FIREBASE_API_KEY=tu-api-key
VITE_FIREBASE_AUTH_DOMAIN=tu-dominio.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-project-id
VITE_FIREBASE_STORAGE_BUCKET=tu-bucket.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=tu-app-id

# Optimizaciones (opcional - usar false si hay problemas)
VITE_ENABLE_SW=false
VITE_ENABLE_VIRTUAL_SCROLL=false
VITE_ENABLE_PREFETCH=false
VITE_ENABLE_PERFORMANCE_LOG=true
```

### Comandos de Verificación
```bash
# 1. Limpiar completamente
npm run clean
rm -rf node_modules/.cache
rm -rf dist

# 2. Reinstalar dependencias
npm install

# 3. Iniciar en modo desarrollo
npm run dev

# 4. Verificar en navegador
# - Abrir http://localhost:5175
# - Abrir DevTools (F12)
# - Ver Console para logs de optimización
```

## ✅ Verificación de Funcionamiento

### Console Logs Esperados (Desarrollo)
```
🚀 Firestore Cache initialized
📊 Performance Logger started
⏱️ Debounce Event: search - Total saved: 1
✅ useDebounce imported successfully
✅ FirestoreCache imported successfully
🚧 Service Worker deshabilitado en desarrollo (si está en false)
```

### Network Tab - Qué Buscar
- ✅ Menos requests a firestore.googleapis.com
- ✅ Cache hits en requests repetitivos
- ✅ Delays en filtering (debounce funcionando)

## 🎯 TROUBLESHOOTING ESPECÍFICO

### Error de Firebase MIME type
1. **Verificar archivo firebase.js**:
   ```javascript
   // Debe tener imports correctos
   import { initializeApp } from 'firebase/app';
   import { getAuth } from 'firebase/auth';
   // NO debe importar archivos .json
   ```

2. **Verificar .env.local**:
   ```bash
   # Variables deben empezar con VITE_
   VITE_FIREBASE_API_KEY=...
   ```

3. **Verificar configuración de Vite**:
   ```javascript
   // vite.config.js no debe tener configuraciones problemáticas
   ```

### Service Worker Issues
1. **Deshabilitar temporalmente**:
   ```bash
   VITE_ENABLE_SW=false
   ```

2. **Verificar archivo existe**:
   ```bash
   ls public/firebase-cache-sw.js
   ```

3. **Limpiar SW cache**:
   ```javascript
   // En DevTools > Application > Service Workers > Unregister
   ```

## 🔥 MODO PRODUCCIÓN

### Build Exitoso
```bash
npm run build
npm run preview
```

### Verificación Post-Deploy
1. **Firebase Console**: Verificar uso reducido
2. **Network Tab**: Confirmar menos requests
3. **Performance**: Medir mejoras en velocidad

---

## 📞 SI CONTINÚAN LOS PROBLEMAS

### Modo Fallback (Sin Optimizaciones)
1. Renombrar archivos problemáticos:
   ```bash
   mv src/hooks/useServiceWorker.js src/hooks/useServiceWorker.js.bak
   mv src/utils/FirestoreQueryOptimizer.js src/utils/FirestoreQueryOptimizer.js.bak
   ```

2. Comentar imports en CommitmentsList.jsx:
   ```javascript
   // import useServiceWorker from '../../hooks/useServiceWorker';
   // import { queryOptimizer } from '../../utils/FirestoreQueryOptimizer';
   ```

3. Solo usar FASE 1 (Debounce + Cache básico):
   ```javascript
   // Mantener activos:
   // - useDebounce
   // - FirestoreCache  
   // - PerformanceLogger
   ```

Esto garantizará al menos 70% de reducción de costos con las optimizaciones básicas.
