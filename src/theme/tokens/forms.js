/**
 * 🧾 FORMULARIOS - Design System 3.0 Tokens COMPLETOS
 * ===================================================
 * 
 * Tokens completos para formularios empresariales DS 3.0.
 * Compatible con MUI + Framer Motion + Paper Acento.
 * 
 * @version 2.0.0 - EXPANDIDO COMPLETO
 * @updated 2025-08-11
 */

// ===============================
// 📦 FORM CONTAINERS / LAYOUT
// ===============================

export const formPaperTokens = {
  // Paper básico (legacy)
  base: {
    p: 3,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 1
  },
  
  // Paper con Acento DS 3.0 (NUEVO)
  accent: {
    borderLeft: '4px solid',
    borderLeftColor: 'primary.main',
    borderRadius: 2,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    transition: 'all 160ms ease',
    '&:hover': {
      boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
      transform: 'translateY(-1px)'
    },
    '&:focus-within': {
      boxShadow: '0 4px 16px rgba(25, 118, 210, 0.15)',
      borderLeftColor: 'primary.dark'
    }
  },
  
  // Variantes de acento por estado
  accentVariants: {
    primary: { borderLeftColor: 'primary.main' },
    success: { borderLeftColor: 'success.main' },
    warning: { borderLeftColor: 'warning.main' },
    error: { borderLeftColor: 'error.main' },
    info: { borderLeftColor: 'info.main' }
  }
};

export const formSectionTokens = {
  // Headers banners básicos (legacy)
  primary: {
    mb: 3,
    p: 2,
    bgcolor: 'primary.50',
    borderRadius: 1,
    border: '1px solid',
    borderColor: 'primary.100',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  info: {
    mb: 3,
    p: 2,
    bgcolor: 'info.50',
    borderRadius: 1,
    border: '1px solid',
    borderColor: 'info.100',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  success: {
    mb: 3,
    p: 2,
    bgcolor: 'success.50',
    borderRadius: 1,
    border: '1px solid',
    borderColor: 'success.100',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  warning: {
    mb: 3,
    p: 2,
    bgcolor: 'warning.50',
    borderRadius: 1,
    border: '1px solid',
    borderColor: 'warning.100',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  error: {
    mb: 3,
    p: 2,
    bgcolor: 'error.50',
    borderRadius: 1,
    border: '1px solid',
    borderColor: 'error.100',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  
  // NUEVOS: Headers DS 3.0 con jerarquía empresarial
  management: {
    mb: 4,
    p: 3,
    textAlign: 'center',
    borderRadius: 2,
    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.03) 100%)',
    border: '1px solid rgba(102, 126, 234, 0.1)'
  },
  executive: {
    mb: 4,
    p: 2.5,
    textAlign: 'center',
    borderRadius: 2,
    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.03) 0%, rgba(118, 75, 162, 0.02) 100%)',
    border: '1px solid rgba(102, 126, 234, 0.08)'
  },
  standard: {
    mb: 3,
    p: 2,
    textAlign: 'center'
  }
};

export const formLayoutTokens = {
  // Espaciados básicos (legacy)
  gaps: {
    row: 3,
    column: 3
  },
  actions: {
    display: 'flex',
    gap: 2,
    justifyContent: 'flex-end'
  },
  
  // NUEVOS: Espaciados DS 3.0 completos
  spacing: {
    fieldGap: 3,        // 24px entre campos
    sectionGap: 4,      // 32px entre secciones
    groupGap: 2,        // 16px dentro de grupos
    labelGap: 1,        // 8px label-field
    helperGap: 0.5      // 4px field-helper
  },

  // Contenedores de sección DS 3.0
  section: {
    padding: { xs: 3, sm: 4 },
    marginBottom: 4,
    borderRadius: 2
  },

  // Grillas responsivas DS 3.0
  grid: {
    breakpoints: {
      singleColumn: { xs: 12 },
      doubleColumn: { xs: 12, md: 6 },
      tripleColumn: { xs: 12, md: 6, lg: 4 },
      autoFit: { xs: 12, sm: 'auto' }
    }
  },

  // Contenedores de acciones expandidos
  actionContainers: {
    horizontal: {
      display: 'flex',
      gap: 2,
      justifyContent: 'flex-end',
      flexWrap: 'wrap',
      mt: 3
    },
    vertical: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      mt: 3
    },
    split: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: 2,
      flexWrap: 'wrap',
      mt: 3
    },
    centered: {
      display: 'flex',
      gap: 2,
      justifyContent: 'center',
      flexWrap: 'wrap',
      mt: 3
    }
  }
};

