# 📋 INVENTARIO COMPLETO DE COMPONENTES - DR GROUP DASHBOARD
*Generado: 29 Julio 2025 - Estado: FASE 1.1*

## 🎯 PROPÓSITO
Este archivo contiene el código fuente y estado actual de TODOS los componentes del proyecto para referencia inmediata en nuevas sesiones.

---

## 📁 COMPONENTES DE AUTENTICACIÓN

### `src/components/auth/LoginForm.jsx`
**Estado**: ✅ Funcional básico  
**Propósito**: Formulario de inicio de sesión con Firebase Auth  
**Dependencias**: Firebase Auth, Material-UI, AuthContext

```javascript
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/');
    } catch (error) {
      setError('Error al iniciar sesión: ' + error.message);
    }
    
    setLoading(false);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default'
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%', mx: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            DR Group Dashboard
          </Typography>
          
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Iniciar sesión en tu cuenta
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
            />
            
            <TextField
              fullWidth
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Iniciar Sesión'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginForm;
```

---

## 📁 COMPONENTES DE COMPROMISOS

### `src/components/commitments/CommitmentCard.jsx`
**Estado**: ✅ Funcional con datos de ejemplo  
**Propósito**: Tarjeta individual de compromiso financiero  
**Características**: Estados visuales, acciones, fechas de vencimiento

```javascript
import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Button,
  Box,
  Avatar,
  IconButton
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  AttachFile as AttachFileIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const CommitmentCard = ({ commitment, onEdit, onDelete, onViewFiles }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'pendiente': return 'warning';
      case 'pagado': return 'success';
      case 'vencido': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pendiente': return 'Pendiente';
      case 'pagado': return 'Pagado';
      case 'vencido': return 'Vencido';
      default: return status;
    }
  };

  const isNearDue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        '&:hover': {
          boxShadow: 4,
          transform: 'translateY(-2px)',
          transition: 'all 0.3s ease-in-out'
        }
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
            <BusinessIcon />
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="h3" noWrap>
              {commitment.company}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {commitment.type}
            </Typography>
          </Box>
        </Box>

        <Typography variant="h5" color="primary" sx={{ mb: 1 }}>
          ${commitment.amount.toLocaleString()}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {commitment.description}
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Vence: {format(new Date(commitment.dueDate), 'dd MMM yyyy', { locale: es })}
          </Typography>
          {isNearDue(commitment.dueDate) && (
            <Chip label="Próximo a vencer" color="warning" size="small" />
          )}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Chip 
            label={getStatusText(commitment.status)} 
            color={getStatusColor(commitment.status)} 
            size="small" 
          />
          {commitment.hasFiles && (
            <IconButton size="small" onClick={() => onViewFiles(commitment.id)}>
              <AttachFileIcon />
            </IconButton>
          )}
        </Box>
      </CardContent>

      <CardActions>
        <Button size="small" startIcon={<EditIcon />} onClick={() => onEdit(commitment)}>
          Editar
        </Button>
        <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => onDelete(commitment.id)}>
          Eliminar
        </Button>
      </CardActions>
    </Card>
  );
};

export default CommitmentCard;
```

### `src/components/commitments/CommitmentsFilters.jsx`
**Estado**: ✅ Funcional con filtros básicos  
**Propósito**: Filtros y búsqueda para lista de compromisos

