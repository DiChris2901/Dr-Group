import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Alert, Pressable } from 'react-native';
import { Text, TextInput, useTheme, ActivityIndicator } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import materialTheme from '../../material-theme.json';
import * as DocumentPicker from 'expo-document-picker';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import NotificationService from '../services/NotificationService';

export default function NovedadesSheet({ onClose, onSuccess, initialType }) {
  const { user, userProfile } = useAuth();
  const theme = useTheme();
  
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
      surfaceVariant: scheme.surfaceVariant,
      background: scheme.background
    };
  }, [theme.dark]);
  
  const [type, setType] = useState(initialType || 'llegada_tarde');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(false);

  const tiposNovedad = [
    { id: 'llegada_tarde', label: 'Llegada Tarde', icon: 'clock-alert-outline' },
    { id: 'olvido_salida', label: 'Olvido de Salida', icon: 'exit-run' },
    { id: 'solicitud_reapertura', label: 'Solicitud de Reapertura', icon: 'lock-open-variant-outline' },
    { id: 'urgencia_medica', label: 'Urgencia Médica', icon: 'hospital-box-outline' },
    { id: 'calamidad', label: 'Calamidad', icon: 'alert-circle-outline' },
    { id: 'otro', label: 'Otro', icon: 'pencil-outline' },
  ];

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (result.assets && result.assets.length > 0) {
        setAttachment(result.assets[0]);
      }
    } catch (err) {
      console.error('Error picking document:', err);
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Por favor describe la novedad');
      return;
    }

    setLoading(true);
    try {
      let attachmentUrl = null;
      if (attachment) {
        const response = await fetch(attachment.uri);
        const blob = await response.blob();
        const filename = `novedades/${user.uid}/${Date.now()}_${attachment.name}`;
        const storageRef = ref(storage, filename);
        await uploadBytes(storageRef, blob);
        attachmentUrl = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, 'novedades'), {
        uid: user.uid,
        userName: userProfile?.displayName || user.email,
        type,
        description,
        attachmentUrl,
        date: Timestamp.now(),
        status: 'pending', // pending, approved, rejected
        createdAt: Timestamp.now()
      });

      // ✅ Notificar al admin sobre nueva novedad
      const nombreEmpleado = userProfile?.name || userProfile?.displayName || user.email.split('@')[0];
      await NotificationService.notifyAdminNewNovedad(nombreEmpleado, type);

      Alert.alert('Éxito', 'Novedad reportada correctamente');
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (error) {
      console.error('Error reporting novedad:', error);
      Alert.alert('Error', 'No se pudo reportar la novedad');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: surfaceColors.background }]}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={{ fontWeight: '600', color: surfaceColors.onSurface, letterSpacing: -0.5 }}>Reportar Novedad</Text>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onClose();
          }}
          android_ripple={{ color: surfaceColors.onSurface + '1F', borderless: true }}
          style={({ pressed }) => [
            {
              padding: 8,
              borderRadius: 20,
              transform: [{ scale: pressed ? 0.9 : 1 }]
            }
          ]}
        >
          <MaterialCommunityIcons name="close" size={24} color={surfaceColors.onSurface} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="titleMedium" style={{ marginBottom: 12, color: surfaceColors.onSurfaceVariant, textTransform: 'uppercase', fontSize: 12, fontWeight: '600', letterSpacing: 0.8 }}>Tipo de Novedad</Text>
        <View style={styles.chipContainer}>
          {tiposNovedad.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => {
                Haptics.selectionAsync();
                setType(t.id);
              }}
              android_ripple={{ color: surfaceColors.primary + '1F' }}
              style={({ pressed }) => [
                {
                  flexDirection: 'row', // Horizontal layout para aspecto "chip grande"
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  borderRadius: 16, // Radio más cerrado para altura baja
                  backgroundColor: type === t.id ? surfaceColors.primaryContainer : surfaceColors.surfaceContainerLow,
                  borderWidth: type === t.id ? 0 : 1,
                  borderColor: type === t.id ? 'transparent' : surfaceColors.outlineVariant,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                  width: '48%', // 2 columnas
                  height: 64, // Altura muy reducida (angosta)
                  marginBottom: 0
                }
              ]}
            >
              <View style={{ 
                width: 32, 
                height: 32, 
                borderRadius: 16, 
                backgroundColor: type === t.id ? surfaceColors.onPrimaryContainer : surfaceColors.surfaceContainerHigh,
                alignItems: 'center', 
                justifyContent: 'center',
                marginRight: 10
              }}>
                <MaterialCommunityIcons 
                  name={t.icon} 
                  size={18} 
                  color={type === t.id ? surfaceColors.primaryContainer : surfaceColors.onSurfaceVariant} 
                />
              </View>
              
              <Text style={{ 
                flex: 1,
                color: type === t.id ? surfaceColors.onPrimaryContainer : surfaceColors.onSurface,
                fontWeight: type === t.id ? '700' : '500',
                fontSize: 12,
                letterSpacing: 0.1,
                lineHeight: 16
              }} numberOfLines={2}>
                {t.label}
              </Text>

              {type === t.id && (
                <MaterialCommunityIcons name="check-circle" size={16} color={surfaceColors.onPrimaryContainer} style={{ marginLeft: 4 }} />
              )}
            </Pressable>
          ))}
        </View>

        <TextInput
          label="Descripción detallada"
          value={description}
          onChangeText={setDescription}
          mode="outlined"
          multiline
          numberOfLines={6}
          style={[styles.input, { minHeight: 140, textAlignVertical: 'top' }]}
          outlineStyle={{ borderRadius: 20 }}
          theme={{ roundness: 20 }}
        />

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            pickDocument();
          }}
          android_ripple={{ color: surfaceColors.primary + '1F' }}
          style={({ pressed }) => [
            {
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 14,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: surfaceColors.primary,
              marginBottom: 12,
              transform: [{ scale: pressed ? 0.98 : 1 }]
            }
          ]}
        >
          <MaterialCommunityIcons 
            name={attachment ? "check" : "paperclip"} 
            size={20} 
            color={surfaceColors.primary}
            style={{ marginRight: 8 }}
          />
          <Text style={{ color: surfaceColors.primary, fontWeight: '500', fontSize: 15 }}>
            {attachment ? `Adjunto: ${attachment.name}` : 'Adjuntar Soporte (Opcional)'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            handleSubmit();
          }}
          android_ripple={{ color: surfaceColors.onPrimary + '1F' }}
          disabled={loading}
          style={({ pressed }) => [
            {
              padding: 16,
              borderRadius: 24,
              backgroundColor: loading ? surfaceColors.surfaceVariant : surfaceColors.primary,
              alignItems: 'center',
              marginTop: 24,
              marginBottom: 12,
              transform: [{ scale: pressed && !loading ? 0.98 : 1 }]
            }
          ]}
        >
          {loading ? (
            <ActivityIndicator color={surfaceColors.onSurfaceVariant} />
          ) : (
            <Text style={{ color: surfaceColors.onPrimary, fontWeight: '600', fontSize: 16 }}>
              Enviar Reporte
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    height: '85%', // Bottom sheet height
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  content: {
    paddingBottom: 40,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  chip: {
    marginBottom: 8,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  button: {
    marginBottom: 12,
  }
});
