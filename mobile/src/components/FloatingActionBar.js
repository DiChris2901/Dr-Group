import React, { useState, useRef } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Icon, Surface, Text, useTheme as usePaperTheme } from 'react-native-paper';
import { useTheme as useAppTheme } from '../contexts/ThemeContext';

export default function FloatingActionBar({ 
  status = 'off', // off, working, break, lunch
  onPressStart,
  onPressBreak,
  onPressLunch,
  onPressEnd,
  onPressResume,
  breaksCount = 0,
  lunchUsed = false,
  isLoading = false // 🔒 Estado de loading para deshabilitar botón
}) {
  const theme = usePaperTheme();
  const { triggerHaptic } = useAppTheme();
  const [actionLoading, setActionLoading] = useState(false); // 🔒 Loading local para acciones
  const actionLockRef = useRef(false); // 🔒 Mutex rápido

  const handlePress = (action, type = 'light') => {
    triggerHaptic(type);
    action && action();
  };

  // 🔒 Wrapper seguro para acciones con protección anti doble-tap
  const safeAction = async (action, type = 'light') => {
    if (actionLockRef.current || actionLoading) return;
    actionLockRef.current = true;
    setActionLoading(true);
    try {
      triggerHaptic(type);
      await action?.();
    } catch (e) {
      // Error manejado en AuthContext
    } finally {
      setActionLoading(false);
      // Mantener lock breve para evitar rebotes
      setTimeout(() => { actionLockRef.current = false; }, 500);
    }
  };

  if (status === 'off' || status === 'finalizado' || !status) {
    return (
      <View style={styles.container}>
        <TouchableOpacity 
          style={[
            styles.largeButton, 
            { 
              backgroundColor: isLoading ? theme.colors.surfaceDisabled : theme.colors.primary,
              opacity: isLoading ? 0.6 : 1
            }
          ]}
          onPress={() => !isLoading && handlePress(onPressStart, 'medium')} // 🔒 Prevenir acción si está loading
          activeOpacity={isLoading ? 1 : 0.9} // No mostrar efecto press si está disabled
          disabled={isLoading} // 🔒 Deshabilitar botón durante procesamiento
        >
          {isLoading ? (
            <>
              <Icon source="loading" size={24} color={theme.colors.onSurfaceVariant} />
              <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant, fontWeight: 'bold', marginLeft: 8 }}>
                Iniciando jornada...
              </Text>
            </>
          ) : (
            <>
              <Icon source="hand-wave" size={24} color={theme.colors.onPrimary} />
              <Text variant="titleMedium" style={{ color: theme.colors.onPrimary, fontWeight: 'bold', marginLeft: 8 }}>
                Iniciar Jornada
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  if (status === 'break' || status === 'almuerzo') {
    const isLunch = status === 'almuerzo';
    return (
      <View style={styles.container}>
        <TouchableOpacity 
          style={[styles.largeButton, { 
            backgroundColor: actionLoading ? theme.colors.surfaceDisabled : theme.colors.tertiary,
            opacity: actionLoading ? 0.6 : 1
          }]}
          onPress={() => safeAction(onPressResume, 'medium')}
          activeOpacity={actionLoading ? 1 : 0.9}
          disabled={actionLoading}
        >
          <Icon source={actionLoading ? "loading" : "play"} size={24} color={actionLoading ? theme.colors.onSurfaceVariant : theme.colors.onTertiary} />
          <Text variant="titleMedium" style={{ color: actionLoading ? theme.colors.onSurfaceVariant : theme.colors.onTertiary, fontWeight: 'bold', marginLeft: 8 }}>
            {actionLoading ? 'Procesando...' : isLunch ? 'Volver del Almuerzo' : 'Volver del Break'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Status: working
  return (
    <View style={styles.container}>
      <Surface style={[styles.bar, { backgroundColor: theme.colors.elevation.level3 }]} elevation={4}>
        
        {/* Break Button */}
        <TouchableOpacity 
          style={[styles.actionButton, { 
            backgroundColor: theme.colors.secondaryContainer,
            opacity: (breaksCount >= 2 || actionLoading) ? 0.5 : 1
          }]}
          onPress={() => safeAction(onPressBreak, 'light')}
          disabled={breaksCount >= 2 || actionLoading}
        >
          <Icon 
            source={breaksCount >= 2 ? "coffee-off" : "coffee"} 
            size={24} 
            color={breaksCount >= 2 ? theme.colors.onSurfaceDisabled : theme.colors.onSecondaryContainer} 
          />
          <Text 
            variant="labelSmall" 
            style={{ 
              color: breaksCount >= 2 ? theme.colors.onSurfaceDisabled : theme.colors.onSecondaryContainer, 
              marginTop: 4,
              fontWeight: 'bold'
            }}
          >
            Break
          </Text>
        </TouchableOpacity>

        {/* Lunch Button */}
        <TouchableOpacity 
          style={[styles.actionButton, { 
            backgroundColor: theme.colors.tertiaryContainer,
            opacity: (lunchUsed || actionLoading) ? 0.5 : 1
          }]}
          onPress={() => safeAction(onPressLunch, 'light')}
          disabled={lunchUsed || actionLoading}
        >
          <Icon source={lunchUsed ? "food-off" : "food"} size={24} color={lunchUsed ? theme.colors.onSurfaceDisabled : theme.colors.onTertiaryContainer} />
          <Text variant="labelSmall" style={{ color: lunchUsed ? theme.colors.onSurfaceDisabled : theme.colors.onTertiaryContainer, marginTop: 4, fontWeight: 'bold' }}>
            Almuerzo
          </Text>
        </TouchableOpacity>

        {/* End Button */}
        <TouchableOpacity 
          style={[styles.actionButton, { 
            backgroundColor: theme.colors.errorContainer,
            opacity: actionLoading ? 0.5 : 1
          }]}
          onPress={() => safeAction(onPressEnd, 'medium')}
          disabled={actionLoading}
        >
          <Icon source="home-export-outline" size={24} color={theme.colors.onErrorContainer} />
          <Text variant="labelSmall" style={{ color: theme.colors.onErrorContainer, marginTop: 4, fontWeight: 'bold' }}>
            Finalizar
          </Text>
        </TouchableOpacity>

      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 100, // ✅ Asegurar que esté por encima del contenido
  },
  largeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 64,
    borderRadius: 32,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    borderRadius: 32,
    width: '100%',
    height: 80,
  },
  actionButton: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    marginHorizontal: 4,
  }
});