// ===============================
// ✏️ FORM FIELDS DS 3.0 COMPLETO
// ===============================

export const formFieldTokens = {
  // Alturas estandarizadas DS 3.0
  heights: {
    small: 40,      // Campos compactos
    medium: 44,     // Estándar DS 3.0
    large: 48,      // Campos prominentes
    xl: 56          // Headers/principales
  },

  // Radios y bordes DS 3.0
  radius: {
    default: 8,     // Border radius estándar
    small: 6,       // Campos pequeños
    large: 12       // Campos especiales
  },

  borders: {
    width: 1.5,     // Grosor del borde
    widthFocus: 2,  // Borde en focus
    widthError: 2   // Borde en error
  },

  // Estilos base mejorados (legacy + DS 3.0)
  base: {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      backgroundColor: 'background.paper',
      transition: 'all 160ms ease',
      '& fieldset': {
        borderColor: 'grey.300',
        borderWidth: '1.5px'
      },
      '&:hover fieldset': {
        borderColor: 'primary.main'
      },
      '&.Mui-focused': {
        boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)',
        '& fieldset': {
          borderColor: 'primary.main'
        }
      }
    },
    '& .MuiInputBase-input': {
      fontSize: '0.875rem',
      '&::placeholder': {
        color: 'text.disabled',
        opacity: 0.7
      }
    },
    '& .MuiInputLabel-root': {
      fontSize: '0.875rem',
      fontWeight: 500
    }
  },

  // Tamaños DS 3.0 (expandido)
  sizes: {
    small: {
      '& .MuiOutlinedInput-root': {
        height: 40
      },
      '& .MuiInputBase-input': {
        paddingTop: 0.75,
        paddingBottom: 0.75,
        px: 1.5,
        fontSize: '0.8125rem'
      }
    },
    medium: {
      '& .MuiOutlinedInput-root': {
        height: 44
      },
      '& .MuiInputBase-input': {
        paddingTop: 1,
        paddingBottom: 1,
        px: 1.75,
        fontSize: '0.875rem'
      }
    },
    large: {
      '& .MuiOutlinedInput-root': {
        height: 48
      },
      '& .MuiInputBase-input': {
        paddingTop: 1.25,
        paddingBottom: 1.25,
        px: 2,
        fontSize: '1rem'
      }
    },
    xl: {
      '& .MuiOutlinedInput-root': {
        height: 56
      },
      '& .MuiInputBase-input': {
        paddingTop: 1.5,
        paddingBottom: 1.5,
        px: 2.5,
        fontSize: '1.125rem'
      }
    }
  },

  // Estados DS 3.0 (expandido)
  states: {
    default: {},
    normal: {
      '& .MuiOutlinedInput-root fieldset': {
        borderColor: 'grey.300'
      }
    },
    focus: {
      '& .MuiOutlinedInput-root': {
        boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)'
      },
      '& .MuiOutlinedInput-root fieldset': {
        borderColor: 'primary.main'
      }
    },
    error: {
      '& .MuiOutlinedInput-root fieldset': {
        borderColor: 'error.main'
      },
      '& .MuiOutlinedInput-root.Mui-focused fieldset': {
        borderColor: 'error.main',
        boxShadow: '0 0 0 2px rgba(211, 47, 47, 0.2)'
      },
      '& .MuiFormHelperText-root': {
        color: 'error.main',
        fontWeight: 500
      }
    },
    success: {
      '& .MuiOutlinedInput-root fieldset': {
        borderColor: 'success.main'
      },
      '& .MuiOutlinedInput-root.Mui-focused fieldset': {
        borderColor: 'success.main',
        boxShadow: '0 0 0 2px rgba(46, 125, 50, 0.2)'
      },
      '& .MuiFormHelperText-root': {
        color: 'success.main',
        fontWeight: 500
      }
    },
    warning: {
      '& .MuiOutlinedInput-root fieldset': {
        borderColor: 'warning.main'
      },
      '& .MuiOutlinedInput-root.Mui-focused fieldset': {
        borderColor: 'warning.main',
        boxShadow: '0 0 0 2px rgba(245, 124, 0, 0.2)'
      },
      '& .MuiFormHelperText-root': {
        color: 'warning.main',
        fontWeight: 500
      }
    },
    disabled: {
      '& .MuiOutlinedInput-root': {
        backgroundColor: 'grey.50'
      },
      '& .MuiOutlinedInput-root fieldset': {
        borderColor: 'grey.200'
      },
      '& .MuiInputBase-input': {
        color: 'text.disabled'
      }
    },
    loading: {
      '& .MuiOutlinedInput-root': {
        backgroundColor: 'action.hover'
      },
      '& .MuiOutlinedInput-root fieldset': {
        borderColor: 'grey.300'
      },
      '& .MuiInputBase-input': {
        color: 'text.secondary'
      }
    }
  },

  // Transiciones DS 3.0
  transitions: {
    default: 'all 160ms ease',
    focus: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    error: 'all 120ms ease'
  },

  // Ajustes específicos por tipo de campo
  typeAdjustments: {
    password: {
      '& .MuiInputAdornment-root': {
        '&.MuiInputAdornment-positionStart': {
          marginLeft: '12px'
        }
      }
    },
    select: {
      '& .MuiSelect-select': {
        display: 'flex',
        alignItems: 'center'
      }
    },
    autocomplete: {
      '& .MuiAutocomplete-inputRoot': {
        paddingRight: '0 !important'
      }
    },
    multiline: {
      '& .MuiInputBase-input': { 
        lineHeight: 1.5 
      }
    }
  }
};

