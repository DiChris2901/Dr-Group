# 🎨 DR Group Design System - Guía Rápida

## 📚 Archivos del Design System

### 1. **DESIGN_SYSTEM.md** - Documentación Completa
La "biblia" del diseño con todas las especificaciones, principios y ejemplos.

### 2. **src/utils/designSystem.js** - Componentes Reutilizables
Templates y componentes premium listos para usar.

### 3. **src/theme/premiumTheme.js** - Configuración de Tema
Paleta de colores, tipografía, espaciado y configuración centralizada.

---

## 🚀 Uso Rápido

### Importar Design System
```jsx
import { useTheme } from '@mui/material/styles';
import { 
  PremiumButton, 
  PremiumPaper, 
  animationVariants,
  useThemeGradients 
} from '../utils/designSystem';
```

### Crear Botón Premium
```jsx
<PremiumButton variant="primary" disabled={false}>
  Mi Botón Premium
</PremiumButton>
```

### Usar Gradientes Dinámicos
```jsx
const gradients = useThemeGradients();
// gradients.primary, gradients.info, etc.
```

### Aplicar Animaciones
```jsx
<motion.div {...animationVariants.slideUp}>
  <PremiumPaper type="info">
    Contenido animado
  </PremiumPaper>
</motion.div>
```

---

## ✅ Checklist Antes de Crear Componentes

- [ ] ¿Revisé el **DESIGN_SYSTEM.md**?
- [ ] ¿Uso `theme.palette` para colores?
- [ ] ¿Incluyo micro-interacciones con Framer Motion?
- [ ] ¿Funciona en modo claro y oscuro?
- [ ] ¿Sigo los patrones de espaciado estándar?
- [ ] ¿Implementé estados disabled correctamente?

---

## 🎯 Nivel de Calidad: **10/10 Enterprise**

Todos los componentes deben alcanzar calidad enterprise comparable a:
- Notion, Linear, Figma
- Efectos shimmer y micro-interacciones
- Gradientes dinámicos reactivos al tema
- Animaciones suaves tipo spring

---

## 🔧 Quick Start

1. **Consulta** `DESIGN_SYSTEM.md` para principios y patrones
2. **Importa** componentes desde `designSystem.js`
3. **Usa** configuración de `premiumTheme.js`
4. **Aplica** el checklist de calidad
5. **Prueba** en modo claro y oscuro

¡Mantén siempre la consistencia visual! 🌟