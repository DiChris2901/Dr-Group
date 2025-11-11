import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * DetailRow - Componente para mostrar información siguiendo MODAL_DESIGN_SYSTEM
 * 
 * Características:
 * - Display flex con gap
 * - Label en uppercase con letterSpacing
 * - Background con alpha(theme, 0.04)
 * - Borde sutil con alpha(theme, 0.2)
 * - Padding: 12px (p: 1.5)
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
          <Text style={[styles.icon, { color: highlight ? highlightColor : iconColor }]}>
            {icon}
          </Text>
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
    gap: 16, // ✅ gap: 2 (16px)
    padding: 12, // ✅ p: 1.5 (12px)
    borderRadius: 8, // ✅ borderRadius: 1 (8px)
    borderWidth: 1,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 11, // ✅ 0.7rem -> ~11px
    fontWeight: '600',
    color: '#64748b', // text.secondary
    textTransform: 'uppercase',
    letterSpacing: 0.8, // ✅ letterSpacing: 0.5
    marginBottom: 4,
  },
  value: {
    fontSize: 14, // ✅ 0.875rem -> ~14px
    fontWeight: '500',
    color: '#1e293b', // text.primary
  },
});
