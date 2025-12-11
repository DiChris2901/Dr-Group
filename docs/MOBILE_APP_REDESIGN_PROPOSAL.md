# 🎨 Propuesta de Rediseño Visual: App Móvil "Project Chronos"

## 1. Filosofía de Diseño: "Material You & Contexto"

El objetivo es transformar la aplicación móvil actual (basada en reglas corporativas estrictas) en una experiencia fluida, táctil y personal, inspirada en **Google Material Design 3 (Material You)**.

### 🧬 Pilares de Identidad
La identidad de la app no vendrá solo del color (que es dinámico), sino de la **forma y el movimiento**:
1.  **Superficies Elevadas:** Uso de sombras suaves y capas tonales en lugar de bordes duros.
2.  **Radio Exagerado:** Curvas pronunciadas (`borderRadius: 24-32px`) en tarjetas y botones para una sensación amigable y moderna.
3.  **Tipografía Jerárquica:** Títulos grandes y negritas para guiar la lectura, con abundante espacio negativo.

---

## 2. Sistema de Color e Identidad

### 🎨 Identidad Visual Independiente (Brand Identity)
La aplicación móvil tendrá su propia identidad de marca, **totalmente separada** de las configuraciones personales del dashboard web. Esto garantiza una experiencia unificada, profesional y reconocible para todos los empleados.

### 💎 Paleta de Color "Signature"
Definiremos un color primario único para la aplicación ("Color Semilla") que generará toda la paleta tonal (Material 3).

**Propuestas de Identidad:**

1.  **🔵 Tech Blue (Estilo Google/Enterprise)**
    *   **Semilla:** `#1A73E8` (Azul Google) o `#2563EB` (Royal Blue).
    *   *Vibe:* Confianza, tecnología, claridad, estándar corporativo.

2.  **🟣 Deep Indigo (Estilo Modern SaaS)**
    *   **Semilla:** `#6366F1` (Indigo).
    *   *Vibe:* Premium, moderno, creativo pero serio.

3.  **🟢 Productivity Teal (Estilo Finanzas/Salud)**
    *   **Semilla:** `#0D9488` (Teal).
    *   *Vibe:* Calma, balance, eficiencia, frescura.

*Seleccionaremos uno de estos como el color definitivo de la App.*

### 🌗 Modos de Color
La app soportará nativamente:
*   **Modo Claro:** Superficies blancas/grisáceas con tintes del color marca.
*   **Modo Oscuro:** Superficies gris oscuro/negro profundo (OLED friendly) con acentos del color marca desaturados.

---

## 3. Experiencia de Usuario (Perfil Empleado)

### 🏠 Home: "El Anillo de Estado"
*   **Centro Visual:** Un gráfico circular (Ring Chart) grande y elegante en la parte superior.
    *   *Trabajando:* Se llena progresivamente. Muestra el tiempo transcurrido en tipografía gigante.
    *   *Break:* Cambia de color y pulsa suavemente ("Respirando").
*   **Barra de Acción Flotante:** Reemplaza los botones estáticos. Una barra inferior (tipo píldora) que cambia según el contexto:
    *   *Estado Off:* Botón gigante "👋 Iniciar Jornada".
    *   *Estado On:* Se divide en "☕ Tomar Break" y "🏠 Finalizar".

### 📝 Novedades: "Interacción Conversacional"
*   **Bottom Sheets:** Al reportar, no cambiamos de pantalla. Una hoja desliza desde abajo.
*   **Grid Cards:** Selección de tipo de novedad mediante tarjetas grandes con iconos coloridos y fondos pastel, no listas de texto.
*   **Inputs Invisibles:** Campos de texto con fondo suave y sin bordes, estilo "Google Keep".

### 📅 Historial: "Timeline Visual"
*   Una línea de tiempo vertical conecta los eventos del día.
*   Uso de **Chips** (píldoras) para estados, sin bordes, usando colores de fondo suaves.

---

## 4. Experiencia de Admin (Perfil Gestor)

### 📊 Dashboard: "Torre de Control Zen"
*   **Carrusel de Métricas:** Tarjetas deslizables horizontalmente en el tope.
    *   *"14 Activos"* (Verde) | *"3 Tarde"* (Ámbar) | *"2 Ausentes"* (Rojo).
