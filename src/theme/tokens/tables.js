/**
 * 📊 DR Group Design System 3.0 - Tables Tokens
 * Tokens de tablas extraídos de la pestaña establecida
 */

// ========================================
// 📋 TABLE BASE TOKENS - ESTRUCTURA BASE
// ========================================

export const tableBaseTokens = {
  // Contenedor Paper base para todas las tablas
  paper: {
    padding: 0,
    borderRadius: 1,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    border: '1px solid',
    borderColor: 'grey.200',
    overflow: 'hidden'
  },

  // Headers básicos para todas las tablas
  headerBase: {
    fontWeight: 800,
    fontSize: '0.8rem',
    paddingY: 2,
    color: 'text.primary',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    fontFamily: 'inherit'
  },

  // Celdas de datos básicas
  cellBase: {
    paddingY: 1.8,
    fontSize: '0.85rem'
  },

  // Estados hover comunes
  rowHover: {
    '&:hover': {
      bgcolor: 'action.hover',
      transition: 'all 0.2s ease'
    },
    '&:last-child td': {
      borderBottom: 0
    }
  }
};

// ========================================
// 🎯 TABLE VARIANTS TOKENS - TIPOS ESPECÍFICOS
// ========================================

export const tableVariantTokens = {
  // Tabla Básica Profesional - LECTURA SIMPLE
  basic: {
    header: {
      title: {
        fontWeight: 700,
        fontSize: '1.15rem',
        color: 'text.primary',
        marginBottom: 0.5
      },
      description: {
        fontSize: '0.82rem',
        lineHeight: 1.4,
        marginBottom: 1
      },
      useCase: {
        fontSize: '0.8rem',
        fontWeight: 500,
        color: 'info.main'
      },
      background: {
        padding: 3,
        bgcolor: 'grey.50',
        borderBottom: '1px solid',
        borderColor: 'grey.200'
      }
    },
    
    tableHead: {
      bgcolor: 'rgba(0, 0, 0, 0.03)'
    },

    cells: {
      standard: {
        paddingY: 1.8,
        fontSize: '0.85rem',
        fontWeight: 500
      },
      secondary: {
        paddingY: 1.8,
        fontSize: '0.8rem',
        color: 'text.secondary'
      },
      amount: {
        paddingY: 1.8,
        fontWeight: 600,
        fontSize: '0.85rem'
      }
    },

    chips: {
      fontWeight: 500,
      fontSize: '0.75rem',
      height: 24
    }
  },

  // Tabla de Gestión Avanzada - ADMINISTRACIÓN COMPLETA
  advanced: {
    header: {
      title: {
        fontWeight: 700,
        fontSize: '1.15rem',
        color: 'text.primary',
        marginBottom: 0.5
      },
      description: {
        fontSize: '0.82rem',
        lineHeight: 1.4,
        marginBottom: 1
      },
      useCase: {
        fontSize: '0.8rem',
        fontWeight: 500,
        color: 'warning.main'
      },
      background: {
        padding: 3,
        bgcolor: 'grey.50',
        borderBottom: '1px solid',
        borderColor: 'grey.200'
      }
    },

    tableHead: {
      bgcolor: 'rgba(0, 0, 0, 0.03)',
      checkboxPadding: 1.8
    },

    sortLabel: {
      fontWeight: 800,
      fontSize: '0.8rem',
      color: 'text.primary',
      textTransform: 'uppercase',
      letterSpacing: '0.8px',
      fontFamily: 'inherit',
      '& .MuiTableSortLabel-icon': {
        fontSize: '0.9rem'
      }
    },

    cells: {
      standard: {
        paddingY: 1.5,
        fontSize: '0.85rem',
        fontWeight: 500
      },
      secondary: {
        paddingY: 1.5,
        fontSize: '0.8rem',
        color: 'text.secondary'
      },
      amount: {
        paddingY: 1.5,
        fontWeight: 600,
        fontSize: '0.85rem'
      },
      checkbox: {
        paddingY: 1.5
      }
    },

    selectedRow: {
      '&.Mui-selected': {
        bgcolor: 'primary.light',
        '&:hover': {
          bgcolor: 'primary.light'
        }
      }
    },

    chips: {
      fontWeight: 500,
      fontSize: '0.75rem',
      height: 24
    }
  },

  // Tabla Premium Ejecutiva - DASHBOARD PRINCIPAL
  executive: {
    header: {
      title: {
        fontWeight: 600,
        fontSize: '1.2rem',
        marginBottom: 0.5,
        color: 'white'
      },
      description: {
        opacity: 0.92,
        fontSize: '0.82rem',
        lineHeight: 1.4,
        marginBottom: 1
      },
      useCase: {
        opacity: 0.9,
        fontSize: '0.8rem',
        fontWeight: 500
      },
      background: {
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%)',
        color: 'white',
        padding: 2.5
      }
    },

    tableHead: {
      background: 'rgba(102, 126, 234, 0.08)'
    },

    cells: {
      standard: {
        paddingY: 1.5,
        fontSize: '0.85rem',
        fontWeight: 500
      },
      amount: {
        fontWeight: 600,
        paddingY: 1.5,
        fontSize: '0.85rem'
      },
      secondary: {
        paddingY: 1.5,
        fontSize: '0.8rem',
        color: 'text.secondary'
      }
    },

    rowHover: {
      '&:hover': {
        backgroundColor: 'rgba(102, 126, 234, 0.04)',
        transition: 'all 0.2s ease'
      },
      '&:last-child td': {
        borderBottom: 0
      }
    },

    chips: {
      fontWeight: 500,
      fontSize: '0.75rem',
      height: 24,
      transition: 'all 0.2s ease',
      '&:hover': {
        transform: 'scale(1.02)'
      }
    },

    pagination: {
      background: 'rgba(102, 126, 234, 0.02)'
    }
  }
};

