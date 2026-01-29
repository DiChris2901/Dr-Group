# 📚 Librerías Recomendadas - Ultra Modern Design System

**Versión:** 1.0.0  
**Fecha:** Enero 2026  
**Proyecto:** DR Group Dashboard

---

## 📋 Índice
1. [Stack Core](#stack-core)
2. [UI & Componentes](#ui--componentes)
3. [Animaciones](#animaciones)
4. [Visualización de Datos](#visualización-de-datos)
5. [Utilidades](#utilidades)
6. [Formato y Exportación](#formato-y-exportación)
7. [Desarrollo y Testing](#desarrollo-y-testing)

---

## 🎯 Stack Core

### **React 18+**
```bash
npm install react@^18.3.1 react-dom@^18.3.1
```
**¿Por qué?**
- Concurrent rendering para mejor performance
- Automatic batching para múltiples setStates
- Suspense para lazy loading elegante
- Server Components (futuro)

---

### **Vite 5+**
```bash
npm install vite@^5.4.11 @vitejs/plugin-react@^4.0.0
```
**¿Por qué?**
- HMR ultra rápido (< 100ms)
- Build optimizado con Rollup
- Smaller bundle size vs Webpack
- Native ESM support

---

### **TypeScript (Opcional pero recomendado)**
```bash
npm install --save-dev typescript @types/react @types/react-dom
```
**¿Por qué?**
- Type safety para código más robusto
- Mejor autocomplete en VS Code
- Refactoring más seguro
- Documentación implícita

---

## 🎨 UI & Componentes

### **Material-UI (MUI) v5+ - CORE**
```bash
npm install @mui/material@^5.15.0 @emotion/react @emotion/styled
npm install @mui/icons-material@^5.15.0
```
**¿Por qué?**
- Sistema de theming robusto
- 60+ componentes pre-built
- Customización total con `sx` prop
- Excelente accesibilidad (ARIA)
- TypeScript nativo

**Configuración:**
```javascript
import { createTheme, ThemeProvider } from '@mui/material/styles';

const ultraModernTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#0ea5e9' },
    secondary: { main: '#8b5cf6' },
    background: {
      default: '#0a0e27',
      paper: 'rgba(15, 23, 42, 0.6)',
    },
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
  },
  shape: {
    borderRadius: 20,
  },
});
```

---

### **Framer Motion - ANIMACIONES**
```bash
npm install framer-motion@^10.16.16
```
**¿Por qué?**
- Animaciones declarativas
- Stagger animations out-of-the-box
- Drag and drop
- Layout animations automáticas
- Performance optimizada (GPU-accelerated)

**Uso típico:**
```jsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 30 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6 }}
>
  {/* Content */}
</motion.div>
```

**Stagger children:**
```jsx
const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

<motion.div variants={container}>
  {items.map(item => (
    <motion.div variants={itemVariants}>
      {item}
    </motion.div>
  ))}
</motion.div>
```

---

### **React Router v6 - NAVEGACIÓN**
```bash
npm install react-router-dom@^6.20.1
```
**¿Por qué?**
- Routing declarativo
- Nested routes
- Lazy loading de páginas
- Protección de rutas fácil

---

## 📊 Visualización de Datos

### **Recharts - GRÁFICOS PRIMARIOS**
```bash
npm install recharts@^2.12.7
```
**¿Por qué?**
- Sintaxis React-like (componentes)
- Responsive automático
- Animaciones fluidas
- Customización total
- Menor bundle size que Chart.js

**Uso típico:**
```jsx
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

<ResponsiveContainer width="100%" height={300}>
  <AreaChart data={data}>
    <defs>
      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
      </linearGradient>
    </defs>
    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
    <XAxis dataKey="name" stroke="#64748b" />
    <YAxis stroke="#64748b" />
    <Tooltip 
      contentStyle={{ 
        background: 'rgba(15, 23, 42, 0.95)', 
        border: '1px solid rgba(148, 163, 184, 0.15)',
        borderRadius: '12px'
      }} 
    />
    <Area type="monotone" dataKey="value" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorRevenue)" />
  </AreaChart>
</ResponsiveContainer>
```

**Tipos de gráficos disponibles:**
- LineChart (tendencias)
- AreaChart (métricas acumuladas)
- BarChart (comparaciones)
- PieChart (proporciones)
- RadarChart (perfiles)
- ComposedChart (combinación)

---

### **Victory (Alternativa a Recharts)**
```bash
npm install victory@^36.9.0
```
**¿Por qué?**
- Animaciones más suaves
- Mayor control visual
- Theming más robusto
- Mejor para gráficos complejos

**Desventajas:**
- Bundle size mayor
- Sintaxis más compleja

**Recomendación:** Usar Recharts para la mayoría de casos, Victory solo si necesitas animaciones muy específicas.

---

## 🔥 Formato y Exportación

### **ExcelJS - EXPORTACIÓN PROFESIONAL**
```bash
npm install exceljs@^4.4.0
```
**¿Por qué?**
- Formato completo (colores, fuentes, bordes)
- Fórmulas y validaciones
- Merge cells
- Freeze panes
- Auto-filter
- No requiere backend

**Ejemplo completo:** Ver `docs/Rediseño/EXCEL_EXPORT_ULTRA_MODERN.md`

---

### **jsPDF + jsPDF-AutoTable - PDF**
```bash
npm install jspdf@^2.5.1 jspdf-autotable@^3.8.2
```
**¿Por qué?**
- Generación PDF client-side
- Tablas automáticas
- Custom headers/footers
- Imágenes y logos

**Uso típico:**
```javascript
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const exportToPDF = (data) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFillColor(14, 165, 233);
  doc.rect(0, 0, 210, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text('DR GROUP - REPORTE', 105, 18, { align: 'center' });
  
  // Tabla
  doc.autoTable({
    head: [['Empresa', 'Concepto', 'Monto', 'Estado']],
    body: data.map(item => [
      item.empresa,
      item.concepto,
      `$${item.monto.toLocaleString()}`,
      item.estado
    ]),
    startY: 35,
    theme: 'grid',
    headStyles: {
      fillColor: [139, 92, 246],
      fontSize: 11,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
  });
  
  doc.save('reporte.pdf');
};
```

---

### **date-fns - MANEJO DE FECHAS**
```bash
npm install date-fns@^4.1.0
```
**¿Por qué?**
- Modular (tree-shakeable)
- Inmutable (no muta fechas originales)
- TypeScript support
- Locale support (español)
- Menor bundle size que Moment.js

**Uso típico:**
```javascript
import { format, formatDistance, isAfter, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

// Formateo
format(new Date(), 'PPP', { locale: es }); // "11 de enero de 2026"

// Distancia relativa
formatDistance(fecha, new Date(), { addSuffix: true, locale: es }); // "hace 3 días"

// Comparaciones
isAfter(fechaVencimiento, new Date()); // true/false

// Manipulación
addDays(new Date(), 7); // +7 días
```

---

## 🛠️ Utilidades

### **React Hook Form - FORMS**
```bash
npm install react-hook-form@^7.49.0
```
**¿Por qué?**
- Performance (uncontrolled inputs)
- Validaciones integradas
- TypeScript support
- Menor re-renders
- Integración con MUI

**Uso típico:**
```jsx
import { useForm, Controller } from 'react-hook-form';
import { TextField } from '@mui/material';

const { control, handleSubmit } = useForm();

const onSubmit = (data) => {
  console.log(data);
};

<form onSubmit={handleSubmit(onSubmit)}>
  <Controller
    name="empresa"
    control={control}
    rules={{ required: 'Campo requerido' }}
    render={({ field, fieldState }) => (
      <TextField
        {...field}
        label="Empresa"
        error={!!fieldState.error}
        helperText={fieldState.error?.message}
        fullWidth
      />
    )}
  />
</form>
```

---

### **Zod - VALIDACIONES**
```bash
npm install zod@^3.22.0
```
**¿Por qué?**
- Schema validation type-safe
- Integración con React Hook Form
- Runtime + compile-time validation
- Mensajes de error personalizables

**Uso típico:**
```javascript
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  empresa: z.string().min(1, 'Empresa requerida'),
  monto: z.number().positive('Monto debe ser positivo'),
  fecha: z.date(),
});

const { control } = useForm({
  resolver: zodResolver(schema)
});
```

---

### **Axios - HTTP REQUESTS**
```bash
npm install axios@^1.6.0
```
**¿Por qué?**
- Request/response interceptors
- Automatic JSON parsing
- Cancel requests
- Error handling robusto
- TypeScript support

**Configuración:**
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
});

// Interceptor para loading states
api.interceptors.request.use((config) => {
  store.dispatch(setLoading(true));
  return config;
});

api.interceptors.response.use(
  (response) => {
    store.dispatch(setLoading(false));
    return response;
  },
  (error) => {
    store.dispatch(setLoading(false));
    // Handle error
    return Promise.reject(error);
  }
);
```

---

### **React Query (TanStack Query) - DATA FETCHING**
```bash
npm install @tanstack/react-query@^5.0.0
```
**¿Por qué?**
- Caching automático
- Refetch on window focus
- Optimistic updates
- Infinite scrolling
- Mejor que Redux para data fetching

**Uso típico:**
```jsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Fetch data
const { data, isLoading, error } = useQuery({
  queryKey: ['commitments'],
  queryFn: () => fetchCommitments(),
  staleTime: 5 * 60 * 1000, // 5 minutos
});

// Mutation
const queryClient = useQueryClient();
const mutation = useMutation({
  mutationFn: (newCommitment) => createCommitment(newCommitment),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['commitments'] });
  },
});
```

---

## 🔍 PDF Viewer

### **react-pdf**
```bash
npm install react-pdf@^7.5.0
```
**¿Por qué?**
- Renderizado nativo en React
- Zoom y navegación built-in
- Worker support para performance
- TypeScript support

**Configuración:**
```jsx
import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const [numPages, setNumPages] = useState(null);
const [pageNumber, setPageNumber] = useState(1);

<Document
  file={pdfUrl}
  onLoadSuccess={({ numPages }) => setNumPages(numPages)}
>
  <Page pageNumber={pageNumber} scale={1.0} />
</Document>
```

**Ejemplo completo:** Ver `docs/Rediseño/PDF_VIEWER_ULTRA_MODERN.md`

---

## 🎬 Animaciones Avanzadas

### **GSAP (Alternativa a Framer Motion)**
```bash
npm install gsap@^3.12.0
```
**¿Por qué?**
- Animaciones más complejas
- Scroll-triggered animations
- Morphing de SVGs
- Mejor performance en móviles

**Desventajas:**
- Sintaxis imperativa (no declarativa)
- Menos "React-like"

**Recomendación:** Usar Framer Motion para mayoría de casos, GSAP solo para animaciones muy específicas (parallax, scroll effects).

---

### **React Spring (Alternativa física)**
```bash
npm install react-spring@^9.7.0
```
**¿Por qué?**
- Animaciones basadas en física
- Spring naturals
- Gestures y drag

**Desventajas:**
- API más compleja
- Menor comunidad que Framer Motion

---

## 🔐 Estado Global

### **Zustand - STATE MANAGEMENT**
```bash
npm install zustand@^4.4.0
```
**¿Por qué?**
- Más simple que Redux
- No requiere Context API
- TypeScript friendly
- DevTools support
- Menor boilerplate

**Uso típico:**
```javascript
import { create } from 'zustand';

const useStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  commitments: [],
  addCommitment: (commitment) => set((state) => ({
    commitments: [...state.commitments, commitment]
  })),
}));