```javascript
import React from 'react';
import {
  Paper,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  Grid
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { Clear as ClearIcon } from '@mui/icons-material';

const CommitmentsFilters = ({ filters, onFiltersChange, companies }) => {
  const handleFilterChange = (field, value) => {
    onFiltersChange({
      ...filters,
      [field]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      company: '',
      status: '',
      type: '',
      dateFrom: null,
      dateTo: null
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== '' && value !== null && value !== undefined
  );

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Buscar..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Empresa, descripción..."
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Empresa</InputLabel>
              <Select
                value={filters.company}
                label="Empresa"
                onChange={(e) => handleFilterChange('company', e.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                {companies.map((company) => (
                  <MenuItem key={company} value={company}>
                    {company}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                value={filters.status}
                label="Estado"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="pendiente">Pendiente</MenuItem>
                <MenuItem value="pagado">Pagado</MenuItem>
                <MenuItem value="vencido">Vencido</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <DatePicker
              label="Desde"
              value={filters.dateFrom}
              onChange={(date) => handleFilterChange('dateFrom', date)}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <DatePicker
              label="Hasta"
              value={filters.dateTo}
              onChange={(date) => handleFilterChange('dateTo', date)}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </Grid>

          <Grid item xs={12} md={1}>
            {hasActiveFilters && (
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<ClearIcon />}
                onClick={clearFilters}
                fullWidth
              >
                Limpiar
              </Button>
            )}
          </Grid>
        </Grid>

        {hasActiveFilters && (
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {filters.search && (
              <Chip
                label={`Búsqueda: ${filters.search}`}
                onDelete={() => handleFilterChange('search', '')}
                size="small"
              />
            )}
            {filters.company && (
              <Chip
                label={`Empresa: ${filters.company}`}
                onDelete={() => handleFilterChange('company', '')}
                size="small"
              />
            )}
            {filters.status && (
              <Chip
                label={`Estado: ${filters.status}`}
                onDelete={() => handleFilterChange('status', '')}
                size="small"
              />
            )}
          </Box>
        )}
      </LocalizationProvider>
    </Paper>
  );
};

export default CommitmentsFilters;
```

### `src/components/commitments/CommitmentsList.jsx`
**Estado**: ✅ Funcional con datos de ejemplo  
**Propósito**: Lista principal de compromisos con paginación y filtros

```javascript
import React, { useState, useMemo } from 'react';
import {
  Box,
  Grid,
  Typography,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Alert
} from '@mui/material';
import CommitmentCard from './CommitmentCard';
import CommitmentsFilters from './CommitmentsFilters';
import { sampleCommitments } from '../../utils/sampleData';

const CommitmentsList = () => {
  const [filters, setFilters] = useState({
    search: '',
    company: '',
    status: '',
    type: '',
    dateFrom: null,
    dateTo: null
  });
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Filtrar compromisos
  const filteredCommitments = useMemo(() => {
    return sampleCommitments.filter(commitment => {
      // Filtro de búsqueda
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!commitment.company.toLowerCase().includes(searchLower) &&
            !commitment.description.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Filtro por empresa
      if (filters.company && commitment.company !== filters.company) {
        return false;
      }

      // Filtro por estado
      if (filters.status && commitment.status !== filters.status) {
        return false;
      }

      // Filtro por tipo
      if (filters.type && commitment.type !== filters.type) {
        return false;
      }

      // Filtro por fecha desde
      if (filters.dateFrom) {
        const commitmentDate = new Date(commitment.dueDate);
        if (commitmentDate < filters.dateFrom) {
          return false;
        }
      }

      // Filtro por fecha hasta
      if (filters.dateTo) {
        const commitmentDate = new Date(commitment.dueDate);
        if (commitmentDate > filters.dateTo) {
          return false;
        }
      }

      return true;
    });
  }, [filters]);

  // Paginación
  const paginatedCommitments = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    return filteredCommitments.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCommitments, page, itemsPerPage]);

  const totalPages = Math.ceil(filteredCommitments.length / itemsPerPage);
  const companies = [...new Set(sampleCommitments.map(c => c.company))];

  const handleEdit = (commitment) => {
    console.log('Editar compromiso:', commitment);
    // TODO: Implementar modal de edición
  };

  const handleDelete = (commitmentId) => {
    console.log('Eliminar compromiso:', commitmentId);
    // TODO: Implementar confirmación y eliminación
  };

  const handleViewFiles = (commitmentId) => {
    console.log('Ver archivos del compromiso:', commitmentId);
    // TODO: Implementar modal de archivos
  };

  return (
    <Box>
      <CommitmentsFilters
        filters={filters}
        onFiltersChange={setFilters}
        companies={companies}
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          {filteredCommitments.length} compromiso{filteredCommitments.length !== 1 ? 's' : ''} encontrado{filteredCommitments.length !== 1 ? 's' : ''}
        </Typography>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Por página</InputLabel>
          <Select
            value={itemsPerPage}
            label="Por página"
            onChange={(e) => {
              setItemsPerPage(e.target.value);
              setPage(1);
            }}
          >
            <MenuItem value={6}>6</MenuItem>
            <MenuItem value={12}>12</MenuItem>
            <MenuItem value={24}>24</MenuItem>
            <MenuItem value={48}>48</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {paginatedCommitments.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Alert severity="info">
            No se encontraron compromisos que coincidan con los filtros aplicados.
          </Alert>
        </Paper>
      ) : (
        <>
          <Grid container spacing={3}>
            {paginatedCommitments.map((commitment) => (
              <Grid item xs={12} sm={6} md={4} key={commitment.id}>
                <CommitmentCard
                  commitment={commitment}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onViewFiles={handleViewFiles}
                />
              </Grid>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(event, newPage) => setPage(newPage)}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default CommitmentsList;
```

