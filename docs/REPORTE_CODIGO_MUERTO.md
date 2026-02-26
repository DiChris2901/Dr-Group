# Reporte de Código Muerto y Recursos No Utilizados

**Proyecto:** DR Group Dashboard v3.15.3
**Fecha de análisis:** 26 de febrero de 2026
**Analizado por:** Claude Code (Opus 4.6)

---

## Resumen Ejecutivo

Se identificaron **~55 archivos** con **~680+ KB** de código muerto distribuidos en 8 categorías. Además, se detectaron **9 dependencias npm** que no están siendo utilizadas en el código fuente, lo que impacta el tamaño del bundle y los tiempos de instalación.

| Categoría                  | Archivos | Tamaño aprox. |
|----------------------------|----------|---------------|
| Hooks sin uso              | 14       | ~52 KB        |
| Componentes sin uso        | 15       | ~150 KB       |
| Página legacy              | 1        | ~163 KB       |
| Servicios/config/utils     | 4        | ~31 KB        |
| Scripts abandonados        | 4        | ~41 KB        |
| Archivos raíz innecesarios | 4        | ~13 KB        |
| Archivos public/ de debug  | 11       | variable      |
| Templates sin uso          | 2        | ~229 KB       |
| **TOTAL**                  | **~55**  | **~680+ KB**  |

---

## 1. Dependencias NPM Sin Uso (9 paquetes)

Estas dependencias están declaradas en `package.json` pero **nunca se importan** en ningún archivo dentro de `src/`.

| Paquete | Versión | Propósito original | Evidencia |
|---------|---------|--------------------|-----------|
| `@google/generative-ai` | ^0.24.1 | Integración con IA generativa de Google | 0 imports en src/ |
| `twilio` | ^5.9.0 | Envío de SMS/notificaciones | 0 imports en src/ |
| `emoji-picker-react` | ^4.14.0 | Selector de emojis para chat | 0 imports en src/ |
| `fuse.js` | ^7.1.0 | Búsqueda fuzzy/difusa | 0 imports en src/ |
| `html2canvas` | ^1.4.1 | Captura de screenshots del DOM | 0 imports en src/ |
| `canvas` | ^3.2.0 | Canvas nativo para Node.js | 0 imports en src/ |
| `baseline-browser-mapping` | ^2.9.19 | (devDep) Mapeo de navegadores | 0 imports |
| `@emotion/react` | ^11.11.1 | CSS-in-JS | Solo uso transitivo por MUI* |
| `@emotion/styled` | ^11.11.0 | CSS-in-JS | Solo uso transitivo por MUI* |

> \* `@emotion/react` y `@emotion/styled` son peer dependencies de MUI. Aunque no se importan directamente, **MUI los requiere**. Se recomienda mantenerlas pero verificar si algún componente las usa directamente.

**Impacto estimado de removerlas:** Reducción significativa en `node_modules` y tiempos de `npm install`.

**Acción recomendada:**
```bash
npm uninstall @google/generative-ai twilio emoji-picker-react fuse.js html2canvas canvas baseline-browser-mapping
```

---

## 2. Hooks Sin Uso (14 archivos - ~52 KB)

Estos hooks custom están definidos en `src/hooks/` pero **ningún componente los importa**.

| Archivo | Tamaño | Función |
|---------|--------|---------|
| `src/hooks/useAsistenciasStats.js` | 2.1 KB | Estadísticas de asistencias |
| `src/hooks/useAudioRecorder.js` | 5.5 KB | Grabación de audio |
| `src/hooks/useDashboardStats.js` | 4.8 KB | Estadísticas del dashboard |
| `src/hooks/useDebounce.js` | 1.2 KB | Debounce genérico |
| `src/hooks/useDueCommitments.js` | 8.9 KB | Compromisos vencidos |
| `src/hooks/useIngresosStats.js` | 1.9 KB | Estadísticas de ingresos |
| `src/hooks/useLiquidacionLogs.js` | 1.4 KB | Logs de liquidaciones |
| `src/hooks/useLiquidacionesStats.js` | 2.1 KB | Estadísticas de liquidaciones |
| `src/hooks/useProfileImage.js` | 3.0 KB | Imagen de perfil |
| `src/hooks/useSystemMonitoring.js` | 3.8 KB | Monitoreo del sistema |
| `src/hooks/useTypingIndicator.js` | 3.2 KB | Indicador de escritura (chat) |
| `src/hooks/useUploadProgress.js` | 2.0 KB | Progreso de subida de archivos |
| `src/hooks/useUserStats.js` | 2.4 KB | Estadísticas de usuario |
| `src/hooks/useUsersCache.js` | 2.0 KB | Caché de usuarios |

