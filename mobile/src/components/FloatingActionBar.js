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
  isLoading = false // 🔒 Estado de loading para deshabilitar botón
}) {
  const theme = usePaperTheme();
  const { triggerHaptic } = useAppTheme();

  const handlePress = (action, type = 'light') => {
    triggerHaptic(type);
    action && action();
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
          style={[styles.largeButton, { backgroundColor: theme.colors.tertiary }]}
          onPress={() => handlePress(onPressResume, 'medium')}
          activeOpacity={0.9}
        >
          <Icon source="play" size={24} color={theme.colors.onTertiary} />
          <Text variant="titleMedium" style={{ color: theme.colors.onTertiary, fontWeight: 'bold', marginLeft: 8 }}>
            {isLunch ? 'Volver del Almuerzo' : 'Volver del Break'}
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
          style={[styles.actionButton, { backgroundColor: theme.colors.secondaryContainer }]}
          onPress={() => handlePress(onPressBreak, 'light')}
          disabled={breaksCount >= 2}
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
          style={[styles.actionButton, { backgroundColor: theme.colors.tertiaryContainer }]}
          onPress={() => handlePress(onPressLunch, 'light')}
        >
          <Icon source="food" size={24} color={theme.colors.onTertiaryContainer} />
          <Text variant="labelSmall" style={{ color: theme.colors.onTertiaryContainer, marginTop: 4, fontWeight: 'bold' }}>
            Almuerzo
          </Text>
        </TouchableOpacity>

        {/* End Button */}
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: theme.colors.errorContainer }]}
          onPress={() => handlePress(onPressEnd, 'medium')}
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
