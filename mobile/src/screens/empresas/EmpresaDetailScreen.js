import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Image,
  Linking,
  Alert,
  Animated,
} from 'react-native';
import {
  Text as PaperText,
  Surface,
  Avatar,
  Button,
  Divider,
  useTheme,
  IconButton,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

import { DetailRow, OverlineText, LoadingState } from '../../components';
import materialTheme from '../../../material-theme.json';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';

/**
 * EmpresaDetailScreen - Detalle completo de una empresa
 * Material You Expressive Design
 * 
 * Campos mostrados:
 * - Información general: nombre, NIT, email, teléfono, dirección, ciudad
 * - Contrato: número, fecha vencimiento
 * - Representante legal: nombre, cédula
 * - Información bancaria: banco, tipo cuenta, número cuenta, certificación PDF
 */
export default function EmpresaDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const theme = useTheme();
  const { isDarkMode } = useAppTheme();

  // Surface colors para Material You Expressive
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

  const { empresaId } = route.params || {};
  const [empresa, setEmpresa] = useState(null);
  const [loading, setLoading] = useState(true);

  // Animación fade in
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [empresa]);

  // Cargar datos de la empresa desde Firestore
  useEffect(() => {
    if (!empresaId) {
      setLoading(false);
      return;
    }

    const loadEmpresa = async () => {
      try {
        const docRef = doc(db, 'companies', empresaId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setEmpresa({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.error('Empresa no encontrada');
        }
      } catch (error) {
        console.error('Error al cargar empresa:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEmpresa();
  }, [empresaId]);

  // Formatear fecha
  const formatDate = useCallback((dateValue) => {
    if (!dateValue) return 'No especificada';
    try {
      const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
      return date.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return 'Fecha inválida';
    }
  }, []);

  // Verificar si contrato está vencido
  const contractStatus = useMemo(() => {
    if (!empresa?.contractExpirationDate) return { expired: false, label: '' };
    try {
      const expDate = empresa.contractExpirationDate.toDate
        ? empresa.contractExpirationDate.toDate()
        : new Date(empresa.contractExpirationDate);
      const now = new Date();
      const diffDays = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return { expired: true, label: `Vencido hace ${Math.abs(diffDays)} días`, color: surfaceColors.error };
      if (diffDays <= 30) return { expired: false, label: `Vence en ${diffDays} días`, color: surfaceColors.error };
      if (diffDays <= 90) return { expired: false, label: `Vence en ${diffDays} días`, color: surfaceColors.tertiary };
      return { expired: false, label: `Vigente (${diffDays} días)`, color: surfaceColors.primary };
    } catch {
      return { expired: false, label: '' };
    }
  }, [empresa, surfaceColors]);

  // Acciones de contacto
  const handleCall = useCallback((phone) => {
    if (!phone) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`tel:${phone}`);
  }, []);

  const handleEmail = useCallback((email) => {
    if (!email) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`mailto:${email}`);
  }, []);

  const handleOpenURL = useCallback((url, label) => {
    if (!url) {
      Alert.alert('No disponible', `No se encontró ${label}`);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', `No se pudo abrir ${label}`);
    });
  }, []);

  // Loading
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: surfaceColors.surface }]}>
        {/* Header Expresivo */}
        <View style={styles.headerContainer}>
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
        </View>
        <LoadingState message="Cargando información de la empresa..." />
      </SafeAreaView>
    );
  }

  if (!empresa) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: surfaceColors.surface }]}>
        {/* Header Expresivo */}
        <View style={styles.headerContainer}>
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
        </View>
        <View style={styles.errorContainer}>
          <PaperText>No se encontró la empresa</PaperText>
        </View>
      </SafeAreaView>
    );
  }

  const hasLogo = empresa.logoURL && empresa.logoURL.trim() !== '';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: surfaceColors.surface }]}>
      {/* Header Expresivo */}
      <View style={styles.headerContainer}>
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
          <View style={styles.actionButtons}>
            {empresa.phone && (
              <IconButton
                icon="phone"
                mode="contained-tonal"
                size={20}
                onPress={() => handleCall(empresa.phone)}
                iconColor={surfaceColors.primary}
                style={{
                  backgroundColor: surfaceColors.primaryContainer,
                  marginLeft: 8,
                }}
              />
            )}
            {empresa.email && (
              <IconButton
                icon="email"
                mode="contained-tonal"
                size={20}
                onPress={() => handleEmail(empresa.email)}
                iconColor={surfaceColors.primary}
                style={{
                  backgroundColor: surfaceColors.primaryContainer,
                  marginLeft: 8,
                }}
              />
            )}
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo & Name Header */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <Surface style={[styles.headerCard, { backgroundColor: surfaceColors.surfaceContainerLow }]} elevation={0}>
            {hasLogo ? (
              <Image
                source={{ uri: empresa.logoURL }}
                style={[styles.headerLogo, { backgroundColor: surfaceColors.surfaceContainer }]}
                resizeMode="contain"
              />
            ) : (
              <Avatar.Icon
                size={72}
                icon="domain"
                style={{ backgroundColor: surfaceColors.primaryContainer }}
                color={surfaceColors.onPrimaryContainer}
              />
            )}
            <PaperText
              variant="headlineLarge"
              style={[
                styles.headerName,
                {
                  color: surfaceColors.onSurface,
                  fontWeight: '600',
                  letterSpacing: -0.25,
                },
              ]}
            >
              {empresa.name}
            </PaperText>
            <PaperText variant="bodyLarge" style={{ color: surfaceColors.onSurfaceVariant, fontWeight: '500' }}>
              NIT: {empresa.nit || 'No registrado'}
            </PaperText>

          {/* Acciones rápidas */}
          <View style={styles.quickActions}>
            {empresa.phone && (
              <Button
                mode="contained-tonal"
                icon="phone"
                compact
                onPress={() => handleCall(empresa.phone)}
                style={styles.actionBtn}
                labelStyle={styles.actionBtnLabel}
              >
                Llamar
              </Button>
            )}
            {empresa.email && (
              <Button
                mode="contained-tonal"
                icon="email"
                compact
                onPress={() => handleEmail(empresa.email)}
                style={styles.actionBtn}
                labelStyle={styles.actionBtnLabel}
              >
                Email
              </Button>
            )}
          </View>
        </Surface>
        </Animated.View>

        {/* Información General */}
        <View style={styles.section}>
          <OverlineText color={surfaceColors.primary}>INFORMACIÓN GENERAL</OverlineText>
          <DetailRow icon="phone" label="Teléfono" value={empresa.phone || 'No registrado'} iconColor={surfaceColors.primary} />
          <DetailRow icon="map-marker" label="Dirección" value={empresa.address || 'No registrada'} iconColor={surfaceColors.primary} />
          <DetailRow icon="city" label="Ciudad" value={empresa.city || 'No registrada'} iconColor={surfaceColors.primary} />
        </View>

        <Divider style={[styles.divider, { backgroundColor: surfaceColors.outlineVariant }]} />

        {/* Contrato */}
        <View style={styles.section}>
          <OverlineText color={surfaceColors.tertiary}>CONTRATO</OverlineText>
          <DetailRow
            icon="file-document-outline"
            label="Número de Contrato"
            value={empresa.contractNumber || 'No registrado'}
            iconColor={surfaceColors.tertiary}
          />
          <DetailRow
            icon="calendar-clock"
            label="Vencimiento"
            value={formatDate(empresa.contractExpirationDate)}
            iconColor={surfaceColors.tertiary}
            highlight={contractStatus.expired}
            highlightColor={contractStatus.color}
          />
          {contractStatus.label ? (
            <View style={[styles.statusBadge, { backgroundColor: contractStatus.color + '1A' }]}>
              <MaterialCommunityIcons
                name={contractStatus.expired ? 'alert-circle' : 'clock-outline'}
                size={16}
                color={contractStatus.color}
              />
              <PaperText variant="labelSmall" style={{ color: contractStatus.color, fontWeight: '600' }}>
                {contractStatus.label}
              </PaperText>
            </View>
          ) : null}
        </View>

        <Divider style={[styles.divider, { backgroundColor: surfaceColors.outlineVariant }]} />

        {/* Representante Legal */}
        <View style={styles.section}>
          <OverlineText color={surfaceColors.secondary}>REPRESENTANTE LEGAL</OverlineText>
          <DetailRow
            icon="account-tie"
            label="Nombre"
            value={empresa.legalRepresentative || 'No registrado'}
            iconColor={surfaceColors.secondary}
          />
          <DetailRow
            icon="card-account-details"
            label="Cédula"
            value={empresa.legalRepresentativeId || 'No registrada'}
            iconColor={surfaceColors.secondary}
          />
        </View>

        <Divider style={[styles.divider, { backgroundColor: surfaceColors.outlineVariant }]} />

        {/* Información Bancaria */}
        <View style={styles.section}>
          <OverlineText color={surfaceColors.tertiary}>INFORMACIÓN BANCARIA</OverlineText>
          <DetailRow icon="bank" label="Banco" value={empresa.bankName || 'No registrado'} iconColor={surfaceColors.tertiary} />
          <DetailRow
            icon="credit-card-outline"
            label="Tipo de Cuenta"
            value={empresa.accountType || 'No especificado'}
            iconColor={surfaceColors.tertiary}
          />
          <DetailRow
            icon="numeric"
            label="Número de Cuenta"
            value={empresa.bankAccount || 'No registrado'}
            iconColor={surfaceColors.tertiary}
          />

          {empresa.bankCertificationURL && (
            <Button
              mode="outlined"
              icon="file-pdf-box"
              onPress={() => handleOpenURL(empresa.bankCertificationURL, 'Certificación Bancaria')}
              style={[styles.pdfButton, { borderColor: surfaceColors.outline }]}
              textColor={surfaceColors.primary}
            >
              Ver Certificación Bancaria
            </Button>
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  headerCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 24,
    marginBottom: 24,
  },
  headerLogo: {
    width: 72,
    height: 72,
    borderRadius: 16,
    marginBottom: 12,
  },
  headerName: {
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionBtn: {
    borderRadius: 24,
  },
  actionBtnLabel: {
    fontSize: 13,
  },
  section: {
    marginBottom: 12,
    gap: 12,
  },
  divider: {
    marginVertical: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  pdfButton: {
    borderRadius: 24,
    marginTop: 8,
  },
});
