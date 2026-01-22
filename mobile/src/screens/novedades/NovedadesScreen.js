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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { 
  Text, 
  Surface, 
  TextInput, 
  useTheme,
  Avatar, 
  SegmentedButtons, 
  ActivityIndicator,
  Divider,
  Badge,
  Chip
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
import { notifyAdminsWorkEvent } from '../../utils/notificationHelpers';

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
      surfaceVariant: scheme.surfaceVariant,
      primaryContainer: scheme.primaryContainer,
      onPrimaryContainer: scheme.onPrimaryContainer,
      errorContainer: scheme.errorContainer,
      onErrorContainer: scheme.onErrorContainer,
      secondaryContainer: scheme.secondaryContainer,
      onSecondaryContainer: scheme.onSecondaryContainer,
      tertiaryContainer: scheme.tertiaryContainer,
      onTertiaryContainer: scheme.onTertiaryContainer,
      error: scheme.error,
      background: scheme.background,
      tertiary: scheme.tertiary,
      outlineVariant: scheme.outlineVariant
    };
  }, [theme.dark]);
  
  const dynamicStyles = {
    container: { backgroundColor: surfaceColors.background },
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
    { id: 'solicitud_reapertura', label: 'Solicitud de Reapertura', icon: 'lock-open-variant-outline' },
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
        
        // 🔔 OPTIMIZADO: Notificar incidencia a admins configurados
        try {
          const tipoLabels = {
            permiso: 'Permiso',
            incapacidad: 'Incapacidad',
            calamidad: 'Calamidad Doméstica',
            retraso: 'Retraso',
            urgencia_medica: 'Urgencia Médica',
            otro: 'Otro'
          };
          
          await notifyAdminsWorkEvent(
            'incident',
            userProfile?.name || userProfile?.displayName || user.email,
            `⚠️ Nueva Incidencia: ${tipoLabels[type] || type}`,
            description.trim().substring(0, 100) + (description.length > 100 ? '...' : ''),
            {
              userId: user.uid,
              incidentType: type,
              hasAttachment: !!attachmentUrl,
              fecha: format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: es })
            }
          );
        } catch (notifError) {
          console.log('Error enviando notificación de incidencia:', notifError);
        }
        
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
      case 'approved': return surfaceColors.primary;
      case 'rejected': return surfaceColors.error;
      default: return surfaceColors.tertiary;
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
    <Pressable
      onPress={() => Haptics.selectionAsync()}
      android_ripple={{ color: surfaceColors.primary + '1F' }}
      style={({ pressed }) => [
        styles.card,
        { 
          backgroundColor: surfaceColors.surfaceContainerLow,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          borderWidth: 1,
          borderColor: surfaceColors.outlineVariant
        }
      ]}
    >
      <View style={{ padding: 20 }}>
        {/* Header con ícono y status */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Avatar.Icon 
              size={48} 
              icon={tiposNovedad.find(t => t.id === item.type)?.icon || 'alert'} 
              style={{ backgroundColor: surfaceColors.primaryContainer, marginRight: 12 }} 
              color={surfaceColors.onPrimaryContainer} 
            />
            <View style={{ flex: 1 }}>
              <Text variant="titleMedium" style={{ fontWeight: '600', color: surfaceColors.onSurface, letterSpacing: -0.25 }}>
                {tiposNovedad.find(t => t.id === item.type)?.label || item.type}
              </Text>
              <Text variant="bodySmall" style={{ color: surfaceColors.onSurfaceVariant, marginTop: 2 }}>
                {format(item.date.toDate(), "d 'de' MMMM, yyyy - h:mm a", { locale: es })}
              </Text>
            </View>
          </View>
          <Chip 
            style={{ backgroundColor: getStatusColor(item.status) + '20', borderRadius: 16 }} 
            textStyle={{ color: getStatusColor(item.status), fontSize: 11, fontWeight: '600' }}
          >
            {getStatusLabel(item.status)}
          </Chip>
        </View>

        {/* Descripción */}
        <Text variant="bodyMedium" style={{ color: surfaceColors.onSurfaceVariant, lineHeight: 20 }}>
          {item.description}
        </Text>

        {/* Attachment badge */}
        {item.attachmentUrl && (
          <View style={[styles.attachmentBadge, { backgroundColor: surfaceColors.surfaceContainerHigh, borderRadius: 12, padding: 8, marginTop: 12 }]}>
            <MaterialCommunityIcons name="paperclip" size={16} color={surfaceColors.primary} />
            <Text variant="bodySmall" style={{ color: surfaceColors.primary, marginLeft: 4, fontWeight: '500' }}>Archivo adjunto</Text>
          </View>
        )}

        {/* Admin response */}
        {item.adminResponse && (
          <View style={[styles.responseBox, { backgroundColor: surfaceColors.surfaceVariant, borderRadius: 16, padding: 12, marginTop: 12 }]}>
            <Text variant="labelMedium" style={{ color: surfaceColors.primary, fontWeight: '600', marginBottom: 4 }}>Respuesta Admin:</Text>
            <Text variant="bodySmall" style={{ color: surfaceColors.onSurfaceVariant }}>{item.adminResponse}</Text>
          </View>
        )}

        {/* Actions */}
        {item.status === 'pending' && (
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                handleEdit(item);
              }}
              android_ripple={{ color: surfaceColors.primary + '1F' }}
              style={({ pressed }) => [
                { 
                  flex: 1, 
                  padding: 12, 
                  borderRadius: 20, 
                  backgroundColor: surfaceColors.primaryContainer,
                  alignItems: 'center',
                  transform: [{ scale: pressed ? 0.97 : 1 }]
                }
              ]}
            >
              <Text style={{ color: surfaceColors.onPrimaryContainer, fontWeight: '600' }}>Editar</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                handleDelete(item);
              }}
              android_ripple={{ color: surfaceColors.error + '1F' }}
              style={({ pressed }) => [
                { 
                  flex: 1, 
                  padding: 12, 
                  borderRadius: 20, 
                  backgroundColor: surfaceColors.errorContainer,
                  alignItems: 'center',
                  transform: [{ scale: pressed ? 0.97 : 1 }]
                }
              ]}
            >
              <Text style={{ color: surfaceColors.onErrorContainer, fontWeight: '600' }}>Eliminar</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: surfaceColors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text variant="headlineLarge" style={{ fontWeight: '600', color: surfaceColors.onSurface, letterSpacing: -0.5 }}>
            Novedades
          </Text>
          <Text variant="bodyLarge" style={{ color: surfaceColors.onSurfaceVariant, marginTop: 4 }}>
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
          onValueChange={(value) => {
            Haptics.selectionAsync();
            setActiveTab(value);
          }}
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
              <Surface 
                style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: 12,
                  borderRadius: 20,
                  backgroundColor: surfaceColors.tertiaryContainer,
                  marginBottom: 16,
                  elevation: 0
                }}
              >
                <Text style={{ color: surfaceColors.onTertiaryContainer, fontWeight: '500' }}>Editando reporte</Text>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    cancelEdit();
                  }}
                  android_ripple={{ color: surfaceColors.onTertiaryContainer + '1F', borderless: true }}
                  style={({ pressed }) => [
                    {
                      padding: 8,
                      borderRadius: 16,
                      transform: [{ scale: pressed ? 0.9 : 1 }]
                    }
                  ]}
                >
                  <MaterialCommunityIcons name="close" size={20} color={surfaceColors.onTertiaryContainer} />
                </Pressable>
              </Surface>
            )}

            <Text variant="titleMedium" style={styles.sectionTitle}>Tipo de Novedad</Text>
            <View style={styles.chipContainer}>
              {tiposNovedad.map((t) => (
                <Pressable
                  key={t.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setType(t.id);
                    if (t.id === 'olvido_salida') {
                      setAttachment(null);
                      setExistingAttachment(null);
                    }
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

            <Text variant="titleMedium" style={styles.sectionTitle}>Descripción</Text>
            <TextInput
              mode="outlined"
              placeholder="Describe detalladamente lo sucedido..."
              multiline
              numberOfLines={6}
              value={description}
              onChangeText={setDescription}
              style={[styles.input, { minHeight: 140, textAlignVertical: 'top' }]}
              outlineStyle={{ borderRadius: 20 }}
              theme={{ 
                roundness: 20,
                colors: { 
                  onSurfaceVariant: surfaceColors.onSurfaceVariant 
                } 
              }}
            />

            {type !== 'olvido_salida' && (
              <>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  {type === 'urgencia_medica' ? 'Adjuntar Incapacidad (Obligatorio)' : 'Adjuntar Evidencia'}
                </Text>
                <View style={styles.attachButtons}>
                  {type !== 'urgencia_medica' && (
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        takePhoto();
                      }}
                      android_ripple={{ color: surfaceColors.primary + '1F' }}
                      style={({ pressed }) => [
                        {
                          flex: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 12,
                          borderRadius: 20,
                          borderWidth: 1,
                          borderColor: surfaceColors.primary,
                          transform: [{ scale: pressed ? 0.97 : 1 }]
                        }
                      ]}
                    >
                      <MaterialCommunityIcons name="camera" size={18} color={surfaceColors.primary} style={{ marginRight: 8 }} />
                      <Text style={{ color: surfaceColors.primary, fontWeight: '500' }}>Cámara</Text>
                    </Pressable>
                  )}
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      pickDocument();
                    }}
                    android_ripple={{ color: surfaceColors.primary + '1F' }}
                    style={({ pressed }) => [
                      {
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 12,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: surfaceColors.primary,
                        transform: [{ scale: pressed ? 0.97 : 1 }]
                      }
                    ]}
                  >
                    <MaterialCommunityIcons name="file-document" size={18} color={surfaceColors.primary} style={{ marginRight: 8 }} />
                    <Text style={{ color: surfaceColors.primary, fontWeight: '500' }}>
                      {type === 'urgencia_medica' ? 'Subir Comprobante' : 'Archivo'}
                    </Text>
                  </Pressable>
                </View>

                {(attachment || existingAttachment) && (
                  <Surface 
                    style={{ 
                      marginTop: 12, 
                      padding: 12, 
                      borderRadius: 20,
                      backgroundColor: surfaceColors.secondaryContainer,
                      elevation: 0,
                      flexDirection: 'row',
                      alignItems: 'center'
                    }}
                  >
                    <MaterialCommunityIcons name="file-check" size={24} color={surfaceColors.onSecondaryContainer} style={{ marginRight: 8 }} />
                    <Text style={{ flex: 1, color: surfaceColors.onSecondaryContainer, fontWeight: '500' }} numberOfLines={1}>
                      {attachment ? attachment.name : existingAttachment.name}
                    </Text>
                    <Pressable 
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setAttachment(null);
                        setExistingAttachment(null);
                      }}
                      android_ripple={{ color: surfaceColors.error + '1F', borderless: true }}
                      style={({ pressed }) => [
                        {
                          padding: 8,
                          borderRadius: 16,
                          transform: [{ scale: pressed ? 0.9 : 1 }]
                        }
                      ]}
                    >
                      <MaterialCommunityIcons name="close" size={20} color={surfaceColors.error} />
                    </Pressable>
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
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  cancelEdit();
                }}
                android_ripple={{ color: surfaceColors.error + '1F' }}
                style={({ pressed }) => [
                  {
                    marginTop: 10,
                    padding: 14,
                    borderRadius: 20,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: surfaceColors.error,
                    transform: [{ scale: pressed ? 0.98 : 1 }]
                  }
                ]}
              >
                <Text style={{ color: surfaceColors.error, fontWeight: '600', fontSize: 16 }}>
                  Cancelar Edición
                </Text>
              </Pressable>
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
                  <Avatar.Icon 
                    size={80} 
                    icon="clipboard-text-outline" 
                    style={{ backgroundColor: surfaceColors.surfaceVariant }} 
                    color={surfaceColors.onSurfaceVariant} 
                  />
                  <Text variant="titleMedium" style={{ marginTop: 16, color: surfaceColors.onSurfaceVariant }}>
                    No hay reportes registrados
                  </Text>
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
