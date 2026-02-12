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
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';

/**
 * EmpresasScreen - Directorio de empresas
 * Material You Expressive Design
 * Solo lectura - consulta rápida
 */
export default function EmpresasScreen() {
  const navigation = useNavigation();
  const theme = useTheme();
  const { isDarkMode } = useAppTheme();

  // Surface colors dinámicos
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
      secondaryContainer: scheme.secondaryContainer,
      tertiary: scheme.tertiary,
      error: scheme.error,
      errorContainer: scheme.errorContainer,
      outline: scheme.outline,
      outlineVariant: scheme.outlineVariant,
    };
  }, [isDarkMode]);

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
      <SafeAreaView style={[styles.container, { backgroundColor: surfaceColors.surface }]}>
        {/* Header Material You Expressive */}
        <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 }}>
          {/* Header Top - Navigation Buttons */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.goBack();
              }}
              iconColor={surfaceColors.onSurface}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <IconButton
                icon="domain"
                mode="contained-tonal"
                size={20}
                iconColor={surfaceColors.primary}
                style={{
                  backgroundColor: surfaceColors.primaryContainer,
                }}
              />
            </View>
          </View>
          
          {/* Header Content - Title */}
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
              Empresas
            </PaperText>
            <PaperText style={{ 
              fontSize: 16,
              color: surfaceColors.onSurfaceVariant, 
              marginTop: 4
            }}>
              Directorio de Organizaciones
            </PaperText>
          </View>
        </View>
        <View style={styles.deniedContainer}>
          <MaterialCommunityIcons name="lock-outline" size={64} color={surfaceColors.outline} />
          <PaperText variant="titleMedium" style={[styles.deniedTitle, { color: surfaceColors.onSurface }]}>
            Acceso Restringido
          </PaperText>
          <PaperText variant="bodyMedium" style={[styles.deniedMessage, { color: surfaceColors.onSurfaceVariant }]}>
            No tienes permiso para ver el directorio de empresas. Contacta a tu administrador.
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
          {/* Header Top - Navigation Buttons */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.goBack();
              }}
              iconColor={surfaceColors.onSurface}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <IconButton
                icon="domain"
                mode="contained-tonal"
                size={20}
                iconColor={surfaceColors.primary}
                style={{
                  backgroundColor: surfaceColors.primaryContainer,
                }}
              />
            </View>
          </View>
          
          {/* Header Content - Title */}
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
              Empresas
            </PaperText>
            <PaperText style={{ 
              fontSize: 16,
              color: surfaceColors.onSurfaceVariant, 
              marginTop: 4
            }}>
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
        android_ripple={{ color: surfaceColors.primary + '1F' }}
        style={({ pressed }) => [
          styles.empresaCard,
          {
            backgroundColor: surfaceColors.surfaceContainerLow,
            borderColor: surfaceColors.outlineVariant,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          },
        ]}
      >
        {/* Logo / Avatar */}
        <View style={styles.logoContainer}>
          {hasLogo ? (
            <Image
              source={{ uri: item.logoURL }}
              style={[styles.logo, { backgroundColor: surfaceColors.surfaceContainer }]}
              resizeMode="contain"
            />
          ) : (
            <Avatar.Icon
              size={48}
              icon="domain"
              style={{ backgroundColor: surfaceColors.primaryContainer }}
              color={surfaceColors.onPrimaryContainer}
            />
          )}
        </View>

        {/* Info */}
        <View style={styles.infoContainer}>
          <PaperText
            variant="titleMedium"
            numberOfLines={1}
            style={{ color: surfaceColors.onSurface, fontWeight: '600' }}
          >
            {item.name || 'Sin nombre'}
          </PaperText>

          <PaperText
            variant="bodySmall"
            numberOfLines={1}
            style={{ color: surfaceColors.onSurfaceVariant, marginTop: 2 }}
          >
            NIT: {item.nit || 'No registrado'}
          </PaperText>

          <View style={styles.chipRow}>
            {item.city && (
              <Chip
                icon="map-marker"
                compact
                textStyle={styles.chipText}
                style={[styles.chip, { backgroundColor: surfaceColors.surfaceContainer }]}
              >
                {item.city}
              </Chip>
            )}
            {isContractExpired && (
              <Chip
                icon="alert-circle"
                compact
                textStyle={[styles.chipText, { color: surfaceColors.error }]}
                style={[styles.chip, { backgroundColor: surfaceColors.errorContainer }]}
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
          color={surfaceColors.outline}
        />
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: surfaceColors.surface }]}>
      {/* Header Material You Expressive */}
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 }}>
        {/* Header Top - Navigation Buttons */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.goBack();
            }}
            iconColor={surfaceColors.onSurface}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <IconButton
              icon="domain"
              mode="contained-tonal"
              size={20}
              onPress={() => {
                Haptics.selectionAsync();
                // Navegar a resumen de empresas o acción futura
              }}
              iconColor={surfaceColors.primary}
              style={{
                backgroundColor: surfaceColors.primaryContainer,
              }}
            />
          </View>
        </View>
        
        {/* Header Content - Title */}
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
            Empresas
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

      {/* Stats Chip */}
      <View style={styles.statsContainer}>
        <Surface
          style={[
            styles.statsChip,
            { backgroundColor: surfaceColors.primaryContainer },
          ]}
          elevation={0}
        >
          <MaterialCommunityIcons name="domain" size={24} color={surfaceColors.onPrimaryContainer} />
          <View style={{ marginLeft: 12 }}>
            <PaperText variant="labelSmall" style={{ color: surfaceColors.onPrimaryContainer }}>
              Total Organizaciones
            </PaperText>
            <PaperText variant="titleLarge" style={{ color: surfaceColors.onPrimaryContainer, fontWeight: '700' }}>
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
          style={[styles.searchbar, { backgroundColor: surfaceColors.surfaceContainerHigh }]}
          inputStyle={{ fontSize: 14 }}
          elevation={0}
        />
        <PaperText
          variant="labelSmall"
          style={[styles.resultCount, { color: surfaceColors.onSurfaceVariant }]}
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
              <View style={[styles.emptyStateCircle, { backgroundColor: surfaceColors.surfaceContainerHigh }]}>
                <MaterialCommunityIcons
                  name={searchQuery ? 'domain-off' : 'domain-plus'}
                  size={64}
                  color={surfaceColors.primary}
                />
              </View>
              <PaperText
                variant="headlineSmall"
                style={{ color: surfaceColors.onSurface, fontWeight: '600', textAlign: 'center', marginBottom: 8 }}
              >
                {searchQuery ? 'Sin resultados' : 'Directorio vacío'}
              </PaperText>
              <PaperText
                variant="bodyLarge"
                style={{ color: surfaceColors.onSurfaceVariant, textAlign: 'center', paddingHorizontal: 40 }}
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
