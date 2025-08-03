# REGLAS DE DESARROLLO OBLIGATORIAS - DR GROUP DASHBOARD

## ⚠️ AVISO DE CUMPLIMIENTO PERMANENTE
**ESTAS REGLAS SON DE CUMPLIMIENTO OBLIGATORIO:**
- Durante TODA la sesión de desarrollo
- Desde el PRIMER commit hasta el ÚLTIMO
- En CADA modificación de archivos
- Sin EXCEPCIÓN ni EXCUSA alguna
- En TODOS los componentes y features
- Por TODOS los desarrolladores

## 🚫 NO SE PERMITEN:
- Saltos de pasos
- Atajos en el proceso
- Excepciones temporales
- Modificaciones sin verificación
- Commits sin validación completa

## 🚨 PROTOCOLO OBLIGATORIO - CUMPLIMIENTO AL PIE DE LA LETRA

## 🔒 0. PREPARACIÓN Y RESPALDO (OBLIGATORIO)
- [ ] **CREAR BACKUP**: Backup completo del archivo/directorio
- [ ] **GIT STATUS**: Verificar repositorio limpio
- [ ] **LISTAR ARCHIVOS**: Archivos específicos a modificar con rutas exactas
- [ ] **BACKUP LOCAL**: Crear .backup del archivo original
- [ ] **VERIFICAR TERMINAL**: Que el servidor dev esté corriendo

## 🔍 1. ANÁLISIS PREVIO (CRÍTICO)
- [ ] **IDENTIFICAR ARCHIVOS**: Con rutas exactas completas
- [ ] **MAPEAR DEPENDENCIAS**: Entre componentes padre/hijo
- [ ] **VERIFICAR IMPORTS**: grep -r "import.*ComponentName" 
- [ ] **CONFIRMAR EXPORTS**: En archivos que se van a modificar
- [ ] **LEER ARCHIVO COMPLETO**: Antes de cualquier cambio

## 📁 2. VERIFICACIÓN DE RUTAS Y DEPENDENCIAS
- [ ] **GREP SEARCH**: Para encontrar todos los usos del componente
- [ ] **RUTAS RELATIVAS**: Verificar ../../ correctas
- [ ] **IMPORTS EXISTENTES**: Verificar que no se rompan
- [ ] **COMPONENTES CONSUMIDORES**: Listar todos los que usan el archivo

## 💾 3. DOCUMENTACIÓN DE CAMBIOS
- [ ] **LISTA EXACTA**: src/path/file.jsx de archivos a modificar
- [ ] **DETALLAR CAMBIOS**: Línea por línea si es complejo
- [ ] **PLAN ROLLBACK**: "cp .backup → original" listo
- [ ] **EFECTOS ESPERADOS**: Funcionalidades nuevas documentadas

## 🛠️ 4. IMPLEMENTACIÓN CONTROLADA
- [ ] **DESIGN SYSTEM SPECTACULAR**: Todo debe seguir DESIGN_SYSTEM.md estrictamente
- [ ] **UN ARCHIVO POR VEZ**: Modificar solo uno a la vez
- [ ] **GUARDAR TRAS CAMBIO**: Cada modificación guardada
- [ ] **SINTAXIS LIMPIA**: Sin errores rojos en editor
- [ ] **FORMATO COP**: Mantener Peso Colombiano siempre
- [ ] **FIREBASE INTACTO**: No romper conexiones existentes

## 🔄 5. VALIDACIÓN CONTINUA (CRÍTICO)
- [ ] **SERVIDOR DESARROLLO**: Verificar que esté corriendo (usuario lo maneja)
- [ ] **LOCALHOST:3000**: Abrir navegador en http://localhost:3000
- [ ] **AUTO-REFRESH**: Confirmar que los cambios se reflejen automáticamente
- [ ] **CONSOLE DEVTOOLS**: Verificar sin errores rojos

## 🔧 6. VERIFICACIÓN FUNCIONAL
- [ ] **NAVEGAR SECCIONES**: Áreas afectadas por cambios
- [ ] **PROBAR INTERACCIONES**: Clicks, formularios, popups
- [ ] **VERIFICAR ESTILOS**: Gradientes spectacular y micro-interacciones
- [ ] **TESTEAR RESPONSIVE**: Si aplica mobile/desktop
- [ ] **DATOS FIREBASE**: Que se muestren correctamente

