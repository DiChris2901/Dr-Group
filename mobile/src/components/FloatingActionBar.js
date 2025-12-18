import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Icon, Surface, Text, useTheme } from 'react-native-paper';

export default function FloatingActionBar({ 
  status = 'off', // off, working, break, lunch
  onPressStart,
  onPressBreak,
  onPressLunch,
  onPressEnd,
  onPressResume,
  breaksCount = 0
}) {
  const theme = useTheme();

  if (status === 'off' || status === 'finalizado' || !status) {
    return (
      <View style={styles.container}>
        <TouchableOpacity 
          style={[styles.largeButton, { backgroundColor: theme.colors.primary }]}
          onPress={onPressStart}
          activeOpacity={0.9}
        >
          <Icon source="hand-wave" size={24} color={theme.colors.onPrimary} />
          <Text variant="titleMedium" style={{ color: theme.colors.onPrimary, fontWeight: 'bold', marginLeft: 8 }}>
            Iniciar Jornada
          </Text>
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
          onPress={onPressResume}
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
          onPress={onPressBreak}
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
          onPress={onPressLunch}
        >
          <Icon source="food" size={24} color={theme.colors.onTertiaryContainer} />
          <Text variant="labelSmall" style={{ color: theme.colors.onTertiaryContainer, marginTop: 4, fontWeight: 'bold' }}>
            Almuerzo
          </Text>
        </TouchableOpacity>

        {/* End Button */}
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: theme.colors.errorContainer }]}
          onPress={onPressEnd}
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
