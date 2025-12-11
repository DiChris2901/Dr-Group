import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * DetailRow - Componente para mostrar información con Material 3 Expressive Design
 * 
 * Material 3 Mejoras:
 * - Spacing generoso: 16px padding (antes 12px)
 * - Icon sizing estándar: 24px (Material 3)
 * - Typography scale: Material 3 standards
 * - Border radius: 12px (Medium)
 * - Gap entre elementos: 16px consistente
 */
export default function DetailRow({ 
  icon, 
  label, 
  value, 
  highlight = false,
  iconColor = '#667eea',
  highlightColor = '#4ade80'
}) {
  const bgColor = highlight 
    ? highlightColor + '14' // alpha 0.08
    : iconColor + '0A'; // alpha 0.04
    
  const borderColor = highlight
    ? highlightColor + '4D' // alpha 0.3
    : iconColor + '33'; // alpha 0.2

  return (
    <View style={[
      styles.container,
      { backgroundColor: bgColor, borderColor: borderColor }
    ]}>
      {icon && (
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={24} color={highlight ? highlightColor : iconColor} />
        </View>
      )}
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        {typeof value === 'string' || typeof value === 'number' ? (
          <Text style={[
            styles.value,
            highlight && { color: highlightColor, fontWeight: '600' }
          ]}>
            {value}
          </Text>
        ) : (
          value
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16, // 🎨 Material 3 spacing (mantiene 16px, ya era correcto)
    padding: 16, // 🎨 Material 3 generous spacing (↑ de 12px)
    borderRadius: 12, // 🎨 Material 3 Medium (↑ de 8px)
    borderWidth: 1,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 24, // 🎨 Material 3 icon grid (nuevo)
    height: 24, // 🎨 Material 3 icon grid (nuevo)
  },
  icon: {
    fontSize: 24, // 🎨 Material 3 standard icon size (↑ de 20px)
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 12, // 🎨 Material 3 label size (↑ de 11px)
    fontWeight: '600',
    color: '#64748b', // text.secondary
    textTransform: 'uppercase',
    letterSpacing: 1.0, // 🎨 Material 3 letter-spacing (↑ de 0.8)
    marginBottom: 6, // 🎨 Material 3 spacing (↑ de 4px)
  },
  value: {
    fontSize: 15, // 🎨 Material 3 body size (↑ de 14px)
    fontWeight: '500',
    color: '#1e293b', // text.primary
    lineHeight: 22, // 🎨 Material 3 line-height (nuevo)
  },
});
