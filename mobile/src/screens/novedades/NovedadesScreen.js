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
import * as ImagePicker from 'expo-image-picker';
import { collection, addDoc, Timestamp, query, where, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
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
  
  // Edit states
  const [editingId, setEditingId] = useState(null);
  const [existingAttachment, setExistingAttachment] = useState(null);
  const [originalAttachment, setOriginalAttachment] = useState(null);
  
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

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita acceso a la cámara para tomar fotos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setAttachment({
          uri: asset.uri,
          name: asset.fileName || `foto_${Date.now()}.jpg`,
          mimeType: 'image/jpeg',
          size: asset.fileSize
        });
      }
    } catch (err) {
      console.error('Error taking photo:', err);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setType(item.type);
    setDescription(item.description);
    if (item.attachmentUrl) {
      const att = { url: item.attachmentUrl, name: item.attachmentName };
      setExistingAttachment(att);
      setOriginalAttachment(att);
    } else {
      setExistingAttachment(null);
      setOriginalAttachment(null);
    }
    setAttachment(null);
    setActiveTab('reportar');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setType('llegada_tarde');
    setDescription('');
    setAttachment(null);
    setExistingAttachment(null);
    setOriginalAttachment(null);
  };

  const handleDelete = (item) => {
    Alert.alert(
      'Eliminar Reporte',
      '¿Estás seguro de que deseas eliminar este reporte? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              // 1. Delete attachment if exists
              if (item.attachmentUrl) {
                try {
                  const fileRef = ref(storage, item.attachmentUrl);
                  await deleteObject(fileRef);
                } catch (e) {
                  console.warn('Error deleting file:', e);
                }
              }
              // 2. Delete document
              await deleteDoc(doc(db, 'novedades', item.id));
              Alert.alert('Éxito', 'Reporte eliminado correctamente');
            } catch (error) {
              console.error(error);
              Alert.alert('Error', 'No se pudo eliminar el reporte');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Por favor describe la novedad');
      return;
    }

    // Validation for medical urgency
    if (type === 'urgencia_medica') {
      // If editing, we need either a new attachment OR an existing one
      if (editingId && !attachment && !existingAttachment) {
        Alert.alert('Requerido', 'Para urgencias médicas es obligatorio adjuntar la incapacidad o comprobante.');
        return;
      }
      // If creating, we need an attachment
      if (!editingId && !attachment) {
        Alert.alert('Requerido', 'Para urgencias médicas es obligatorio adjuntar la incapacidad o comprobante.');
        return;
      }
    }

    setLoading(true);
    try {
      let attachmentUrl = existingAttachment?.url || null;
      let attachmentName = existingAttachment?.name || null;

      // If new attachment is selected
      if (attachment) {
        // Upload new file
        const response = await fetch(attachment.uri);
        const blob = await response.blob();
        const filename = `novedades/${user.uid}/${Date.now()}_${attachment.name}`;
        const storageRef = ref(storage, filename);
        
        await uploadBytes(storageRef, blob);
        attachmentUrl = await getDownloadURL(storageRef);
        attachmentName = attachment.name;
      }

      // Handle deletion of old file if it was replaced or removed
      if (originalAttachment?.url && originalAttachment.url !== attachmentUrl) {
        try {
          const oldFileRef = ref(storage, originalAttachment.url);
          await deleteObject(oldFileRef);
        } catch (e) {
          console.warn('Error deleting old file:', e);
        }
      }

      const data = {
        uid: user.uid,
        userName: userProfile?.name || user.email,
        userEmail: user.email,
        type,
        description: description.trim(),
        attachmentUrl,
        attachmentName,
        // If editing, keep original date, else new date
        ...(editingId ? { updatedAt: Timestamp.now() } : { date: Timestamp.now(), createdAt: Timestamp.now() }),
        status: 'pending' // Reset status to pending on edit
      };

      if (editingId) {
        await updateDoc(doc(db, 'novedades', editingId), data);
        Alert.alert('Éxito', 'Reporte actualizado correctamente', [
          { text: 'OK', onPress: () => {
            cancelEdit();
            setActiveTab('historial');
          }}
        ]);
      } else {
        await addDoc(collection(db, 'novedades'), data);
        Alert.alert('Éxito', 'Novedad reportada correctamente', [
          { 
            text: 'Ver Historial', 
            onPress: () => {
              cancelEdit();
              setActiveTab('historial');
            } 
          }
        ]);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', `No se pudo ${editingId ? 'actualizar' : 'enviar'} el reporte`);
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

      {/* Actions for pending items */}
      {item.status === 'pending' && (
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, { borderColor: '#2196f3' }]} 
            onPress={() => handleEdit(item)}
          >
            <MaterialIcons name="edit" size={18} color="#2196f3" />
            <Text style={[styles.actionButtonText, { color: '#2196f3' }]}>Editar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { borderColor: '#f44336', marginLeft: 12 }]} 
            onPress={() => handleDelete(item)}
          >
            <MaterialIcons name="delete" size={18} color="#f44336" />
            <Text style={[styles.actionButtonText, { color: '#f44336' }]}>Eliminar</Text>
          </TouchableOpacity>
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
            {editingId ? 'Editar Reporte' : 'Reportar'}
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

            {(type === 'urgencia_medica' || type === 'llegada_tarde') && (
              <View style={styles.attachmentSection}>
                <Text style={styles.sectionTitle}>
                  {type === 'urgencia_medica' ? 'Comprobante (Incapacidad)' : 'Fotografía / Evidencia (Opcional)'}
                </Text>
                
                {(attachment || existingAttachment) ? (
                  <View style={[styles.uploadButton, { borderColor: getPrimaryColor(), borderStyle: 'solid' }]}>
                    <MaterialIcons name="check-circle" size={32} color="#4caf50" />
                    <View style={styles.uploadTextContainer}>
                      <Text style={[styles.uploadTitle, { color: getPrimaryColor() }]}>
                        {attachment ? "Archivo seleccionado" : "Archivo actual"}
                      </Text>
                      <Text style={styles.uploadSubtitle} numberOfLines={1}>
                        {attachment ? attachment.name : existingAttachment.name}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      onPress={() => {
                        setAttachment(null);
                        setExistingAttachment(null);
                      }} 
                      style={styles.removeButton}
                    >
                      <MaterialIcons name="close" size={20} color="#ff5252" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  type === 'llegada_tarde' ? (
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <TouchableOpacity 
                        style={[styles.uploadButton, { flex: 1, borderColor: getPrimaryColor(), flexDirection: 'column', gap: 8, paddingVertical: 24 }]} 
                        onPress={takePhoto}
                      >
                        <MaterialIcons name="camera-alt" size={32} color={getPrimaryColor()} />
                        <Text style={{ color: getPrimaryColor(), fontWeight: '600' }}>Tomar Foto</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={[styles.uploadButton, { flex: 1, borderColor: getPrimaryColor(), flexDirection: 'column', gap: 8, paddingVertical: 24 }]} 
                        onPress={pickDocument}
                      >
                        <MaterialIcons name="cloud-upload" size={32} color={getPrimaryColor()} />
                        <Text style={{ color: getPrimaryColor(), fontWeight: '600' }}>Subir Archivo</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      style={[styles.uploadButton, { borderColor: getPrimaryColor() }]} 
                      onPress={pickDocument}
                    >
                      <MaterialIcons name="cloud-upload" size={32} color={getPrimaryColor()} />
                      <View style={styles.uploadTextContainer}>
                        <Text style={[styles.uploadTitle, { color: getPrimaryColor() }]}>
                          Adjuntar Incapacidad
                        </Text>
                        <Text style={styles.uploadSubtitle}>
                          Toca para seleccionar PDF o Imagen
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )
                )}
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

            <View style={{ gap: 12 }}>
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: getPrimaryColor() }]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {editingId ? 'Actualizar Reporte' : 'Enviar Reporte'}
                  </Text>
                )}
              </TouchableOpacity>

              {editingId && (
                <TouchableOpacity
                  style={[styles.submitButton, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc', marginTop: 12 }]}
                  onPress={cancelEdit}
                  disabled={loading}
                >
                  <Text style={[styles.submitButtonText, { color: '#666' }]}>Cancelar Edición</Text>
                </TouchableOpacity>
              )}
            </View>
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
    borderRadius: 8,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
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
