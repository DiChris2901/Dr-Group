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
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function NovedadesScreen({ navigation }) {
  const { user, userProfile } = useAuth();
  const { getGradient, getPrimaryColor, getSecondaryColor } = useTheme();
  
  const [type, setType] = useState('llegada_tarde');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const tiposNovedad = [
    { id: 'llegada_tarde', label: '⏰ Llegada Tarde', icon: 'access-time' },
    { id: 'olvido_salida', label: '🏃 Olvido de Salida', icon: 'exit-to-app' },
    { id: 'cita_medica', label: '🏥 Cita Médica', icon: 'local-hospital' },
    { id: 'calamidad', label: '🚨 Calamidad', icon: 'warning' },
    { id: 'otro', label: '📝 Otro', icon: 'edit' },
  ];

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Por favor describe la novedad');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'novedades'), {
        uid: user.uid,
        userName: userProfile?.name || user.email,
        userEmail: user.email,
        type,
        description: description.trim(),
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