---

## 📁 COMPONENTES COMUNES

### `src/components/common/ProfileAvatar.jsx`
**Estado**: ✅ Funcional básico  
**Propósito**: Avatar de usuario con menú desplegable  
**Características**: Logout, perfil, configuraciones

```javascript
import React, { useState } from 'react';
import {
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Divider,
  ListItemIcon,
  Box
} from '@mui/material';
import {
  Person as PersonIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountCircleIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ProfileAvatar = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const { user, userData, logout } = useAuth();
  const navigate = useNavigate();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleProfile = () => {
    navigate('/profile');
    handleClose();
  };

  const handleSettings = () => {
    navigate('/settings');
    handleClose();
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
    handleClose();
  };

  const displayName = userData?.displayName || user?.email?.split('@')[0] || 'Usuario';
  const photoURL = userData?.photoURL || user?.photoURL;

  return (
    <>
      <IconButton onClick={handleClick} size="small">
        <Avatar 
          src={photoURL} 
          sx={{ width: 32, height: 32 }}
        >
          {displayName.charAt(0).toUpperCase()}
        </Avatar>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" noWrap>
            {displayName}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {user?.email}
          </Typography>
        </Box>
        
        <Divider />
        
        <MenuItem onClick={handleProfile}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          Mi Perfil
        </MenuItem>
        
        <MenuItem onClick={handleSettings}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          Configuración
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Cerrar Sesión
        </MenuItem>
      </Menu>
    </>
  );
};

export default ProfileAvatar;
```

### `src/components/common/FloatingSearchButton.jsx`
**Estado**: ❌ ELIMINADO EN LIMPIEZA  
**Última Versión**: v1.2.0-dashboard-config  
**Propósito**: Botón flotante de búsqueda con posicionamiento dinámico  
**Nota**: Puede ser re-implementado basándose en documentación histórica

---

## 📁 COMPONENTES DE DASHBOARD

### `src/components/dashboard/DashboardHeader.jsx`
**Estado**: ✅ Funcional básico  
**Propósito**: Header principal del dashboard con navegación

```javascript
import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import ProfileAvatar from '../common/ProfileAvatar';
import { useSettings } from '../../context/SettingsContext';

const DashboardHeader = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { settings, updateSettings } = useSettings();

  const handleMenuClick = () => {
    updateSettings({
      sidebar: {
        ...settings.sidebar,
        collapsed: !settings.sidebar.collapsed
      }
    });
  };

  return (
    <AppBar
      position="sticky"
      elevation={1}
      sx={{
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderBottom: `1px solid ${theme.palette.divider}`
      }}
    >
      <Toolbar>
        {isMobile && (
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={handleMenuClick}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Dashboard
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton color="inherit">
            <SearchIcon />
          </IconButton>
          
          <IconButton color="inherit">
            <NotificationsIcon />
          </IconButton>
          
          <ProfileAvatar />
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default DashboardHeader;
```

