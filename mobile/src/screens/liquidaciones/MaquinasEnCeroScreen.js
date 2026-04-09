import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, FlatList, Pressable, Modal, TouchableWithoutFeedback } from 'react-native';
import { Text as PaperText, IconButton, useTheme, Surface, Searchbar, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';

import { useMaquinasEnCero, formatPeriodo } from '../../hooks/useLiquidaciones';
import { LoadingState } from '../../components';
import materialTheme from '../../../material-theme.json';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';

export default function MaquinasEnCeroScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const theme = useTheme();
  const { isDarkMode } = useAppTheme();

  const empresas = route.params?.empresas || [];
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(empresas[0] || null);
  const [showEmpresaPicker, setShowEmpresaPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos'); // 'todos' | 'activo' | 'resuelto'

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
      onErrorContainer: scheme.onErrorContainer,
      outline: scheme.outline,
      outlineVariant: scheme.outlineVariant,
    };
  }, [isDarkMode]);

  const { maquinas, stats, periodoReciente, loading, error, refetch } = useMaquinasEnCero(
    empresaSeleccionada?.normalizado
  );

  // Filtrado
  const filteredMaquinas = useMemo(() => {
    let resultado = maquinas;

    // Filtro por estado
    if (filtroEstado === 'activo') {
      resultado = resultado.filter((m) => m.esActualmenteEnCero);
    } else if (filtroEstado === 'resuelto') {
      resultado = resultado.filter((m) => !m.esActualmenteEnCero);
    }

    // Filtro por búsqueda
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      resultado = resultado.filter((m) =>
        (m.nuc || '').toLowerCase().includes(q) ||
        (m.serial || '').toLowerCase().includes(q) ||
        (m.sala || '').toLowerCase().includes(q)
      );
    }

    return resultado;
  }, [maquinas, filtroEstado, searchQuery]);

  const renderMaquinaItem = useCallback(({ item }) => {
    const esActiva = item.esActualmenteEnCero;
    const diasEnCero = item.diasCalendario || 0;
    const periodosCount = (item.periodosEnCero || []).length;

    return (
      <Surface
        style={[styles.maquinaCard, { backgroundColor: surfaceColors.surfaceContainerLow }]}
        elevation={0}
      >
        <View style={styles.maquinaHeader}>
          <View style={[
            styles.statusDot,
            { backgroundColor: esActiva ? surfaceColors.error : '#4CAF50' },
          ]} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <PaperText variant="titleSmall" style={{ color: surfaceColors.onSurface, fontWeight: '600' }}>
              NUC: {item.nuc || 'N/A'}
            </PaperText>
            <PaperText variant="bodySmall" style={{ color: surfaceColors.onSurfaceVariant }}>
              Serial: {item.serial || 'N/A'}
            </PaperText>
          </View>
          <View style={[
            styles.estadoBadge,
            { backgroundColor: esActiva ? surfaceColors.errorContainer : '#E8F5E9' },
          ]}>
            <PaperText style={{
              fontSize: 11,
              fontWeight: '600',
              color: esActiva ? surfaceColors.onErrorContainer : '#2E7D32',
            }}>
              {esActiva ? 'Activo' : 'Resuelto'}
            </PaperText>
          </View>
        </View>

        <View style={styles.maquinaDetails}>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="store" size={14} color={surfaceColors.onSurfaceVariant} />
            <PaperText variant="bodySmall" style={{ color: surfaceColors.onSurfaceVariant, marginLeft: 4 }}>
              {item.sala || 'Sin sala'}
            </PaperText>
          </View>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="calendar-clock" size={14} color={surfaceColors.onSurfaceVariant} />
            <PaperText variant="bodySmall" style={{ color: surfaceColors.onSurfaceVariant, marginLeft: 4 }}>
              {diasEnCero} días en cero
            </PaperText>
          </View>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="counter" size={14} color={surfaceColors.onSurfaceVariant} />
            <PaperText variant="bodySmall" style={{ color: surfaceColors.onSurfaceVariant, marginLeft: 4 }}>
              {periodosCount} {periodosCount === 1 ? 'periodo' : 'periodos'}
            </PaperText>
          </View>
        </View>
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
            icon="slot-machine-outline"
            mode="contained-tonal"
            size={20}
            iconColor={surfaceColors.error}
            style={{ backgroundColor: surfaceColors.errorContainer }}
          />
        </View>
        <View style={{ paddingHorizontal: 4 }}>
          <PaperText style={[styles.title, { color: surfaceColors.onSurface }]}>
            Máquinas en Cero
          </PaperText>
          <PaperText style={{ fontSize: 16, color: surfaceColors.onSurfaceVariant, marginTop: 4 }}>
            Equipos sin Producción
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

      {loading ? (
        <LoadingState message="Analizando máquinas..." />
      ) : (
        <>
          {/* Stats */}
          {stats.total > 0 && (
            <View style={styles.statsContainer}>
              <View style={styles.statsRow}>
                <Surface style={[styles.statChip, { backgroundColor: surfaceColors.errorContainer }]} elevation={0}>
                  <PaperText variant="headlineSmall" style={{ color: surfaceColors.onErrorContainer, fontWeight: '700' }}>
                    {stats.activas}
                  </PaperText>
                  <PaperText variant="labelSmall" style={{ color: surfaceColors.onErrorContainer, opacity: 0.8 }}>
                    Activas
                  </PaperText>
                </Surface>
                <Surface style={[styles.statChip, { backgroundColor: '#E8F5E9' }]} elevation={0}>
                  <PaperText variant="headlineSmall" style={{ color: '#2E7D32', fontWeight: '700' }}>
                    {stats.resueltas}
                  </PaperText>
                  <PaperText variant="labelSmall" style={{ color: '#2E7D32', opacity: 0.8 }}>
                    Resueltas
                  </PaperText>
                </Surface>
                <Surface style={[styles.statChip, { backgroundColor: surfaceColors.surfaceContainerLow }]} elevation={0}>
                  <PaperText variant="headlineSmall" style={{ color: surfaceColors.onSurface, fontWeight: '700' }}>
                    {stats.diasPromedio}
                  </PaperText>
                  <PaperText variant="labelSmall" style={{ color: surfaceColors.onSurfaceVariant }}>
                    Días prom.
                  </PaperText>
                </Surface>
              </View>
              {periodoReciente && (
                <PaperText variant="labelSmall" style={{ color: surfaceColors.onSurfaceVariant, textAlign: 'right', marginTop: 4 }}>
                  Último periodo: {formatPeriodo(periodoReciente)}
                </PaperText>
              )}
            </View>
          )}

          {/* Filtros */}
          <View style={styles.filtersContainer}>
            <View style={styles.chipRow}>
              {[
                { key: 'todos', label: `Todos (${stats.total})` },
                { key: 'activo', label: `Activas (${stats.activas})` },
                { key: 'resuelto', label: `Resueltas (${stats.resueltas})` },
              ].map((f) => (
                <Chip
                  key={f.key}
                  selected={filtroEstado === f.key}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setFiltroEstado(f.key);
                  }}
                  style={[
                    styles.chip,
                    filtroEstado === f.key
                      ? { backgroundColor: surfaceColors.primaryContainer }
                      : { backgroundColor: surfaceColors.surfaceContainerLow },
                  ]}
                  textStyle={{
                    fontSize: 12,
                    color: filtroEstado === f.key ? surfaceColors.onPrimaryContainer : surfaceColors.onSurfaceVariant,
                  }}
                >
                  {f.label}
                </Chip>
              ))}
            </View>
            {maquinas.length > 5 && (
              <Searchbar
                placeholder="Buscar NUC, serial o sala..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={[styles.searchbar, { backgroundColor: surfaceColors.surfaceContainerHigh }]}
                inputStyle={{ fontSize: 14 }}
                elevation={0}
              />
            )}
          </View>

          {/* Lista */}
          <FlatList
            data={filteredMaquinas}
            keyExtractor={(item, i) => `${item.nuc}_${item.serial}_${i}`}
            renderItem={renderMaquinaItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons
                  name={stats.total === 0 ? 'check-circle-outline' : 'filter-outline'}
                  size={64}
                  color={stats.total === 0 ? '#4CAF50' : surfaceColors.outline}
                />
                <PaperText variant="titleMedium" style={{ color: surfaceColors.onSurface, fontWeight: '600', marginTop: 16 }}>
                  {stats.total === 0 ? '¡Sin máquinas en cero!' : 'Sin resultados'}
                </PaperText>
                <PaperText variant="bodyMedium" style={{ color: surfaceColors.onSurfaceVariant, marginTop: 8, textAlign: 'center', paddingHorizontal: 32 }}>
                  {stats.total === 0
                    ? `Todas las máquinas de ${empresaSeleccionada?.nombre} están produciendo`
                    : 'Ajusta los filtros para ver máquinas'}
                </PaperText>
              </View>
            }
          />
        </>
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
  statsContainer: { paddingHorizontal: 20, marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statChip: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center' },
  filtersContainer: { paddingHorizontal: 20, marginBottom: 12, gap: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 20 },
  searchbar: { borderRadius: 24 },
  listContent: { paddingHorizontal: 20, paddingBottom: 32, flexGrow: 1 },
  maquinaCard: { borderRadius: 20, padding: 16 },
  maquinaHeader: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  estadoBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  maquinaDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  detailItem: { flexDirection: 'row', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 60 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { borderRadius: 24, padding: 24, maxHeight: '70%' },
  pickerItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, marginBottom: 4 },
});