// ========================================
// 📱 COMPACT TABLE TOKENS - TABLAS COMPACTAS
// ========================================

export const compactTableTokens = {
  // Tabla Compacta - Para espacios reducidos
  compact: {
    header: {
      title: {
        fontWeight: 700,
        fontSize: '1.05rem',
        color: 'text.primary',
        marginBottom: 0.3
      },
      description: {
        fontSize: '0.78rem',
        lineHeight: 1.3,
        marginBottom: 1
      },
      useCase: {
        fontSize: '0.76rem',
        fontWeight: 500,
        color: 'success.main'
      },
      background: {
        padding: 2.5,
        bgcolor: 'grey.50',
        borderBottom: '1px solid',
        borderColor: 'grey.200'
      }
    },

    tableHead: {
      bgcolor: 'rgba(0, 0, 0, 0.03)',
      cells: {
        fontWeight: 800,
        fontSize: '0.75rem',
        paddingY: 1.5,
        color: 'text.primary',
        textTransform: 'uppercase',
        letterSpacing: '0.7px',
        fontFamily: 'inherit'
      }
    },

    cells: {
      standard: {
        paddingY: 1,
        fontSize: '0.8rem',
        fontWeight: 500
      },
      amount: {
        paddingY: 1,
        fontWeight: 600,
        fontSize: '0.8rem'
      }
    },

    chips: {
      fontWeight: 500,
      fontSize: '0.7rem',
      height: 20
    },

    pagination: {
      paddingX: 1.5,
      '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
        fontSize: '0.75rem'
      }
    }
  },

  // Tabla de Análisis con Alternancia
  analysis: {
    header: {
      title: {
        fontWeight: 700,
        fontSize: '1.05rem',
        color: 'text.primary',
        marginBottom: 0.3
      },
      description: {
        fontSize: '0.78rem',
        lineHeight: 1.3,
        marginBottom: 1
      },
      useCase: {
        fontSize: '0.76rem',
        fontWeight: 500,
        color: 'secondary.main'
      },
      background: {
        padding: 2.5,
        bgcolor: 'grey.50',
        borderBottom: '1px solid',
        borderColor: 'grey.200'
      }
    },

    tableHead: {
      bgcolor: 'rgba(0, 0, 0, 0.03)',
      cells: {
        fontWeight: 800,
        fontSize: '0.75rem',
        paddingY: 1.5,
        color: 'text.primary',
        textTransform: 'uppercase',
        letterSpacing: '0.7px',
        fontFamily: 'inherit'
      }
    },

    cells: {
      standard: {
        paddingY: 1.2,
        fontSize: '0.8rem',
        fontWeight: 500
      },
      amount: {
        paddingY: 1.2,
        fontWeight: 600,
        fontSize: '0.8rem'
      }
    },

    alternateRows: {
      evenRow: 'transparent',
      oddRow: 'rgba(0, 0, 0, 0.02)'
    },

    chips: {
      fontWeight: 500,
      fontSize: '0.7rem',
      height: 22
    },

    pagination: {
      paddingX: 1.5,
      '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
        fontSize: '0.75rem'
      }
    }
  }
};