// En componente
const user = useStore((state) => state.user);
const setUser = useStore((state) => state.setUser);
```

**Alternativa:** Context API de React (suficiente para proyectos pequeños)

---

## 🧪 Testing

### **Vitest - UNIT TESTS**
```bash
npm install --save-dev vitest @vitest/ui
```
**¿Por qué?**
- Compatible con Vite (misma config)
- Más rápido que Jest
- API similar a Jest
- Watch mode instantáneo

---

### **React Testing Library**
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom
```
**¿Por qué?**
- Testing desde perspectiva del usuario
- Mejor que Enzyme
- Recomendado por React team

---

## 📦 Build y Optimización

### **Rollup Plugins**
```bash
npm install --save-dev @rollup/plugin-babel @rollup/plugin-commonjs
```
**¿Por qué?**
- Tree shaking automático
- Code splitting
- Smaller bundle size

---

### **Vite PWA Plugin**
```bash
npm install --save-dev vite-plugin-pwa
```
**¿Por qué?**
- Convertir en PWA
- Service Worker automático
- Offline support
- App-like experience

---

## 🎨 Íconos

### **Material Icons (Incluido en MUI)**
```bash
npm install @mui/icons-material@^5.15.0
```
**¿Por qué?**
- 2000+ iconos
- SVG (escalables)
- Integración con MUI
- Tree-shakeable

