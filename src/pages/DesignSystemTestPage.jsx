import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
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

  // Gradientes actuales del sistema
  const gradients = {
    primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    success: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    warning: 'linear-gradient(135deg, #ffb347 0%, #ffcc33 100%)',
    error: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
    info: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
    dark: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)'
  };

  // Sombras del sistema
  const shadows = {
    soft: '0 4px 20px rgba(0,0,0,0.12)',
    medium: '0 8px 25px rgba(0,0,0,0.15)',
    strong: '0 12px 40px rgba(0,0,0,0.2)',
    glassmorphism: '0 8px 32px rgba(31, 38, 135, 0.37)'
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
      
      {/* Gradientes Actuales */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>Gradientes Actuales</Typography>
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
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'primary.light',
                        color: 'primary.contrastText'
                      }
                    }}
                  >
                    {icon}
                    <Typography variant="caption" sx={{ mt: 1, textAlign: 'center' }}>
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
                <motion.div whileHover={{ scale: 1.1, rotate: 5 }} whileTap={{ scale: 0.95 }}>
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
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        bgcolor: color,
                        color: 'white',
                        transform: 'translateY(-2px)',
                        boxShadow: `0 4px 20px ${color}40`
                      }
                    }}
                  >
                    {React.cloneElement(icon, { sx: { fontSize: 28 } })}
                    <Typography variant="caption" sx={{ mt: 1, textAlign: 'center', fontWeight: 600 }}>
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
                  whileHover={{ scale: 1.05 }}
                  animate={{ 
                    rotate: name === 'Notifications' ? [0, 10, -10, 0] : 0 
                  }}
                  transition={{ 
                    rotate: { duration: 2, repeat: Infinity, repeatDelay: 3 }
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
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: color,
                        color: 'white',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                      }
                    }}
                  >
                    {React.cloneElement(icon, { sx: { fontSize: 32 } })}
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
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ 
                    scale: 1.1, 
                    y: -5,
                    boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      p: 3,
                      borderRadius: 3,
                      background: `linear-gradient(135deg, ${color}20, ${color}40)`,
                      color: color,
                      cursor: 'pointer',
                      border: `2px solid transparent`,
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        background: `linear-gradient(135deg, ${color}, ${color}DD)`,
                        color: 'white',
                        borderColor: color,
                        transform: 'translateY(-8px)'
                      }
                    }}
                  >
                    {React.cloneElement(icon, { sx: { fontSize: 36, mb: 1 } })}
                    <Typography variant="body2" sx={{ textAlign: 'center', fontWeight: 600 }}>
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
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                  <Fab size="small" color="primary">
                    <Add />
                  </Fab>
                </motion.div>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                  <Fab color="secondary">
                    <Edit />
                  </Fab>
                </motion.div>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                  <Fab 
                    size="large" 
                    sx={{ 
                      background: gradients.success,
                      '&:hover': { background: gradients.success }
                    }}
                  >
                    <Save />
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

      {/* Header Básico */}
      <Grid item xs={12}>
        <Paper sx={{ overflow: 'hidden' }}>
          <Box
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Menu />
              <Typography variant="h6">Header Básico</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton><Search /></IconButton>
              <IconButton><MoreVert /></IconButton>
            </Box>
          </Box>
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Header estándar con iconos de navegación y acciones
            </Typography>
          </Box>
        </Paper>
      </Grid>

      {/* Header con Gradiente */}
      <Grid item xs={12}>
        <Paper sx={{ overflow: 'hidden' }}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Box
              sx={{
                background: gradients.primary,
                color: 'white',
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                  animation: 'shimmer 3s infinite'
                },
                '@keyframes shimmer': {
                  '0%': { left: '-100%' },
                  '100%': { left: '100%' }
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, zIndex: 1 }}>
                <ArrowBack />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Header con Gradiente Spectacular
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, zIndex: 1 }}>
                <IconButton sx={{ color: 'white' }}><Search /></IconButton>
                <IconButton sx={{ color: 'white' }}><Notifications /></IconButton>
                <Avatar sx={{ width: 32, height: 32 }}><Person /></Avatar>
              </Box>
            </Box>
          </motion.div>
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Header con gradiente, efecto shimmer y avatar de usuario
            </Typography>
          </Box>
        </Paper>
      </Grid>

      {/* Header Glassmorphism */}
      <Grid item xs={12}>
        <Box
          sx={{
            background: gradients.secondary,
            borderRadius: 2,
            p: 3,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Typography variant="h6" color="white" gutterBottom>
            Header con Efecto Glassmorphism
          </Typography>
          
          <Paper
            sx={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: shadows.glassmorphism,
              overflow: 'hidden',
              mt: 2
            }}
          >
            <Box
              sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: 'white'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Dashboard />
                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                  DR Group Dashboard
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Badge badgeContent={3} color="error">
                  <Notifications sx={{ color: 'white' }} />
                </Badge>
                <Chip 
                  label="Admin" 
                  size="small" 
                  sx={{ 
                    background: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.3)'
                  }} 
                />
              </Box>
            </Box>
          </Paper>
        </Box>
      </Grid>

      {/* Header de Página */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Header de Página Interna</Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2,
              p: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              mt: 2
            }}
          >
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                Compromisos Financieros
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Gestiona los compromisos de pago de todas las empresas
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" startIcon={<FilterList />}>
                Filtrar
              </Button>
              <Button variant="contained" startIcon={<Add />}>
                Nuevo Compromiso
              </Button>
            </Box>
          </Box>
        </Paper>
      </Grid>

      {/* Header con Breadcrumbs */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Header con Breadcrumbs</Typography>
          <Box sx={{ mt: 2 }}>
            {/* Breadcrumbs */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Home fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">Inicio</Typography>
              <Typography variant="body2" color="text.secondary">/</Typography>
              <Typography variant="body2" color="text.secondary">Compromisos</Typography>
              <Typography variant="body2" color="text.secondary">/</Typography>
              <Typography variant="body2" color="primary">Nuevo</Typography>
            </Box>
            
            {/* Header Principal */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 2
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton>
                  <ArrowBack />
                </IconButton>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Nuevo Compromiso
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Crear un nuevo compromiso financiero
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined">Cancelar</Button>
                <Button variant="contained" color="success">Guardar</Button>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Grid>

      {/* Header de Dashboard */}
      <Grid item xs={12}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Paper 
            sx={{ 
              overflow: 'hidden',
              background: gradients.info,
              color: 'white'
            }}
          >
            <Box sx={{ p: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Analytics sx={{ fontSize: 32 }} />
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      Dashboard Ejecutivo
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Vista general de compromisos y métricas financieras
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip 
                    label="Tiempo Real" 
                    size="small"
                    sx={{ 
                      background: 'rgba(255,255,255,0.2)',
                      color: 'white'
                    }}
                  />
                  <IconButton sx={{ color: 'white' }}>
                    <Settings />
                  </IconButton>
                </Box>
              </Box>
              
              {/* Stats rápidas */}
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      24
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      Compromisos
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      $45M
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      Total Mes
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#ffeb3b' }}>
                      7
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      Próximos
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#f44336' }}>
                      3
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      Vencidos
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </motion.div>
      </Grid>

      {/* Header Móvil */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Header Móvil Compacto</Typography>
          <Box
            sx={{
              background: gradients.dark,
              color: 'white',
              borderRadius: 1,
              overflow: 'hidden'
            }}
          >
            <Box
              sx={{
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton size="small" sx={{ color: 'white' }}>
                  <Menu />
                </IconButton>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  DR Group
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton size="small" sx={{ color: 'white' }}>
                  <Badge badgeContent={2} color="error">
                    <Notifications fontSize="small" />
                  </Badge>
                </IconButton>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Grid>

      {/* Header con Tabs */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Header con Tabs</Typography>
          <Box sx={{ borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Análisis Financiero
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', borderBottom: '1px solid', borderColor: 'divider' }}>
              {['Resumen', 'Gráficos', 'Reportes'].map((tab, index) => (
                <Button
                  key={tab}
                  variant={index === 0 ? 'contained' : 'text'}
                  size="small"
                  sx={{
                    borderRadius: 0,
                    ...(index === 0 && {
                      background: gradients.primary,
                      '&:hover': { background: gradients.primary }
                    })
                  }}
                >
                  {tab}
                </Button>
              ))}
            </Box>
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Contenido del tab seleccionado
              </Typography>
            </Box>
          </Box>
        </Paper>
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
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Fab color="primary" size="small">
              <Add />
            </Fab>
            <Fab color="primary">
              <Add />
            </Fab>
            <Fab color="secondary" size="large">
              <Edit />
            </Fab>
            
            <IconButton color="primary">
              <Settings />
            </IconButton>
            <IconButton color="secondary">
              <Favorite />
            </IconButton>
            
            <Button variant="contained" startIcon={<Dashboard />}>
              Con Icono Inicio
            </Button>
            <Button variant="outlined" endIcon={<Star />}>
              Con Icono Final
            </Button>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderCardsSection = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h4" gutterBottom>
          🎴 Cards y Contenedores
        </Typography>
      </Grid>

      {/* Cards Básicas */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Card Básica</Typography>
            <Typography variant="body2">
              Esta es una card básica con contenido simple.
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card sx={{ boxShadow: shadows.medium }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Card con Sombra</Typography>
            <Typography variant="body2">
              Card con sombra mejorada para mayor profundidad visual.
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <motion.div whileHover={{ scale: 1.02, y: -4 }}>
          <Card 
            sx={{ 
              background: gradients.primary,
              color: 'white',
              boxShadow: shadows.strong
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom>Card con Gradiente</Typography>
              <Typography variant="body2">
                Card con gradiente spectacular y animación hover.
              </Typography>
            </CardContent>
          </Card>
        </motion.div>
      </Grid>

      {/* Cards Glassmorphism */}
      <Grid item xs={12}>
        <Box
          sx={{
            background: gradients.secondary,
            borderRadius: 2,
            p: 4,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Typography variant="h6" color="white" gutterBottom>
            Contenedor Glassmorphism
          </Typography>
          
          <Grid container spacing={2}>
            {[1, 2, 3].map((item) => (
              <Grid item xs={12} md={4} key={item}>
                <Card
                  sx={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: shadows.glassmorphism,
                    color: 'white'
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Glassmorphism {item}
                    </Typography>
                    <Typography variant="body2">
                      Efecto de vidrio esmerilado con transparencia.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Grid>

      {/* Papers */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>Paper Variants</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography>Paper Normal</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper elevation={8} sx={{ p: 2 }}>
              <Typography>Paper Elevado</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography>Paper Outlined</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper 
              sx={{ 
                p: 2,
                background: gradients.info,
                color: 'white'
              }}
            >
              <Typography>Paper con Gradiente</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );

  const renderTablesSection = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h4" gutterBottom>
          📊 Tablas
        </Typography>
      </Grid>

      {/* Tabla Básica */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Tabla Básica</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Empresa</TableCell>
                  <TableCell>NIT</TableCell>
                  <TableCell>Compromiso</TableCell>
                  <TableCell align="right">Monto</TableCell>
                  <TableCell>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tableData.slice(0, 3).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.nit}</TableCell>
                    <TableCell>{row.commitment}</TableCell>
                    <TableCell align="right">{formatCOP(row.amount)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={row.status} 
                        color={getStatusColor(row.status)} 
                        size="small" 
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>

      {/* Tabla con Selección y Ordenamiento */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Tabla con Selección y Ordenamiento</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selected.length > 0 && selected.length < tableData.length}
                      checked={tableData.length > 0 && selected.length === tableData.length}
                      onChange={handleSelectAllClick}
                    />
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'name'}
                      direction={orderBy === 'name' ? order : 'asc'}
                      onClick={() => handleRequestSort('name')}
                    >
                      Empresa
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>NIT</TableCell>
                  <TableCell>Compromiso</TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={orderBy === 'amount'}
                      direction={orderBy === 'amount' ? order : 'asc'}
                      onClick={() => handleRequestSort('amount')}
                    >
                      Monto
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Prioridad</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tableData
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row) => {
                    const isItemSelected = selected.indexOf(row.id) !== -1;
                    return (
                      <TableRow 
                        key={row.id}
                        hover
                        onClick={() => handleClick(row.id)}
                        selected={isItemSelected}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox checked={isItemSelected} />
                        </TableCell>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{row.nit}</TableCell>
                        <TableCell>{row.commitment}</TableCell>
                        <TableCell align="right">{formatCOP(row.amount)}</TableCell>
                        <TableCell>
                          <Chip 
                            label={row.status} 
                            color={getStatusColor(row.status)} 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={row.priority} 
                            color={getPriorityColor(row.priority)} 
                            size="small" 
                            variant="outlined"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={tableData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      </Grid>

      {/* Tabla con Gradiente */}
      <Grid item xs={12}>
        <Paper sx={{ overflow: 'hidden' }}>
          <Box
            sx={{
              background: gradients.primary,
              color: 'white',
              p: 2
            }}
          >
            <Typography variant="h6">Tabla con Header con Gradiente</Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead 
                sx={{ 
                  background: 'rgba(102, 126, 234, 0.1)',
                }}
              >
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Empresa</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Compromiso</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Monto</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Fecha Vencimiento</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tableData.slice(0, 3).map((row, index) => (
                  <motion.tr 
                    key={row.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    component={TableRow}
                    sx={{ 
                      '&:hover': { 
                        backgroundColor: 'rgba(102, 126, 234, 0.05)',
                        transform: 'translateX(4px)',
                        transition: 'all 0.3s ease'
                      }
                    }}
                  >
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.commitment}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      {formatCOP(row.amount)}
                    </TableCell>
                    <TableCell>{row.dueDate}</TableCell>
                    <TableCell>
                      <Chip 
                        label={row.status} 
                        color={getStatusColor(row.status)} 
                        size="small"
                        sx={{
                          fontWeight: 500,
                          '&:hover': {
                            transform: 'scale(1.05)',
                            transition: 'transform 0.2s ease'
                          }
                        }}
                      />
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>

      {/* Tabla Glassmorphism */}
      <Grid item xs={12}>
        <Box
          sx={{
            background: gradients.secondary,
            borderRadius: 2,
            p: 3,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Typography variant="h6" color="white" gutterBottom>
            Tabla con Efecto Glassmorphism
          </Typography>
          
          <Paper
            sx={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: shadows.glassmorphism,
              overflow: 'hidden'
            }}
          >
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Empresa</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Compromiso</TableCell>
                    <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>Monto</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tableData.slice(0, 3).map((row) => (
                    <TableRow 
                      key={row.id}
                      sx={{ 
                        '&:hover': { 
                          background: 'rgba(255, 255, 255, 0.1)'
                        }
                      }}
                    >
                      <TableCell sx={{ color: 'white' }}>{row.name}</TableCell>
                      <TableCell sx={{ color: 'white' }}>{row.commitment}</TableCell>
                      <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>
                        {formatCOP(row.amount)}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={row.status} 
                          color={getStatusColor(row.status)} 
                          size="small" 
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      </Grid>

      {/* Tabla Compacta */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Tabla Compacta</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Empresa</TableCell>
                  <TableCell align="right">Monto</TableCell>
                  <TableCell>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tableData.slice(0, 4).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell align="right">{formatCOP(row.amount)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={row.status} 
                        color={getStatusColor(row.status)} 
                        size="small" 
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>

      {/* Tabla Striped */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Tabla Striped</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Empresa</TableCell>
                  <TableCell align="right">Monto</TableCell>
                  <TableCell>Prioridad</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tableData.slice(0, 4).map((row, index) => (
                  <TableRow 
                    key={row.id}
                    sx={{ 
                      backgroundColor: index % 2 === 0 ? 'transparent' : 'action.hover',
                      '&:hover': { 
                        backgroundColor: 'action.selected' 
                      }
                    }}
                  >
                    <TableCell>{row.name}</TableCell>
                    <TableCell align="right">{formatCOP(row.amount)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={row.priority} 
                        color={getPriorityColor(row.priority)} 
                        size="small" 
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
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
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '60%',
                        height: '100%',
                        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                        animation: 'shimmer 2s infinite'
                      }
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
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                  animation: 'shimmer 2s infinite'
                },
                '@keyframes shimmer': {
                  '0%': { left: '-100%' },
                  '100%': { left: '100%' }
                }
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
          <Typography variant="h6" gutterBottom>Shimmer Effect</Typography>
          <Box
            sx={{
              background: gradients.primary,
              borderRadius: 2,
              p: 2,
              textAlign: 'center',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                animation: 'shimmer 3s infinite'
              },
              '@keyframes shimmer': {
                '0%': { left: '-100%' },
                '100%': { left: '100%' }
              }
            }}
          >
            <Typography>Efecto Shimmer</Typography>
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