// ========================================
// 🎬 TABLE ANIMATION TOKENS - ANIMACIONES
// ========================================

export const tableAnimationTokens = {
  // Animaciones para tabla ejecutiva con motion.tr
  executive: {
    initial: { opacity: 0, x: -10 },
    animate: { opacity: 1, x: 0 },
    getTransition: (index = 0) => ({ 
      delay: index * 0.1, 
      duration: 0.3 
    })
  },

  // Animaciones hover estándar
  standardHover: {
    '&:hover': {
      bgcolor: 'action.hover',
      transition: 'all 0.2s ease'
    }
  },

  // Animaciones hover para tabla ejecutiva
  executiveHover: {
    '&:hover': {
      backgroundColor: 'rgba(102, 126, 234, 0.04)',
      transition: 'all 0.2s ease'
    }
  },

  // Animaciones para chips
  chipHover: {
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'scale(1.02)'
    }
  }
};

// ========================================
// 📄 PAGINATION TOKENS - PAGINACIÓN PERSONALIZADA
// ========================================

export const paginationTokens = {
  // CustomTablePagination base
  base: {
    container: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingX: 2.5,
      paddingY: 1.5,
      borderTop: '1px solid',
      borderColor: 'divider'
    },

    tablePagination: {
      border: 'none',
      '& .MuiTablePagination-toolbar': { px: 0 },
      '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
        fontSize: '0.8rem'
      }
    },

    divider: {
      orientation: 'vertical',
      flexItem: true
    },

    directPageInput: {
      container: {
        display: 'flex',
        alignItems: 'center',
        gap: 1
      },
      label: {
        fontSize: '0.75rem',
        whiteSpace: 'nowrap'
      },
      textField: {
        size: 'small',
        inputProps: {
          min: 1,
          style: {
            textAlign: 'center',
            fontSize: '0.75rem',
            padding: '4px 8px',
            width: '50px'
          }
        },
        sx: {
          '& .MuiOutlinedInput-root': {
            height: '32px',
            '& fieldset': {
              borderColor: 'grey.300'
            },
            '&:hover fieldset': {
              borderColor: 'primary.main'
            }
          }
        }
      }
    },

    muiPagination: {
      color: 'primary',
      size: 'small',
      showFirstButton: true,
      showLastButton: true,
      sx: {
        '& .MuiPagination-ul': {
          flexWrap: 'nowrap'
        },
        '& .MuiPaginationItem-root': {
          fontSize: '0.75rem',
          minWidth: '28px',
          height: '28px'
        }
      }
    }
  },

  // Variantes específicas
  compact: {
    container: {
      paddingX: 1.5,
      '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
        fontSize: '0.75rem'
      }
    }
  },

  executive: {
    container: {
      background: 'rgba(102, 126, 234, 0.02)'
    }
  }
};

// ========================================
// 🎨 TABLE SEMANTIC TOKENS - SEMÁNTICA Y COLORES
// ========================================

