import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Button,
  IconButton,
  Chip,
  Avatar,
  Switch,
  Slider,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  LinearProgress,
  CircularProgress,
  Fab,
  Badge,
  Tooltip,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemAvatar,
  Stepper,
  Step,
  StepLabel,
  Tabs,
  Tab,
  Skeleton,
  AvatarGroup,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  BottomNavigation,
  BottomNavigationAction,
  AppBar,
  Toolbar,
  Pagination,
  FormGroup,
  FormControlLabel,
  InputAdornment,
  Radio,
  RadioGroup,
  Autocomplete,
  FormHelperText
} from '@mui/material';
import {
  Dashboard,
  Settings,
  Notifications,
  Person,
  Business,
  Analytics,
  Palette,
  Security,
  Favorite,
  Star,
  Add,
  Edit,
  Delete,
  Info,
  Warning,
  Error,
  CheckCircle,
  Menu,
  Search,
  ArrowBack,
  MoreVert,
  Home,
  AccountCircle,
  FilterList,
  Sort,
  Close,
  Save,
  Cancel,
  Email,
  Phone,
  LocationOn,
  Work,
  School,
  ShoppingCart,
  AttachMoney,
  TrendingUp,
  People,
  Assignment,
  Today,
  EventNote,
  CloudDownload,
  CloudUpload,
  Print,
  Share,
  Launch,
  Refresh,
  Visibility,
  VisibilityOff,
  Lock,
  LockOpen,
  ThumbUp,
  ThumbDown,
  BookmarkBorder,
  Bookmark,
  FavoriteBorder,
  Chat,
  Comment,
  Flag,
  Archive,
  Report,
  Block,
  MoreHoriz,
  CalendarToday,
  Description,
  Repeat,
  NotificationImportant,
  Assessment,
  AccountBalance,
  Payment,
  Schedule,
  Sync,
  Cloud,
  Brightness4,
  Receipt,
  ExitToApp,
  AccountBalanceWallet,
  AutoAwesome,
  Rocket,
  Accessibility,
  // Iconos adicionales para Feedback
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  AccessTime as AccessTimeIcon,
  Autorenew as AutorenewIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@mui/material/styles';
import { cardsUtils, unifiedTokens, tokenUtils } from '../theme/tokens';
import { useTokens, useTableTokens } from '../hooks/useTokens';
import FormulariosUnificadosSimple from '../components/FormulariosUnificadosSimple';
import ModalesUnifiedPage from './DesignSystemTest/ModalsUnifiedPage';

const DesignSystemTestPage = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState('colors');
  const [switchValue, setSwitchValue] = useState(false);
  const [sliderValue, setSliderValue] = useState(50);
  const [selectValue, setSelectValue] = useState('option1');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [orderBy, setOrderBy] = useState('name');
  const [order, setOrder] = useState('asc');
  const [selected, setSelected] = useState([]);
  // Estados para formularios
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    amount: '',
    dueDate: '',
    priority: 'media',
    description: '',
    isRecurring: false,
    hasReminder: true,
    autoApproval: false,
    submitted: false,
    type: 'fijo',
    urgency: 'normal',
    department: '',
    message: '',
    notifications: true,
    marketing: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [drawerSection, setDrawerSection] = useState('profile');

  // Gradientes actuales del sistema (ANTES - Muy vibrantes)
  const gradients = {
    primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    success: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    warning: 'linear-gradient(135deg, #ffb347 0%, #ffcc33 100%)',
    error: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
    info: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
    dark: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)'
  };

  // Gradientes del sistema DR Group
  const gradientsSystem = gradients;

  // Sombras del sistema
  const shadows = {
    soft: '0 4px 20px rgba(0,0,0,0.12)',
    medium: '0 8px 25px rgba(0,0,0,0.15)',
    strong: '0 12px 40px rgba(0,0,0,0.2)'
  };

  // Datos de ejemplo para tablas
  const tableData = [
    { 
      id: 1, 
      name: 'DR GROUP SAS', 
      nit: '900123456-7', 
      commitment: 'Arriendo Local', 
      amount: 2500000, 
      dueDate: '2025-08-15',
      status: 'Pendiente',
      priority: 'Alta'
    },
    { 
      id: 2, 
      name: 'CONSTRUCTORA ELITE', 
      nit: '800987654-3', 
      commitment: 'Préstamo Bancario', 
      amount: 15000000, 
      dueDate: '2025-08-20',
      status: 'Pagado',
      priority: 'Media'
    },
    { 
      id: 3, 
      name: 'INVERSIONES XYZ', 
      nit: '901234567-8', 
      commitment: 'Servicios Públicos', 
      amount: 850000, 
      dueDate: '2025-08-10',
      status: 'Vencido',
      priority: 'Crítica'
    },
    { 
      id: 4, 
      name: 'COMERCIAL ABC', 
      nit: '700456789-2', 
      commitment: 'Nómina Empleados', 
      amount: 12000000, 
      dueDate: '2025-08-25',
      status: 'Pendiente',
      priority: 'Alta'
    },
    { 
      id: 5, 
      name: 'TECH SOLUTIONS', 
      nit: '890123456-4', 
      commitment: 'Impuestos Gobierno', 
      amount: 3200000, 
      dueDate: '2025-08-12',
      status: 'Procesando',
      priority: 'Media'
    }
  ];

  // Funciones para manejo de tabla
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelecteds = tableData.map((n) => n.id);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };

  const handleClick = (id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }

    setSelected(newSelected);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatCOP = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pagado': return 'success';
      case 'Pendiente': return 'warning';
      case 'Vencido': return 'error';
      case 'Procesando': return 'info';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Crítica': return 'error';
      case 'Alta': return 'warning';
      case 'Media': return 'info';
      case 'Baja': return 'success';
      default: return 'default';
    }
  };

  const tabs = [
    { id: 'colors', label: 'Colores y Gradientes', icon: <Dashboard /> },
    { id: 'typography', label: 'Tipografía', icon: <Analytics /> },
    { id: 'icons', label: 'Iconos', icon: <Star /> },
    { id: 'headers', label: 'Headers', icon: <Dashboard /> },
    { id: 'buttons', label: 'Botones', icon: <Settings /> },
    { id: 'cards', label: 'Cards y Contenedores', icon: <Business /> },
    { id: 'tables', label: 'Tablas', icon: <Analytics /> },
    { id: 'forms', label: 'Formularios', icon: <Edit /> },
    { id: 'modals', label: 'Modales y Diálogos', icon: <Info /> },
    { id: 'data-display', label: 'Data Display', icon: <People /> },
    { id: 'loading', label: 'Estados de Carga', icon: <TrendingUp /> },
    { id: 'animations', label: 'Animaciones', icon: <Star /> },
    { id: 'feedback', label: 'Feedback', icon: <Notifications /> }
  ];

  const renderColorSection = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h4" gutterBottom>
          🎨 Colores y Gradientes
        </Typography>
      </Grid>
      
      {/* Gradientes Finales (Full & Soft) */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>Gradientes Finales (Full & Soft)</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Versión depurada; estos reemplazan por completo los anteriores.
        </Typography>
        <Grid container spacing={2}>
          {/* Primary */}
          <Grid item xs={12} sm={6} md={4}>
            <Box sx={{ height: 100, mb: 1, borderRadius: 2, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:15, fontWeight:600, boxShadow: shadows.soft, background: theme.custom.gradientsV2.primary.full }}>primary full</Box>
            <Box sx={{ height: 70, borderRadius: 2, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:12, fontWeight:500, background: theme.custom.gradientsV2.primary.soft }}>primary soft</Box>
          </Grid>
          {/* Secondary */}
          <Grid item xs={12} sm={6} md={4}>
            <Box sx={{ height: 100, mb: 1, borderRadius: 2, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:15, fontWeight:600, boxShadow: shadows.soft, background: theme.custom.gradientsV2.secondary.full }}>secondary full</Box>
            <Box sx={{ height: 70, borderRadius: 2, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:12, fontWeight:500, background: theme.custom.gradientsV2.secondary.soft }}>secondary soft</Box>
          </Grid>
          {/* Success */}
            <Grid item xs={12} sm={6} md={4}>
            <Box sx={{ height: 100, mb: 1, borderRadius: 2, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:15, fontWeight:600, boxShadow: shadows.soft, background: theme.custom.gradientsV2.success.full }}>success full</Box>
            <Box sx={{ height: 70, borderRadius: 2, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:12, fontWeight:500, background: theme.custom.gradientsV2.success.soft }}>success soft</Box>
          </Grid>
          {/* Warning */}
          <Grid item xs={12} sm={6} md={4}>
            <Box sx={{ height: 100, mb: 1, borderRadius: 2, display:'flex', alignItems:'center', justifyContent:'center', color:'#402d00', fontSize:15, fontWeight:600, boxShadow: shadows.soft, background: theme.custom.gradientsV2.warning.full }}>warning full</Box>
            <Box sx={{ height: 70, borderRadius: 2, display:'flex', alignItems:'center', justifyContent:'center', color:'#402d00', fontSize:12, fontWeight:500, background: theme.custom.gradientsV2.warning.soft }}>warning soft</Box>
          </Grid>
          {/* Error */}
          <Grid item xs={12} sm={6} md={4}>
            <Box sx={{ height: 100, mb: 1, borderRadius: 2, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:15, fontWeight:600, boxShadow: shadows.soft, background: theme.custom.gradientsV2.error.full }}>error full</Box>
            <Box sx={{ height: 70, borderRadius: 2, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:12, fontWeight:500, background: theme.custom.gradientsV2.error.soft }}>error soft</Box>
          </Grid>
          {/* Info */}
          <Grid item xs={12} sm={6} md={4}>
            <Box sx={{ height: 100, mb: 1, borderRadius: 2, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:15, fontWeight:600, boxShadow: shadows.soft, background: theme.custom.gradientsV2.info.full }}>info full</Box>
            <Box sx={{ height: 70, borderRadius: 2, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:12, fontWeight:500, background: theme.custom.gradientsV2.info.soft }}>info soft</Box>
          </Grid>
          {/* Dark */}
          <Grid item xs={12} sm={6} md={4}>
            <Box sx={{ height: 100, mb: 1, borderRadius: 2, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:15, fontWeight:600, boxShadow: shadows.soft, background: theme.custom.gradientsV2.dark.full }}>dark full</Box>
            <Box sx={{ height: 70, borderRadius: 2, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:12, fontWeight:500, background: theme.custom.gradientsV2.dark.soft }}>dark soft</Box>
          </Grid>
        </Grid>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display:'block' }}>
          full: para bloques protagonistas (hero, headers) • soft: para fondos amplios / tarjetas destacadas.
        </Typography>
      </Grid>

      {/* Tema MUI */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>Colores del Tema Material-UI</Typography>
        <Grid container spacing={2}>
          {['primary', 'secondary', 'success', 'warning', 'error', 'info'].map((color) => (
            <Grid item xs={12} sm={6} md={2} key={color}>
              <Box
                sx={{
                  height: 80,
                  backgroundColor: theme.palette[color].main,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: theme.palette[color].contrastText,
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  mb: 1
                }}
              >
                {color}
              </Box>
              <Typography variant="caption" display="block" align="center">
                {theme.palette[color].main}
              </Typography>
            </Grid>
          ))}
        </Grid>
      </Grid>
    </Grid>
  );

  const renderTypographySection = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h4" gutterBottom>📝 Tipografía</Typography>
      </Grid>
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Escala Tipográfica 3.0 (Vista Previa)</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Jerarquía final propuesta antes de tokenizar en el theme.
          </Typography>
          {[ 
            { key: 'display2xl', label: 'Display 2XL', sample: 'Visión Financiera Consolidada', size: '3.5rem', lh: 1.1, weight: 800, ls: '-0.5px', note: 'Solo portada / hero' },
            { key: 'displayXl', label: 'Display XL', sample: 'Resumen Ejecutivo Mensual', size: '3rem', lh: 1.12, weight: 800, ls: '-0.5px', note: 'Encabezados de secciones principales' },
            { key: 'h1', label: 'H1', sample: 'Panel de Indicadores', size: '2.5rem', lh: 1.18, weight: 700, ls: '-0.5px', note: 'Título página interna' },
            { key: 'h2', label: 'H2', sample: 'Compromisos Activos', size: '2rem', lh: 1.2, weight: 700, ls: '-0.25px', note: 'Subsección principal' },
            { key: 'h3', label: 'H3', sample: 'Detalle de Pagos', size: '1.75rem', lh: 1.25, weight: 600, ls: '-0.25px', note: 'Bloques dentro de secciones' },
            { key: 'h4', label: 'H4', sample: 'Alertas Recientes', size: '1.5rem', lh: 1.28, weight: 600, ls: '-0.25px', note: 'Encabezado widget' },
            { key: 'h5', label: 'H5', sample: 'Total Vencido', size: '1.25rem', lh: 1.32, weight: 600, ls: '-0.15px', note: 'Titular compacto' },
            { key: 'h6', label: 'H6', sample: 'Meta de Cobranza', size: '1.125rem', lh: 1.35, weight: 600, ls: '-0.15px', note: 'Etiqueta subsección menor' },
            { key: 'bodyLg', label: 'Body L', sample: 'Texto descriptivo destacado para paneles explicativos o resúmenes ejecutivos.', size: '1.125rem', lh: 1.55, weight: 400, ls: '0', note: 'Parrafos destacados' },
            { key: 'body', label: 'Body', sample: 'Texto base para la mayoría de contenidos y listados con buena legibilidad.', size: '1rem', lh: 1.55, weight: 400, ls: '0', note: 'Texto estándar' },
            { key: 'bodySm', label: 'Body S', sample: 'Texto secundario o densidad alta en tablas.', size: '0.875rem', lh: 1.5, weight: 400, ls: '0', note: 'Secundario / tablas' },
            { key: 'label', label: 'Label', sample: 'Etiqueta de campo / filtro', size: '0.8125rem', lh: 1.35, weight: 500, ls: '0.5px', note: 'Form labels' },
            { key: 'overline', label: 'Overline', sample: 'CATEGORÍA / AGRUPADOR', size: '0.6875rem', lh: 1.3, weight: 600, ls: '0.12em', note: 'Agrupadores superiores' },
            { key: 'caption', label: 'Caption', sample: 'Texto auxiliar y notas contextuales.', size: '0.75rem', lh: 1.4, weight: 400, ls: '0', note: 'Notas / ayuda' },
            { key: 'code', label: 'Code', sample: 'payment.status === "late"', size: '0.8125rem', lh: 1.45, weight: 500, ls: '0', mono: true, note: 'Snippets técnicos' },
            { key: 'numeric', label: 'Numeric', sample: '1,254,890.55', size: '1.25rem', lh: 1.2, weight: 600, ls: '0', note: 'KPIs / métricas' }
          ].map(row => (
            <Box key={row.key} sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { sm: 'flex-end' },
              gap: 1.5,
              py: 1.2,
              borderBottom: '1px solid',
              borderColor: 'divider'
            }}>
              <Box sx={{
                flex: 1,
                fontSize: row.size,
                lineHeight: row.lh,
                fontWeight: row.weight,
                letterSpacing: row.ls,
                fontFamily: row.mono ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : undefined
              }}>
                {row.sample}
              </Box>
              <Box sx={{ minWidth: 210, fontSize: '0.70rem', color: 'text.secondary', display: 'flex', flexDirection: 'column', gap: 0.4 }}>
                <Box><strong>{row.label}</strong> <span style={{ opacity: 0.7 }}>({row.key})</span></Box>
                <Box>Size: {row.size} • LH: {row.lh} • W: {row.weight}</Box>
                <Box>LS: {row.ls} {row.mono ? '• Mono' : ''} {row.note && <span style={{ opacity: 0.65 }}>• {row.note}</span>}</Box>
              </Box>
            </Box>
          ))}
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display:'block' }}>Esta escala introduce display tiers y roles semánticos (label, code, numeric). Próximo paso: tokens + variants MUI.</Typography>
        </Paper>
      </Grid>


    </Grid>
  );

  const renderIconsSection = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h4" gutterBottom>
          🎯 Iconos
        </Typography>
      </Grid>

      {/* Iconos de Navegación */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Iconos de Navegación</Typography>
          <Grid container spacing={2}>
            {[
              { icon: <Dashboard />, name: 'Dashboard' },
              { icon: <Home />, name: 'Home' },
              { icon: <Menu />, name: 'Menu' },
              { icon: <Search />, name: 'Search' },
              { icon: <ArrowBack />, name: 'Back' },
              { icon: <MoreVert />, name: 'More Vertical' },
              { icon: <MoreHoriz />, name: 'More Horizontal' },
              { icon: <Close />, name: 'Close' }
            ].map(({ icon, name }) => (
              <Grid item xs={6} sm={4} md={3} key={name}>
                <motion.div 
                  whileHover={{ scale: 1.01, y: -1 }} 
                  whileTap={{ scale: 0.99 }}
                  transition={{ 
                    duration: 0.2, 
                    ease: "easeOut"
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      p: 1.5,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1.5,
                      cursor: 'pointer',
                      minHeight: 60,
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      bgcolor: 'background.paper',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'action.hover',
                        color: 'primary.main',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
                      }
                    }}
                  >
                    {React.cloneElement(icon, { 
                      sx: { 
                        fontSize: 20,
                        transition: 'all 0.2s ease',
                        mb: 0.5
                      } 
                    })}
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        textAlign: 'center',
                        fontWeight: 500,
                        fontSize: '0.7rem',
                        transition: 'all 0.2s ease',
                        lineHeight: 1.2
                      }}
                    >
                      {name}
                    </Typography>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Grid>



      {/* Iconos de Acción */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Iconos de Acción</Typography>
          <Grid container spacing={2}>
            {[
              { icon: <Add />, name: 'Add', color: 'success.main' },
              { icon: <Edit />, name: 'Edit', color: 'primary.main' },
              { icon: <Delete />, name: 'Delete', color: 'error.main' },
              { icon: <Save />, name: 'Save', color: 'success.main' },
              { icon: <Cancel />, name: 'Cancel', color: 'error.main' },
              { icon: <Share />, name: 'Share', color: 'info.main' },
              { icon: <Print />, name: 'Print', color: 'text.secondary' },
              { icon: <Refresh />, name: 'Refresh', color: 'primary.main' }
            ].map(({ icon, name, color }) => (
              <Grid item xs={6} sm={4} md={3} key={name}>
                <motion.div 
                  whileHover={{ scale: 1.03, y: -2 }} 
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      p: 2,
                      border: '2px solid',
                      borderColor: color,
                      borderRadius: 2,
                      cursor: 'pointer',
                      color: color,
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        bgcolor: color,
                        color: 'white',
                        boxShadow: `0 6px 16px ${color}30`
                      }
                    }}
                  >
                    {React.cloneElement(icon, { sx: { fontSize: 26 } })}
                    <Typography variant="caption" sx={{ mt: 1, textAlign: 'center', fontWeight: 500 }}>
                      {name}
                    </Typography>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Grid>



      {/* Iconos de Estado */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Iconos de Estado y Feedback</Typography>
          <Grid container spacing={2}>
            {[
              { icon: <CheckCircle />, name: 'Success', color: 'success.main' },
              { icon: <Warning />, name: 'Warning', color: 'warning.main' },
              { icon: <Error />, name: 'Error', color: 'error.main' },
              { icon: <Info />, name: 'Info', color: 'info.main' },
              { icon: <Notifications />, name: 'Notifications', color: 'primary.main' },
              { icon: <Security />, name: 'Security', color: 'error.main' },
              { icon: <Lock />, name: 'Lock', color: 'warning.main' },
              { icon: <LockOpen />, name: 'Unlock', color: 'success.main' }
            ].map(({ icon, name, color }) => (
              <Grid item xs={6} sm={4} md={3} key={name}>
                <motion.div 
                  whileHover={{ scale: 1.04, y: -3 }}
                  whileTap={{ scale: 0.96 }}
                  animate={{ 
                    rotate: name === 'Notifications' ? [0, 3, -3, 0] : 0 
                  }}
                  transition={{ 
                    rotate: { duration: 3, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" },
                    scale: { duration: 0.2, ease: "easeOut" },
                    y: { duration: 0.3, ease: "easeOut" }
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      p: 2,
                      borderRadius: 2,
                      background: `${color}15`,
                      color: color,
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        background: `${color}25`,
                        color: color,
                        boxShadow: `0 8px 20px ${color}40`,
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    {React.cloneElement(icon, { sx: { fontSize: 30 } })}
                    <Typography variant="caption" sx={{ mt: 1, textAlign: 'center', fontWeight: 500 }}>
                      {name}
                    </Typography>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Grid>



      {/* Iconos Empresariales */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Iconos Empresariales DR Group</Typography>
          <Grid container spacing={2}>
            {[
              { icon: <Business />, name: 'Empresas', color: 'primary.main' },
              { icon: <AttachMoney />, name: 'Dinero', color: 'success.main' },
              { icon: <Analytics />, name: 'Analytics', color: 'info.main' },
              { icon: <TrendingUp />, name: 'Trending', color: 'success.main' },
              { icon: <People />, name: 'Usuarios', color: 'secondary.main' },
              { icon: <Assignment />, name: 'Compromisos', color: 'warning.main' },
              { icon: <Today />, name: 'Calendario', color: 'primary.main' },
              { icon: <EventNote />, name: 'Eventos', color: 'info.main' }
            ].map(({ icon, name, color }, index) => (
              <Grid item xs={6} sm={4} md={3} key={name}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    delay: index * 0.05,
                    duration: 0.3,
                    ease: "easeOut"
                  }}
                  whileHover={{ 
                    scale: 1.02, 
                    y: -2
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      p: 2,
                      borderRadius: 2,
                      background: `${color}08`,
                      color: color,
                      cursor: 'pointer',
                      border: `1px solid ${color}20`,
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      '&:hover': {
                        background: `${color}15`,
                        color: color,
                        borderColor: `${color}40`,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    <motion.div
                      whileHover={{ 
                        scale: 1.05
                      }}
                      transition={{ 
                        duration: 0.2,
                        ease: "easeOut"
                      }}
                    >
                      {React.cloneElement(icon, { 
                        sx: { 
                          fontSize: 28, 
                          mb: 1,
                          transition: 'all 0.25s ease'
                        } 
                      })}
                    </motion.div>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        textAlign: 'center', 
                        fontWeight: 500,
                        fontSize: '0.75rem',
                        transition: 'all 0.25s ease'
                      }}
                    >
                      {name}
                    </Typography>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Grid>

      {/* Iconos Interactivos */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Iconos Interactivos</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>Toggle Icons</Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                  <IconButton color="error">
                    <FavoriteBorder />
                  </IconButton>
                </motion.div>
                <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                  <IconButton color="error">
                    <Favorite />
                  </IconButton>
                </motion.div>
                <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                  <IconButton color="primary">
                    <BookmarkBorder />
                  </IconButton>
                </motion.div>
                <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                  <IconButton color="primary">
                    <Bookmark />
                  </IconButton>
                </motion.div>
                <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                  <IconButton color="default">
                    <VisibilityOff />
                  </IconButton>
                </motion.div>
                <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                  <IconButton color="primary">
                    <Visibility />
                  </IconButton>
                </motion.div>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>Floating Action Buttons</Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <motion.div whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.95 }}>
                  <Fab 
                    size="small" 
                    color="primary"
                    sx={{
                      width: 40,
                      height: 40,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      }
                    }}
                  >
                    <Add sx={{ fontSize: 18 }} />
                  </Fab>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.95 }}>
                  <Fab 
                    size="small"
                    color="secondary"
                    sx={{
                      width: 40,
                      height: 40,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      }
                    }}
                  >
                    <Edit sx={{ fontSize: 18 }} />
                  </Fab>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.95 }}>
                  <Fab 
                    size="small"
                    sx={{ 
                      background: `linear-gradient(135deg, ${theme.palette.success.main}E6, ${theme.palette.success.main}CC)`,
                      color: 'white',
                      width: 40,
                      height: 40,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      '&:hover': { 
                        background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      }
                    }}
                  >
                    <Save sx={{ fontSize: 18 }} />
                  </Fab>
                </motion.div>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      {/* Tamaños de Iconos */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Tamaños de Iconos</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Star sx={{ fontSize: 16, color: 'primary.main', mb: 1 }} />
              <Typography variant="caption">16px</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Star sx={{ fontSize: 20, color: 'primary.main', mb: 1 }} />
              <Typography variant="caption">20px</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Star sx={{ fontSize: 24, color: 'primary.main', mb: 1 }} />
              <Typography variant="caption">24px (default)</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Star sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
              <Typography variant="caption">32px</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Star sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
              <Typography variant="caption">48px</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Star sx={{ fontSize: 64, color: 'primary.main', mb: 1 }} />
              <Typography variant="caption">64px</Typography>
            </Box>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderHeadersSection = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h4" gutterBottom>
          📱 Headers
        </Typography>
      </Grid>

      {/* Header Básico Profesional */}
      <Grid item xs={12}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" color="primary.main" gutterBottom>
            📊 Header Principal de Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Uso:</strong> Header principal para el dashboard de DR Group. Incluye navegación, 
            notificaciones, búsqueda y barra de estado empresarial con información en tiempo real 
            del sistema, empresas conectadas y última actualización.
          </Typography>
        </Box>
        <Paper sx={{ overflow: 'hidden', boxShadow: shadows.soft }}>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <Box
              sx={{
                p: 2.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                bgcolor: 'background.paper',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                borderBottom: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <IconButton 
                    size="medium"
                    sx={{ 
                      color: 'text.primary',
                      '&:hover': { 
                        bgcolor: 'action.hover',
                        color: 'primary.main'
                      }
                    }}
                  >
                    <Menu />
                  </IconButton>
                </motion.div>
                <Box>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600,
                      color: 'text.primary',
                      lineHeight: 1.2
                    }}
                  >
                    DR Group Dashboard
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: 'text.secondary',
                      fontWeight: 500
                    }}
                  >
                    Sistema de Gestión Empresarial
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <IconButton 
                    size="medium"
                    sx={{ 
                      color: 'text.secondary',
                      '&:hover': { 
                        bgcolor: 'action.hover',
                        color: 'primary.main'
                      }
                    }}
                  >
                    <Search />
                  </IconButton>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <IconButton 
                    size="medium"
                    sx={{ 
                      color: 'text.secondary',
                      '&:hover': { 
                        bgcolor: 'action.hover',
                        color: 'primary.main'
                      }
                    }}
                  >
                    <Badge badgeContent={3} color="error">
                      <Notifications />
                    </Badge>
                  </IconButton>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <IconButton 
                    size="medium"
                    sx={{ 
                      color: 'text.secondary',
                      '&:hover': { 
                        bgcolor: 'action.hover',
                        color: 'primary.main'
                      }
                    }}
                  >
                    <MoreVert />
                  </IconButton>
                </motion.div>
              </Box>
            </Box>
          </motion.div>
          
          {/* Barra de Estado Empresarial */}
          <Box sx={{ 
            px: 2.5, 
            py: 1.5, 
            bgcolor: 'grey.50',
            borderTop: '1px solid',
            borderColor: 'divider'
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    bgcolor: 'success.main' 
                  }} />
                  <Typography variant="caption" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                    Sistema Activo
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Business sx={{ fontSize: 14, color: 'text.secondary' }} />
                  <Typography variant="caption" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                    5 Empresas Conectadas
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Today sx={{ fontSize: 14, color: 'text.secondary' }} />
                  <Typography variant="caption" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                    Agosto 2025
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Última actualización:
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  Hace 2 min
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Grid>

      {/* Header con Gradiente */}
      <Grid item xs={12}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" color="primary.main" gutterBottom>
            🎨 Header Ejecutivo con Gradiente
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Uso:</strong> Header ejecutivo para páginas de presentación, reportes directivos, 
            y secciones de alta importancia. Diseño elegante y profesional con gradiente corporativo 
            que comunica autoridad y confianza empresarial para DR Group.
          </Typography>
        </Box>
        <Paper sx={{ overflow: 'hidden', boxShadow: shadows.soft }}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <Box
              sx={{
                background: gradients.primary,
                color: 'white',
                p: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '1px',
                  background: 'rgba(255,255,255,0.2)'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <IconButton 
                    sx={{ 
                      color: 'white',
                      bgcolor: 'rgba(255,255,255,0.1)',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.2)',
                        transform: 'translateX(-2px)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <ArrowBack />
                  </IconButton>
                </motion.div>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Reporte Ejecutivo
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 400 }}>
                    Dashboard de análisis financiero corporativo
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1.5,
                  px: 2,
                  py: 1,
                  borderRadius: 6,
                  bgcolor: 'rgba(255,255,255,0.15)',
                  mr: 1
                }}>
                  <Box sx={{ 
                    width: 6, 
                    height: 6, 
                    borderRadius: '50%', 
                    bgcolor: '#4caf50' 
                  }} />
                  <Typography variant="caption" sx={{ 
                    color: 'white', 
                    fontWeight: 500,
                    fontSize: '0.75rem'
                  }}>
                    En línea
                  </Typography>
                </Box>
                
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <IconButton sx={{ 
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                  }}>
                    <Search />
                  </IconButton>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <IconButton sx={{ 
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                  }}>
                    <Badge 
                      badgeContent={2} 
                      sx={{
                        '& .MuiBadge-badge': {
                          bgcolor: '#ff5722',
                          color: 'white',
                          fontWeight: 600
                        }
                      }}
                    >
                      <Notifications />
                    </Badge>
                  </IconButton>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Avatar 
                    sx={{ 
                      width: 36, 
                      height: 36,
                      bgcolor: 'rgba(255,255,255,0.2)',
                      border: '2px solid rgba(255,255,255,0.3)',
                      ml: 1,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.3)',
                        transform: 'translateY(-1px)'
                      }
                    }}
                  >
                    <Person />
                  </Avatar>
                </motion.div>
              </Box>
            </Box>
          </motion.div>
          
          <Box sx={{ 
            p: 2, 
            bgcolor: 'grey.50',
            borderTop: '1px solid',
            borderColor: 'divider'
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Chip
                  label="Confidencial"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(37, 99, 235, 0.08)',
                    color: 'primary.main',
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    border: '1px solid',
                    borderColor: 'rgba(37, 99, 235, 0.2)',
                    '&:hover': {
                      bgcolor: 'rgba(37, 99, 235, 0.12)',
                      borderColor: 'rgba(37, 99, 235, 0.3)'
                    }
                  }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Acceso: Directivos y Gerencia
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Generado:
                </Typography>
                <Typography variant="caption" sx={{ 
                  fontWeight: 600, 
                  color: 'primary.main'
                }}>
                  07 Agosto 2025, 14:30
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Grid>

      {/* Header de Página */}
      <Grid item xs={12}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" color="primary.main" gutterBottom>
            📋 Header de Gestión Empresarial
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Uso:</strong> Header profesional para módulos operativos como gestión de compromisos, 
            reportes financieros, configuraciones y herramientas administrativas. Diseño funcional 
            con jerarquía visual clara, indicadores de contexto y acciones principales destacadas.
          </Typography>
        </Box>
        <Paper sx={{ overflow: 'hidden', boxShadow: shadows.soft }}>
          <Typography variant="h6" gutterBottom sx={{ p: 3, pb: 2 }}>
            Header de Gestión Empresarial
          </Typography>
          
          {/* Header Principal Mejorado */}
          <Box sx={{ px: 3, pb: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 2,
                p: 2,
                bgcolor: 'grey.50',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                position: 'relative'
              }}
            >
              {/* Indicador de módulo */}
              <Box sx={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                width: '4px',
                height: '100%',
                bgcolor: 'primary.main',
                borderRadius: '0 2px 2px 0'
              }} />
              
              {/* Contenido principal en línea */}
              <Box sx={{ 
                flex: 1, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 3,
                flexWrap: 'wrap',
                minWidth: '300px'
              }}>
                {/* Título y descripción compactos */}
                <Box sx={{ flex: 1, minWidth: '200px' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="caption" sx={{ 
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      letterSpacing: 0.5
                    }}>
                      FINANZAS
                    </Typography>
                    <Typography variant="caption" color="text.secondary">•</Typography>
                    <Typography variant="caption" sx={{ 
                      color: 'primary.main',
                      fontWeight: 600
                    }}>
                      COMPROMISOS
                    </Typography>
                  </Box>
                  
                  <Typography variant="h6" sx={{ 
                    fontWeight: 700, 
                    mb: 0.5,
                    color: 'text.primary',
                    lineHeight: 1.3
                  }}>
                    Compromisos Financieros
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    fontSize: '0.85rem',
                    lineHeight: 1.4
                  }}>
                    Gestión integral de obligaciones de pago corporativas
                  </Typography>
                </Box>
                
                {/* Métricas en línea horizontal */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2.5,
                  flexWrap: 'wrap',
                  bgcolor: 'background.paper',
                  px: 2,
                  py: 1,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ 
                      width: 6, 
                      height: 6, 
                      borderRadius: '50%', 
                      bgcolor: 'success.main'
                    }} />
                    <Typography variant="caption" sx={{ 
                      fontWeight: 600, 
                      color: 'text.primary',
                      fontSize: '0.75rem'
                    }}>
                      24
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ 
                      width: 6, 
                      height: 6, 
                      borderRadius: '50%', 
                      bgcolor: 'warning.main'
                    }} />
                    <Typography variant="caption" sx={{ 
                      fontWeight: 600, 
                      color: 'text.primary',
                      fontSize: '0.75rem'
                    }}>
                      7
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <AttachMoney sx={{ fontSize: 12, color: 'success.main' }} />
                    <Typography variant="caption" sx={{ 
                      fontWeight: 600, 
                      color: 'success.main',
                      fontSize: '0.75rem'
                    }}>
                      $45.2M
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              {/* Acciones compactas */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: 1
              }}>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    variant="outlined" 
                    startIcon={<FilterList />}
                    size="small"
                    sx={{
                      borderColor: 'divider',
                      color: 'text.secondary',
                      fontSize: '0.8rem',
                      '&:hover': {
                        borderColor: 'primary.main',
                        color: 'primary.main',
                        bgcolor: 'primary.50'
                      }
                    }}
                  >
                    Filtros
                  </Button>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    variant="contained" 
                    startIcon={<Add />}
                    size="small"
                    sx={{
                      bgcolor: 'primary.main',
                      fontSize: '0.8rem',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      }
                    }}
                  >
                    Nuevo
                  </Button>
                </motion.div>
                
                {/* Acciones secundarias inline */}
                <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <IconButton 
                      size="small"
                      sx={{ 
                        color: 'text.secondary',
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                        width: 28,
                        height: 28,
                        '&:hover': { 
                          color: 'primary.main',
                          borderColor: 'primary.main',
                          bgcolor: 'primary.50'
                        }
                      }}
                    >
                      <CloudDownload sx={{ fontSize: 14 }} />
                    </IconButton>
                  </motion.div>
                  
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <IconButton 
                      size="small"
                      sx={{ 
                        color: 'text.secondary',
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                        width: 28,
                        height: 28,
                        '&:hover': { 
                          color: 'info.main',
                          borderColor: 'info.main',
                          bgcolor: 'info.50'
                        }
                      }}
                    >
                      <Settings sx={{ fontSize: 14 }} />
                    </IconButton>
                  </motion.div>
                </Box>
              </Box>
            </Box>
          </Box>
          
          {/* Barra de estado y filtros rápidos */}
          <Box sx={{ 
            px: 3, 
            py: 2, 
            bgcolor: 'background.paper',
            borderTop: '1px solid',
            borderColor: 'divider'
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Vista actual:
                </Typography>
                
                <Chip
                  label="Todos los compromisos"
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    bgcolor: 'primary.50'
                  }}
                />
                
                <Typography variant="caption" color="text.secondary">
                  •
                </Typography>
                
                <Typography variant="caption" color="text.secondary">
                  Última actualización: hace 2 min
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Ordenar por:
                </Typography>
                <Button
                  size="small"
                  endIcon={<Sort sx={{ fontSize: 16 }} />}
                  sx={{ 
                    minWidth: 'auto',
                    color: 'text.secondary',
                    '&:hover': { 
                      color: 'primary.main',
                      bgcolor: 'primary.50'
                    }
                  }}
                >
                  Fecha venc.
                </Button>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Grid>

      {/* Header con Breadcrumbs */}
      <Grid item xs={12}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" color="primary.main" gutterBottom>
            🧭 Header con Navegación de Migas de Pan
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Uso:</strong> Header para flujos de trabajo complejos o formularios multi-paso. 
            Ideal para crear/editar compromisos, procesos de configuración, o cualquier navegación 
            profunda donde el usuario necesita saber dónde está y poder regresar fácilmente.
          </Typography>
        </Box>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Header Navegacional Empresarial</Typography>
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
            p: 2,
            bgcolor: 'grey.50',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            position: 'relative'
          }}>
            {/* Indicador de proceso */}
            <Box sx={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              width: '3px',
              height: '100%',
              bgcolor: 'info.main',
              borderRadius: '0 1px 1px 0'
            }} />
            
            {/* Contenido principal compacto */}
            <Box sx={{ 
              flex: 1, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              minWidth: '300px'
            }}>
              {/* Navegación y título en línea */}
              <Box sx={{ flex: 1 }}>
                {/* Breadcrumbs compactos */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 0.5, 
                  mb: 0.5,
                  fontSize: '0.75rem'
                }}>
                  <Home sx={{ fontSize: 12, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">•</Typography>
                  <Typography variant="caption" color="text.secondary">Compromisos</Typography>
                  <Typography variant="caption" color="text.secondary">•</Typography>
                  <Typography variant="caption" sx={{ 
                    color: 'info.main',
                    fontWeight: 600
                  }}>
                    Nuevo
                  </Typography>
                </Box>
                
                {/* Título y descripción compactos */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <IconButton 
                      size="small"
                      sx={{ 
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                        width: 28,
                        height: 28,
                        '&:hover': { 
                          borderColor: 'info.main',
                          color: 'info.main'
                        }
                      }}
                    >
                      <ArrowBack sx={{ fontSize: 14 }} />
                    </IconButton>
                  </motion.div>
                  
                  <Box>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 700, 
                      mb: 0.25,
                      fontSize: '1.1rem',
                      lineHeight: 1.3
                    }}>
                      Nuevo Compromiso
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ 
                      fontSize: '0.75rem',
                      display: 'block'
                    }}>
                      Crear obligación financiera empresarial
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              {/* Estado del proceso */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: 1,
                bgcolor: 'background.paper',
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider'
              }}>
                <Box sx={{ 
                  width: 6, 
                  height: 6, 
                  borderRadius: '50%', 
                  bgcolor: 'info.main'
                }} />
                <Typography variant="caption" sx={{ 
                  fontWeight: 600, 
                  color: 'text.primary',
                  fontSize: '0.7rem'
                }}>
                  Paso 1 de 3
                </Typography>
              </Box>
            </Box>
            
            {/* Acciones compactas */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: 1
            }}>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  variant="outlined" 
                  size="small"
                  sx={{
                    borderColor: 'divider',
                    color: 'text.secondary',
                    fontSize: '0.75rem',
                    minWidth: 'auto',
                    px: 2,
                    '&:hover': {
                      borderColor: 'error.main',
                      color: 'error.main',
                      bgcolor: 'error.50'
                    }
                  }}
                >
                  Cancelar
                </Button>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  variant="contained" 
                  size="small"
                  sx={{
                    bgcolor: 'success.main',
                    fontSize: '0.75rem',
                    minWidth: 'auto',
                    px: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    '&:hover': {
                      bgcolor: 'success.dark',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }
                  }}
                >
                  Guardar
                </Button>
              </motion.div>
            </Box>
          </Box>
        </Paper>
      </Grid>

      {/* Header de Dashboard */}
      <Grid item xs={12}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" color="primary.main" gutterBottom>
            📈 Header de Dashboard Ejecutivo
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Uso:</strong> Header principal para títulos de páginas importantes del sistema. 
            Diseño spectacular con gradiente profesional, ideal para páginas ejecutivas, dashboards 
            principales y secciones de alta dirección. Enfoque en el título, no en métricas.
          </Typography>
        </Box>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring" }}
        >
          <Paper 
            sx={{ 
              overflow: 'hidden',
              background: gradients.info,
              color: 'white',
              borderRadius: 2,
              boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(255, 255, 255, 0.1)',
                zIndex: 0,
              }
            }}
          >
            {/* Header Principal Spectacular - Solo Título */}
            <Box sx={{ p: 3, position: 'relative', zIndex: 1 }}>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 2
              }}>
                {/* Título Principal Spectacular */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, flex: 1 }}>
                  <Box sx={{
                    p: 1.5,
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Analytics sx={{ fontSize: 24, color: 'white' }} />
                  </Box>
                  
                  <Box>
                    <Typography variant="h4" sx={{ 
                      fontWeight: 700, 
                      color: 'white',
                      mb: 0.5,
                      fontSize: '1.75rem',
                      letterSpacing: '-0.01em',
                      textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                      lineHeight: 1.2
                    }}>
                      Dashboard Ejecutivo
                    </Typography>
                    <Typography variant="subtitle1" sx={{ 
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '1rem',
                      fontWeight: 500,
                      letterSpacing: '0.005em',
                      lineHeight: 1.4
                    }}>
                      Control financiero empresarial con métricas en tiempo real
                    </Typography>
                  </Box>
                </Box>
                
                {/* Botones de Acción Spectacular */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="outlined"
                      startIcon={<Refresh />}
                      sx={{
                        py: 1.5,
                        px: 3.5,
                        fontSize: '1rem',
                        fontWeight: 600,
                        borderRadius: 2,
                        border: '2px solid rgba(255, 255, 255, 0.5)',
                        color: 'white',
                        textTransform: 'none',
                        backdropFilter: 'blur(10px)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          background: 'rgba(255, 255, 255, 0.15)',
                          borderColor: 'rgba(255, 255, 255, 0.8)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)'
                        }
                      }}
                    >
                      Actualizar
                    </Button>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <IconButton
                      sx={{
                        color: 'white',
                        bgcolor: 'rgba(255, 255, 255, 0.15)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        backdropFilter: 'blur(10px)',
                        width: 48,
                        height: 48,
                        '&:hover': { 
                          bgcolor: 'rgba(255, 255, 255, 0.25)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)'
                        }
                      }}
                    >
                      <Settings />
                    </IconButton>
                  </motion.div>
                </Box>
              </Box>
            </Box>
          </Paper>
        </motion.div>
      </Grid>

      {/* Header Móvil */}
      <Grid item xs={12} md={6}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" color="primary.main" gutterBottom>
            📱 Header Móvil Compacto
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Uso:</strong> Header limpio y profesional para móviles. Diseño minimalista 
            con elementos esenciales organizados horizontalmente. Perfecto para navegación 
            móvil del sistema DR Group con gradiente spectacular sutil.
          </Typography>
        </Box>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <Paper 
            sx={{ 
              overflow: 'hidden',
              background: gradients.dark,
              color: 'white',
              borderRadius: 2,
              boxShadow: '0 4px 16px rgba(31, 38, 135, 0.2)',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(255, 255, 255, 0.08)',
                zIndex: 0,
              }
            }}
          >
            {/* Header Móvil Spectacular Limpio */}
            <Box sx={{ p: 2, position: 'relative', zIndex: 1 }}>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2
              }}>
                {/* Logo y Menú */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <IconButton 
                      size="small" 
                      sx={{ 
                        color: 'white',
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: 1.5,
                        width: 36,
                        height: 36,
                        '&:hover': { 
                          bgcolor: 'rgba(255, 255, 255, 0.2)'
                        }
                      }}
                    >
                      <Menu sx={{ fontSize: 18 }} />
                    </IconButton>
                  </motion.div>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 700, 
                    fontSize: '1.125rem',
                    letterSpacing: '0.005em'
                  }}>
                    DR Group
                  </Typography>
                </Box>

                {/* Notificaciones */}
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <IconButton 
                    size="small" 
                    sx={{ 
                      color: 'white',
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: 1.5,
                      width: 36,
                      height: 36,
                      '&:hover': { 
                        bgcolor: 'rgba(255, 255, 255, 0.2)'
                      }
                    }}
                  >
                    <Badge 
                      badgeContent={2} 
                      color="error"
                      sx={{
                        '& .MuiBadge-badge': {
                          fontSize: '0.625rem',
                          minWidth: 16,
                          height: 16
                        }
                      }}
                    >
                      <Notifications sx={{ fontSize: 18 }} />
                    </Badge>
                  </IconButton>
                </motion.div>
              </Box>
            </Box>
          </Paper>
        </motion.div>
      </Grid>

      {/* Header con Tabs */}
      <Grid item xs={12} md={6}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" color="primary.main" gutterBottom>
            📑 Header con Navegación por Pestañas
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Uso:</strong> Header limpio con pestañas organizadas horizontalmente. 
            Diseño profesional para secciones con múltiples vistas. Ideal para reportes 
            financieros, análisis y módulos con funcionalidades agrupadas.
          </Typography>
        </Box>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <Paper 
            sx={{ 
              overflow: 'hidden',
              borderRadius: 2,
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            {/* Header Principal Limpio */}
            <Box sx={{ 
              p: 2.5,
              borderBottom: '1px solid',
              borderColor: 'divider',
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.03) 100%)'
            }}>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{
                    p: 1,
                    bgcolor: 'primary.main',
                    borderRadius: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Analytics sx={{ fontSize: 18, color: 'white' }} />
                  </Box>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 700,
                    fontSize: '1.25rem',
                    color: 'text.primary',
                    letterSpacing: '-0.01em'
                  }}>
                    Análisis Financiero
                  </Typography>
                </Box>
                
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <IconButton
                    size="small"
                    sx={{
                      color: 'text.secondary',
                      bgcolor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                      width: 32,
                      height: 32,
                      '&:hover': { 
                        bgcolor: 'action.hover',
                        borderColor: 'primary.main',
                        color: 'primary.main'
                      }
                    }}
                  >
                    <Settings sx={{ fontSize: 16 }} />
                  </IconButton>
                </motion.div>
              </Box>
            </Box>

            {/* Pestañas Horizontales Limpias */}
            <Box sx={{ 
              display: 'flex',
              borderBottom: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper'
            }}>
              {['Resumen', 'Gráficos', 'Reportes', 'Configuración'].map((tab, index) => (
                <motion.div
                  key={tab}
                  whileHover={{ y: -1 }}
                  whileTap={{ y: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  style={{ flex: 1 }}
                >
                  <Button
                    variant={index === 0 ? 'contained' : 'text'}
                    size="medium"
                    sx={{
                      width: '100%',
                      py: 1.5,
                      px: 3,
                      borderRadius: 0,
                      fontWeight: index === 0 ? 700 : 500,
                      fontSize: '0.875rem',
                      letterSpacing: '0.005em',
                      textTransform: 'none',
                      ...(index === 0 ? {
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        boxShadow: 'inset 0 -2px 0 rgba(255,255,255,0.2)',
                        '&:hover': { 
                          background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
                        }
                      } : {
                        color: 'text.secondary',
                        '&:hover': {
                          bgcolor: 'action.hover',
                          color: 'text.primary'
                        }
                      })
                    }}
                  >
                    {tab}
                  </Button>
                </motion.div>
              ))}
            </Box>

            {/* Contenido Limpio */}
            <Box sx={{ p: 2.5, minHeight: 60 }}>
              <Typography variant="body2" color="text.secondary" sx={{
                fontStyle: 'italic',
                textAlign: 'center'
              }}>
                Contenido del tab "{['Resumen', 'Gráficos', 'Reportes', 'Configuración'][0]}" seleccionado
              </Typography>
            </Box>
          </Paper>
        </motion.div>
      </Grid>
    </Grid>
  );

  const renderButtonsSection = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h4" gutterBottom>
          🔘 Botones
        </Typography>
      </Grid>

      {/* Botones Estándar */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Botones Estándar</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
            <Button variant="contained" color="primary">Contained Primary</Button>
            <Button variant="contained" color="secondary">Contained Secondary</Button>
            <Button variant="outlined" color="primary">Outlined Primary</Button>
            <Button variant="outlined" color="secondary">Outlined Secondary</Button>
            <Button variant="text" color="primary">Text Primary</Button>
            <Button variant="text" color="secondary">Text Secondary</Button>
          </Box>

          <Typography variant="h6" gutterBottom>Tamaños</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
            <Button variant="contained" size="small">Small</Button>
            <Button variant="contained" size="medium">Medium</Button>
            <Button variant="contained" size="large">Large</Button>
          </Box>

          <Typography variant="h6" gutterBottom>Estados</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button variant="contained">Normal</Button>
            <Button variant="contained" disabled>Disabled</Button>
          </Box>
        </Paper>
      </Grid>

      {/* Botones con Gradiente */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Botones con Gradiente Spectacular</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {Object.entries(gradients).map(([name, gradient]) => (
              <motion.div key={name} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="contained"
                  sx={{
                    background: gradient,
                    border: 'none',
                    boxShadow: shadows.soft,
                    '&:hover': {
                      background: gradient,
                      boxShadow: shadows.medium,
                    }
                  }}
                >
                  {name}
                </Button>
              </motion.div>
            ))}
          </Box>
        </Paper>
      </Grid>

      {/* Botones Flotantes y con Iconos */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Botones Especiales</Typography>
          
          {/* Floating Action Buttons */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary', mb: 2 }}>
              Floating Action Buttons (FAB):
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
              <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                <Fab 
                  color="primary" 
                  size="small"
                  sx={{
                    boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(25, 118, 210, 0.4)',
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  <Add sx={{ fontSize: 18 }} />
                </Fab>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                <Fab 
                  color="primary"
                  sx={{
                    boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(25, 118, 210, 0.4)',
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  <Add sx={{ fontSize: 20 }} />
                </Fab>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                <Fab 
                  color="secondary" 
                  size="large"
                  sx={{
                    boxShadow: '0 3px 12px rgba(156, 39, 176, 0.3)',
                    '&:hover': {
                      boxShadow: '0 6px 16px rgba(156, 39, 176, 0.4)',
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  <Edit sx={{ fontSize: 24 }} />
                </Fab>
              </motion.div>

              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                gap: 0.5,
                color: 'text.secondary',
                ml: 2
              }}>
                <Typography variant="caption" sx={{ fontWeight: 500 }}>
                  Tamaños
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="caption">S</Typography>
                  <Typography variant="caption">M</Typography>
                  <Typography variant="caption">L</Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Icon Buttons */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary', mb: 2 }}>
              Icon Buttons:
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <IconButton 
                  color="primary"
                  sx={{
                    bgcolor: 'rgba(25, 118, 210, 0.08)',
                    '&:hover': {
                      bgcolor: 'rgba(25, 118, 210, 0.15)',
                      color: 'primary.dark'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Settings />
                </IconButton>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <IconButton 
                  color="secondary"
                  sx={{
                    bgcolor: 'rgba(156, 39, 176, 0.08)',
                    '&:hover': {
                      bgcolor: 'rgba(156, 39, 176, 0.15)',
                      color: 'secondary.dark'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Favorite />
                </IconButton>
              </motion.div>

              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <IconButton 
                  sx={{
                    color: 'success.main',
                    bgcolor: 'rgba(76, 175, 80, 0.08)',
                    '&:hover': {
                      bgcolor: 'rgba(76, 175, 80, 0.15)',
                      color: 'success.dark'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Save />
                </IconButton>
              </motion.div>

              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <IconButton 
                  sx={{
                    color: 'error.main',
                    bgcolor: 'rgba(211, 47, 47, 0.08)',
                    '&:hover': {
                      bgcolor: 'rgba(211, 47, 47, 0.15)',
                      color: 'error.dark'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Delete />
                </IconButton>
              </motion.div>
            </Box>
          </Box>

          {/* Botones con Iconos */}
          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary', mb: 2 }}>
              Botones con Iconos:
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <motion.div whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  variant="contained" 
                  startIcon={<Dashboard />}
                  sx={{
                    px: 3,
                    py: 1.5,
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    textTransform: 'none',
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(25, 118, 210, 0.2)',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                      transform: 'translateY(-1px)'
                    },
                    '& .MuiButton-startIcon': {
                      marginRight: 1,
                      '& svg': {
                        fontSize: '1.1rem'
                      }
                    },
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  Dashboard
                </Button>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  variant="outlined" 
                  endIcon={<Star />}
                  sx={{
                    px: 3,
                    py: 1.5,
                    fontWeight: 500,
                    fontSize: '0.9rem',
                    textTransform: 'none',
                    borderRadius: 2,
                    borderWidth: '1.5px',
                    '&:hover': {
                      borderWidth: '1.5px',
                      backgroundColor: `${theme.palette.primary.main}08`,
                      transform: 'translateY(-1px)',
                      boxShadow: '0 2px 6px rgba(25, 118, 210, 0.15)'
                    },
                    '& .MuiButton-endIcon': {
                      marginLeft: 1,
                      '& svg': {
                        fontSize: '1.1rem'
                      }
                    },
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  Destacar
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  variant="text" 
                  startIcon={<Share />}
                  sx={{
                    px: 2.5,
                    py: 1.5,
                    fontWeight: 500,
                    fontSize: '0.9rem',
                    textTransform: 'none',
                    borderRadius: 2,
                    color: 'text.primary',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      color: 'primary.main',
                      transform: 'translateY(-1px)'
                    },
                    '& .MuiButton-startIcon': {
                      marginRight: 1,
                      '& svg': {
                        fontSize: '1.1rem'
                      }
                    },
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  Compartir
                </Button>
              </motion.div>
            </Box>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderCardsSection = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
          🎴 Cards y Contenedores
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Contenedores profesionales para organizar información empresarial de forma clara y accesible
        </Typography>
      </Grid>

      {/* Cards de Dashboard Empresarial */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mb: 2 }}>
          Cards de Dashboard Empresarial
        </Typography>
        <Grid container spacing={3}>
          {/* Card de Métricas */}
          <Grid item xs={12} sm={6} md={4}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
            >
              <Card 
                sx={{ 
                  height: 180,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                    borderColor: 'primary.light'
                  }
                }}
              >
                <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AttachMoney sx={{ color: 'success.main', mr: 1, fontSize: 24 }} />
                    <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1rem' }}>
                      Compromisos Activos
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
                    $45.2M
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 'auto' }}>
                    18 compromisos pendientes
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'success.main', display: 'flex', alignItems: 'center', mt: 2 }}>
                    <TrendingUp sx={{ fontSize: 14, mr: 0.5 }} />
                    +12% vs mes anterior
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Card de Empresa */}
          <Grid item xs={12} sm={6} md={4}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
            >
              <Card 
                sx={{ 
                  height: 180,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                    borderColor: 'primary.light'
                  }
                }}
              >
                <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Business sx={{ color: 'primary.main', mr: 1, fontSize: 24 }} />
                    <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1rem' }}>
                      DR GROUP SAS
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    NIT: 900123456-7
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 'auto' }}>
                    <Chip 
                      label="Activa" 
                      color="success" 
                      size="small"
                      sx={{ fontWeight: 500 }}
                    />
                    <Chip 
                      label="5 usuarios" 
                      variant="outlined" 
                      size="small"
                    />
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Card de Alerta */}
          <Grid item xs={12} sm={6} md={4}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
            >
              <Card 
                sx={{ 
                  height: 180,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                    borderColor: 'primary.light'
                  }
                }}
              >
                <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Warning sx={{ color: 'warning.main', mr: 1, fontSize: 24 }} />
                    <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1rem' }}>
                      Próximos Vencimientos
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
                    3
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 'auto' }}>
                    Compromisos vencen esta semana
                  </Typography>
                  <Button 
                    size="small" 
                    color="warning" 
                    sx={{ mt: 2, fontWeight: 500, alignSelf: 'flex-start' }}
                  >
                    Ver detalles
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      </Grid>

      {/* Cards de Información Detallada */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mb: 2, mt: 4 }}>
          Cards de Información Detallada
        </Typography>
        <Grid container spacing={3}>
          {/* Card de Compromiso */}
          <Grid item xs={12} md={6}>
            <motion.div
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
            >
              <Card 
                sx={{ 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                    borderColor: 'primary.light'
                  }
                }}
              >
                <CardHeader
                  avatar={
                    <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                      <Assignment sx={{ fontSize: 20 }} />
                    </Avatar>
                  }
                  title={
                    <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1rem' }}>
                      Arriendo Local Principal
                    </Typography>
                  }
                  subheader={
                    <Typography variant="body2" color="text.secondary">
                      Vence: 15 de Agosto, 2025
                    </Typography>
                  }
                  action={
                    <Chip 
                      label="Pendiente" 
                      color="warning" 
                      size="small"
                      sx={{ fontWeight: 500 }}
                    />
                  }
                  sx={{ pb: 1 }}
                />
                <CardContent sx={{ pt: 0, pb: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                    $2,500,000
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Business sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      DR GROUP SAS
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Today sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Mensual - Día 15
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions sx={{ px: 3, pb: 2, pt: 0 }}>
                  <Button size="small" color="primary" sx={{ fontWeight: 500 }}>
                    Ver detalles
                  </Button>
                  <Button size="small" color="success" sx={{ fontWeight: 500 }}>
                    Marcar pagado
                  </Button>
                </CardActions>
              </Card>
            </motion.div>
          </Grid>

          {/* Card de Usuario */}
          <Grid item xs={12} md={6}>
            <motion.div
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
            >
              <Card 
                sx={{ 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                    borderColor: 'primary.light'
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar 
                      sx={{ 
                        width: 48, 
                        height: 48, 
                        mr: 2,
                        bgcolor: 'secondary.main'
                      }}
                    >
                      <Person />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1rem' }}>
                        María González
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Administrador
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Email sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        maria@drgroup.com
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Business sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        DR GROUP SAS
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Security sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        Acceso completo
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip 
                      label="Activo" 
                      color="success" 
                      size="small"
                      sx={{ fontWeight: 500 }}
                    />
                    <Chip 
                      label="Admin" 
                      color="primary" 
                      size="small"
                      sx={{ fontWeight: 500 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      </Grid>

      {/* Contenedores Profesionales - Estilo Único "Paper con Acento" */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mb: 2, mt: 4 }}>
          Contenedores Profesionales - Paper con Acento
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Diseño único consistente con variaciones de color para diferentes contextos empresariales
        </Typography>
        <Grid container spacing={3}>
          {/* Paper Acento Primary - Información General */}
          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
            >
              <Paper 
                sx={{ 
                  p: 2.5,
                  textAlign: 'center',
                  borderRadius: 1,
                  borderLeft: 4,
                  borderLeftColor: 'primary.main',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  transition: 'all 0.25s ease',
                  height: 140,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  <Settings sx={{ color: 'primary.main', fontSize: 20, mr: 1 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 500, fontSize: '0.95rem' }}>
                    Configuración
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', lineHeight: 1.3 }}>
                  Para configuraciones generales y ajustes del sistema
                </Typography>
              </Paper>
            </motion.div>
          </Grid>

          {/* Paper Acento Success - Confirmaciones */}
          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
            >
              <Paper 
                sx={{ 
                  p: 2.5,
                  textAlign: 'center',
                  borderRadius: 1,
                  borderLeft: 4,
                  borderLeftColor: 'success.main',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  transition: 'all 0.25s ease',
                  height: 140,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  <CheckCircle sx={{ color: 'success.main', fontSize: 20, mr: 1 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 500, fontSize: '0.95rem' }}>
                    Reportes Exitosos
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', lineHeight: 1.3 }}>
                  Para confirmaciones, reportes positivos y éxitos
                </Typography>
              </Paper>
            </motion.div>
          </Grid>

          {/* Paper Acento Warning - Alertas */}
          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
            >
              <Paper 
                sx={{ 
                  p: 2.5,
                  textAlign: 'center',
                  borderRadius: 1,
                  borderLeft: 4,
                  borderLeftColor: 'warning.main',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  transition: 'all 0.25s ease',
                  height: 140,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  <Warning sx={{ color: 'warning.main', fontSize: 20, mr: 1 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 500, fontSize: '0.95rem' }}>
                    Compromisos Próximos
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', lineHeight: 1.3 }}>
                  Para alertas, avisos y compromisos próximos a vencer
                </Typography>
              </Paper>
            </motion.div>
          </Grid>

          {/* Paper Acento Error - Críticos */}
          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
            >
              <Paper 
                sx={{ 
                  p: 2.5,
                  textAlign: 'center',
                  borderRadius: 1,
                  borderLeft: 4,
                  borderLeftColor: 'error.main',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  transition: 'all 0.25s ease',
                  height: 140,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  <Error sx={{ color: 'error.main', fontSize: 20, mr: 1 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 500, fontSize: '0.95rem' }}>
                    Elementos Críticos
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', lineHeight: 1.3 }}>
                  Para errores, elementos críticos y situaciones urgentes
                </Typography>
              </Paper>
            </motion.div>
          </Grid>

          {/* Paper Acento Info - Información */}
          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
            >
              <Paper 
                sx={{ 
                  p: 2.5,
                  textAlign: 'center',
                  borderRadius: 1,
                  borderLeft: 4,
                  borderLeftColor: 'info.main',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  transition: 'all 0.25s ease',
                  height: 140,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  <Info sx={{ color: 'info.main', fontSize: 20, mr: 1 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 500, fontSize: '0.95rem' }}>
                    Datos Informativos
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', lineHeight: 1.3 }}>
                  Para información adicional, ayuda y datos de referencia
                </Typography>
              </Paper>
            </motion.div>
          </Grid>

          {/* Paper Acento Secondary - Complementario */}
          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
            >
              <Paper 
                sx={{ 
                  p: 2.5,
                  textAlign: 'center',
                  borderRadius: 1,
                  borderLeft: 4,
                  borderLeftColor: 'secondary.main',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  transition: 'all 0.25s ease',
                  height: 140,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  <Business sx={{ color: 'secondary.main', fontSize: 20, mr: 1 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 500, fontSize: '0.95rem' }}>
                    Información Empresarial
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', lineHeight: 1.3 }}>
                  Para datos empresariales, usuarios y gestión organizacional
                </Typography>
              </Paper>
            </motion.div>
          </Grid>

          {/* Ejemplo de Paper Acento Grande - Layout de Formulario */}
          <Grid item xs={12} md={6}>
            <motion.div
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
            >
              <Paper 
                sx={{ 
                  p: 2.5,
                  borderRadius: 1,
                  borderLeft: 4,
                  borderLeftColor: 'primary.main',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  transition: 'all 0.25s ease',
                  height: 140,
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                  <Assignment sx={{ color: 'primary.main', fontSize: 22, mr: 1.5 }} />
                  <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1.1rem' }}>
                    Formulario de Compromiso
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.85rem', lineHeight: 1.4, flex: 1 }}>
                  Ejemplo de contenedor para formularios y configuraciones detalladas usando el estilo Paper con Acento.
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip label="Consistente" color="success" size="small" sx={{ fontSize: '0.7rem', height: 24 }} />
                  <Chip label="Profesional" color="primary" size="small" sx={{ fontSize: '0.7rem', height: 24 }} />
                </Box>
              </Paper>
            </motion.div>
          </Grid>

          {/* Ejemplo de Paper Acento Grande - Dashboard Widget */}
          <Grid item xs={12} md={6}>
            <motion.div
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
            >
              <Paper 
                sx={{ 
                  p: 2.5,
                  borderRadius: 1,
                  borderLeft: 4,
                  borderLeftColor: 'success.main',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  transition: 'all 0.25s ease',
                  height: 140,
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TrendingUp sx={{ color: 'success.main', fontSize: 22, mr: 1.5 }} />
                    <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1.1rem' }}>
                      Rendimiento Mensual
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main', fontSize: '1.8rem' }}>
                    +24%
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', lineHeight: 1.4 }}>
                  Ejemplo de widget de dashboard utilizando el patrón consistente de Paper con Acento para mostrar métricas importantes.
                </Typography>
              </Paper>
            </motion.div>
          </Grid>
        </Grid>

        {/* Guía de Uso */}
        <Box sx={{ mt: 4, p: 3, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'grey.200' }}>
          <Typography variant="h6" sx={{ fontWeight: 500, mb: 2, display: 'flex', alignItems: 'center' }}>
            <Star sx={{ color: 'primary.main', mr: 1 }} />
            Guía de Uso - Paper con Acento
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5, color: 'primary.main' }}>
                Primary (Azul):
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Configuraciones, información general, elementos principales
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5, color: 'success.main' }}>
                Success (Verde):
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Confirmaciones, reportes positivos, elementos completados
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5, color: 'warning.main' }}>
                Warning (Naranja):
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Alertas, compromisos próximos, elementos que requieren atención
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5, color: 'error.main' }}>
                Error (Rojo):
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Errores, elementos críticos, situaciones urgentes
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5, color: 'info.main' }}>
                Info (Azul claro):
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Información adicional, ayuda, datos de referencia
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5, color: 'secondary.main' }}>
                Secondary (Púrpura):
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Información empresarial, usuarios, gestión organizacional
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </Grid>
    </Grid>
  );

  // Componente de paginación personalizado con selector de página adicional
  const CustomTablePagination = ({ count, rowsPerPage, page, onPageChange, sx = {} }) => {
    const totalPages = Math.ceil(count / rowsPerPage);
    const [directPage, setDirectPage] = useState(page + 1);

    const handleDirectPageChange = (event) => {
      const value = parseInt(event.target.value, 10);
      if (value >= 1 && value <= totalPages) {
        setDirectPage(value);
      }
    };

    const handleDirectPageSubmit = (event) => {
      if (event.key === 'Enter' || event.type === 'blur') {
        const newPage = Math.max(0, Math.min(directPage - 1, totalPages - 1));
        onPageChange(null, newPage);
      }
    };

    React.useEffect(() => {
      setDirectPage(page + 1);
    }, [page]);

    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        px: 2.5, 
        py: 1.5,
        borderTop: '1px solid', 
        borderColor: 'divider',
        ...sx 
      }}>
        {/* Paginación tradicional */}
        <TablePagination
          rowsPerPageOptions={[10]}
          component="div"
          count={count}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={onPageChange}
          onRowsPerPageChange={() => {}}
          sx={{ 
            border: 'none',
            '& .MuiTablePagination-toolbar': { px: 0 },
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
              fontSize: '0.8rem'
            }
          }}
        />

        {/* Selector de página adicional */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* Paginación con números */}
            <Pagination
              count={totalPages}
              page={page + 1}
              onChange={(event, value) => onPageChange(event, value - 1)}
              size="small"
              color="primary"
              showFirstButton
              showLastButton
              sx={{
                '& .MuiPagination-ul': {
                  flexWrap: 'nowrap'
                },
                '& .MuiPaginationItem-root': {
                  fontSize: '0.75rem',
                  minWidth: '28px',
                  height: '28px'
                }
              }}
            />

            <Divider orientation="vertical" flexItem />

            {/* Input directo de página */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                Ir a página:
              </Typography>
              <TextField
                size="small"
                type="number"
                value={directPage}
                onChange={handleDirectPageChange}
                onKeyPress={handleDirectPageSubmit}
                onBlur={handleDirectPageSubmit}
                inputProps={{ 
                  min: 1, 
                  max: totalPages,
                  style: { 
                    textAlign: 'center', 
                    fontSize: '0.75rem',
                    padding: '4px 8px',
                    width: '50px'
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '32px',
                    '& fieldset': {
                      borderColor: 'divider'
                    },
                    '&:hover fieldset': {
                      borderColor: 'primary.main'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                      borderWidth: '1px'
                    }
                  }
                }}
              />
              <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                de {totalPages}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    );
  };

  const renderTablesSection = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
          📊 Tablas
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Tablas profesionales para visualización clara de datos empresariales - Cada tabla está diseñada para casos de uso específicos
        </Typography>
      </Grid>

      {/* Tabla Básica Profesional - LECTURA SIMPLE */}
      <Grid item xs={12}>
        <Paper 
          sx={{ 
            p: 0,
            borderRadius: 1,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            border: '1px solid',
            borderColor: 'grey.200',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ p: 3, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'grey.200' }}>
            <Typography variant="h5" sx={{ fontWeight: 700, fontSize: '1.15rem', color: 'text.primary', mb: 0.5 }}>
              Tabla Básica Profesional
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem', lineHeight: 1.4, mb: 1 }}>
              <strong>Caso de uso:</strong> Visualización simple de datos sin interacción compleja
            </Typography>
            <Typography variant="body2" color="info.main" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
              ✅ Reportes generales • Listas de consulta • Datos de solo lectura
            </Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'rgba(0, 0, 0, 0.03)' }}>
                <TableRow>
                  <TableCell sx={{ 
                    fontWeight: 800, 
                    fontSize: '0.8rem', 
                    py: 2, 
                    color: 'text.primary', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.8px',
                    fontFamily: 'inherit'
                  }}>Empresa</TableCell>
                  <TableCell sx={{ 
                    fontWeight: 800, 
                    fontSize: '0.8rem', 
                    py: 2, 
                    color: 'text.primary', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.8px',
                    fontFamily: 'inherit'
                  }}>NIT</TableCell>
                  <TableCell sx={{ 
                    fontWeight: 800, 
                    fontSize: '0.8rem', 
                    py: 2, 
                    color: 'text.primary', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.8px',
                    fontFamily: 'inherit'
                  }}>Compromiso</TableCell>
                  <TableCell align="right" sx={{ 
                    fontWeight: 800, 
                    fontSize: '0.8rem', 
                    py: 2, 
                    color: 'text.primary', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.8px',
                    fontFamily: 'inherit'
                  }}>Monto</TableCell>
                  <TableCell sx={{ 
                    fontWeight: 800, 
                    fontSize: '0.8rem', 
                    py: 2, 
                    color: 'text.primary', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.8px',
                    fontFamily: 'inherit'
                  }}>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tableData.slice(0, 3).map((row, index) => (
                  <TableRow 
                    key={row.id}
                    sx={{ 
                      '&:hover': { 
                        bgcolor: 'action.hover',
                        transition: 'all 0.2s ease'
                      },
                      '&:last-child td': { borderBottom: 0 }
                    }}
                  >
                    <TableCell sx={{ py: 1.8, fontSize: '0.85rem', fontWeight: 500 }}>{row.name}</TableCell>
                    <TableCell sx={{ py: 1.8, fontSize: '0.8rem', color: 'text.secondary' }}>{row.nit}</TableCell>
                    <TableCell sx={{ py: 1.8, fontSize: '0.85rem' }}>{row.commitment}</TableCell>
                    <TableCell align="right" sx={{ py: 1.8, fontWeight: 600, fontSize: '0.85rem' }}>
                      {formatCOP(row.amount)}
                    </TableCell>
                    <TableCell sx={{ py: 1.8 }}>
                      <Chip 
                        label={row.status} 
                        color={getStatusColor(row.status)} 
                        size="small"
                        sx={{ fontWeight: 500, fontSize: '0.75rem', height: 24 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <CustomTablePagination
            count={tableData.length}
            rowsPerPage={10}
            page={0}
            onPageChange={() => {}}
          />
        </Paper>
      </Grid>

      {/* Tabla con Selección y Ordenamiento - GESTIÓN AVANZADA */}
      <Grid item xs={12}>
        <Paper 
          sx={{ 
            p: 0,
            borderRadius: 1,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            border: '1px solid',
            borderColor: 'grey.200',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ p: 3, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'grey.200' }}>
            <Typography variant="h5" sx={{ fontWeight: 700, fontSize: '1.15rem', color: 'text.primary', mb: 0.5 }}>
              Tabla de Gestión Avanzada
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem', lineHeight: 1.4, mb: 1 }}>
              <strong>Caso de uso:</strong> Administración completa con selección múltiple y ordenamiento
            </Typography>
            <Typography variant="body2" color="warning.main" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
              ⚡ Gestión de compromisos • Acciones masivas • Administración de usuarios
            </Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'rgba(0, 0, 0, 0.03)' }}>
                <TableRow>
                  <TableCell padding="checkbox" sx={{ py: 1.8 }}>
                    <Checkbox
                      indeterminate={selected.length > 0 && selected.length < tableData.length}
                      checked={tableData.length > 0 && selected.length === tableData.length}
                      onChange={handleSelectAllClick}
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={{ py: 1.8 }}>
                    <TableSortLabel
                      active={orderBy === 'name'}
                      direction={orderBy === 'name' ? order : 'asc'}
                      onClick={() => handleRequestSort('name')}
                      sx={{ 
                        fontWeight: 800, 
                        fontSize: '0.8rem', 
                        color: 'text.primary', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.8px',
                        fontFamily: 'inherit',
                        '& .MuiTableSortLabel-icon': {
                          fontSize: '0.9rem'
                        }
                      }}
                    >
                      Empresa
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ 
                    fontWeight: 800, 
                    fontSize: '0.8rem', 
                    py: 1.8, 
                    color: 'text.primary', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.8px',
                    fontFamily: 'inherit'
                  }}>NIT</TableCell>
                  <TableCell sx={{ 
                    fontWeight: 800, 
                    fontSize: '0.8rem', 
                    py: 1.8, 
                    color: 'text.primary', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.8px',
                    fontFamily: 'inherit'
                  }}>Compromiso</TableCell>
                  <TableCell align="right" sx={{ py: 1.8 }}>
                    <TableSortLabel
                      active={orderBy === 'amount'}
                      direction={orderBy === 'amount' ? order : 'asc'}
                      onClick={() => handleRequestSort('amount')}
                      sx={{ 
                        fontWeight: 800, 
                        fontSize: '0.8rem', 
                        color: 'text.primary', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.8px',
                        fontFamily: 'inherit',
                        '& .MuiTableSortLabel-icon': {
                          fontSize: '0.9rem'
                        }
                      }}
                    >
                      Monto
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ 
                    fontWeight: 800, 
                    fontSize: '0.8rem', 
                    py: 1.8, 
                    color: 'text.primary', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.8px',
                    fontFamily: 'inherit'
                  }}>Estado</TableCell>
                  <TableCell sx={{ 
                    fontWeight: 800, 
                    fontSize: '0.8rem', 
                    py: 1.8, 
                    color: 'text.primary', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.8px',
                    fontFamily: 'inherit'
                  }}>Prioridad</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tableData
                  .slice(page * 10, page * 10 + 10)
                  .map((row) => {
                    const isItemSelected = selected.indexOf(row.id) !== -1;
                    return (
                      <TableRow 
                        key={row.id}
                        hover
                        onClick={() => handleClick(row.id)}
                        selected={isItemSelected}
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { 
                            bgcolor: 'action.hover',
                            transition: 'all 0.2s ease'
                          },
                          '&.Mui-selected': {
                            bgcolor: 'primary.light',
                            '&:hover': {
                              bgcolor: 'primary.light'
                            }
                          }
                        }}
                      >
                        <TableCell padding="checkbox" sx={{ py: 1.5 }}>
                          <Checkbox checked={isItemSelected} size="small" />
                        </TableCell>
                        <TableCell sx={{ py: 1.5, fontSize: '0.85rem', fontWeight: 500 }}>{row.name}</TableCell>
                        <TableCell sx={{ py: 1.5, fontSize: '0.8rem', color: 'text.secondary' }}>{row.nit}</TableCell>
                        <TableCell sx={{ py: 1.5, fontSize: '0.85rem' }}>{row.commitment}</TableCell>
                        <TableCell align="right" sx={{ py: 1.5, fontWeight: 600, fontSize: '0.85rem' }}>
                          {formatCOP(row.amount)}
                        </TableCell>
                        <TableCell sx={{ py: 1.5 }}>
                          <Chip 
                            label={row.status} 
                            color={getStatusColor(row.status)} 
                            size="small"
                            sx={{ fontWeight: 500, fontSize: '0.75rem', height: 24 }}
                          />
                        </TableCell>
                        <TableCell sx={{ py: 1.5 }}>
                          <Chip 
                            label={row.priority} 
                            color={getPriorityColor(row.priority)} 
                            size="small" 
                            variant="outlined"
                            sx={{ fontWeight: 500, fontSize: '0.75rem', height: 24 }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>
          <CustomTablePagination
            count={tableData.length}
            rowsPerPage={10}
            page={page}
            onPageChange={handleChangePage}
          />
        </Paper>
      </Grid>

      {/* Tabla Premium Ejecutiva - DASHBOARD PRINCIPAL */}
      <Grid item xs={12}>
        <Paper 
          sx={{ 
            overflow: 'hidden',
            borderRadius: 1,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid',
            borderColor: 'grey.200'
          }}
        >
          <Box
            sx={{
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%)',
              color: 'white',
              p: 2.5
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 600, fontSize: '1.2rem', mb: 0.5 }}>
              Tabla Ejecutiva Premium
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.92, fontSize: '0.82rem', lineHeight: 1.4, mb: 1 }}>
              <strong>Caso de uso:</strong> Dashboard principal y vistas ejecutivas de alto nivel
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.8rem', fontWeight: 500 }}>
              🎯 Resúmenes ejecutivos • KPIs principales • Vistas de director
            </Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead 
                sx={{ 
                  background: 'rgba(102, 126, 234, 0.08)',
                }}
              >
                <TableRow>
                  <TableCell sx={{ 
                    fontWeight: 800, 
                    fontSize: '0.8rem', 
                    py: 1.8, 
                    color: 'text.primary', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.8px',
                    fontFamily: 'inherit'
                  }}>Empresa</TableCell>
                  <TableCell sx={{ 
                    fontWeight: 800, 
                    fontSize: '0.8rem', 
                    py: 1.8, 
                    color: 'text.primary', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.8px',
                    fontFamily: 'inherit'
                  }}>Compromiso</TableCell>
                  <TableCell align="right" sx={{ 
                    fontWeight: 800, 
                    fontSize: '0.8rem', 
                    py: 1.8, 
                    color: 'text.primary', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.8px',
                    fontFamily: 'inherit'
                  }}>Monto</TableCell>
                  <TableCell sx={{ 
                    fontWeight: 800, 
                    fontSize: '0.8rem', 
                    py: 1.8, 
                    color: 'text.primary', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.8px',
                    fontFamily: 'inherit'
                  }}>Fecha Vencimiento</TableCell>
                  <TableCell sx={{ 
                    fontWeight: 800, 
                    fontSize: '0.8rem', 
                    py: 1.8, 
                    color: 'text.primary', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.8px',
                    fontFamily: 'inherit'
                  }}>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tableData.slice(0, 3).map((row, index) => (
                  <motion.tr 
                    key={row.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                    component={TableRow}
                    sx={{ 
                      '&:hover': { 
                        backgroundColor: 'rgba(102, 126, 234, 0.04)',
                        transition: 'all 0.2s ease'
                      },
                      '&:last-child td': { borderBottom: 0 }
                    }}
                  >
                    <TableCell sx={{ py: 1.5, fontSize: '0.85rem', fontWeight: 500 }}>{row.name}</TableCell>
                    <TableCell sx={{ py: 1.5, fontSize: '0.85rem' }}>{row.commitment}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, py: 1.5, fontSize: '0.85rem' }}>
                      {formatCOP(row.amount)}
                    </TableCell>
                    <TableCell sx={{ py: 1.5, fontSize: '0.8rem', color: 'text.secondary' }}>{row.dueDate}</TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Chip 
                        label={row.status} 
                        color={getStatusColor(row.status)} 
                        size="small"
                        sx={{
                          fontWeight: 500,
                          fontSize: '0.75rem',
                          height: 24,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'scale(1.02)'
                          }
                        }}
                      />
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <CustomTablePagination
            count={tableData.length}
            rowsPerPage={10}
            page={0}
            onPageChange={() => {}}
            sx={{ background: 'rgba(102, 126, 234, 0.02)' }}
          />
        </Paper>
      </Grid>

      {/* Tablas para Espacios Reducidos */}
      <Grid item xs={12} md={6}>
        <Paper 
          sx={{ 
            p: 0,
            borderRadius: 1,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            border: '1px solid',
            borderColor: 'grey.200',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ p: 2.5, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'grey.200' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem', color: 'text.primary', mb: 0.3 }}>
              Tabla Compacta
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.78rem', lineHeight: 1.3, mb: 1 }}>
              <strong>Caso de uso:</strong> Paneles laterales y espacios reducidos
            </Typography>
            <Typography variant="body2" color="success.main" sx={{ fontSize: '0.76rem', fontWeight: 500 }}>
              📱 Sidebars • Widgets • Resúmenes compactos
            </Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'rgba(0, 0, 0, 0.03)' }}>
                <TableRow>
                  <TableCell sx={{ 
                    fontWeight: 800, 
                    fontSize: '0.75rem', 
                    py: 1.5, 
                    color: 'text.primary', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.7px',
                    fontFamily: 'inherit'
                  }}>Empresa</TableCell>
                  <TableCell align="right" sx={{ 
                    fontWeight: 800, 
                    fontSize: '0.75rem', 
                    py: 1.5, 
                    color: 'text.primary', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.7px',
                    fontFamily: 'inherit'
                  }}>Monto</TableCell>
                  <TableCell sx={{ 
                    fontWeight: 800, 
                    fontSize: '0.75rem', 
                    py: 1.5, 
                    color: 'text.primary', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.7px',
                    fontFamily: 'inherit'
                  }}>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tableData.slice(0, 4).map((row) => (
                  <TableRow 
                    key={row.id}
                    sx={{
                      '&:hover': { 
                        bgcolor: 'action.hover',
                        transition: 'all 0.2s ease'
                      },
                      '&:last-child td': { borderBottom: 0 }
                    }}
                  >
                    <TableCell sx={{ py: 1, fontSize: '0.8rem', fontWeight: 500 }}>{row.name}</TableCell>
                    <TableCell align="right" sx={{ py: 1, fontWeight: 600, fontSize: '0.8rem' }}>
                      {formatCOP(row.amount)}
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
                      <Chip 
                        label={row.status} 
                        color={getStatusColor(row.status)} 
                        size="small"
                        sx={{ fontWeight: 500, fontSize: '0.7rem', height: 20 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <CustomTablePagination
            count={tableData.length}
            rowsPerPage={10}
            page={0}
            onPageChange={() => {}}
            sx={{ 
              px: 1.5,
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                fontSize: '0.75rem'
              }
            }}
          />
        </Paper>
      </Grid>

      {/* Tabla de Análisis con Alternancia */}
      <Grid item xs={12} md={6}>
        <Paper 
          sx={{ 
            p: 0,
            borderRadius: 1,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            border: '1px solid',
            borderColor: 'grey.200',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ p: 2.5, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'grey.200' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem', color: 'text.primary', mb: 0.3 }}>
              Tabla de Análisis
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.78rem', lineHeight: 1.3, mb: 1 }}>
              <strong>Caso de uso:</strong> Comparaciones y análisis de datos con filas alternas
            </Typography>
            <Typography variant="body2" color="secondary.main" sx={{ fontSize: '0.76rem', fontWeight: 500 }}>
              📊 Reportes comparativos • Análisis financieros • Auditorías
            </Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'rgba(0, 0, 0, 0.03)' }}>
                <TableRow>
                  <TableCell sx={{ 
                    fontWeight: 800, 
                    fontSize: '0.75rem', 
                    py: 1.5, 
                    color: 'text.primary', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.7px',
                    fontFamily: 'inherit'
                  }}>Empresa</TableCell>
                  <TableCell align="right" sx={{ 
                    fontWeight: 800, 
                    fontSize: '0.75rem', 
                    py: 1.5, 
                    color: 'text.primary', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.7px',
                    fontFamily: 'inherit'
                  }}>Monto</TableCell>
                  <TableCell sx={{ 
                    fontWeight: 800, 
                    fontSize: '0.75rem', 
                    py: 1.5, 
                    color: 'text.primary', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.7px',
                    fontFamily: 'inherit'
                  }}>Prioridad</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tableData.slice(0, 4).map((row, index) => (
                  <TableRow 
                    key={row.id}
                    sx={{ 
                      backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(0, 0, 0, 0.02)',
                      '&:hover': { 
                        backgroundColor: 'action.hover',
                        transition: 'all 0.2s ease'
                      },
                      '&:last-child td': { borderBottom: 0 }
                    }}
                  >
                    <TableCell sx={{ py: 1.2, fontSize: '0.8rem', fontWeight: 500 }}>{row.name}</TableCell>
                    <TableCell align="right" sx={{ py: 1.2, fontWeight: 600, fontSize: '0.8rem' }}>
                      {formatCOP(row.amount)}
                    </TableCell>
                    <TableCell sx={{ py: 1.2 }}>
                      <Chip 
                        label={row.priority} 
                        color={getPriorityColor(row.priority)} 
                        size="small" 
                        variant="outlined"
                        sx={{ fontWeight: 500, fontSize: '0.7rem', height: 22 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <CustomTablePagination
            count={tableData.length}
            rowsPerPage={10}
            page={0}
            onPageChange={() => {}}
            sx={{ 
              px: 1.5,
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                fontSize: '0.75rem'
              }
            }}
          />
        </Paper>
      </Grid>
    </Grid>
  );

  const renderFormsSection = () => {
    return (
      <FormulariosUnificadosSimple />
    );
  };

  const renderModalsSection = () => (
    <ModalesUnifiedPage />
  );

  const renderDataDisplaySection = () => {
    // 🎨 Design System 3.0 Tokens Implementation
    const avatarSizes = {
      xs: { width: 24, height: 24, fontSize: '0.75rem' },
      sm: { width: 32, height: 32, fontSize: '0.875rem' },
      md: { width: 40, height: 40, fontSize: '1rem' },
      lg: { width: 56, height: 56, fontSize: '1.25rem' },
      xl: { width: 72, height: 72, fontSize: '1.5rem' }
    };

    const avatarVariants = [
      { bgcolor: theme.palette.primary.main, label: 'DR' },
      { bgcolor: theme.palette.secondary.main, label: 'AB' },
      { bgcolor: theme.palette.success.main, label: 'CD' },
      { bgcolor: theme.palette.warning.main, label: 'EF' },
      { bgcolor: theme.palette.error.main, label: 'GH' }
    ];

    const enterpriseListData = [
      {
        id: 1,
        avatar: { icon: Business, color: theme.palette.primary.main },
        primary: "DR GROUP SAS",
        secondary: "NIT: 900.123.456-7",
        status: { label: "Activo", color: "success", variant: "filled" },
        metrics: { value: "15 Compromisos", trend: "+2" }
      },
      {
        id: 2,
        avatar: { icon: AttachMoney, color: theme.palette.warning.main },
        primary: "$2.500.000 COP",
        secondary: "Arriendo Local - Vence 15/08/2025",
        status: { label: "Pendiente", color: "warning", variant: "outlined" },
        metrics: { value: "3 días", trend: "crítico" }
      },
      {
        id: 3,
        avatar: { icon: CheckCircle, color: theme.palette.success.main },
        primary: "Pago Procesado",
        secondary: "Transferencia bancaria - 05/08/2025",
        status: { label: "Completado", color: "success", variant: "filled" },
        metrics: { value: "Confirmado", trend: "ok" }
      }
    ];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography 
              variant="h4" 
              gutterBottom
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                backgroundClip: 'text',
                textFillColor: 'transparent',
                fontWeight: 700,
                mb: 1
              }}
            >
              📊 Data Display - Design System 3.0
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Componentes de visualización de datos siguiendo los tokens del Design System 3.0
            </Typography>
          </Grid>

          {/* 🎯 Avatares Enterprise */}
          <Grid item xs={12}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3,
                background: `linear-gradient(135deg, ${theme.palette.background.paper}, ${theme.palette.background.default})`,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3,
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: theme.shadows[4],
                  transform: 'translateY(-2px)'
                }
              }}
            >
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: theme.palette.primary.main,
                  fontWeight: 600
                }}
              >
                👤 Avatares Empresariales
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                    Tamaños Estandarizados (DS 3.0)
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    {Object.entries(avatarSizes).map(([size, styles]) => (
                      <motion.div
                        key={size}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Avatar 
                          sx={{ 
                            ...styles,
                            bgcolor: theme.palette.primary.main,
                            boxShadow: theme.shadows[2],
                            transition: 'all 0.3s ease'
                          }}
                        >
                          {size.toUpperCase()}
                        </Avatar>
                      </motion.div>
                    ))}
                  </Box>

                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                    Variaciones con Iconos
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: theme.palette.primary.main, boxShadow: theme.shadows[2] }}>
                      <Person />
                    </Avatar>
                    <Avatar sx={{ bgcolor: theme.palette.secondary.main, boxShadow: theme.shadows[2] }}>
                      <Business />
                    </Avatar>
                    <Avatar sx={{ bgcolor: theme.palette.success.main, boxShadow: theme.shadows[2] }}>
                      <AttachMoney />
                    </Avatar>
                    <Avatar sx={{ bgcolor: theme.palette.warning.main, boxShadow: theme.shadows[2] }}>
                      <Analytics />
                    </Avatar>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                    Avatar Group Empresarial
                  </Typography>
                  <AvatarGroup 
                    max={4} 
                    sx={{ 
                      mb: 2,
                      '& .MuiAvatar-root': {
                        border: `2px solid ${theme.palette.background.paper}`,
                        boxShadow: theme.shadows[2]
                      }
                    }}
                  >
                    {avatarVariants.map((variant, index) => (
                      <Avatar key={index} sx={{ bgcolor: variant.bgcolor }}>
                        {variant.label}
                      </Avatar>
                    ))}
                  </AvatarGroup>
                  <Typography variant="caption" color="text.secondary">
                    💡 Ideal para mostrar equipos, múltiples usuarios o stakeholders del compromiso
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* 📋 Listas Enterprise */}
          <Grid item xs={12} md={6}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3,
                background: `linear-gradient(135deg, ${theme.palette.background.paper}, ${theme.palette.background.default})`,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3,
                overflow: 'hidden'
              }}
            >
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: theme.palette.primary.main,
                  fontWeight: 600,
                  mb: 2
                }}
              >
                📋 Listas de Datos Empresariales
              </Typography>
              
              <List disablePadding>
                {enterpriseListData.map((item, index) => (
                  <React.Fragment key={item.id}>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <ListItem
                        sx={{
                          borderRadius: 2,
                          mb: 1,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            bgcolor: `${theme.palette.primary.main}08`,
                            transform: 'translateX(4px)'
                          }
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar 
                            sx={{ 
                              bgcolor: item.avatar.color,
                              boxShadow: theme.shadows[2]
                            }}
                          >
                            <item.avatar.icon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary={
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {item.primary}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="body2" color="text.secondary">
                              {item.secondary}
                            </Typography>
                          }
                        />
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                          <Chip 
                            label={item.status.label} 
                            color={item.status.color}
                            variant={item.status.variant}
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {item.metrics.value}
                          </Typography>
                        </Box>
                      </ListItem>
                    </motion.div>
                    {index < enterpriseListData.length - 1 && (
                      <Divider 
                        variant="inset" 
                        component="li"
                        sx={{ 
                          ml: 7,
                          background: `linear-gradient(90deg, ${theme.palette.divider}, transparent)`
                        }}
                      />
                    )}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* ➗ Dividers Avanzados */}
          <Grid item xs={12} md={6}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3,
                background: `linear-gradient(135deg, ${theme.palette.background.paper}, ${theme.palette.background.default})`,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3
              }}
            >
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: theme.palette.primary.main,
                  fontWeight: 600
                }}
              >
                ➗ Separadores Empresariales
              </Typography>
              
              <Typography variant="body2" paragraph color="text.secondary">
                Separador horizontal básico
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Typography variant="body2" sx={{ mb: 1 }} color="text.secondary">
                Separador con contenido
              </Typography>
              <Divider textAlign="center" sx={{ mb: 2 }}>
                <Chip 
                  label="COMPROMISOS FINANCIEROS" 
                  size="small"
                  sx={{ 
                    bgcolor: theme.palette.primary.main,
                    color: 'white',
                    fontWeight: 600
                  }}
                />
              </Divider>
              
              <Typography variant="body2" sx={{ mb: 1 }} color="text.secondary">
                Separador con gradiente empresarial
              </Typography>
              <Box
                sx={{
                  height: 2,
                  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  borderRadius: 1,
                  mb: 2
                }}
              />
              
              <Typography variant="body2" sx={{ mb: 1 }} color="text.secondary">
                Separadores verticales en layout flex
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Dashboard</Typography>
                <Divider orientation="vertical" flexItem />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Compromisos</Typography>
                <Divider orientation="vertical" flexItem />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Reportes</Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </motion.div>
    );
  };

  const renderLoadingSection = () => (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          ⚡ Estados de Carga
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 6, maxWidth: '80%' }}>
          Estados de carga empresariales con tokens DS 3.0 y micro-interacciones premium
        </Typography>
      </Grid>

      {/* Skeletons - Mejor espaciado */}
      <Grid item xs={12}>
        <Paper {...cardsUtils.createPaperAccent('info', 'large')} sx={{ mb: 6 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ color: 'info.main', fontWeight: 600, mb: 1 }}>
              📊 Skeletons - Placeholders Empresariales
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Placeholders animados con gradientes spectacular y contexto empresarial
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} lg={6}>
              <Typography variant="subtitle1" gutterBottom sx={{ color: 'primary.main', fontWeight: 600, mb: 3 }}>
                💼 Card Empresarial Skeleton
              </Typography>
              
              {/* Card Skeleton Premium con gradientes DS 3.0 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <Card sx={{ 
                  mb: 3, 
                  background: `linear-gradient(135deg, ${theme.palette.background.paper}, ${theme.palette.background.default})`,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                  '&:hover': { 
                    boxShadow: theme.shadows[4], 
                    transform: 'translateY(-2px)',
                    transition: 'all 0.3s ease-in-out'
                  }
                }}>
                  <CardContent sx={{ p: 3 }}>
                    {/* Header con avatar y datos empresariales */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Skeleton 
                        variant="circular" 
                        width={48} 
                        height={48} 
                        sx={{ 
                          mr: 2,
                          background: `linear-gradient(90deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
                          opacity: 0.3
                        }}
                        animation="wave"
                      />
                      <Box sx={{ flexGrow: 1 }}>
                        <Skeleton 
                          variant="text" 
                          sx={{ 
                            fontSize: '1.25rem', 
                            width: '70%', 
                            mb: 1,
                            background: `linear-gradient(90deg, ${theme.palette.text.primary}, ${theme.palette.text.secondary})`,
                            opacity: 0.2
                          }} 
                          animation="wave"
                        />
                        <Skeleton 
                          variant="text" 
                          sx={{ 
                            fontSize: '0.875rem', 
                            width: '90%',
                            background: `linear-gradient(90deg, ${theme.palette.text.secondary}, ${theme.palette.text.disabled})`,
                            opacity: 0.2
                          }} 
                          animation="wave"
                        />
                      </Box>
                      <Skeleton
                        variant="rectangular"
                        width={80}
                        height={32}
                        sx={{ 
                          borderRadius: 1,
                          background: `linear-gradient(90deg, ${theme.palette.success.light}, ${theme.palette.success.main})`,
                          opacity: 0.3
                        }}
                        animation="wave"
                      />
                    </Box>
                    
                    {/* Contenido principal */}
                    <Skeleton 
                      variant="rectangular" 
                      height={120} 
                      sx={{ 
                        mb: 3, 
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${theme.palette.primary.light}20, ${theme.palette.secondary.light}20)`,
                        opacity: 0.4
                      }} 
                      animation="wave"
                    />
                    
                    {/* Métricas empresariales */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {[1, 2, 3].map((item) => (
                        <Skeleton 
                          key={item}
                          variant="text" 
                          sx={{ 
                            width: `${60 + item * 10}%`,
                            background: `linear-gradient(90deg, ${theme.palette.info.light}, ${theme.palette.info.main})`,
                            opacity: 0.25,
                            height: 20
                          }} 
                          animation="wave"
                        />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
              
              {/* Skeleton Lista Empresarial */}
              <Typography variant="subtitle1" gutterBottom sx={{ color: 'secondary.main', fontWeight: 600, mb: 2 }}>
                📋 Lista de Compromisos Skeleton
              </Typography>
              <Box sx={{ 
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                overflow: 'hidden',
                mb: 2
              }}>
                {[1, 2, 3, 4].map((item) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: item * 0.1 }}
                  >
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      p: 2.5, 
                      gap: 2,
                      borderBottom: item !== 4 ? `1px solid ${theme.palette.divider}` : 'none',
                      minHeight: 80,
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                        transform: 'translateX(4px)',
                        transition: 'all 0.2s ease-in-out'
                      }
                    }}>
                      <Skeleton 
                        variant="circular" 
                        width={40} 
                        height={40} 
                        sx={{
                          background: `linear-gradient(135deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
                          opacity: 0.3
                        }}
                        animation="wave"
                      />
                      <Box sx={{ flexGrow: 1 }}>
                        <Skeleton 
                          variant="text" 
                          sx={{ 
                            width: '80%', 
                            fontSize: '1rem',
                            mb: 1,
                            background: `linear-gradient(90deg, ${theme.palette.text.primary}, ${theme.palette.text.secondary})`,
                            opacity: 0.2
                          }} 
                          animation="wave"
                        />
                        <Skeleton 
                          variant="text" 
                          sx={{ 
                            width: '60%', 
                            fontSize: '0.875rem',
                            background: `linear-gradient(90deg, ${theme.palette.text.secondary}, ${theme.palette.text.disabled})`,
                            opacity: 0.2
                          }} 
                          animation="wave"
                        />
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                        <Skeleton 
                          variant="rectangular" 
                          width={80} 
                          height={24} 
                          sx={{ 
                            borderRadius: 1,
                            background: item % 2 === 0 
                              ? `linear-gradient(90deg, ${theme.palette.success.light}, ${theme.palette.success.main})`
                              : `linear-gradient(90deg, ${theme.palette.warning.light}, ${theme.palette.warning.main})`,
                            opacity: 0.3
                          }}
                          animation="wave"
                        />
                        <Skeleton 
                          variant="text" 
                          sx={{ 
                            width: '60px', 
                            fontSize: '0.75rem',
                            background: `linear-gradient(90deg, ${theme.palette.text.disabled}, transparent)`,
                            opacity: 0.2
                          }} 
                          animation="wave"
                        />
                      </Box>
                    </Box>
                  </motion.div>
                ))}
              </Box>
            </Grid>
            
            <Grid item xs={12} lg={6}>
              <Typography variant="subtitle1" gutterBottom sx={{ color: 'success.main', fontWeight: 600, mb: 2 }}>
                📊 Dashboard Metrics Skeleton
              </Typography>
              
              {/* Cards de métricas skeleton */}
              <Grid container spacing={2} sx={{ mb: 4 }}>
                {[
                  { color: 'primary', label: 'Compromisos' },
                  { color: 'success', label: 'Pagado' },
                  { color: 'warning', label: 'Pendiente' }
                ].map((metric, index) => (
                  <Grid item xs={4} key={metric.color}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <Paper sx={{
                        p: 2.5,
                        textAlign: 'center',
                        border: `2px solid ${theme.palette[metric.color].main}`,
                        borderRadius: 2,
                        height: 120,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        '&:hover': {
                          transform: 'scale(1.05)',
                          boxShadow: `0 4px 20px ${theme.palette[metric.color].main}30`,
                          transition: 'all 0.3s ease-in-out'
                        }
                      }}>
                        <Skeleton
                          variant="text"
                          sx={{
                            fontSize: '2rem',
                            width: '80%',
                            mx: 'auto',
                            mb: 1,
                            background: `linear-gradient(90deg, ${theme.palette[metric.color].light}, ${theme.palette[metric.color].main})`,
                            opacity: 0.4
                          }}
                          animation="wave"
                        />
                        <Skeleton
                          variant="text"
                          sx={{
                            fontSize: '0.75rem',
                            width: '100%',
                            background: `linear-gradient(90deg, ${theme.palette.text.secondary}, ${theme.palette.text.disabled})`,
                            opacity: 0.3
                          }}
                          animation="wave"
                        />
                      </Paper>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>

              <Typography variant="subtitle1" gutterBottom sx={{ color: 'warning.main', fontWeight: 600, mb: 2 }}>
                📈 Tabla Ejecutiva Skeleton
              </Typography>
              
              {/* Tabla skeleton con header gradiente */}
              <Box sx={{ 
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                overflow: 'hidden'
              }}>
                {/* Header tabla con gradiente DS 3.0 */}
                <Box sx={{
                  p: 2,
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%)',
                  color: 'white'
                }}>
                  <Box sx={{ display: 'flex', gap: 3 }}>
                    {['Empresa', 'Monto', 'Estado'].map((header, index) => (
                      <Skeleton
                        key={header}
                        variant="text"
                        sx={{
                          flex: index === 0 ? 2 : 1,
                          fontSize: '0.875rem',
                          backgroundColor: 'rgba(255, 255, 255, 0.2)',
                          height: 20
                        }}
                        animation="wave"
                      />
                    ))}
                  </Box>
                </Box>
                
                {/* Rows skeleton */}
                {[1, 2, 3].map((item) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: item * 0.1 }}
                  >
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: 2,
                      gap: 3,
                      minHeight: 70,
                      borderBottom: item !== 3 ? `1px solid ${theme.palette.divider}` : 'none',
                      '&:hover': {
                        backgroundColor: 'rgba(102, 126, 234, 0.04)',
                        transition: 'all 0.2s ease-in-out'
                      }
                    }}>
                      <Box sx={{ flex: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Skeleton variant="circular" width={24} height={24} animation="wave" />
                        <Skeleton variant="text" sx={{ width: '70%' }} animation="wave" />
                      </Box>
                      <Skeleton variant="text" sx={{ flex: 1 }} animation="wave" />
                      <Box sx={{ flex: 1 }}>
                        <Skeleton 
                          variant="rectangular" 
                          width={60} 
                          height={20} 
                          sx={{ borderRadius: 1 }}
                          animation="wave" 
                        />
                      </Box>
                    </Box>
                  </motion.div>
                ))}
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      {/* Progress Indicators con Tokens DS 3.0 */}
      <Grid item xs={12} sx={{ mb: 4 }}>
        <Paper {...cardsUtils.createPaperAccent('primary', 'large')} sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600, mb: 2 }}>
            🎯 Progress Indicators Empresariales
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 4 }}>
            Indicadores de progreso con gradientes spectacular y contextos empresariales
          </Typography>
          
          <Grid container spacing={4}>
            <Grid item xs={12} lg={4}>
              <Typography variant="subtitle1" gutterBottom sx={{ color: 'primary.main', fontWeight: 600, mb: 3 }}>
                ⭕ Circular Progress Premium
              </Typography>
              
              {/* Circular básicos con colores DS 3.0 */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontWeight: 500 }}>
                  Contextos Empresariales
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', mb: 4 }}>
                  {[
                    { color: 'primary', context: 'Compromisos' },
                    { color: 'secondary', context: 'Empresas' },
                    { color: 'success', context: 'Pagado' },
                    { color: 'warning', context: 'Pendiente' },
                    { color: 'error', context: 'Vencido' }
                  ].map((item, index) => (
                    <motion.div
                      key={item.color}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      whileHover={{ scale: 1.1 }}
                    >
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center',
                        p: 1.5,
                        borderRadius: 2,
                        minWidth: 80,
                        '&:hover': {
                          backgroundColor: `${theme.palette[item.color].main}08`,
                          transition: 'all 0.3s ease-in-out'
                        }
                      }}>
                        <CircularProgress 
                          size={44} 
                          color={item.color}
                          thickness={4}
                          sx={{
                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                            mb: 1
                          }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ 
                          fontSize: '0.7rem', 
                          textAlign: 'center',
                          fontWeight: 500
                        }}>
                          {item.context}
                        </Typography>
                      </Box>
                    </motion.div>
                  ))}
                </Box>
              </Box>
              
              {/* Progress determinados con métricas empresariales */}
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontWeight: 500 }}>
                📊 Progress con Métricas Empresariales
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                {[
                  { value: 25, color: 'warning', label: 'Pendientes', context: '3 de 12' },
                  { value: 75, color: 'success', label: 'Completados', context: '9 de 12' },
                  { value: 100, color: 'info', label: 'Total', context: '12 compromisos' }
                ].map((progress, index) => (
                  <motion.div
                    key={progress.label}
                    initial={{ opacity: 0, rotate: -90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.2 }}
                  >
                    <Box sx={{ 
                      position: 'relative', 
                      display: 'inline-flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      p: 2,
                      borderRadius: 2,
                      border: `2px solid ${theme.palette[progress.color].main}20`,
                      minWidth: 120,
                      '&:hover': {
                        backgroundColor: `${theme.palette[progress.color].main}05`,
                        borderColor: `${theme.palette[progress.color].main}40`,
                        transform: 'translateY(-2px)',
                        boxShadow: `0 4px 20px ${theme.palette[progress.color].main}30`,
                        transition: 'all 0.3s ease-in-out'
                      }
                    }}>
                      <Box sx={{ position: 'relative', display: 'inline-flex', mb: 1.5 }}>
                        <CircularProgress 
                          variant="determinate" 
                          value={progress.value} 
                          size={56} 
                          color={progress.color}
                          thickness={5}
                          sx={{
                            filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))',
                            '& .MuiCircularProgress-circle': {
                              strokeLinecap: 'round',
                            }
                          }}
                        />
                        <Box sx={{
                          top: 0, left: 0, bottom: 0, right: 0,
                          position: 'absolute',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'column'
                        }}>
                          <Typography 
                            variant="caption" 
                            component="div" 
                            sx={{ 
                              color: `${progress.color}.main`, 
                              fontWeight: 700,
                              fontSize: '0.875rem'
                            }}
                          >
                            {progress.value}%
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ 
                          color: `${progress.color}.main`, 
                          fontWeight: 600,
                          display: 'block',
                          mb: 0.5
                        }}>
                          {progress.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                          {progress.context}
                        </Typography>
                      </Box>
                    </Box>
                  </motion.div>
                ))}
              </Box>
            </Grid>
            
            <Grid item xs={12} lg={4}>
              <Typography variant="subtitle1" gutterBottom sx={{ color: 'secondary.main', fontWeight: 600, mb: 3 }}>
                📊 Linear Progress Empresarial
              </Typography>
              
              {/* Linear progress básico con altura y colores DS 3.0 */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontWeight: 500 }}>
                  Estados de Procesamiento
                </Typography>
                {[
                  { color: 'primary', label: 'Procesando compromisos...', height: 8 },
                  { color: 'secondary', label: 'Sincronizando empresas...', height: 8 },
                  { color: 'success', label: 'Validando pagos...', height: 8 },
                  { color: 'warning', label: 'Generando reportes...', height: 8 },
                  { color: 'error', label: 'Verificando vencidos...', height: 8 }
                ].map((progress, index) => (
                  <motion.div
                    key={progress.color}
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: '100%' }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                  >
                    <Box sx={{ mb: 2.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ 
                        display: 'block', 
                        mb: 1, 
                        fontSize: '0.75rem',
                        fontWeight: 500
                      }}>
                        {progress.label}
                      </Typography>
                      <LinearProgress 
                        color={progress.color}
                        sx={{ 
                          height: progress.height, 
                          borderRadius: 1,
                          backgroundColor: `${theme.palette[progress.color].main}15`,
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 1,
                            boxShadow: `0 1px 3px ${theme.palette[progress.color].main}40`
                          }
                        }} 
                      />
                    </Box>
                  </motion.div>
                ))}
              </Box>
              
              {/* Linear progress con valores determinados */}
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontWeight: 500 }}>
                📈 Progress con Métricas Específicas
              </Typography>
              <Box>
                {[
                  { value: 35, label: 'Compromisos del mes', color: 'primary', total: '7 de 20' },
                  { value: 68, buffer: 85, label: 'Pagos procesados', color: 'success', total: '15 de 22' },
                  { value: 92, label: 'Reportes generados', color: 'info', total: '23 de 25' }
                ].map((progress, index) => (
                  <motion.div
                    key={progress.label}
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ duration: 0.8, delay: index * 0.2 }}
                  >
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                          {progress.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          {progress.total}
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant={progress.buffer ? "buffer" : "determinate"} 
                        value={progress.value} 
                        valueBuffer={progress.buffer}
                        color={progress.color}
                        sx={{ 
                          height: 10, 
                          borderRadius: 1,
                          backgroundColor: `${theme.palette[progress.color].main}10`,
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 1,
                          },
                          '& .MuiLinearProgress-bar1Buffer': {
                            backgroundColor: `${theme.palette[progress.color].main}`,
                          },
                          '& .MuiLinearProgress-bar2Buffer': {
                            backgroundColor: `${theme.palette[progress.color].main}60`,
                          }
                        }} 
                      />
                    </Box>
                  </motion.div>
                ))}
              </Box>
            </Grid>
            
            <Grid item xs={12} lg={4}>
              <Typography variant="subtitle1" gutterBottom sx={{ color: 'info.main', fontWeight: 600, mb: 3 }}>
                ✨ Progress Spectacular Avanzado
              </Typography>
              
              <Box sx={{ mb: 4 }}>
                {/* Progress circular con gradiente spectacular */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <Box sx={{ 
                    position: 'relative', 
                    mb: 4,
                    display: 'flex',
                    justifyContent: 'center'
                  }}>
                    <Box sx={{
                      width: 100,
                      height: 100,
                      borderRadius: '50%',
                      background: `conic-gradient(${gradients.primary} 75%, ${theme.palette.divider} 75%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      filter: 'drop-shadow(0 4px 12px rgba(102, 126, 234, 0.3))',
                      '&:hover': {
                        filter: 'drop-shadow(0 6px 20px rgba(102, 126, 234, 0.4))',
                        transition: 'all 0.3s ease-in-out'
                      }
                    }}>
                      <Box sx={{
                        width: 75,
                        height: 75,
                        borderRadius: '50%',
                        backgroundColor: 'background.paper',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.05)'
                      }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>75%</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>Completado</Typography>
                      </Box>
                    </Box>
                  </Box>
                </motion.div>
                
                {/* Progress bars con gradientes */}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontWeight: 500 }}>
                  🎨 Progress Bars Spectacular
                </Typography>
                <Box sx={{ mb: 3 }}>
                  {[
                    { gradient: gradients.primary, label: 'Compromisos Activos', width: '80%' },
                    { gradient: gradients.secondary, label: 'Reportes Generados', width: '65%' },
                    { gradient: gradients.success, label: 'Pagos Completados', width: '90%' }
                  ].map((bar, index) => (
                    <motion.div
                      key={bar.label}
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: '100%' }}
                      transition={{ duration: 1, delay: index * 0.2 }}
                    >
                      <Box sx={{ mb: 2.5 }}>
                        <Typography variant="caption" sx={{ 
                          display: 'block', 
                          mb: 1, 
                          fontSize: '0.75rem',
                          fontWeight: 600 
                        }}>
                          {bar.label}
                        </Typography>
                        <Box sx={{
                          height: 12,
                          borderRadius: 2,
                          backgroundColor: theme.palette.divider,
                          overflow: 'hidden',
                          position: 'relative'
                        }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: bar.width }}
                            transition={{ duration: 1.5, delay: index * 0.3, ease: "easeOut" }}
                            style={{
                              height: '100%',
                              background: bar.gradient,
                              borderRadius: '6px',
                              boxShadow: `inset 0 1px 2px rgba(255,255,255,0.3), 0 1px 3px rgba(0,0,0,0.1)`,
                              position: 'relative'
                            }}
                          >
                            <Box sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              height: '50%',
                              background: 'linear-gradient(to bottom, rgba(255,255,255,0.3), transparent)',
                              borderRadius: '6px 6px 0 0'
                            }} />
                          </motion.div>
                        </Box>
                      </Box>
                    </motion.div>
                  ))}
                </Box>
                
                <Box sx={{ textAlign: 'center', mt: 3 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', fontWeight: 500 }}>
                    🎨 Progress Spectacular DS 3.0
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      {/* Estados Empresariales con Contexto DR Group */}
      <Grid item xs={12}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper {...cardsUtils.createPaperAccent('success', 'large')} sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ color: 'success.main', fontWeight: 600, mb: 2 }}>
                💼 Estados de Carga Empresariales
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 4 }}>
                Estados específicos para procesos empresariales DR Group
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                  {
                    gradient: gradients.primary,
                    icon: <Assignment />,
                    message: 'Cargando compromisos financieros...',
                    context: 'Sincronizando 15 compromisos activos',
                    color: 'primary'
                  },
                  {
                    gradient: gradients.success,
                    icon: <Payment />,
                    message: 'Procesando pagos pendientes...',
                    context: 'Validando 8 transacciones',
                    color: 'success'
                  },
                  {
                    gradient: gradients.info,
                    icon: <Assessment />,
                    message: 'Generando reportes ejecutivos...',
                    context: 'Compilando datos del período',
                    color: 'info'
                  },
                  {
                    gradient: gradients.warning,
                    icon: <Schedule />,
                    message: 'Verificando vencimientos...',
                    context: 'Revisando alertas automáticas',
                    color: 'warning'
                  }
                ].map((loader, index) => (
                  <motion.div
                    key={loader.message}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.3 }}
                    whileHover={{ scale: 1.01, x: 2 }}
                  >
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: 3,
                      background: loader.gradient,
                      color: 'white',
                      borderRadius: 2,
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: `0 4px 20px ${theme.palette[loader.color].main}30`,
                      '&:hover': {
                        boxShadow: `0 6px 25px ${theme.palette[loader.color].main}40`,
                        transition: 'all 0.3s ease-in-out'
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '50%',
                        background: 'linear-gradient(to bottom, rgba(255,255,255,0.15), transparent)',
                        pointerEvents: 'none'
                      }
                    }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        mr: 2,
                        backdropFilter: 'blur(10px)'
                      }}>
                        {React.cloneElement(loader.icon, { 
                          sx: { color: 'white', fontSize: '1.5rem' } 
                        })}
                      </Box>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {loader.message}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
                          {loader.context}
                        </Typography>
                      </Box>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <CircularProgress 
                          sx={{ color: 'rgba(255,255,255,0.8)' }} 
                          size={24}
                          thickness={3}
                        />
                      </motion.div>
                    </Box>
                  </motion.div>
                ))}
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper {...cardsUtils.createPaperAccent('warning', 'large')}>
              <Typography variant="h6" gutterBottom sx={{ color: 'warning.main', fontWeight: 600 }}>
                🔄 Estados de Sincronización
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Estados de sincronización y validación en tiempo real
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Estado de sincronización con servidor */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 3,
                    border: '2px dashed',
                    borderColor: 'primary.main',
                    borderRadius: 2,
                    bgcolor: `${theme.palette.primary.main}08`,
                    color: 'primary.main',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <motion.div
                      animate={{ 
                        rotate: [0, 360],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ 
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      style={{ marginRight: '12px' }}
                    >
                      <Sync sx={{ fontSize: '1.5rem' }} />
                    </motion.div>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                        🔄 Sincronizando con Firebase...
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Actualizando datos en tiempo real
                      </Typography>
                    </Box>
                  </Box>
                </motion.div>
                
                {/* Estados de validación */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  {[
                    { label: 'Validando permisos de usuario', progress: 100, color: 'success', icon: <CheckCircle /> },
                    { label: 'Verificando integridad de datos', progress: 75, color: 'info', icon: <Security /> },
                    { label: 'Cargando configuraciones empresariales', progress: 50, color: 'warning', icon: <Settings /> },
                    { label: 'Conectando con servicios externos', progress: 25, color: 'error', icon: <Cloud /> }
                  ].map((item, index) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.15 }}
                    >
                      <Box sx={{
                        p: 2.5,
                        borderRadius: 1.5,
                        backgroundColor: `${theme.palette[item.color].main}05`,
                        border: `1px solid ${theme.palette[item.color].main}20`
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            backgroundColor: `${theme.palette[item.color].main}15`,
                            mr: 2
                          }}>
                            {React.cloneElement(item.icon, { 
                              sx: { color: `${item.color}.main`, fontSize: '1.2rem' } 
                            })}
                          </Box>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                              {item.label}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <LinearProgress
                                variant="determinate"
                                value={item.progress}
                                color={item.color}
                                sx={{
                                  flexGrow: 1,
                                  height: 6,
                                  borderRadius: 1,
                                  backgroundColor: `${theme.palette[item.color].main}15`
                                }}
                              />
                              <Typography variant="caption" color="text.secondary" sx={{ minWidth: '35px', textAlign: 'right' }}>
                                {item.progress}%
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    </motion.div>
                  ))}
                </Box>
                
                {/* Estado global del sistema */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                >
                  <Box sx={{
                    p: 3.5,
                    borderRadius: 2,
                    background: gradients.secondary,
                    color: 'white',
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    minHeight: 100,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: 1.5
                  }}>
                    <motion.div
                      animate={{
                        background: [
                          'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                          'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)'
                        ],
                        x: ['-100%', '100%']
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        pointerEvents: 'none'
                      }}
                    />
                    <Typography variant="h6" sx={{ fontWeight: 600, position: 'relative', zIndex: 1 }}>
                      ✨ Sistema DR Group Dashboard
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, position: 'relative', zIndex: 1 }}>
                      Inicializando módulos empresariales...
                    </Typography>
                  </Box>
                </motion.div>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );

  const renderAnimationsSection = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h4" gutterBottom sx={{ 
          color: 'text.primary',
          fontWeight: 600,
          mb: 3
        }}>
          🎬 Animaciones
        </Typography>
      </Grid>

      {/* Entrance Animations - Simplificado */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', mb: 2 }}>
            Efectos de Entrada
          </Typography>
          <Grid container spacing={2}>
            {[
              { name: 'Fade In', type: 'fade' },
              { name: 'Slide Up', type: 'fadeUp' },
              { name: 'Scale', type: 'fadeScale' }
            ].map((animation, index) => (
              <Grid item xs={12} sm={4} key={animation.type}>
                <motion.div 
                  {...tokenUtils.animations.createEntranceProps(animation.type, index * 0.1)}
                >
                  <Card sx={{ 
                    p: 2, 
                    textAlign: 'center',
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      borderColor: 'primary.main',
                      transform: 'translateY(-2px)',
                      transition: 'all 0.2s ease'
                    }
                  }}>
                    <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>
                      {animation.name}
                    </Typography>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Grid>

      {/* Hover Effects - Simplificado */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', mb: 2 }}>
            Efectos de Hover
          </Typography>
          <Grid container spacing={2}>
            {[
              { name: 'Lift Subtle', type: 'liftSubtle' },
              { name: 'Lift Standard', type: 'liftStandard' },
              { name: 'Rotate', type: 'rotateSubtle' }
            ].map((hover) => (
              <Grid item xs={12} sm={4} key={hover.type}>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  {...tokenUtils.animations.createHoverProps(hover.type)}
                >
                  <Card sx={{ 
                    p: 2, 
                    textAlign: 'center',
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    cursor: 'pointer'
                  }}>
                    <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>
                      {hover.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Hover me!
                    </Typography>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Grid>

      {/* Business Animations - Solo uno como ejemplo */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', mb: 2 }}>
            Animación Empresarial
          </Typography>
          <motion.div {...tokenUtils.animations.createBusinessAnimation('commitmentCard')}>
            <Card sx={{ 
              p: 3, 
              background: 'linear-gradient(135deg, #667eea20 0%, #764ba220 100%)',
              border: '1px solid',
              borderColor: 'primary.main'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AccountBalanceWallet sx={{ color: 'primary.main' }} />
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    Compromiso Financiero
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Con animación empresarial
                  </Typography>
                </Box>
              </Box>
            </Card>
          </motion.div>
        </Paper>
      </Grid>

      {/* Gradient Animation - Simple */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', mb: 2 }}>
            Efecto Gradiente
          </Typography>
          <motion.div 
            animate={{
              background: [
                'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                'linear-gradient(45deg, #f093fb 0%, #f5576c 100%)',
                'linear-gradient(45deg, #667eea 0%, #764ba2 100%)'
              ]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear'
            }}
          >
            <Card sx={{ 
              p: 3, 
              color: 'white',
              textAlign: 'center'
            }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Gradiente Animado
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Transición suave de colores
              </Typography>
            </Card>
          </motion.div>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderFeedbackSection = () => (
    <Grid container spacing={4}>
      <Grid item xs={12}>
        <Typography variant="h4" gutterBottom sx={{ 
          background: tokenUtils.gradients.getGradient('primary'),
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          📢 Sistema de Feedback Empresarial
        </Typography>
      </Grid>

      {/* Alertas Empresariales */}
      <Grid item xs={12}>
        <Paper sx={{ 
          p: 3, 
          background: tokenUtils.surfaces.getPaperBackground(theme),
          backdropFilter: 'blur(20px)',
          borderRadius: 3
        }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            🚨 Alertas Empresariales
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <motion.div {...tokenUtils.animations.createEntranceProps('fadeInUp', 0)}>
              <Alert 
                {...tokenUtils.feedback.createAlertProps('success', true)}
                icon={<CheckCircleIcon />}
              >
                ✅ Compromiso financiero liquidado exitosamente - $2,500,000 COP
              </Alert>
            </motion.div>
            <motion.div {...tokenUtils.animations.createEntranceProps('fadeInUp', 0.1)}>
              <Alert 
                {...tokenUtils.feedback.createAlertProps('info', true)}
                icon={<InfoIcon />}
              >
                ℹ️ Nueva actualización disponible para el Dashboard DR Group v3.0
              </Alert>
            </motion.div>
            <motion.div {...tokenUtils.animations.createEntranceProps('fadeInUp', 0.2)}>
              <Alert 
                {...tokenUtils.feedback.createAlertProps('warning', true)}
                icon={<WarningIcon />}
              >
                ⚠️ 3 compromisos próximos a vencer en los próximos 7 días
              </Alert>
            </motion.div>
            <motion.div 
              {...tokenUtils.animations.createEntranceProps('fadeInUp', 0.3)}
              {...tokenUtils.animations.createBusinessAnimation('alertPulse')}
            >
              <Alert 
                {...tokenUtils.feedback.createAlertProps('error', true)}
                icon={<ErrorIcon />}
              >
                🚫 Error de conexión con la base de datos - Verificar configuración
              </Alert>
            </motion.div>
          </Box>
        </Paper>
      </Grid>

      {/* Progress Indicators Empresariales */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ 
          p: 3,
          background: tokenUtils.surfaces.getPaperBackground(theme),
          backdropFilter: 'blur(20px)',
          borderRadius: 3,
          ...tokenUtils.animations.createHoverProps('primary')
        }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            📊 Indicadores de Progreso
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Typography variant="body2" gutterBottom sx={{ fontWeight: 500 }}>
                Compromisos Liquidados (75%)
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={75} 
                {...tokenUtils.feedback.createProgressProps('linear', 'success', 'medium')}
              />
            </Box>
            <Box>
              <Typography variant="body2" gutterBottom sx={{ fontWeight: 500 }}>
                Pagos Pendientes (45%)
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={45} 
                {...tokenUtils.feedback.createProgressProps('linear', 'warning', 'medium')}
              />
            </Box>
            <Box>
              <Typography variant="body2" gutterBottom sx={{ fontWeight: 500 }}>
                Reportes Generados (92%)
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={92} 
                {...tokenUtils.feedback.createProgressProps('linear', 'info', 'medium')}
              />
            </Box>
            <Box>
              <Typography variant="body2" gutterBottom sx={{ fontWeight: 500, mb: 2 }}>
                Indicadores Circulares
              </Typography>
              <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                <Box sx={{ textAlign: 'center' }}>
                  <CircularProgress 
                    variant="determinate" 
                    value={80}
                    {...tokenUtils.feedback.createProgressProps('circular', 'primary', 'medium')}
                  />
                  <Typography variant="caption" display="block" sx={{ mt: 1, fontWeight: 500 }}>
                    Finanzas
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <CircularProgress 
                    variant="determinate" 
                    value={65}
                    {...tokenUtils.feedback.createProgressProps('circular', 'success', 'medium')}
                  />
                  <Typography variant="caption" display="block" sx={{ mt: 1, fontWeight: 500 }}>
                    Cumplimiento
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <CircularProgress 
                    size={30}
                    {...tokenUtils.feedback.createProgressProps('circular', 'secondary', 'small')}
                  />
                  <Typography variant="caption" display="block" sx={{ mt: 1, fontWeight: 500 }}>
                    Procesando
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Grid>

      {/* Chips y Badges Empresariales */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ 
          p: 3,
          background: tokenUtils.surfaces.getPaperBackground(theme),
          backdropFilter: 'blur(20px)',
          borderRadius: 3,
          ...tokenUtils.animations.createHoverProps('secondary')
        }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            💊 Chips y Badges Empresariales
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Chips Filled */}
            <Box>
              <Typography variant="body2" gutterBottom sx={{ fontWeight: 500 }}>
                Estados de Compromisos
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip 
                  label="Pagado" 
                  {...tokenUtils.feedback.createChipProps('filled', 'success', 'medium')}
                  icon={<CheckCircleIcon />}
                />
                <Chip 
                  label="Pendiente" 
                  {...tokenUtils.feedback.createChipProps('filled', 'warning', 'medium')}
                  icon={<AccessTimeIcon />}
                />
                <Chip 
                  label="Vencido" 
                  {...tokenUtils.feedback.createChipProps('filled', 'error', 'medium')}
                  icon={<ErrorIcon />}
                />
                <Chip 
                  label="En Proceso" 
                  {...tokenUtils.feedback.createChipProps('filled', 'info', 'medium')}
                  icon={<AutorenewIcon />}
                />
              </Box>
            </Box>

            {/* Chips Outlined */}
            <Box>
              <Typography variant="body2" gutterBottom sx={{ fontWeight: 500 }}>
                Categorías Empresariales
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip 
                  label="DR Construcción" 
                  {...tokenUtils.feedback.createChipProps('outlined', 'primary', 'small')}
                />
                <Chip 
                  label="DR Inversiones" 
                  {...tokenUtils.feedback.createChipProps('outlined', 'secondary', 'small')}
                />
                <Chip 
                  label="DR Inmobiliaria" 
                  {...tokenUtils.feedback.createChipProps('outlined', 'info', 'small')}
                />
              </Box>
            </Box>

            {/* Badges */}
            <Box>
              <Typography variant="body2" gutterBottom sx={{ fontWeight: 500 }}>
                Notificaciones y Badges
              </Typography>
              <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                <Badge 
                  {...tokenUtils.feedback.createBadgeProps('standard', 'primary', 4)}
                >
                  <NotificationsIcon />
                </Badge>
                <Badge 
                  {...tokenUtils.feedback.createBadgeProps('standard', 'error', 12)}
                >
                  <WarningIcon />
                </Badge>
                <Badge 
                  {...tokenUtils.feedback.createBadgeProps('dot', 'success')}
                >
                  <PersonIcon />
                </Badge>
                <Badge 
                  {...tokenUtils.feedback.createBadgeProps('standard', 'secondary', '99+')}
                >
                  <EmailIcon />
                </Badge>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Grid>

      {/* Tooltips Empresariales */}
      <Grid item xs={12}>
        <Paper sx={{ 
          p: 3,
          background: tokenUtils.surfaces.getPaperBackground(theme),
          backdropFilter: 'blur(20px)',
          borderRadius: 3
        }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            💬 Tooltips Empresariales
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
            <Tooltip 
              title="Información básica sobre compromisos financieros de DR Group"
              {...tokenUtils.feedback.createTooltipProps('default', 'top')}
            >
              <Button 
                variant="outlined"
                {...tokenUtils.buttons.createButtonProps('outlined', 'primary', 'medium')}
              >
                Tooltip Básico
              </Button>
            </Tooltip>
            
            <Tooltip 
              title="Panel de control avanzado para gestión de pagos y reportes ejecutivos"
              {...tokenUtils.feedback.createTooltipProps('light', 'right')}
            >
              <Button 
                variant="contained"
                {...tokenUtils.buttons.createButtonProps('contained', 'secondary', 'medium')}
              >
                Tooltip Light
              </Button>
            </Tooltip>
            
            <Tooltip 
              title="Dashboard premium con análisis financiero y métricas empresariales"
              {...tokenUtils.feedback.createTooltipProps('gradient', 'bottom')}
            >
              <Button 
                variant="gradient"
                sx={{
                  background: tokenUtils.gradients.getGradient('primary'),
                  color: 'white',
                  fontWeight: 600,
                  px: 3,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  ...tokenUtils.animations.createHoverProps('primary')
                }}
              >
                Tooltip Gradient
              </Button>
            </Tooltip>
            
            <Tooltip 
              title="Configuración del sistema y gestión de usuarios autorizados"
              {...tokenUtils.feedback.createTooltipProps('default', 'left')}
            >
              <IconButton 
                {...tokenUtils.buttons.createButtonProps('icon', 'info', 'medium')}
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Paper>
      </Grid>

      {/* Snackbars Preview */}
      <Grid item xs={12}>
        <Paper sx={{ 
          p: 3,
          background: tokenUtils.surfaces.getPaperBackground(theme),
          backdropFilter: 'blur(20px)',
          borderRadius: 3
        }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            🔔 Snackbars Empresariales (Preview)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Los snackbars utilizan el sistema tokenizado de overlays.js ya implementado
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button 
              variant="outlined" 
              size="small"
              {...tokenUtils.buttons.createButtonProps('outlined', 'success', 'small')}
            >
              Éxito: Pago Procesado
            </Button>
            <Button 
              variant="outlined" 
              size="small"
              {...tokenUtils.buttons.createButtonProps('outlined', 'info', 'small')}
            >
              Info: Reporte Generado
            </Button>
            <Button 
              variant="outlined" 
              size="small"
              {...tokenUtils.buttons.createButtonProps('outlined', 'warning', 'small')}
            >
              Advertencia: Vencimiento
            </Button>
            <Button 
              variant="outlined" 
              size="small"
              {...tokenUtils.buttons.createButtonProps('outlined', 'error', 'small')}
            >
              Error: Conexión Fallida
            </Button>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'colors': return renderColorSection();
      case 'typography': return renderTypographySection();
      case 'icons': return renderIconsSection();
      case 'headers': return renderHeadersSection();
      case 'buttons': return renderButtonsSection();
      case 'cards': return renderCardsSection();
      case 'tables': return renderTablesSection();
      case 'forms': return renderFormsSection();
      case 'modals': return renderModalsSection();
      case 'data-display': return renderDataDisplaySection();
      case 'loading': return renderLoadingSection();
      case 'animations': return renderAnimationsSection();
      case 'feedback': return renderFeedbackSection();
      default: return renderColorSection();
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <Box
        sx={{
          background: gradients.primary,
          color: 'white',
          py: 4,
          mb: 4
        }}
      >
        <Container maxWidth="xl">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Typography variant="h3" component="h1" gutterBottom>
              🎨 Design System 3.0 - Página de Pruebas
            </Typography>
            <Typography variant="h6">
              Refinando cada componente visual para la versión definitiva
            </Typography>
          </motion.div>
        </Container>
      </Box>

      {/* Navigation Tabs */}
      <Container maxWidth="xl" sx={{ mb: 4 }}>
        <Paper sx={{ p: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {tabs.map((tab) => (
              <motion.div key={tab.id} whileTap={{ scale: 0.95 }}>
                <Button
                  variant={activeTab === tab.id ? 'contained' : 'text'}
                  startIcon={tab.icon}
                  onClick={() => setActiveTab(tab.id)}
                  sx={{
                    ...(activeTab === tab.id && {
                      background: gradients.primary,
                      '&:hover': {
                        background: gradients.primary,
                      }
                    })
                  }}
                >
                  {tab.label}
                </Button>
              </motion.div>
            ))}
          </Box>
        </Paper>
      </Container>

      {/* Content */}
      <Container maxWidth="xl" sx={{ pb: 4 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </Container>

      {/* 🎨 DR Group Spectacular Drawer - Design System 3.0 */}
      <Drawer
        anchor="right"
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 420 },
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
            backdropFilter: 'blur(40px)',
            borderLeft: '1px solid rgba(102, 126, 234, 0.15)',
            boxShadow: `
              -8px 0 32px rgba(0, 0, 0, 0.12),
              -4px 0 16px rgba(102, 126, 234, 0.08),
              inset 1px 0 0 rgba(255, 255, 255, 0.2)
            `,
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '4px',
              height: '100%',
              background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
              zIndex: 2
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `
                radial-gradient(circle at 85% 15%, rgba(102, 126, 234, 0.04) 0%, transparent 40%),
                radial-gradient(circle at 15% 85%, rgba(118, 75, 162, 0.03) 0%, transparent 40%)
              `,
              animation: 'spectacularGlow 15s ease-in-out infinite',
              pointerEvents: 'none',
              '@keyframes spectacularGlow': {
                '0%, 100%': { 
                  transform: 'rotate(0deg) scale(1)',
                  opacity: 0.6 
                },
                '33%': { 
                  transform: 'rotate(1deg) scale(1.02)',
                  opacity: 0.8 
                },
                '66%': { 
                  transform: 'rotate(-0.5deg) scale(0.98)',
                  opacity: 0.7 
                }
              }
            }
          }
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 3 }}>
          
          {/* Header Spectacular con Design System unificado */}
          <Box sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            p: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.25), 0 4px 12px rgba(118, 75, 162, 0.15)',
            '&::before': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: '10%',
              right: '10%',
              height: '2px',
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent)',
              borderRadius: '1px'
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
              animation: 'shimmer 3s infinite',
              pointerEvents: 'none',
              '@keyframes shimmer': {
                '0%': { transform: 'translateX(-100%)' },
                '100%': { transform: 'translateX(100%)' }
              }
            }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <Avatar sx={{ 
                  width: 48, 
                  height: 48,
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)',
                  color: '#667eea',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  border: '2px solid rgba(102, 126, 234, 0.3)',
                  boxShadow: '0 4px 16px rgba(102, 126, 234, 0.2)'
                }}>
                  DR
                </Avatar>
              </motion.div>
              <Box>
                <Typography variant="h6" sx={{ 
                  fontWeight: 800, 
                  fontSize: '1.2rem',
                  letterSpacing: '0.5px',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                  background: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(248,250,252,0.9) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Panel de Control
                </Typography>
                <Typography variant="body2" sx={{ 
                  opacity: 0.9, 
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                }}>
                  DR Group Dashboard 3.0
                </Typography>
              </Box>
            </Box>
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 90 }} 
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
                <IconButton 
                onClick={() => setOpenDrawer(false)} 
                sx={{ 
                  color: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                  '&:hover': { 
                    backgroundColor: 'rgba(255, 255, 255, 0.25)',
                    transform: 'scale(1.1) rotate(90deg)',
                    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                  },
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <Close />
              </IconButton>
            </motion.div>
          </Box>

          {/* Navigation Sections */}
          <Box sx={{ p: 3, pb: 1 }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
              {[
                { id: 'profile', label: 'Perfil', icon: <Person /> },
                { id: 'settings', label: 'Config', icon: <Settings /> },
                { id: 'analytics', label: 'Analytics', icon: <Analytics /> }
              ].map((section) => (
                <motion.div key={section.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant={drawerSection === section.id ? 'contained' : 'text'}
                    size="small"
                    startIcon={section.icon}
                    onClick={() => setDrawerSection(section.id)}
                    sx={{
                      minWidth: 'auto',
                      px: 2,
                      py: 1,
                      borderRadius: 1,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      textTransform: 'none',
                      ...(drawerSection === section.id && {
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        boxShadow: '0 6px 16px rgba(102, 126, 234, 0.35), 0 2px 8px rgba(118, 75, 162, 0.2)',
                        color: 'white',
                        transform: 'translateY(-1px)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                          boxShadow: '0 8px 20px rgba(102, 126, 234, 0.4), 0 4px 12px rgba(118, 75, 162, 0.25)',
                          transform: 'translateY(-2px)'
                        }
                      }),
                      ...(!drawerSection === section.id && {
                        color: 'text.secondary',
                        '&:hover': {
                          backgroundColor: 'rgba(102, 126, 234, 0.08)',
                          color: '#667eea'
                        }
                      }),
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    {section.label}
                  </Button>
                </motion.div>
              ))}
            </Box>
          </Box>

          {/* Content Sections */}
          <Box sx={{ flex: 1, px: 3, pb: 3, overflowY: 'auto' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={drawerSection}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Profile Section */}
                {drawerSection === 'profile' && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* User Card */}
                    <Paper sx={{
                      p: 3,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.08) 50%, rgba(255, 255, 255, 0.95) 100%)',
                      border: '1px solid rgba(102, 126, 234, 0.2)',
                      boxShadow: '0 8px 32px rgba(102, 126, 234, 0.12), 0 4px 16px rgba(118, 75, 162, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
                        <Avatar sx={{ 
                          width: 64, 
                          height: 64,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          fontSize: '1.5rem',
                          fontWeight: 800
                        }}>
                          DR
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                            Diego Rodriguez
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Administrador Principal
                          </Typography>
                          <Chip 
                            label="Premium User" 
                            size="small" 
                            sx={{
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              fontWeight: 700,
                              fontSize: '0.7rem',
                              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.25), 0 2px 6px rgba(118, 75, 162, 0.15)',
                              textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
                            }}
                          />
                        </Box>
                      </Box>
                      
                      <Divider sx={{ my: 2, opacity: 0.5 }} />
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Business sx={{ color: 'text.secondary', fontSize: '1.25rem' }} />
                          <Typography variant="body2" color="text.secondary">
                            DR Group SAS
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <AttachMoney sx={{ color: 'text.secondary', fontSize: '1.25rem' }} />
                          <Typography variant="body2" color="text.secondary">
                            Acceso Total Financiero
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>

                    {/* Quick Stats */}
                    <Grid container spacing={2}>
                      {[
                        { label: 'Compromisos', value: '23', color: 'primary', icon: <Assignment /> },
                        { label: 'Completados', value: '18', color: 'success', icon: <CheckCircle /> },
                        { label: 'Pendientes', value: '5', color: 'warning', icon: <Warning /> }
                      ].map((stat, index) => (
                        <Grid item xs={4} key={index}>
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Paper sx={{
                              p: 2,
                              textAlign: 'center',
                              borderRadius: 1,
                              background: `linear-gradient(135deg, rgba(${
                                stat.color === 'primary' ? '25, 118, 210' :
                                stat.color === 'success' ? '76, 175, 80' : '255, 152, 0'
                              }, 0.1) 0%, rgba(255, 255, 255, 0.8) 100%)`,
                              border: `1px solid rgba(${
                                stat.color === 'primary' ? '25, 118, 210' :
                                stat.color === 'success' ? '76, 175, 80' : '255, 152, 0'
                              }, 0.2)`,
                              cursor: 'pointer',
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}>
                              <Box sx={{ 
                                color: `${stat.color}.main`,
                                mb: 1,
                                display: 'flex',
                                justifyContent: 'center'
                              }}>
                                {stat.icon}
                              </Box>
                              <Typography variant="h6" sx={{ 
                                fontWeight: 700,
                                color: `${stat.color}.main`,
                                fontSize: '1.125rem'
                              }}>
                                {stat.value}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{
                                fontSize: '0.65rem',
                                fontWeight: 500,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                              }}>
                                {stat.label}
                              </Typography>
                            </Paper>
                          </motion.div>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}

                {/* Settings Section */}
                {drawerSection === 'settings' && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {[
                      {
                        title: 'Tema y Apariencia',
                        items: [
                          { label: 'Modo Oscuro', component: <Switch defaultChecked size="small" /> },
                          { label: 'Efectos Spectacular', component: <Switch defaultChecked size="small" /> },
                          { label: 'Animaciones', component: <Switch defaultChecked size="small" /> }
                        ]
                      },
                      {
                        title: 'Notificaciones',
                        items: [
                          { label: 'Alertas Compromisos', component: <Switch defaultChecked size="small" /> },
                          { label: 'Email Semanal', component: <Switch size="small" /> },
                          { label: 'Sonidos', component: <Switch defaultChecked size="small" /> }
                        ]
                      },
                      {
                        title: 'Privacidad',
                        items: [
                          { label: '2FA Activado', component: <Switch defaultChecked size="small" /> },
                          { label: 'Sesión Segura', component: <Switch defaultChecked size="small" /> }
                        ]
                      }
                    ].map((section, sectionIndex) => (
                      <Paper key={sectionIndex} sx={{
                        p: 3,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.06) 50%, rgba(255, 255, 255, 0.98) 100%)',
                        border: '1px solid rgba(102, 126, 234, 0.18)',
                        boxShadow: '0 6px 24px rgba(102, 126, 234, 0.1), 0 3px 12px rgba(118, 75, 162, 0.05)'
                      }}>
                        <Typography variant="subtitle1" sx={{ 
                          fontWeight: 700,
                          color: 'text.primary',
                          mb: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}>
                          {sectionIndex === 0 && <Brightness4 sx={{ fontSize: '1.125rem' }} />}
                          {sectionIndex === 1 && <Notifications sx={{ fontSize: '1.125rem' }} />}
                          {sectionIndex === 2 && <Security sx={{ fontSize: '1.125rem' }} />}
                          {section.title}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {section.items.map((item, itemIndex) => (
                            <Box key={itemIndex} sx={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center',
                              py: 1
                            }}>
                              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                {item.label}
                              </Typography>
                              {item.component}
                            </Box>
                          ))}
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                )}

                {/* Analytics Section */}
                {drawerSection === 'analytics' && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Paper sx={{
                      p: 3,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.06) 50%, rgba(255, 255, 255, 0.98) 100%)',
                      border: '1px solid rgba(102, 126, 234, 0.18)',
                      boxShadow: '0 8px 28px rgba(102, 126, 234, 0.12), 0 4px 14px rgba(118, 75, 162, 0.08)'
                    }}>
                      <Typography variant="h6" sx={{ 
                        fontWeight: 700, 
                        mb: 3, 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}>
                        📊 Resumen Financiero
                      </Typography>
                      
                      <Grid container spacing={2}>
                        {[
                          { label: 'Total Compromisos', value: '$45.8M', trend: '+12%', color: 'primary' },
                          { label: 'Pagos Este Mes', value: '$32.1M', trend: '+8%', color: 'success' },
                          { label: 'Pendientes', value: '$13.7M', trend: '-5%', color: 'warning' },
                          { label: 'Vencidos', value: '$2.4M', trend: '+2%', color: 'error' }
                        ].map((metric, index) => (
                          <Grid item xs={6} key={index}>
                            <Box sx={{ 
                              p: 2,
                              borderRadius: 1,
                              background: `linear-gradient(135deg, rgba(${
                                metric.color === 'primary' ? '102, 126, 234' :
                                metric.color === 'success' ? '76, 175, 80' :
                                metric.color === 'warning' ? '255, 152, 0' : '244, 67, 54'
                              }, 0.08) 0%, rgba(255, 255, 255, 0.6) 100%)`,
                              border: `1px solid rgba(${
                                metric.color === 'primary' ? '102, 126, 234' :
                                metric.color === 'success' ? '76, 175, 80' :
                                metric.color === 'warning' ? '255, 152, 0' : '244, 67, 54'
                              }, 0.15)`
                            }}>
                              <Typography variant="caption" color="text.secondary" sx={{ 
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                textTransform: 'uppercase'
                              }}>
                                {metric.label}
                              </Typography>
                              <Typography variant="h6" sx={{ 
                                fontWeight: 800,
                                color: `${metric.color}.main`,
                                fontSize: '1rem',
                                mb: 0.5
                              }}>
                                {metric.value}
                              </Typography>
                              <Typography variant="caption" sx={{
                                color: metric.trend.startsWith('+') ? 'success.main' : 'error.main',
                                fontWeight: 600,
                                fontSize: '0.7rem'
                              }}>
                                {metric.trend}
                              </Typography>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Paper>

                    {/* Quick Actions */}
                    <Paper sx={{
                      p: 3,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.06) 50%, rgba(255, 255, 255, 0.98) 100%)',
                      border: '1px solid rgba(102, 126, 234, 0.18)',
                      boxShadow: '0 8px 28px rgba(102, 126, 234, 0.12), 0 4px 14px rgba(118, 75, 162, 0.08)'
                    }}>
                      <Typography variant="subtitle1" sx={{ 
                        fontWeight: 700, 
                        mb: 2, 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}>
                        🚀 Acciones Rápidas
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {[
                          { label: 'Nuevo Compromiso', icon: <Assignment />, color: 'primary' },
                          { label: 'Generar Reporte', icon: <Receipt />, color: 'secondary' },
                          { label: 'Ver Analytics', icon: <Analytics />, color: 'info' },
                          { label: 'Exportar Datos', icon: <CloudUpload />, color: 'success' }
                        ].map((action, index) => (
                          <motion.div key={index} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button
                              fullWidth
                              variant="text"
                              startIcon={action.icon}
                              sx={{
                                justifyContent: 'flex-start',
                                py: 1.5,
                                px: 2,
                                borderRadius: 1,
                                color: 'text.secondary',
                                fontWeight: 500,
                                '&:hover': {
                                  backgroundColor: `${action.color}.50`,
                                  color: `${action.color}.main`,
                                  transform: 'translateX(4px)'
                                },
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                              }}
                            >
                              {action.label}
                            </Button>
                          </motion.div>
                        ))}
                      </Box>
                    </Paper>
                  </Box>
                )}
              </motion.div>
            </AnimatePresence>
          </Box>

          {/* Footer Actions */}
          <Box sx={{
            p: 3,
            borderTop: '1px solid rgba(102, 126, 234, 0.2)',
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.06) 0%, rgba(118, 75, 162, 0.04) 50%, rgba(255, 255, 255, 0.98) 100%)',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '15%',
              right: '15%',
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.4), transparent)'
            }
          }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ flex: 1 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Settings />}
                  sx={{
                    borderColor: 'rgba(102, 126, 234, 0.3)',
                    color: '#667eea',
                    fontWeight: 600,
                    py: 1.5,
                    borderRadius: 1,
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.9) 100%)',
                    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.08)',
                    '&:hover': {
                      borderColor: '#667eea',
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.05) 100%)',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)',
                      transform: 'translateY(-1px)'
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  Configuración
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ flex: 1 }}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<ExitToApp />}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    fontWeight: 700,
                    py: 1.5,
                    borderRadius: 1,
                    boxShadow: '0 6px 16px rgba(102, 126, 234, 0.3), 0 2px 8px rgba(118, 75, 162, 0.2)',
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                      boxShadow: '0 8px 20px rgba(102, 126, 234, 0.4), 0 4px 12px rgba(118, 75, 162, 0.25)',
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  Cerrar Sesión
                </Button>
              </motion.div>
            </Box>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
};

export default DesignSystemTestPage;