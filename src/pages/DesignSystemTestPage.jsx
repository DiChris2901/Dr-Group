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
  Toolbar
} from '@mui/material';
import {
  Dashboard,
  Settings,
  Notifications,
  Person,
  Business,
  Analytics,
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
  Reply,
  Send,
  Inbox,
  Drafts,
  Flag,
  Archive,
  Report,
  Block,
  MoreHoriz
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@mui/material/styles';

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
  const [openDialog, setOpenDialog] = useState(false);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [bottomNavValue, setBottomNavValue] = useState(0);

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
    { id: 'navigation', label: 'Navegación', icon: <Menu /> },
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
      
      {/* Gradientes del Sistema */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>Gradientes del Sistema DR Group</Typography>
        <Grid container spacing={2}>
          {Object.entries(gradients).map(([name, gradient]) => (
            <Grid item xs={12} sm={6} md={4} key={name}>
              <Box
                sx={{
                  height: 120,
                  background: gradient,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  boxShadow: shadows.soft
                }}
              >
                {name}
              </Box>
            </Grid>
          ))}
        </Grid>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: 'italic' }}>
          � Gradientes spectacular originales del sistema DR Group con efectos visuales avanzados
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
        <Typography variant="h4" gutterBottom>
          📝 Tipografía
        </Typography>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h1" gutterBottom>Heading 1</Typography>
          <Typography variant="h2" gutterBottom>Heading 2</Typography>
          <Typography variant="h3" gutterBottom>Heading 3</Typography>
          <Typography variant="h4" gutterBottom>Heading 4</Typography>
          <Typography variant="h5" gutterBottom>Heading 5</Typography>
          <Typography variant="h6" gutterBottom>Heading 6</Typography>
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="body1" gutterBottom>
            Body 1: Este es el texto principal del contenido. Debería ser legible y cómodo para leer en párrafos largos.
          </Typography>
          <Typography variant="body2" gutterBottom>
            Body 2: Texto secundario, más pequeño que el principal pero aún legible para contenido de apoyo.
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Subtitle 1: Para subtítulos importantes
          </Typography>
          <Typography variant="subtitle2" gutterBottom>
            Subtitle 2: Para subtítulos menores
          </Typography>
          <Typography variant="caption" display="block" gutterBottom>
            Caption: Para texto de apoyo muy pequeño
          </Typography>
          <Typography variant="overline" display="block">
            OVERLINE: PARA ETIQUETAS Y CATEGORÍAS
          </Typography>
        </Paper>
      </Grid>

      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Pesos de Fuente</Typography>
          <Typography sx={{ fontWeight: 300 }} gutterBottom>Light (300)</Typography>
          <Typography sx={{ fontWeight: 400 }} gutterBottom>Regular (400)</Typography>
          <Typography sx={{ fontWeight: 500 }} gutterBottom>Medium (500)</Typography>
          <Typography sx={{ fontWeight: 600 }} gutterBottom>Semi-bold (600)</Typography>
          <Typography sx={{ fontWeight: 700 }} gutterBottom>Bold (700)</Typography>
          <Typography sx={{ fontWeight: 800 }} gutterBottom>Extra-bold (800)</Typography>
          <Typography sx={{ fontWeight: 900 }} gutterBottom>Black (900)</Typography>
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
          <TablePagination
            rowsPerPageOptions={[10]}
            component="div"
            count={tableData.length}
            rowsPerPage={10}
            page={0}
            onPageChange={() => {}}
            onRowsPerPageChange={() => {}}
            sx={{ 
              px: 2.5, 
              borderTop: '1px solid', 
              borderColor: 'divider',
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                fontSize: '0.8rem'
              }
            }}
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
          <TablePagination
            rowsPerPageOptions={[10]}
            component="div"
            count={tableData.length}
            rowsPerPage={10}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={() => {}}
            sx={{ 
              px: 2.5, 
              borderTop: '1px solid', 
              borderColor: 'divider',
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                fontSize: '0.8rem'
              }
            }}
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
          <TablePagination
            rowsPerPageOptions={[10]}
            component="div"
            count={tableData.length}
            rowsPerPage={10}
            page={0}
            onPageChange={() => {}}
            onRowsPerPageChange={() => {}}
            sx={{ 
              px: 2.5, 
              borderTop: '1px solid', 
              borderColor: 'divider',
              background: 'rgba(102, 126, 234, 0.02)',
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                fontSize: '0.8rem'
              }
            }}
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
          <TablePagination
            rowsPerPageOptions={[10]}
            component="div"
            count={tableData.length}
            rowsPerPage={10}
            page={0}
            onPageChange={() => {}}
            onRowsPerPageChange={() => {}}
            sx={{ 
              px: 1.5, 
              borderTop: '1px solid', 
              borderColor: 'divider',
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
          <TablePagination
            rowsPerPageOptions={[10]}
            component="div"
            count={tableData.length}
            rowsPerPage={10}
            page={0}
            onPageChange={() => {}}
            onRowsPerPageChange={() => {}}
            sx={{ 
              px: 1.5, 
              borderTop: '1px solid', 
              borderColor: 'divider',
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                fontSize: '0.75rem'
              }
            }}
          />
        </Paper>
      </Grid>
    </Grid>
  );

  const renderFormsSection = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h4" gutterBottom>
          📋 Formularios
        </Typography>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Campos de Texto</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Campo Estándar"
              variant="outlined"
              fullWidth
            />
            <TextField
              label="Campo Filled"
              variant="filled"
              fullWidth
            />
            <TextField
              label="Campo con Error"
              variant="outlined"
              error
              helperText="Este campo es requerido"
              fullWidth
            />
            <TextField
              label="Campo Disabled"
              variant="outlined"
              disabled
              fullWidth
            />
          </Box>
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Controles</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Select Option</InputLabel>
              <Select
                value={selectValue}
                label="Select Option"
                onChange={(e) => setSelectValue(e.target.value)}
              >
                <MenuItem value="option1">Option 1</MenuItem>
                <MenuItem value="option2">Option 2</MenuItem>
                <MenuItem value="option3">Option 3</MenuItem>
              </Select>
            </FormControl>

            <Box>
              <Typography gutterBottom>Switch Control</Typography>
              <Switch 
                checked={switchValue}
                onChange={(e) => setSwitchValue(e.target.checked)}
              />
            </Box>

            <Box>
              <Typography gutterBottom>Slider Control</Typography>
              <Slider
                value={sliderValue}
                onChange={(e, newValue) => setSliderValue(newValue)}
                valueLabelDisplay="auto"
              />
            </Box>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderModalsSection = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h4" gutterBottom>
          🎭 Modales y Diálogos
        </Typography>
      </Grid>

      {/* Botones para abrir modales */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Controles de Modales</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button variant="contained" onClick={() => setOpenDialog(true)}>
              Abrir Diálogo
            </Button>
            <Button variant="outlined" onClick={() => setOpenDrawer(true)}>
              Abrir Drawer
            </Button>
          </Box>
        </Paper>
      </Grid>

      {/* Ejemplos de diferentes tipos de modales */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Tipos de Modales</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    Modal de Confirmación
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Ideal para acciones destructivas o importantes que requieren confirmación del usuario.
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Uso: Eliminar, transferir, cambios críticos
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="secondary">
                    Drawer Lateral
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Perfecto para configuraciones, filtros o información adicional sin perder contexto.
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Uso: Configuraciones, filtros, menús
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="success.main">
                    Modal de Formulario
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Para crear o editar contenido sin navegar a una página completa.
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Uso: Crear, editar, formularios rápidos
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      {/* Diálogo de confirmación */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ 
          background: gradients.primary,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <Warning />
          Confirmar Acción
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography gutterBottom>
            ¿Estás seguro de que deseas eliminar este compromiso financiero?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Esta acción no se puede deshacer y se eliminará permanentemente el registro.
          </Typography>
          
          <Box sx={{ mt: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
            <Typography variant="body2" color="error.contrastText">
              <strong>Compromiso:</strong> Arriendo Local - DR GROUP SAS<br/>
              <strong>Monto:</strong> $2.500.000 COP<br/>
              <strong>Vencimiento:</strong> 15 de Agosto, 2025
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={() => setOpenDialog(false)} 
            variant="outlined"
            startIcon={<Cancel />}
          >
            Cancelar
          </Button>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              onClick={() => setOpenDialog(false)}
              variant="contained" 
              color="error"
              startIcon={<Delete />}
              sx={{
                background: 'linear-gradient(45deg, #f44336 30%, #e53935 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #e53935 30%, #d32f2f 90%)'
                }
              }}
            >
              Eliminar
            </Button>
          </motion.div>
        </DialogActions>
      </Dialog>

      {/* Drawer lateral */}
      <Drawer
        anchor="right"
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
        PaperProps={{
          sx: {
            width: 400,
            background: gradients.secondary,
            color: 'white'
          }
        }}
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Configuraciones
            </Typography>
            <IconButton onClick={() => setOpenDrawer(false)} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>
          
          <List>
            <ListItem>
              <ListItemIcon sx={{ color: 'white' }}>
                <Settings />
              </ListItemIcon>
              <ListItemText 
                primary="Preferencias Generales" 
                secondary="Configurar opciones del sistema"
                secondaryTypographyProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon sx={{ color: 'white' }}>
                <Notifications />
              </ListItemIcon>
              <ListItemText 
                primary="Notificaciones" 
                secondary="Gestionar alertas y avisos"
                secondaryTypographyProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon sx={{ color: 'white' }}>
                <Security />
              </ListItemIcon>
              <ListItemText 
                primary="Seguridad" 
                secondary="Control de acceso y permisos"
                secondaryTypographyProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
              />
            </ListItem>
          </List>

          <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.2)' }} />

          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ opacity: 0.8 }}>
              Acciones Rápidas
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button 
                variant="outlined" 
                fullWidth 
                sx={{ 
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    background: 'rgba(255,255,255,0.1)'
                  }
                }}
                startIcon={<Save />}
              >
                Guardar Configuración
              </Button>
            </Box>
          </Box>
        </Box>
      </Drawer>
    </Grid>
  );

  const renderNavigationSection = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h4" gutterBottom>
          🧭 Navegación
        </Typography>
      </Grid>

      {/* Tabs */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Tabs de Navegación</Typography>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs 
              value={tabValue} 
              onChange={(e, newValue) => setTabValue(newValue)}
              variant="fullWidth"
            >
              <Tab label="Resumen" icon={<Dashboard />} />
              <Tab label="Compromisos" icon={<Business />} />
              <Tab label="Pagos" icon={<AttachMoney />} />
              <Tab label="Reportes" icon={<Analytics />} />
            </Tabs>
          </Box>
          <Box sx={{ p: 2, minHeight: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              Contenido del Tab: {['Resumen', 'Compromisos', 'Pagos', 'Reportes'][tabValue]}
            </Typography>
          </Box>
        </Paper>
      </Grid>

      {/* Stepper */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Stepper - Proceso de Creación</Typography>
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mt: 2, mb: 3 }}>
            {['Información Básica', 'Detalles Financieros', 'Confirmación'].map((label, index) => (
              <Step key={label}>
                <StepLabel
                  StepIconProps={{
                    sx: {
                      '&.Mui-active': {
                        color: theme.palette.primary.main
                      },
                      '&.Mui-completed': {
                        color: theme.palette.success.main
                      }
                    }
                  }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button 
              disabled={activeStep === 0}
              onClick={() => setActiveStep(prev => prev - 1)}
              variant="outlined"
            >
              Anterior
            </Button>
            <Button 
              disabled={activeStep === 2}
              onClick={() => setActiveStep(prev => prev + 1)}
              variant="contained"
            >
              {activeStep === 2 ? 'Finalizar' : 'Siguiente'}
            </Button>
          </Box>
        </Paper>
      </Grid>

      {/* Bottom Navigation */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Bottom Navigation (Móvil)</Typography>
          <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
            <BottomNavigation
              value={bottomNavValue}
              onChange={(event, newValue) => setBottomNavValue(newValue)}
              sx={{ 
                background: gradients.dark,
                '& .MuiBottomNavigationAction-root': {
                  color: 'rgba(255,255,255,0.6)',
                  '&.Mui-selected': {
                    color: 'white'
                  }
                }
              }}
            >
              <BottomNavigationAction label="Dashboard" icon={<Dashboard />} />
              <BottomNavigationAction label="Compromisos" icon={<Business />} />
              <BottomNavigationAction label="Pagos" icon={<AttachMoney />} />
              <BottomNavigationAction label="Perfil" icon={<Person />} />
            </BottomNavigation>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderDataDisplaySection = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h4" gutterBottom>
          📊 Data Display
        </Typography>
      </Grid>

      {/* Avatares */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Avatares</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>Tamaños y Variaciones</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ width: 24, height: 24 }}>S</Avatar>
                <Avatar>M</Avatar>
                <Avatar sx={{ width: 56, height: 56 }}>L</Avatar>
                <Avatar sx={{ width: 72, height: 72 }}>XL</Avatar>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar><Person /></Avatar>
                <Avatar sx={{ bgcolor: 'primary.main' }}>DR</Avatar>
                <Avatar sx={{ bgcolor: 'secondary.main' }}>AB</Avatar>
                <Avatar sx={{ bgcolor: 'success.main' }}><Business /></Avatar>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>Avatar Group</Typography>
              <AvatarGroup max={4} sx={{ mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>DR</Avatar>
                <Avatar sx={{ bgcolor: 'secondary.main' }}>AB</Avatar>
                <Avatar sx={{ bgcolor: 'success.main' }}>CD</Avatar>
                <Avatar sx={{ bgcolor: 'warning.main' }}>EF</Avatar>
                <Avatar sx={{ bgcolor: 'error.main' }}>GH</Avatar>
              </AvatarGroup>
              <Typography variant="caption" color="text.secondary">
                Ideal para mostrar equipos o múltiples usuarios
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      {/* Listas */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Listas</Typography>
          <List>
            <ListItem>
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <Business />
                </Avatar>
              </ListItemAvatar>
              <ListItemText 
                primary="DR GROUP SAS" 
                secondary="NIT: 900.123.456-7"
              />
              <Chip label="Activo" color="success" size="small" />
            </ListItem>
            <Divider variant="inset" component="li" />
            <ListItem>
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                  <AttachMoney />
                </Avatar>
              </ListItemAvatar>
              <ListItemText 
                primary="$2.500.000 COP" 
                secondary="Arriendo Local - Vence 15/08/2025"
              />
              <Chip label="Pendiente" color="warning" size="small" />
            </ListItem>
            <Divider variant="inset" component="li" />
            <ListItem>
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <CheckCircle />
                </Avatar>
              </ListItemAvatar>
              <ListItemText 
                primary="Pago Procesado" 
                secondary="Transferencia bancaria - 05/08/2025"
              />
              <Chip label="Completado" color="success" size="small" />
            </ListItem>
          </List>
        </Paper>
      </Grid>

      {/* Dividers */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Dividers</Typography>
          <Typography variant="body2" paragraph>
            Divider horizontal básico
          </Typography>
          <Divider />
          <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>
            Divider con texto
          </Typography>
          <Divider textAlign="center">
            <Chip label="SECCIÓN" size="small" />
          </Divider>
          <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>
            Divider con gradiente
          </Typography>
          <Box
            sx={{
              height: 2,
              background: gradients.primary,
              borderRadius: 1,
              mb: 2
            }}
          />
          <Typography variant="body2">
            Divider vertical (en flex)
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
            <Typography variant="body2">Item 1</Typography>
            <Divider orientation="vertical" flexItem />
            <Typography variant="body2">Item 2</Typography>
            <Divider orientation="vertical" flexItem />
            <Typography variant="body2">Item 3</Typography>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderLoadingSection = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h4" gutterBottom>
          ⚡ Estados de Carga
        </Typography>
      </Grid>

      {/* Skeletons */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Skeletons - Placeholders</Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Mostrando estados de carga con skeletons animados
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>Card Skeleton</Typography>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Skeleton 
                      variant="circular" 
                      width={40} 
                      height={40} 
                      sx={{ mr: 2 }}
                      animation="wave"
                    />
                    <Box sx={{ flexGrow: 1 }}>
                      <Skeleton 
                        variant="text" 
                        sx={{ fontSize: '1.2rem', width: '60%', mb: 0.5 }} 
                        animation="wave"
                      />
                      <Skeleton 
                        variant="text" 
                        sx={{ fontSize: '0.9rem', width: '80%' }} 
                        animation="wave"
                      />
                    </Box>
                  </Box>
                  <Skeleton 
                    variant="rectangular" 
                    height={100} 
                    sx={{ mb: 1, borderRadius: 1 }} 
                    animation="wave"
                  />
                  <Skeleton variant="text" sx={{ width: '90%' }} animation="wave" />
                  <Skeleton variant="text" sx={{ width: '70%' }} animation="wave" />
                </CardContent>
              </Card>
              
              {/* Skeleton con gradiente */}
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Skeleton con efectos personalizados
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: gradients.primary,
                        opacity: 0.3,
                        mr: 2
                      }}
                    />
                    <Box sx={{ flexGrow: 1 }}>
                      <Box
                        sx={{
                          height: 20,
                          background: gradients.secondary,
                          opacity: 0.3,
                          borderRadius: 1,
                          mb: 1,
                          width: '60%'
                        }}
                      />
                      <Box
                        sx={{
                          height: 16,
                          background: gradients.info,
                          opacity: 0.3,
                          borderRadius: 1,
                          width: '80%'
                        }}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>Table Skeleton</Typography>
              <Box sx={{ mb: 2 }}>
                {[1, 2, 3, 4].map((item) => (
                  <Box key={item} sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 2 }}>
                    <Skeleton 
                      variant="circular" 
                      width={32} 
                      height={32} 
                      animation="wave"
                    />
                    <Skeleton 
                      variant="text" 
                      sx={{ flexGrow: 1 }} 
                      animation="wave"
                    />
                    <Skeleton 
                      variant="rectangular" 
                      width={60} 
                      height={24} 
                      sx={{ borderRadius: 1 }}
                      animation="wave"
                    />
                  </Box>
                ))}
              </Box>
              
              <Typography variant="subtitle2" gutterBottom>List Skeleton</Typography>
              <Box>
                {[1, 2, 3].map((item) => (
                  <Box 
                    key={item} 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      p: 1, 
                      mb: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1
                    }}
                  >
                    <Skeleton variant="circular" width={24} height={24} sx={{ mr: 2 }} />
                    <Box sx={{ flexGrow: 1 }}>
                      <Skeleton variant="text" sx={{ width: '70%', mb: 0.5 }} />
                      <Skeleton variant="text" sx={{ width: '40%', fontSize: '0.8rem' }} />
                    </Box>
                    <Skeleton variant="rounded" width={50} height={20} />
                  </Box>
                ))}
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      {/* Progress Indicators */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Progress Indicators</Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Indicadores de progreso con variaciones de estilo y color
          </Typography>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" gutterBottom>Circular Progress</Typography>
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
                <CircularProgress size={40} />
                <CircularProgress size={40} color="secondary" />
                <CircularProgress size={40} color="success" />
                <CircularProgress size={40} color="warning" />
                <CircularProgress size={40} color="error" />
              </Box>
              
              {/* Progress con valores determinados */}
              <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                Con valores específicos
              </Typography>
              <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', mb: 2 }}>
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <CircularProgress variant="determinate" value={25} size={50} />
                  <Box
                    sx={{
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      position: 'absolute',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="caption" component="div" color="text.secondary">
                      25%
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <CircularProgress variant="determinate" value={75} size={50} color="success" />
                  <Box
                    sx={{
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      position: 'absolute',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="caption" component="div" color="text.secondary">
                      75%
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <CircularProgress variant="determinate" value={100} size={50} color="warning" />
                  <Box
                    sx={{
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      position: 'absolute',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="caption" component="div" color="text.secondary">
                      100%
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" gutterBottom>Linear Progress</Typography>
              <Box sx={{ mb: 2 }}>
                <LinearProgress sx={{ mb: 1, height: 8, borderRadius: 1 }} />
                <LinearProgress color="secondary" sx={{ mb: 1, height: 8, borderRadius: 1 }} />
                <LinearProgress color="success" sx={{ mb: 1, height: 8, borderRadius: 1 }} />
                <LinearProgress color="warning" sx={{ mb: 1, height: 8, borderRadius: 1 }} />
                <LinearProgress color="error" sx={{ mb: 1, height: 8, borderRadius: 1 }} />
              </Box>
              
              <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                Con buffer y valores
              </Typography>
              <Box>
                <LinearProgress variant="determinate" value={30} sx={{ mb: 1, height: 6 }} />
                <LinearProgress variant="buffer" value={60} valueBuffer={80} sx={{ mb: 1, height: 6 }} />
                <LinearProgress variant="determinate" value={90} color="success" sx={{ height: 6 }} />
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" gutterBottom>Progress con Gradient</Typography>
              <Box sx={{ mb: 2 }}>
                {/* Progress personalizado con gradiente */}
                <Box sx={{ position: 'relative', mb: 2 }}>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      background: `conic-gradient(${gradients.primary} 70%, rgba(255,255,255,0.1) 70%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative'
                    }}
                  >
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        backgroundColor: 'background.paper',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Typography variant="h6">70%</Typography>
                    </Box>
                  </Box>
                </Box>
                
                {/* Barra con gradiente */}
                <Box sx={{ mb: 1 }}>
                  <Box
                    sx={{
                      height: 10,
                      borderRadius: 1,
                      background: gradients.secondary,
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  />
                </Box>
                
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Progress Spectacular
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      {/* Loading States */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Estados de Carga Personalizados</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 3,
                background: gradients.primary,
                color: 'white',
                borderRadius: 2,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <CircularProgress sx={{ color: 'white', mr: 2 }} size={20} />
              <Typography>Cargando compromisos...</Typography>
            </Box>
            
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2,
                border: '2px dashed',
                borderColor: 'primary.main',
                borderRadius: 2,
                bgcolor: 'primary.light',
                color: 'primary.main'
              }}
            >
              <Typography variant="body2">
                🔄 Sincronizando datos con el servidor...
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderAnimationsSection = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h4" gutterBottom>
          ✨ Animaciones
        </Typography>
      </Grid>

      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Hover Effects</Typography>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <Card sx={{ p: 2, cursor: 'pointer', textAlign: 'center' }}>
              <Typography>Hover para Escalar</Typography>
            </Card>
          </motion.div>
        </Paper>
      </Grid>

      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Rotación</Typography>
          <motion.div 
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Card sx={{ p: 2, textAlign: 'center' }}>
              <Settings />
              <Typography>Rotación Continua</Typography>
            </Card>
          </motion.div>
        </Paper>
      </Grid>

      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Efectos Gradient</Typography>
          <Box
            sx={{
              background: gradients.primary,
              borderRadius: 2,
              p: 2,
              textAlign: 'center',
              color: 'white',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Typography>Gradiente Spectacular</Typography>
          </Box>
        </Paper>
      </Grid>

      {/* Transiciones de entrada */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Animaciones de Entrada</Typography>
          <Grid container spacing={2}>
            {[1, 2, 3, 4].map((item, index) => (
              <Grid item xs={12} sm={6} md={3} key={item}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card sx={{ p: 2, textAlign: 'center' }}>
                    <Typography>Item {item}</Typography>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderFeedbackSection = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h4" gutterBottom>
          📢 Feedback
        </Typography>
      </Grid>

      {/* Alerts */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Alertas</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="success">This is a success alert — check it out!</Alert>
            <Alert severity="info">This is an info alert — check it out!</Alert>
            <Alert severity="warning">This is a warning alert — check it out!</Alert>
            <Alert severity="error">This is an error alert — check it out!</Alert>
          </Box>
        </Paper>
      </Grid>

      {/* Progress */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Indicadores de Progreso</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Typography variant="body2" gutterBottom>Linear Progress</Typography>
              <LinearProgress variant="determinate" value={65} />
            </Box>
            <Box>
              <Typography variant="body2" gutterBottom>Circular Progress</Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <CircularProgress size={30} />
                <CircularProgress variant="determinate" value={75} />
              </Box>
            </Box>
          </Box>
        </Paper>
      </Grid>

      {/* Chips y Badges */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Chips y Badges</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip label="Primary" color="primary" />
              <Chip label="Secondary" color="secondary" />
              <Chip label="Success" color="success" />
              <Chip label="Error" color="error" />
              <Chip label="Warning" color="warning" />
              <Chip label="Info" color="info" />
            </Box>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Badge badgeContent={4} color="primary">
                <Notifications />
              </Badge>
              <Badge badgeContent={99} color="secondary">
                <Person />
              </Badge>
              <Badge variant="dot" color="error">
                <Settings />
              </Badge>
            </Box>
          </Box>
        </Paper>
      </Grid>

      {/* Tooltips */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Tooltips</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Tooltip title="Tooltip básico">
              <Button variant="outlined">Hover me</Button>
            </Tooltip>
            <Tooltip title="Tooltip con arrow" arrow>
              <Button variant="outlined">With Arrow</Button>
            </Tooltip>
            <Tooltip title="Tooltip a la derecha" placement="right">
              <Button variant="outlined">Right Placement</Button>
            </Tooltip>
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
      case 'navigation': return renderNavigationSection();
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
    </Box>
  );
};

export default DesignSystemTestPage;
