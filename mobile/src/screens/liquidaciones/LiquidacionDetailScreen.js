import React, { useMemo, useCallback } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text as PaperText, IconButton, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';

import { formatPeriodoLargo } from '../../hooks/useLiquidaciones';
import materialTheme from '../../../material-theme.json';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';

const formatCurrency = (num) => {
  if (!num && num !== 0) return '$0';
  if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}K`;
  return `$${num.toLocaleString('es-CO')}`;
};

export default function LiquidacionDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { isDarkMode } = useAppTheme();

  const { liquidacion, empresaNombre, periodo, salaNombre } = route.params || {};
  const datos = (liquidacion?.datosConsolidados || []);

  const surfaceColors = useMemo(() => {
    const scheme = isDarkMode ? materialTheme.schemes.dark : materialTheme.schemes.light;
    return {
      background: scheme.background,
      surface: scheme.surface,
      surfaceContainerLow: scheme.surfaceContainerLow,
      surfaceContainer: scheme.surfaceContainer,
      surfaceContainerHigh: scheme.surfaceContainerHigh,
      onSurface: scheme.onSurface,
      onSurfaceVariant: scheme.onSurfaceVariant,
      primary: scheme.primary,
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

  // KPIs
  const kpis = useMemo(() => {
    let totalProduccion = 0;
    let totalImpuestos = 0;
    let maquinasConNovedad = 0;
    datos.forEach((m) => {
      totalProduccion += parseFloat(m.produccion) || 0;
      totalImpuestos += parseFloat(m.totalImpuestos || m.derechosExplotacion) || 0;
      if (m.novedad && m.novedad !== 'N/A' && m.novedad !== '') maquinasConNovedad++;
    });
    return {
      totalMaquinas: datos.length,
      totalProduccion,
      totalImpuestos,
      maquinasConNovedad,
    };
  }, [datos]);

  const renderMaquinaItem = useCallback(({ item, index }) => {
    const produccion = parseFloat(item.produccion) || 0;
    const impuestos = parseFloat(item.totalImpuestos || item.derechosExplotacion) || 0;
    const diasTx = item.diasTransmitidos || 0;
    const diasMes = item.diasMes || 30;
    const cumplimiento = diasMes > 0 ? Math.round((diasTx / diasMes) * 100) : 0;
    const tieneNovedad = item.novedad && item.novedad !== 'N/A' && item.novedad !== '';

    return (
      <Surface
        style={[styles.machineCard, { backgroundColor: surfaceColors.surfaceContainerLow }]}
        elevation={0}
      >
        <View style={styles.machineHeader}>
          <View style={styles.machineIndex}>
            <PaperText variant="labelSmall" style={{ color: surfaceColors.onSurfaceVariant }}>
              #{index + 1}
            </PaperText>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <PaperText variant="titleSmall" style={{ color: surfaceColors.onSurface, fontWeight: '600' }}>
              NUC: {item.nuc || 'N/A'}
            </PaperText>
            <PaperText variant="bodySmall" style={{ color: surfaceColors.onSurfaceVariant }}>
              Serial: {item.serial || 'N/A'}
            </PaperText>
          </View>
          {tieneNovedad && (
            <View style={[styles.novedadBadge, { backgroundColor: surfaceColors.errorContainer }]}>
              <MaterialCommunityIcons name="alert-outline" size={12} color={surfaceColors.onErrorContainer} />
              <PaperText style={{ fontSize: 10, color: surfaceColors.onErrorContainer, marginLeft: 2 }}>
                Novedad
              </PaperText>
            </View>
          )}
        </View>

        <View style={styles.machineData}>
          <View style={styles.dataRow}>
            <PaperText variant="labelSmall" style={{ color: surfaceColors.onSurfaceVariant }}>
              Producción
            </PaperText>
            <PaperText variant="bodyMedium" style={{ color: surfaceColors.primary, fontWeight: '600' }}>
              {formatCurrency(produccion)}
            </PaperText>
          </View>
          <View style={styles.dataRow}>
            <PaperText variant="labelSmall" style={{ color: surfaceColors.onSurfaceVariant }}>
              Impuestos
            </PaperText>
            <PaperText variant="bodyMedium" style={{ color: surfaceColors.onSurface, fontWeight: '500' }}>
              {formatCurrency(impuestos)}
            </PaperText>
          </View>
          <View style={styles.dataRow}>
            <PaperText variant="labelSmall" style={{ color: surfaceColors.onSurfaceVariant }}>
              Transmisión
            </PaperText>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <PaperText variant="bodyMedium" style={{ color: surfaceColors.onSurface }}>
                {diasTx}/{diasMes} días
              </PaperText>
              <View style={[
                styles.txBadge,
                { backgroundColor: cumplimiento === 100 ? '#E8F5E9' : cumplimiento >= 80 ? surfaceColors.tertiaryContainer : surfaceColors.errorContainer },
              ]}>
                <PaperText style={{
                  fontSize: 10,
                  fontWeight: '700',
                  color: cumplimiento === 100 ? '#2E7D32' : cumplimiento >= 80 ? surfaceColors.onTertiaryContainer : surfaceColors.onErrorContainer,
                }}>
                  {cumplimiento}%
                </PaperText>
              </View>
            </View>
          </View>
          {tieneNovedad && (
            <View style={styles.dataRow}>
              <PaperText variant="labelSmall" style={{ color: surfaceColors.error }}>
                Novedad
              </PaperText>
              <PaperText variant="bodySmall" style={{ color: surfaceColors.error, flex: 1, textAlign: 'right' }} numberOfLines={2}>
                {item.novedad}
              </PaperText>
            </View>
          )}
        </View>

        {item.establecimiento && (
          <View style={[styles.establecimiento, { borderTopColor: surfaceColors.outlineVariant }]}>
            <MaterialCommunityIcons name="map-marker-outline" size={12} color={surfaceColors.onSurfaceVariant} />
            <PaperText variant="labelSmall" style={{ color: surfaceColors.onSurfaceVariant, marginLeft: 4 }}>
              {item.establecimiento}
            </PaperText>
          </View>
        )}
      </Surface>
    );
  }, [surfaceColors]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: surfaceColors.surface }]}>
      {/* Header */}
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
            icon="table-large"
            mode="contained-tonal"
            size={20}
            iconColor={surfaceColors.primary}
            style={{ backgroundColor: surfaceColors.primaryContainer }}
          />
        </View>
        <View style={{ paddingHorizontal: 4 }}>
          <PaperText style={[styles.title, { color: surfaceColors.onSurface }]} numberOfLines={2}>
            {salaNombre || 'Detalle'}
          </PaperText>
          <PaperText style={{ fontSize: 14, color: surfaceColors.onSurfaceVariant, marginTop: 4 }}>
            {empresaNombre} • {periodo ? formatPeriodoLargo(periodo) : ''}
          </PaperText>
        </View>
      </View>

      {/* Summary bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryRow}>
          <Surface style={[styles.summaryItem, { backgroundColor: surfaceColors.primaryContainer }]} elevation={0}>
            <PaperText variant="titleMedium" style={{ color: surfaceColors.onPrimaryContainer, fontWeight: '700' }}>
              {kpis.totalMaquinas}
            </PaperText>
            <PaperText variant="labelSmall" style={{ color: surfaceColors.onPrimaryContainer, opacity: 0.8 }}>
              Máquinas
            </PaperText>
          </Surface>
          <Surface style={[styles.summaryItem, { backgroundColor: surfaceColors.secondaryContainer }]} elevation={0}>
            <PaperText variant="titleMedium" style={{ color: surfaceColors.onSecondaryContainer, fontWeight: '700' }}>
              {formatCurrency(kpis.totalProduccion)}
            </PaperText>
            <PaperText variant="labelSmall" style={{ color: surfaceColors.onSecondaryContainer, opacity: 0.8 }}>
              Producción
            </PaperText>
          </Surface>
          <Surface style={[styles.summaryItem, { backgroundColor: surfaceColors.tertiaryContainer }]} elevation={0}>
            <PaperText variant="titleMedium" style={{ color: surfaceColors.onTertiaryContainer, fontWeight: '700' }}>
              {formatCurrency(kpis.totalImpuestos)}
            </PaperText>
            <PaperText variant="labelSmall" style={{ color: surfaceColors.onTertiaryContainer, opacity: 0.8 }}>
              Impuestos
            </PaperText>
          </Surface>
        </View>
      </View>

      {/* Machine list */}
      <FlatList
        data={datos}
        keyExtractor={(item, i) => `${item.nuc}_${item.serial}_${i}`}
        renderItem={renderMaquinaItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="database-off-outline" size={64} color={surfaceColors.outline} />
            <PaperText variant="titleMedium" style={{ color: surfaceColors.onSurface, fontWeight: '600', marginTop: 16 }}>
              Sin datos de máquinas
            </PaperText>
            <PaperText variant="bodyMedium" style={{ color: surfaceColors.onSurfaceVariant, marginTop: 8, textAlign: 'center' }}>
              No hay datos consolidados disponibles para esta sala
            </PaperText>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontFamily: 'Roboto-Flex', fontSize: 32, lineHeight: 40, fontWeight: '400', letterSpacing: -0.25 },
  summaryBar: { paddingHorizontal: 20, marginBottom: 16 },
  summaryRow: { flexDirection: 'row', gap: 8 },
  summaryItem: { flex: 1, padding: 12, borderRadius: 16, alignItems: 'center' },
  listContent: { paddingHorizontal: 20, paddingBottom: 32, flexGrow: 1 },
  machineCard: { borderRadius: 20, padding: 16 },
  machineHeader: { flexDirection: 'row', alignItems: 'center' },
  machineIndex: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.05)' },
  novedadBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  machineData: { marginTop: 12, gap: 8 },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  txBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginLeft: 8 },
  establecimiento: { borderTopWidth: 1, marginTop: 12, paddingTop: 8, flexDirection: 'row', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 60 },
});