### `src/components/dashboard/DashboardStats.jsx`
**Estado**: ✅ Funcional con datos estáticos  
**Propósito**: Tarjetas de estadísticas del dashboard

```javascript
import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  useTheme
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Business as BusinessIcon,
  Payment as PaymentIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

const StatCard = ({ title, value, change, changeType, icon, color }) => {
  const theme = useTheme();
  
  return (
    <Card sx={{ height: '100%', '&:hover': { boxShadow: 4 } }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Avatar sx={{ bgcolor: `${color}.main`, width: 48, height: 48 }}>
            {icon}
          </Avatar>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h4" component="div" color={color}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
        </Box>
        
        {change && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
            {changeType === 'increase' ? (
              <TrendingUpIcon color="success" sx={{ mr: 0.5, fontSize: 16 }} />
            ) : (
              <TrendingDownIcon color="error" sx={{ mr: 0.5, fontSize: 16 }} />
            )}
            <Typography 
              variant="body2" 
              color={changeType === 'increase' ? 'success.main' : 'error.main'}
            >
              {change}% vs mes anterior
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const DashboardStats = () => {
  const stats = [
    {
      title: 'Total Compromisos',
      value: '24',
      change: 12,
      changeType: 'increase',
      icon: <BusinessIcon />,
      color: 'primary'
    },
    {
      title: 'Monto Pendiente',
      value: '$45,280',
      change: -8,
      changeType: 'decrease',
      icon: <PaymentIcon />,
      color: 'warning'
    },
    {
      title: 'Pagos del Mes',
      value: '$12,340',
      change: 15,
      changeType: 'increase',
      icon: <TrendingUpIcon />,
      color: 'success'
    },
    {
      title: 'Próximos a Vencer',
      value: '8',
      change: null,
      changeType: null,
      icon: <WarningIcon />,
      color: 'error'
    }
  ];

  return (
    <Grid container spacing={3}>
      {stats.map((stat, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <StatCard {...stat} />
        </Grid>
      ))}
    </Grid>
  );
};

export default DashboardStats;
```

### `src/components/dashboard/QuickActions.jsx`
**Estado**: ✅ Funcional básico  
**Propósito**: Acciones rápidas del dashboard

```javascript
import React from 'react';
import {
  Paper,
  Typography,
  Grid,
  Button,
  Box,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Upload as UploadIcon,
  GetApp as GetAppIcon,
  Assessment as AssessmentIcon,
  Notifications as NotificationsIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'Nuevo Compromiso',
      description: 'Registrar un nuevo compromiso financiero',
      icon: <AddIcon />,
      color: 'primary',
      onClick: () => navigate('/commitments/new')
    },
    {
      title: 'Subir Comprobante',
      description: 'Adjuntar comprobante de pago',
      icon: <UploadIcon />,
      color: 'secondary',
      onClick: () => console.log('Subir comprobante')
    },
    {
      title: 'Generar Reporte',
      description: 'Crear reporte mensual de compromisos',
      icon: <AssessmentIcon />,
      color: 'info',
      onClick: () => navigate('/reports')
    },
    {
      title: 'Exportar Datos',
      description: 'Descargar datos en Excel/PDF',
      icon: <GetAppIcon />,
      color: 'success',
      onClick: () => console.log('Exportar datos')
    },
    {
      title: 'Configurar Alertas',
      description: 'Establecer recordatorios automáticos',
      icon: <NotificationsIcon />,
      color: 'warning',
      onClick: () => navigate('/settings')
    },
    {
      title: 'Gestionar Empresas',
      description: 'Administrar empresas y contactos',
      icon: <BusinessIcon />,
      color: 'inherit',
      onClick: () => navigate('/companies')
    }
  ];

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Acciones Rápidas
      </Typography>
      
      <Divider sx={{ mb: 3 }} />
      
      <Grid container spacing={2}>
        {actions.map((action, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={action.icon}
              onClick={action.onClick}
              color={action.color}
              sx={{
                height: 80,
                flexDirection: 'column',
                textAlign: 'center',
                '&:hover': {
                  boxShadow: 2
                }
              }}
            >
              <Typography variant="subtitle2" component="div">
                {action.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {action.description}
              </Typography>
            </Button>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default QuickActions;
```

