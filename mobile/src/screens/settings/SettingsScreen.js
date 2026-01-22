import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, Linking, Platform } from 'react-native';
import { Text, List, Switch, Avatar, Button, Divider, useTheme as usePaperTheme, Surface, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { OverlineText } from '../../components';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

export default function SettingsScreen({ navigation }) {
  const theme = usePaperTheme();
  const { isDarkMode, toggleDarkMode, getPrimaryColor, hapticsEnabled, toggleHaptics, hapticsIntensity, setIntensity, saveAllPreferences } = useTheme();
  const { userProfile, signOut } = useAuth();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

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
      style={[styles.settingItem, { backgroundColor: theme.colors.surface }]} 
      elevation={0}
    >
      <List.Item
        title={title}
        description={description}
        left={props => (
          <View style={[styles.iconContainer, { backgroundColor: (color || theme.colors.primary) + '15' }]}>
            <MaterialCommunityIcons name={icon} size={24} color={color || theme.colors.primary} />
          </View>
        )}
        right={right}
        onPress={onPress}
        titleStyle={{ fontWeight: '600', fontFamily: 'Roboto-Flex' }}
        descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
        style={{ paddingVertical: 8 }}
      />
    </Surface>
  ), [theme.colors]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton 
          icon="arrow-left" 
          size={28} 
          onPress={() => navigation.goBack()}
          style={{ marginLeft: -8 }}
        />
        <Text 
          style={{ 
            fontFamily: 'Roboto-Flex', 
            fontSize: 28, 
            fontWeight: '400',
            color: theme.colors.onSurface,
            fontVariationSettings: [{ axis: 'wdth', value: 110 }]
          }}
        >
          Configuración
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <Avatar.Image 
            size={80} 
            source={{ uri: userProfile?.photoURL || 'https://ui-avatars.com/api/?name=' + (userProfile?.displayName || 'User') }} 
            style={{ backgroundColor: theme.colors.primaryContainer }}
          />
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>{userProfile?.displayName || 'Usuario'}</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.secondary }}>{userProfile?.email}</Text>
            <Text variant="labelMedium" style={{ 
              color: theme.colors.primary, 
              marginTop: 4, 
              backgroundColor: theme.colors.primaryContainer, 
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
        <OverlineText color={theme.colors.primary} style={{ marginBottom: 12 }}>GENERAL</OverlineText>
        
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
              color={theme.colors.primary}
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
              color={theme.colors.primary}
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
              color={theme.colors.onSurfaceVariant} 
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
              color={theme.colors.primary}
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

        {/* Support & Info */}
        <OverlineText color={theme.colors.primary} style={{ marginBottom: 12 }}>SOPORTE</OverlineText>

        <SettingItem
          title="Ayuda y Soporte"
          description="Contactar al equipo técnico"
          icon="help-circle-outline"
          onPress={() => Linking.openURL('mailto:soporte@drgroup.com')}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    borderRadius: 16,
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
