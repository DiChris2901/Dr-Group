/**
 * 🎨 DR Group Design System 3.0 - Design Tokens Index
 * Índice principal de tokens basado en el sistema de colores y gradientes establecido
 */

import { colorTokens, surfaceTokens } from './colors.js';
import { gradientTokens, gradientTokensLegacy, gradientUtils } from './gradients.js';
import { shadowTokens, coloredShadowTokens, shadowUtils } from './shadows.js';
import { spacingTokens, componentSpacingTokens, borderRadiusTokens, layoutSpacingTokens, spacingUtils } from './spacing.js';
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
import { 
  formPaperTokens,
  formSectionTokens,
  formLayoutTokens,
  formFieldTokens,
  formFeedbackTokens,
  formActionTokens,
  formMaskTokens,
  formUtils,
  formatCOP,
  formatPhone,
  formatNIT,
  formatDate,
  formatMonth
} from './forms.js';
import {
  modalTokens,
  dialogHeaderTokens,
  drawerTokens,
  snackbarTokens,
  bannerTokens,
  overlayAnimationTokens,
  overlayUtils,
  overlayThemeComponents
} from './overlays.js';
import {
  avatarTokens,
  listTokens,
  dividerTokens,
  dataDisplayUtils
} from './dataDisplay.js';
import {
  loadingTokens,
  loadingUtils
} from './loading.js';
import {
  animationTokens,
  animationUtils
} from './animations.js';
import {
  alertTokens,
  chipTokens,
  badgeTokens,
  tooltipTokens,
  progressTokens,
  feedbackUtils,
  feedbackThemeComponents
} from './feedback.js';

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

  // Espaciado y Layout - Sistema de spacing establecido
  spacing: spacingTokens,
  componentSpacing: componentSpacingTokens,
  borderRadius: borderRadiusTokens,
  layoutSpacing: layoutSpacingTokens,

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

  // 🧾 Formularios - Sistema DS 3.0 COMPLETO (NUEVO)
  forms: {
    paper: formPaperTokens,
    section: formSectionTokens,
    layout: formLayoutTokens,
    field: formFieldTokens,
    feedback: formFeedbackTokens,
    action: formActionTokens,
    mask: formMaskTokens
  },

  // 🎭 Overlays - Sistema DS 3.0 COMPLETO (NUEVO)
  overlays: {
    modal: modalTokens,
    dialogHeader: dialogHeaderTokens,
    drawer: drawerTokens,
    snackbar: snackbarTokens,
    banner: bannerTokens,
    animation: overlayAnimationTokens
  },

  // 📊 Data Display - Sistema DS 3.0 COMPLETO (NUEVO)
  dataDisplay: {
    avatar: avatarTokens,
    list: listTokens,
    divider: dividerTokens
  },

  // ⚡ Loading States - Sistema DS 3.0 COMPLETO (NUEVO)
  loading: loadingTokens,

  // 🎬 Animations - Sistema DS 3.0 COMPLETO (NUEVO)
  animations: animationTokens,

  // 📢 Feedback - Sistema DS 3.0 COMPLETO (NUEVO)
  feedback: {
    alert: alertTokens,
    chip: chipTokens,
    badge: badgeTokens,
    tooltip: tooltipTokens,
    progress: progressTokens
  }
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
  
  // 🧾 Formularios - Utilidades DS 3.0 (NUEVO)
  forms: formUtils,
  
  // 🎭 Overlays - Utilidades DS 3.0 (NUEVO)
  overlays: overlayUtils,
  
  // 📊 Data Display - Utilidades DS 3.0 (NUEVO)
  dataDisplay: dataDisplayUtils,

  // ⚡ Loading States - Utilidades DS 3.0 (NUEVO)
  loading: loadingUtils,

  // 🎬 Animations - Utilidades DS 3.0 (NUEVO)
  animations: animationUtils,

  // 📢 Feedback - Utilidades DS 3.0 (NUEVO)
  feedback: feedbackUtils,

  // 🌙 Surface Helper - Utilidad para temas (NUEVO)
  surfaces: {
    /**
     * Obtiene el background de paper según el tema actual
     * @param {Object} theme - Tema de MUI
     * @returns {string} Color de background
     */
    getPaperBackground: (theme) => {
      const isDark = theme?.palette?.mode === 'dark';
      return isDark ? surfaceTokens.dark.background.paper : surfaceTokens.light.background.paper;
    },
    
    /**
     * Obtiene el background default según el tema actual
     * @param {Object} theme - Tema de MUI
     * @returns {string} Color de background
     */
    getDefaultBackground: (theme) => {
      const isDark = theme?.palette?.mode === 'dark';
      return isDark ? surfaceTokens.dark.background.default : surfaceTokens.light.background.default;
    },
    
    /**
     * Obtiene una superficie específica según el tema actual
     * @param {Object} theme - Tema de MUI
     * @param {number} level - Nivel de superficie (1-5)
     * @returns {string} Color de superficie
     */
    getSurface: (theme, level = 1) => {
      const isDark = theme?.palette?.mode === 'dark';
      return isDark ? surfaceTokens.dark.surface[level] : surfaceTokens.light.surface[level];
    }
  }
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

  // Espaciado y Layout
  spacingTokens,
  componentSpacingTokens,
  borderRadiusTokens,
  layoutSpacingTokens,
  spacingUtils,

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

  // 🧾 Formularios DS 3.0 (NUEVO)
  formPaperTokens,
  formSectionTokens,
  formLayoutTokens,
  formFieldTokens,
  formFeedbackTokens,
  formActionTokens,
  formMaskTokens,
  formUtils,
  
  // 🎭 Overlays DS 3.0 (NUEVO)
  modalTokens,
  dialogHeaderTokens,
  drawerTokens,
  snackbarTokens,
  bannerTokens,
  overlayAnimationTokens,
  overlayUtils,
  overlayThemeComponents,
  
  // Data Display - DS 3.0
  avatarTokens,
  listTokens,
  dividerTokens,
  dataDisplayUtils,
  
  // ⚡ Loading States - DS 3.0 (NUEVO)
  loadingTokens,
  loadingUtils,

  // 🎬 Animations - DS 3.0 (NUEVO)
  animationTokens,
  animationUtils,
  
  // 📢 Feedback - DS 3.0 (NUEVO)
  alertTokens,
  chipTokens,
  badgeTokens,
  tooltipTokens,
  progressTokens,
  feedbackUtils,
  feedbackThemeComponents,
  
  // Utilidades de formato
  formatCOP,
  formatPhone,
  formatNIT,
  formatDate,
  formatMonth
};

// Export por defecto
export default {
  designTokens,
  tokenUtils
};