---

## 📁 COMPONENTES DE LAYOUT

### `src/components/layout/Sidebar.jsx`
**Estado**: ✅ Funcional con navegación básica  
**Propósito**: Sidebar principal de navegación

```javascript
import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider,
  useTheme,
  useMediaQuery,
  Collapse
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Business as BusinessIcon,
  Payment as PaymentIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  ExpandLess,
  ExpandMore,
  Schedule as ScheduleIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import { useState } from 'react';

const Sidebar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();
  const [openSubmenus, setOpenSubmenus] = useState({});

  const handleDrawerClose = () => {
    if (isMobile) {
      updateSettings({
        sidebar: {
          ...settings.sidebar,
          collapsed: true
        }
      });
    }
  };

  const handleSubMenuToggle = (menu) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/',
      active: location.pathname === '/'
    },
    {
      text: 'Compromisos',
      icon: <BusinessIcon />,
      path: '/commitments',
      active: location.pathname.startsWith('/commitments'),
      submenu: [
        { text: 'Ver Todos', icon: <BusinessIcon />, path: '/commitments' },
        { text: 'Próximos a Vencer', icon: <ScheduleIcon />, path: '/commitments/due' },
        { text: 'Comprobantes', icon: <ReceiptIcon />, path: '/commitments/receipts' }
      ]
    },
    {
      text: 'Reportes',
      icon: <AssessmentIcon />,
      path: '/reports',
      active: location.pathname.startsWith('/reports')
    },
    {
      text: 'Mi Perfil',
      icon: <PersonIcon />,
      path: '/profile',
      active: location.pathname === '/profile'
    },
    {
      text: 'Configuración',
      icon: <SettingsIcon />,
      path: '/settings',
      active: location.pathname === '/settings'
    }
  ];

  const drawerWidth = settings.sidebar.collapsed ? 64 : settings.sidebar.width;

  const drawer = (
    <Box sx={{ overflow: 'auto' }}>
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h6" noWrap component="div">
          {settings.sidebar.collapsed ? 'DR' : 'DR Group'}
        </Typography>
      </Box>
      
      <Divider />
      
      <List>
        {menuItems.map((item) => (
          <React.Fragment key={item.text}>
            <ListItem disablePadding>
              <ListItemButton
                selected={item.active}
                onClick={() => {
                  if (item.submenu) {
                    handleSubMenuToggle(item.text);
                  } else {
                    navigate(item.path);
                    handleDrawerClose();
                  }
                }}
                sx={{
                  minHeight: 48,
                  justifyContent: settings.sidebar.collapsed ? 'center' : 'initial',
                  px: 2.5,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: settings.sidebar.collapsed ? 'auto' : 3,
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                
                {!settings.sidebar.collapsed && (
                  <>
                    <ListItemText primary={item.text} />
                    {item.submenu && (
                      openSubmenus[item.text] ? <ExpandLess /> : <ExpandMore />
                    )}
                  </>
                )}
              </ListItemButton>
            </ListItem>
            
            {item.submenu && !settings.sidebar.collapsed && (
              <Collapse in={openSubmenus[item.text]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.submenu.map((subItem) => (
                    <ListItemButton
                      key={subItem.text}
                      sx={{ pl: 4 }}
                      selected={location.pathname === subItem.path}
                      onClick={() => {
                        navigate(subItem.path);
                        handleDrawerClose();
                      }}
                    >
                      <ListItemIcon>
                        {subItem.icon}
                      </ListItemIcon>
                      <ListItemText primary={subItem.text} />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            )}
          </React.Fragment>
        ))}
      </List>
    </Box>
  );

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      open={isMobile ? !settings.sidebar.collapsed : true}
      onClose={handleDrawerClose}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        },
      }}
    >
      {drawer}
    </Drawer>
  );
};

export default Sidebar;
```

