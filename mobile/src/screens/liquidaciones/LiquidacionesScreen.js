import React, { useMemo, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text as PaperText, IconButton, useTheme, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';

import { useLiquidaciones, formatPeriodo, getPeriodoActual } from '../../hooks/useLiquidaciones';
import { LoadingState, ExpressiveCard } from '../../components';
import materialTheme from '../../../material-theme.json';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';

export default function LiquidacionesScreen() {
  const navigation = useNavigation();
  const theme = useTheme();
  const { isDarkMode } = useAppTheme();

  const surfaceColors = useMemo(() => {
    const scheme = isDarkMode ? materialTheme.schemes.dark : materialTheme.schemes.light;
    return {
      background: scheme.background,
      surface: scheme.surface,
      surfaceContainerLow: scheme.surfaceContainerLow,
      surfaceContainer: scheme.surfaceContainer,
      surfaceContainerHigh: scheme.surfaceContainerHigh,
      surfaceContainerHighest: scheme.surfaceContainerHighest,
      onSurface: scheme.onSurface,
      onSurfaceVariant: scheme.onSurfaceVariant,
      primary: scheme.primary,
      onPrimary: scheme.onPrimary,
      primaryContainer: scheme.primaryContainer,
      onPrimaryContainer: scheme.onPrimaryContainer,
      secondary: scheme.secondary,
      secondaryContainer: scheme.secondaryContainer,
      onSecondaryContainer: scheme.onSecondaryContainer,
      tertiary: scheme.tertiary,
      tertiaryContainer: scheme.tertiaryContainer,
      onTertiaryContainer: scheme.onTertiaryContainer,
      error: scheme.error,
      errorContainer: scheme.errorContainer,
      onErrorContainer: scheme.onErrorContainer,
      outline: scheme.outline,
      outlineVariant: scheme.outlineVariant,
    };
  }, [isDarkMode]);

  const { empresas, empresaSeleccionada, loading, error, hasPermission } = useLiquidaciones();

  const periodoActual = useMemo(() => getPeriodoActual(), []);

  const handleNavigate = useCallback((screen, params = {}) => {
    Haptics.selectionAsync();
    navigation.navigate(screen, { empresas, ...params });
  }, [navigation, empresas]);

  // Sin permiso
  if (!hasPermission) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: surfaceColors.surface }]}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.goBack();
              }}
              iconColor={surfaceColors.onSurface}
            />
          </View>
          <View style={{ paddingHorizontal: 4 }}>
            <PaperText style={[styles.title, { color: surfaceColors.onSurface }]}>
              Liquidaciones
            </PaperText>
          </View>
        </View>
        <View style={styles.deniedContainer}>
          <MaterialCommunityIcons name="lock-outline" size={64} color={surfaceColors.outline} />
          <PaperText variant="titleMedium" style={{ color: surfaceColors.onSurface, marginTop: 16, fontWeight: '600' }}>
            Acceso Restringido
          </PaperText>
          <PaperText variant="bodyMedium" style={{ color: surfaceColors.onSurfaceVariant, marginTop: 8, textAlign: 'center', paddingHorizontal: 32 }}>
            No tienes permiso para ver liquidaciones. Contacta a tu administrador.
          </PaperText>
        </View>
      </SafeAreaView>
    );
  }

  // Loading
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: surfaceColors.surface }]}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.goBack();
              }}
              iconColor={surfaceColors.onSurface}
            />
          </View>
          <View style={{ paddingHorizontal: 4 }}>
            <PaperText style={[styles.title, { color: surfaceColors.onSurface }]}>
              Liquidaciones
            </PaperText>
            <PaperText style={{ fontSize: 16, color: surfaceColors.onSurfaceVariant, marginTop: 4 }}>
              Centro de Información
            </PaperText>
          </View>
        </View>
        <LoadingState message="Cargando liquidaciones..." />
      </SafeAreaView>
    );
  }

  // Navegación cards
  const navigationCards = [
    {
      key: 'historial',
      screen: 'LiquidacionesHistorial',
      icon: 'file-document-multiple-outline',
      title: 'Historial',
      subtitle: 'Liquidaciones por sala y periodo',
      color: surfaceColors.primaryContainer,
      textColor: surfaceColors.onPrimaryContainer,
      iconColor: surfaceColors.primary,
    },
    {
      key: 'estadisticas',
      screen: 'LiquidacionesEstadisticas',
      icon: 'chart-timeline-variant-shimmer',
      title: 'Estadísticas',
      subtitle: 'Tendencias y KPIs de producción',
      color: surfaceColors.secondaryContainer,
      textColor: surfaceColors.onSecondaryContainer,
      iconColor: surfaceColors.secondary,
    },
    {
      key: 'maquinas',
      screen: 'MaquinasEnCero',
      icon: 'slot-machine-outline',
      title: 'Máquinas en Cero',
      subtitle: 'Equipos sin producción activa',
      color: surfaceColors.errorContainer,
      textColor: surfaceColors.onErrorContainer,
      iconColor: surfaceColors.error,
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: surfaceColors.surface }]}>
      {/* Header Material You Expressive */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.goBack();
            }}
            iconColor={surfaceColors.onSurface}
          />
          <IconButton
            icon="calculator-variant"
            mode="contained-tonal"
            size={20}
            iconColor={surfaceColors.primary}
            style={{ backgroundColor: surfaceColors.primaryContainer }}
          />
        </View>
        <View style={{ paddingHorizontal: 4 }}>
          <PaperText style={[styles.title, { color: surfaceColors.onSurface }]}>
            Liquidaciones
          </PaperText>
          <PaperText style={{ fontSize: 16, color: surfaceColors.onSurfaceVariant, marginTop: 4 }}>
            Centro de Información
          </PaperText>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Resumen rápido */}
        <Surface style={[styles.summaryCard, { backgroundColor: surfaceColors.surfaceContainerLow }]} elevation={0}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <MaterialCommunityIcons name="office-building" size={20} color={surfaceColors.primary} />
            <PaperText variant="labelLarge" style={{ color: surfaceColors.primary, marginLeft: 8, fontWeight: '600' }}>
              {empresas.length} {empresas.length === 1 ? 'Empresa' : 'Empresas'}
            </PaperText>
          </View>
          <PaperText variant="bodyMedium" style={{ color: surfaceColors.onSurfaceVariant }}>
            Periodo actual: {formatPeriodo(periodoActual)}
          </PaperText>
        </Surface>

        {/* Navigation Cards */}
        <View style={styles.cardsContainer}>
          {navigationCards.map((card) => (
            <Pressable
              key={card.key}
              onPress={() => handleNavigate(card.screen)}
              android_ripple={{ color: `${card.iconColor}1F` }}
              style={({ pressed }) => [
                styles.navCard,
                { backgroundColor: card.color, transform: [{ scale: pressed ? 0.98 : 1 }] },
              ]}
            >
              <View style={styles.navCardIcon}>
                <MaterialCommunityIcons name={card.icon} size={32} color={card.iconColor} />
              </View>
              <PaperText variant="titleMedium" style={{ color: card.textColor, fontWeight: '600', marginTop: 16 }}>
                {card.title}
              </PaperText>
              <PaperText variant="bodySmall" style={{ color: card.textColor, opacity: 0.8, marginTop: 4 }}>
                {card.subtitle}
              </PaperText>
              <View style={styles.navCardArrow}>
                <MaterialCommunityIcons name="arrow-right" size={20} color={card.textColor} />
              </View>
            </Pressable>
          ))}
        </View>

        {/* Lista rápida de empresas */}
        {empresas.length > 0 && (
          <View style={styles.empresasSection}>
            <PaperText variant="labelLarge" style={{ color: surfaceColors.onSurfaceVariant, letterSpacing: 0.8, textTransform: 'uppercase', fontSize: 12, fontWeight: '700', marginBottom: 12 }}>
              Empresas con Liquidaciones
            </PaperText>
            {empresas.map((empresa) => (
              <Pressable
                key={empresa.normalizado}
                onPress={() => {
                  Haptics.selectionAsync();
                  navigation.navigate('LiquidacionesHistorial', { empresas, empresaInicial: empresa });
                }}
                android_ripple={{ color: `${surfaceColors.primary}1F` }}
                style={({ pressed }) => [
                  styles.empresaItem,
                  { backgroundColor: surfaceColors.surfaceContainerLow, transform: [{ scale: pressed ? 0.99 : 1 }] },
                ]}
              >
                <View style={[styles.empresaAvatar, { backgroundColor: surfaceColors.primaryContainer }]}>
                  <MaterialCommunityIcons name="domain" size={20} color={surfaceColors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <PaperText variant="bodyLarge" style={{ color: surfaceColors.onSurface, fontWeight: '500' }}>
                    {empresa.nombre}
                  </PaperText>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={surfaceColors.onSurfaceVariant} />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontFamily: 'Roboto-Flex',
    fontSize: 57,
    lineHeight: 64,
    fontWeight: '400',
    letterSpacing: -0.5,
  },
  deniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 24,
  },
  cardsContainer: {
    gap: 16,
    marginBottom: 32,
  },
  navCard: {
    borderRadius: 24,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  navCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navCardArrow: {
    position: 'absolute',
    right: 20,
    top: 20,
    opacity: 0.6,
  },
  empresasSection: {
    marginBottom: 16,
  },
  empresaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
  },
  empresaAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
