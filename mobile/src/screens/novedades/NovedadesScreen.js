import React, { useState, useEffect } from 'react';
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
  Platform,
  FlatList,
  RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { collection, addDoc, Timestamp, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function NovedadesScreen({ navigation }) {
  const { user, userProfile } = useAuth();
  const { getGradient, getPrimaryColor, getSecondaryColor } = useTheme();
  
  const [activeTab, setActiveTab] = useState('reportar'); // 'reportar' | 'historial'
  const [type, setType] = useState('llegada_tarde');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Historial states
  const [historial, setHistorial] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(true);

  const tiposNovedad = [
    { id: 'llegada_tarde', label: '⏰ Llegada Tarde', icon: 'access-time' },
    { id: 'olvido_salida', label: '🏃 Olvido de Salida', icon: 'exit-to-app' },
    { id: 'urgencia_medica', label: '🏥 Urgencia Médica', icon: 'local-hospital' },
    { id: 'calamidad', label: '🚨 Calamidad', icon: 'warning' },
    { id: 'otro', label: '📝 Otro', icon: 'edit' },
  ];

  useEffect(() => {
    if (activeTab === 'historial') {
      const q = query(
        collection(db, 'novedades'),
        where('uid', '==', user.uid),
        orderBy('date', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setHistorial(data);
        setLoadingHistorial(false);
      });

      return () => unsubscribe();
    }
  }, [activeTab, user.uid]);

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
        'Novedad reportada correctamente.',
        [
          { 
            text: 'Ver Historial', 
            onPress: () => {
              setDescription('');
              setAttachment(null);
              setActiveTab('historial');
            } 
          }
        ]
      );
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo enviar el reporte');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#4caf50'; // Verde
      case 'rejected': return '#f44336'; // Rojo
      default: return '#ff9800'; // Naranja (Pendiente)
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'approved': return 'Aprobado';
      case 'rejected': return 'Rechazado';
      default: return 'Pendiente';
    }
  };

  const renderHistorialItem = ({ item }) => (
    <View style={styles.historyCard}>
      <View style={styles.historyHeader}>
        <View style={styles.historyTypeContainer}>
          <MaterialIcons 
            name={tiposNovedad.find(t => t.id === item.type)?.icon || 'info'} 
            size={20} 
            color="#555" 
          />
          <Text style={styles.historyType}>
            {tiposNovedad.find(t => t.id === item.type)?.label || item.type}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>
      
      <Text style={styles.historyDate}>
        {item.date?.toDate ? format(item.date.toDate(), "d 'de' MMMM, h:mm a", { locale: es }) : ''}
      </Text>
      
      <Text style={styles.historyDescription} numberOfLines={2}>
        {item.description}
      </Text>

      {item.attachmentUrl && (
        <View style={styles.attachmentBadge}>
          <MaterialIcons name="attach-file" size={16} color="#666" />
          <Text style={styles.attachmentText}>Archivo adjunto</Text>
        </View>
      )}
    </View>
  );

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
        <Text style={styles.headerTitle}>Novedades</Text>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'reportar' && { borderBottomColor: getPrimaryColor() }]}
          onPress={() => setActiveTab('reportar')}
        >
          <Text style={[styles.tabText, activeTab === 'reportar' && { color: getPrimaryColor(), fontWeight: '700' }]}>
            Reportar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'historial' && { borderBottomColor: getPrimaryColor() }]}
          onPress={() => setActiveTab('historial')}
        >
          <Text style={[styles.tabText, activeTab === 'historial' && { color: getPrimaryColor(), fontWeight: '700' }]}>
            Mis Reportes
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'reportar' ? (
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
      ) : (
        <View style={styles.content}>
          {loadingHistorial ? (
            <ActivityIndicator size="large" color={getPrimaryColor()} style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={historial}
              renderItem={renderHistorialItem}
              keyExtractor={item => item.id}
              contentContainerStyle={{ paddingBottom: 20 }}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <MaterialIcons name="history" size={64} color="#ccc" />
                  <Text style={styles.emptyText}>No tienes reportes registrados</Text>
                </View>
              }
            />
          )}
        </View>
      )}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8e8e93',
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  historyDate: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  historyDescription: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  attachmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 4,
  },
  attachmentText: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8e8e93',
  },
});
