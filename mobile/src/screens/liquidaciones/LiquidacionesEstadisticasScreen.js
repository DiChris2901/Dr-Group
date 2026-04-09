import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Modal, FlatList, TouchableWithoutFeedback, Dimensions } from 'react-native';
import { Text as PaperText, IconButton, useTheme, Surface, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';

import { useLiquidacionesEstadisticas, useEstadisticasPorSala, formatPeriodo, formatPeriodoLargo } from '../../hooks/useLiquidaciones';
import { LoadingState } from '../../components';
import materialTheme from '../../../material-theme.json';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const formatCurrency = (value) => {
  if (value == null) return '$0';
  const abs = Math.abs(Math.round(value));
  if (abs >= 1_000_000_000) return (value < 0 ? '-' : '') + '$' + (abs / 1_000_000_000).toFixed(1) + 'B';
  if (abs >= 1_000_000) return (value < 0 ? '-' : '') + '$' + (abs / 1_000_000).toFixed(1) + 'M';
  if (abs >= 1_000) return (value < 0 ? '-' : '') + '$' + (abs / 1_000).toFixed(0) + 'K';
  return '$' + Math.round(value).toLocaleString('es-CO');
};

const formatNumber = (value) => {
  if (value == null) return '0';
  return Math.round(value).toLocaleString('es-CO');
};

export default function LiquidacionesEstadisticasScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const theme = useTheme();
  const { isDarkMode } = useAppTheme();

  const empresas = route.params?.empresas || [];
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(empresas[0] || null);
  const [showEmpresaPicker, setShowEmpresaPicker] = useState(false);
  const [vista, setVista] = useState('consolidado'); // 'consolidado' | 'salas'

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

  const { data, resumen, loading, error, refetch } = useLiquidacionesEstadisticas(
    empresaSeleccionada?.normalizado,
    6
  );

  const { salas, loading: loadingSalas } = useEstadisticasPorSala(
    empresaSeleccionada?.normalizado
  );

  // Mini bar chart nativo (sin librería)
  const chartData = useMemo(() => {
    if (!data.length) return [];
    const maxProd = Math.max(...data.map((d) => Math.abs(d.produccion)), 1);
    return data.map((d) => ({
      ...d,
      barHeight: (Math.abs(d.produccion) / maxProd) * 120,
      isNegative: d.produccion < 0,
    }));
  }, [data]);

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
            icon="chart-timeline-variant-shimmer"
            mode="contained-tonal"
            size={20}
            iconColor={surfaceColors.secondary}
            style={{ backgroundColor: surfaceColors.secondaryContainer }}
          />
        </View>
        <View style={{ paddingHorizontal: 4 }}>
          <PaperText style={[styles.title, { color: surfaceColors.onSurface }]}>
            Estadísticas
          </PaperText>
          <PaperText style={{ fontSize: 16, color: surfaceColors.onSurfaceVariant, marginTop: 4 }}>
            Tendencias y KPIs
          </PaperText>
        </View>
      </View>

      {/* Selector empresa */}
      <View style={styles.selectorContainer}>
        <Pressable
          onPress={() => { Haptics.selectionAsync(); setShowEmpresaPicker(true); }}
          style={[styles.selector, { backgroundColor: surfaceColors.primaryContainer }]}
        >
          <MaterialCommunityIcons name="domain" size={18} color={surfaceColors.onPrimaryContainer} />
          <PaperText variant="labelLarge" style={{ color: surfaceColors.onPrimaryContainer, marginLeft: 8, flex: 1 }} numberOfLines={1}>
            {empresaSeleccionada?.nombre || 'Seleccionar'}
          </PaperText>
          <MaterialCommunityIcons name="chevron-down" size={18} color={surfaceColors.onPrimaryContainer} />
        </Pressable>
      </View>

      {loading || loadingSalas ? (
        <LoadingState message="Analizando datos..." />
      ) : !resumen ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="chart-box-outline" size={64} color={surfaceColors.outline} />
          <PaperText variant="titleMedium" style={{ color: surfaceColors.onSurface, fontWeight: '600', marginTop: 16 }}>
            Sin datos
          </PaperText>
          <PaperText variant="bodyMedium" style={{ color: surfaceColors.onSurfaceVariant, marginTop: 8, textAlign: 'center', paddingHorizontal: 32 }}>
            No hay liquidaciones registradas para {empresaSeleccionada?.nombre}
          </PaperText>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Vista toggle */}
          <View style={styles.vistaToggle}>
            <SegmentedButtons
              value={vista}
              onValueChange={(v) => { Haptics.selectionAsync(); setVista(v); }}
              buttons={[
                { value: 'consolidado', label: 'Consolidado', icon: 'chart-bar' },
                { value: 'salas', label: 'Por Sala', icon: 'store' },
              ]}
              style={{ borderRadius: 24 }}
            />
          </View>

          {vista === 'consolidado' ? (
            <>
          {/* KPIs principales */}
          <View style={styles.kpiGrid}>
            <Surface style={[styles.kpiCard, { backgroundColor: surfaceColors.primaryContainer }]} elevation={0}>
              <MaterialCommunityIcons name="currency-usd" size={24} color={surfaceColors.onPrimaryContainer} />
              <PaperText variant="headlineSmall" style={{ color: surfaceColors.onPrimaryContainer, fontWeight: '700', marginTop: 8 }}>
                {formatCurrency(resumen.produccionActual)}
              </PaperText>
              <PaperText variant="labelSmall" style={{ color: surfaceColors.onPrimaryContainer, opacity: 0.8 }}>
                Producción
              </PaperText>
              {resumen.variacionProduccion !== null && (
                <View style={[styles.variacionBadge, { backgroundColor: resumen.variacionProduccion >= 0 ? '#E8F5E9' : '#FFEBEE' }]}>
                  <MaterialCommunityIcons
                    name={resumen.variacionProduccion >= 0 ? 'trending-up' : 'trending-down'}
                    size={14}
                    color={resumen.variacionProduccion >= 0 ? '#2E7D32' : '#C62828'}
                  />
                  <PaperText style={{ fontSize: 11, color: resumen.variacionProduccion >= 0 ? '#2E7D32' : '#C62828', marginLeft: 4, fontWeight: '600' }}>
                    {resumen.variacionProduccion > 0 ? '+' : ''}{resumen.variacionProduccion}%
                  </PaperText>
                </View>
              )}
            </Surface>

            <Surface style={[styles.kpiCard, { backgroundColor: surfaceColors.secondaryContainer }]} elevation={0}>
              <MaterialCommunityIcons name="receipt" size={24} color={surfaceColors.onSecondaryContainer} />
              <PaperText variant="headlineSmall" style={{ color: surfaceColors.onSecondaryContainer, fontWeight: '700', marginTop: 8 }}>
                {formatCurrency(resumen.impuestosActual)}
              </PaperText>
              <PaperText variant="labelSmall" style={{ color: surfaceColors.onSecondaryContainer, opacity: 0.8 }}>
                Impuestos
              </PaperText>
            </Surface>

            <Surface style={[styles.kpiCard, { backgroundColor: surfaceColors.tertiaryContainer }]} elevation={0}>
              <MaterialCommunityIcons name="slot-machine" size={24} color={surfaceColors.onTertiaryContainer} />
              <PaperText variant="headlineSmall" style={{ color: surfaceColors.onTertiaryContainer, fontWeight: '700', marginTop: 8 }}>
                {resumen.maquinasActual}
              </PaperText>
              <PaperText variant="labelSmall" style={{ color: surfaceColors.onTertiaryContainer, opacity: 0.8 }}>
                Máquinas
              </PaperText>
            </Surface>

            <Surface style={[styles.kpiCard, { backgroundColor: surfaceColors.surfaceContainerLow }]} elevation={0}>
              <MaterialCommunityIcons name="signal-cellular-3" size={24} color={surfaceColors.primary} />
              <PaperText variant="headlineSmall" style={{ color: surfaceColors.onSurface, fontWeight: '700', marginTop: 8 }}>
                {resumen.cumplimientoTxActual}%
              </PaperText>
              <PaperText variant="labelSmall" style={{ color: surfaceColors.onSurfaceVariant }}>
                Cumplimiento TX
              </PaperText>
            </Surface>
          </View>

          {/* Mini Bar Chart */}
          {chartData.length > 1 && (
            <View style={styles.chartSection}>
              <PaperText variant="labelLarge" style={{ color: surfaceColors.onSurfaceVariant, letterSpacing: 0.8, textTransform: 'uppercase', fontSize: 12, fontWeight: '700', marginBottom: 16 }}>
                Producción por Periodo
              </PaperText>
              <Surface style={[styles.chartCard, { backgroundColor: surfaceColors.surfaceContainerLow }]} elevation={0}>
                <View style={styles.chartBars}>
                  {chartData.map((d, i) => (
                    <View key={d.periodo} style={styles.chartBarWrapper}>
                      <View
                        style={[
                          styles.chartBar,
                          {
                            height: Math.max(d.barHeight, 4),
                            backgroundColor: d.isNegative ? surfaceColors.error : surfaceColors.primary,
                            opacity: i === chartData.length - 1 ? 1 : 0.6,
                          },
                        ]}
                      />
                      <PaperText style={{ fontSize: 9, color: surfaceColors.onSurfaceVariant, marginTop: 4, textAlign: 'center' }}>
                        {formatPeriodo(d.periodo)}
                      </PaperText>
                    </View>
                  ))}
                </View>
              </Surface>
            </View>
          )}

          {/* Tabla histórica */}
          <View style={styles.tableSection}>
            <PaperText variant="labelLarge" style={{ color: surfaceColors.onSurfaceVariant, letterSpacing: 0.8, textTransform: 'uppercase', fontSize: 12, fontWeight: '700', marginBottom: 16 }}>
              Histórico ({data.length} periodos)
            </PaperText>
            {data.map((d, i) => (
              <Surface key={d.periodo} style={[styles.tableRow, { backgroundColor: surfaceColors.surfaceContainerLow }]} elevation={0}>
                <View style={{ flex: 1 }}>
                  <PaperText variant="titleSmall" style={{ color: surfaceColors.onSurface, fontWeight: '600' }}>
                    {formatPeriodoLargo(d.periodo)}
                  </PaperText>
                  <PaperText variant="labelSmall" style={{ color: surfaceColors.onSurfaceVariant, marginTop: 2 }}>
                    {d.salas} salas · {d.maquinas} máquinas · TX {d.cumplimientoTx}%
                  </PaperText>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <PaperText variant="titleSmall" style={{ color: d.produccion >= 0 ? surfaceColors.primary : surfaceColors.error, fontWeight: '700' }}>
                    {formatCurrency(d.produccion)}
                  </PaperText>
                  <PaperText variant="labelSmall" style={{ color: surfaceColors.onSurfaceVariant }}>
                    Imp: {formatCurrency(d.impuestos)}
                  </PaperText>
                </View>
              </Surface>
            ))}
          </View>
            </>
          ) : (
            /* ===== VISTA POR SALA ===== */
            <View style={styles.salasSection}>
              <PaperText variant="labelLarge" style={{ color: surfaceColors.onSurfaceVariant, letterSpacing: 0.8, textTransform: 'uppercase', fontSize: 12, fontWeight: '700', marginBottom: 16 }}>
                Ranking por Sala ({salas.length})
              </PaperText>

              {salas.map((sala, idx) => (
                <Surface
                  key={sala.nombre}
                  style={[styles.salaStatCard, { backgroundColor: surfaceColors.surfaceContainerLow }]}
                  elevation={0}
                >
                  <View style={styles.salaStatHeader}>
                    <View style={[styles.salaRank, { backgroundColor: idx < 3 ? surfaceColors.primaryContainer : surfaceColors.surfaceContainer }]}> 
                      <PaperText variant="labelMedium" style={{ color: idx < 3 ? surfaceColors.onPrimaryContainer : surfaceColors.onSurfaceVariant, fontWeight: '700' }}>
                        {idx + 1}
                      </PaperText>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <PaperText variant="titleSmall" style={{ color: surfaceColors.onSurface, fontWeight: '600' }} numberOfLines={1}>
                        {sala.nombre}
                      </PaperText>
                      <PaperText variant="labelSmall" style={{ color: surfaceColors.onSurfaceVariant }}>
                        {sala.maquinasActual} máq. · {sala.totalPeriodos} {sala.totalPeriodos === 1 ? 'periodo' : 'periodos'}
                      </PaperText>
                    </View>
                    {sala.variacionProduccion !== null && (
                      <View style={[styles.variacionBadge, { backgroundColor: sala.variacionProduccion >= 0 ? '#E8F5E9' : '#FFEBEE' }]}>
                        <MaterialCommunityIcons
                          name={sala.variacionProduccion >= 0 ? 'trending-up' : 'trending-down'}
                          size={12}
                          color={sala.variacionProduccion >= 0 ? '#2E7D32' : '#C62828'}
                        />
                        <PaperText style={{ fontSize: 10, color: sala.variacionProduccion >= 0 ? '#2E7D32' : '#C62828', marginLeft: 2, fontWeight: '600' }}>
                          {sala.variacionProduccion > 0 ? '+' : ''}{sala.variacionProduccion}%
                        </PaperText>
                      </View>
                    )}
                  </View>
                  <View style={styles.salaStatBody}>
                    <View style={{ flex: 1 }}>
                      <PaperText variant="labelSmall" style={{ color: surfaceColors.onSurfaceVariant }}>Producción</PaperText>
                      <PaperText variant="titleSmall" style={{ color: sala.produccionActual >= 0 ? surfaceColors.primary : surfaceColors.error, fontWeight: '700' }}>
                        {formatCurrency(sala.produccionActual)}
                      </PaperText>
                    </View>
                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                      <PaperText variant="labelSmall" style={{ color: surfaceColors.onSurfaceVariant }}>Impuestos</PaperText>
                      <PaperText variant="titleSmall" style={{ color: surfaceColors.onSurface, fontWeight: '600' }}>
                        {formatCurrency(sala.impuestosActual)}
                      </PaperText>
                    </View>
                  </View>

                  {/* Mini sparkline de los últimos periodos */}
                  {sala.periodos.length > 1 && (
                    <View style={styles.sparklineContainer}>
                      {(() => {
                        const periodos = sala.periodos.slice(-6);
                        const maxP = Math.max(...periodos.map((p) => Math.abs(p.produccion)), 1);
                        return periodos.map((p, i) => (
                          <View key={p.periodo} style={styles.sparklineBarWrapper}>
                            <View
                              style={[
                                styles.sparklineBar,
                                {
                                  height: Math.max((Math.abs(p.produccion) / maxP) * 32, 2),
                                  backgroundColor: p.produccion < 0 ? surfaceColors.error : surfaceColors.primary,
                                  opacity: i === periodos.length - 1 ? 1 : 0.4,
                                },
                              ]}
                            />
                          </View>
                        ));
                      })()}
                    </View>
                  )}
                </Surface>
              ))}

              {salas.length === 0 && (
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons name="store-off-outline" size={48} color={surfaceColors.outline} />
                  <PaperText variant="bodyMedium" style={{ color: surfaceColors.onSurfaceVariant, marginTop: 12 }}>
                    Sin datos por sala
                  </PaperText>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* Empresa Picker Modal */}
      <Modal visible={showEmpresaPicker} transparent animationType="fade" onRequestClose={() => setShowEmpresaPicker(false)}>
        <TouchableWithoutFeedback onPress={() => setShowEmpresaPicker(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: surfaceColors.surfaceContainerHigh }]}>
                <PaperText variant="titleMedium" style={{ color: surfaceColors.onSurface, fontWeight: '600', marginBottom: 16 }}>
                  Seleccionar Empresa
                </PaperText>
                <FlatList
                  data={empresas}
                  keyExtractor={(item) => item.normalizado}
                  renderItem={({ item }) => {
                    const isSelected = item.normalizado === empresaSeleccionada?.normalizado;
                    return (
                      <Pressable
                        onPress={() => {
                          Haptics.selectionAsync();
                          setEmpresaSeleccionada(item);
                          setShowEmpresaPicker(false);
                        }}
                        style={[styles.pickerItem, isSelected && { backgroundColor: surfaceColors.primaryContainer }]}
                      >
                        <PaperText variant="bodyLarge" style={{ color: isSelected ? surfaceColors.onPrimaryContainer : surfaceColors.onSurface }}>
                          {item.nombre}
                        </PaperText>
                        {isSelected && <MaterialCommunityIcons name="check" size={20} color={surfaceColors.onPrimaryContainer} />}
                      </Pressable>
                    );
                  }}
                  style={{ maxHeight: 400 }}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontFamily: 'Roboto-Flex', fontSize: 40, lineHeight: 48, fontWeight: '400', letterSpacing: -0.5 },
  selectorContainer: { paddingHorizontal: 20, marginBottom: 16 },
  selector: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 32 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 },
  kpiCard: { width: (SCREEN_WIDTH - 52) / 2, padding: 16, borderRadius: 24 },
  variacionBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, marginTop: 8, alignSelf: 'flex-start' },
  chartSection: { marginBottom: 32 },
  chartCard: { padding: 20, borderRadius: 24 },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 140 },
  chartBarWrapper: { alignItems: 'center', flex: 1 },
  chartBar: { width: 24, borderRadius: 8 },
  tableSection: { marginBottom: 16 },
  tableRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 8 },
  vistaToggle: { marginBottom: 24 },
  salasSection: { marginBottom: 16 },
  salaStatCard: { borderRadius: 20, padding: 16, marginBottom: 10 },
  salaStatHeader: { flexDirection: 'row', alignItems: 'center' },
  salaRank: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  salaStatBody: { flexDirection: 'row', marginTop: 12 },
  sparklineContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, marginTop: 12, height: 36 },
  sparklineBarWrapper: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  sparklineBar: { width: '80%', maxWidth: 20, borderRadius: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { borderRadius: 24, padding: 24, maxHeight: '70%' },
  pickerItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, marginBottom: 4 },
});
