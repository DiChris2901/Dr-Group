/**
 * 🎨 DR Group Design System 3.0 - Design Tokens Index
 * Índice principal de tokens basado en el sistema de colores y gradientes establecido
 */

import { colorTokens, surfaceTokens } from './colors.js';
import { gradientTokens, gradientTokensLegacy, gradientUtils } from './gradients.js';
import { shadowTokens, coloredShadowTokens, shadowUtils } from './shadows.js';
import { typographyScaleTokens, fontWeightTokens, fontFamilyTokens, muiTypographyVariants, typographyUtils } from './typography.js';
import { iconSizeTokens, iconCategoryTokens, iconStyleTokens, iconAnimationTokens, fabTokens, iconUtils } from './icons.js';
import { headerTypeTokens, headerComponentTokens, headerAnimationTokens, headerLayoutTokens, headerUtils } from './headers.js';
import { 
  buttonVariantTokens, 
  buttonSizeTokens, 
  gradientButtonTokens,
  fabButtonTokens,
  iconButtonTokens,
  buttonWithIconTokens,
  buttonAnimationTokens,
  buttonStateTokens,
  buttonUtils 
} from './buttons.js';
import { 
  dashboardCardTokens, 
  detailedCardTokens, 
  paperAccentTokens,
  cardAnimationTokens,
  cardSemanticTokens,
  cardLayoutTokens,
  cardsUtils 
} from './cards.js';
import { 
  tableBaseTokens, 
  tableVariantTokens, 
  compactTableTokens,
  tableAnimationTokens,
  paginationTokens,
  tableSemanticTokens,
  tablesUtils 
} from './tables.js';

// ========================================
// 🚀 TOKENS PRINCIPALES - SISTEMA COMPLETO
// ========================================

export const designTokens = {
  // Colores - Sistema completo establecido
  colors: colorTokens,
  surfaces: surfaceTokens,
  
  // Gradientes V2 - Sistema nuevo establecido  
  gradients: gradientTokens,
  gradientsLegacy: gradientTokensLegacy,
  
  // Sombras - Sistema de sombras establecido
  shadows: shadowTokens,
  coloredShadows: coloredShadowTokens,

  // Tipografía - Escala 3.0 establecida
  typography: typographyScaleTokens,
  fontWeights: fontWeightTokens,
  fontFamilies: fontFamilyTokens,
  muiVariants: muiTypographyVariants,

  // Íconos - Sistema de íconos establecido
  iconSizes: iconSizeTokens,
  iconCategories: iconCategoryTokens,
  iconStyles: iconStyleTokens,
  iconAnimations: iconAnimationTokens,
  fabs: fabTokens,

  // Headers - Sistema de headers establecido
  headerTypes: headerTypeTokens,
  headerComponents: headerComponentTokens,
  headerAnimations: headerAnimationTokens,
  headerLayouts: headerLayoutTokens,

  // Botones - Sistema de botones establecido
  buttonVariants: buttonVariantTokens,
  buttonSizes: buttonSizeTokens,
  gradientButtons: gradientButtonTokens,
  fabButtons: fabButtonTokens,
  iconButtons: iconButtonTokens,
  buttonWithIcons: buttonWithIconTokens,
  buttonAnimations: buttonAnimationTokens,
  buttonStates: buttonStateTokens,

  // Cards y Contenedores - Sistema de cards establecido
  dashboardCards: dashboardCardTokens,
  detailedCards: detailedCardTokens,
  paperAccents: paperAccentTokens,
  cardAnimations: cardAnimationTokens,
  cardSemantics: cardSemanticTokens,
  cardLayouts: cardLayoutTokens,

  // Tablas - Sistema de tablas establecido
  tableBase: tableBaseTokens,
  tableVariants: tableVariantTokens,
  compactTables: compactTableTokens,
  tableAnimations: tableAnimationTokens,
  pagination: paginationTokens,
  tableSemantics: tableSemanticTokens,

};

// ========================================
// 🛠️ UTILIDADES PRINCIPALES
// ========================================

export const tokenUtils = {
  gradients: gradientUtils,
  shadows: shadowUtils,
  typography: typographyUtils,
  icons: iconUtils,
  headers: headerUtils,
  buttons: buttonUtils,
  cards: cardsUtils,
  tables: tablesUtils,
  
};

// ========================================
// 🎯 EXPORTS INDIVIDUALES
// ========================================

export {
  // Colores
  colorTokens,
  surfaceTokens,
  
  // Gradientes
  gradientTokens,
  gradientTokensLegacy,
  gradientUtils,
  
  // Sombras
  shadowTokens,
  coloredShadowTokens,
  shadowUtils,

  // Tipografía
  typographyScaleTokens,
  fontWeightTokens,
  fontFamilyTokens,
  muiTypographyVariants,
  typographyUtils,

  // Íconos
  iconSizeTokens,
  iconCategoryTokens,
  iconStyleTokens,
  iconAnimationTokens,
  fabTokens,
  iconUtils,

  // Headers
  headerTypeTokens,
  headerComponentTokens,
  headerAnimationTokens,
  headerLayoutTokens,
  headerUtils,

  // Botones
  buttonVariantTokens,
  buttonSizeTokens,
  gradientButtonTokens,
  fabButtonTokens,
  iconButtonTokens,
  buttonWithIconTokens,
  buttonAnimationTokens,
  buttonStateTokens,
  buttonUtils,

  // Cards y Contenedores
  dashboardCardTokens,
  detailedCardTokens,
  paperAccentTokens,
  cardAnimationTokens,
  cardSemanticTokens,
  cardLayoutTokens,
  cardsUtils,

  // Tablas
  tableBaseTokens,
  tableVariantTokens,
  compactTableTokens,
  tableAnimationTokens,
  paginationTokens,
  tableSemanticTokens,
  tablesUtils,
  
};

// Export por defecto
export default {
  designTokens,
  tokenUtils
};