**Nota:** Algunos de estos hooks (como `useAudioRecorder`, `useTypingIndicator`) parecen haber sido desarrollados para funcionalidades de chat/mensajería que nunca se integraron completamente.

---

## 3. Componentes Sin Uso (15 archivos - ~150 KB)

### 3.1 Módulo Settings (8 componentes - ~115 KB)

Estos componentes están en `src/components/settings/` pero **no se importan en ninguna página ni componente**.

| Archivo | Tamaño | Función |
|---------|--------|---------|
| `ConfigurationCompatibilityAnalyzer.jsx` | 24.0 KB | Analizador de compatibilidad de configuración |
| `DashboardCustomizer.jsx` | 19.7 KB | Personalizador de dashboard |
| `OfficeThemeCustomizer.jsx` | 17.3 KB | Personalizador de tema de oficina |
| `ThemeCustomizer.jsx` | 18.1 KB | Personalizador de tema general |
| `AccessibilityCustomizer.jsx` | 14.0 KB | Opciones de accesibilidad |
| `SidebarCustomizer.jsx` | 11.4 KB | Personalizador de barra lateral |
| `PDFCompressionSettings.jsx` | 7.4 KB | Configuración de compresión PDF |
| `SettingsButton.jsx` | 3.0 KB | Botón de acceso a settings |

> Estos componentes representan un sistema de personalización completo que fue desarrollado pero **nunca integrado** en la interfaz principal.

### 3.2 Otros Componentes Huérfanos (7 archivos - ~39 KB)

| Archivo | Tamaño | Función |
|---------|--------|---------|
| `src/components/companies/CompanyDetailsModal.jsx` | 15.7 KB | Modal de detalles de empresa |
| `src/components/admin/DataCleanupTool.jsx` | 8.1 KB | Herramienta de limpieza de datos |
| `src/components/commitments/CommitmentCard.jsx` | 8.1 KB | Tarjeta de compromiso |
| `src/components/debug/AddSamplePayments.jsx` | 5.2 KB | Generador de pagos de prueba |
| `src/components/charts/AnalyticsWidgetSummary.jsx` | 1.7 KB | Widget de resumen analítico |
| `src/components/commitments/ImportCommitmentsModal.jsx` | 0 bytes | **ARCHIVO VACÍO** |

---

## 4. Página Legacy (1 archivo - ~163 KB)

| Archivo | Tamaño | Estado |
|---------|--------|--------|
| `src/pages/NewPaymentPage_old.jsx` | 163 KB | Backup de versión anterior, **no registrada en App.jsx** |

Este archivo es una copia de seguridad de `NewPaymentPage.jsx` que quedó en el proyecto después de un refactoring. No tiene ruta asignada en el router.

---

## 5. Servicios, Configuración y Utilidades Sin Uso

| Archivo | Tamaño | Función | Evidencia |
|---------|--------|---------|-----------|
| `src/services/aiDataService.js` | 14 KB | Servicio de integración con IA para análisis de datos | 0 imports en src/ |
| `src/config/chatGroups.js` | 1.2 KB | Definición de grupos para funcionalidad de chat | 0 imports en src/ |
| `src/config/notificationTypes.js` | 14 KB | Tipos y configuración de notificaciones | 0 imports en src/ |
| `src/utils/salarioMinimo.js` | 2 KB | Utilidad para cálculos con salario mínimo | 0 imports en src/ |

---

## 6. Scripts de Refactoring Abandonados (4 archivos - ~41 KB)

Estos scripts en `scripts/` fueron creados para refactorizaciones que ya se completaron o se abandonaron.

| Archivo | Tamaño | Propósito |
|---------|--------|-----------|
| `scripts/extract-edit-dialog.ps1` | 4.9 KB | Extracción de diálogo de edición (PowerShell) |
| `scripts/refactor-god-components.cjs` | 11.0 KB | Refactoring de "god components" |
| `scripts/refactor-liquidaciones.cjs` | 7.2 KB | Refactoring del módulo de liquidaciones |
| `scripts/refactor-payments.cjs` | 18.0 KB | Refactoring del módulo de pagos |

---

## 7. Archivos Raíz Innecesarios

| Archivo | Tamaño | Problema |
|---------|--------|---------|
| `build.gradle.new` | 8.2 KB | Duplicado/borrador de `build.gradle` |
| `cors.json` | 370 bytes | No referenciado por ningún script o configuración |
| `logo_concepts.html` | 4.6 KB | Archivo de diseño/conceptos de logo |
| `{` | 0 bytes | Archivo vacío con nombre inválido (probablemente creado por error) |

