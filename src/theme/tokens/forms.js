/**
 * 📝 DR Group Design System 3.0 - Form Tokens
 * Tokens y utilidades de formularios, alineados con MUI y los patrones ya definidos.
 */

// ===============================
// 📦 FORM CONTAINERS / LAYOUT
// ===============================

export const formPaperTokens = {
  base: {
    p: 3,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 1
  }
};

export const formSectionTokens = {
  // Banners compactos para encabezados de secciones de formularios
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
  }
};

export const formLayoutTokens = {
  gaps: {
    row: 3,
    column: 3
  },
  actions: {
    display: 'flex',
    gap: 2,
    justifyContent: 'flex-end'
  }
};

// ===============================
// ✏️ FORM FIELDS (TextField / Select)
// ===============================

export const formFieldTokens = {
  base: {
    // Aplica a .MuiOutlinedInput-root del TextField/Select
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      backgroundColor: 'background.paper',
      '& fieldset': {
        borderColor: 'divider'
      },
      '&:hover fieldset': {
        borderColor: 'primary.light'
      },
      '&.Mui-focused fieldset': {
        borderColor: 'primary.main',
        boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.10)'
      }
    },
    '& .MuiInputBase-input': {
      fontSize: '0.95rem'
    }
  },

  sizes: {
    small: {
      '& .MuiInputBase-input': {
        paddingTop: 0.75,
        paddingBottom: 0.75,
        px: 1.5,
        fontSize: '0.875rem'
      }
    },
    medium: {
      '& .MuiInputBase-input': {
        paddingTop: 1,
        paddingBottom: 1,
        px: 1.75,
        fontSize: '0.95rem'
      }
    },
    large: {
      '& .MuiInputBase-input': {
        paddingTop: 1.25,
        paddingBottom: 1.25,
        px: 2,
        fontSize: '1rem'
      }
    }
  },

  states: {
    default: {},
    error: {
      '& .MuiOutlinedInput-root fieldset': {
        borderColor: 'error.main'
      },
      '& .MuiOutlinedInput-root.Mui-focused fieldset': {
        borderColor: 'error.main',
        boxShadow: '0 0 0 3px rgba(211, 47, 47, 0.12)'
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
        boxShadow: '0 0 0 3px rgba(76, 175, 80, 0.12)'
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
        boxShadow: '0 0 0 3px rgba(245, 124, 0, 0.12)'
      },
      '& .MuiFormHelperText-root': {
        color: 'warning.main',
        fontWeight: 500
      }
    }
  }
};

// ===============================
// 🛠️ FORM UTILS
// ===============================

export const formUtils = {
  /**
   * Crea props estandarizados para TextField/Select
   * @param {Object} cfg
   * @param {'text'|'select'|'multiline'} [cfg.type]
   * @param {'small'|'medium'|'large'} [cfg.size]
   * @param {'default'|'error'|'success'|'warning'} [cfg.state]
   */
  createFieldProps: ({ type = 'text', size = 'medium', state = 'default' } = {}) => {
    const base = formFieldTokens.base;
    const sizeStyles = formFieldTokens.sizes[size] || {};
    const stateStyles = formFieldTokens.states[state] || {};

    // Ajustes mínimos para multiline
    const multilineFix = type === 'multiline' ? {
      '& .MuiInputBase-input': { lineHeight: 1.5 }
    } : {};

    return {
      sx: {
        ...base,
        ...sizeStyles,
        ...multilineFix,
        ...stateStyles
      }
    };
  },

  /**
   * Devuelve estilos de banner de sección (encabezado de formulario)
   * @param {'primary'|'info'|'success'|'warning'|'error'} color
   */
  createSectionHeader: (color = 'primary') => {
    return formSectionTokens[color] || formSectionTokens.primary;
  },

  /**
   * Devuelve estilo de contenedor Paper para formularios
   */
  getFormPaper: () => ({ ...formPaperTokens.base }),

  /**
   * Barra de acciones (botones) al pie del formulario
   */
  createActionsBar: (align = 'flex-end') => ({
    ...formLayoutTokens.actions,
    justifyContent: align
  })
};

export default {
  formPaperTokens,
  formSectionTokens,
  formLayoutTokens,
  formFieldTokens,
  formUtils
};