export const tableSemanticTokens = {
  // Casos de uso por tipo de tabla
  useCases: {
    basic: {
      icon: '✅',
      description: 'Reportes generales • Listas de consulta • Datos de solo lectura',
      color: 'info.main',
      context: 'Visualización simple de datos sin interacción compleja'
    },
    advanced: {
      icon: '⚡',
      description: 'Gestión de compromisos • Acciones masivas • Administración de usuarios',
      color: 'warning.main',
      context: 'Administración completa con selección múltiple y ordenamiento'
    },
    executive: {
      icon: '🎯',
      description: 'Resúmenes ejecutivos • KPIs principales • Vistas de director',
      color: 'white',
      context: 'Dashboard principal y vistas ejecutivas de alto nivel'
    },
    compact: {
      icon: '📱',
      description: 'Sidebars • Widgets • Resúmenes compactos',
      color: 'success.main',
      context: 'Paneles laterales y espacios reducidos'
    },
    analysis: {
      icon: '📊',
      description: 'Reportes comparativos • Análisis financieros • Auditorías',
      color: 'secondary.main',
      context: 'Comparaciones y análisis de datos con filas alternas'
    }
  },

  // Colores para status
  statusColors: {
    active: 'success',
    pending: 'warning',
    completed: 'success',
    critical: 'error',
    cancelled: 'default'
  },

  // Colores para prioridades
  priorityColors: {
    high: 'error',
    medium: 'warning',
    low: 'success',
    urgent: 'error'
  }
};

// ========================================
// 🛠️ TABLES UTILS
// ========================================

