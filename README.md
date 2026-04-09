# DR Group Dashboard 🎯

## 🚀 Descripción

Dashboard empresarial completo para gestión de compromisos financieros y liquidaciones de máquinas de apuesta desarrollado con React + Vite + Firebase. Sistema de alto rendimiento con arquitectura empresarial robusta, diseño sobrio profesional y control de acceso granular basado en roles.

**Características destacadas:**
- Dashboard web responsive con React 18 + Vite
- App móvil nativa con React Native + Expo  
- Sistema de liquidaciones por salas con estadísticas avanzadas
- Control de asistencias con geolocalización
- Gestión multi-empresa con permisos granulares
- Exportación Excel con formato profesional (ExcelJS)
- Recursos Humanos completo

---

## ✨ Funcionalidades Principales

### 💼 **Dashboard Empresarial**
- **Métricas ejecutivas** en tiempo real
- **Gráficos interactivos** con Recharts
- **Sistema de alertas** inteligente con centro de notificaciones
- **Búsqueda global** unificada en toda la aplicación
- **Filtros avanzados** por empresa, fecha y periodo
- **Calendario integrado** con eventos y compromisos

### 💰 **Gestión Financiera**
- **Compromisos mensuales** con renovación automática
- **Pagos y comprobantes** con almacenamiento en Firebase Storage
- **Ingresos empresariales** con clasificación detallada
- **Reportes configurables** por empresa y rango de fechas
- **Historial completo** de transacciones
- **Cuentas bancarias** con conciliación

### 🎰 **Sistema de Liquidaciones**
- **Liquidaciones por sala** con cálculo automático
- **Estadísticas comparativas** (trimestral, semestral, anual)
- **Detalle por máquina** con histórico de producción
- **Búsqueda global** por Serial/NUC
- **Exportación Excel** con formato Python profesional
- **Histórico de periodos** con filtros avanzados
- **Cambios de sala** con auditoría completa

### 👥 **Gestión de Recursos Humanos**
- **Control de asistencias** con GPS y timestamps
- **Registro de entrada/salida** automático
- **Breaks y almuerzos** con cálculo de duración
- **Horas trabajadas** calculadas desde timestamps
- **Liquidaciones de nómina** integradas
- **Solicitudes de empleados** con aprobación

### 📱 **App Móvil (React Native + Expo)**
- **Login con auto-registro** de entrada
- **Control de jornada laboral** en tiempo real
- **Breaks y almuerzos** con contador en vivo
- **Diseño sobrio** Material You Expressive
- **Colores dinámicos** personalizables por usuario
- **Geolocalización** y datos del dispositivo

### 🔐 **Seguridad y Permisos**
- **Autenticación Firebase** (solo correos autorizados)
- **Sistema de roles** (ADMIN, USER, VIEWER)
- **Permisos granulares** por módulo y empresa
- **Auditoría completa** con activity logs
- **Validación de acceso** en frontend y backend

### 📊 **Reportes y Exportación**
- **Exportación Excel** con formato Python profesional
- **Generación PDF** con jsPDF
- **Estadísticas consolidadas** por empresa
- **Gráficos de tendencias** operativas

---

## 🛠️ Stack Tecnológico

### **Frontend Web**
- **React 18.2.0** - Biblioteca de UI con hooks
- **Vite 5.4.21** - Build tool optimizado
- **Material-UI v5** - Componentes con diseño sobrio empresarial
- **Emotion** - Styled components (MUI)
- **Framer Motion 10.16.16** - Animaciones avanzadas
- **React Router DOM 6.20.1** - Navegación SPA
- **Recharts 2.12.7** - Gráficos interactivos
- **date-fns 4.1.0** - Manejo de fechas

### **Frontend Móvil**
- **React Native 0.81.5** - Framework móvil
- **Expo 54.0.23** - Plataforma de desarrollo
- **React Navigation 7.x** - Navegación móvil
- **React Native Paper v5** - Material Design 3
- **Expo Location** - Geolocalización
- **AsyncStorage** - Persistencia local

### **Backend & Database**
- **Firebase 10.7.1 / 12.5.0** - Plataforma completa
- **Firestore** - Base de datos NoSQL en tiempo real
- **Firebase Storage** - Almacenamiento de archivos
- **Firebase Authentication** - Gestión de usuarios
- **Firebase Hosting** - Deploy de producción
- **Security Rules** - Protección de datos

### **Utilidades y Herramientas**
- **ExcelJS 4.4.0** - Exportación Excel profesional
- **jsPDF 3.0.3** - Generación de PDFs
- **Google Generative AI 0.24.1** - IA integrada
- **ESLint + Prettier** - Código limpio