// ===============================
// � FEEDBACK TOKENS DS 3.0
// ===============================

export const formFeedbackTokens = {
  success: {
    color: 'success.main',
    backgroundColor: 'success.50',
    icon: 'CheckCircle',
    iconColor: 'success.main'
  },
  warning: {
    color: 'warning.main',
    backgroundColor: 'warning.50',
    icon: 'Warning',
    iconColor: 'warning.main'
  },
  error: {
    color: 'error.main',
    backgroundColor: 'error.50',
    icon: 'Error',
    iconColor: 'error.main'
  },
  info: {
    color: 'info.main',
    backgroundColor: 'info.50',
    icon: 'Info',
    iconColor: 'info.main'
  }
};

// ===============================
// 🎯 ACTION TOKENS DS 3.0
// ===============================

export const formActionTokens = {
  // Botones primarios por tamaño
  primary: {
    small: {
      height: 36,
      fontSize: '0.875rem',
      fontWeight: 600,
      padding: '8px 16px'
    },
    medium: {
      height: 44,
      fontSize: '0.875rem',
      fontWeight: 600,
      padding: '10px 24px'
    },
    large: {
      height: 48,
      fontSize: '1rem',
      fontWeight: 600,
      padding: '12px 32px'
    }
  },

  // Estilos de botones DS 3.0
  styles: {
    primary: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
      borderRadius: '8px',
      textTransform: 'none',
      transition: 'all 160ms ease',
      '&:hover:not(:disabled)': {
        background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
        transform: 'translateY(-1px)'
      },
      '&:disabled': {
        background: 'grey.300',
        color: 'grey.500',
        boxShadow: 'none'
      }
    },
    secondary: {
      border: '1.5px solid',
      borderColor: 'grey.300',
      backgroundColor: 'background.paper',
      color: 'text.primary',
      borderRadius: '8px',
      textTransform: 'none',
      transition: 'all 160ms ease',
      '&:hover': {
        borderColor: 'primary.main',
        backgroundColor: 'primary.50',
        transform: 'translateY(-1px)'
      }
    },
    destructive: {
      backgroundColor: 'error.main',
      color: 'error.contrastText',
      borderRadius: '8px',
      textTransform: 'none',
      transition: 'all 160ms ease',
      '&:hover': {
        backgroundColor: 'error.dark',
        boxShadow: '0 4px 12px rgba(211, 47, 47, 0.3)',
        transform: 'translateY(-1px)'
      }
    }
  }
};

