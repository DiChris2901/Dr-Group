import React, { useCallback, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
} from 'react-native';
import {
  Searchbar,
  Text as PaperText,
  Surface,
  Avatar,
  Chip,
  IconButton,
  useTheme,
  Divider,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useEmpleados } from '../../hooks/useEmpleados';
import { LoadingState } from '../../components';
import materialTheme from '../../../material-theme.json';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';

/**
 * EmpleadosScreen - Directorio de empleados
 * Material You Expressive Design
 * Solo lectura - consulta rápida con filtros
 */
export default function EmpleadosScreen() {
  const navigation = useNavigation();
  const theme = useTheme();
  const { isDarkMode } = useAppTheme();

  const surfaceColors = React.useMemo(() => {
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
      onSecondary: scheme.onSecondary,
      secondaryContainer: scheme.secondaryContainer,
      onSecondaryContainer: scheme.onSecondaryContainer,
      tertiary: scheme.tertiary,
      onTertiary: scheme.onTertiary,
      tertiaryContainer: scheme.tertiaryContainer,
      onTertiaryContainer: scheme.onTertiaryContainer,
      error: scheme.error,
      onError: scheme.onError,
      errorContainer: scheme.errorContainer,
      onErrorContainer: scheme.onErrorContainer,
      outline: scheme.outline,
      outlineVariant: scheme.outlineVariant,
    };
  }, [isDarkMode]);

  const {
    filteredEmpleados,
    companies,
    getCompanyName,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    filterEmpresa,
    setFilterEmpresa,
    filterEstado,
    setFilterEstado,
    hasPermission,
    stats,
    filteredCount,
  } = useEmpleados();

  const [empresaModalVisible, setEmpresaModalVisible] = useState(false);

  const handlePressEmpleado = useCallback((empleado) => {
    Haptics.selectionAsync();
    navigation.navigate('EmpleadoDetail', { empleadoId: empleado.id });
  }, [navigation]);

  // Sin permiso
  if (!hasPermission) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: surfaceColors.surface }]}>
        {/* Header Material You Expressive */}
        <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => {
                Haptics.selectionAsync();
                navigation.goBack();
              }}
              iconColor={surfaceColors.onSurface}
            />
            <View style={{ flexDirection: 'row' }}>
              <IconButton
                icon="account-multiple-outline"
                mode="contained-tonal"
                size={20}
                style={{ backgroundColor: surfaceColors.primaryContainer }}
                iconColor={surfaceColors.onPrimaryContainer}
              />
            </View>
          </View>
          <View style={{ paddingHorizontal: 4 }}>
            <PaperText style={{ 
              fontFamily: 'Roboto-Flex', 
              fontSize: 57,
              lineHeight: 64,
              fontWeight: '400', 
              color: surfaceColors.onSurface, 
              letterSpacing: -0.5,
              fontVariationSettings: [{ axis: 'wdth', value: 110 }]
            }}>
              Empleados
            </PaperText>
            <PaperText style={{ 
              fontSize: 16,
              color: surfaceColors.onSurfaceVariant, 
              marginTop: 4
            }}>
              Directorio de Personal
            </PaperText>
          </View>
        </View>
        <View style={styles.deniedContainer}>
          <MaterialCommunityIcons name="lock-outline" size={64} color={surfaceColors.outline} />
          <PaperText variant="titleMedium" style={[styles.deniedTitle, { color: surfaceColors.onSurface }]}>
            Acceso Restringido
          </PaperText>
          <PaperText variant="bodyMedium" style={[styles.deniedMessage, { color: surfaceColors.onSurfaceVariant }]}>
            No tienes permiso para ver el directorio de empleados. Contacta a tu administrador.
          </PaperText>
        </View>
      </SafeAreaView>
    );
  }

  // Loading
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: surfaceColors.surface }]}>
        {/* Header Material You Expressive */}
        <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => {
                Haptics.selectionAsync();
                navigation.goBack();
              }}
              iconColor={surfaceColors.onSurface}
            />
            <View style={{ flexDirection: 'row' }}>
              <IconButton
                icon="account-multiple-outline"
                mode="contained-tonal"
                size={20}
                style={{ backgroundColor: surfaceColors.primaryContainer }}
                iconColor={surfaceColors.onPrimaryContainer}
              />
            </View>
          </View>
          <View style={{ paddingHorizontal: 4 }}>
            <PaperText style={{ 
              fontFamily: 'Roboto-Flex', 
              fontSize: 57,
              lineHeight: 64,
              fontWeight: '400', 
              color: surfaceColors.onSurface, 
              letterSpacing: -0.5,
              fontVariationSettings: [{ axis: 'wdth', value: 110 }]
            }}>
              Empleados
            </PaperText>
            <PaperText style={{ 
              fontSize: 16,
              color: surfaceColors.onSurfaceVariant, 
              marginTop: 4
            }}>
              Directorio de Personal
            </PaperText>
          </View>
        </View>
        <LoadingState message="Cargando directorio de empleados..." />
      </SafeAreaView>
    );
  }

  const getInitials = (nombres, apellidos) => {
    const n = (nombres || '').charAt(0).toUpperCase();
    const a = (apellidos || '').charAt(0).toUpperCase();
    return `${n}${a}` || '??';
  };

  const estadoLabels = {
    activos: 'Activos',
    retirados: 'Retirados',
    todos: 'Todos',
  };

  const renderEmpleadoItem = ({ item }) => {
    const isRetirado = item.retirado === true;
    const companyName = getCompanyName(item.empresaContratante);

    return (
      <Pressable
        onPress={() => handlePressEmpleado(item)}
        android_ripple={{ color: surfaceColors.primary + '1F' }}
        style={({ pressed }) => [
          styles.empleadoCard,
          {
            backgroundColor: surfaceColors.surfaceContainerLow,
            borderColor: isRetirado ? surfaceColors.error + '40' : surfaceColors.outlineVariant,
            transform: [{ scale: pressed ? 0.98 : 1 }],
            opacity: isRetirado ? 0.7 : 1,
          },
        ]}
      >
        {/* Avatar */}
        <Avatar.Text
          size={48}
          label={getInitials(item.nombres, item.apellidos)}
          style={{
            backgroundColor: isRetirado ? surfaceColors.errorContainer : surfaceColors.primaryContainer,
          }}
          labelStyle={{
            color: isRetirado ? surfaceColors.onErrorContainer : surfaceColors.onPrimaryContainer,
            fontWeight: '600',
          }}
        />

        {/* Info */}
        <View style={styles.infoContainer}>
          <PaperText
            variant="titleMedium"
            numberOfLines={1}
            style={{ color: surfaceColors.onSurface, fontWeight: '600' }}
          >
            {item.apellidos || ''} {item.nombres || ''}
          </PaperText>

          <PaperText
            variant="bodySmall"
            numberOfLines={1}
            style={{ color: surfaceColors.onSurfaceVariant, marginTop: 2 }}
          >
            {item.tipoDocumento || 'CC'}: {item.numeroDocumento || 'No registrado'}
          </PaperText>

          <View style={styles.chipRow}>
            <Chip
              icon="domain"
              compact
              textStyle={styles.chipText}
              style={[styles.chip, { backgroundColor: surfaceColors.surfaceContainer }]}
            >
              {companyName}
            </Chip>
            {isRetirado && (
              <Chip
                icon="account-off"
                compact
                textStyle={[styles.chipText, { color: surfaceColors.error }]}
                style={[styles.chip, { backgroundColor: surfaceColors.errorContainer }]}
              >
                Retirado
              </Chip>
            )}
          </View>
        </View>

        {/* Chevron */}
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color={surfaceColors.outline}
        />
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: surfaceColors.surface }]}>
      {/* Header Material You Expressive */}
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => {
              Haptics.selectionAsync();
              navigation.goBack();
            }}
            iconColor={surfaceColors.onSurface}
          />
          <View style={{ flexDirection: 'row' }}>
            <IconButton
              icon="account-multiple-outline"
              mode="contained-tonal"
              size={20}
              onPress={() => {
                Haptics.selectionAsync();
                // Navegar a resumen de empleados o acción futura
              }}
              style={{
                backgroundColor: surfaceColors.primaryContainer,
                marginLeft: 8,
              }}
              iconColor={surfaceColors.onPrimaryContainer}
            />
          </View>
        </View>
        <View style={{ paddingHorizontal: 4 }}>
          <PaperText style={{ 
            fontFamily: 'Roboto-Flex', 
            fontSize: 57,
            lineHeight: 64,
            fontWeight: '400', 
            color: surfaceColors.onSurface, 
            letterSpacing: -0.5,
            fontVariationSettings: [{ axis: 'wdth', value: 110 }]
          }}>
            Empleados
          </PaperText>
          <PaperText style={{ 
            fontSize: 16,
            color: surfaceColors.onSurfaceVariant, 
            marginTop: 4
          }}>
            {filteredCount} en el directorio
          </PaperText>
        </View>
      </View>

      {/* Stats Row - Funcionan como filtros */}
      <View style={styles.statsRow}>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            setFilterEstado('activos');
          }}
          android_ripple={{ color: surfaceColors.primary + '1F' }}
          style={({ pressed }) => [
            styles.statChip,
            {
              backgroundColor: surfaceColors.primaryContainer,
              transform: [{ scale: pressed ? 0.95 : 1 }],
              borderWidth: filterEstado === 'activos' ? 3 : 0,
              borderColor: surfaceColors.primary,
            },
          ]}
        >
          <PaperText variant="titleMedium" style={{ color: surfaceColors.onPrimaryContainer, fontWeight: '700' }}>
            {stats.activos}
          </PaperText>
          <PaperText variant="labelSmall" style={{ color: surfaceColors.onPrimaryContainer }}>
            Activos
          </PaperText>
        </Pressable>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            setFilterEstado('retirados');
          }}
          android_ripple={{ color: surfaceColors.error + '1F' }}
          style={({ pressed }) => [
            styles.statChip,
            {
              backgroundColor: surfaceColors.errorContainer,
              transform: [{ scale: pressed ? 0.95 : 1 }],
              borderWidth: filterEstado === 'retirados' ? 3 : 0,
              borderColor: surfaceColors.error,
            },
          ]}
        >
          <PaperText variant="titleMedium" style={{ color: surfaceColors.onErrorContainer, fontWeight: '700' }}>
            {stats.retirados}
          </PaperText>
          <PaperText variant="labelSmall" style={{ color: surfaceColors.onErrorContainer }}>
            Retirados
          </PaperText>
        </Pressable>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            setFilterEstado('todos');
          }}
          android_ripple={{ color: surfaceColors.primary + '1F' }}
          style={({ pressed }) => [
            styles.statChip,
            {
              backgroundColor: surfaceColors.surfaceContainerHigh,
              transform: [{ scale: pressed ? 0.95 : 1 }],
              borderWidth: filterEstado === 'todos' ? 3 : 0,
              borderColor: surfaceColors.outline,
            },
          ]}
        >
          <PaperText variant="titleMedium" style={{ color: surfaceColors.onSurface, fontWeight: '700' }}>
            {stats.total}
          </PaperText>
          <PaperText variant="labelSmall" style={{ color: surfaceColors.onSurfaceVariant }}>
            Total
          </PaperText>
        </Pressable>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Buscar por nombre, documento, email..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[styles.searchbar, { backgroundColor: surfaceColors.surfaceContainerHigh }]}
          inputStyle={{ fontSize: 14 }}
          elevation={0}
        />
      </View>

      {/* Filters Row */}
      <View style={styles.filtersRow}>
        {/* Filtro empresa */}
        <Chip
          icon="domain"
          selected={filterEmpresa !== 'all'}
          showSelectedOverlay
          compact
          onPress={() => {
            Haptics.selectionAsync();
            setEmpresaModalVisible(true);
          }}
          style={[styles.filterChip, { backgroundColor: filterEmpresa !== 'all' ? surfaceColors.secondaryContainer : surfaceColors.surfaceContainerHigh }]}
          textStyle={{ fontSize: 12, color: filterEmpresa !== 'all' ? surfaceColors.onSecondaryContainer : surfaceColors.onSurfaceVariant }}
        >
          {filterEmpresa === 'all' ? 'Filtrar Empresa' : getCompanyName(filterEmpresa)}
        </Chip>

        {/* Resultado count */}
        <PaperText
          variant="labelSmall"
          style={[styles.resultCount, { color: surfaceColors.onSurfaceVariant }]}
        >
          {filteredCount} resultados
        </PaperText>
      </View>

      {/* Modal Filtro Empresa */}
      <Modal
        visible={empresaModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEmpresaModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setEmpresaModalVisible(false)}
        >
          <Pressable
            style={[styles.modalContent, { backgroundColor: surfaceColors.surfaceContainerHigh }]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <PaperText variant="titleLarge" style={{ color: surfaceColors.onSurface, fontWeight: '600' }}>
                Filtrar por Empresa
              </PaperText>
              <IconButton
                icon="close"
                size={24}
                onPress={() => setEmpresaModalVisible(false)}
                iconColor={surfaceColors.onSurfaceVariant}
              />
            </View>
            <Divider style={{ backgroundColor: surfaceColors.outlineVariant }} />

            {/* Lista de empresas */}
            <ScrollView style={styles.modalList}>
              {/* Opción Todas */}
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setFilterEmpresa('all');
                  setEmpresaModalVisible(false);
                }}
                android_ripple={{ color: surfaceColors.primary + '1F' }}
                style={[styles.modalItem, {
                  backgroundColor: filterEmpresa === 'all' ? surfaceColors.primaryContainer : 'transparent'
                }]}
              >
                <MaterialCommunityIcons
                  name={filterEmpresa === 'all' ? 'check-circle' : 'circle-outline'}
                  size={24}
                  color={filterEmpresa === 'all' ? surfaceColors.primary : surfaceColors.outline}
                />
                <PaperText
                  variant="bodyLarge"
                  style={{
                    color: filterEmpresa === 'all' ? surfaceColors.onPrimaryContainer : surfaceColors.onSurface,
                    fontWeight: filterEmpresa === 'all' ? '600' : '400',
                    flex: 1,
                  }}
                >
                  Todas las empresas
                </PaperText>
              </Pressable>

              {/* Empresas */}
              {companies.map((company) => (
                <Pressable
                  key={company.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setFilterEmpresa(company.id);
                    setEmpresaModalVisible(false);
                  }}
                  android_ripple={{ color: surfaceColors.primary + '1F' }}
                  style={[styles.modalItem, {
                    backgroundColor: filterEmpresa === company.id ? surfaceColors.primaryContainer : 'transparent'
                  }]}
                >
                  <MaterialCommunityIcons
                    name={filterEmpresa === company.id ? 'check-circle' : 'circle-outline'}
                    size={24}
                    color={filterEmpresa === company.id ? surfaceColors.primary : surfaceColors.outline}
                  />
                  <PaperText
                    variant="bodyLarge"
                    style={{
                      color: filterEmpresa === company.id ? surfaceColors.onPrimaryContainer : surfaceColors.onSurface,
                      fontWeight: filterEmpresa === company.id ? '600' : '400',
                      flex: 1,
                    }}
                  >
                    {company.name}
                  </PaperText>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* List */}
      <FlatList
        data={filteredEmpleados}
        keyExtractor={(item) => item.id}
        renderItem={renderEmpleadoItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
            <View style={styles.emptyStateContainer}>
              <View style={[styles.emptyStateCircle, { backgroundColor: surfaceColors.surfaceContainerHigh }]}>
                <MaterialCommunityIcons
                  name={searchQuery || filterEmpresa !== 'all' ? 'account-search' : 'account-group'}
                  size={64}
                  color={surfaceColors.primary}
                />
              </View>
              <PaperText
                variant="headlineSmall"
                style={{ color: surfaceColors.onSurface, fontWeight: '600', textAlign: 'center', marginBottom: 8 }}
              >
                {searchQuery || filterEmpresa !== 'all' ? 'Sin resultados' : 'Directorio vacío'}
              </PaperText>
              <PaperText
                variant="bodyLarge"
                style={{ color: surfaceColors.onSurfaceVariant, textAlign: 'center', paddingHorizontal: 40 }}
              >
                {searchQuery
                  ? `No se encontraron empleados para "${searchQuery}"`
                  : filterEmpresa !== 'all'
                  ? 'No hay empleados registrados en esta empresa'
                  : 'No hay empleados registrados en el sistema'}
              </PaperText>
            </View>
          }
        />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  deniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  deniedTitle: {
    marginTop: 16,
    fontWeight: '600',
  },
  deniedMessage: {
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  headerContainer: {
    paddingTop: 8,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerContent: {
    paddingHorizontal: 4,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  statChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 0,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  searchbar: {
    borderRadius: 24,
  },
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
    alignItems: 'center',
  },
  filterChip: {
    borderRadius: 20,
  },
  resultCount: {
    marginLeft: 'auto',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
    flexGrow: 1,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyStateCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  empleadoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
    borderWidth: 0.5,
    gap: 16,
  },
  infoContainer: {
    flex: 1,
  },
  chipRow: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 6,
    flexWrap: 'wrap',
  },
  chip: {
    height: 24,
  },
  chipText: {
    fontSize: 11,
    lineHeight: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '70%',
    elevation: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  modalList: {
    paddingVertical: 8,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
});