---

## 📁 Estructura del Proyecto

```
Dr-Group/
├── src/                                    # Dashboard Web
│   ├── components/
│   │   ├── admin/                         # Herramientas de administración
│   │   ├── auth/                          # Autenticación
│   │   ├── charts/                        # Gráficos y visualizaciones
│   │   ├── commitments/                   # Gestión de compromisos
│   │   ├── common/                        # Componentes reutilizables
│   │   ├── companies/                     # Gestión de empresas
│   │   ├── dashboard/                     # Dashboard principal
│   │   ├── incomes/                       # Gestión de ingresos
│   │   ├── layout/                        # Layout y navegación
│   │   ├── liquidaciones/                 # Liquidaciones por salas
│   │   ├── modals/                        # Modales especializados
│   │   ├── notes/                         # Sistema de notas
│   │   ├── notifications/                 # Notificaciones
│   │   ├── payments/                      # Gestión de pagos
│   │   ├── rrhh/                          # Recursos Humanos
│   │   ├── settings/                      # Configuraciones
│   │   └── storage/                       # Gestión de archivos
│   ├── context/                           # Context providers
│   ├── hooks/                             # Custom hooks especializados
│   ├── pages/                             # Páginas principales
│   ├── services/                          # Servicios y lógica de negocio
│   ├── utils/                             # Utilidades y helpers
│   ├── theme/                             # Configuración de tema MUI
│   └── config/                            # Configuración Firebase
├── mobile/                                 # App Móvil (React Native)
│   ├── src/
│   │   ├── screens/                       # Pantallas de la app
│   │   │   ├── auth/                      # Login con auto-registro
│   │   │   └── dashboard/                 # Control de jornada
│   │   ├── contexts/                      # AuthContext, ThemeContext
│   │   ├── components/                    # Componentes sobrios
│   │   ├── navigation/                    # Stack Navigator
│   │   ├── services/                      # Firebase config
│   │   └── utils/                         # Utilidades móvil
│   ├── design-system.json                 # Tokens de diseño Material You
│   ├── material-theme.json                # Paleta completa de colores
│   └── eas.json                           # Configuración EAS Build
├── docs/                                   # Documentación del sistema
│   ├── DISENO_SOBRIO_NOTAS.md            # Sistema minimalista empresarial
│   ├── MODAL_DESIGN_SYSTEM.md            # Patrones para modales
│   ├── MODAL_PDF_VIEWER_DESIGN.md        # Visores PDF avanzados
│   └── EXCEL_EXPORT_DESIGN_SYSTEM.md     # Formato Python para Excel
├── .github/
│   └── copilot-instructions.md            # Instrucciones para Copilot
├── firebase.json                          # Configuración Firebase
├── firestore.rules                        # Reglas de seguridad
├── storage.rules                          # Reglas de Storage
└── package.json                           # Dependencias del proyecto
```

---

## 🚀 Instalación y Configuración

### **Prerrequisitos**
- Node.js 18+ instalado
- npm o yarn instalado
- Git configurado
- Proyecto Firebase creado y configurado
- Visual Studio Code (recomendado)

### **Instalación del Dashboard Web**

```powershell
# Clonar repositorio
git clone https://github.com/DiChris2901/Dr-Group.git
cd Dr-Group

# Instalar dependencias
npm install

# Configurar Firebase
# Copia tu configuración en src/config/firebase.js

# Ejecutar en desarrollo
npm run dev

# Compilar para producción
npm run build

# Deploy a Firebase Hosting
firebase deploy --only hosting
```

### **Instalación de la App Móvil**

```powershell
# Navegar al directorio móvil
Set-Location mobile

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo (pruebas con Expo Go)
npx expo start

# Escanear QR con Expo Go para ver cambios en tiempo real
```

---

## 📱 Distribución de App Móvil

La app móvil se distribuye vía **Firebase App Distribution** con compilación local en Android Studio.

### **🔄 Flujo Completo de Actualización**

#### **1. Desarrollo y Pruebas**
```powershell
# Probar cambios localmente con Expo Go
Set-Location mobile
npx expo start
# Escanear QR con celular → Ver cambios en tiempo real
```

#### **2. Commit a Git (Backup)**
```powershell
git add .
git commit -m "feat: Descripción del cambio"
git push origin main
```

#### **3. Versionado Antes de Compilar**
```powershell
cd mobile\android\app
.\increment-version.ps1
# Elegir tipo: 1=PATCH (bugs) | 2=MINOR (features) | 3=MAJOR (breaking)
```

