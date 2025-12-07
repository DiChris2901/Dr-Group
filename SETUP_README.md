# 🔧 Configuración del Entorno - DR Group Dashboard

## 🖥️ **IMPORTANTE: Configuración según Sistema Operativo**

Este proyecto se puede desarrollar en **Windows** o **Linux/macOS**. Cada entorno tiene sus propios archivos de configuración que **NO se comparten**.

---

## 📋 **ARCHIVOS POR SISTEMA OPERATIVO**

### **🪟 Solo para Windows:**
- `setup-windows.ps1` - Script de configuración PowerShell
- `SETUP_WINDOWS.md` - Documentación Windows (si existe)
- Comandos: PowerShell (`.ps1`)

### **🐧 Solo para Linux/macOS:**
- `setup-env.sh` - Script de inicialización bash
- `configure-firebase.sh` - Configuración Firebase bash
- `verify-setup.sh` - Verificación del entorno bash
- `SETUP_LINUX.md` - Documentación Linux/macOS
- Comandos: bash/sh (`.sh`)

**⚠️ IMPORTANTE:** Los archivos de Linux están en `.gitignore` y **NO se suben a GitHub** para evitar confusiones en equipos Windows.

---

## 🚀 **SETUP SEGÚN TU SISTEMA OPERATIVO**

### **🪟 Si estás en Windows:**

```powershell
# 1. Instalar Node.js desde nodejs.org
# 2. Instalar Firebase CLI
npm install -g firebase-tools

# 3. Configurar proyecto
cd Dr-Group
npm install
cd mobile && npm install

# 4. Crear archivo .env (ver .env.example)
# 5. Iniciar proyecto
npm run dev
```

### **🐧 Si estás en Linux/macOS:**

```bash
# 1. Instalar nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

# 2. Instalar Node.js
nvm install 20

# 3. Instalar Firebase CLI
npm install -g firebase-tools

# 4. Configurar proyecto
cd Dr-Group
npm install
cd mobile && npm install

# 5. Configurar Firebase (ejecutar scripts de configuración)
bash configure-firebase.sh

# 6. Crear archivo .env (ver .env.example)
# 7. Iniciar proyecto
npm run dev
```

---

## 📝 **COMANDOS SEGÚN SISTEMA OPERATIVO**

### **Para APK Móvil (Expo):**

| Acción | Windows PowerShell | Linux/macOS bash |
|--------|-------------------|------------------|
| **Iniciar Expo** | `Set-Location mobile; npx expo start` | `cd mobile && npx expo start` |
| **Instalar paquete** | `Set-Location mobile; npm install [paquete]` | `cd mobile && npm install [paquete]` |
| **Build APK** | `Set-Location mobile; eas build --platform android` | `cd mobile && eas build --platform android` |

### **Para Dashboard Web:**

```bash
# Igual en ambos sistemas (raíz del proyecto)
npm run dev          # Iniciar desarrollo
npm run build        # Compilar producción
firebase deploy      # Desplegar a Firebase
```

---

## 🔐 **ARCHIVOS COMUNES (AMBOS SISTEMAS)**

Estos archivos SÍ se comparten entre Windows y Linux:

- `.env` - Variables de entorno (local, no se sube a GitHub)
- `.env.example` - Plantilla de variables de entorno
- `package.json` - Dependencias del proyecto
- `firebase.json` - Configuración de Firebase
- Todo el código fuente en `src/` y `mobile/src/`

---

## 🎯 **RECOMENDACIÓN PARA EL EQUIPO**

1. **Cada desarrollador** configura su entorno según su sistema operativo
2. **NO compartir** archivos `.sh` o `.ps1` entre equipos
3. **SÍ compartir** el código fuente, `.env.example`, y configuraciones de Firebase
4. **Usar GitHub Copilot** para configuración automática según OS detectado

---

## 📞 **¿DUDAS?**

- **Windows:** Consulta documentación específica de Windows (si existe)
- **Linux/macOS:** Los archivos de configuración están en tu máquina local (no en GitHub)
- **Ambos:** Usa `npm run dev` para iniciar el proyecto

---

*Este README es común para todos los sistemas operativos*
