import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  RefreshControl,
  Pressable
} from 'react-native';
import * as Haptics from 'expo-haptics';
import materialTheme from '../../../material-theme.json';
import { 
  Text, 
  Surface, 
  Button, 
  TextInput, 
  Chip, 
  useTheme, 
  Avatar, 
  SegmentedButtons, 
  Card, 
  IconButton, 
  ActivityIndicator,
  Divider,
  Badge
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { collection, addDoc, Timestamp, query, where, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function NovedadesScreen({ navigation, isModal = false, onClose }) {
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
      surfaceVariant: scheme.surfaceVariant
    };
  }, [theme.dark]);
  
  const dynamicStyles = {
    container: { backgroundColor: theme.colors.background },
    surface: { backgroundColor: surfaceColors.surfaceContainerLow },
    text: { color: surfaceColors.onSurface },
    textSecondary: { color: surfaceColors.onSurfaceVariant }
  };
  
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
    { id: 'llegada_tarde', label: 'Llegada Tarde', icon: 'clock-alert-outline' },
    { id: 'olvido_salida', label: 'Olvido de Salida', icon: 'exit-run' },
    { id: 'urgencia_medica', label: 'Urgencia Médica', icon: 'hospital-box-outline' },
    { id: 'calamidad', label: 'Calamidad', icon: 'alert-circle-outline' },
    { id: 'otro', label: 'Otro', icon: 'pencil-outline' },
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
              // Alert.alert('Éxito', 'Reporte eliminado correctamente'); // Removed to avoid double alert/interruption
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
      if (editingId && !attachment && !existingAttachment) {
        Alert.alert('Requerido', 'Para urgencias médicas es obligatorio adjuntar la incapacidad o comprobante.');
        return;
      }
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
        ...(editingId ? { updatedAt: Timestamp.now() } : { date: Timestamp.now(), createdAt: Timestamp.now() }),
        status: 'pending'
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
      case 'approved': return theme.colors.primary;
      case 'rejected': return theme.colors.error;
      default: return theme.colors.tertiary;
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
    <Card style={[styles.card, { backgroundColor: surfaceColors.surfaceContainerLow }]} mode="elevated">
      <Card.Title
        title={tiposNovedad.find(t => t.id === item.type)?.label || item.type}
        subtitle={format(item.date.toDate(), "d 'de' MMMM, yyyy - h:mm a", { locale: es })}
        left={(props) => <Avatar.Icon {...props} icon={tiposNovedad.find(t => t.id === item.type)?.icon || 'alert'} style={{ backgroundColor: theme.colors.secondaryContainer }} color={theme.colors.onSecondaryContainer} />}
        right={(props) => (
          <Chip 
            style={{ marginRight: 16, backgroundColor: getStatusColor(item.status) + '20' }} 
            textStyle={{ color: getStatusColor(item.status), fontSize: 12 }}
          >
            {getStatusLabel(item.status)}
          </Chip>
        )}
      />
      <Card.Content>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
          {item.description}
        </Text>
        {item.attachmentUrl && (
          <View style={styles.attachmentBadge}>
            <IconButton icon="paperclip" size={16} />
            <Text variant="bodySmall" style={{ color: theme.colors.primary }}>Archivo adjunto</Text>
          </View>
        )}
        {item.adminResponse && (
          <Surface style={[styles.responseBox, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Text variant="labelMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>Respuesta Admin:</Text>
            <Text variant="bodySmall">{item.adminResponse}</Text>
          </Surface>
        )}
      </Card.Content>
      {item.status === 'pending' && (
        <Card.Actions>
          <Button onPress={() => handleEdit(item)} textColor={theme.colors.primary}>Editar</Button>
          <Button onPress={() => handleDelete(item)} textColor={theme.colors.error}>Eliminar</Button>
        </Card.Actions>
      )}
    </Card>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
            Novedades
          </Text>
          <Text variant="bodyLarge" style={{ color: theme.colors.secondary }}>
            Reporta incidencias laborales
          </Text>
        </View>
        {isModal && (
          <IconButton icon="close" onPress={onClose} />
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={setActiveTab}
          buttons={[
            {
              value: 'reportar',
              label: 'Reportar',
              icon: 'pencil-plus',
            },
            {
              value: 'historial',
              label: 'Historial',
              icon: 'history',
            },
          ]}
        />
      </View>

      {activeTab === 'reportar' ? (
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.formContent}>
            {editingId && (
              <Surface style={[styles.editBanner, { backgroundColor: theme.colors.tertiaryContainer }]}>
                <Text style={{ color: theme.colors.onTertiaryContainer }}>Editando reporte</Text>
                <IconButton icon="close" size={20} onPress={cancelEdit} />
              </Surface>
            )}

            <Text variant="titleMedium" style={styles.sectionTitle}>Tipo de Novedad</Text>
            <View style={styles.chipContainer}>
              {tiposNovedad.map((t) => (
                <Chip
                  key={t.id}
                  selected={type === t.id}
                  onPress={() => {
                    setType(t.id);
                    if (t.id === 'olvido_salida') {
                      setAttachment(null);
                      setExistingAttachment(null);
                    }
                  }}
                  showSelectedOverlay
                  style={styles.chip}
                  icon={t.icon}
                >
                  {t.label}
                </Chip>
              ))}
            </View>

            <Text variant="titleMedium" style={styles.sectionTitle}>Descripción</Text>
            <TextInput
              mode="outlined"
              placeholder="Describe detalladamente lo sucedido..."
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
              style={styles.input}
            />

            {type !== 'olvido_salida' && (
              <>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  {type === 'urgencia_medica' ? 'Adjuntar Incapacidad (Obligatorio)' : 'Adjuntar Evidencia'}
                </Text>
                <View style={styles.attachButtons}>
                  {type !== 'urgencia_medica' && (
                    <Button 
                      mode="outlined" 
                      icon="camera" 
                      onPress={takePhoto}
                      style={{ flex: 1 }}
                    >
                      Cámara
                    </Button>
                  )}
                  <Button 
                    mode="outlined" 
                    icon="file-document" 
                    onPress={pickDocument}
                    style={{ flex: 1 }}
                  >
                    {type === 'urgencia_medica' ? 'Subir Comprobante' : 'Archivo'}
                  </Button>
                </View>

                {(attachment || existingAttachment) && (
                  <Surface style={[styles.filePreview, { backgroundColor: theme.colors.secondaryContainer }]}>
                    <IconButton icon="file-check" />
                    <Text style={{ flex: 1, color: theme.colors.onSecondaryContainer }} numberOfLines={1}>
                      {attachment ? attachment.name : existingAttachment.name}
                    </Text>
                    <IconButton 
                      icon="close" 
                      onPress={() => {
                        setAttachment(null);
                        setExistingAttachment(null);
                      }} 
                    />
                  </Surface>
                )}
              </>
            )}

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                handleSubmit();
              }}
              android_ripple={{ color: surfaceColors.onPrimary + '1F' }}
              style={({ pressed }) => [
                styles.submitButton,
                { 
                  backgroundColor: surfaceColors.primary,
                  transform: [{ scale: pressed ? 0.98 : 1 }]
                }
              ]}
              disabled={loading}
            >
              <Text style={{ color: surfaceColors.onPrimary, fontWeight: '600', fontSize: 16 }}>
                {loading ? 'Enviando...' : (editingId ? 'Actualizar Reporte' : 'Enviar Reporte')}
              </Text>
            </Pressable>
            
            {editingId && (
               <Button onPress={cancelEdit} style={{ marginTop: 10 }}>Cancelar Edición</Button>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        <View style={{ flex: 1 }}>
          {loadingHistorial ? (
            <ActivityIndicator style={{ marginTop: 50 }} size="large" />
          ) : (
            <FlatList
              data={historial}
              renderItem={renderHistorialItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Avatar.Icon size={80} icon="clipboard-text-outline" style={{ backgroundColor: theme.colors.surfaceVariant }} color={theme.colors.onSurfaceVariant} />
                  <Text variant="titleMedium" style={{ marginTop: 16, color: theme.colors.onSurfaceVariant }}>No hay reportes registrados</Text>
                </View>
              }
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tabContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  formContent: {
    padding: 24,
    paddingTop: 0,
    paddingBottom: 100,
  },
  sectionTitle: {
    marginTop: 24, // Spacing generoso
    marginBottom: 12,
    fontWeight: '600',
    letterSpacing: -0.3, // Tight letter spacing
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  chip: {
    marginBottom: 4,
    borderRadius: 20, // Orgánico
  },
  input: {
    backgroundColor: 'transparent',
  },
  attachButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  filePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 20, // Orgánico
    marginBottom: 24,
  },
  submitButton: {
    marginTop: 16,
    borderRadius: 24, // Material You Expressive
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 0, // Tonal elevation
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    marginBottom: 20, // Spacing generoso
    borderRadius: 24, // Material You Expressive
    elevation: 0, // Tonal elevation
  },
  attachmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  responseBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 16,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
  },
  editBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 16,
  }
});
