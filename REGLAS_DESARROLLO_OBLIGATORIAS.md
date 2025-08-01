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
- [ ] **NPM RUN DEV**: Tras CADA archivo modificado
- [ ] **COMPILED SUCCESS**: Esperar mensaje exitoso
- [ ] **NAVEGADOR LIMPIO**: Abrir y verificar sin errores
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

## 🚨 9. PROTOCOLO DE EMERGENCIA AMPLIADO
- [ ] **ERROR → STOP**: No continuar si hay errores
- [ ] **IDENTIFICAR TIPO**: ¿Sintaxis? ¿Import? ¿Lógica?
- [ ] **SINTAXIS**: Corregir inmediatamente
- [ ] **LÓGICA**: cp archivo.backup → archivo.jsx
- [ ] **GIT RESTORE**: Como recurso de emergencia
- [ ] **DOCUMENTAR**: Error para evitar repetición

## 🎯 10. VALIDACIÓN FINAL COMPLETA
- [ ] **RECORRER APP**: Toda la aplicación completa
- [ ] **MODO CLARO/OSCURO**: Probar ambos temas
- [ ] **RESPONSIVE**: Mobile y desktop
- [ ] **PERFORMANCE**: Sin lag ni lentitud
- [ ] **DATOS REALES**: Testear con Firebase real

## 📝 11. DOCUMENTACIÓN POST
- [ ] **README ACTUALIZADO**: Si hay nuevas features
- [ ] **JSDoc**: Comentarios en funciones complejas
- [ ] **CHANGELOG**: Cambios realizados documentados
- [ ] **TODOS**: Lista para siguientes iteraciones

## 🔥 IMPLEMENTACIÓN OBLIGATORIA - PROTOCOLO PASO A PASO

### 🔒 ANTES de cualquier modificación, ORDEN EXACTO:
```
1. git status (verificar repo limpio)
2. cp archivo.jsx archivo.jsx.backup
3. read_file (archivo completo)
4. grep_search (verificar dependencias)
5. Confirmar estructura actual
6. Documentar cambios exactos
```

### 🛠️ DURANTE la modificación, ORDEN EXACTO:
```
1. Modificar UN SOLO archivo
2. GUARDAR archivo
3. Verificar sintaxis sin errores rojos
4. npm run dev
5. Esperar "compiled successfully"
6. Verificar navegador sin errores
```

### ✅ DESPUÉS de modificación, ORDEN EXACTO:
```
1. Probar funcionalidad afectada
2. Verificar consola DevTools limpia
3. Confirmar datos Firebase correctos
4. Verificar formato COP mantenido
5. ELIMINAR todos los backups (carpetas backup/, backup_*)
6. git add . && git status
7. Commit corto y descriptivo
8. Crear tag con versión
9. Push completo con tags
```

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
- "Ejecutando npm run dev para verificar compilación"
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
7. ✅ **PROBARÉ CADA CAMBIO** con npm run dev
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
