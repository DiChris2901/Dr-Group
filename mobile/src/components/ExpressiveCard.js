import React from 'react';
import { View, StyleSheet, Pressable, Animated } from 'react-native';
import { useTheme } from 'react-native-paper';
import materialTheme from '../../material-theme.json';

export default function ExpressiveCard({ 
  children, 
  style, 
  onPress, 
  onLongPress,
  variant = 'filled' // 'filled' | 'elevated' | 'outlined'
}) {
  const theme = useTheme();
  const isDark = theme.dark;
  const scheme = isDark ? materialTheme.schemes.dark : materialTheme.schemes.light;

  // Surface Colors Mapping
  const getBackgroundColor = () => {
    switch (variant) {
      case 'elevated': return scheme.surfaceContainerLow; // Lighter for elevation
      case 'outlined': return scheme.surface;
      case 'filled': 
      default: return scheme.surfaceContainerLow; // Standard Expressive Card
    }
  };

  const backgroundColor = getBackgroundColor();
  const borderColor = theme.colors.outlineVariant;

  // Animation for press state
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      tension: 100,
      friction: 10
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 10
    }).start();
  };

  const Container = onPress ? Pressable : View;

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
      <Container
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={onPress ? handlePressIn : undefined}
        onPressOut={onPress ? handlePressOut : undefined}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: pressed ? scheme.surfaceContainer : backgroundColor, // Visual feedback
            borderRadius: 24, // Organic Shape Rule
            borderWidth: variant === 'outlined' ? 1 : 0,
            borderColor: borderColor,
          },
          style
        ]}
        android_ripple={onPress ? { 
          color: scheme.onSurface + '1F', // 12% opacity
          borderless: false 
        } : null}
      >
        {children}
      </Container>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20, // Expressive Spacing Rule
    overflow: 'hidden',
    elevation: 0, // Tonal Elevation Rule
  }
});
