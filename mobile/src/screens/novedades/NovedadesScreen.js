import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function NovedadesScreen({ navigation }) {
  const { user, userProfile } = useAuth();
  const { getGradient, getPrimaryColor, getSecondaryColor } = useTheme();
  
  const [type, setType] = useState('llegada_tarde');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(false);

  const tiposNovedad = [
    { id: 'llegada_tarde', label: '⏰ Llegada Tarde', icon: 'access-time' },
    { id: 'olvido_salida', label: '🏃 Olvido de Salida', icon: 'exit-to-app' },
    { id: 'urgencia_medica', label: '🏥 Urgencia Médica', icon: 'local-hospital' },
    { id: 'calamidad', label: '🚨 Calamidad', icon: 'warning' },
    { id: 'otro', label: '📝 Otro', icon: 'edit' },
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
      Alert.alert('Error', 'No se pudo seleccionar el archivo');
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Por favor describe la novedad');
      return;
    }

    if (type === 'urgencia_medica' && !attachment) {
      Alert.alert('Requerido', 'Para urgencias médicas es obligatorio adjuntar la incapacidad o comprobante.');
      return;
    }

    setLoading(true);
    try {
      let attachmentUrl = null;
      let attachmentName = null;

      if (attachment) {
        const response = await fetch(attachment.uri);
        const blob = await response.blob();
        const filename = `novedades/${user.uid}/${Date.now()}_${attachment.name}`;
        const storageRef = ref(storage, filename);
        
        await uploadBytes(storageRef, blob);
        attachmentUrl = await getDownloadURL(storageRef);
        attachmentName = attachment.name;
      }

      await addDoc(collection(db, 'novedades'), {
        uid: user.uid,
        userName: userProfile?.name || user.email,
        userEmail: user.email,
        type,
        description: description.trim(),
        attachmentUrl,
        attachmentName,
        date: Timestamp.now(),
        status: 'pending', // pending, approved, rejected
        createdAt: Timestamp.now()
      });

      Alert.alert(
        'Éxito',
        'Novedad reportada correctamente. Tu administrador la revisará pronto.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo enviar el reporte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={getGradient()}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reportar Novedad</Text>
      </LinearGradient>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
          <Text style={styles.sectionTitle}>Tipo de Novedad</Text>
          <View style={styles.typesGrid}>
            {tiposNovedad.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.typeCard,
                  type === item.id && { borderColor: getPrimaryColor(), backgroundColor: getPrimaryColor() + '10' }
                ]}
                onPress={() => setType(item.id)}
              >
                <MaterialIcons 
                  name={item.icon} 
                  size={32} 
                  color={type === item.id ? getPrimaryColor() : '#8e8e93'} 
                />
                <Text style={[
                  styles.typeLabel,
                  type === item.id && { color: getPrimaryColor(), fontWeight: '700' }
                ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {type === 'urgencia_medica' && (
            <View style={styles.attachmentSection}>
              <Text style={styles.sectionTitle}>Comprobante (Incapacidad)</Text>
              <TouchableOpacity 
                style={[styles.uploadButton, { borderColor: getPrimaryColor() }]} 
                onPress={pickDocument}
              >
                <MaterialIcons 
                  name={attachment ? "check-circle" : "cloud-upload"} 
                  size={32} 
                  color={attachment ? "#4caf50" : getPrimaryColor()} 
                />
                <View style={styles.uploadTextContainer}>
                  <Text style={[styles.uploadTitle, { color: getPrimaryColor() }]}>
                    {attachment ? "Archivo seleccionado" : "Adjuntar Incapacidad"}
                  </Text>
                  <Text style={styles.uploadSubtitle} numberOfLines={1}>
                    {attachment ? attachment.name : "Toca para seleccionar PDF o Imagen"}
                  </Text>
                </View>
                {attachment && (
                  <TouchableOpacity onPress={() => setAttachment(null)} style={styles.removeButton}>
                    <MaterialIcons name="close" size={20} color="#ff5252" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.sectionTitle}>Descripción / Justificación</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textArea}
              placeholder="Explica detalladamente lo sucedido..."
              placeholderTextColor="#aeb0b2"
              multiline
              numberOfLines={6}
              value={description}
              onChangeText={setDescription}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: getPrimaryColor() }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Enviar Reporte</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 12,
    marginTop: 8,
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  typeCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  typeLabel: {
    marginTop: 8,
    fontSize: 13,
    color: '#8e8e93',
    textAlign: 'center',
  },
  attachmentSection: {
    marginBottom: 24,
  },
  uploadButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  uploadTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontSize: 12,
    color: '#8e8e93',
  },
  removeButton: {
    padding: 8,
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  textArea: {
    fontSize: 16,
    color: '#1c1c1e',
    minHeight: 120,
  },
  submitButton: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
