import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, FlatList, Pressable, Modal, TouchableWithoutFeedback } from 'react-native';
import { Text as PaperText, IconButton, useTheme, Surface, Searchbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';

import {
  useLiquidacionesPorPeriodo,
  generarPeriodos,
  formatPeriodo,
  formatPeriodoLargo,
  getPeriodoAnterior,
} from '../../hooks/useLiquidaciones';
import { LoadingState } from '../../components';
import materialTheme from '../../../material-theme.json';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';

const formatCurrency = (value) => {
  if (value == null) return '$0';
  return '$' + Math.round(value).toLocaleString('es-CO');
};

export default function LiquidacionesHistorialScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const theme = useTheme();
  const { isDarkMode } = useAppTheme();

  const empresas = route.params?.empresas || [];
  const empresaInicial = route.params?.empresaInicial || empresas[0] || null;

  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(empresaInicial);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState(getPeriodoAnterior());
  const [showEmpresaPicker, setShowEmpresaPicker] = useState(false);
  const [showPeriodoPicker, setShowPeriodoPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const periodos = useMemo(() => generarPeriodos(24), []);

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
      error: scheme.error,
      errorContainer: scheme.errorContainer,
      outline: scheme.outline,
      outlineVariant: scheme.outlineVariant,
    };
  }, [isDarkMode]);

  const { liquidaciones, kpis, loading, error, refetch } = useLiquidacionesPorPeriodo(
    empresaSeleccionada?.normalizado,
    periodoSeleccionado
  );

  // Filtro client-side por nombre de sala
  const filteredLiquidaciones = useMemo(() => {
    if (!searchQuery.trim()) return liquidaciones;
    const q = searchQuery.toLowerCase();
    return liquidaciones.filter((l) => {
      const sala = (l.sala?.nombre || '').toLowerCase();
      return sala.includes(q);
    });
  }, [liquidaciones, searchQuery]);

  const handleSalaPress = useCallback((liquidacion) => {
    Haptics.selectionAsync();
    navigation.navigate('LiquidacionDetail', {
      liquidacion,
      empresaNombre: empresaSeleccionada?.nombre,
      periodo: periodoSeleccionado,
    });
  }, [navigation, empresaSeleccionada, periodoSeleccionado]);

  const renderSalaItem = useCallback(({ item }) => {
    const datos = item.datosConsolidados || [];
    const metricas = item.metricas || {};
    const totalMaquinas = datos.length || metricas.maquinasConsolidadas || 0;
    const produccion = datos.length > 0
      ? datos.reduce((s, d) => s + (d.produccion || 0), 0)
      : (metricas.totalProduccion || 0);
    const impuestos = datos.length > 0
      ? datos.reduce((s, d) => s + (d.totalImpuestos || 0), 0)
      : (metricas.totalImpuestos || 0);

    return (
      <Pressable
        onPress={() => handleSalaPress(item)}
        android_ripple={{ color: `${surfaceColors.primary}1F` }}
        style={({ pressed }) => [
          styles.salaCard,
          { backgroundColor: surfaceColors.surfaceContainerLow, transform: [{ scale: pressed ? 0.98 : 1 }] },
        ]}
      >
        <View style={styles.salaHeader}>
          <View style={[styles.salaIcon, { backgroundColor: surfaceColors.primaryContainer }]}>
            <MaterialCommunityIcons name="store" size={20} color={surfaceColors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <PaperText variant="titleSmall" style={{ color: surfaceColors.onSurface, fontWeight: '600' }}>
              {item.sala?.nombre || 'Sin nombre'}
            </PaperText>
            <PaperText variant="labelSmall" style={{ color: surfaceColors.onSurfaceVariant }}>
              {totalMaquinas} {totalMaquinas === 1 ? 'máquina' : 'máquinas'}
            </PaperText>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={surfaceColors.onSurfaceVariant} />
        </View>

        <View style={styles.salaStats}>
          <View style={styles.salaStat}>
            <PaperText variant="labelSmall" style={{ color: surfaceColors.onSurfaceVariant }}>
              Producción
            </PaperText>
            <PaperText variant="bodyMedium" style={{ color: produccion >= 0 ? surfaceColors.primary : surfaceColors.error, fontWeight: '600' }}>
              {formatCurrency(produccion)}
            </PaperText>
          </View>
          <View style={styles.salaStat}>
            <PaperText variant="labelSmall" style={{ color: surfaceColors.onSurfaceVariant }}>
              Impuestos
            </PaperText>
            <PaperText variant="bodyMedium" style={{ color: surfaceColors.onSurface, fontWeight: '600' }}>
              {formatCurrency(impuestos)}
            </PaperText>
          </View>
        </View>
      </Pressable>
    );
  }, [surfaceColors, handleSalaPress]);

  // Picker Modal
  const renderPickerModal = (visible, setVisible, items, selected, onSelect, labelKey, title) => (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
      <TouchableWithoutFeedback onPress={() => setVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalContent, { backgroundColor: surfaceColors.surfaceContainerHigh }]}>
              <PaperText variant="titleMedium" style={{ color: surfaceColors.onSurface, fontWeight: '600', marginBottom: 16 }}>
                {title}
              </PaperText>
              <FlatList
                data={items}
                keyExtractor={(item, i) => labelKey === 'nombre' ? item.normalizado : item}
                renderItem={({ item }) => {
                  const label = labelKey === 'nombre' ? item.nombre : formatPeriodoLargo(item);
                  const isSelected = labelKey === 'nombre'
                    ? item.normalizado === selected?.normalizado
                    : item === selected;
                  return (
                    <Pressable
                      onPress={() => {
                        Haptics.selectionAsync();
                        onSelect(item);
                        setVisible(false);
                      }}
                      style={[
                        styles.pickerItem,
                        isSelected && { backgroundColor: surfaceColors.primaryContainer },
                      ]}
                    >
                      <PaperText variant="bodyLarge" style={{ color: isSelected ? surfaceColors.onPrimaryContainer : surfaceColors.onSurface }}>
                        {label}
                      </PaperText>
                      {isSelected && (
                        <MaterialCommunityIcons name="check" size={20} color={surfaceColors.onPrimaryContainer} />
                      )}
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
  );

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
            icon="file-document-multiple-outline"
            mode="contained-tonal"
            size={20}
            iconColor={surfaceColors.primary}
            style={{ backgroundColor: surfaceColors.primaryContainer }}
          />
        </View>
        <View style={{ paddingHorizontal: 4 }}>
          <PaperText style={[styles.title, { color: surfaceColors.onSurface }]}>
            Historial
          </PaperText>
          <PaperText style={{ fontSize: 16, color: surfaceColors.onSurfaceVariant, marginTop: 4 }}>
            Liquidaciones por Sala
          </PaperText>
        </View>
      </View>

      {/* Selectores */}
      <View style={styles.selectorsContainer}>
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

        <Pressable
          onPress={() => { Haptics.selectionAsync(); setShowPeriodoPicker(true); }}
          style={[styles.selector, { backgroundColor: surfaceColors.secondaryContainer, marginLeft: 8 }]}
        >
          <MaterialCommunityIcons name="calendar" size={18} color={surfaceColors.onSecondaryContainer} />
          <PaperText variant="labelLarge" style={{ color: surfaceColors.onSecondaryContainer, marginLeft: 8 }}>
            {formatPeriodo(periodoSeleccionado)}
          </PaperText>
          <MaterialCommunityIcons name="chevron-down" size={18} color={surfaceColors.onSecondaryContainer} />
        </Pressable>
      </View>

      {/* KPIs */}
      {!loading && kpis.totalSalas > 0 && (
        <View style={styles.kpisContainer}>
          <View style={styles.kpisRow}>
            <Surface style={[styles.kpiChip, { backgroundColor: surfaceColors.surfaceContainerLow }]} elevation={0}>
              <PaperText variant="labelSmall" style={{ color: surfaceColors.onSurfaceVariant }}>Salas</PaperText>
              <PaperText variant="titleMedium" style={{ color: surfaceColors.primary, fontWeight: '700' }}>{kpis.totalSalas}</PaperText>
            </Surface>
            <Surface style={[styles.kpiChip, { backgroundColor: surfaceColors.surfaceContainerLow }]} elevation={0}>
              <PaperText variant="labelSmall" style={{ color: surfaceColors.onSurfaceVariant }}>Máquinas</PaperText>
              <PaperText variant="titleMedium" style={{ color: surfaceColors.primary, fontWeight: '700' }}>{kpis.totalMaquinas}</PaperText>
            </Surface>
          </View>
          <Surface style={[styles.kpiWide, { backgroundColor: surfaceColors.surfaceContainerLow }]} elevation={0}>
            <View style={styles.kpiWideItem}>
              <PaperText variant="labelSmall" style={{ color: surfaceColors.onSurfaceVariant }}>Producción Total</PaperText>
              <PaperText variant="titleSmall" style={{ color: kpis.produccionTotal >= 0 ? surfaceColors.primary : surfaceColors.error, fontWeight: '700' }}>
                {formatCurrency(kpis.produccionTotal)}
              </PaperText>
            </View>
            <View style={[styles.kpiDivider, { backgroundColor: surfaceColors.outlineVariant }]} />
            <View style={styles.kpiWideItem}>
              <PaperText variant="labelSmall" style={{ color: surfaceColors.onSurfaceVariant }}>Impuestos Total</PaperText>
              <PaperText variant="titleSmall" style={{ color: surfaceColors.onSurface, fontWeight: '700' }}>
                {formatCurrency(kpis.impuestosTotal)}
              </PaperText>
            </View>
          </Surface>
        </View>
      )}

      {/* Search */}
      {!loading && liquidaciones.length > 3 && (
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Buscar sala..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchbar, { backgroundColor: surfaceColors.surfaceContainerHigh }]}
            inputStyle={{ fontSize: 14 }}
            elevation={0}
          />
        </View>
      )}

      {/* Lista */}
      {loading ? (
        <LoadingState message="Cargando liquidaciones..." />
      ) : (
        <FlatList
          data={filteredLiquidaciones}
          keyExtractor={(item) => item.id}
          renderItem={renderSalaItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="file-document-remove-outline"
                size={64}
                color={surfaceColors.outline}
              />
              <PaperText variant="titleMedium" style={{ color: surfaceColors.onSurface, fontWeight: '600', marginTop: 16 }}>
                Sin liquidaciones
              </PaperText>
              <PaperText variant="bodyMedium" style={{ color: surfaceColors.onSurfaceVariant, marginTop: 8, textAlign: 'center', paddingHorizontal: 32 }}>
                No hay liquidaciones para {empresaSeleccionada?.nombre} en {formatPeriodoLargo(periodoSeleccionado)}
              </PaperText>
            </View>
          }
        />
      )}

      {/* Picker Modals */}
      {renderPickerModal(showEmpresaPicker, setShowEmpresaPicker, empresas, empresaSeleccionada, setEmpresaSeleccionada, 'nombre', 'Seleccionar Empresa')}
      {renderPickerModal(showPeriodoPicker, setShowPeriodoPicker, periodos, periodoSeleccionado, setPeriodoSeleccionado, 'periodo', 'Seleccionar Periodo')}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontFamily: 'Roboto-Flex', fontSize: 40, lineHeight: 48, fontWeight: '400', letterSpacing: -0.5 },
  selectorsContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 16 },
  selector: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, flex: 1 },
  kpisContainer: { paddingHorizontal: 20, marginBottom: 16, gap: 8 },
  kpisRow: { flexDirection: 'row', gap: 8 },
  kpiChip: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center' },
  kpiWide: { flexDirection: 'row', padding: 16, borderRadius: 16 },
  kpiWideItem: { flex: 1, alignItems: 'center' },
  kpiDivider: { width: 1, marginHorizontal: 8 },
  searchContainer: { paddingHorizontal: 20, marginBottom: 12 },
  searchbar: { borderRadius: 24 },
  listContent: { paddingHorizontal: 20, paddingBottom: 32, flexGrow: 1 },
  salaCard: { borderRadius: 24, padding: 16, overflow: 'hidden' },
  salaHeader: { flexDirection: 'row', alignItems: 'center' },
  salaIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  salaStats: { flexDirection: 'row', marginTop: 12, gap: 16 },
  salaStat: { flex: 1 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 60 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { borderRadius: 24, padding: 24, maxHeight: '70%' },
  pickerItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, marginBottom: 4 },
});