export const tablesUtils = {
  /**
   * Crear props para tabla básica
   * @param {Object} customStyles - Estilos personalizados
   * @returns {Object} Props completos para tabla básica
   */
  createBasicTable: (customStyles = {}) => {
    return {
      paperProps: {
        sx: {
          ...tableBaseTokens.paper,
          ...customStyles.paper
        }
      },
      headerProps: {
        sx: {
          ...tableVariantTokens.basic.header.background,
          ...customStyles.header
        }
      },
      tableHeadProps: {
        sx: {
          ...tableVariantTokens.basic.tableHead,
          ...customStyles.tableHead
        }
      },
      cellProps: {
        standard: { sx: tableVariantTokens.basic.cells.standard },
        secondary: { sx: tableVariantTokens.basic.cells.secondary },
        amount: { sx: tableVariantTokens.basic.cells.amount }
      },
      rowProps: {
        sx: {
          ...tableBaseTokens.rowHover,
          ...customStyles.row
        }
      }
    };
  },

  /**
   * Crear props para tabla avanzada
   * @param {Object} customStyles - Estilos personalizados
   * @returns {Object} Props completos para tabla avanzada
   */
  createAdvancedTable: (customStyles = {}) => {
    return {
      paperProps: {
        sx: {
          ...tableBaseTokens.paper,
          ...customStyles.paper
        }
      },
      headerProps: {
        sx: {
          ...tableVariantTokens.advanced.header.background,
          ...customStyles.header
        }
      },
      tableHeadProps: {
        sx: {
          ...tableVariantTokens.advanced.tableHead,
          ...customStyles.tableHead
        }
      },
      sortLabelProps: {
        sx: tableVariantTokens.advanced.sortLabel
      },
      cellProps: {
        standard: { sx: tableVariantTokens.advanced.cells.standard },
        secondary: { sx: tableVariantTokens.advanced.cells.secondary },
        amount: { sx: tableVariantTokens.advanced.cells.amount },
        checkbox: { sx: tableVariantTokens.advanced.cells.checkbox }
      },
      rowProps: {
        sx: {
          ...tableBaseTokens.rowHover,
          ...tableVariantTokens.advanced.selectedRow,
          cursor: 'pointer',
          ...customStyles.row
        }
      }
    };
  },

  /**
   * Crear props para tabla ejecutiva
   * @param {Object} customStyles - Estilos personalizados
   * @returns {Object} Props completos para tabla ejecutiva
   */
  createExecutiveTable: (customStyles = {}) => {
    return {
      paperProps: {
        sx: {
          overflow: 'hidden',
          borderRadius: 1,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid',
          borderColor: 'grey.200',
          ...customStyles.paper
        }
      },
      headerProps: {
        sx: {
          ...tableVariantTokens.executive.header.background,
          ...customStyles.header
        }
      },
      tableHeadProps: {
        sx: {
          ...tableVariantTokens.executive.tableHead,
          ...customStyles.tableHead
        }
      },
      cellProps: {
        standard: { sx: tableVariantTokens.executive.cells.standard },
        amount: { sx: tableVariantTokens.executive.cells.amount },
        secondary: { sx: tableVariantTokens.executive.cells.secondary }
      },
      rowProps: {
        sx: {
          ...tableVariantTokens.executive.rowHover,
          ...customStyles.row
        }
      },
      animationProps: {
        initial: tableAnimationTokens.executive.initial,
        animate: tableAnimationTokens.executive.animate,
        getTransition: tableAnimationTokens.executive.getTransition
      }
    };
  },

  /**
   * Crear props para tabla compacta
   * @param {string} variant - Variante (compact, analysis)
   * @param {Object} customStyles - Estilos personalizados
   * @returns {Object} Props completos para tabla compacta
   */
  createCompactTable: (variant = 'compact', customStyles = {}) => {
    const variantTokens = compactTableTokens[variant] || compactTableTokens.compact;
    
    return {
      paperProps: {
        sx: {
          ...tableBaseTokens.paper,
          ...customStyles.paper
        }
      },
      headerProps: {
        sx: {
          ...variantTokens.header.background,
          ...customStyles.header
        }
      },
      tableHeadProps: {
        sx: {
          ...variantTokens.tableHead,
          ...customStyles.tableHead
        }
      },
      cellProps: {
        standard: { sx: variantTokens.cells.standard },
        amount: { sx: variantTokens.cells.amount }
      },
      rowProps: {
        sx: {
          ...tableBaseTokens.rowHover,
          ...(variant === 'analysis' && {
            backgroundColor: 'var(--row-bg)'
          }),
          ...customStyles.row
        }
      },
      ...(variant === 'analysis' && {
        getRowBackground: (index) => 
          index % 2 === 0 
            ? variantTokens.alternateRows.evenRow 
            : variantTokens.alternateRows.oddRow
      })
    };
  },

  /**
   * Crear props para paginación personalizada
   * @param {string} variant - Variante (base, compact, executive)
   * @param {Object} customStyles - Estilos personalizados
   * @returns {Object} Props para CustomTablePagination
   */
  createPagination: (variant = 'base', customStyles = {}) => {
    const baseProps = paginationTokens.base;
    const variantProps = paginationTokens[variant] || {};
    
    return {
      sx: {
        ...baseProps.container,
        ...variantProps.container,
        ...customStyles
      },
      tablePaginationSx: baseProps.tablePagination,
      muiPaginationProps: baseProps.muiPagination,
      textFieldProps: baseProps.directPageInput.textField
    };
  },

  /**
   * Obtener color por status
   * @param {string} status - Estado
   * @returns {string} Color MUI
   */
  getStatusColor: (status) => {
    const statusMap = {
      'Activo': 'success',
      'Pendiente': 'warning',
      'Completado': 'success',
      'Crítico': 'error',
      'Cancelado': 'default'
    };
    return statusMap[status] || 'default';
  },

  /**
   * Obtener color por prioridad
   * @param {string} priority - Prioridad
   * @returns {string} Color MUI
   */
  getPriorityColor: (priority) => {
    const priorityMap = {
      'Alta': 'error',
      'Media': 'warning', 
      'Baja': 'success',
      'Urgente': 'error'
    };
    return priorityMap[priority] || 'default';
  },

  /**
   * Obtener caso de uso por tipo
   * @param {string} type - Tipo de tabla
   * @returns {Object} Información del caso de uso
   */
  getUseCase: (type) => {
    return tableSemanticTokens.useCases[type] || tableSemanticTokens.useCases.basic;
  },

  /**
   * Formatear número como COP
   * @param {number} amount - Cantidad
   * @returns {string} Formato COP
   */
  formatCOP: (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  }
};

export default {
  tableBaseTokens,
  tableVariantTokens,
  compactTableTokens,
  tableAnimationTokens,
  paginationTokens,
  tableSemanticTokens,
  tablesUtils
};
