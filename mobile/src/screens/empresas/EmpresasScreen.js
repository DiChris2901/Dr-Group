import React, { useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Pressable,
  Image,
} from 'react-native';
import {
  Searchbar,
  Text as PaperText,
  Surface,
  Avatar,
  Chip,
  useTheme,
  IconButton,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useEmpresas } from '../../hooks/useEmpresas';
import { LoadingState } from '../../components';
import materialTheme from '../../../material-theme.json';

/**
 * EmpresasScreen - Directorio de empresas
 * Material You Expressive Design
 * Solo lectura - consulta rápida
 */
export default function EmpresasScreen() {
  const navigation = useNavigation();
  const theme = useTheme();
  const isDark = theme.dark;
  const scheme = isDark ? materialTheme.schemes.dark : materialTheme.schemes.light;

  const {
    filteredEmpresas,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    hasPermission,
    totalCount,
    filteredCount,
  } = useEmpresas();

  const handlePressEmpresa = useCallback((empresa) => {
    Haptics.selectionAsync();
    navigation.navigate('EmpresaDetail', { empresaId: empresa.id });
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
              Empresas
            </PaperText>
            <PaperText variant="titleMedium" style={{ color: scheme.onSurfaceVariant }}>
              Directorio de Organizaciones
            </PaperText>
          </View>
        </View>
        <View style={styles.deniedContainer}>
          <MaterialCommunityIcons name="lock-outline" size={64} color={scheme.outline} />
          <PaperText variant="titleMedium" style={[styles.deniedTitle, { color: scheme.onSurface }]}>
            Acceso Restringido
          </PaperText>
          <PaperText variant="bodyMedium" style={[styles.deniedMessage, { color: scheme.onSurfaceVariant }]}>
            No tienes permiso para ver el directorio de empresas. Contacta a tu administrador.
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
              Empresas
            </PaperText>
            <PaperText variant="titleMedium" style={{ color: scheme.onSurfaceVariant }}>
              Directorio de Organizaciones
            </PaperText>
          </View>
        </View>
        <LoadingState message="Cargando directorio de empresas..." />
      </SafeAreaView>
    );
  }

  const renderEmpresaItem = ({ item }) => {
    const hasLogo = item.logoURL && item.logoURL.trim() !== '';
    const isContractExpired = item.contractExpirationDate
      ? new Date(item.contractExpirationDate.toDate ? item.contractExpirationDate.toDate() : item.contractExpirationDate) < new Date()
      : false;

    return (
      <Pressable
        onPress={() => handlePressEmpresa(item)}
        android_ripple={{ color: scheme.primary + '1F' }}
        style={({ pressed }) => [
          styles.empresaCard,
          {
            backgroundColor: scheme.surfaceContainerLow,
            borderColor: scheme.outlineVariant,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          },
        ]}
      >
        {/* Logo / Avatar */}
        <View style={styles.logoContainer}>
          {hasLogo ? (
            <Image
              source={{ uri: item.logoURL }}
              style={[styles.logo, { backgroundColor: scheme.surfaceContainer }]}
              resizeMode="contain"
            />
          ) : (
            <Avatar.Icon
              size={48}
              icon="domain"
              style={{ backgroundColor: scheme.primaryContainer }}
              color={scheme.onPrimaryContainer}
            />
          )}
        </View>

        {/* Info */}
        <View style={styles.infoContainer}>
          <PaperText
            variant="titleMedium"
            numberOfLines={1}
            style={{ color: scheme.onSurface, fontWeight: '600' }}
          >
            {item.name || 'Sin nombre'}
          </PaperText>

          <PaperText
            variant="bodySmall"
            numberOfLines={1}
            style={{ color: scheme.onSurfaceVariant, marginTop: 2 }}
          >
            NIT: {item.nit || 'No registrado'}
          </PaperText>

          <View style={styles.chipRow}>
            {item.city && (
              <Chip
                icon="map-marker"
                compact
                textStyle={styles.chipText}
                style={[styles.chip, { backgroundColor: scheme.surfaceContainer }]}
              >
                {item.city}
              </Chip>
            )}
            {isContractExpired && (
              <Chip
                icon="alert-circle"
                compact
                textStyle={[styles.chipText, { color: scheme.error }]}
                style={[styles.chip, { backgroundColor: scheme.errorContainer }]}
              >
                Vencido
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
              icon="domain"
              mode="contained-tonal"
              size={20}
              onPress={() => {
                Haptics.selectionAsync();
                // Navegar a resumen de empresas o acción futura
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
            Empresas
          </PaperText>
          <PaperText variant="titleMedium" style={{ color: scheme.onSurfaceVariant }}>
            {filteredCount} en el directorio
          </PaperText>
        </View>
      </View>

      {/* Stats Chip */}
      <View style={styles.statsContainer}>
        <Surface
          style={[
            styles.statsChip,
            { backgroundColor: scheme.primaryContainer },
          ]}
          elevation={0}
        >
          <MaterialCommunityIcons name="domain" size={24} color={scheme.onPrimaryContainer} />
          <View style={{ marginLeft: 12 }}>
            <PaperText variant="labelSmall" style={{ color: scheme.onPrimaryContainer }}>
              Total Organizaciones
            </PaperText>
            <PaperText variant="titleLarge" style={{ color: scheme.onPrimaryContainer, fontWeight: '700' }}>
              {totalCount}
            </PaperText>
          </View>
        </Surface>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Buscar por nombre, NIT, ciudad..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[styles.searchbar, { backgroundColor: scheme.surfaceContainerHigh }]}
          inputStyle={{ fontSize: 14 }}
          elevation={0}
        />
        <PaperText
          variant="labelSmall"
          style={[styles.resultCount, { color: scheme.onSurfaceVariant }]}
        >
          {filteredCount} de {totalCount} empresas
        </PaperText>
      </View>

      {/* List */}
      <FlatList
        data={filteredEmpresas}
        keyExtractor={(item) => item.id}
        renderItem={renderEmpresaItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
            <View style={styles.emptyStateContainer}>
              <View style={[styles.emptyStateCircle, { backgroundColor: scheme.surfaceContainerHigh }]}>
                <MaterialCommunityIcons
                  name={searchQuery ? 'domain-off' : 'domain-plus'}
                  size={64}
                  color={scheme.primary}
                />
              </View>
              <PaperText
                variant="headlineSmall"
                style={{ color: scheme.onSurface, fontWeight: '600', textAlign: 'center', marginBottom: 8 }}
              >
                {searchQuery ? 'Sin resultados' : 'Directorio vacío'}
              </PaperText>
              <PaperText
                variant="bodyLarge"
                style={{ color: scheme.onSurfaceVariant, textAlign: 'center', paddingHorizontal: 40 }}
              >
                {searchQuery
                  ? `No se encontraron empresas para "${searchQuery}"`
                  : 'No hay empresas registradas en el sistema'}
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
  statsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  statsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  searchbar: {
    borderRadius: 24,
  },
  resultCount: {
    textAlign: 'right',
    marginTop: 8,
    paddingRight: 8,
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
  empresaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
    borderWidth: 0.5,
    gap: 16,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 12,
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