## 📦 7. COMMIT ESTRATÉGICO
- [ ] **GIT ADD STATUS**: Revisar staged files
- [ ] **COMMITS CORTOS**: Máximo 50 caracteres
- [ ] **DESCRIPTIVOS**: "✨ Add: TimeProgress component"
- [ ] **NO MASIVOS**: No commits con 20+ archivos
- [ ] **POWERSHELL COMPATIBLE**: Comandos que funcionen en Windows
- [ ] **VERIFICAR CONECTIVIDAD**: git remote -v antes de push
- [ ] **CREAR TAG**: git tag -a v1.0.x -m "Descripción del tag"
- [ ] **PUSH COMPLETO**: git push -u origin main --tags
- [ ] **VERIFICAR EN GITHUB**: Confirmar que aparezca en la web

## ✅ 8. CONFIRMACIÓN INTEGRAL
- [ ] **APP CARGA**: Sin spinner infinito
- [ ] **NAVEGACIÓN**: Funciona correctamente
- [ ] **DATOS VISIBLES**: Se cargan y muestran bien
- [ ] **CONSOLE LIMPIA**: Sin errores navegador/terminal
- [ ] **MONEDA COP**: Verificar formato correcto

---

## 🛑 PROTOCOLO DE VERIFICACIÓN Y RECUPERACIÓN DE ERRORES INFALIBLE

Este protocolo debe aplicarse **siempre**, antes, durante y después de cualquier modificación en el código.  
Su objetivo es **detectar, corregir y revertir cualquier error** para garantizar la integridad y funcionamiento del proyecto.  
Si se sigue paso a paso, es capaz de rescatar el proyecto incluso si todo falla.

### 1. VERIFICACIÓN INMEDIATA PREVIA

1. **Verificar errores de compilación en el archivo objetivo:**
    ```bash
    get_errors([archivo_a_modificar])
    ```
    - Si hay errores → **STOP** → Corrige → Repite verificación.

2. **Leer el final del archivo para verificar que esté completo:**
    ```bash
    read_file(archivo, startLine: -20, endLine: -1)
    grep_search("export default", archivo)
    ```
    - Confirmar que el archivo exporta correctamente y tiene todos los componentes principales.

3. **Verificar dependencias e imports:**
    ```bash
    grep_search("import.*from", archivo)
    semantic_search("useAuth|useFirestore|useDashboardStats")
    ```
    - Confirmar que todos los imports y hooks necesarios están presentes.

### 2. RESPALDO Y PREPARACIÓN

1. **Crear backup del archivo antes de modificar:**
    ```bash
    cp archivo.jsx archivo.jsx.backup
    ```
2. **Verificar estado del repositorio:**
    ```bash
    git status
    ```
3. **Listar archivos a modificar y documentar cambios previstos.**

### 3. MODIFICACIÓN CONTROLADA

1. **Modificar solo un archivo a la vez.**
2. **Guardar cambios y verificar sintaxis en el editor (sin errores rojos).**
3. **Revisar navegador en http://localhost:3000 y consola DevTools antes de continuar.**

### 4. VERIFICACIÓN POST-CAMBIO

1. **Inmediatamente después de cada cambio ejecutar:**
    ```bash
    get_errors([archivo_modificado])
    ```
2. **Si hay errores → STOP → Leer contexto → Corregir → Volver a verificar.**
3. **Asegurarse de que auto-refresh y funcionalidad estén activas.**
4. **Verificar que la consola esté limpia y los datos de Firebase se muestren correctamente.**

### 5. PROTOCOLO DE RECUPERACIÓN EN CASO DE ERROR GRAVE

**Si el proyecto deja de funcionar, sigue estos pasos para recuperarlo:**

1. **STOP TOTAL:**  
   No avances ni realices nuevos cambios hasta resolver el error.
2. **Identifica el tipo de error:**  
   - ¿Sintaxis?  
   - ¿Importación rota?  
   - ¿Lógica?  
   - ¿Archivo incompleto?  
   - ¿Conexión Firebase rota?
3. **Restaurar desde backup:**  
    ```bash
    cp archivo.jsx.backup archivo.jsx
    ```
   - Si el error persiste, usa:
    ```bash
    git restore archivo.jsx
    ```
4. **Revisar en el navegador y ejecutar nuevamente `get_errors()`.**
5. **Documenta el error y la solución aplicada.**
6. **Si el error sigue, consulta a un experto o agente IA con detalles específicos.**
7. **Nunca ignores un error; cada error debe quedar registrado y resuelto.**

### 6. VERIFICACIÓN FINAL Y LIMPIEZA

1. **Ejecutar `npm run dev` solo cuando todo esté correcto y sin errores.**
2. **Probar la funcionalidad afectada, navegación, responsive y datos reales.**
3. **Eliminar backups innecesarios para mantener el proyecto limpio.**
    ```bash
    rm archivo.jsx.backup
    ```

### CHECKLIST OBLIGATORIO ANTES Y DESPUÉS DE CADA MODIFICACIÓN

