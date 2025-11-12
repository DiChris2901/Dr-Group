import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

/**
 * EmptyState - Estado vacío elegante con Material 3 Expressive Design
 * 
 * @param {string} icon - Nombre del ícono de MaterialIcons
 * @param {string} message - Mensaje a mostrar
 * @param {string} iconColor - Color del ícono (opcional)
 */
export default function EmptyState({ icon, message, iconColor = '#ccc' }) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <MaterialIcons name={icon || 'inbox'} size={64} color={iconColor} />
      </View>
      <Text style={styles.message}>{message || 'No hay datos para mostrar'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f5f5f5'
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 28, // 🎨 Material 3 Extra Large
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    // Material 3 Elevation Level 1
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  message: {
    fontSize: 16, // 🎨 Material 3 Body Large
    fontWeight: '500',
    color: '#64748b', // text.secondary
    textAlign: 'center',
    lineHeight: 24, // 🎨 Material 3 line-height
    letterSpacing: 0.2,
    maxWidth: 280
  }
});
