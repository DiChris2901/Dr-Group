import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Updates from 'expo-updates';
import { useTheme } from '../contexts/ThemeContext';

/**
 * 🔄 UpdateBanner - Banner persistente de actualizaciones OTA
 * 
 * Diseño sobrio empresarial siguiendo el sistema de diseño de la APK:
 * - BorderRadius: 16px (sobrio)
 * - Sombras: shadowOpacity 0.06 (sutil)
 * - Colores dinámicos del tema
 * - Animación suave de entrada
 * 
 * Comportamiento:
 * - Se muestra cuando hay actualización disponible para descargar
 * - Persistente hasta que el usuario actualice o descarte
 * - Muestra progreso de descarga si está en curso
 */
const UpdateBanner = () => {
  const { getPrimaryColor } = useTheme();
  const insets = useSafeAreaInsets();
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const slideAnim = useState(new Animated.Value(-100))[0];

  // ✅ Verificar actualizaciones al montar
  useEffect(() => {
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    // Solo en producción
    if (__DEV__) {
      console.log('⚠️ UpdateBanner: Modo desarrollo, no verifica actualizaciones');
      return;
    }

    try {
      const update = await Updates.checkForUpdateAsync();
      
      if (update.isAvailable) {
        console.log('🔄 Actualización OTA disponible');
        setUpdateAvailable(true);
        animateIn();
      } else {
        console.log('✅ App actualizada (OTA)');
      }
    } catch (error) {
      console.log('❌ Error verificando actualizaciones OTA:', error);
    }
  };

  const animateIn = () => {
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 40,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const animateOut = (callback) => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 200,
      useNativeDriver: true,
    }).start(callback);
  };

  const handleUpdate = async () => {
    try {
      setIsDownloading(true);
      console.log('⬇️ Descargando actualización OTA...');
      
      await Updates.fetchUpdateAsync();
      console.log('✅ Actualización descargada, reiniciando app...');
      
      // Reiniciar app para aplicar cambios
      await Updates.reloadAsync();
    } catch (error) {
      console.log('❌ Error descargando actualización:', error);
      setIsDownloading(false);
      
      // Volver a verificar en 30 segundos
      setTimeout(checkForUpdates, 30000);
    }
  };

  const handleDismiss = () => {
    animateOut(() => {
      setIsDismissed(true);
      setUpdateAvailable(false);
    });
  };

  // No mostrar si:
  // - No hay actualización disponible
  // - Usuario la descartó
  // - Está en modo desarrollo
  if (!updateAvailable || isDismissed || __DEV__) {
    return null;
  }

  const primaryColor = getPrimaryColor();

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          marginTop: insets.top, // Respetar área segura
          transform: [{ translateY: slideAnim }],
        }
      ]}
    >
      <View style={[styles.banner, { 
        borderLeftColor: primaryColor,
        backgroundColor: '#FFFFFF', // Fondo sólido blanco
      }]}>
        {/* Ícono */}
        <View style={[styles.iconContainer, { backgroundColor: primaryColor + '18' }]}>
          <MaterialCommunityIcons 
            name={isDownloading ? "download" : "update"} 
            size={24} 
            color={primaryColor} 
          />
        </View>

        {/* Contenido */}
        <View style={styles.content}>
          <Text style={styles.title}>
            {isDownloading ? 'Descargando actualización...' : 'Actualización disponible'}
          </Text>
          <Text style={styles.description}>
            {isDownloading 
              ? 'La app se reiniciará automáticamente' 
              : 'Nueva versión lista para descargar'}
          </Text>
        </View>

        {/* Acciones */}
        {!isDownloading && (
          <View style={styles.actions}>
            <Pressable 
              onPress={handleUpdate}
              style={[styles.button, { backgroundColor: primaryColor }]}
              android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
            >
              <Text style={styles.buttonText}>Actualizar</Text>
            </Pressable>

            <Pressable 
              onPress={handleDismiss}
              style={styles.dismissButton}
              android_ripple={{ color: primaryColor + '20' }}
            >
              <MaterialCommunityIcons 
                name="close" 
                size={20} 
                color="#666" 
              />
            </Pressable>
          </View>
        )}

        {isDownloading && (
          <View style={styles.loadingContainer}>
            <MaterialCommunityIcons 
              name="loading" 
              size={24} 
              color={primaryColor} 
            />
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 10,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16, // Sobrio
    borderLeftWidth: 4,
    // Sombra sobria
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    fontFamily: 'Roboto-Flex',
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  description: {
    fontFamily: 'Roboto-Flex',
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  buttonText: {
    fontFamily: 'Roboto-Flex',
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dismissButton: {
    padding: 8,
    borderRadius: 8,
  },
  loadingContainer: {
    paddingHorizontal: 16,
  },
});

export default UpdateBanner;
