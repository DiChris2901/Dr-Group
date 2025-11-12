import React, { useContext } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { ThemeContext } from '../../contexts/ThemeContext';

/**
 * LoadingState - Estado de carga elegante con Material 3 Expressive Design
 * 
 * @param {string} message - Mensaje de carga (opcional)
 */
export default function LoadingState({ message }) {
  const { getPrimaryColor } = useContext(ThemeContext);

  return (
    <View style={styles.container}>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={getPrimaryColor()} />
      </View>
      {message && <Text style={styles.message}>{message}</Text>}
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
  loadingContainer: {
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
    fontSize: 15, // 🎨 Material 3 Body Medium
    fontWeight: '500',
    color: '#64748b', // text.secondary
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: 0.2,
    maxWidth: 280
  }
});
