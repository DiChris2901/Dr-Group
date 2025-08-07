import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Alert,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Stack,
  useTheme,
  alpha
} from '@mui/material';
import {
  CloudUpload,
  Description,
  Search,
  FilterList,
  GetApp,
  Refresh,
  Visibility,
  Analytics,
  Assignment,
  TableView,
  FileDownload,
  CheckCircle,
  Warning,
  Info,
  Error as ErrorIcon,
  Clear,
  PlayArrow,
  Stop,
  Settings,
  DeleteSweep,
  Save,
  RestartAlt,
  FirstPage,
  LastPage,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  Business,
  CalendarToday,
  AttachMoney,
  AccountBalance,
  TrendingUp,
  TrendingDown,
  Casino,
  Factory,
  Receipt,
  MonetizationOn,
  PrecisionManufacturing,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { styled } from '@mui/material/styles';
import useCompanies from '../hooks/useCompanies';

// Utilities para archivos
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';

// Hooks y Context - AGREGADO useSettings
import { useSettings } from '../context/SettingsContext';

// Design System v2.1 utilities
import {
  animationVariants,
  useThemeGradients,
  shimmerEffect
} from '../utils/designSystem.js';

// Función utilitaria para formatear valores como pesos colombianos
const formatCOP = (value) => {
  if (value == null || value === '' || isNaN(value)) return '$0';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(value));
};

// Styled components con Design System Spectacular v2.1
const StyledContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  minHeight: '100vh',
  '@keyframes shimmer': {
    '0%': { 
      transform: 'translateX(-100%)',
      opacity: 0.6
    },
    '50%': {
      opacity: 1
    },
    '100%': { 
      transform: 'translateX(100%)',
      opacity: 0.6
    }
  },
  '@keyframes pulse': {
    '0%, 100%': { 
      boxShadow: `0 0 0 0 ${alpha(theme.palette.primary.main, 0.7)}`
    },
    '50%': { 
      boxShadow: `0 0 0 15px ${alpha(theme.palette.primary.main, 0)}`
    }
  },
  '@keyframes glow': {
    '0%': { 
      boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.3)}`
    },
    '50%': { 
      boxShadow: `0 8px 40px ${alpha(theme.palette.primary.main, 0.6)}`
    },
    '100%': { 
      boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.3)}`
    }
  },
  '@keyframes float': {
    '0%, 100%': { 
      transform: 'translateY(0px) rotate(0deg)' 
    },
    '33%': { 
      transform: 'translateY(-10px) rotate(1deg)' 
    },
    '66%': { 
      transform: 'translateY(-5px) rotate(-1deg)' 
    }
  }
}));

const UploadZone = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isDragOver' && prop !== 'hasFile' && prop !== 'borderRadius',
})(({ theme, isDragOver, hasFile, borderRadius }) => ({
  position: 'relative',
  border: `2px dashed ${hasFile ? theme.palette.success.main : isDragOver ? theme.palette.secondary.main : theme.palette.primary.main}`,
  borderRadius: borderRadius || theme.shape.borderRadius,
  padding: theme.spacing(3),
  textAlign: 'center',
  cursor: 'pointer',
  overflow: 'hidden',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  background: hasFile 
    ? `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.08)}, ${alpha(theme.palette.success.light, 0.04)})`
    : isDragOver 
      ? `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.15)}, ${alpha(theme.palette.secondary.light, 0.08)})`
      : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)}, ${alpha(theme.palette.primary.light, 0.03)})`,
  backdropFilter: 'blur(10px)',
  '&:before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.1)}, transparent)`,
    transition: 'left 0.6s ease-in-out',
    pointerEvents: 'none'
  },
  '&:hover': {
    borderColor: hasFile ? theme.palette.success.dark : theme.palette.primary.dark,
    background: hasFile
      ? `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.12)}, ${alpha(theme.palette.success.light, 0.06)})`
      : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)}, ${alpha(theme.palette.primary.light, 0.06)})`,
    transform: 'translateY(-4px) scale(1.02)',
    boxShadow: hasFile
      ? `0 12px 30px ${alpha(theme.palette.success.main, 0.25)}`
      : `0 12px 30px ${alpha(theme.palette.primary.main, 0.25)}`,
    '&:before': {
      left: '100%'
    }
  },
  '&:active': {
    transform: 'translateY(-2px) scale(1.01)'
  },
  ...(hasFile && {
    animation: 'pulse 2s infinite'
  })
}));

const ProcessButton = styled(Button)(({ theme }) => ({
  position: 'relative',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  border: 'none',
  borderRadius: theme.shape.borderRadius * 3,
  color: 'white',
  padding: theme.spacing(1.5, 4),
  fontSize: '1rem',
  fontWeight: 600,
  textTransform: 'none',
  letterSpacing: '0.5px',
  overflow: 'hidden',
  boxShadow: `0 8px 25px ${alpha('#667eea', 0.4)}`,
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
    transition: 'left 0.8s ease-in-out'
  },
  '&:hover': {
    background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
    transform: 'translateY(-3px) scale(1.05)',
    boxShadow: `0 15px 35px ${alpha('#667eea', 0.5)}`,
    '&:before': {
      left: '100%'
    }
  },
  '&:active': {
    transform: 'translateY(-1px) scale(1.02)'
  },
  '&:disabled': {
    background: 'linear-gradient(135deg, #bbb 0%, #999 100%)',
    color: 'rgba(255,255,255,0.6)',
    cursor: 'not-allowed',
    transform: 'none',
    boxShadow: 'none'
  }
}));

const SpectacularCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'borderRadius',
})(({ theme, borderRadius }) => ({
  position: 'relative',
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)}, ${alpha(theme.palette.background.default, 0.98)})`,
  backdropFilter: 'blur(20px)',
  borderRadius: borderRadius || theme.shape.borderRadius,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.1)}`,
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  overflow: 'hidden',
  '&:before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '3px',
    background: 'linear-gradient(90deg, #667eea, #764ba2, #f093fb, #f5576c)',
    opacity: 0,
    transition: 'opacity 0.3s ease'
  },
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: `0 20px 40px ${alpha(theme.palette.common.black, 0.15)}`,
    '&:before': {
      opacity: 1
    }
  }
}));

const StatsCard = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'gradient',
})(({ theme, gradient }) => ({
  position: 'relative',
  background: gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  borderRadius: theme.shape.borderRadius * 2.5,
  padding: theme.spacing(3),
  color: 'white',
  textAlign: 'center',
  overflow: 'hidden',
  boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.3)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:before': {
    content: '""',
    position: 'absolute',
    top: '-50%',
    right: '-50%',
    width: '200%',
    height: '200%',
    background: `radial-gradient(circle, ${alpha('#ffffff', 0.1)} 0%, transparent 70%)`,
    opacity: 0,
    transition: 'opacity 0.3s ease',
    pointerEvents: 'none'
  },
  '&:hover': {
    transform: 'translateY(-5px) scale(1.03)',
    boxShadow: `0 15px 35px ${alpha(theme.palette.primary.main, 0.4)}`,
    '&:before': {
      opacity: 1
    }
  }
}));

// Styled components adicionales para Design System Spectacular v2.1
const SpectacularTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)}, ${alpha(theme.palette.background.default, 0.9)})`,
    backdropFilter: 'blur(10px)',
    borderRadius: theme.shape.borderRadius * 2,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.15)}`,
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: theme.palette.primary.main,
        borderWidth: '2px'
      }
    },
    '&.Mui-focused': {
      transform: 'translateY(-2px)',
      boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.25)}`,
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: theme.palette.primary.main,
        borderWidth: '2px'
      }
    }
  },
  '& .MuiInputLabel-root': {
    color: theme.palette.text.secondary,
    fontWeight: 500,
    '&.Mui-focused': {
      color: theme.palette.primary.main,
      fontWeight: 600
    }
  }
}));

