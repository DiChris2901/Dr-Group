import React from 'react';
import { View, StyleSheet } from 'react-native';

/**
 * SobrioCard - Card component siguiendo DISENO_SOBRIO_NOTAS
 * 
 * Características:
 * - borderRadius: 16 (borderRadius: 2 en diseño web)
 * - Sombras sutiles: Nivel 1 (0 2px 8px rgba(0,0,0,0.06))
 * - Bordes con alpha(theme, 0.2)
 * - Padding consistente: 24px (p: 3)
 */
export default function SobrioCard({ 
  children, 
  style, 
  variant = 'primary', // 'primary' | 'secondary'
  borderColor = '#667eea' // Color del tema
}) {
  const variantStyles = variant === 'primary' 
    ? styles.cardPrimary 
    : styles.cardSecondary;

  return (
    <View style={[styles.card, variantStyles, { borderColor: borderColor + '33' }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16, // ✅ borderRadius: 2 (16px)
    padding: 24, // ✅ p: 3 (24px)
    borderWidth: 1,
    // ✅ Sombras sobrias - Nivel 1
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardPrimary: {
    // Borde con alpha(primary, 0.2) - se aplica dinámicamente
  },
  cardSecondary: {
    padding: 28, // ✅ p: 3.5 (28px) para cards laterales
  },
});