*   **Inbox Zero:** El cuerpo principal es una lista de tareas pendientes (Novedades por aprobar).
    *   Diseño estilo **Gmail**: Avatar del empleado + Texto en negrita para lo no leído.
    *   Meta: Dejar la lista vacía.

### ⚡ Gestión de Novedades: "Gestos Rápidos"
*   **Swipe Actions:**
    *   Deslizar derecha ➔ **Aprobar** (Fondo Verde).
    *   Deslizar izquierda ➔ **Rechazar/Archivar** (Fondo Rojo).
*   **Filtros Chips:** Fila de filtros horizontales bajo el buscador: `[Todos] [Pendientes] [Urgencias]`.

### 👤 Directorio: "Google Contacts"
*   Lista limpia alfabética con buscador flotante.
*   Al tocar un empleado, se abre un **Bottom Sheet** con su "Ficha Rápida" (Foto, Cargo, Botones de contacto rápido).

---

## 5. Implementación Técnica

Para lograr este look nativo y pulido sin construir todo desde cero:

### 🛠️ Librería Base: `react-native-paper` (v5)
Es la implementación oficial de Material Design 3 para React Native.

### 📦 Componentes Clave
1.  **`<FAB />` (Floating Action Button):** Para acciones principales.
2.  **`<SegmentedButtons />`:** Para selectores y tabs.
3.  **`<Modal />` (Portal):** Para los Bottom Sheets.
4.  **`<Card mode="elevated" />`:** Para contenedores con sombra suave.
5.  **`<Chip />`:** Para filtros y estados.
6.  **`<Avatar />`:** Para listas de usuarios.

### 🔄 Adaptación de Colores (Brand Theme)
```javascript
// Pseudo-código de implementación
const APP_BRAND_COLOR = '#2563EB'; // Color Identidad Definido

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: APP_BRAND_COLOR, 
    // La librería genera automáticamente los tonos derivados
    // primaryContainer, onPrimary, surfaceVariant, etc.
  }
};
```

---

## 6. Avances de Implementación (Diciembre 2025)

### ✅ Hitos Completados
1.  **Migración a Ionicons:**
    *   Se reemplazó `MaterialIcons` por `@expo/vector-icons/Ionicons` como librería estándar.
    *   Solución de conflictos de renderizado y nombres de íconos inválidos.
    *   Implementación de lógica `filled` (activo) vs `outline` (inactivo) en navegación.

2.  **Rediseño de Navegación (BottomTabNavigator):**
    *   Estilo "Flat Design" (Material 3) con fondo blanco y borde superior sutil.
    *   Indicadores de pestaña activa tipo "Píldora" (`borderRadius: 16`).
    *   Soporte completo para Safe Area Insets (iPhone X+ y Android Gestures).
    *   Nuevos íconos: `grid` (Jornada), `calendar` (Calendario), `notifications` (Novedades), `bar-chart` (Reportes), `time` (Historial).

3.  **Pantalla de Historial (Asistencias):**
    *   Rediseño del Modal de Detalle con tarjetas separadas para Usuario/Fecha.
    *   Tarjetas visuales ligeras para Entrada/Salida con iconos `log-in`/`log-out`.
    *   Visualización clara de Breaks y Almuerzos con tiempos calculados.
    *   Corrección de errores de scroll y visualización de avatares.

4.  **Dashboard:**
    *   Reubicación del botón de acción principal ("Iniciar Jornada") a posición flotante inferior derecha.
    *   Integración de botón de cambio de tema (placeholder).

### 🚧 En Progreso
*   Refinamiento de la pantalla de Novedades.
*   Implementación completa del modo oscuro en componentes personalizados.
*   Optimización de tiempos de carga en listas largas.

## 7. Hoja de Ruta Sugerida (Actualizada)

1.  **Fase 1: Cimientos (Completado)**
    *   Instalar `react-native-paper`.
    *   Configurar `PaperProvider` con el sistema de colores dinámicos actual.
    *   Rediseñar pantalla de **Login** para establecer el nuevo tono visual.

2.  **Fase 2: El Empleado (En curso)**
    *   Transformar Dashboard (Anillo de estado).
    *   Implementar Bottom Sheet para Novedades.

3.  **Fase 3: El Admin (Pendiente)**
    *   Crear el "Inbox" de novedades con gestos Swipe.
    *   Implementar el detalle en Bottom Sheet.
