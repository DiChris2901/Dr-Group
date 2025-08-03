/**
 * CleanCountUp.jsx - Contador Animado Limpio v3.0
 * DR Group Dashboard - Clean Design System
 * 
 * Componente de contador animado que sigue las reglas del Clean Design System:
 * - Animaciones sutiles: máximo 0.3s
 * - Soporte para formato colombiano
 * - Integración con formatUtils
 * - FontWeight máximo: 600
 */

import React, { useRef, useEffect } from 'react';
import { useTheme, Typography, Box } from '@mui/material';
import { motion, animate, useInView, useTransform, useMotionValue } from 'framer-motion';
import { 
  fNumber, 
  fCurrency, 
  fShortenNumber, 
  fPercent, 
  fPercentInteger,
  getNumberSuffix,
  isValidNumber 
} from '../../utils/formatUtils';

// ===============================================
// CONFIGURACIÓN CLEAN DESIGN
// ===============================================
const cleanCountConfig = {
  animations: {
    duration: 2, // Máximo permitido para contadores
    ease: [0.4, 0, 0.2, 1],
    spring: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  },
  intersection: {
    threshold: 0.3,
    rootMargin: '0px 0px -50px 0px'
  }
};

// ===============================================
// HOOK PARA DETECTAR SI ES DECIMAL
// ===============================================
function isFloat(value) {
  return value % 1 !== 0;
}

// ===============================================
// COMPONENTE PRINCIPAL
// ===============================================
export const CleanCountUp = ({
  to,
  from = 0,
  duration = cleanCountConfig.animations.duration,
  format = 'number', // 'number', 'currency', 'percent', 'percentInt', 'short'
  decimals = 0,
  prefix = '',
  suffix = '',
  component = 'span',
  variant = 'h4',
  color = 'text.primary',
  fontWeight = 600,
  once = true,
  amount = 0.5,
  enableAnimation = true,
  showUnit = false,
  unitProps = {},
  sx = {},
  ...other
}) => {
  const theme = useTheme();
  const countRef = useRef(null);

  // Validaciones
  if (!isValidNumber(to)) {
    console.warn('CleanCountUp: "to" prop must be a valid number');
    return (
      <Typography
        component={component}
        variant={variant}
        color={color}
        sx={[{ fontWeight }, ...(Array.isArray(sx) ? sx : [sx])]}
        {...other}
      >
        {format === 'currency' ? '$0' : '0'}
      </Typography>
    );
  }

  // Preparar valores para la animación
  const numericTo = Number(to);
  const numericFrom = Number(from);
  
  // Detectar si necesitamos abreviación
  const shouldAbbreviate = format === 'short' || (Math.abs(numericTo) >= 1000000 && format !== 'currency');
  const unit = showUnit ? getNumberSuffix(numericTo) : '';

  // Motion values
  const startCount = useMotionValue(numericFrom);
  const endCount = shouldAbbreviate ? numericTo : numericTo;

  // Detectar cuando está en viewport
  const inView = useInView(countRef, { 
    once, 
    amount,
    margin: cleanCountConfig.intersection.rootMargin
  });

  // Transform para mostrar el valor actual
  const rounded = useTransform(startCount, (latest) => {
    const shouldShowDecimals = isFloat(latest) || decimals > 0;
    const precision = shouldShowDecimals ? decimals : 0;
    return latest.toFixed(precision);
  });

  // Formatear el valor final
  const formatValue = (value) => {
    const num = Number(value);
    
    switch (format) {
      case 'currency':
        return fCurrency(num);
      case 'percent':
        return fPercent(num);
      case 'percentInt':
        return fPercentInteger(num);
      case 'short':
        return fShortenNumber(num);
      default:
        return fNumber(num);
    }
  };

  // Efecto de animación
  useEffect(() => {
    if (inView && enableAnimation) {
      animate(startCount, endCount, { 
        duration,
        ease: cleanCountConfig.animations.ease
      });
    } else if (inView && !enableAnimation) {
      startCount.set(endCount);
    }
  }, [duration, endCount, inView, startCount, enableAnimation]);

  return (
    <Box
      ref={countRef}
      component={motion.div}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
      transition={{
        duration: 0.3, // Máximo permitido por clean design
        ease: cleanCountConfig.animations.ease,
        delay: enableAnimation ? 0.1 : 0
      }}
      sx={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 0.5,
        ...sx
      }}
    >
      {/* Prefijo */}
      {prefix && (
        <Typography
          component="span"
          variant={variant}
          color={color}
          sx={{ 
            fontWeight: Math.min(fontWeight, 600), // Límite clean design
            opacity: 0.8
          }}
        >
          {prefix}
        </Typography>
      )}

      {/* Número principal */}
      <Typography
        component={component}
        variant={variant}
        color={color}
        sx={{ 
          fontWeight: Math.min(fontWeight, 600), // Límite clean design
          fontFeatureSettings: '"tnum"', // Números tabulares
          fontVariantNumeric: 'tabular-nums'
        }}
        {...other}
      >
        <motion.span>
          {enableAnimation ? (
            // Valor animado
            <motion.span>{rounded.get() ? formatValue(rounded.get()) : formatValue(from)}</motion.span>
          ) : (
            // Valor estático
            formatValue(to)
          )}
        </motion.span>
      </Typography>

      {/* Unidad/Sufijo */}
      {(suffix || unit) && (
        <Typography
          component="span"
          variant={unitProps.variant || 'body2'}
          color={unitProps.color || color}
          sx={{ 
            fontWeight: Math.min(unitProps.fontWeight || 500, 600),
            opacity: unitProps.opacity || 0.8,
            ml: 0.5,
            ...unitProps.sx
          }}
        >
          {suffix || unit}
        </Typography>
      )}
    </Box>
  );
};