const SpectacularAlert = styled(Alert)(({ theme }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)}, ${alpha(theme.palette.info.light, 0.05)})`,
  backdropFilter: 'blur(10px)',
  borderRadius: theme.shape.borderRadius * 2,
  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
  boxShadow: `0 4px 20px ${alpha(theme.palette.info.main, 0.1)}`,
  '& .MuiAlert-icon': {
    color: theme.palette.info.main
  },
  '& .MuiAlert-message': {
    fontWeight: 500
  }
}));

const SpectacularChip = styled(Chip)(({ theme }) => ({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  fontWeight: 600,
  borderRadius: theme.shape.borderRadius * 3,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-2px) scale(1.05)',
    boxShadow: `0 8px 20px ${alpha('#667eea', 0.4)}`
  }
}));

const SpectacularButton = styled(Button)(({ theme, variant = 'contained', color = 'primary' }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  textTransform: 'none',
  fontWeight: 600,
  padding: theme.spacing(1.5, 3),
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  ...(variant === 'contained' && {
    background: color === 'primary' 
      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      : color === 'secondary'
      ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
      : 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)',
    color: 'white',
    boxShadow: `0 4px 15px ${alpha(theme.palette[color].main, 0.3)}`,
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: `0 8px 25px ${alpha(theme.palette[color].main, 0.4)}`
    }
  }),
  ...(variant === 'outlined' && {
    border: `2px solid ${theme.palette[color].main}`,
    background: `linear-gradient(135deg, ${alpha(theme.palette[color].main, 0.05)}, ${alpha(theme.palette[color].light, 0.02)})`,
    color: theme.palette[color].main,
    backdropFilter: 'blur(10px)',
    '&:hover': {
      background: `linear-gradient(135deg, ${alpha(theme.palette[color].main, 0.1)}, ${alpha(theme.palette[color].light, 0.05)})`,
      transform: 'translateY(-2px)',
      boxShadow: `0 8px 20px ${alpha(theme.palette[color].main, 0.2)}`
    }
  }),
  '&:active': {
    transform: 'translateY(0px)'
  }
}));

const SpectacularPaper = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'borderRadius',
})(({ theme, borderRadius }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.default, 0.95)})`,
  backdropFilter: 'blur(20px)',
  borderRadius: borderRadius || theme.shape.borderRadius,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.08)}`,
  overflow: 'hidden',
  '& .MuiTableHead-root': {
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.light, 0.05)})`,
    '& .MuiTableCell-head': {
      fontWeight: 700,
      color: theme.palette.primary.main,
      borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`
    }
  },
  '& .MuiTableBody-root .MuiTableRow-root': {
    transition: 'all 0.2s ease',
    '&:hover': {
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.primary.light, 0.02)})`,
      transform: 'scale(1.005)'
    }
  }
}));

