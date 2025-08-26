# DR Group Dashboard

## 🚀 Descripción
Dashboard empresarial moderno para control de compromisos financieros desarrollado con React + Firebase. Incluye sistema completo de personalización estilo Boss Lite con 130+ opciones de customización.

## ✨ Características Principales

### 🎨 Sistema de Personalización Boss Lite
- **8 presets de colores** predefinidos
- **130+ opciones de personalización** organizadas en 9 categorías
- **Modo claro/oscuro** con switch animado
- **Tipografías personalizables** (8 familias diferentes)
- **Efectos visuales avanzados** (gradientes, sombras, shimmer)

### 🔍 Búsqueda Avanzada
- **Barra de búsqueda funcional** en tiempo real
- **Resultados categorizados** (compromisos, empresas, usuarios, reportes)
- **Navegación por teclado** (Enter, Escape)
- **Animaciones fluidas** con Framer Motion

### 👤 Gestión de Usuario Completa
- **Autenticación con Firebase** (solo correos autorizados)
- **Perfiles de usuario** con fotos en Firebase Storage
- **Sistema de roles y permisos** granular por empresa
- **Preview de usuario** en login con validación automática

### 💼 Funcionalidades de Negocio
- **Dashboard con métricas** de compromisos financieros
- **CRUD completo** de compromisos con archivos adjuntos
- **Sistema de reportes** filtrable por empresa/fecha
- **Alertas de vencimiento** automáticas
- **Gestión multi-empresa** con permisos específicos

## 🛠️ Stack Tecnológico

### Frontend
- **React 18** + **Vite** (desarrollo optimizado)
- **Material-UI v5** (componentes y theming)
- **Framer Motion** (animaciones avanzadas)
- **React Router DOM** (navegación SPA)
- **date-fns** (manejo de fechas)

### Backend & Database
- **Firebase Authentication** (gestión de usuarios)
- **Firestore** (base de datos NoSQL en tiempo real)
- **Firebase Storage** (almacenamiento de archivos)
- **Security Rules** configuradas para producción

### Herramientas de Desarrollo
- **ESLint** + **Prettier** (código limpio)
- **Hot Module Replacement** (desarrollo rápido)
- **Progressive Web App** features
- **Responsive Design** mobile-first

## 📁 Estructura del Proyecto

```
src/
├── components/
│   ├── auth/           # Autenticación
│   ├── dashboard/      # Dashboard principal
│   ├── commitments/    # Gestión financiera
│   ├── settings/       # Personalización Boss Lite
│   ├── layout/         # Layout y navegación
│   └── users/          # Gestión de usuarios
├── context/            # Context providers
├── hooks/              # Custom hooks
├── config/             # Configuración Firebase
├── utils/              # Utilidades
└── pages/              # Páginas principales
```

## 🚀 Instalación y Uso

### Prerrequisitos
- Node.js 18+
- npm o yarn
- Proyecto Firebase configurado

### Instalación
```bash
# Clonar repositorio
git clone https://github.com/TU_USUARIO/dr-group-dashboard.git
cd dr-group-dashboard

# Instalar dependencias
npm install

# Configurar Firebase
# Copia tu configuración en src/config/firebase.js

# Ejecutar en desarrollo
npm run dev
```

### Configuración Firebase
1. Crear proyecto en Firebase Console
2. Habilitar Authentication, Firestore y Storage
3. Configurar dominios autorizados
4. Implementar Security Rules incluidas en el proyecto

## 🎨 Personalización Boss Lite

El sistema incluye **9 categorías** de personalización:

1. **🎨 Colores y Temas** - 8 presets + personalización avanzada
2. **🔤 Tipografía** - 8 familias de fuentes + tamaños
3. **📐 Layout y Espaciado** - Márgenes, padding, bordes
4. **🎭 Efectos Visuales** - Gradientes, sombras, shimmer (sin glassmorphism)
5. **🔘 Botones y Controles** - Estilos y animaciones
6. **📊 Tablas y Listas** - Densidad, colores, bordes
7. **📋 Formularios** - Estilos de inputs y validación
8. **🔔 Notificaciones** - Posición, duración, estilos
9. **⚡ Animaciones** - Velocidad, efectos, transiciones

## 🔒 Seguridad

- **Autenticación obligatoria** - Solo correos en whitelist
- **Rules de Firestore** - Acceso granular por usuario/empresa
- **Storage Rules** - Protección de archivos por propietario
- **Validación client-side** y server-side
- **Sanitización de datos** en inputs

## 📱 Responsive Design

- **Mobile-first** approach
- **Breakpoints Material-UI** (xs, sm, md, lg, xl)
- **Componentes adaptativos** automáticos
- **Touch-friendly** en dispositivos móviles
- **PWA ready** - Installable como app

## 🎯 Próximas Características

- [ ] Notificaciones push en tiempo real
- [ ] Exportación de reportes (PDF, Excel)
- [ ] Integración con APIs de bancos
- [ ] Dashboard analytics avanzado
- [ ] Sistema de backup automático
- [ ] Multi-idioma (i18n)

## 👥 Contribución

1. Fork del proyecto
2. Crear feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Proyecto privado para DR Group. Todos los derechos reservados.

## 📞 Contacto

**Proyecto**: DR Group Dashboard  
**Versión**: 1.0.0  
**Desarrollado con**: ❤️ y mucho ☕

---

⭐ **¡Dale una estrella si te gusta el proyecto!** ⭐