// ===============================================
// VARIANTES ESPECIALIZADAS
// ===============================================

/**
 * Contador de moneda colombiana
 */
export const CleanCurrencyCount = (props) => (
  <CleanCountUp
    format="currency"
    variant="h5"
    fontWeight={600}
    color="primary.main"
    {...props}
  />
);

/**
 * Contador de porcentaje
 */
export const CleanPercentCount = (props) => (
  <CleanCountUp
    format="percentInt"
    variant="h6"
    fontWeight={500}
    suffix="%"
    {...props}
  />
);

/**
 * Contador abreviado para números grandes
 */
export const CleanShortCount = (props) => (
  <CleanCountUp
    format="short"
    variant="h5"
    fontWeight={600}
    showUnit={true}
    {...props}
  />
);

/**
 * Contador simple para estadísticas
 */
export const CleanStatCount = (props) => (
  <CleanCountUp
    format="number"
    variant="h4"
    fontWeight={600}
    color="text.primary"
    {...props}
  />
);

// ===============================================
// COMPONENTE PARA MÉTRICAS DEL DASHBOARD
// ===============================================
export const CleanDashboardMetric = ({
  title,
  value,
  format = 'number',
  subtitle,
  icon: Icon,
  color = 'primary',
  trend,
  trendDirection = 'up', // up, down, neutral
  sx = {},
  ...countProps
}) => {
  const theme = useTheme();
  
  const getTrendColor = () => {
    switch (trendDirection) {
      case 'up':
        return theme.palette.success.main;
      case 'down':
        return theme.palette.error.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  const colorValue = typeof color === 'string' && theme.palette[color] 
    ? theme.palette[color].main 
    : color;

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        ease: cleanCountConfig.animations.ease
      }}
      sx={{
        textAlign: 'center',
        p: 2,
        ...sx
      }}
    >
      {/* Icono */}
      {Icon && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            duration: 0.3,
            ease: cleanCountConfig.animations.ease,
            delay: 0.1
          }}
        >
          <Box
            sx={{
              mb: 2,
              display: 'inline-flex',
              p: 1.5,
              borderRadius: 2,
              backgroundColor: theme.palette.mode === 'dark' 
                ? `${colorValue}20` 
                : `${colorValue}15`,
              color: colorValue
            }}
          >
            <Icon sx={{ fontSize: 24 }} />
          </Box>
        </motion.div>
      )}

      {/* Valor principal */}
      <CleanCountUp
        to={value}
        format={format}
        variant="h3"
        fontWeight={600}
        color={colorValue}
        sx={{ mb: 1 }}
        {...countProps}
      />

      {/* Título */}
      {title && (
        <Typography
          variant="body1"
          fontWeight={500}
          color="text.primary"
          sx={{ mb: subtitle || trend ? 1 : 0 }}
        >
          {title}
        </Typography>
      )}

      {/* Subtítulo */}
      {subtitle && (
        <Typography 
          variant="caption" 
          color="text.secondary"
          sx={{ display: 'block', mb: trend ? 1 : 0 }}
        >
          {subtitle}
        </Typography>
      )}

      {/* Tendencia */}
      {trend && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.3,
            ease: cleanCountConfig.animations.ease,
            delay: 0.3
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: getTrendColor(),
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5
            }}
          >
            <span>
              {trendDirection === 'up' ? '↗' : trendDirection === 'down' ? '↘' : '→'}
            </span>
            {trend}
          </Typography>
        </motion.div>
      )}
    </Box>
  );
};