### `src/components/layout/BackgroundProvider.jsx`
**Estado**: ✅ Funcional básico  
**Propósito**: Proveedor de fondo dinámico para la aplicación

```javascript
import React from 'react';
import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const BackgroundProvider = ({ children }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
          : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: theme.palette.mode === 'dark'
            ? 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.15) 0%, transparent 50%)'
            : 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.1) 0%, transparent 50%)',
          pointerEvents: 'none',
          zIndex: -1
        }
      }}
    >
      {children}
    </Box>
  );
};

export default BackgroundProvider;
```

---

## 📁 HOOKS PERSONALIZADOS

### `src/hooks/useFirestore.js`
**Estado**: ✅ Funcional básico  
**Propósito**: Hook para operaciones con Firestore

```javascript
import { useState, useEffect } from 'react';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';

export const useFirestore = (collectionName) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Obtener todos los documentos
  const getAll = async (options = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      let q = collection(db, collectionName);
      
      // Aplicar filtros si existen
      if (options.where) {
        options.where.forEach(condition => {
          q = query(q, where(...condition));
        });
      }
      
      // Aplicar ordenamiento si existe
      if (options.orderBy) {
        q = query(q, orderBy(...options.orderBy));
      }
      
      const querySnapshot = await getDocs(q);
      const documents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setData(documents);
      return documents;
    } catch (err) {
      setError(err.message);
      console.error('Error getting documents:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Obtener un documento por ID
  const getById = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        throw new Error('Documento no encontrado');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error getting document:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Agregar un nuevo documento
  const add = async (data) => {
    try {
      setLoading(true);
      setError(null);
      
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      return docRef.id;
    } catch (err) {
      setError(err.message);
      console.error('Error adding document:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Actualizar un documento
  const update = async (id, newData) => {
    try {
      setLoading(true);
      setError(null);
      
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, {
        ...newData,
        updatedAt: new Date()
      });
      
      return true;
    } catch (err) {
      setError(err.message);
      console.error('Error updating document:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Eliminar un documento
  const remove = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
      
      return true;
    } catch (err) {
      setError(err.message);
      console.error('Error deleting document:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Escuchar cambios en tiempo real
  const subscribe = (callback, options = {}) => {
    let q = collection(db, collectionName);
    
    // Aplicar filtros si existen
    if (options.where) {
      options.where.forEach(condition => {
        q = query(q, where(...condition));
      });
    }
    
    // Aplicar ordenamiento si existe
    if (options.orderBy) {
      q = query(q, orderBy(...options.orderBy));
    }

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const documents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(documents);
    }, (error) => {
      setError(error.message);
      console.error('Error in subscription:', error);
    });

    return unsubscribe;
  };

  return {
    data,
    loading,
    error,
    getAll,
    getById,
    add,
    update,
    remove,
    subscribe
  };
};

export default useFirestore;
```

### `src/hooks/useSearch.js`
**Estado**: ✅ Funcional básico  
**Propósito**: Hook para funcionalidad de búsqueda