---

## 8. Archivos en public/ de Debug/Mockup (11 archivos)

Estos archivos en `public/` son herramientas de depuración, mockups o scripts de inicialización que **no deberían estar en producción**.

### Mockups HTML
| Archivo | Propósito |
|---------|-----------|
| `public/dashboard-mockup.html` | Mockup del dashboard |
| `public/mockup-newpayment-redesign.html` | Mockup del rediseño de pagos |
| `public/mockup-commitments-ultra.html` | Mockup de compromisos |
| `public/mockup-ultra-modern.html` | Mockup de estilo ultra moderno |

### Scripts de Debug/Inicialización
| Archivo | Propósito |
|---------|-----------|
| `public/fix-user-names.html` | Corrección de nombres de usuario |
| `public/debug-permissions-user.js` | Debug de permisos |
| `public/init-dashboard-stats.js` | Inicialización de stats |
| `public/INIT_COUNTERS.js` | Inicialización de contadores |
| `public/init-counters.html` | Interfaz para inicializar contadores |

### Service Workers redundantes
| Archivo | Propósito |
|---------|-----------|
| `public/sw-simple.js` | Service worker simplificado |
| `public/firebase-cache-sw.js` | Service worker de caché Firebase |

> El proyecto ya usa `vite-plugin-pwa` para generar service workers. Estos archivos manuales pueden causar conflictos.

---

## 9. Reglas Firestore Sin Colecciones en Código

Las siguientes colecciones tienen reglas definidas en `firestore.rules` pero **no se referencian en el código fuente**:

| Colección | Tipo de regla |
|-----------|---------------|
| `appVersions` | read/write |
| `appConfig` | read/write |
| `PermissionsApp` | read/write |
| `chat_notifications` | read/write |
| `messages` | read/write |

> **Precaución:** Algunas de estas colecciones podrían estar siendo usadas por Firebase Cloud Functions o por procesos externos. Verificar antes de eliminar las reglas.

---

## 10. Issue Crítico: Script NPM Roto

El archivo `src/utils/tokenValidator.js` está referenciado en 3 scripts de `package.json` pero **no existe**:

```json
"validate-tokens": "node src/utils/tokenValidator.js",
"pre-commit": "npm run validate-tokens",
"lint:tokens": "node src/utils/tokenValidator.js --fix"
```

**Impacto:** Los comandos `npm run validate-tokens`, `npm run pre-commit` y `npm run lint:tokens` **fallarán con error**.

**Acción recomendada:** Crear el archivo o eliminar los scripts del `package.json`.

---

## 11. Templates Email Sin Uso (2 archivos - ~229 KB)

| Archivo | Tamaño |
|---------|--------|
| `templates/email-template.html` | ~200 KB |
| `templates/commitment-notification.html` | ~29 KB |

Estos templates HTML para correos electrónicos no están referenciados en el código fuente del proyecto.

---

## Plan de Limpieza Recomendado

### Fase 1 - Riesgo Bajo (eliminar inmediatamente)
1. Eliminar archivo `{` (vacío, nombre inválido)
2. Eliminar `build.gradle.new` (duplicado)
3. Eliminar `src/pages/NewPaymentPage_old.jsx` (backup legacy)
4. Eliminar `src/components/commitments/ImportCommitmentsModal.jsx` (vacío)
5. Eliminar mockups y debug files de `public/`
6. Eliminar scripts de refactoring en `scripts/`

### Fase 2 - Riesgo Medio (revisar antes de eliminar)
1. Eliminar hooks sin uso
2. Eliminar componentes huérfanos de settings
3. Eliminar componentes huérfanos varios
4. Eliminar servicios y configs sin uso
5. Remover dependencias npm no usadas

### Fase 3 - Riesgo Alto (requiere verificación)
1. Verificar reglas Firestore vs Cloud Functions antes de eliminar
2. Decidir qué hacer con los scripts npm rotos (`tokenValidator.js`)
3. Verificar si `@emotion/*` puede removerse sin romper MUI
4. Verificar templates email (podrían usarse externamente)

---

## Ahorro Estimado

- **Código fuente:** ~680 KB de archivos eliminables
- **node_modules:** Reducción significativa al eliminar 7 dependencias innecesarias
- **Bundle de producción:** Reducción si alguna dependencia no usada se incluye en el tree-shaking
- **Mantenibilidad:** Menos archivos = menos confusión para el equipo de desarrollo

---

*Documento generado automáticamente. Se recomienda revisión manual antes de ejecutar eliminaciones.*