// ===============================
// 🎭 MASK TOKENS DS 3.0
// ===============================

export const formMaskTokens = {
  formats: {
    currency: {
      prefix: '$ ',
      suffix: '',
      thousandSeparator: '.',
      decimalSeparator: ',',
      decimalScale: 0,
      allowNegative: false,
      placeholder: '$ 1.234.567'
    },
    nit: {
      format: '###.###.###-#',
      mask: '_',
      placeholder: '123.456.789-1'
    },
    phone: {
      format: '### ### ####',
      mask: '_',
      placeholder: '300 123 4567'
    },
    date: {
      format: 'DD/MM/YYYY',
      placeholder: 'dd/mm/aaaa'
    },
    month: {
      format: 'MM/YYYY',
      placeholder: 'mm/aaaa'
    }
  }
};

// ===============================
// �🛠️ FORM UTILS DS 3.0 EXPANDIDO
// ===============================

export const formUtils = {
  /**
   * Crea props estandarizados para TextField/Select DS 3.0
   * @param {Object} cfg
   * @param {'text'|'email'|'password'|'select'|'autocomplete'|'multiline'|'date'|'month'} [cfg.type]
   * @param {'small'|'medium'|'large'|'xl'} [cfg.size]
   * @param {'default'|'normal'|'focus'|'error'|'success'|'warning'|'disabled'|'loading'} [cfg.state]
   * @param {boolean} [cfg.fullWidth=true]
   * @param {string} [cfg.variant='outlined']
   */
  createFieldProps: ({ 
    type = 'text', 
    size = 'medium', 
    state = 'default',
    fullWidth = true,
    variant = 'outlined'
  } = {}) => {
    const base = formFieldTokens.base;
    const sizeStyles = formFieldTokens.sizes[size] || formFieldTokens.sizes.medium;
    const stateStyles = formFieldTokens.states[state] || {};
    const typeAdjustments = formFieldTokens.typeAdjustments[type] || {};

    return {
      props: {
        fullWidth,
        variant,
        size: size === 'medium' ? undefined : size // MUI default es medium
      },
      sx: {
        ...base,
        ...sizeStyles,
        ...typeAdjustments,
        ...stateStyles
      }
    };
  },

  /**
   * Crea header de sección con jerarquía DS 3.0
   * @param {string} title - Título principal
   * @param {string} subtitle - Subtítulo opcional
   * @param {'management'|'executive'|'standard'|'primary'|'info'|'success'|'warning'|'error'} variant
   */
  createSectionHeader: (title, subtitle = '', variant = 'standard') => {
    // Headers DS 3.0 (nuevos)
    const headerVariants = {
      management: {
        containerSx: formSectionTokens.management,
        titleProps: { variant: 'h3', sx: { fontSize: '1.75rem', fontWeight: 700, color: 'text.primary', mb: subtitle ? 1 : 0 } },
        subtitleProps: subtitle ? { variant: 'body1', sx: { fontSize: '1rem', fontWeight: 400, color: 'text.secondary' } } : null
      },
      executive: {
        containerSx: formSectionTokens.executive,
        titleProps: { variant: 'h4', sx: { fontSize: '1.5rem', fontWeight: 600, color: 'text.primary', mb: subtitle ? 1 : 0 } },
        subtitleProps: subtitle ? { variant: 'body2', sx: { fontSize: '0.875rem', fontWeight: 400, color: 'text.secondary' } } : null
      },
      standard: {
        containerSx: formSectionTokens.standard,
        titleProps: { variant: 'h5', sx: { fontSize: '1.25rem', fontWeight: 600, color: 'text.primary', mb: subtitle ? 1 : 0 } },
        subtitleProps: subtitle ? { variant: 'body2', sx: { fontSize: '0.875rem', fontWeight: 400, color: 'text.secondary' } } : null
      }
    };

    // Headers legacy (compatibilidad)
    const legacyHeaders = ['primary', 'info', 'success', 'warning', 'error'];
    if (legacyHeaders.includes(variant)) {
      return {
        containerSx: formSectionTokens[variant],
        titleProps: { variant: 'h6', sx: { fontWeight: 600 } },
        subtitleProps: subtitle ? { variant: 'body2', sx: { color: 'text.secondary' } } : null
      };
    }

    return headerVariants[variant] || headerVariants.standard;
  },

  /**
   * Devuelve estilo de contenedor Paper para formularios DS 3.0
   * @param {'base'|'accent'} type - Tipo de paper
   * @param {'primary'|'success'|'warning'|'error'|'info'} accentColor - Color del acento
   */
  getFormPaper: (type = 'base', accentColor = 'primary') => {
    if (type === 'accent') {
      return {
        ...formPaperTokens.accent,
        ...formPaperTokens.accentVariants[accentColor]
      };
    }
    return formPaperTokens.base;
  },

  /**
   * Barra de acciones (botones) DS 3.0
   * @param {'horizontal'|'vertical'|'split'|'centered'} layout - Diseño del contenedor
   * @param {'left'|'center'|'right'} align - Alineación (solo para horizontal)
   */
  createActionsBar: (layout = 'horizontal', align = 'right') => {
    if (layout === 'horizontal') {
      return {
        ...formLayoutTokens.actionContainers.horizontal,
        justifyContent: `flex-${align}`
      };
    }
    return formLayoutTokens.actionContainers[layout] || formLayoutTokens.actionContainers.horizontal;
  },

  /**
   * Crea props para botones de formulario DS 3.0
   * @param {'primary'|'secondary'|'destructive'} style - Estilo del botón
   * @param {'small'|'medium'|'large'} size - Tamaño del botón
   */
  createButtonProps: (style = 'primary', size = 'medium') => {
    const baseProps = {
      variant: style === 'primary' ? 'contained' : 'outlined',
      size: size === 'medium' ? undefined : size
    };

    const sizeStyles = formActionTokens.primary[size] || formActionTokens.primary.medium;
    const styleStyles = formActionTokens.styles[style] || formActionTokens.styles.primary;

    return {
      props: baseProps,
      sx: {
        ...sizeStyles,
        ...styleStyles
      }
    };
  }
};