```javascript
import { useState, useEffect, useMemo } from 'react';

export const useSearch = (data, searchFields = [], options = {}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  const {
    debounceDelay = 300,
    caseSensitive = false,
    exactMatch = false
  } = options;

  // Debounce del término de búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, debounceDelay);

    return () => clearTimeout(timer);
  }, [searchTerm, debounceDelay]);

  // Filtrar datos basándose en el término de búsqueda
  const filteredData = useMemo(() => {
    if (!debouncedSearchTerm || !Array.isArray(data)) {
      return data;
    }

    const searchValue = caseSensitive 
      ? debouncedSearchTerm 
      : debouncedSearchTerm.toLowerCase();

    return data.filter(item => {
      // Si no se especifican campos, buscar en todas las propiedades string
      const fieldsToSearch = searchFields.length > 0 
        ? searchFields 
        : Object.keys(item).filter(key => typeof item[key] === 'string');

      return fieldsToSearch.some(field => {
        const fieldValue = item[field];
        if (typeof fieldValue !== 'string') return false;

        const value = caseSensitive ? fieldValue : fieldValue.toLowerCase();
        
        return exactMatch 
          ? value === searchValue
          : value.includes(searchValue);
      });
    });
  }, [data, debouncedSearchTerm, searchFields, caseSensitive, exactMatch]);

  // Resaltar texto que coincide con la búsqueda
  const highlightText = (text, highlight) => {
    if (!highlight || !text) return text;
    
    const regex = new RegExp(`(${highlight})`, caseSensitive ? 'g' : 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  };

  // Estadísticas de búsqueda
  const searchStats = {
    totalItems: data ? data.length : 0,
    filteredItems: filteredData ? filteredData.length : 0,
    hasResults: filteredData && filteredData.length > 0,
    isSearching: Boolean(debouncedSearchTerm)
  };

  return {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    filteredData,
    highlightText,
    searchStats
  };
};

export default useSearch;
```

---

## 📄 DATOS DE EJEMPLO

### `src/utils/sampleData.js`
**Estado**: ✅ Datos completos para desarrollo  
**Propósito**: Datos de ejemplo para desarrollo y testing

```javascript
export const sampleCommitments = [
  {
    id: '1',
    company: 'Empresa ABC S.A.',
    type: 'Renta Oficina',
    description: 'Pago mensual de renta oficina principal',
    amount: 15000,
    dueDate: '2025-08-15',
    status: 'pendiente',
    hasFiles: true,
    createdAt: '2025-07-01',
    updatedAt: '2025-07-29'
  },
  {
    id: '2',
    company: 'Servicios XYZ Ltda.',
    type: 'Servicios Profesionales',
    description: 'Consultoría en sistemas de información',
    amount: 8500,
    dueDate: '2025-08-10',
    status: 'pendiente',
    hasFiles: false,
    createdAt: '2025-07-05',
    updatedAt: '2025-07-29'
  },
  {
    id: '3',
    company: 'Proveedores 123',
    type: 'Suministros',
    description: 'Material de oficina y papelería',
    amount: 2300,
    dueDate: '2025-07-30',
    status: 'vencido',
    hasFiles: true,
    createdAt: '2025-06-15',
    updatedAt: '2025-07-29'
  },
  {
    id: '4',
    company: 'Tecnología Plus',
    type: 'Software',
    description: 'Licencias de software empresarial',
    amount: 12000,
    dueDate: '2025-07-25',
    status: 'pagado',
    hasFiles: true,
    createdAt: '2025-06-20',
    updatedAt: '2025-07-25'
  },
  {
    id: '5',
    company: 'Empresa ABC S.A.',
    type: 'Servicios Públicos',
    description: 'Electricidad y agua del mes',
    amount: 4200,
    dueDate: '2025-08-05',
    status: 'pendiente',
    hasFiles: false,
    createdAt: '2025-07-10',
    updatedAt: '2025-07-29'
  },
  {
    id: '6',
    company: 'Transportes Rápidos',
    type: 'Logística',
    description: 'Envíos y distribución mensual',
    amount: 6800,
    dueDate: '2025-08-20',
    status: 'pendiente',
    hasFiles: true,
    createdAt: '2025-07-12',
    updatedAt: '2025-07-29'
  },
  {
    id: '7',
    company: 'Seguros Integrales',
    type: 'Seguro',
    description: 'Prima de seguro empresarial',
    amount: 18500,
    dueDate: '2025-09-01',
    status: 'pendiente',
    hasFiles: false,
    createdAt: '2025-07-15',
    updatedAt: '2025-07-29'
  },
  {
    id: '8',
    company: 'Mantenimiento Pro',
    type: 'Mantenimiento',
    description: 'Mantenimiento preventivo equipos',
    amount: 3400,
    dueDate: '2025-08-12',
    status: 'pendiente',
    hasFiles: true,
    createdAt: '2025-07-18',
    updatedAt: '2025-07-29'
  }
];

export const sampleCompanies = [
  'Empresa ABC S.A.',
  'Servicios XYZ Ltda.',
  'Proveedores 123',
  'Tecnología Plus',
  'Transportes Rápidos',
  'Seguros Integrales',
  'Mantenimiento Pro'
];

export const sampleUsers = [
  {
    id: 'user1',
    email: 'admin@drgroup.com',
    displayName: 'Administrador',
    role: 'admin',
    companies: ['all'],
    photoURL: null,
    createdAt: '2025-01-01',
    lastLogin: '2025-07-29'
  },
  {
    id: 'user2',
    email: 'manager@drgroup.com',
    displayName: 'Gerente',
    role: 'manager',
    companies: ['Empresa ABC S.A.', 'Servicios XYZ Ltda.'],
    photoURL: null,
    createdAt: '2025-01-15',
    lastLogin: '2025-07-28'
  }
];

export const commitmentTypes = [
  'Renta Oficina',
  'Servicios Profesionales',
  'Suministros',
  'Software',
  'Servicios Públicos',
  'Logística',
  'Seguro',
  'Mantenimiento',
  'Marketing',
  'Legal',
  'Contabilidad',
  'Otros'
];

export const paymentMethods = [
  'Transferencia Bancaria',
  'Cheque',
  'Efectivo',
  'Tarjeta de Crédito',
  'Débito Automático'
];
```

