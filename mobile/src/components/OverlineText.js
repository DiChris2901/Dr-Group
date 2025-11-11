import React from 'react';
import { Text, StyleSheet } from 'react-native';

/**
 * OverlineText - Typography overline siguiendo DISENO_SOBRIO_NOTAS
 * 
 * Características:
 * - fontWeight: 600
 * - fontSize: 0.75rem (~12px)
 * - letterSpacing: 0.8
 * - textTransform: uppercase
 * - Color del tema (primary/secondary)
 */
export default function OverlineText({ 
  children, 
  style, 
  color = '#667eea', // Color del tema por defecto
  variant = 'primary' // 'primary' | 'secondary'
}) {
  const variantColor = variant === 'primary' ? color : color;
  
  return (
    <Text style={[
      styles.overline, 
      { color: variantColor },
      style
    ]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  overline: {
    fontSize: 12, // ✅ 0.75rem -> ~12px
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
});