#### **4. Compilación en Android Studio**
```
1. Abrir Android Studio
2. Build > Generate Signed Bundle/APK
3. Seleccionar APK > Release
4. Esperar 2-5 minutos
5. APK generado en: mobile\android\app\build\outputs\apk\release\app-release.apk
```

#### **5. Distribución a Usuarios**
```powershell
cd mobile
.\distribute-apk.ps1 -Version "3.1.0" -ReleaseNotes "Correcciones y mejoras"

# Primera vez (agregar verificadores):
.\distribute-apk.ps1 -Version "3.0.0" -ReleaseNotes "Primera versión" -Testers "correo1@gmail.com,correo2@gmail.com"
```

#### **6. Verificación**
- ✅ Verificadores reciben email de Firebase automáticamente
- ✅ Pueden descargar APK desde el link del email
- ✅ Ver métricas en: https://console.firebase.google.com/project/dr-group-cd21b/appdistribution

### **📋 Notas Importantes**

- **NO hay actualizaciones OTA:** Compilación local en Android Studio (no EAS Build)
- **Todas las actualizaciones requieren:** Compilar nuevo APK + Distribuir + Reinstalar
- **Ventaja:** Control total, sin colas de EAS Build (30+ min), distribución rápida (2-5 min)
- **Documentación completa:** Ver `mobile/APP_DISTRIBUTION_GUIDE.md`

---

### **Configuración Firebase**

1. **Crear proyecto** en Firebase Console
2. **Habilitar servicios:**
   - Authentication (Email/Password)
   - Firestore Database
   - Storage
   - Hosting
3. **Configurar Security Rules:**
   - Copiar `firestore.rules` al proyecto
   - Copiar `storage.rules` al proyecto
4. **Agregar configuración:**
   - Dashboard Web: `src/config/firebase.js`
   - App Móvil: `mobile/src/services/firebase.js`

---

## 🎨 Sistema de Diseño

### **Dashboard Web - Diseño Sobrio Empresarial**

El sistema sigue estrictamente los principios definidos en `docs/DISENO_SOBRIO_NOTAS.md`:

- **Border Radius:** 8-16px (profesional, no orgánico)
- **Sombras:** Sutiles (0 2px 8px rgba(0,0,0,0.06))
- **Transiciones:** Simples (0.2s ease)
- **Tipografía:** Pesos equilibrados (400-600)
- **Colores:** Sistema de paleta MUI consistente
- **Efectos:** Minimalistas, sin glassmorphism

### **App Móvil - Material You Expressive**

Implementa Material Design 3 con tokens personalizados:

- **Border Radius:** 24-48px (orgánico, táctil)
- **Elevation:** Tonal (sin sombras negras)
- **Tipografía:** Roboto Flex con Width Axis 110%
- **Espaciado:** Generoso (32px gaps)
- **Surface Colors:** Sistema de elevación por color
- **Haptics:** Feedback táctil en acciones principales

---

## 🔐 Seguridad y Permisos

### **Sistema de Roles**

- **SUPER_ADMIN:** Acceso total al sistema
- **ADMIN:** Gestión completa + usuarios
- **USER:** Operaciones estándar
- **VIEWER:** Solo lectura

### **Permisos Granulares**

```javascript
Permissions by Module:
├── dashboard                    // Dashboard principal
├── compromisos                  // Ver compromisos
│   └── compromisos.ver_todos   // Ver todos (sin filtro empresa)
├── pagos                        // Gestión de pagos
├── ingresos                     // Gestión de ingresos
├── liquidaciones                // Sistema de liquidaciones
│   ├── liquidaciones.procesar  // Procesar liquidaciones
│   ├── liquidaciones.estadisticas
│   └── liquidaciones.historico
├── facturacion                  // Módulo de facturación
│   └── facturacion.cuentas_cobro
├── asistencias                  // Control de asistencias
├── usuarios                     // Gestión de usuarios
├── auditoria                    // Logs del sistema
└── storage                      // Gestión de archivos
```

### **Firestore Security Rules**

```javascript
// Reglas de acceso granular
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Los usuarios solo ven sus propias empresas
    match /commitments/{commitmentId} {
      allow read: if request.auth != null 
        && request.auth.uid in resource.data.allowedUsers;
    }
    
    // Solo admins pueden gestionar usuarios
    match /users/{userId} {
      allow write: if request.auth != null 
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN';
    }
  }
}
```

---

## 📱 Uso de la App Móvil

### **Flujo de Usuario**

1. **Login → Auto-registro de entrada**
   - Captura de ubicación GPS
   - Registro de dispositivo
   - Inicio de jornada automático

