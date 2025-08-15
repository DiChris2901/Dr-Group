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
 * Previene errores comunes y detecta tema automáticamente:
 * - ❌ Ejemplo inválido: uso directo de tipografías no unificadas
 * - ❌ Ejemplo inválido: acceso directo a superficies sin hook/tema
 * - ❌ Ejemplo inválido: radios no mapeados al sistema
 * 
 * ✅ Uso recomendado:
 * const tokens = useTokens();
 * tokens.get('colors.surface.primary', '#ffffff');
 * tokens.getSurface('secondary'); // Detecta tema automáticamente
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
    
    // 🎨 MÉTODOS SEGUROS CON DETECCIÓN DE TEMA
    getSurface: (level = 'primary') => {
      return unifiedTokens.colors.surface.getSurface(theme, level);
    },
    
    getText: (level = 'primary') => {
      return unifiedTokens.colors.text.getText(theme, level);
    },
    
    getBorder: (level = 'light') => {
      return unifiedTokens.colors.border.getBorder(theme, level);
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
 * VERSIÓN MEJORADA con detección de tema
 */
export const useTableTokens = () => {
  const tokens = useTokens();
  
  return {
    // Estilos de celda (valores probados) - TEMA DINÁMICO
    cellStyle: {
      padding: tokens.spacing.table,           // '6px 8px'
      fontSize: tokens.typography.sizes.xs,    // '0.75rem'
      fontWeight: tokens.typography.weights.medium, // 500
      color: tokens.getText('primary'),        // Detecta tema automáticamente
      borderBottom: `1px solid ${tokens.getBorder('light')}` // Detecta tema automáticamente
    },
    
    // Header de tabla - TEMA DINÁMICO
    headerStyle: {
      backgroundColor: tokens.getSurface('secondary'), // Detecta tema automáticamente
      fontWeight: tokens.typography.weights.semiBold, // 600
      fontSize: tokens.typography.sizes.sm,           // '0.875rem'
      color: tokens.getText('secondary'),              // Detecta tema automáticamente
      padding: tokens.spacing.table,
      borderRadius: tokens.radius.subtle
    },
    
    // Contenedor de tabla - TEMA DINÁMICO
    containerStyle: {
      borderRadius: tokens.radius.subtle,
      boxShadow: tokens.shadows.subtle,
      overflow: 'hidden',
      backgroundColor: tokens.getSurface('primary')   // Detecta tema automáticamente
    },
    
    // Fila hover - TEMA DINÁMICO
    rowHoverStyle: {
      backgroundColor: tokens.getSurface('tertiary'),  // Detecta tema automáticamente
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