- [ ] ¿Ejecuté `get_errors()` antes y después?
- [ ] ¿Leí y verifiqué el archivo completo?
- [ ] ¿Verifiqué todos los imports y hooks?
- [ ] ¿Creé backup antes de modificar?
- [ ] ¿Guardé los cambios y verifiqué sintaxis?
- [ ] ¿Consola y navegador sin errores?
- [ ] ¿Documenté los cambios y errores?
- [ ] ¿Probé la funcionalidad y responsive?
- [ ] ¿Eliminé backups después de confirmar que todo funciona?
- [ ] ¿Commit y push realizados correctamente?

### RESULTADO ESPERADO

- **Cero errores** de compilación, navegación y consola.
- **Hot Module Replacement** funcionando.
- **Datos reales de Firebase** operativos.
- **Proyecto limpio y funcional** tras cada cambio.
- **Documentación clara** de cada corrección y recuperación.

---

## ⚠️ ERRORES CRÍTICOS QUE NO SE DEBEN REPETIR

1. **Eliminar imports** sin verificar todos sus usos
2. **Cambiar formato de moneda** de COP a cualquier otra
3. **Romper conexión Firebase** al modificar componentes
4. **Asumir estructura** sin leer archivo completo
5. **Commits largos** que no funcionan en PowerShell
6. **Modificar múltiples archivos** sin verificar uno por uno
7. **No verificar navegador** después de cada cambio
8. **No crear backup** antes de modificaciones importantes
9. **Violar reglas Design System** usando efectos no permitidos
10. **Usar colores hardcodeados** en lugar de theme.palette
11. **Implementar animaciones excesivas** que no sigan los patrones spectacular
12. **No crear tags** después de commits importantes
13. **No hacer push** dejando commits solo en local

## 📋 CHECKLIST OBLIGATORIO ANTES DE CUALQUIER ACCIÓN

- [ ] ¿Creé backup del archivo?
- [ ] ¿Leí el archivo completo?
- [ ] ¿Verifiqué todas las dependencias?
- [ ] ¿Mantendré el formato COP?
- [ ] ¿Preservaré la conexión Firebase?
- [ ] ¿Es un cambio mínimo y controlado?
- [ ] ¿Tengo plan de rollback listo?

## 🎯 FRASES OBLIGATORIAS QUE USARÉ

**ANTES DE CUALQUIER CAMBIO:**
- "Primero voy a crear backup y leer el archivo completo"
- "Verificando dependencias con grep_search"
- "Confirmando que mantendré formato COP y Firebase"

**DURANTE LOS CAMBIOS:**
- "Modificando solo un archivo, guardando y verificando"
- "Abriendo http://localhost:3000 para verificar auto-refresh"
- "Verificando navegador sin errores antes de continuar"

**DESPUÉS DE CAMBIOS:**
- "Probando funcionalidad afectada completamente"
- "Verificando consola limpia y datos correctos"
- "Creando commit corto y descriptivo"
- "Creando tag con versión v1.0.x"
- "Haciendo push completo con tags a GitHub"

## 🚨 COMPROMISO INQUEBRANTABLE

**JURO SOLEMNEMENTE QUE:**

1. ✋ **PARARÉ INMEDIATAMENTE** si hay cualquier error
2. 📖 **LEERÉ COMPLETO** cada archivo antes de modificarlo
3. 💾 **CREARÉ BACKUP** antes de cambios importantes
4. 🔍 **VERIFICARÉ DEPENDENCIAS** con grep_search
5. 💰 **MANTENDRÉ COP** en todo el sistema
6. 🔥 **PRESERVARÉ FIREBASE** y conexiones existentes
7. ✅ **PROBARÉ CADA CAMBIO** verificando localhost:3000 auto-refresh
8. 📱 **VERIFICARÉ NAVEGADOR** después de cada modificación

**ESTA ES LA LEY SUPREMA DEL PROYECTO**
**CUMPLIMIENTO OBLIGATORIO E INQUEBRANTABLE**
**NO ADMITE EXCEPCIONES NI ATAJOS**

## ⚠️ RECORDATORIO FINAL
1. Estas reglas aplican desde que INICIAS la sesión hasta que la TERMINAS
2. CADA COMMIT debe seguir TODOS los pasos aquí descritos
3. NO hay desarrollos "pequeños" que puedan saltar verificaciones
4. La calidad del proyecto depende del cumplimiento ESTRICTO de estas reglas
5. El incumplimiento de cualquier regla es motivo de ROLLBACK inmediato
6. **LIMPIEZA POST-VERIFICACIÓN**: Después de confirmar que NO hay errores, ELIMINAR todos los backups para mantener el proyecto limpio y eficiente

**FIRMO Y ACEPTO ESTAS REGLAS COMO LEY FUNDAMENTAL DEL DESARROLLO**