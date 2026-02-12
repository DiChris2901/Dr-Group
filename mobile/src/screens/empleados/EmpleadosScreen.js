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

/**
 * EmpleadosScreen - Directorio de empleados
 * Material You Expressive Design
 * Solo lectura - consulta rápida con filtros
 */
export default function EmpleadosScreen() {
  const navigation = useNavigation();
  const theme = useTheme();
  const isDark = theme.dark;
  const scheme = isDark ? materialTheme.schemes.dark : materialTheme.schemes.light;

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
      <SafeAreaView style={[styles.container, { backgroundColor: scheme.surface }]}>
        {/* Header Expresivo */}
        <View style={styles.headerContainer}>
          <View style={styles.headerTop}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => {
                Haptics.selectionAsync();
                navigation.goBack();
              }}
              iconColor={scheme.onSurface}
            />
          </View>
          <View style={styles.headerContent}>
            <PaperText
              variant="displaySmall"
              style={{
                fontWeight: '400',
                color: scheme.onSurface,
                letterSpacing: -0.5,
                fontFamily: 'Roboto-Flex',
                marginBottom: 4,
              }}
            >
              Empleados
            </PaperText>
            <PaperText variant="titleMedium" style={{ color: scheme.onSurfaceVariant }}>
              Directorio de Personal
            </PaperText>
          </View>
        </View>
        <View style={styles.deniedContainer}>
          <MaterialCommunityIcons name="lock-outline" size={64} color={scheme.outline} />
          <PaperText variant="titleMedium" style={[styles.deniedTitle, { color: scheme.onSurface }]}>
            Acceso Restringido
          </PaperText>
          <PaperText variant="bodyMedium" style={[styles.deniedMessage, { color: scheme.onSurfaceVariant }]}>
            No tienes permiso para ver el directorio de empleados. Contacta a tu administrador.
          </PaperText>
        </View>
      </SafeAreaView>
    );
  }

  // Loading
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: scheme.surface }]}>
        {/* Header Expresivo */}
        <View style={styles.headerContainer}>
          <View style={styles.headerTop}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => {
                Haptics.selectionAsync();
                navigation.goBack();
              }}
              iconColor={scheme.onSurface}
            />
          </View>
          <View style={styles.headerContent}>
            <PaperText
              variant="displaySmall"
              style={{
                fontWeight: '400',
                color: scheme.onSurface,
                letterSpacing: -0.5,
                fontFamily: 'Roboto-Flex',
                marginBottom: 4,
              }}
            >
              Empleados
            </PaperText>
            <PaperText variant="titleMedium" style={{ color: scheme.onSurfaceVariant }}>
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
        android_ripple={{ color: scheme.primary + '1F' }}
        style={({ pressed }) => [
          styles.empleadoCard,
          {
            backgroundColor: scheme.surfaceContainerLow,
            borderColor: isRetirado ? scheme.error + '40' : scheme.outlineVariant,
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
            backgroundColor: isRetirado ? scheme.errorContainer : scheme.primaryContainer,
          }}
          labelStyle={{
            color: isRetirado ? scheme.onErrorContainer : scheme.onPrimaryContainer,
            fontWeight: '600',
          }}
        />

        {/* Info */}
        <View style={styles.infoContainer}>
          <PaperText
            variant="titleMedium"
            numberOfLines={1}
            style={{ color: scheme.onSurface, fontWeight: '600' }}
          >
            {item.apellidos || ''} {item.nombres || ''}
          </PaperText>

          <PaperText
            variant="bodySmall"
            numberOfLines={1}
            style={{ color: scheme.onSurfaceVariant, marginTop: 2 }}
          >
            {item.tipoDocumento || 'CC'}: {item.numeroDocumento || 'No registrado'}
          </PaperText>

          <View style={styles.chipRow}>
            <Chip
              icon="domain"
              compact
              textStyle={styles.chipText}
              style={[styles.chip, { backgroundColor: scheme.surfaceContainer }]}
            >
              {companyName}
            </Chip>
            {isRetirado && (
              <Chip
                icon="account-off"
                compact
                textStyle={[styles.chipText, { color: scheme.error }]}
                style={[styles.chip, { backgroundColor: scheme.errorContainer }]}
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
          color={scheme.outline}
        />
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: scheme.surface }]}>
      {/* Header Expresivo */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTop}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => {
              Haptics.selectionAsync();
              navigation.goBack();
            }}
            iconColor={scheme.onSurface}
          />
          <View style={styles.actionButtons}>
            <IconButton
              icon="account-multiple"
              mode="contained-tonal"
              size={20}
              onPress={() => {
                Haptics.selectionAsync();
                // Navegar a resumen de empleados o acción futura
              }}
              iconColor={scheme.primary}
              style={{
                backgroundColor: scheme.primaryContainer,
                marginLeft: 8,
              }}
            />
          </View>
        </View>
        <View style={styles.headerContent}>
          <PaperText
            variant="displaySmall"
            style={{
              fontWeight: '400',
              color: scheme.onSurface,
              letterSpacing: -0.5,
              fontFamily: 'Roboto-Flex',
              marginBottom: 4,
            }}
          >
            Empleados
          </PaperText>
          <PaperText variant="titleMedium" style={{ color: scheme.onSurfaceVariant }}>
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
          android_ripple={{ color: scheme.primary + '1F' }}
          style={({ pressed }) => [
            styles.statChip,
            {
              backgroundColor: scheme.primaryContainer,
              transform: [{ scale: pressed ? 0.95 : 1 }],
              borderWidth: filterEstado === 'activos' ? 3 : 0,
              borderColor: scheme.primary,
            },
          ]}
        >
          <PaperText variant="titleMedium" style={{ color: scheme.onPrimaryContainer, fontWeight: '700' }}>
            {stats.activos}
          </PaperText>
          <PaperText variant="labelSmall" style={{ color: scheme.onPrimaryContainer }}>
            Activos
          </PaperText>
        </Pressable>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            setFilterEstado('retirados');
          }}
          android_ripple={{ color: scheme.error + '1F' }}
          style={({ pressed }) => [
            styles.statChip,
            {
              backgroundColor: scheme.errorContainer,
              transform: [{ scale: pressed ? 0.95 : 1 }],
              borderWidth: filterEstado === 'retirados' ? 3 : 0,
              borderColor: scheme.error,
            },
          ]}
        >
          <PaperText variant="titleMedium" style={{ color: scheme.onErrorContainer, fontWeight: '700' }}>
            {stats.retirados}
          </PaperText>
          <PaperText variant="labelSmall" style={{ color: scheme.onErrorContainer }}>
            Retirados
          </PaperText>
        </Pressable>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            setFilterEstado('todos');
          }}
          android_ripple={{ color: scheme.primary + '1F' }}
          style={({ pressed }) => [
            styles.statChip,
            {
              backgroundColor: scheme.surfaceContainerHigh,
              transform: [{ scale: pressed ? 0.95 : 1 }],
              borderWidth: filterEstado === 'todos' ? 3 : 0,
              borderColor: scheme.outline,
            },
          ]}
        >
          <PaperText variant="titleMedium" style={{ color: scheme.onSurface, fontWeight: '700' }}>
            {stats.total}
          </PaperText>
          <PaperText variant="labelSmall" style={{ color: scheme.onSurfaceVariant }}>
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
          style={[styles.searchbar, { backgroundColor: scheme.surfaceContainerHigh }]}
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
          style={[styles.filterChip, { backgroundColor: filterEmpresa !== 'all' ? scheme.secondaryContainer : scheme.surfaceContainerHigh }]}
          textStyle={{ fontSize: 12, color: filterEmpresa !== 'all' ? scheme.onSecondaryContainer : scheme.onSurfaceVariant }}
        >
          {filterEmpresa === 'all' ? 'Filtrar Empresa' : getCompanyName(filterEmpresa)}
        </Chip>

        {/* Resultado count */}
        <PaperText
          variant="labelSmall"
          style={[styles.resultCount, { color: scheme.onSurfaceVariant }]}
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
            style={[styles.modalContent, { backgroundColor: scheme.surfaceContainerHigh }]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <PaperText variant="titleLarge" style={{ color: scheme.onSurface, fontWeight: '600' }}>
                Filtrar por Empresa
              </PaperText>
              <IconButton
                icon="close"
                size={24}
                onPress={() => setEmpresaModalVisible(false)}
                iconColor={scheme.onSurfaceVariant}
              />
            </View>
            <Divider style={{ backgroundColor: scheme.outlineVariant }} />

            {/* Lista de empresas */}
            <ScrollView style={styles.modalList}>
              {/* Opción Todas */}
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setFilterEmpresa('all');
                  setEmpresaModalVisible(false);
                }}
                android_ripple={{ color: scheme.primary + '1F' }}
                style={[styles.modalItem, {
                  backgroundColor: filterEmpresa === 'all' ? scheme.primaryContainer : 'transparent'
                }]}
              >
                <MaterialCommunityIcons
                  name={filterEmpresa === 'all' ? 'check-circle' : 'circle-outline'}
                  size={24}
                  color={filterEmpresa === 'all' ? scheme.primary : scheme.outline}
                />
                <PaperText
                  variant="bodyLarge"
                  style={{
                    color: filterEmpresa === 'all' ? scheme.onPrimaryContainer : scheme.onSurface,
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
                  android_ripple={{ color: scheme.primary + '1F' }}
                  style={[styles.modalItem, {
                    backgroundColor: filterEmpresa === company.id ? scheme.primaryContainer : 'transparent'
                  }]}
                >
                  <MaterialCommunityIcons
                    name={filterEmpresa === company.id ? 'check-circle' : 'circle-outline'}
                    size={24}
                    color={filterEmpresa === company.id ? scheme.primary : scheme.outline}
                  />
                  <PaperText
                    variant="bodyLarge"
                    style={{
                      color: filterEmpresa === company.id ? scheme.onPrimaryContainer : scheme.onSurface,
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
              <View style={[styles.emptyStateCircle, { backgroundColor: scheme.surfaceContainerHigh }]}>
                <MaterialCommunityIcons
                  name={searchQuery || filterEmpresa !== 'all' ? 'account-search' : 'account-group'}
                  size={64}
                  color={scheme.primary}
                />
              </View>
              <PaperText
                variant="headlineSmall"
                style={{ color: scheme.onSurface, fontWeight: '600', textAlign: 'center', marginBottom: 8 }}
              >
                {searchQuery || filterEmpresa !== 'all' ? 'Sin resultados' : 'Directorio vacío'}
              </PaperText>
              <PaperText
                variant="bodyLarge"
                style={{ color: scheme.onSurfaceVariant, textAlign: 'center', paddingHorizontal: 40 }}
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
