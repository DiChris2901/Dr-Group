import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import {
  Appbar,
  Text as PaperText,
  Surface,
  Avatar,
  Button,
  Divider,
  Chip,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

import { DetailRow, OverlineText, LoadingState } from '../../components';
import materialTheme from '../../../material-theme.json';

// Lista de bancos para referencia
const BANCOS_MAP = {
  bancolombia: 'Bancolombia',
  davivienda: 'Davivienda',
  'banco-bogota': 'Banco de Bogotá',
  bbva: 'BBVA',
  av_villas: 'AV Villas',
};

/**
 * EmpleadoDetailScreen - Detalle completo de un empleado
 * Material You Expressive Design
 * 
 * Campos mostrados:
 * - Datos personales: nombres, apellidos, documento, email, teléfono, edad, nacimiento, nacionalidad
 * - Empresa: empresa contratante, contrato, tipo vigencia, fechas, renovación
 * - Información bancaria: banco, tipo cuenta, número cuenta, certificado PDF
 * - Documentos: contrato, certificado bancario, documento identidad
 * - Estado laboral: activo/retirado, fecha retiro, motivo
 * 
 * Acciones: llamar, WhatsApp, email
 */
export default function EmpleadoDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const theme = useTheme();
  const isDark = theme.dark;
  const scheme = isDark ? materialTheme.schemes.dark : materialTheme.schemes.light;

  const { empleadoId } = route.params || {};
  const [empleado, setEmpleado] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar datos del empleado desde Firestore
  useEffect(() => {
    if (!empleadoId) {
      setLoading(false);
      return;
    }

    const loadEmpleado = async () => {
      try {
        const docRef = doc(db, 'empleados', empleadoId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setEmpleado({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.error('Empleado no encontrado');
        }
      } catch (error) {
        console.error('Error al cargar empleado:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEmpleado();
  }, [empleadoId]);

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

  // Calcular tiempo en empresa (desde timestamps, NO desde campo duracion)
  const tiempoEnEmpresa = useMemo(() => {
    if (!empleado?.fechaInicioContrato) return 'No especificado';
    try {
      const inicio = empleado.fechaInicioContrato.toDate
        ? empleado.fechaInicioContrato.toDate()
        : new Date(empleado.fechaInicioContrato);
      const fin = empleado.retirado && empleado.fechaRetiro
        ? (empleado.fechaRetiro.toDate ? empleado.fechaRetiro.toDate() : new Date(empleado.fechaRetiro))
        : new Date();
      
      const diffMs = fin - inicio;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const years = Math.floor(diffDays / 365);
      const months = Math.floor((diffDays % 365) / 30);
      const days = diffDays % 30;

      const parts = [];
      if (years > 0) parts.push(`${years} año${years > 1 ? 's' : ''}`);
      if (months > 0) parts.push(`${months} mes${months > 1 ? 'es' : ''}`);
      if (days > 0 && years === 0) parts.push(`${days} día${days > 1 ? 's' : ''}`);

      return parts.length > 0 ? parts.join(', ') : 'Recién ingresado';
    } catch {
      return 'No especificado';
    }
  }, [empleado]);

  // Calcular edad
  const edadCalculada = useMemo(() => {
    if (empleado?.edad) return `${empleado.edad} años`;
    if (!empleado?.fechaNacimiento) return 'No especificada';
    try {
      const nacimiento = empleado.fechaNacimiento.toDate
        ? empleado.fechaNacimiento.toDate()
        : new Date(empleado.fechaNacimiento);
      const hoy = new Date();
      let edad = hoy.getFullYear() - nacimiento.getFullYear();
      const m = hoy.getMonth() - nacimiento.getMonth();
      if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
      return `${edad} años`;
    } catch {
      return 'No especificada';
    }
  }, [empleado]);

  // Estado del contrato
  const contractStatus = useMemo(() => {
    if (empleado?.retirado) return { label: 'Retirado', color: scheme.error, icon: 'account-off' };
    if (!empleado?.fechaFinContrato) return { label: 'Activo', color: scheme.primary, icon: 'account-check' };
    try {
      const fin = empleado.fechaFinContrato.toDate
        ? empleado.fechaFinContrato.toDate()
        : new Date(empleado.fechaFinContrato);
      const diffDays = Math.ceil((fin - new Date()) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) return { label: 'Contrato vencido', color: scheme.error, icon: 'alert-circle' };
      if (diffDays <= 30) return { label: `Vence en ${diffDays} días`, color: scheme.tertiary, icon: 'clock-alert' };
      return { label: 'Activo', color: scheme.primary, icon: 'account-check' };
    } catch {
      return { label: 'Activo', color: scheme.primary, icon: 'account-check' };
    }
  }, [empleado, scheme]);

  // Acciones de contacto
  const handleCall = useCallback((phone) => {
    if (!phone) {
      Alert.alert('No disponible', 'No se registró teléfono para este empleado');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`tel:${phone}`);
  }, []);

  const handleWhatsApp = useCallback((phone) => {
    if (!phone) {
      Alert.alert('No disponible', 'No se registró teléfono para este empleado');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Limpiar número y agregar código de Colombia si es necesario
    let cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    if (!cleanPhone.startsWith('+') && !cleanPhone.startsWith('57')) {
      cleanPhone = '57' + cleanPhone;
    }
    if (cleanPhone.startsWith('+')) {
      cleanPhone = cleanPhone.substring(1);
    }
    Linking.openURL(`https://wa.me/${cleanPhone}`).catch(() => {
      Alert.alert('Error', 'No se pudo abrir WhatsApp');
    });
  }, []);

  const handleEmail = useCallback((email) => {
    if (!email) {
      Alert.alert('No disponible', 'No se registró email para este empleado');
      return;
    }
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
      <SafeAreaView style={[styles.container, { backgroundColor: scheme.surface }]}>
        <Appbar.Header style={{ backgroundColor: scheme.surface }} elevated={false}>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Empleado" />
        </Appbar.Header>
        <LoadingState message="Cargando información del empleado..." />
      </SafeAreaView>
    );
  }

  if (!empleado) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: scheme.surface }]}>
        <Appbar.Header style={{ backgroundColor: scheme.surface }} elevated={false}>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Empleado" />
        </Appbar.Header>
        <View style={styles.errorContainer}>
          <PaperText>No se encontró el empleado</PaperText>
        </View>
      </SafeAreaView>
    );
  }

  const fullName = `${empleado.nombres || ''} ${empleado.apellidos || ''}`.trim();
  const initials = `${(empleado.nombres || '').charAt(0)}${(empleado.apellidos || '').charAt(0)}`.toUpperCase();
  const isRetirado = empleado.retirado === true;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: scheme.surface }]}>
      {/* Header */}
      <Appbar.Header style={{ backgroundColor: scheme.surface }} elevated={false}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={fullName || 'Empleado'} titleStyle={{ fontSize: 16 }} />
      </Appbar.Header>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <Surface style={[styles.headerCard, { backgroundColor: scheme.surfaceContainerLow }]} elevation={0}>
          <Avatar.Text
            size={72}
            label={initials}
            style={{
              backgroundColor: isRetirado ? scheme.errorContainer : scheme.primaryContainer,
            }}
            labelStyle={{
              color: isRetirado ? scheme.onErrorContainer : scheme.onPrimaryContainer,
              fontWeight: '700',
              fontSize: 28,
            }}
          />
          <PaperText variant="headlineSmall" style={[styles.headerName, { color: scheme.onSurface }]}>
            {fullName}
          </PaperText>

          {/* Status Badge */}
          <Chip
            icon={contractStatus.icon}
            style={[styles.statusChip, { backgroundColor: contractStatus.color + '1A' }]}
            textStyle={{ color: contractStatus.color, fontWeight: '600', fontSize: 12 }}
          >
            {contractStatus.label}
          </Chip>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <Button
              mode="contained-tonal"
              icon="phone"
              compact
              onPress={() => handleCall(empleado.telefono)}
              style={styles.actionBtn}
              labelStyle={styles.actionBtnLabel}
            >
              Llamar
            </Button>
            <Button
              mode="contained-tonal"
              icon="whatsapp"
              compact
              onPress={() => handleWhatsApp(empleado.telefono)}
              style={[styles.actionBtn, { backgroundColor: '#25D366' + '20' }]}
              labelStyle={styles.actionBtnLabel}
              textColor="#25D366"
            >
              WhatsApp
            </Button>
            <Button
              mode="contained-tonal"
              icon="email"
              compact
              onPress={() => handleEmail(empleado.emailCorporativo)}
              style={styles.actionBtn}
              labelStyle={styles.actionBtnLabel}
            >
              Email
            </Button>
          </View>
        </Surface>

        {/* Datos Personales */}
        <View style={styles.section}>
          <OverlineText color={scheme.primary}>DATOS PERSONALES</OverlineText>
          <DetailRow icon="account" label="Nombres" value={empleado.nombres || 'No registrado'} iconColor={scheme.primary} />
          <DetailRow icon="account" label="Apellidos" value={empleado.apellidos || 'No registrado'} iconColor={scheme.primary} />
          <DetailRow icon="flag" label="Nacionalidad" value={empleado.nacionalidad || 'No registrada'} iconColor={scheme.primary} />
          <DetailRow
            icon="card-account-details"
            label={empleado.tipoDocumento || 'Documento'}
            value={empleado.numeroDocumento || 'No registrado'}
            iconColor={scheme.primary}
          />
          <DetailRow icon="email-outline" label="Email Corporativo" value={empleado.emailCorporativo || 'No registrado'} iconColor={scheme.primary} />
          <DetailRow icon="phone" label="Teléfono" value={empleado.telefono || 'No registrado'} iconColor={scheme.primary} />
          <DetailRow icon="cake-variant" label="Edad" value={edadCalculada} iconColor={scheme.primary} />
          <DetailRow icon="calendar" label="Fecha de Nacimiento" value={formatDate(empleado.fechaNacimiento)} iconColor={scheme.primary} />
        </View>

        <Divider style={[styles.divider, { backgroundColor: scheme.outlineVariant }]} />

        {/* Información Laboral */}
        <View style={styles.section}>
          <OverlineText color={scheme.tertiary}>INFORMACIÓN LABORAL</OverlineText>
          <DetailRow
            icon="domain"
            label="Empresa Contratante"
            value={empleado.empresaContratanteName || empleado.empresaContratante || 'No especificada'}
            iconColor={scheme.tertiary}
          />
          <DetailRow
            icon="calendar-start"
            label="Inicio de Contrato"
            value={formatDate(empleado.fechaInicioContrato)}
            iconColor={scheme.tertiary}
          />
          <DetailRow
            icon="file-document-outline"
            label="Tipo de Vigencia"
            value={empleado.tipoVigencia || 'No especificado'}
            iconColor={scheme.tertiary}
          />
          <DetailRow
            icon="calendar-end"
            label="Fin de Contrato"
            value={formatDate(empleado.fechaFinContrato)}
            iconColor={scheme.tertiary}
          />
          <DetailRow
            icon="autorenew"
            label="Se Renueva"
            value={empleado.seRenueva === true ? 'Sí' : empleado.seRenueva === false ? 'No' : 'No especificado'}
            iconColor={scheme.tertiary}
          />
          <DetailRow
            icon="clock-outline"
            label="Tiempo en Empresa"
            value={tiempoEnEmpresa}
            iconColor={scheme.tertiary}
            highlight
            highlightColor={scheme.primary}
          />
        </View>

        <Divider style={[styles.divider, { backgroundColor: scheme.outlineVariant }]} />

        {/* Información Bancaria */}
        <View style={styles.section}>
          <OverlineText color={scheme.tertiary}>INFORMACIÓN BANCARIA</OverlineText>
          <DetailRow icon="bank" label="Banco" value={empleado.banco || 'No registrado'} iconColor={scheme.tertiary} />
          <DetailRow
            icon="credit-card-outline"
            label="Tipo de Cuenta"
            value={empleado.tipoCuenta || 'No especificado'}
            iconColor={scheme.tertiary}
          />
          <DetailRow
            icon="numeric"
            label="Número de Cuenta"
            value={empleado.numeroCuenta || 'No registrado'}
            iconColor={scheme.tertiary}
          />
        </View>

        <Divider style={[styles.divider, { backgroundColor: scheme.outlineVariant }]} />

        {/* Documentos */}
        <View style={styles.section}>
          <OverlineText color={scheme.secondary}>DOCUMENTOS</OverlineText>

          <View style={styles.docsGrid}>
            {empleado.contratoURL && (
              <Button
                mode="outlined"
                icon="file-document"
                onPress={() => handleOpenURL(empleado.contratoURL, 'Contrato')}
                style={[styles.docButton, { borderColor: scheme.outline }]}
                textColor={scheme.primary}
                contentStyle={styles.docButtonContent}
                labelStyle={{ fontSize: 12 }}
              >
                Contrato
              </Button>
            )}
            {empleado.certificadoBancarioURL && (
              <Button
                mode="outlined"
                icon="bank"
                onPress={() => handleOpenURL(empleado.certificadoBancarioURL, 'Certificado Bancario')}
                style={[styles.docButton, { borderColor: scheme.outline }]}
                textColor={scheme.primary}
                contentStyle={styles.docButtonContent}
                labelStyle={{ fontSize: 12 }}
              >
                Cert. Bancario
              </Button>
            )}
            {empleado.documentoIdentidadURL && (
              <Button
                mode="outlined"
                icon="card-account-details"
                onPress={() => handleOpenURL(empleado.documentoIdentidadURL, 'Documento de Identidad')}
                style={[styles.docButton, { borderColor: scheme.outline }]}
                textColor={scheme.primary}
                contentStyle={styles.docButtonContent}
                labelStyle={{ fontSize: 12 }}
              >
                Doc. Identidad
              </Button>
            )}
          </View>

          {!empleado.contratoURL && !empleado.certificadoBancarioURL && !empleado.documentoIdentidadURL && (
            <Surface
              style={[styles.noDocsCard, { backgroundColor: scheme.surfaceContainerLow }]}
              elevation={0}
            >
              <MaterialCommunityIcons name="file-remove" size={32} color={scheme.outline} />
              <PaperText variant="bodySmall" style={{ color: scheme.onSurfaceVariant, marginTop: 8 }}>
                No hay documentos adjuntos
              </PaperText>
            </Surface>
          )}
        </View>

        {/* Estado Laboral (si retirado) */}
        {isRetirado && (
          <>
            <Divider style={[styles.divider, { backgroundColor: scheme.outlineVariant }]} />
            <View style={styles.section}>
              <OverlineText color={scheme.error}>ESTADO LABORAL</OverlineText>
              <Surface
                style={[styles.retiroCard, { backgroundColor: scheme.errorContainer + '40' }]}
                elevation={0}
              >
                <MaterialCommunityIcons name="account-off" size={32} color={scheme.error} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <PaperText variant="titleSmall" style={{ color: scheme.error, fontWeight: '600' }}>
                    Empleado Retirado
                  </PaperText>
                  <PaperText variant="bodySmall" style={{ color: scheme.onSurfaceVariant, marginTop: 4 }}>
                    Fecha: {formatDate(empleado.fechaRetiro)}
                  </PaperText>
                  {empleado.motivoRetiro && (
                    <PaperText variant="bodySmall" style={{ color: scheme.onSurfaceVariant, marginTop: 2 }}>
                      Motivo: {empleado.motivoRetiro}
                    </PaperText>
                  )}
                </View>
              </Surface>
            </View>
          </>
        )}

        {/* Spacer */}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  headerCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 24,
    marginBottom: 24,
  },
  headerName: {
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  statusChip: {
    marginTop: 8,
    borderRadius: 16,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  actionBtn: {
    borderRadius: 24,
  },
  actionBtnLabel: {
    fontSize: 12,
  },
  section: {
    marginBottom: 8,
    gap: 8,
  },
  divider: {
    marginVertical: 16,
  },
  docsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  docButton: {
    borderRadius: 24,
    flex: 1,
    minWidth: '45%',
  },
  docButtonContent: {
    paddingVertical: 4,
  },
  noDocsCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 20,
  },
  retiroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
  },
});
