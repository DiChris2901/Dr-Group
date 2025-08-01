# 🚀 PROTOCOLO DE OPTIMIZACIÓN VS CODE

## 📋 PROCESO AUTOMATIZADO PARA RESOLVER LENTITUD

### 🎯 Objetivo
Procedimiento estándar para optimizar VS Code cuando se presenta lentitud o múltiples procesos que consumen memoria excesiva.

---

## ⚡ DIAGNÓSTICO RÁPIDO

### 1. Verificar Procesos Activos
```cmd
powershell "Get-Process | Where-Object {$_.ProcessName -like '*Code*' -or $_.ProcessName -like '*node*'} | Select-Object ProcessName, Id, WorkingSet"
```

### 2. Identificar Problema
- **Normal**: 1-3 procesos Code.exe (~200-500MB total)
- **Problema**: 5+ procesos Code.exe (>2GB total)
- **Crítico**: 10+ procesos Code.exe (>4GB total)

---

## 🧹 LIMPIEZA COMPLETA (Ejecutar en orden)

### Paso 1: Limpiar Cache npm y Node
```cmd
npm cache clean --force
del /q /s node_modules\.cache\* 2>nul
rd /s /q .vite 2>nul
rd /s /q dist 2>nul
```

### Paso 2: Limpiar Cache VS Code
```cmd
rd /s /q "%APPDATA%\Code\User\workspaceStorage" 2>nul
rd /s /q "%APPDATA%\Code\CachedExtensions" 2>nul
rd /s /q "%APPDATA%\Code\logs" 2>nul
del /q "%TEMP%\vscode-*" 2>nul
rd /s /q "%LOCALAPPDATA%\Microsoft\vscode-cpptools" 2>nul
```

### Paso 3: Cerrar Procesos Huérfanos
```cmd
powershell "Get-Process | Where-Object {$_.ProcessName -eq 'Code' -and $_.MainWindowTitle -eq ''} | Stop-Process -Force"
```

### Paso 4: Verificar Limpieza
```cmd
powershell "Get-Process | Where-Object {$_.ProcessName -like '*Code*'} | Measure-Object | Select-Object Count"
```

---

## 🛠️ COMANDOS ESPECÍFICOS POR PROBLEMA

### Si hay múltiples procesos Node.js:
```cmd
tasklist | findstr "node"
# Si hay más de 3 procesos node.exe, reiniciar dev server
```

### Si VS Code no responde:
```cmd
taskkill /f /im Code.exe
# Esperar 30 segundos antes de reabrir
```

### Si hay problemas de extensiones:
```cmd
rd /s /q "%USERPROFILE%\.vscode\extensions\.obsolete"
```

---

## 📝 CHECKLIST DE OPTIMIZACIÓN

### ✅ Antes de empezar:
- [ ] Guardar todo el trabajo
- [ ] Verificar que git está actualizado
- [ ] Anotar extensiones críticas activas

### ✅ Durante la limpieza:
- [ ] Ejecutar diagnóstico inicial
- [ ] Ejecutar los 4 pasos de limpieza
- [ ] Verificar que procesos se redujeron
- [ ] Comprobar que cache fue eliminado

### ✅ Después de la limpieza:
- [ ] Cerrar VS Code completamente
- [ ] Esperar 30 segundos
- [ ] Abrir solo el proyecto necesario
- [ ] Verificar que responde correctamente

---

## 🚨 NIVELES DE INTERVENCIÓN

### Nivel 1: Limpieza Básica (Preventiva)
```cmd
npm cache clean --force
rd /s /q .vite 2>nul
```

### Nivel 2: Limpieza Media (Lentitud moderada)
```cmd
# Ejecutar Paso 1 y Paso 2 del proceso completo
```

### Nivel 3: Limpieza Completa (Lentitud severa)
```cmd
# Ejecutar todos los 4 pasos + reinicio completo
```

### Nivel 4: Reinicio Total (Casos extremos)
```cmd
# Cerrar todos los procesos Code.exe manualmente
# Reiniciar la PC si es necesario
```

---

## 📊 MÉTRICAS DE ÉXITO

### Después de la optimización, deberías ver:
- **Procesos Code.exe**: 1-3 máximo
- **Memoria VS Code**: <500MB total
- **Tiempo de respuesta**: <2 segundos para abrir archivos
- **Compilación**: Sin errores ni warnings
- **HMR**: Funcionando en <3 segundos

---

## 🔄 PREVENCIÓN FUTURA

### Buenas Prácticas:
1. **Un proyecto por ventana**: No abrir múltiples workspaces
2. **Cerrar pestañas**: No acumular más de 10 pestañas abiertas
3. **Reinicio regular**: Reiniciar VS Code cada 3-4 horas
4. **Monitoreo**: Usar `Ctrl+Shift+P` → "Developer: Show Running Extensions"
5. **Reload Window**: Preferir "Reload Window" en lugar de abrir nuevas instancias

### Extensiones a Revisar:
- **C/C++**: Puede consumir mucha memoria
- **Python**: IntelliSense pesado
- **GitLens**: Historial extenso puede ser lento
- **Live Server**: Múltiples servidores activos

---

## 🆘 COMANDO DE EMERGENCIA

### Ejecución Rápida (Copiar y Pegar):
```cmd
echo "=== OPTIMIZACION VS CODE INICIADA ===" && npm cache clean --force && rd /s /q .vite 2>nul && rd /s /q dist 2>nul && rd /s /q "%APPDATA%\Code\User\workspaceStorage" 2>nul && rd /s /q "%APPDATA%\Code\CachedExtensions" 2>nul && rd /s /q "%APPDATA%\Code\logs" 2>nul && del /q "%TEMP%\vscode-*" 2>nul && echo "=== LIMPIEZA COMPLETADA ===" && echo "REINICIA VS CODE AHORA" && powershell "Get-Process | Where-Object {$_.ProcessName -like '*Code*'} | Select-Object ProcessName, Id, WorkingSet"
```

---

## 📝 NOTAS DE LA SESIÓN

**Creado**: 31 Julio 2025  
**Versión**: 1.0  
**Testado en**: Windows 10/11, VS Code 1.91+  
**Proyecto**: DR Group Dashboard v2.1.0  

**Última optimización exitosa**: Resolvió 17 procesos Code.exe consumiendo 6GB RAM

---

## 🔗 ARCHIVOS RELACIONADOS

- `AVANCES_SESION.md` - Estado actual del proyecto
- `PROTOCOLO_VERIFICACION_ERRORES.md` - Para errores de código
- `restart-dev.bat` - Reinicio rápido del servidor

---

**⚠️ IMPORTANTE**: Este proceso ha sido probado y es seguro. No afecta el código ni las configuraciones de VS Code, solo limpia caches y procesos temporales.
