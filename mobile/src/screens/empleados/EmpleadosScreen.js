import React, { useCallback, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Pressable,
} from 'react-native';
import {
  Appbar,
  Searchbar,
  Text as PaperText,
  Surface,
  Avatar,
  Chip,
  Menu,
  IconButton,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useEmpleados } from '../../hooks/useEmpleados';
import { LoadingState, EmptyState } from '../../components';
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

  const [empresaMenuVisible, setEmpresaMenuVisible] = useState(false);
  const [estadoMenuVisible, setEstadoMenuVisible] = useState(false);

  const handlePressEmpleado = useCallback((empleado) => {
    Haptics.selectionAsync();
    navigation.navigate('EmpleadoDetail', { empleadoId: empleado.id });
  }, [navigation]);

  // Sin permiso
  if (!hasPermission) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: scheme.surface }]}>
        <Appbar.Header style={{ backgroundColor: scheme.surface }} elevated={false}>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Empleados" />
        </Appbar.Header>
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
        <Appbar.Header style={{ backgroundColor: scheme.surface }} elevated={false}>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Empleados" />
        </Appbar.Header>
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
      {/* Header */}
      <Appbar.Header style={{ backgroundColor: scheme.surface }} elevated={false}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Empleados" />
      </Appbar.Header>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <Surface
          style={[styles.statChip, { backgroundColor: scheme.primaryContainer }]}
          elevation={0}
        >
          <PaperText variant="titleMedium" style={{ color: scheme.onPrimaryContainer, fontWeight: '700' }}>
            {stats.activos}
          </PaperText>
          <PaperText variant="labelSmall" style={{ color: scheme.onPrimaryContainer }}>
            Activos
          </PaperText>
        </Surface>
        <Surface
          style={[styles.statChip, { backgroundColor: scheme.errorContainer }]}
          elevation={0}
        >
          <PaperText variant="titleMedium" style={{ color: scheme.onErrorContainer, fontWeight: '700' }}>
            {stats.retirados}
          </PaperText>
          <PaperText variant="labelSmall" style={{ color: scheme.onErrorContainer }}>
            Retirados
          </PaperText>
        </Surface>
        <Surface
          style={[styles.statChip, { backgroundColor: scheme.surfaceContainerHigh }]}
          elevation={0}
        >
          <PaperText variant="titleMedium" style={{ color: scheme.onSurface, fontWeight: '700' }}>
            {stats.total}
          </PaperText>
          <PaperText variant="labelSmall" style={{ color: scheme.onSurfaceVariant }}>
            Total
          </PaperText>
        </Surface>
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
        <Menu
          visible={empresaMenuVisible}
          onDismiss={() => setEmpresaMenuVisible(false)}
          anchor={
            <Chip
              icon="domain"
              onPress={() => {
                Haptics.selectionAsync();
                setEmpresaMenuVisible(true);
              }}
              selected={filterEmpresa !== 'all'}
              showSelectedOverlay
              compact
              style={[styles.filterChip, { backgroundColor: filterEmpresa !== 'all' ? scheme.secondaryContainer : scheme.surfaceContainerHigh }]}
              textStyle={{ fontSize: 12, color: filterEmpresa !== 'all' ? scheme.onSecondaryContainer : scheme.onSurfaceVariant }}
            >
              {filterEmpresa === 'all' ? 'Empresa' : getCompanyName(filterEmpresa).substring(0, 15)}
            </Chip>
          }
        >
          <Menu.Item
            title="Todas"
            onPress={() => {
              setFilterEmpresa('all');
              setEmpresaMenuVisible(false);
            }}
          />
          {companies.map((c) => (
            <Menu.Item
              key={c.id}
              title={c.name}
              onPress={() => {
                setFilterEmpresa(c.id);
                setEmpresaMenuVisible(false);
              }}
            />
          ))}
        </Menu>

        {/* Filtro estado */}
        <Menu
          visible={estadoMenuVisible}
          onDismiss={() => setEstadoMenuVisible(false)}
          anchor={
            <Chip
              icon="account-check"
              onPress={() => {
                Haptics.selectionAsync();
                setEstadoMenuVisible(true);
              }}
              selected={filterEstado !== 'activos'}
              showSelectedOverlay
              compact
              style={[styles.filterChip, { backgroundColor: filterEstado !== 'activos' ? scheme.tertiaryContainer : scheme.surfaceContainerHigh }]}
              textStyle={{ fontSize: 12, color: filterEstado !== 'activos' ? scheme.onTertiaryContainer : scheme.onSurfaceVariant }}
            >
              {estadoLabels[filterEstado]}
            </Chip>
          }
        >
          <Menu.Item title="Activos" onPress={() => { setFilterEstado('activos'); setEstadoMenuVisible(false); }} />
          <Menu.Item title="Retirados" onPress={() => { setFilterEstado('retirados'); setEstadoMenuVisible(false); }} />
          <Menu.Item title="Todos" onPress={() => { setFilterEstado('todos'); setEstadoMenuVisible(false); }} />
        </Menu>

        {/* Resultado count */}
        <PaperText
          variant="labelSmall"
          style={[styles.resultCount, { color: scheme.onSurfaceVariant }]}
        >
          {filteredCount} resultados
        </PaperText>
      </View>

      {/* List */}
      <FlatList
        data={filteredEmpleados}
        keyExtractor={(item) => item.id}
        renderItem={renderEmpleadoItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={
          <EmptyState
            icon="account-search"
            message={
              searchQuery
                ? `No se encontraron empleados para "${searchQuery}"`
                : 'No hay empleados registrados con estos filtros'
            }
            iconColor={scheme.outline}
          />
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
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  statChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 16,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchbar: {
    borderRadius: 24,
  },
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    borderRadius: 20,
  },
  resultCount: {
    marginLeft: 'auto',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },
  empleadoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    borderWidth: 0.5,
    gap: 12,
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
});
