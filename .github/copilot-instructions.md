<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# DR Group Dashboard - Instrucciones para Copilot

## Descripción del Proyecto
Este es un dashboard para control de compromisos financieros empresariales desarrollado para DR Group. El sistema permite gestionar compromisos fijos mensuales, pagos, comprobantes y generar reportes con control de acceso basado en roles.

## Stack Tecnológico
- **Frontend**: React 18 + Vite
- **UI Library**: Material-UI (MUI) v5 con tema original spectacular
- **Backend**: Firebase (Firestore + Storage + Authentication)
- **Animaciones**: Framer Motion con efectos visuales avanzados
- **Routing**: React Router DOM
- **Fechas**: date-fns
- **Estilos**: Emotion (styled-components de MUI)

## Estructura del Proyecto
- `src/components/auth/` - Componentes de autenticación
- `src/components/dashboard/` - Componentes del dashboard principal
- `src/components/commitments/` - Gestión de compromisos financieros
- `src/components/reports/` - Reportes y análisis
- `src/components/users/` - Gestión de usuarios y roles
- `src/config/` - Configuración de Firebase y otras
- `src/hooks/` - Custom hooks
- `src/context/` - Context providers (Auth, Theme, etc.)
- `src/utils/` - Utilidades y helpers
- `src/theme/` - Configuración de tema spectacular original

## 🎨 SISTEMA DE DISEÑO ORIGINAL SPECTACULAR

### Gradientes y Efectos Visuales
```jsx
// ✅ Usar gradientes spectacular originales
background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)'

// ✅ Efectos glassmorphism y shimmer permitidos
backdropFilter: 'blur(20px)'
animation: 'shimmer 3s infinite'
```

### Tipografía
```jsx
// ✅ Pesos permitidos (sin restricciones)
fontWeight: 300  // Light
fontWeight: 400  // Regular
fontWeight: 500  // Medium
fontWeight: 600  // Semi-bold
fontWeight: 700  // Bold - PERMITIDO
fontWeight: 800  // Extra-bold - PERMITIDO
fontWeight: 900  // Black - PERMITIDO
```

### Animaciones
```jsx
// ✅ Efectos spectacular completos
transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
initial: { opacity: 0, y: 20, scale: 0.95 }
animate: { opacity: 1, y: 0, scale: 1 }
whileHover={{ scale: 1.05, y: -4 }}
animate={{ rotate: [0, 10, -10, 0] }}
animation: 'shimmer 3s infinite'
```

### Sombras
```jsx
// ✅ Spectacular completas
boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)'  // Glassmorphism
boxShadow: '0 4px 20px rgba(0,0,0,0.12)'         // Soft
boxShadow: '0 8px 25px rgba(0,0,0,0.15)'         // Hover
```

## Patrones de Desarrollo
1. **Componentes Funcionales**: Usar siempre hooks en lugar de class components
2. **Material-UI Spectacular**: Usar sistema de temas spectacular original (src/theme/premiumTheme.js)
3. **Firebase**: Implementar Real-time listeners para datos dinámicos
4. **Autenticación**: Solo correos autorizados, sin registro público
5. **Roles y Permisos**: Implementar sistema granular de permisos por empresa
6. **Responsive**: Diseño mobile-first con breakpoints de MUI
7. **Animaciones Spectacular**: Efectos shimmer, gradientes y micro-interacciones
8. **Tema Spectacular**: Soporte para modo claro/oscuro con efectos visuales premium

## Funcionalidades Principales
- Autenticación con Firebase Auth (solo correos autorizados)
- Dashboard con métricas de compromisos financieros
- CRUD de compromisos con archivos adjuntos
- Sistema de reportes filtrable por empresa/fecha
- Gestión de usuarios con roles y permisos
- Alertas de compromisos próximos a vencer
- Perfil de usuario con foto y preferencias

## Buenas Prácticas Original Spectacular Design
- **Seguir DESIGN_SYSTEM.md** al pie de la letra
- **Usar theme.palette** en lugar de colores hardcodeados
- **Efectos visuales spectacular**: Shimmer, glassmorphism y gradientes permitidos
- **Mantener elegancia empresarial**: Diseño corporativo spectacular y profesional
- Implementar loading states y error boundaries elegantes
- Validación de formularios con react-hook-form si es necesario
- Optimización de imágenes y archivos
- Implementar Progressive Web App (PWA) features
- Usar lazy loading para componentes pesados
- Seguir principios de accesibilidad (a11y)

## Firebase Collections Structure
- `users` - Información de usuarios, roles y permisos
- `companies` - Datos de empresas
- `commitments` - Compromisos financieros
- `payments` - Pagos realizados
- `files` - Metadatos de archivos/comprobantes
- `notifications` - Sistema de notificaciones