---

### **Lucide React (Alternativa moderna)**
```bash
npm install lucide-react@^0.263.0
```
**¿Por qué?**
- Diseño más moderno
- Consistente con tendencias 2026
- Lightweight
- Customizable

---

## 🔄 Actualizaciones en Tiempo Real

### **Firebase v10+**
```bash
npm install firebase@^10.7.1
```
**¿Por qué?**
- Real-time database (Firestore)
- Authentication built-in
- Cloud Storage
- Serverless functions
- Free tier generoso

**Ya implementado en DR Group Dashboard**

---

## 📊 Tabla de Decisiones Rápida

| Necesidad | Librería Recomendada | Alternativa |
|-----------|---------------------|-------------|
| **UI Components** | Material-UI v5 | Chakra UI, Ant Design |
| **Animaciones** | Framer Motion | GSAP, React Spring |
| **Gráficos** | Recharts | Victory, Chart.js |
| **Forms** | React Hook Form | Formik |
| **Validación** | Zod | Yup |
| **HTTP** | Axios | Fetch API |
| **Data Fetching** | React Query | SWR |
| **Estado Global** | Zustand | Redux, Jotai |
| **Fechas** | date-fns | Day.js, Luxon |
| **Excel** | ExcelJS | xlsx |
| **PDF** | jsPDF + react-pdf | pdfmake |
| **Íconos** | Material Icons | Lucide, Heroicons |
| **Testing** | Vitest | Jest |

