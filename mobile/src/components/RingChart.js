import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Text, useTheme } from 'react-native-paper';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function RingChart({ 
  progress = 0, // 0 to 1
  size = 280, 
  strokeWidth = 20, 
  color,
  label = "00:00:00",
  subLabel = "Tiempo Trabajado"
}) {
  const theme = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  // Color fallback
  const activeColor = color || theme.colors.primary;
  const inactiveColor = theme.colors.surfaceVariant;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: progress,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [progress]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          {/* Background Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={inactiveColor}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress Circle */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={activeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </G>
      </Svg>
      
      {/* Center Text */}
      <View style={styles.textContainer}>
        <Text variant="displayMedium" style={[styles.timeText, { color: theme.colors.onSurface }]}>
          {label}
        </Text>
        <Text variant="labelLarge" style={{ color: theme.colors.secondary }}>
          {subLabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  svg: {
    position: 'absolute',
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'], // Monospaced numbers for timer
  }
});
