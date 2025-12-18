import React from 'react';
import { Text, StyleSheet } from 'react-native';

/**
 * OverlineText - Typography overline con Material 3 Expressive Design
 * 
 * Material 3 Mejoras:
 * - Font size: 13px (Material 3 Label Large)
 * - Letter-spacing: 1.2 (más expresivo)
 * - Font weight: 700 (más bold)
 * - Margin bottom: 12px (spacing generoso)
 * - Color dinámico del tema (preservado 100%)
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
    fontFamily: 'Roboto-Flex', // 🎨 Material 3 Typography
    fontSize: 13, // 🎨 Material 3 Label Large (↑ de 12px)
    fontWeight: '700', // 🎨 Material 3 bold emphasis (↑ de 600)
    letterSpacing: 1.2, // 🎨 Material 3 expressive spacing (↑ de 0.8)
    textTransform: 'uppercase',
    marginBottom: 12, // 🎨 Material 3 generous spacing (↑ de 8px)
  },
});
