// ========================================
// 🎯 Hook: useTokens
// ========================================
// Hook personalizado para acceso seguro a tokens DS 3.0
// Evita errores "Cannot read properties of undefined"

import { useTheme } from '@mui/material/styles';
import { unifiedTokens, enhancedTokenUtils } from '../theme/tokens/index.js';

/**
 * 🛡️ Hook para acceso seguro a tokens del Design System 3.0
 * 
 * Previene errores comunes:
 * - ❌ designTokens.typography.weights.semiBold (undefined)
 * - ❌ designTokens.colors.surface.primary (undefined) 
 * - ❌ designTokens.radii.sm (undefined)
 * 
 * ✅ Uso recomendado:
 * const tokens = useTokens();
 * tokens.get('colors.surface.primary', '#ffffff');
 */
export const useTokens = () => {
  const theme = useTheme();
  
  const tokens = {
    // 🎨 Acceso directo a tokens unificados
    colors: unifiedTokens.colors,
    typography: unifiedTokens.typography,
    spacing: unifiedTokens.spacing,
    radius: unifiedTokens.radius,
    shadows: unifiedTokens.shadows,
    
    // 🛡️ Obtener token con fallback (MÉTODO PRINCIPAL)
    get: (path, fallback = null) => {
      return enhancedTokenUtils.getToken(path, fallback);
    },
    
    // ✅ Verificar existencia
    exists: (path) => {
      return enhancedTokenUtils.tokenExists(path);
    },
    
    // 🏷️ Helpers específicos comunes (probados en CommitmentsList)
    table: {
      // Valores probados para tablas empresariales
      padding: unifiedTokens.spacing.table,           // '6px 8px'
      borderRadius: unifiedTokens.radius.subtle,      // 1px (corporativo)
      fontSize: unifiedTokens.typography.sizes.xs,    // 12px 
      fontWeight: unifiedTokens.typography.weights.medium, // 500
      
      // Colores específicos de tabla
      headerBg: unifiedTokens.colors.surface.secondary,
      cellBorder: unifiedTokens.colors.border.light,
      textPrimary: unifiedTokens.colors.text.primary,
      textSecondary: unifiedTokens.colors.text.secondary
    },
    
    // 🃏 Cards empresariales
    card: {
      padding: unifiedTokens.spacing.card,             // '16px'
      borderRadius: unifiedTokens.radius.small,       // 3px
      shadow: unifiedTokens.shadows.card,
      background: unifiedTokens.colors.surface.primary
    },
    
    // 🚪 Modales
    modal: {
      padding: unifiedTokens.spacing.modal,           // '24px'  
      borderRadius: unifiedTokens.radius.medium,     // 6px
      shadow: unifiedTokens.shadows.modal,
      background: unifiedTokens.colors.surface.primary
    },
    
    // 🔘 Botones empresariales
    button: {
      borderRadius: unifiedTokens.radius.small,      // 3px (moderno sutil)
      padding: `${unifiedTokens.spacing.sm} ${unifiedTokens.spacing.md}`, // '8px 16px'
      fontWeight: unifiedTokens.typography.weights.semiBold
    },
    
    // 📝 Formularios
    form: {
      fieldSpacing: unifiedTokens.spacing.md,        // 16px entre campos
      borderRadius: unifiedTokens.radius.small,     // 3px
      padding: `${unifiedTokens.spacing.xs} ${unifiedTokens.spacing.sm}` // '4px 8px'
    }
  };
  
  return tokens;
};

/**
 * 🎯 Hook específico para componentes de tabla
 * Uso directo en CommitmentsList, PaymentsList, etc.
 */
export const useTableTokens = () => {
  const tokens = useTokens();
  
  return {
    // Estilos de celda (valores probados)
    cellStyle: {
      padding: tokens.table.padding,           // '6px 8px'
      fontSize: tokens.table.fontSize,         // '0.75rem'
      fontWeight: tokens.table.fontWeight,     // 500
      color: tokens.table.textPrimary,
      borderBottom: `1px solid ${tokens.table.cellBorder}`
    },
    
    // Header de tabla
    headerStyle: {
      backgroundColor: tokens.table.headerBg,
      fontWeight: tokens.typography.weights.semiBold, // 600
      fontSize: tokens.typography.sizes.sm,           // '0.875rem'
      color: tokens.table.textPrimary,
      padding: tokens.table.padding,
      borderRadius: tokens.table.borderRadius
    },
    
    // Contenedor de tabla
    containerStyle: {
      borderRadius: tokens.table.borderRadius,
      boxShadow: tokens.shadows.subtle,
      overflow: 'hidden',
      backgroundColor: tokens.colors.surface.primary
    },
    
    // Fila hover
    rowHoverStyle: {
      backgroundColor: tokens.colors.surface.tertiary,
      cursor: 'pointer'
    }
  };
};

/**
 * 🔧 Hook para debugging de tokens
 * Solo para desarrollo - no usar en producción
 */
export const useTokenDebug = () => {
  const validateTokens = () => {
    console.log('🔍 Validando tokens críticos...');
    const results = enhancedTokenUtils.validateCriticalTokens();
    
    if (results.invalid.length > 0) {
      console.error('❌ Tokens faltantes encontrados:', results.invalid);
    } else {
      console.log('✅ Todos los tokens críticos están disponibles');
    }
    
    return results;
  };
  
  const logToken = (path) => {
    const value = enhancedTokenUtils.getToken(path);
    console.log(`🏷️ unifiedTokens.${path}:`, value);
    return value;
  };
  
  return {
    validateTokens,
    logToken,
    enhancedTokenUtils
  };
};

export default useTokens;