---

## 🚀 ESTADO DE DESARROLLO Y PRÓXIMOS PASOS

### ✅ **COMPLETADO (Estado Actual FASE 1.1)**
- ✅ Estructura base del proyecto
- ✅ Configuración Firebase
- ✅ Sistema de autenticación básico
- ✅ Navegación y layout principal
- ✅ Componentes de compromisos (vista únicamente)
- ✅ Dashboard con estadísticas estáticas
- ✅ Contextos de estado (Auth, Settings, Theme)
- ✅ Datos de ejemplo para desarrollo
- ✅ Análisis completo del sistema de tema

### 🔄 **ELIMINADO EN LIMPIEZA (Puede Re-implementarse)**
- ❌ FloatingSearchButton con posicionamiento dinámico
- ❌ DashboardCustomizer con 5 secciones de configuración
- ❌ Sistema de historial automático
- ❌ Scripts de backup automático

### 📋 **PRÓXIMAS FASES SUGERIDAS**

**FASE 1.2 - Implementación de Tema Personalizado:**
1. Paleta de colores según análisis
2. Tipografía profesional (Public Sans)
3. Sistema de sombras y elevaciones
4. Componentes MUI personalizados

**FASE 2.1 - CRUD Compromisos Financieros:**
1. Formularios de creación/edición
2. Integración con Firebase Firestore
3. Carga de archivos adjuntos
4. Validaciones y error handling

**FASE 2.2 - Dashboard Interactivo:**
1. Datos reales desde Firebase
2. Gráficos con Chart.js o similar
3. Filtros de fecha y empresa
4. Métricas en tiempo real

**FASE 3.1 - Sistema de Alertas:**
1. Notificaciones de vencimiento
2. Email automático
3. Push notifications
4. Timeline de actividades

---

**📝 Nota**: Este inventario contiene el código fuente completo de todos los componentes en estado FASE 1.1. Para nueva sesión, leer primero `PROYECTO_COMPLETO_CONTEXTO.md` y luego este archivo para código específico.

*Última actualización: 29 Julio 2025*
