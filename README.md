# 🎯 DR Group Dashboard

Dashboard para control de compromisos financieros empresariales desarrollado con React, Material-UI y Firebase.

## 📋 Descripción

Este sistema permite llevar control de compromisos fijos mensuales (recurrentes y únicos) de las empresas del grupo DR. Incluye funcionalidades para filtrar información, agregar compromisos, gestionar pagos y sus correspondientes comprobantes.

## ✨ Características Principales

- 🔐 **Autenticación segura** con Firebase (solo correos autorizados)
- 📊 **Dashboard interactivo** con métricas en tiempo real
- 💼 **Gestión multi-empresa** con filtros personalizables
- 📁 **Manejo de comprobantes** con Firebase Storage
- 👥 **Sistema de roles** y permisos granulares
- 📱 **Diseño responsivo** con Material-UI
- 🌙 **Tema claro/oscuro** personalizable
- 🔔 **Alertas automáticas** de compromisos próximos a vencer
- 📈 **Reportes y análisis** exportables

## 🛠️ Stack Tecnológico

- **Frontend**: React 18 + Vite
- **UI Framework**: Material-UI (MUI) v5
- **Backend**: Firebase (Firestore + Storage + Auth)
- **Animaciones**: Framer Motion
- **Routing**: React Router DOM
- **Utilidades**: date-fns para manejo de fechas

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js 18+ 
- npm o yarn
- Cuenta de Firebase con proyecto configurado

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone [url-del-repo]
   cd dr-group-dashboard
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar Firebase**
   - Copia `.env.example` a `.env`
   - Completa las variables de Firebase desde tu proyecto en Firebase Console
   ```bash
   cp .env.example .env
   ```

4. **Configurar Firestore Rules** (en Firebase Console)
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Reglas de seguridad personalizadas
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

5. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```

## 📂 Estructura del Proyecto

```
src/
├── components/
│   ├── auth/           # Autenticación y login
│   ├── dashboard/      # Dashboard principal
│   ├── commitments/    # Gestión de compromisos
│   ├── reports/        # Reportes y análisis
│   └── users/          # Gestión de usuarios
├── config/
│   └── firebase.js     # Configuración de Firebase
├── hooks/              # Custom hooks
├── context/            # React Context providers
├── utils/              # Utilidades y helpers
└── App.jsx            # Componente principal
```

## 🔧 Scripts Disponibles

- `npm run dev` - Ejecutar en modo desarrollo
- `npm run build` - Construir para producción
- `npm run preview` - Previsualizar build de producción

## 🔐 Sistema de Autenticación

- Solo correos electrónicos autorizados pueden acceder
- No hay opción de registro público
- Los usuarios deben ser creados por el administrador
- Foto de perfil aparece en el menú y login

## 👥 Roles y Permisos

- **Administrador**: Acceso completo a todas las funcionalidades
- **Usuario**: Permisos personalizables por empresa
- **Solo Lectura**: Visualización sin capacidad de descarga de comprobantes

## 📊 Base de Datos (Firestore)

### Colecciones Principales

- `users` - Información de usuarios, roles y permisos
- `companies` - Datos de empresas del grupo
- `commitments` - Compromisos financieros
- `payments` - Pagos realizados
- `files` - Metadatos de archivos y comprobantes

## 🎨 Personalización

El dashboard está basado en la plantilla Horizon v1.0.0 y utiliza un tema personalizado de Material-UI que incluye:

- Colores corporativos de DR Group
- Tipografía Roboto
- Componentes personalizados
- Animaciones con Framer Motion

## 🚀 Despliegue

El proyecto está configurado para desplegarse en Firebase Hosting con Google Cloud:

1. **Construir el proyecto**
   ```bash
   npm run build
   ```

2. **Desplegar a Firebase**
   ```bash
   firebase deploy
   ```

## 📝 Notas de Desarrollo

- Usar siempre componentes funcionales con hooks
- Implementar loading states para mejor UX
- Seguir patrones de Material-UI para consistencia
- Mantener las reglas de Firestore actualizadas
- Optimizar imágenes antes de subirlas a Storage

## 🤝 Contribución

Este es un proyecto privado para DR Group. Las contribuciones deben seguir los estándares de código establecidos y ser revisadas antes de la integración.

## 📄 Licencia

Proyecto privado - Todos los derechos reservados DR Group © 2025
