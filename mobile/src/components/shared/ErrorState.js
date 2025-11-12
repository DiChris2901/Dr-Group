import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

/**
 * ErrorState - Estado de error elegante con Material 3 Expressive Design
 * 
 * @param {string} message - Mensaje de error
 * @param {function} onRetry - Callback para reintentar
 * @param {string} errorColor - Color del error (opcional)
 */
export default function ErrorState({ message, onRetry, errorColor = '#f44336' }) {
  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: errorColor + '14' }]}>
        <MaterialIcons name="error-outline" size={64} color={errorColor} />
      </View>
      <Text style={styles.title}>Algo salió mal</Text>
      <Text style={styles.message}>{message || 'Error al cargar los datos'}</Text>
      {onRetry && (
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: errorColor }]} 
          onPress={onRetry}
          activeOpacity={0.8}
        >
          <MaterialIcons name="refresh" size={20} color="#fff" />
          <Text style={styles.buttonText}>Reintentar</Text>
        </TouchableOpacity>
      )}
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
  title: {
    fontSize: 20, // 🎨 Material 3 Title Medium
    fontWeight: '600',
    color: '#1e293b', // text.primary
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  message: {
    fontSize: 15, // 🎨 Material 3 Body Medium
    fontWeight: '400',
    color: '#64748b', // text.secondary
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: 0.2,
    marginBottom: 24,
    maxWidth: 280
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28, // 🎨 Material 3 Extra Large
    // Material 3 Elevation Level 2
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15, // 🎨 Material 3 Label Large
    fontWeight: '600',
    letterSpacing: 0.5,
  }
});
