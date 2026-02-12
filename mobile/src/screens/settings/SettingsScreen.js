import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Alert, Linking, Platform } from 'react-native';
import { Text, List, Switch, Avatar, Button, Divider, useTheme as usePaperTheme, Surface, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions'; // ✅ RBAC
import { APP_PERMISSIONS } from '../../constants/permissions';
import { OverlineText } from '../../components';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import materialTheme from '../../../material-theme.json';

export default function SettingsScreen({ navigation }) {
  const theme = usePaperTheme();
  const { isDarkMode, toggleDarkMode, getPrimaryColor, hapticsEnabled, toggleHaptics, hapticsIntensity, setIntensity, saveAllPreferences } = useTheme();
  const { userProfile, signOut } = useAuth();
  const { can, appRole, permissionCount, isSuperAdmin } = usePermissions(); // ✅ RBAC
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  // Surface colors dinámicos
  const surfaceColors = useMemo(() => {
    const scheme = theme.dark ? materialTheme.schemes.dark : materialTheme.schemes.light;
    return {
      surfaceContainerLow: scheme.surfaceContainerLow,
      surfaceContainer: scheme.surfaceContainer,
      surfaceContainerHigh: scheme.surfaceContainerHigh,
      onSurface: scheme.onSurface,
      onSurfaceVariant: scheme.onSurfaceVariant,
      primary: scheme.primary,
      onPrimary: scheme.onPrimary,
      primaryContainer: scheme.primaryContainer,
      onPrimaryContainer: scheme.onPrimaryContainer,
      background: scheme.background,
      outlineVariant: scheme.outlineVariant
    };
  }, [theme.dark]);

  const handleSavePreferences = useCallback(async () => {
    setSaving(true);
    try {
      await saveAllPreferences();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Éxito', 'Preferencias guardadas en la nube correctamente.');
    } catch (error) {
      Alert.alert('Error', 'No se pudieron guardar las preferencias.');
    } finally {
      setSaving(false);
    }
  }, [saveAllPreferences]);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);

  const checkBiometricStatus = useCallback(async () => {
    try {
      // 1. Check hardware support
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricSupported(compatible && enrolled);

      // 2. Check if enabled (credentials stored)
      const credentials = await SecureStore.getItemAsync('user_credentials');
      setBiometricEnabled(!!credentials);
    } catch (error) {
      console.log('Error checking biometrics:', error);
    }
  }, []);

  React.useEffect(() => {
    checkBiometricStatus();
  }, [checkBiometricStatus]);

  const toggleBiometric = useCallback(async (value) => {
    Haptics.selectionAsync();
    
    if (!value) {
      // Disable: Delete credentials
      try {
        await SecureStore.deleteItemAsync('user_credentials');
        setBiometricEnabled(false);
        Alert.alert('Biometría Desactivada', 'Ya no podrás iniciar sesión con huella/rostro.');
      } catch (error) {
        console.error(error);
      }
    } else {
      // Enable: Cannot do it here without password
      Alert.alert(
        'Habilitar Biometría',
        'Por seguridad, para habilitar la biometría debes cerrar sesión e iniciar nuevamente ingresando tu contraseña.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Cerrar Sesión', 
            onPress: () => handleSignOut() 
          }
        ]
      );
      // Keep switch off visually until they actually re-login
      setBiometricEnabled(false);
    }
  }, [handleSignOut]);

  const handleSignOut = useCallback(() => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro que deseas salir?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Salir", 
          style: "destructive", 
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            signOut();
          } 
        }
      ]
    );
  }, [signOut]);

  const SettingItem = useCallback(({ title, description, icon, right, onPress, color }) => (
    <Surface 
      style={[styles.settingItem, { backgroundColor: surfaceColors.surfaceContainerLow }]} 
      elevation={0}
    >
      <List.Item
        title={title}
        description={description}
        left={props => (
          <View style={[styles.iconContainer, { backgroundColor: (color || surfaceColors.primary) + '15' }]}>
            <MaterialCommunityIcons name={icon} size={24} color={color || surfaceColors.primary} />
          </View>
        )}
        right={right}
        onPress={onPress}
        titleStyle={{ fontWeight: '600', fontFamily: 'Roboto-Flex' }}
        descriptionStyle={{ color: surfaceColors.onSurfaceVariant }}
        style={{ paddingVertical: 8 }}
      />
    </Surface>
  ), [surfaceColors]);

  // ✅ Validación de permiso (después de todos los hooks)
  if (!can(APP_PERMISSIONS.SETTINGS)) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.deniedContainer}>
          <MaterialCommunityIcons name="shield-lock" size={64} color={theme.colors.error} />
          <Text variant="headlineSmall" style={{ marginTop: 16, fontWeight: '600' }}>🔒 Acceso Denegado</Text>
          <Text variant="bodyMedium" style={{ marginTop: 8, textAlign: 'center', paddingHorizontal: 32 }}>No tienes permiso para acceder a configuración</Text>
          <Button mode="contained" onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>Volver</Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: surfaceColors.background }]}>
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
          <IconButton
            icon="cog-outline"
            mode="contained-tonal"
            size={20}
            iconColor={surfaceColors.primary}
            style={{
              backgroundColor: surfaceColors.primaryContainer,
            }}
          />
        </View>
        
        {/* Header Content - Title */}
        <View style={{ paddingHorizontal: 4 }}>
          <Text style={{ 
            fontFamily: 'Roboto-Flex', 
            fontSize: 57,
            lineHeight: 64,
            fontWeight: '400', 
            color: surfaceColors.onSurface, 
            letterSpacing: -0.5,
            fontVariationSettings: [{ axis: 'wdth', value: 110 }]
          }}>
            Configuración
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <Avatar.Image 
            size={80} 
            source={{ uri: userProfile?.photoURL || 'https://ui-avatars.com/api/?name=' + (userProfile?.displayName || 'User') }} 
            style={{ backgroundColor: surfaceColors.primaryContainer }}
          />
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>{userProfile?.displayName || 'Usuario'}</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.secondary }}>{userProfile?.email}</Text>
            <Text variant="labelMedium" style={{ 
              color: surfaceColors.primary, 
              marginTop: 4, 
              backgroundColor: surfaceColors.primaryContainer, 
              alignSelf: 'flex-start', 
              paddingHorizontal: 8, 
              paddingVertical: 2, 
              borderRadius: 8 
            }}>
              {userProfile?.role === 'ADMIN' ? 'Administrador' : 'Colaborador'}
            </Text>
          </View>
          <IconButton 
            icon="pencil-outline" 
            mode="contained-tonal" 
            onPress={() => {
              Haptics.selectionAsync();
              navigation.navigate('EditProfile');
            }} 
          />
        </View>

        <Divider style={{ marginVertical: 24 }} />

        {/* General Settings */}
        <OverlineText color={surfaceColors.primary} style={{ marginBottom: 12 }}>GENERAL</OverlineText>
        
        <SettingItem
          title="Modo Oscuro"
          description="Ajustar apariencia de la aplicación"
          icon="theme-light-dark"
          right={() => (
            <Switch 
              value={isDarkMode} 
              onValueChange={() => {
                Haptics.selectionAsync();
                toggleDarkMode();
              }} 
              color={surfaceColors.primary}
            />
          )}
        />

        <SettingItem
          title="Vibración / Haptics"
          description="Respuesta táctil al tocar botones"
          icon="vibrate"
          right={() => (
            <Switch 
              value={hapticsEnabled} 
              onValueChange={() => {
                toggleHaptics();
              }} 
              color={surfaceColors.primary}
            />
          )}
        />

        {/* Haptics Intensity Selection */}
        {hapticsEnabled && (
          <View style={{ marginBottom: 24, paddingHorizontal: 16 }}>
            <Text variant="labelMedium" style={{ color: theme.colors.secondary, marginBottom: 8, marginLeft: 4 }}>
              Intensidad de vibración
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {['light', 'medium', 'heavy'].map((level) => (
                <Button
                  key={level}
                  mode={hapticsIntensity === level ? "contained" : "outlined"}
                  onPress={() => setIntensity(level)}
                  style={{ flex: 1, borderColor: theme.colors.outline }}
                  labelStyle={{ fontSize: 12 }}
                >
                  {level === 'light' ? 'Sutil' : level === 'medium' ? 'Media' : 'Fuerte'}
                </Button>
              ))}
            </View>
          </View>
        )}

        <SettingItem
          title="Notificaciones"
          description="Configurar alertas y recordatorios"
          icon="bell-cog"
          onPress={() => {
            Haptics.selectionAsync();
            navigation.navigate('NotificationPreferences');
          }}
          right={() => (
            <MaterialCommunityIcons 
              name="chevron-right" 
              size={24} 
              color={surfaceColors.onSurfaceVariant} 
            />
          )}
        />

        <SettingItem
          title="Biometría"
          description={biometricSupported ? "Usar FaceID / Huella para entrar" : "No disponible en este dispositivo"}
          icon="fingerprint"
          right={() => (
            <Switch 
              value={biometricEnabled} 
              onValueChange={toggleBiometric} 
              disabled={!biometricSupported}
              color={surfaceColors.primary}
            />
          )}
        />

        <View style={{ height: 24 }} />

        <Button 
          mode="contained" 
          onPress={handleSavePreferences}
          loading={saving}
          disabled={saving}
          style={{ borderRadius: 24 }}
          icon="cloud-upload"
        >
          Guardar Preferencias
        </Button>

        <View style={{ height: 24 }} />

        {/* ✅ RBAC: Información de Permisos */}
        <OverlineText color={surfaceColors.primary} style={{ marginBottom: 12 }}>PERMISOS</OverlineText>
        
        <Surface style={{ borderRadius: 24, padding: 16, marginBottom: 16, backgroundColor: surfaceColors.surfaceContainerLow }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text variant="labelMedium" style={{ color: surfaceColors.onSurfaceVariant, marginBottom: 4 }}>
                Rol en la App
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialCommunityIcons 
                  name={
                    isSuperAdmin ? "shield-crown" : 
                    appRole === 'ADMIN' ? "shield-account" : 
                    "shield-check"
                  } 
                  size={20} 
                  color={
                    isSuperAdmin ? "#ff6b6b" : 
                    appRole === 'ADMIN' ? "#4ecdc4" : 
                    "#95e1d3"
                  } 
                />
                <Text variant="titleMedium" style={{ fontWeight: '600' }}>
                  {appRole || 'USER'}
                </Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text variant="headlineSmall" style={{ fontWeight: 'bold', color: surfaceColors.primary }}>
                {permissionCount}/35
              </Text>
              <Text variant="labelSmall" style={{ color: surfaceColors.onSurfaceVariant }}>
                Permisos activos
              </Text>
            </View>
          </View>
        </Surface>

        <Divider style={{ marginVertical: 24 }} />

        {/* Support & Info */}
        <OverlineText color={surfaceColors.primary} style={{ marginBottom: 12 }}>SOPORTE</OverlineText>

        <SettingItem
          title="Ayuda y Soporte"
          description="Contactar al equipo técnico"
          icon="help-circle-outline"
          onPress={() => Linking.openURL('mailto:daruedagu@gmail.com')}
          right={props => <List.Icon {...props} icon="chevron-right" />}
        />

        <SettingItem
          title="Términos y Privacidad"
          description="Legal y condiciones de uso"
          icon="shield-check-outline"
          onPress={() => {}}
          right={props => <List.Icon {...props} icon="chevron-right" />}
        />

        <View style={{ height: 32 }} />

        <Button 
          mode="outlined" 
          onPress={handleSignOut}
          textColor={theme.colors.error}
          style={{ borderColor: theme.colors.error, borderRadius: 24 }}
          icon="logout"
        >
          Cerrar Sesión
        </Button>

        <Text style={{ textAlign: 'center', marginTop: 24, color: theme.colors.outline, fontSize: 12 }}>
          Versión {Constants.expoConfig?.version || '1.0.0'} • Build {Platform.OS === 'ios' ? Constants.expoConfig?.ios?.buildNumber : Constants.expoConfig?.android?.versionCode}
        </Text>

      </ScrollView>
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

  content: {
    padding: 24,
    paddingTop: 8,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  settingItem: {
    borderRadius: 24,
    marginBottom: 12,
    overflow: 'hidden'
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 8
  }
});
