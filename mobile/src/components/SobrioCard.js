import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';

/**
 * SobrioCard - Card component con Material 3 Expressive Design
 * 
 * Material 3 Características:
 * - borderRadius: 28 (Extra Large - Material 3)
 * - Sombras definidas: Elevation Level 1 (0 4px 16px rgba(0,0,0,0.12))
 * - Bordes con alpha(theme, 0.15)
 * - Padding generoso: 24px (Material 3 spacing)
 * - Colores dinámicos preservados desde ThemeContext
 */
export default function SobrioCard({ 
  children, 
  style, 
  variant = 'primary', // 'primary' | 'secondary'
  borderColor = '#667eea', // Color del tema (dinámico desde ThemeContext)
  onPress
}) {
  const variantStyles = variant === 'primary' 
    ? styles.cardPrimary 
    : styles.cardSecondary;

  const cardStyle = [styles.card, variantStyles, { borderColor: borderColor + '26' }, style];

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} style={cardStyle} activeOpacity={0.7}>
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyle}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 28, // 🎨 Material 3 Extra Large (antes 16)
    padding: 24, // ✅ Material 3 spacing (mantiene 24px)
    borderWidth: 1,
    // 🎨 Material 3 Elevation Level 1 (más definida)
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4, // ↑ Elevación mejorada (antes 2)
    },
    shadowOpacity: 0.12, // ↑ Más definida (antes 0.06)
    shadowRadius: 16, // ↑ Radio expandido (antes 8)
    elevation: 4, // ↑ Android elevation (antes 2)
  },
  cardPrimary: {
    // Borde con alpha(primary, 0.15) - Material 3 (antes 0.2)
    // Se aplica dinámicamente desde borderColor prop
  },
  cardSecondary: {
    padding: 28, // ✅ Padding secundario (mantiene diferencia)
  },
});
