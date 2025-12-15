import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, TextInput, Chip, useTheme, IconButton, ActivityIndicator } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';

export default function NovedadesSheet({ onClose, onSuccess }) {
  const { user, userProfile } = useAuth();
  const theme = useTheme();
  
  const [type, setType] = useState('llegada_tarde');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(false);

  const tiposNovedad = [
    { id: 'llegada_tarde', label: 'Llegada Tarde', icon: 'clock-alert-outline' },
    { id: 'olvido_salida', label: 'Olvido de Salida', icon: 'exit-run' },
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
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.header}>
        <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>Reportar Novedad</Text>
        <IconButton icon="close" onPress={onClose} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="titleMedium" style={{ marginBottom: 12 }}>Tipo de Novedad</Text>
        <View style={styles.chipContainer}>
          {tiposNovedad.map((t) => (
            <Chip
              key={t.id}
              selected={type === t.id}
              onPress={() => setType(t.id)}
              showSelectedOverlay
              style={styles.chip}
              icon={t.icon}
            >
              {t.label}
            </Chip>
          ))}
        </View>

        <TextInput
          label="Descripción detallada"
          value={description}
          onChangeText={setDescription}
          mode="outlined"
          multiline
          numberOfLines={4}
          style={styles.input}
        />

        <Button 
          mode="outlined" 
          onPress={pickDocument} 
          icon={attachment ? "check" : "paperclip"}
          style={styles.button}
        >
          {attachment ? `Adjunto: ${attachment.name}` : 'Adjuntar Soporte (Opcional)'}
        </Button>

        <Button 
          mode="contained" 
          onPress={handleSubmit} 
          loading={loading}
          disabled={loading}
          style={[styles.button, { marginTop: 24 }]}
        >
          Enviar Reporte
        </Button>
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