const SpectacularTablePagination = styled(TablePagination)(({ theme }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)}, ${alpha(theme.palette.background.default, 0.98)})`,
  backdropFilter: 'blur(10px)',
  borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  '& .MuiTablePagination-toolbar': {
    padding: theme.spacing(2),
    minHeight: '60px',
  },
  '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
    color: theme.palette.text.primary,
    fontWeight: 500,
    fontSize: '0.9rem',
  },
  '& .MuiTablePagination-select': {
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)}, ${alpha(theme.palette.primary.light, 0.04)})`,
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    color: theme.palette.text.primary,
    fontSize: '0.9rem',
    fontWeight: 600,
    padding: theme.spacing(1),
    minWidth: '60px',
    '&:focus': {
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)}, ${alpha(theme.palette.primary.light, 0.06)})`,
    },
    '&:hover': {
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)}, ${alpha(theme.palette.primary.light, 0.08)})`,
    }
  },
  '& .MuiSelect-icon': {
    color: theme.palette.primary.main,
  },
  '& .MuiTablePagination-actions': {
    marginLeft: theme.spacing(2),
    '& .MuiIconButton-root': {
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)}, ${alpha(theme.palette.primary.light, 0.04)})`,
      borderRadius: theme.shape.borderRadius,
      margin: theme.spacing(0, 0.5),
      width: '40px',
      height: '40px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)}, ${alpha(theme.palette.primary.light, 0.08)})`,
        transform: 'translateY(-2px)',
        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`,
      },
      '&:disabled': {
        background: alpha(theme.palette.action.disabled, 0.1),
        color: theme.palette.action.disabled,
        transform: 'none',
      }
    }
  }
}));

// Función para convertir período a texto legible
const convertPeriodToText = (period) => {
  if (!period || period.length !== 6) return period;
  
  const year = period.substring(0, 4);
  const month = period.substring(4, 6);
  
  const months = {
    '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril',
    '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto',
    '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre'
  };
  
  return `${months[month]} ${year}`;
};

// Función para encontrar establecimiento y código de local por separado
const findEstablishment = (row, inventoryData) => {
  if (!inventoryData.length) return 'No encontrado';
  
  const nuc = row.NUC?.toString().trim();
  const nuid = row.NUID?.toString().trim();
  const serial = row.Serial?.toString().trim();
  
  // Buscar por Serial primero (más específico)
  let match = inventoryData.find(inv => {
    const invSerial = inv.Serial?.toString().trim();
    return serial && invSerial === serial;
  });
  
  // Si no encuentra por Serial, buscar por NUC
  if (!match && nuc) {
    match = inventoryData.find(inv => {
      const invNUC = inv.NUC?.toString().trim();
      return invNUC === nuc;
    });
  }
  
  // Si no encuentra por NUC, buscar por NUID
  if (!match && nuid) {
    match = inventoryData.find(inv => {
      const invNUID = inv.NUID?.toString().trim();
      return invNUID === nuid;
    });
  }
  
  if (match) {
    const establishment = match['Nombre Establecimiento'] || match.Establecimiento || match.Nombre || match['Nombre de Establecimiento'] || match.establecimiento || 'No encontrado';
    return establishment;
  }
  
  return 'No encontrado';
};

const findLocalCode = (row, inventoryData) => {
  if (!inventoryData.length) return 'No encontrado';
  
  const nuc = row.NUC?.toString().trim();
  const nuid = row.NUID?.toString().trim();
  const serial = row.Serial?.toString().trim();
  
  console.log('🔍 Buscando código de local para:', { nuc, nuid, serial });
  
  // Buscar por Serial primero (más específico)
  let match = inventoryData.find(inv => {
    const invSerial = inv.Serial?.toString().trim();
    return serial && invSerial === serial;
  });
  
  if (match) {
    console.log('✅ Encontrado match por Serial:', serial);
  }
  
  // Si no encuentra por Serial, buscar por NUC
  if (!match && nuc) {
    match = inventoryData.find(inv => {
      const invNUC = inv.NUC?.toString().trim();
      return invNUC === nuc;
    });
    if (match) {
      console.log('✅ Encontrado match por NUC:', nuc);
    }
  }
  
  // Si no encuentra por NUC, buscar por NUID
  if (!match && nuid) {
    match = inventoryData.find(inv => {
      const invNUID = inv.NUID?.toString().trim();
      return invNUID === nuid;
    });
    if (match) {
      console.log('✅ Encontrado match por NUID:', nuid);
    }
  }
  
  if (match) {
    console.log('📋 Columnas disponibles en match:', Object.keys(match));
    
    // Buscar por nombres exactos PRIMERO (incluyendo "Código Local")
    const possibleKeys = [
      'Código Local',        // ✅ Tu columna exacta
      'Código de Local',     // ✅ Variante con mayúscula
      'Codigo Local',        // ✅ Variante sin tilde
      'Codigo de Local',     // ✅ Variante sin tilde con mayúscula
      'Código local',        // ✅ Variante minúscula
      'Codigo local',        // ✅ Variante sin tilde minúscula
      'CÓDIGO LOCAL',        // ✅ Mayúsculas
      'CODIGO LOCAL',        // ✅ Mayúsculas sin tilde
      'CÓDIGO DE LOCAL', 
      'CODIGO DE LOCAL', 
      'CodigoLocal', 
      'codigoLocal',
      'Codigo_Local',
      'codigo_local',
      'Local',               // ✅ Solo "Local"
      'LOCAL',               // ✅ Solo "LOCAL"
      'Codigo', 
      'Código', 
      'codigo',
      'CODIGO',
      'Code',
      'code'
    ];
    
    for (const key of possibleKeys) {
      if (match[key] !== undefined && match[key] !== null && match[key] !== '') {
        console.log(`✅ ENCONTRADO código de local en "${key}":`, match[key]);
        return match[key].toString();
      }
    }
    
    // Si no encuentra por nombres exactos, buscar con lógica inteligente
    for (const key of Object.keys(match)) {
      const lowerKey = key.toLowerCase();
      // Buscar claves que contengan "codigo" o "local" o "code"
      if ((lowerKey.includes('codigo') || lowerKey.includes('code')) && 
          (lowerKey.includes('local') || lowerKey.includes('establecimiento'))) {
        if (match[key] !== undefined && match[key] !== null && match[key] !== '') {
          console.log(`✅ ENCONTRADO por búsqueda inteligente en "${key}":`, match[key]);
          return match[key].toString();
        }
      }
    }
    
    // Buscar solo por "local" o "code" como último recurso
    for (const key of Object.keys(match)) {
      const lowerKey = key.toLowerCase();
      if ((lowerKey === 'local' || lowerKey === 'code' || lowerKey === 'codigo') && 
          match[key] !== undefined && match[key] !== null && match[key] !== '') {
        console.log(`✅ ENCONTRADO por búsqueda de último recurso en "${key}":`, match[key]);
        return match[key].toString();
      }
    }
    
    console.log('❌ NO ENCONTRADO código de local. Columnas disponibles:', Object.keys(match));
    return 'No encontrado';
  }
  
  console.log('❌ NO ENCONTRADO match para NUC/NUID/Serial');
  return 'No encontrado';
};

const findInventoryNIT = (row, inventoryData) => {
  if (!inventoryData.length) return null;
  
  const nuc = row.NUC?.toString().trim();
  const nuid = row.NUID?.toString().trim();
  const serial = row.Serial?.toString().trim();
  
  // Buscar por Serial primero (más específico)
  let match = inventoryData.find(inv => {
    const invSerial = inv.Serial?.toString().trim();
    return serial && invSerial === serial;
  });
  
  // Si no encuentra por Serial, buscar por NUC
  if (!match && nuc) {
    match = inventoryData.find(inv => {
      const invNUC = inv.NUC?.toString().trim();
      return invNUC === nuc;
    });
  }
  
  // Si no encuentra por NUC, buscar por NUID
  if (!match && nuid) {
    match = inventoryData.find(inv => {
      const invNUID = inv.NUID?.toString().trim();
      return invNUID === nuid;
    });
  }
  
  if (match) {
    return match.NIT || match.nit || match.Nit || null;
  }
  
  return null;
};

// Función para procesar archivos con el nuevo formato "Liquidación Final"
const processFiles = (liquidationData, inventoryData, findCompanyByNIT) => {
  console.log('🚀 Iniciando procesamiento de archivos');
  console.log('📊 Datos de liquidación:', liquidationData.length, 'filas');
  console.log('📋 Datos de inventario:', inventoryData.length, 'filas');
  
  // Debug: Mostrar estructura de datos
  if (liquidationData.length > 0) {
    console.log('🔍 Estructura liquidación (primera fila):', Object.keys(liquidationData[0]));
    console.log('🔍 Primera fila liquidación:', liquidationData[0]);
  }
  if (inventoryData.length > 0) {
    console.log('🔍 Estructura inventario (primera fila):', Object.keys(inventoryData[0]));
    console.log('🔍 Primera fila inventario:', inventoryData[0]);
  }

  return liquidationData.map((row, index) => {
    if (index < 3) { // Solo debug primeras 3 filas para no saturar consola
      console.log(`\n📄 Procesando fila ${index + 1}:`, {
        NUC: row.NUC,
        Serial: row.Serial,
        NUID: row.NUID
      });
    }
    
    // Buscar cada campo por separado usando la misma lógica
    const establishment = findEstablishment(row, inventoryData);
    const localCode = findLocalCode(row, inventoryData);
    const inventoryNIT = findInventoryNIT(row, inventoryData);
    
    // Buscar empresa por NIT de liquidación PRIMERO, si no existe usar NIT de inventario
    const liquidationNIT = row.NIT?.toString().trim();
    let companyName = 'No encontrado';
    
    // Prioridad 1: Buscar por NIT de liquidación
    if (liquidationNIT && liquidationNIT !== '') {
      companyName = findCompanyByNIT(liquidationNIT);
    }
    
    // Prioridad 2: Si no se encuentra, buscar por NIT de inventario
    if (companyName === 'No encontrado' && inventoryNIT) {
      companyName = findCompanyByNIT(inventoryNIT);
    }

    if (index < 3) { // Solo debug primeras 3 filas
      console.log(`📊 Resultado fila ${index + 1}:`, {
        liquidationNIT,
        inventoryNIT,
        localCode,
        establishment,
        companyName
      });
    }
    
    const entradas = Number(row.Entradas) || 0;
    const salidas = Number(row.Salidas) || 0;
    const jackpot = Number(row.Jackpot) || 0;
    const derechosExplotacion = Number(row['Derechos de Explotación']) || 0;
    const gastosAdmin = Number(row['Gastos de Administración']) || 0;
    
    // Calcular nuevas columnas
    const produccion = entradas - salidas - jackpot;
    const totalImpuestos = derechosExplotacion + gastosAdmin;
    
    return {
      'Periodo': convertPeriodToText(row.Periodo?.toString()),
      'NIT': row.NIT,
      'Contrato': row.Contrato,
      'Empresa': companyName,
      'Código de local': localCode,
      'NUC': row.NUC,
      'Serial': row.Serial,
      'Establecimiento': establishment,
      'Tarifa': row.Tarifa,
      'Entradas': formatCOP(entradas),
      'Salidas': formatCOP(salidas),
      'Jackpot': formatCOP(jackpot),
      'Producción': formatCOP(produccion),
      'Derechos de Explotación': formatCOP(derechosExplotacion),
      'Gastos de Administración': formatCOP(gastosAdmin),
      'Total Impuestos': formatCOP(totalImpuestos)
    };
  });
};

const LiquidationProcessorPage = () => {
  const theme = useTheme();
  const gradients = useThemeGradients();

  // Hook para configuración de temas - AGREGADO
  const { settings } = useSettings();

  // Hook para obtener empresas de Firebase
  const { companies, loading: companiesLoading, error: companiesError, findCompanyByNIT } = useCompanies();

  // Estados principales
  const [liquidationFile, setLiquidationFile] = useState(null);
  const [inventoryFile, setInventoryFile] = useState(null);
  const [liquidationData, setLiquidationData] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);
  const [processedData, setProcessedData] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [establishmentFilter, setEstablishmentFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [showResults, setShowResults] = useState(false);

  // Estados para paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Estados para drag and drop
  const [dragOverLiquidation, setDragOverLiquidation] = useState(false);
  const [dragOverInventory, setDragOverInventory] = useState(false);

  // Estado para expansión del análisis por salas
  const [expandRoomAnalysis, setExpandRoomAnalysis] = useState(false);

  // Función para leer archivos
  const readFile = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }, []);

  // Handlers para drag and drop
  const handleDragOver = useCallback((e, type) => {
    e.preventDefault();
    if (type === 'liquidation') {
      setDragOverLiquidation(true);
    } else if (type === 'inventory') {
      setDragOverInventory(true);
    }
  }, []);

  const handleDragLeave = useCallback((e, type) => {
    e.preventDefault();
    if (type === 'liquidation') {
      setDragOverLiquidation(false);
    } else if (type === 'inventory') {
      setDragOverInventory(false);
    }
  }, []);

  const handleDrop = useCallback(async (e, type) => {
    e.preventDefault();
    setDragOverLiquidation(false);
    setDragOverInventory(false);
    
    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    
    if (file && (file.type.includes('sheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.csv'))) {
      try {
        const data = await readFile(file);
        
        if (type === 'liquidation') {
          setLiquidationFile(file);
          setLiquidationData(data);
        } else if (type === 'inventory') {
          setInventoryFile(file);
          setInventoryData(data);
        }
        
        setError(null);
      } catch (err) {
        setError(`Error leyendo archivo ${file.name}: ${err.message}`);
      }
    } else {
      setError('Por favor, sube un archivo Excel (.xlsx) o CSV válido');
    }
  }, [readFile]);

  // Handler para seleccionar archivos
  const handleFileSelect = useCallback(async (e, type) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const data = await readFile(file);
        
        if (type === 'liquidation') {
          setLiquidationFile(file);
          setLiquidationData(data);
        } else if (type === 'inventory') {
          setInventoryFile(file);
          setInventoryData(data);
        }
        
        setError(null);
      } catch (err) {
        setError(`Error leyendo archivo ${file.name}: ${err.message}`);
      }
    }
  }, [readFile]);

  // Función para procesar archivos
  const handleProcessFiles = useCallback(async () => {
    if (!liquidationData.length || !inventoryData.length) {
      setError('Por favor, carga la Base de Liquidación y el Inventario antes de procesar');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Simular procesamiento con delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const result = processFiles(liquidationData, inventoryData, findCompanyByNIT);
      setProcessedData(result);
      setShowResults(true);
      
    } catch (err) {
      setError(`Error procesando archivos: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  }, [liquidationData, inventoryData, findCompanyByNIT]);

  // Función para exportar resultados
  const handleExport = useCallback((format = 'xlsx') => {
    if (!processedData.length) return;

    const filteredData = processedData.filter(row => {
      const matchesSearch = !searchTerm || 
        Object.values(row).some(value => 
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      const matchesEstablishment = establishmentFilter === 'all' || 
        row.Establecimiento === establishmentFilter;
      
      const matchesPeriod = periodFilter === 'all' || 
        row.Periodo === periodFilter;

      return matchesSearch && matchesEstablishment && matchesPeriod;
    });

    if (format === 'xlsx') {
      const worksheet = XLSX.utils.json_to_sheet(filteredData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Liquidación Final');
      
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(data, `Liquidacion_Final_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } else {
      const csv = Papa.unparse(filteredData);
      const data = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      saveAs(data, `Liquidacion_Final_${new Date().toISOString().slice(0, 10)}.csv`);
    }
  }, [processedData, searchTerm, establishmentFilter, periodFilter]);

  // Función para limpiar todo
  const handleClearAll = useCallback(() => {
    setLiquidationFile(null);
    setInventoryFile(null);
    setLiquidationData([]);
    setInventoryData([]);
    setProcessedData([]);
    setSearchTerm('');
    setEstablishmentFilter('all');
    setPeriodFilter('all');
    setShowResults(false);
    setError(null);
    setProcessing(false);
    setPage(0); // Reset pagination
  }, []);

  // Función para guardar (placeholder para futura implementación)
  const handleSave = useCallback(() => {
    // TODO: Implementar funcionalidad de guardado
    // Por ahora, solo mostramos un mensaje
    console.log('Guardando configuración/datos...', {
      hasLiquidationFile: !!liquidationFile,
      hasInventoryFile: !!inventoryFile,
      processedCount: processedData.length,
      currentFilters: { searchTerm, establishmentFilter, periodFilter }
    });
    
    // Simulamos guardado exitoso
    // Aquí podrías implementar guardado en localStorage, Firebase, etc.
  }, [liquidationFile, inventoryFile, processedData, searchTerm, establishmentFilter, periodFilter]);

  // Handlers de paginación
  const handleChangePage = useCallback((event, newPage) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  }, []);

  // Handler para resetear paginación cuando cambien los filtros
  const resetPagination = useCallback(() => {
    setPage(0);
  }, []);

  // Reset paginación cuando cambien los filtros
  React.useEffect(() => {
    resetPagination();
  }, [searchTerm, establishmentFilter, periodFilter, resetPagination]);

  // Datos filtrados para mostrar
  const filteredResults = useMemo(() => {
    if (!processedData.length) return [];

    return processedData.filter(row => {
      const matchesSearch = !searchTerm || 
        Object.values(row).some(value => 
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      const matchesEstablishment = establishmentFilter === 'all' || 
        row.Establecimiento === establishmentFilter;
      
      const matchesPeriod = periodFilter === 'all' || 
        row.Periodo === periodFilter;

      return matchesSearch && matchesEstablishment && matchesPeriod;
    });
  }, [processedData, searchTerm, establishmentFilter, periodFilter]);

  // Datos paginados para mostrar en la tabla
  const paginatedResults = useMemo(() => {
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredResults.slice(startIndex, endIndex);
  }, [filteredResults, page, rowsPerPage]);

  // Obtener valores únicos para filtros
  const uniqueEstablishments = useMemo(() => {
    const establishments = processedData.map(row => row.Establecimiento);
    return [...new Set(establishments)].sort();
  }, [processedData]);

  const uniquePeriods = useMemo(() => {
    const periods = processedData.map(row => row.Periodo);
    return [...new Set(periods)].sort();
  }, [processedData]);

  // Función para convertir valores a números
  const toNumber = useCallback((value) => {
    if (!value) return 0;
    const str = value.toString().replace(/[^\d.-]/g, '');
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  }, []);

  // Stats financieros y por salas
  const financialStats = useMemo(() => {
    const totalEntradas = processedData.reduce((sum, row) => {
      return sum + toNumber(row.Entradas);
    }, 0);

    const totalSalidas = processedData.reduce((sum, row) => {
      return sum + toNumber(row.Salidas);
    }, 0);

    const totalJackpot = processedData.reduce((sum, row) => {
      return sum + toNumber(row.Jackpot);
    }, 0);

    const totalProduccion = processedData.reduce((sum, row) => {
      return sum + toNumber(row['Producción']);
    }, 0);

    const totalDerechos = processedData.reduce((sum, row) => {
      return sum + toNumber(row['Derechos de Explotación']);
    }, 0);

    const totalGastos = processedData.reduce((sum, row) => {
      return sum + toNumber(row['Gastos de Administración']);
    }, 0);

    const totalImpuestos = processedData.reduce((sum, row) => {
      return sum + toNumber(row['Total Impuestos']);
    }, 0);

    return {
      totalEntradas,
      totalSalidas,
      totalJackpot,
      totalProduccion,
      totalDerechos,
      totalGastos,
      totalImpuestos,
      totalGeneral: totalDerechos + totalGastos  // Mantener para compatibilidad
    };
  }, [processedData, toNumber]);

  // Stats por salas
  const roomStats = useMemo(() => {
    const roomsData = {};

    processedData.forEach(row => {
      const establishment = row.Establecimiento;
      if (!establishment || establishment === 'No encontrado') return;

      if (!roomsData[establishment]) {
        roomsData[establishment] = {
          name: establishment,
          machines: new Set(),
          derechos: 0,
          gastos: 0,
          total: 0,
          empresa: row.Empresa || 'No encontrado'
        };
      }

      // Contar máquinas únicas por Serial/NUC
      if (row.Serial) roomsData[establishment].machines.add(row.Serial);
      else if (row.NUC) roomsData[establishment].machines.add(row.NUC);

      roomsData[establishment].derechos += toNumber(row['Derechos de Explotación']);
      roomsData[establishment].gastos += toNumber(row['Gastos de Administración']);
      roomsData[establishment].total = roomsData[establishment].derechos + roomsData[establishment].gastos;
    });

    // Convertir Set a número para las máquinas
    Object.keys(roomsData).forEach(key => {
      roomsData[key].machinesCount = roomsData[key].machines.size;
      delete roomsData[key].machines;
    });

    return Object.values(roomsData).sort((a, b) => b.total - a.total);
  }, [processedData, toNumber]);

  // Stats para mostrar (expandido con información financiera)
  const stats = useMemo(() => ({
    totalRecords: processedData.length,
    filteredRecords: filteredResults.length,
    establishments: uniqueEstablishments.length,
    periods: uniquePeriods.length,
    companiesFound: processedData.filter(row => row.Empresa && row.Empresa !== 'No encontrado').length,
    establishmentsNotFound: processedData.filter(row => row.Establecimiento === 'No encontrado').length,
    // Estadísticas financieras expandidas
    totalEntradas: financialStats.totalEntradas,
    totalSalidas: financialStats.totalSalidas,
    totalJackpot: financialStats.totalJackpot,
    totalProduccion: financialStats.totalProduccion,
    totalDerechos: financialStats.totalDerechos,
    totalGastos: financialStats.totalGastos,
    totalImpuestos: financialStats.totalImpuestos,
    totalGeneral: financialStats.totalGeneral,
    totalMachines: roomStats.reduce((sum, room) => sum + room.machinesCount, 0)
  }), [processedData, filteredResults, uniqueEstablishments, uniquePeriods, financialStats, roomStats]);

  return (
    <StyledContainer>
      {/* Header Premium con Gradiente Dinámico - EXACTO a Due Commitments */}
      <motion.div
        initial={settings.theme?.animations ? { opacity: 0, y: -20 } : {}}
        animate={settings.theme?.animations ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
        transition={settings.theme?.animations ? { duration: 0.6, type: "spring" } : { duration: 0 }}
      >
        <Box
          sx={{
            background: `linear-gradient(135deg, ${settings.theme?.primaryColor || '#667eea'} 0%, ${settings.theme?.secondaryColor || '#764ba2'} 100%)`,
            borderRadius: `${settings.theme?.borderRadius || 16}px`,
            p: settings.theme?.compactMode ? 3 : 4,
            mb: 3,
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: `${settings.theme?.borderRadius || 16}px`,
              zIndex: 0,
            }
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    p: 1.5,
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: `${(settings.theme?.borderRadius || 16) / 2}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Analytics sx={{ fontSize: (settings.theme?.fontSize || 16) * 2.3, color: 'white' }} />
                </Box>
                <Box>
                  <Typography 
                    variant="h4" 
                    fontWeight="700" 
                    sx={{ 
                      color: 'white', 
                      mb: 0.5,
                      fontSize: settings.theme?.fontSize ? `${settings.theme.fontSize + 8}px` : '2rem',
                      fontFamily: settings.theme?.fontFamily || 'inherit'
                    }}
                  >
                    Procesador de Liquidaciones
                  </Typography>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: settings.theme?.fontSize ? `${settings.theme.fontSize + 2}px` : '1.125rem',
                      fontFamily: settings.theme?.fontFamily || 'inherit'
                    }}
                  >
                    Herramienta para cruzar datos entre Base de Liquidación e Inventario, generando la "Liquidación Final" con información completa
                  </Typography>
                </Box>
              </Box>
              
              {/* Botones de Acción */}
              <Box display="flex" gap={2}>
                {/* Botón Limpiar */}
                <motion.div
                  initial={settings.theme?.animations ? { x: 20, opacity: 0 } : {}}
                  animate={settings.theme?.animations ? { x: 0, opacity: 1 } : { x: 0, opacity: 1 }}
                  transition={settings.theme?.animations ? { delay: 0.1, duration: 0.5 } : { duration: 0 }}
                  whileHover={settings.theme?.animations ? { scale: 1.05 } : {}}
                  whileTap={settings.theme?.animations ? { scale: 0.95 } : {}}
                >
                  <Button
                    variant="outlined"
                    startIcon={<DeleteSweep />}
                    onClick={handleClearAll}
                    disabled={!liquidationFile && !inventoryFile && !processedData.length}
                    size={settings.theme?.compactMode ? "medium" : "large"}
                    sx={{
                      py: settings.theme?.compactMode ? 1 : 1.5,
                      px: settings.theme?.compactMode ? 2.5 : 3.5,
                      fontSize: settings.theme?.fontSize ? `${settings.theme.fontSize * 1}px` : '1rem',
                      fontWeight: 600,
                      fontFamily: settings.theme?.fontFamily || 'inherit',
                      borderRadius: `${settings.theme?.borderRadius || 16}px`,
                      border: '2px solid rgba(255, 255, 255, 0.5)',
                      color: 'white',
                      textTransform: 'none',
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        background: 'rgba(255, 152, 0, 0.15)', // Naranja suave para indicar limpieza
                        borderColor: 'rgba(255, 193, 7, 0.8)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 20px rgba(255, 152, 0, 0.3)'
                      },
                      '&:disabled': {
                        opacity: 0.6,
                        cursor: 'not-allowed'
                      }
                    }}
                  >
                    Limpiar Todo
                  </Button>
                </motion.div>

                {/* Botón Guardar */}
                <motion.div
                  initial={settings.theme?.animations ? { x: 20, opacity: 0 } : {}}
                  animate={settings.theme?.animations ? { x: 0, opacity: 1 } : { x: 0, opacity: 1 }}
                  transition={settings.theme?.animations ? { delay: 0.2, duration: 0.5 } : { duration: 0 }}
                  whileHover={settings.theme?.animations ? { scale: 1.05 } : {}}
                  whileTap={settings.theme?.animations ? { scale: 0.95 } : {}}
                >
                  <Button
                    variant="outlined"
                    startIcon={<Save />}
                    onClick={handleSave}
                    disabled={!processedData.length}
                    size={settings.theme?.compactMode ? "medium" : "large"}
                    sx={{
                      py: settings.theme?.compactMode ? 1 : 1.5,
                      px: settings.theme?.compactMode ? 2.5 : 3.5,
                      fontSize: settings.theme?.fontSize ? `${settings.theme.fontSize * 1}px` : '1rem',
                      fontWeight: 600,
                      fontFamily: settings.theme?.fontFamily || 'inherit',
                      borderRadius: `${settings.theme?.borderRadius || 16}px`,
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
                      },
                      '&:disabled': {
                        opacity: 0.6,
                        cursor: 'not-allowed'
                      }
                    }}
                  >
                    {!processedData.length ? 'Guardar' : 'Guardar Resultados'}
                  </Button>
                </motion.div>
              </Box>
            </Box>
          </Box>
        </Box>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <SpectacularAlert 
                severity="error" 
                sx={{ mb: 3 }}
                action={
                  <IconButton
                    aria-label="close"
                    color="inherit"
                    size="small"
                    onClick={() => setError(null)}
                  >
                    <Clear fontSize="inherit" />
                  </IconButton>
                }
              >
                {error}
              </SpectacularAlert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Section */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Base de Liquidación */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <SpectacularCard sx={{ height: '100%' }} borderRadius={settings.theme?.borderRadius}>
                <CardContent sx={{ padding: theme.spacing(2.5) }}>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Assignment color="primary" />
                    Base de Liquidación
                  </Typography>
                  
                  <UploadZone
                    hasFile={liquidationFile !== null}
                    isDragOver={dragOverLiquidation}
                    borderRadius={settings.theme?.borderRadius}
                    onDragOver={(e) => handleDragOver(e, 'liquidation')}
                    onDragLeave={(e) => handleDragLeave(e, 'liquidation')}
                    onDrop={(e) => handleDrop(e, 'liquidation')}
                    onClick={() => document.getElementById('liquidation-file').click()}
                  >
                    <input
                      id="liquidation-file"
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      style={{ display: 'none' }}
                      onChange={(e) => handleFileSelect(e, 'liquidation')}
                    />
                    
                    {liquidationFile ? (
                      <Box>
                        <CheckCircle sx={{ fontSize: 36, color: theme.palette.success.main, mb: 1.5 }} />
                        <Typography variant="h6" color="success.main">
                          {liquidationFile.name}
                        </Typography>
                        <Typography variant="body2" color="success.dark">
                          {liquidationData.length} registros cargados
                        </Typography>
                      </Box>
                    ) : (
                      <Box>
                        <CloudUpload sx={{ fontSize: 36, color: theme.palette.primary.main, mb: 1.5 }} />
                        <Typography variant="h6" color="primary">
                          Arrastra o selecciona archivo
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Excel (.xlsx) o CSV con columnas: NIT, Contrato, NUC, NUID, Serial, Tarifa, Periodo, Entradas, Salidas, Jackpot, Derechos de Explotación, Gastos de Administración. 
                          <br/>Las columnas de Producción y Total Impuestos se calcularán automáticamente.
                        </Typography>
                      </Box>
                    )}
                  </UploadZone>
                </CardContent>
              </SpectacularCard>
            </motion.div>
          </Grid>

          {/* Inventario */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <SpectacularCard sx={{ height: '100%' }} borderRadius={settings.theme?.borderRadius}>
                <CardContent sx={{ padding: theme.spacing(2.5) }}>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TableView color="secondary" />
                    Inventario
                  </Typography>
                  
                  <UploadZone
                    hasFile={inventoryFile !== null}
                    isDragOver={dragOverInventory}
                    borderRadius={settings.theme?.borderRadius}
                    onDragOver={(e) => handleDragOver(e, 'inventory')}
                    onDragLeave={(e) => handleDragLeave(e, 'inventory')}
                    onDrop={(e) => handleDrop(e, 'inventory')}
                    onClick={() => document.getElementById('inventory-file').click()}
                  >
                    <input
                      id="inventory-file"
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      style={{ display: 'none' }}
                      onChange={(e) => handleFileSelect(e, 'inventory')}
                    />
                    
                    {inventoryFile ? (
                      <Box>
                        <CheckCircle sx={{ fontSize: 36, color: theme.palette.success.main, mb: 1.5 }} />
                        <Typography variant="h6" color="success.main">
                          {inventoryFile.name}
                        </Typography>
                        <Typography variant="body2" color="success.dark">
                          {inventoryData.length} registros cargados
                        </Typography>
                      </Box>
                    ) : (
                      <Box>
                        <CloudUpload sx={{ fontSize: 36, color: theme.palette.secondary.main, mb: 1.5 }} />
                        <Typography variant="h6" color="secondary">
                          Arrastra o selecciona archivo
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Excel (.xlsx) o CSV con columnas: Código local, Nombre Establecimiento, NUC, NUID, Serial, Código Marca, Marca, Código Apuesta, Tipo Apuesta, Fecha Inicio, Fecha Fin
                        </Typography>
                      </Box>
                    )}
                  </UploadZone>
                </CardContent>
              </SpectacularCard>
            </motion.div>
          </Grid>
        </Grid>

        {/* Process Button */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ProcessButton
              size="medium"
              startIcon={processing ? <Stop /> : <PlayArrow />}
              disabled={!liquidationFile || !inventoryFile || processing}
              onClick={handleProcessFiles}
              sx={{ px: 3, py: 1.2 }}
            >
              {processing ? 'Procesando...' : 'Procesar Archivos'}
            </ProcessButton>
          </motion.div>
          
          {processing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <LinearProgress sx={{ mt: 2, borderRadius: 2 }} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Cruzando datos entre archivos...
              </Typography>
            </motion.div>
          )}
        </Box>

        {/* Results Section */}
        <AnimatePresence>
          {showResults && processedData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.6 }}
            >
              {/* Stats Cards - Solo las 5 esenciales en una fila */}
              <Grid container spacing={2} mb={4} justifyContent="center">
                {[
                  {
                    title: 'Derechos Explotación',
                    value: formatCOP(stats.totalDerechos),
                    icon: AttachMoney,
                    iconBg: '#e8f5e8',
                    iconColor: '#4caf50'
                  },
                  {
                    title: 'Gastos Administración',
                    value: formatCOP(stats.totalGastos),
                    icon: MonetizationOn,
                    iconBg: '#fff8e1',
                    iconColor: '#ffa000'
                  },
                  {
                    title: 'Total General',
                    value: formatCOP(stats.totalGeneral),
                    icon: TrendingUp,
                    iconBg: '#e3f2fd',
                    iconColor: '#2196f3'
                  },
                  {
                    title: 'Total Máquinas',
                    value: stats.totalMachines,
                    icon: PrecisionManufacturing,
                    iconBg: '#f3e5f5',
                    iconColor: '#9c27b0'
                  },
                  {
                    title: 'Establecimientos',
                    value: stats.establishments,
                    icon: Business,
                    iconBg: '#fff3e0',
                    iconColor: '#ff9800'
                  }
                ].map((stat, index) => (
                  <Grid item xs={12} sm={6} md={2.4} lg={2.4} xl={2.4} key={index}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        duration: 0.4, 
                        delay: index * 0.1,
                        ease: "easeOut"
                      }}
                    >
                      <Card
                        sx={{
                          p: 2,
                          height: 120,
                          background: 'white',
                          borderRadius: 1,
                          border: '1px solid #f0f0f0',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                            transform: 'translateY(-2px)',
                          }
                        }}
                      >
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'flex-start',
                          height: '100%'
                        }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography 
                              variant="h3" 
                              sx={{ 
                                fontWeight: 600,
                                color: '#1a1a1a',
                                mb: 0.5,
                                fontSize: stat.title.includes('$') || stat.title.includes('Total') ? '1.4rem' : '1.75rem',
                                lineHeight: 1.2
                              }}
                            >
                              {stat.value}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: '#666',
                                fontWeight: 500,
                                mb: 1.5,
                                lineHeight: 1.3
                              }}
                            >
                              {stat.title}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              width: 44,
                              height: 44,
                              borderRadius: 1,
                              backgroundColor: stat.iconBg,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <stat.icon sx={{ fontSize: 22, color: stat.iconColor }} />
                          </Box>
                        </Box>
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>

              {/* Sección de Análisis por Salas */}
              {roomStats.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <SpectacularCard sx={{ mb: 3 }}>
                    <CardContent sx={{ padding: theme.spacing(3) }}>
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          mb: expandRoomAnalysis ? 3 : 0
                        }}
                        onClick={() => setExpandRoomAnalysis(!expandRoomAnalysis)}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Analytics sx={{ 
                            fontSize: 28, 
                            color: theme.palette.primary.main, 
                            mr: 2 
                          }} />
                          <Box>
                            <Typography 
                              variant="h5" 
                              sx={{ 
                                fontWeight: 700,
                                color: theme.palette.primary.main,
                                mb: 0.5
                              }}
                            >
                              Análisis por Salas
                            </Typography>
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                            >
                              Desglose detallado de ingresos y máquinas por establecimiento
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Chip 
                            label={`${roomStats.length} salas`}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ mr: 1 }}
                          />
                          {expandRoomAnalysis ? 
                            <ExpandLess sx={{ fontSize: 28, color: theme.palette.primary.main }} /> : 
                            <ExpandMore sx={{ fontSize: 28, color: theme.palette.primary.main }} />
                          }
                        </Box>
                      </Box>

                      <AnimatePresence>
                        {expandRoomAnalysis && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.4, ease: "easeInOut" }}
                            style={{ overflow: 'hidden' }}
                          >
                            <Divider sx={{ mb: 3 }} />
                            
                            {/* Resumen rápido */}
                            <Grid container spacing={2} sx={{ mb: 4 }}>
                              <Grid item xs={12} sm={3}>
                                <Box sx={{ 
                                  p: 2, 
                                  background: 'linear-gradient(135deg, #e8f5e8, #f0f8f0)',
                                  borderRadius: 2,
                                  textAlign: 'center'
                                }}>
                                  <Typography variant="h6" color="success.main" sx={{ fontWeight: 600 }}>
                                    {financialStats.totalDerechos.toLocaleString('es-CO', { 
                                      style: 'currency', 
                                      currency: 'COP',
                                      minimumFractionDigits: 0
                                    })}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Total Derechos
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={12} sm={3}>
                                <Box sx={{ 
                                  p: 2, 
                                  background: 'linear-gradient(135deg, #fff3e0, #fff8f0)',
                                  borderRadius: 2,
                                  textAlign: 'center'
                                }}>
                                  <Typography variant="h6" color="warning.main" sx={{ fontWeight: 600 }}>
                                    {financialStats.totalGastos.toLocaleString('es-CO', { 
                                      style: 'currency', 
                                      currency: 'COP',
                                      minimumFractionDigits: 0
                                    })}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Total Gastos
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={12} sm={3}>
                                <Box sx={{ 
                                  p: 2, 
                                  background: 'linear-gradient(135deg, #e3f2fd, #f0f8ff)',
                                  borderRadius: 2,
                                  textAlign: 'center'
                                }}>
                                  <Typography variant="h6" color="primary.main" sx={{ fontWeight: 600 }}>
                                    {financialStats.totalGeneral.toLocaleString('es-CO', { 
                                      style: 'currency', 
                                      currency: 'COP',
                                      minimumFractionDigits: 0
                                    })}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Total General
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={12} sm={3}>
                                <Box sx={{ 
                                  p: 2, 
                                  background: 'linear-gradient(135deg, #f3e5f5, #f8f0f8)',
                                  borderRadius: 2,
                                  textAlign: 'center'
                                }}>
                                  <Typography variant="h6" color="secondary.main" sx={{ fontWeight: 600 }}>
                                    {stats.totalMachines}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Total Máquinas
                                  </Typography>
                                </Box>
                              </Grid>
                            </Grid>

                            {/* Tabla detallada por salas */}
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                              Detalle por Establecimiento
                            </Typography>
                            
                            <SpectacularPaper>
                              <TableContainer>
                                <Table>
                                  <TableHead>
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 700 }}>Establecimiento</TableCell>
                                      <TableCell sx={{ fontWeight: 700 }}>Empresa</TableCell>
                                      <TableCell align="right" sx={{ fontWeight: 700 }}>Máquinas</TableCell>
                                      <TableCell align="right" sx={{ fontWeight: 700 }}>Derechos</TableCell>
                                      <TableCell align="right" sx={{ fontWeight: 700 }}>Gastos</TableCell>
                                      <TableCell align="right" sx={{ fontWeight: 700 }}>Total</TableCell>
                                      <TableCell align="right" sx={{ fontWeight: 700 }}>% del Total</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {roomStats.slice(0, 10).map((room, index) => (
                                      <TableRow key={index}>
                                        <TableCell>
                                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                            {room.name}
                                          </Typography>
                                        </TableCell>
                                        <TableCell>
                                          <Chip 
                                            label={room.empresa}
                                            size="small"
                                            variant="outlined"
                                            color={room.empresa === 'No encontrado' ? 'error' : 'primary'}
                                          />
                                        </TableCell>
                                        <TableCell align="right">
                                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {room.machinesCount}
                                          </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                          <Typography variant="body2" color="success.main" sx={{ fontWeight: 500 }}>
                                            {room.derechos.toLocaleString('es-CO', { 
                                              style: 'currency', 
                                              currency: 'COP',
                                              minimumFractionDigits: 0
                                            })}
                                          </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                          <Typography variant="body2" color="warning.main" sx={{ fontWeight: 500 }}>
                                            {room.gastos.toLocaleString('es-CO', { 
                                              style: 'currency', 
                                              currency: 'COP',
                                              minimumFractionDigits: 0
                                            })}
                                          </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                          <Typography variant="body2" color="primary.main" sx={{ fontWeight: 600 }}>
                                            {room.total.toLocaleString('es-CO', { 
                                              style: 'currency', 
                                              currency: 'COP',
                                              minimumFractionDigits: 0
                                            })}
                                          </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                            {((room.total / financialStats.totalGeneral) * 100).toFixed(1)}%
                                          </Typography>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                              {roomStats.length > 10 && (
                                <Box sx={{ p: 2, textAlign: 'center' }}>
                                  <Typography variant="body2" color="text.secondary">
                                    Mostrando las 10 salas principales de {roomStats.length} total
                                  </Typography>
                                </Box>
                              )}
                            </SpectacularPaper>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </SpectacularCard>
                </motion.div>
              )}

              <SpectacularCard sx={{ mb: 3 }}>
                <CardContent sx={{ padding: theme.spacing(3) }}>
                  {/* Filters */}
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={4}>
                      <SpectacularTextField
                        fullWidth
                        label="Buscar"
                        variant="outlined"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                          startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} />
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>Establecimiento</InputLabel>
                        <Select
                          value={establishmentFilter}
                          label="Establecimiento"
                          onChange={(e) => setEstablishmentFilter(e.target.value)}
                        >
                          <MenuItem value="all">Todos</MenuItem>
                          {uniqueEstablishments.map(est => (
                            <MenuItem key={est} value={est}>{est}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>Período</InputLabel>
                        <Select
                          value={periodFilter}
                          label="Período"
                          onChange={(e) => setPeriodFilter(e.target.value)}
                        >
                          <MenuItem value="all">Todos</MenuItem>
                          {uniquePeriods.map(period => (
                            <MenuItem key={period} value={period}>{period}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>

                  {/* Export Buttons */}
                  <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                    <Button
                      variant="contained"
                      startIcon={<GetApp />}
                      onClick={() => handleExport('xlsx')}
                      sx={{
                        background: 'linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #43a047 0%, #7cb342 100%)'
                        }
                      }}
                    >
                      Exportar Excel
                    </Button>
                    
                    <SpectacularButton
                      variant="outlined"
                      startIcon={<FileDownload />}
                      onClick={() => handleExport('csv')}
                      color="primary"
                    >
                      Exportar CSV
                    </SpectacularButton>
                    
                    <SpectacularButton
                      variant="outlined"
                      startIcon={<Refresh />}
                      color="secondary"
                      onClick={() => {
                        setSearchTerm('');
                        setEstablishmentFilter('all');
                        setPeriodFilter('all');
                      }}
                    >
                      Limpiar Filtros
                    </SpectacularButton>
                  </Stack>

                  {/* Results Table */}
                  <TableContainer 
                    component={(props) => 
                      <SpectacularPaper 
                        {...props} 
                        borderRadius={settings.theme?.borderRadius}
                      />
                    } 
                    sx={{ maxHeight: 600 }}
                  >
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow>
                          {[
                            'Periodo', 'NIT', 'Contrato', 'Empresa', 'Código de local',
                            'NUC', 'Serial', 'Establecimiento', 'Tarifa', 'Entradas', 
                            'Salidas', 'Jackpot', 'Producción', 'Derechos Explotación', 'Gastos Admin', 'Total Impuestos'
                          ].map((header) => (
                            <TableCell 
                              key={header}
                              sx={{ 
                                fontWeight: 600,
                                backgroundColor: alpha(theme.palette.primary.main, 0.1)
                              }}
                            >
                              {header}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paginatedResults.map((row, index) => (
                          <TableRow 
                            key={`${page}-${index}`}
                            sx={{
                              '&:nth-of-type(odd)': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.02)
                              },
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.05)
                              }
                            }}
                          >
                            <TableCell>{row.Periodo}</TableCell>
                            <TableCell>{row.NIT}</TableCell>
                            <TableCell>{row.Contrato}</TableCell>
                            <TableCell>{row.Empresa || 'No encontrado'}</TableCell>
                            <TableCell>{row['Código de local']}</TableCell>
                            <TableCell>{row.NUC}</TableCell>
                            <TableCell>{row.Serial}</TableCell>
                            <TableCell>{row.Establecimiento}</TableCell>
                            <TableCell>{row.Tarifa}</TableCell>
                            <TableCell>{row.Entradas}</TableCell>
                            <TableCell>{row.Salidas}</TableCell>
                            <TableCell>{row.Jackpot}</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: theme.palette.success.main }}>{row['Producción']}</TableCell>
                            <TableCell>{row['Derechos de Explotación']}</TableCell>
                            <TableCell>{row['Gastos de Administración']}</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: theme.palette.info.main }}>{row['Total Impuestos']}</TableCell>
                          </TableRow>
                        ))}
                        {paginatedResults.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={16} align="center">
                              <Box sx={{ py: 4 }}>
                                <Typography variant="h6" color="text.secondary">
                                  No se encontraron registros que coincidan con los filtros
                                </Typography>
                              </Box>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                    
                    {/* Spectacular Pagination */}
                    <SpectacularTablePagination
                      component="div"
                      count={filteredResults.length}
                      page={page}
                      onPageChange={handleChangePage}
                      rowsPerPage={rowsPerPage}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                      rowsPerPageOptions={[10, 25, 50, 100]}
                      labelRowsPerPage="Registros por página:"
                      labelDisplayedRows={({ from, to, count }) => 
                        `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
                      }
                      showFirstButton
                      showLastButton
                    />
                  </TableContainer>

                  {/* Controles de Navegación Adicionales - Más Visibles */}
                  {filteredResults.length > rowsPerPage && (
                    <Box sx={{ 
                      mt: 3, 
                      mb: 2, 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      gap: 2,
                      flexWrap: 'wrap'
                    }}>
                      {/* Botón Primera Página */}
                      <SpectacularButton
                        variant="outlined"
                        size="small"
                        startIcon={<FirstPage />}
                        onClick={() => handleChangePage(null, 0)}
                        disabled={page === 0}
                        color="primary"
                      >
                        Primera
                      </SpectacularButton>

                      {/* Botón Página Anterior */}
                      <SpectacularButton
                        variant="outlined"
                        size="small"
                        startIcon={<KeyboardArrowLeft />}
                        onClick={() => handleChangePage(null, page - 1)}
                        disabled={page === 0}
                        color="primary"
                      >
                        Anterior
                      </SpectacularButton>

                      {/* Indicador de Página Actual */}
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.light, 0.05)})`,
                        backdropFilter: 'blur(10px)',
                        borderRadius: theme.shape.borderRadius * 2,
                        padding: theme.spacing(1, 2),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                      }}>
                        <Typography variant="body2" fontWeight={600} color="primary">
                          Página {page + 1} de {Math.ceil(filteredResults.length / rowsPerPage)}
                        </Typography>
                      </Box>

                      {/* Botón Página Siguiente */}
                      <SpectacularButton
                        variant="outlined"
                        size="small"
                        endIcon={<KeyboardArrowRight />}
                        onClick={() => handleChangePage(null, page + 1)}
                        disabled={page >= Math.ceil(filteredResults.length / rowsPerPage) - 1}
                        color="primary"
                      >
                        Siguiente
                      </SpectacularButton>

                      {/* Botón Última Página */}
                      <SpectacularButton
                        variant="outlined"
                        size="small"
                        endIcon={<LastPage />}
                        onClick={() => handleChangePage(null, Math.max(0, Math.ceil(filteredResults.length / rowsPerPage) - 1))}
                        disabled={page >= Math.ceil(filteredResults.length / rowsPerPage) - 1}
                        color="primary"
                      >
                        Última
                      </SpectacularButton>
                    </Box>
                  )}

                  {/* Info sobre paginación */}
                  {filteredResults.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <SpectacularAlert severity="info" sx={{ textAlign: 'center' }}>
                        <Stack direction="row" spacing={2} justifyContent="center" alignItems="center" flexWrap="wrap">
                          <Typography variant="body2">
                            📊 <strong>{filteredResults.length}</strong> registros encontrados
                          </Typography>
                          <Typography variant="body2">
                            📄 Página <strong>{page + 1}</strong> de <strong>{Math.ceil(filteredResults.length / rowsPerPage)}</strong>
                          </Typography>
                          <Typography variant="body2">
                            👁️ Mostrando <strong>{Math.min(rowsPerPage, filteredResults.length - page * rowsPerPage)}</strong> registros
                          </Typography>
                        </Stack>
                      </SpectacularAlert>
                    </Box>
                  )}
                </CardContent>
              </SpectacularCard>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </StyledContainer>
  );
};

export default LiquidationProcessorPage;