2. **Control de Jornada**
   - Contador de tiempo trabajado en vivo
   - Botones: Break, Almuerzo, Finalizar
   - Estados: Trabajando, Break, Almuerzo

3. **Breaks y Almuerzos**
   - Inicio/fin con timestamps
   - Cálculo automático de duración
   - Resta del tiempo trabajado

4. **Finalización de Jornada**
   - Cálculo de horas trabajadas
   - Registro de salida con timestamp
   - Logout automático

### **Deployment Móvil**

**OTA (Over-The-Air):** Para cambios de código JS/assets
```powershell
Set-Location mobile
eas update --branch production --message "Fix: Corrección horas trabajadas"
```

**APK Completo:** Para cambios nativos/permisos
```powershell
Set-Location mobile
eas build --platform android --profile production
```

---

## 📊 Colecciones de Firestore

```javascript
firestore/
├── users/                          // Usuarios del sistema
│   └── {uid}/
│       ├── name, email, role
│       ├── photoURL, department
│       └── permissions: {}
├── companies/                      // Empresas
├── commitments/                    // Compromisos financieros
├── payments/                       // Pagos realizados
├── incomes/                        // Ingresos empresariales
├── liquidaciones/                  // Liquidaciones consolidadas
│   └── {empresaNorm}_{periodo}
├── liquidaciones_por_sala/         // Liquidaciones por sala
│   └── {salaId}_{periodo}
├── asistencias/                    // Control de asistencias
│   └── {uid}_{YYYY-MM-DD}
│       ├── entrada: { hora, ubicacion, dispositivo }
│       ├── breaks: []
│       ├── almuerzo: {}
│       └── salida: { hora }
├── activity_logs/                  // Auditoría del sistema
├── notifications/                  // Notificaciones
└── userSettings/                   // Configuraciones de usuario
    └── {uid}/theme/
```

---

## 🔧 Scripts Disponibles

### **Dashboard Web**

```json
{
  "dev": "vite --port 5173",              // Desarrollo
  "build": "vite build",                   // Compilación producción
  "preview": "vite preview",               // Preview build
  "lint": "eslint . --ext js,jsx"          // Linter
}
```

### **App Móvil**

```json
{
  "start": "expo start",                   // Servidor desarrollo
  "android": "expo start --android",       // Android directo
  "ios": "expo start --ios",               // iOS directo
  "web": "expo start --web"                // Web preview
}
```

---

## 🎯 Próximas Características

### **Dashboard Web**
- [ ] Sistema de notificaciones push en tiempo real
- [ ] Integración con APIs bancarias
- [ ] Módulo de inventario de máquinas
- [ ] Dashboard de analytics avanzado
- [ ] Sistema de backup automático
- [ ] Multi-idioma (i18n)

### **App Móvil**
- [ ] Notificaciones push nativas
- [ ] Modo offline con sincronización
- [ ] Solicitud de permisos (vacaciones, días libres)
- [ ] Perfil de usuario editable
- [ ] Biometría para login

---

## 👥 Contribución

Este es un proyecto privado para DR Group. Para contribuir:

1. Crear feature branch desde `main`
2. Seguir convenciones de código establecidas
3. Consultar `.github/copilot-instructions.md` para reglas
4. Hacer commit con mensajes descriptivos
5. Push y solicitar revisión de código

### **Convenciones de Commits**

```
feat: Nueva funcionalidad
fix: Corrección de bug
docs: Cambios en documentación
style: Formato, punto y coma, etc.
refactor: Refactorización de código
test: Agregar tests
chore: Mantenimiento
```

---

## 📄 Licencia

Proyecto privado para **DR Group**. Todos los derechos reservados.

**No distribuir sin autorización.**

---

## 📞 Contacto y Soporte

**Proyecto:** DR Group Dashboard  
**Versión:** 3.20.0 (Marzo 2026)  
**Desarrollador:** Diego Rueda  
**Empresa:** DR Group  

**URLs:**
- **Dashboard:** https://dr-group-cd21b.web.app
- **Firebase Console:** https://console.firebase.google.com/project/dr-group-cd21b

---

## 📚 Documentación Adicional

- [Diseño Sobrio Empresarial](docs/DISENO_SOBRIO_NOTAS.md)
- [Sistema de Modales](docs/MODAL_DESIGN_SYSTEM.md)
- [Exportación Excel](docs/EXCEL_EXPORT_DESIGN_SYSTEM.md)
- [Instrucciones Copilot](.github/copilot-instructions.md)

---

⭐ **Desarrollado con dedicación para DR Group** ⭐