// ===============================
// 💰 FORMAT UTILITIES DS 3.0
// ===============================

/**
 * Formatea valor como moneda colombiana (COP)
 * @param {number|string} value - Valor a formatear
 * @returns {string} Valor formateado como $ 1.234.567
 */
export const formatCOP = (value) => {
  if (!value && value !== 0) return '';
  const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^\d]/g, '')) : value;
  if (isNaN(numValue)) return '';
  return `$ ${numValue.toLocaleString('es-CO')}`;
};

/**
 * Formatea número de teléfono colombiano
 * @param {string} value - Número sin formato
 * @returns {string} Teléfono formateado como 300 123 4567
 */
export const formatPhone = (value) => {
  if (!value) return '';
  const cleaned = value.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  return match ? `${match[1]} ${match[2]} ${match[3]}` : value;
};

/**
 * Formatea NIT empresarial
 * @param {string} value - NIT sin formato
 * @returns {string} NIT formateado como 123.456.789-1
 */
export const formatNIT = (value) => {
  if (!value) return '';
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
  if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 10)}`;
};

/**
 * Formatea fecha DD/MM/YYYY
 * @param {string|Date} value - Fecha a formatear
 * @returns {string} Fecha formateada
 */
export const formatDate = (value) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-CO');
};

/**
 * Formatea mes MM/YYYY
 * @param {string|Date} value - Fecha a formatear
 * @returns {string} Mes formateado
 */
export const formatMonth = (value) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return '';
  return `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
};

export default {
  // Legacy exports (compatibilidad)
  formPaperTokens,
  formSectionTokens,
  formLayoutTokens,
  formFieldTokens,
  formUtils,
  
  // Nuevas exportaciones DS 3.0
  formFeedbackTokens,
  formActionTokens,
  formMaskTokens,
  
  // Utilidades de formato
  formatCOP,
  formatPhone,
  formatNIT,
  formatDate,
  formatMonth
};