---

## 🚀 Instalación Completa Recomendada

```bash
# Core
npm install react@^18.3.1 react-dom@^18.3.1
npm install react-router-dom@^6.20.1

# UI & Animaciones
npm install @mui/material@^5.15.0 @emotion/react @emotion/styled
npm install @mui/icons-material@^5.15.0
npm install framer-motion@^10.16.16

# Gráficos
npm install recharts@^2.12.7

# Forms & Validación
npm install react-hook-form@^7.49.0
npm install zod@^3.22.0 @hookform/resolvers/zod

# Data Fetching
npm install axios@^1.6.0
npm install @tanstack/react-query@^5.0.0

# Utilidades
npm install date-fns@^4.1.0
npm install exceljs@^4.4.0
npm install jspdf@^2.5.1 jspdf-autotable@^3.8.2
npm install react-pdf@^7.5.0

# Estado
npm install zustand@^4.4.0

# Firebase (ya instalado)
npm install firebase@^10.7.1

# Dev Dependencies
npm install --save-dev vite@^5.4.11 @vitejs/plugin-react
npm install --save-dev vitest @vitest/ui
npm install --save-dev @testing-library/react @testing-library/jest-dom
```

---

## 🎯 Próximos Pasos

1. **Implementar UltraModernTheme** con MUI
2. **Configurar Framer Motion** para page transitions
3. **Integrar React Query** para data fetching
4. **Crear componentes base** (UltraStatCard, GlassCard, etc.)
5. **Migrar página por página** al nuevo diseño
6. **Testing progresivo** con Vitest
7. **Optimización final** con Vite analyzer

---

**Versión:** 1.0.0  
**Última Actualización:** Enero 2026  
**Total de Librerías Recomendadas:** 25+  
**Bundle Size Estimado:** ~350KB gzipped (optimizado)
