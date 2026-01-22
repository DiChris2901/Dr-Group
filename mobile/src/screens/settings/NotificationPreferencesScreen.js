import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Switch, Surface, useTheme, Avatar, RadioButton, Button, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import materialTheme from '../../../material-theme.json';

export default function NotificationPreferencesScreen({ navigation }) {
  const theme = useTheme();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [settings, setSettings] = useState({
    sound: true,
    vibration: true,
    badge: true,
    presentationStyle: 'full', // 'full' | 'compact' | 'minimal'
    doNotDisturb: {
      enabled: false,
      startTime: '22:00',
      endTime: '07:00'
    }
  });

  const surfaceColors = theme.dark ? materialTheme.schemes.dark : materialTheme.schemes.light;

  const loadSettings = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const docRef = doc(db, 'users', user.uid, 'settings', 'notificationBehavior');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setSettings({ ...settings, ...snap.data() });
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
    }
  }, [user, settings]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleToggle = useCallback((key, value) => {
    Haptics.selectionAsync();
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
  }, [settings]);

  const handleDNDToggle = useCallback((value) => {
    Haptics.selectionAsync();
    const newSettings = { 
      ...settings, 
      doNotDisturb: { ...settings.doNotDisturb, enabled: value }
    };
    setSettings(newSettings);
  }, [settings]);

  const handlePresentationChange = useCallback((value) => {
    Haptics.selectionAsync();
    const newSettings = { ...settings, presentationStyle: value };
    setSettings(newSettings);
  }, [settings]);

  const saveSettings = useCallback(async () => {
    if (!user?.uid) return;
    
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      await setDoc(doc(db, 'users', user.uid, 'settings', 'notificationBehavior'), settings);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSnackbarVisible(true);
    } catch (error) {
      console.error('Error guardando configuración:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSaving(false);
    }
  }, [user, settings]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: surfaceColors.background }}>
      {/* Header */}
      <View style={{ padding: 24, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Avatar.Icon size={40} icon="arrow-left" style={{ backgroundColor: surfaceColors.surfaceVariant }} color={surfaceColors.onSurfaceVariant} />
          </TouchableOpacity>
          <Button 
            mode="text" 
            onPress={saveSettings} 
            disabled={saving}
            textColor={surfaceColors.primary}
            style={{ marginTop: -4 }}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </View>
        
        <Text 
          variant="displaySmall" 
          style={{ 
            fontFamily: 'Roboto-Flex', 
            fontWeight: '400', 
            letterSpacing: 0,
            color: surfaceColors.onBackground
          }}
        >
          Preferencias
        </Text>
        <Text variant="bodyLarge" style={{ color: surfaceColors.secondary, marginTop: 4 }}>
          Personaliza cómo recibes las notificaciones
        </Text>
      </View>

      {/* Info Banner */}
      <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
        <Surface 
          style={{ 
            padding: 16, 
            borderRadius: 24, 
            backgroundColor: surfaceColors.primaryContainer,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12
          }} 
          elevation={0}
        >
          <Avatar.Icon 
            size={40} 
            icon="information" 
            style={{ backgroundColor: surfaceColors.primary }} 
            color="white" 
          />
          <Text 
            variant="bodyMedium" 
            style={{ flex: 1, color: surfaceColors.onPrimaryContainer, lineHeight: 20 }}
          >
            Tu administrador controla QUÉ notificaciones recibes. Aquí personalizas CÓMO las recibes.
          </Text>
        </Surface>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}>
        {/* Sound */}
        <Surface style={[styles.card, { backgroundColor: surfaceColors.surfaceContainerLow }]} elevation={0}>
          <View style={styles.row}>
            <Avatar.Icon size={48} icon="volume-high" style={{ backgroundColor: surfaceColors.secondaryContainer }} color={surfaceColors.onSecondaryContainer} />
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text variant="titleLarge" style={{ fontWeight: '600', fontFamily: 'Roboto-Flex' }}>
                Sonido
              </Text>
              <Text variant="bodyMedium" style={{ color: surfaceColors.onSurfaceVariant, marginTop: 2 }}>
                Reproducir tono al recibir notificaciones
              </Text>
            </View>
            <Switch value={settings.sound} onValueChange={(val) => handleToggle('sound', val)} />
          </View>
        </Surface>

        {/* Vibration */}
        <Surface style={[styles.card, { backgroundColor: surfaceColors.surfaceContainerLow }]} elevation={0}>
          <View style={styles.row}>
            <Avatar.Icon size={48} icon="vibrate" style={{ backgroundColor: surfaceColors.tertiaryContainer }} color={surfaceColors.onTertiaryContainer} />
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text variant="titleLarge" style={{ fontWeight: '600', fontFamily: 'Roboto-Flex' }}>
                Vibración
              </Text>
              <Text variant="bodyMedium" style={{ color: surfaceColors.onSurfaceVariant, marginTop: 2 }}>
                Vibrar al recibir notificaciones
              </Text>
            </View>
            <Switch value={settings.vibration} onValueChange={(val) => handleToggle('vibration', val)} />
          </View>
        </Surface>

        {/* Badge */}
        <Surface style={[styles.card, { backgroundColor: surfaceColors.surfaceContainerLow }]} elevation={0}>
          <View style={styles.row}>
            <Avatar.Icon size={48} icon="numeric" style={{ backgroundColor: surfaceColors.errorContainer }} color={surfaceColors.error} />
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text variant="titleLarge" style={{ fontWeight: '600', fontFamily: 'Roboto-Flex' }}>
                Contador
              </Text>
              <Text variant="bodyMedium" style={{ color: surfaceColors.onSurfaceVariant, marginTop: 2 }}>
                Mostrar número de notificaciones pendientes
              </Text>
            </View>
            <Switch value={settings.badge} onValueChange={(val) => handleToggle('badge', val)} />
          </View>
        </Surface>

        {/* Presentation Style */}
        <Surface style={[styles.card, { backgroundColor: surfaceColors.surfaceContainerLow }]} elevation={0}>
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Avatar.Icon size={48} icon="card-text-outline" style={{ backgroundColor: surfaceColors.primaryContainer }} color={surfaceColors.onPrimaryContainer} />
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text variant="titleLarge" style={{ fontWeight: '600', fontFamily: 'Roboto-Flex' }}>
                  Presentación
                </Text>
                <Text variant="bodyMedium" style={{ color: surfaceColors.onSurfaceVariant, marginTop: 2 }}>
                  Nivel de detalle en notificaciones
                </Text>
              </View>
            </View>
          </View>

          <RadioButton.Group onValueChange={handlePresentationChange} value={settings.presentationStyle}>
            <TouchableOpacity 
              onPress={() => handlePresentationChange('full')}
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 16,
                backgroundColor: settings.presentationStyle === 'full' ? surfaceColors.primaryContainer : 'transparent',
                marginBottom: 8
              }}
              activeOpacity={0.7}
            >
              <RadioButton.Android value="full" color={surfaceColors.primary} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text variant="titleMedium" style={{ fontWeight: settings.presentationStyle === 'full' ? '600' : '500' }}>
                  📱 Completa
                </Text>
                <Text variant="bodySmall" style={{ color: surfaceColors.onSurfaceVariant, marginTop: 2 }}>
                  Título, mensaje completo y detalles
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => handlePresentationChange('compact')}
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 16,
                backgroundColor: settings.presentationStyle === 'compact' ? surfaceColors.primaryContainer : 'transparent',
                marginBottom: 8
              }}
              activeOpacity={0.7}
            >
              <RadioButton.Android value="compact" color={surfaceColors.primary} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text variant="titleMedium" style={{ fontWeight: settings.presentationStyle === 'compact' ? '600' : '500' }}>
                  📋 Compacta
                </Text>
                <Text variant="bodySmall" style={{ color: surfaceColors.onSurfaceVariant, marginTop: 2 }}>
                  Título y primeras líneas del mensaje
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => handlePresentationChange('minimal')}
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 16,
                backgroundColor: settings.presentationStyle === 'minimal' ? surfaceColors.primaryContainer : 'transparent'
              }}
              activeOpacity={0.7}
            >
              <RadioButton.Android value="minimal" color={surfaceColors.primary} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text variant="titleMedium" style={{ fontWeight: settings.presentationStyle === 'minimal' ? '600' : '500' }}>
                  🔔 Solo Título
                </Text>
                <Text variant="bodySmall" style={{ color: surfaceColors.onSurfaceVariant, marginTop: 2 }}>
                  Notificación minimalista sin detalles
                </Text>
              </View>
            </TouchableOpacity>
          </RadioButton.Group>
        </Surface>

        {/* Do Not Disturb */}
        <Surface style={[styles.card, { backgroundColor: surfaceColors.surfaceContainerLow }]} elevation={0}>
          <View style={styles.row}>
            <Avatar.Icon size={48} icon="moon-waning-crescent" style={{ backgroundColor: surfaceColors.surfaceContainerHigh }} color={surfaceColors.primary} />
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text variant="titleLarge" style={{ fontWeight: '600', fontFamily: 'Roboto-Flex' }}>
                No Molestar
              </Text>
              <Text variant="bodyMedium" style={{ color: surfaceColors.onSurfaceVariant, marginTop: 2 }}>
                Silenciar notificaciones de 10 PM a 7 AM
              </Text>
            </View>
            <Switch value={settings.doNotDisturb.enabled} onValueChange={handleDNDToggle} />
          </View>
        </Surface>

        {/* Explanation */}
        <View style={{ marginTop: 32, paddingHorizontal: 8 }}>
          <Text variant="bodyMedium" style={{ color: surfaceColors.onSurfaceVariant, textAlign: 'center', lineHeight: 20 }}>
            Las preferencias de contenido (Parafiscales, Asistencia, etc.) son configuradas por tu administrador.
          </Text>
        </View>
      </ScrollView>

      {/* Snackbar de confirmación */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2000}
        style={{ backgroundColor: surfaceColors.inverseSurface }}
      >
        <Text style={{ color: surfaceColors.inverseOnSurface }}>✅ Preferencias guardadas</Text>
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
