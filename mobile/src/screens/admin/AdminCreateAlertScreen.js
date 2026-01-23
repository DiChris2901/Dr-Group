import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity, Modal, FlatList, Image } from 'react-native';
import { Text, TextInput, Button, Surface, useTheme as usePaperTheme, SegmentedButtons, IconButton, Avatar, Divider, Checkbox, Searchbar, Chip, ActivityIndicator } from 'react-native-paper';
import { logger } from '../../utils/logger';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { collection, addDoc, serverTimestamp, getDocs, query, where, orderBy, limit, getDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../services/firebase';
import { OverlineText } from '../../components';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { APP_PERMISSIONS } from '../../constants/permissions';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, addMonths, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';

export default function AdminCreateAlertScreen() {
  const theme = usePaperTheme();
  const { getPrimaryColor } = useTheme();
  const { user, userProfile } = useAuth();
  const { can } = usePermissions();
  const navigation = useNavigation();
  
  // ✅ Validación de permiso
  if (!can(APP_PERMISSIONS.ADMIN_CREATE_ALERT)) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <MaterialCommunityIcons name="shield-lock" size={64} color={theme.colors.error} />
          <Text variant="headlineSmall" style={{ marginTop: 16, fontWeight: '600' }}>🔒 Acceso Denegado</Text>
          <Text variant="bodyMedium" style={{ marginTop: 8, textAlign: 'center' }}>No tienes permiso para crear alertas</Text>
          <Button mode="contained" onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>Volver</Button>
        </View>
      </SafeAreaView>
    );
  }
  
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('normal'); // normal, high
  const [audience, setAudience] = useState('all'); // all, active, admins, specific
  const [loading, setLoading] = useState(false);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [attachment, setAttachment] = useState(null);
  const [linkPreview, setLinkPreview] = useState(null);

  // Specific users state
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // History Modal State
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editingAlertIds, setEditingAlertIds] = useState([]);
  const [originalAttachment, setOriginalAttachment] = useState(null);

  // Detect Links
  useEffect(() => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const match = message.match(urlRegex);
    if (match && match[0]) {
      const url = match[0];
      // Simple domain extraction for preview
      try {
        const domain = new URL(url).hostname;
        setLinkPreview({ url, domain, title: 'Enlace detectado' });
      } catch (e) {
        // Fallback if URL parsing fails (e.g. incomplete)
        if (url.length > 10) {
           setLinkPreview({ url, domain: 'Enlace externo', title: 'Enlace detectado' });
        }
      }
    } else {
      setLinkPreview(null);
    }
  }, [message]);

  // Cargar historial reciente y usuarios
  const fetchData = useCallback(async () => {
      try {
        // History
        // ✅ Agrupar alertas por título y fecha para evitar duplicados en el historial
        const q = query(
          collection(db, 'notifications'),
          where('type', '==', 'admin_alert'),
          orderBy('createdAt', 'desc'),
          limit(20) // Traemos más para filtrar en memoria
        );
        const snapshot = await getDocs(q);
        const rawAlerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Filtrar duplicados (mismo título y mensaje enviados en un rango de 1 minuto)
        const uniqueAlerts = [];
        const seenKeys = new Set();

        rawAlerts.forEach(alert => {
          // Clave única: Título + Mensaje + Fecha (minuto)
          const dateKey = alert.createdAt ? format(alert.createdAt.toDate(), 'yyyy-MM-dd HH:mm') : 'unknown';
          const key = `${alert.title}|${alert.message}|${dateKey}`;
          
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            // Inicializar array de destinatarios con el primero
            alert.recipients = [alert.uid];
            alert.ids = [alert.id]; // ✅ Guardar ID del documento
            uniqueAlerts.push(alert);
          } else {
            // Si ya existe, agregar el UID al array de destinatarios del existente
            const existingAlert = uniqueAlerts.find(a => {
              const aDateKey = a.createdAt ? format(a.createdAt.toDate(), 'yyyy-MM-dd HH:mm') : 'unknown';
              return `${a.title}|${a.message}|${aDateKey}` === key;
            });
            if (existingAlert) {
              if (!existingAlert.recipients) existingAlert.recipients = [];
              if (!existingAlert.recipients.includes(alert.uid)) {
                existingAlert.recipients.push(alert.uid);
              }
              if (!existingAlert.ids) existingAlert.ids = [];
              existingAlert.ids.push(alert.id); // ✅ Guardar ID del documento
            }
          }
        });

        setRecentAlerts(uniqueAlerts.slice(0, 3)); // Solo mostrar las 3 más recientes únicas

        // Users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersList = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).sort((a, b) => (a.name || a.email || '').localeCompare(b.name || b.email || ''));
        setAllUsers(usersList);
      } catch (error) {
        console.log('Error fetching data:', error);
      }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleUserSelection = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const filteredUsers = allUsers.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    const name = (user.name || '').toLowerCase();
    const email = (user.email || '').toLowerCase();
    return name.includes(searchLower) || email.includes(searchLower);
  });

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        if (file.size > 5 * 1024 * 1024) {
          Alert.alert('Archivo muy grande', 'El archivo no debe superar los 5MB.');
          return;
        }
        setAttachment(file);
      }
    } catch (err) {
      console.log('Error picking document:', err);
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a la cámara para tomar fotos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        // Create a file-like object compatible with our upload logic
        const file = {
          uri: asset.uri,
          name: `photo_${Date.now()}.jpg`,
          mimeType: 'image/jpeg',
          size: asset.fileSize || 0 // Might be undefined on some platforms, handled in upload
        };
        setAttachment(file);
      }
    } catch (err) {
      console.log('Error taking photo:', err);
    }
  };

  const openHistoryDetail = (alert) => {
    setSelectedHistoryItem(alert);
    setHistoryModalVisible(true);
  };

  const handleDeleteAlert = async (alertItem) => {
    Alert.alert(
      'Eliminar Alerta',
      '¿Estás seguro de que deseas eliminar esta alerta? Se borrará para todos los destinatarios.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              // 1. Delete documents
              const idsToDelete = alertItem.ids || [alertItem.id];
              const deletePromises = idsToDelete.map(id => deleteDoc(doc(db, 'notifications', id)));
              await Promise.all(deletePromises);

              // 2. Delete attachment if exists
              if (alertItem.attachment && alertItem.attachment.path) {
                const storageRef = ref(storage, alertItem.attachment.path);
                await deleteObject(storageRef).catch(err => console.log('Error deleting file:', err));
              }

              // 3. Update UI
              setRecentAlerts(prev => prev.filter(a => a.id !== alertItem.id));
              setHistoryModalVisible(false);
              Alert.alert('Eliminado', 'La alerta ha sido eliminada correctamente.');
            } catch (error) {
              console.error('Error deleting alert:', error);
              Alert.alert('Error', 'No se pudo eliminar la alerta.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleEditAlert = (alertItem) => {
    // Populate form
    setTitle(alertItem.title);
    setMessage(alertItem.message);
    setPriority(alertItem.priority || 'normal');
    
    // Determine audience for UI
    let effectiveAudience = alertItem.audience;
    if (!effectiveAudience) {
        // Heurística para alertas antiguas
        if (alertItem.recipients && allUsers.length > 0 && alertItem.recipients.length >= (allUsers.length - 1)) {
            effectiveAudience = 'all';
        } else {
            effectiveAudience = 'specific';
        }
    }
    setAudience(effectiveAudience);
    
    setAttachment(alertItem.attachment); 
    
    // Set Edit Mode
    setIsEditing(true);
    setEditingAlertIds(alertItem.ids || [alertItem.id]);
    setOriginalAttachment(alertItem.attachment);
    
    // Close modal
    setHistoryModalVisible(false);
    Alert.alert('Modo Edición', 'Puedes modificar el título, mensaje y adjuntos. La audiencia no se puede cambiar en modo edición.');
  };

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Faltan datos', 'Por favor escribe un título y un mensaje para la alerta.');
      return;
    }

    setLoading(true);
    try {
      let attachmentData = null;

      // ✅ UPDATE LOGIC (Modo Edición)
      if (isEditing) {
         attachmentData = originalAttachment; // Mantener el original por defecto

         // Si el adjunto cambió
         if (attachment !== originalAttachment) {
             // A. Si se seleccionó un nuevo archivo (tiene URI local)
             if (attachment && attachment.uri) {
                 const response = await fetch(attachment.uri);
                 const blob = await response.blob();
                 const filename = `${Date.now()}_${attachment.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
                 const storageRef = ref(storage, `alerts_attachments/${filename}`);
                 
                 await uploadBytes(storageRef, blob);
                 const downloadURL = await getDownloadURL(storageRef);
                 
                 attachmentData = {
                   url: downloadURL,
                   name: attachment.name,
                   type: attachment.mimeType,
                   path: `alerts_attachments/${filename}`
                 };

                 // Eliminar archivo anterior si existía
                 if (originalAttachment && originalAttachment.path) {
                     const oldRef = ref(storage, originalAttachment.path);
                     await deleteObject(oldRef).catch(e => console.log('Error deleting old file', e));
                 }
             } 
             // B. Si se eliminó el adjunto (es null)
             else if (!attachment) {
                 attachmentData = null;
                 // Eliminar archivo anterior si existía
                 if (originalAttachment && originalAttachment.path) {
                     const oldRef = ref(storage, originalAttachment.path);
                     await deleteObject(oldRef).catch(e => console.log('Error deleting old file', e));
                 }
             }
         }

         // Actualizar todos los documentos del grupo
         const batchPromises = editingAlertIds.map(id => {
             return updateDoc(doc(db, 'notifications', id), {
                 title: title.trim(),
                 message: message.trim(),
                 priority: priority,
                 attachment: attachmentData,
             });
         });
         await Promise.all(batchPromises);
         
         Alert.alert('Actualizado', 'La alerta ha sido actualizada correctamente.');
         
         // Resetear estado
         setIsEditing(false);
         setEditingAlertIds([]);
         setOriginalAttachment(null);
         setTitle('');
         setMessage('');
         setAttachment(null);
         setLoading(false);
         
         // Recargar lista (opcional, pero recomendado)
         // Por simplicidad, el usuario verá el cambio al recargar o enviar otra
         return; 
      }

      // ✅ CREATE LOGIC (Nuevo Envío)
      // 1. Upload Attachment if exists
      if (attachment) {
        const response = await fetch(attachment.uri);
        const blob = await response.blob();
        const filename = `${Date.now()}_${attachment.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const storageRef = ref(storage, `alerts_attachments/${filename}`);
        
        await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(storageRef);
        
        attachmentData = {
          url: downloadURL,
          name: attachment.name,
          type: attachment.mimeType,
          path: `alerts_attachments/${filename}`
        };
      }

      let targetUsers = [];
      const usersRef = collection(db, 'users');

      if (audience === 'all') {
        const snapshot = await getDocs(query(usersRef));
        targetUsers = snapshot.docs;
      } else if (audience === 'admins') {
        const snapshot = await getDocs(query(usersRef, where('role', 'in', ['ADMIN', 'SUPER_ADMIN'])));
        targetUsers = snapshot.docs;
      } else if (audience === 'specific') {
        if (selectedUsers.length === 0) {
          Alert.alert('Error', 'Debes seleccionar al menos un usuario destinatario.');
          setLoading(false);
          return;
        }
        // Map selected IDs to objects with id property to match snapshot.docs structure
        targetUsers = selectedUsers.map(uid => ({ id: uid }));
      } else if (audience === 'active') {
        // Lógica para usuarios activos hoy
        const today = format(new Date(), 'yyyy-MM-dd');
        const attendanceRef = collection(db, 'asistencias');
        const attendanceSnapshot = await getDocs(query(attendanceRef, where('fecha', '==', today)));
        
        // Filtrar solo los que están trabajando actualmente
        const activeUids = attendanceSnapshot.docs
          .filter(doc => doc.data().estadoActual === 'trabajando')
          .map(doc => doc.data().uid);
          
        if (activeUids.length === 0) {
          Alert.alert('Sin usuarios', 'No hay usuarios trabajando activamente en este momento.');
          setLoading(false);
          return;
        }
        
        // Necesitamos los tokens/docs de estos usuarios. 
        // Firestore no permite 'where in' con más de 10 IDs fácilmente, así que iteramos.
        // Para optimizar, traemos todos los usuarios y filtramos en memoria (asumiendo < 100 usuarios)
        const allUsersSnapshot = await getDocs(query(usersRef));
        targetUsers = allUsersSnapshot.docs.filter(doc => activeUids.includes(doc.id));
      }

      // Calculate expiration date (e.g., 6 months from now)
      const expirationDate = addMonths(new Date(), 6);

      // ✅ Lógica Robusta para obtener el Remitente
      let senderName = 'Administrador';
      let senderRole = 'ADMIN';
      const senderUid = user?.uid || 'unknown';

      try {
        // 1. Intentar usar el perfil del contexto si está completo
        if (userProfile?.name || userProfile?.displayName) {
          senderName = userProfile.name || userProfile.displayName;
          senderRole = userProfile.role || 'ADMIN';
        } 
        // 2. Si no, buscar en Firestore directamente (Fallback robusto)
        else if (user?.uid) {
          logger.debug('Buscando perfil de usuario en Firestore...');
          
          // A. Intentar buscar por ID de documento (Estándar)
          let userDocSnap = await getDoc(doc(db, 'users', user.uid));
          
          // B. Si no existe, intentar buscar por campo authUid (Caso especial visto en captura)
          if (!userDocSnap.exists()) {
            logger.debug('No encontrado por ID, buscando por authUid...');
            const q = query(collection(db, 'users'), where('authUid', '==', user.uid));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
              userDocSnap = querySnapshot.docs[0];
            }
          }

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            senderName = userData.name || userData.displayName || senderName;
            senderRole = userData.role || senderRole;
            logger.debug('Perfil encontrado en Firestore:', senderName);
          } else {
            // C. Último recurso: usar email
            senderName = user?.email ? user.email.split('@')[0] : 'Administrador';
            logger.debug('Perfil no encontrado, usando email:', senderName);
          }
        }
      } catch (err) {
        logger.error('Error resolviendo remitente:', err);
      }

      const batchPromises = targetUsers.map(userDoc => {
        return addDoc(collection(db, 'notifications'), {
          uid: userDoc.id,
          title: title.trim(),
          message: message.trim(),
          type: 'admin_alert',
          priority: priority,
          read: false,
          createdAt: serverTimestamp(),
          date: new Date().toISOString(),
          expirationDate: expirationDate, // ✅ Retention Policy Field
          attachment: attachmentData, // ✅ File Attachment
          senderName: senderName, // ✅ Explicit variable
          senderRole: senderRole,
          senderUid: senderUid,
          audience: audience // ✅ Guardar el tipo de audiencia para agrupar en historial
        });
      });

      await Promise.all(batchPromises);

      Alert.alert(
        '¡Enviado!', 
        `La alerta ha sido notificada a ${targetUsers.length} usuarios.`,
        [{ text: 'Entendido', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error sending alert:', error);
      Alert.alert('Error', 'No se pudo enviar la alerta. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <IconButton 
          icon="arrow-left" 
          size={28} 
          onPress={() => navigation.goBack()}
          style={{ marginLeft: -8 }}
        />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          
          {/* Title Section */}
          <View style={{ marginBottom: 24 }}>
            <Text 
              style={{ 
                color: theme.colors.onSurface,
                fontFamily: 'Roboto-Flex',
                fontSize: 36,
                fontWeight: '400',
                letterSpacing: -0.5,
                lineHeight: 44,
                fontVariationSettings: [{ axis: 'wdth', value: 110 }]
              }}
            >
              Nueva Alerta
            </Text>
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
              Envía notificaciones importantes a todo el equipo en tiempo real.
            </Text>
          </View>

          {/* Audience Selector */}
          <View style={[styles.formGroup, isEditing && { opacity: 0.5 }]}>
            <OverlineText color={getPrimaryColor()}>AUDIENCIA {isEditing && '(No editable)'}</OverlineText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 }} pointerEvents={isEditing ? 'none' : 'auto'}>
              {[
                { value: 'all', label: 'Todos', icon: 'account-group' },
                { value: 'active', label: 'Activos', icon: 'clock-outline' },
                { value: 'admins', label: 'Admins', icon: 'shield-account' },
                { value: 'specific', label: 'Específico', icon: 'account-check' },
              ].map((option) => {
                const isSelected = audience === option.value;
                return (
                  <Surface
                    key={option.value}
                    elevation={0}
                    style={{
                      width: '48%',
                      borderRadius: 16,
                      backgroundColor: isSelected ? theme.colors.secondaryContainer : theme.colors.surfaceContainerLow,
                      borderWidth: 1,
                      borderColor: isSelected ? theme.colors.primary : 'transparent',
                      overflow: 'hidden'
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => setAudience(option.value)}
                      style={{
                        paddingVertical: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8
                      }}
                    >
                      <MaterialCommunityIcons 
                        name={option.icon} 
                        size={24} 
                        color={isSelected ? theme.colors.onSecondaryContainer : theme.colors.onSurfaceVariant} 
                      />
                      <Text 
                        variant="labelLarge" 
                        style={{ 
                          color: isSelected ? theme.colors.onSecondaryContainer : theme.colors.onSurfaceVariant,
                          fontWeight: isSelected ? 'bold' : '500'
                        }}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  </Surface>
                );
              })}
            </View>

            {audience === 'specific' && (
              <View style={{ marginTop: 16 }}>
                <Button 
                  mode="outlined" 
                  onPress={() => setUserModalVisible(true)}
                  icon="account-plus"
                  style={{ borderRadius: 12, borderColor: theme.colors.primary }}
                  textColor={theme.colors.primary}
                >
                  {selectedUsers.length > 0 
                    ? `Seleccionados: ${selectedUsers.length} usuarios` 
                    : 'Seleccionar Usuarios Destinatarios'}
                </Button>
                
                {selectedUsers.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }} contentContainerStyle={{ paddingRight: 20 }}>
                    {selectedUsers.map(uid => {
                      const user = allUsers.find(u => u.id === uid);
                      return (
                        <Chip 
                          key={uid} 
                          onClose={() => toggleUserSelection(uid)}
                          style={{ marginRight: 8, backgroundColor: theme.colors.secondaryContainer }}
                          textStyle={{ color: theme.colors.onSecondaryContainer }}
                          avatar={
                            user?.photoURL ? <Avatar.Image size={24} source={{ uri: user.photoURL }} /> : <Avatar.Text size={24} label={(user?.name || 'U').charAt(0)} />
                          }
                        >
                          {user?.name?.split(' ')[0] || 'Usuario'}
                        </Chip>
                      );
                    })}
                  </ScrollView>
                )}
              </View>
            )}
          </View>

          {/* Priority Selector */}
          <View style={styles.formGroup}>
            <OverlineText color={getPrimaryColor()}>PRIORIDAD</OverlineText>
            <SegmentedButtons
              value={priority}
              onValueChange={setPriority}
              buttons={[
                {
                  value: 'normal',
                  label: 'Informativa',
                  icon: 'bell-outline',
                  style: { borderTopLeftRadius: 24, borderBottomLeftRadius: 24 }
                },
                {
                  value: 'high',
                  label: 'Urgente',
                  icon: 'alert-circle-outline',
                  checkedColor: theme.colors.onErrorContainer,
                  style: { 
                    backgroundColor: priority === 'high' ? theme.colors.errorContainer : undefined,
                    borderTopRightRadius: 24, 
                    borderBottomRightRadius: 24 
                  }
                },
              ]}
              style={{ marginTop: 12 }}
            />
          </View>

          {/* Inputs */}
          <View style={styles.formGroup}>
            <TextInput
              label="Título del mensaje"
              value={title}
              onChangeText={setTitle}
              mode="outlined"
              outlineStyle={{ borderRadius: 16 }}
              style={{ backgroundColor: theme.colors.surface }}
            />
          </View>

          <View style={styles.formGroup}>
            <TextInput
              label="Contenido detallado"
              value={message}
              onChangeText={setMessage}
              mode="outlined"
              multiline
              numberOfLines={10} // Increased height
              outlineStyle={{ borderRadius: 24 }}
              style={{ backgroundColor: theme.colors.surface, paddingVertical: 12, minHeight: 160 }}
            />
          </View>

          {/* Attachment Section */}
          <View style={styles.formGroup}>
            <OverlineText color={getPrimaryColor()}>ADJUNTOS</OverlineText>
            <View style={{ marginTop: 12 }}>
              {!attachment ? (
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <Button 
                    mode="outlined" 
                    onPress={pickDocument}
                    icon="file-document-outline"
                    style={{ flex: 1, borderRadius: 12, borderStyle: 'dashed' }}
                    textColor={theme.colors.onSurfaceVariant}
                  >
                    Archivo
                  </Button>
                  <Button 
                    mode="outlined" 
                    onPress={takePhoto}
                    icon="camera-outline"
                    style={{ flex: 1, borderRadius: 12, borderStyle: 'dashed' }}
                    textColor={theme.colors.onSurfaceVariant}
                  >
                    Cámara
                  </Button>
                </View>
              ) : (
                <Surface style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  padding: 12, 
                  borderRadius: 16, 
                  backgroundColor: theme.colors.surfaceContainerHigh 
                }} elevation={0}>
                  <View style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 8, 
                    backgroundColor: theme.colors.primaryContainer,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12
                  }}>
                    <MaterialCommunityIcons 
                      name={attachment.mimeType?.includes('image') ? 'image' : 'file-pdf-box'} 
                      size={24} 
                      color={theme.colors.primary} 
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyMedium" numberOfLines={1} style={{ fontWeight: '600' }}>
                      {attachment.name}
                    </Text>
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {attachment.size ? (attachment.size / 1024 / 1024).toFixed(2) + ' MB' : 'Archivo adjunto'}
                    </Text>
                  </View>
                  <IconButton 
                    icon="close" 
                    size={20} 
                    onPress={() => setAttachment(null)} 
                  />
                </Surface>
              )}
            </View>
          </View>

          {/* Live Preview */}
          {(title || message || attachment) && (
            <View style={styles.previewContainer}>
              <OverlineText color={theme.colors.onSurfaceVariant} style={{ marginBottom: 12 }}>VISTA PREVIA</OverlineText>
              <Surface style={[styles.previewCard, { backgroundColor: theme.colors.surfaceContainerLow }]} elevation={0}>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <View style={[styles.iconBox, { backgroundColor: priority === 'high' ? theme.colors.errorContainer : theme.colors.primaryContainer }]}>
                    <MaterialCommunityIcons 
                      name={priority === 'high' ? "alert" : "bell"} 
                      size={24} 
                      color={priority === 'high' ? theme.colors.onErrorContainer : theme.colors.onPrimaryContainer} 
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>
                      {title || 'Título de la alerta'}
                    </Text>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                      {message || 'El contenido de tu mensaje aparecerá aquí...'}
                    </Text>
                    
                    {/* Link Preview */}
                    {linkPreview && (
                      <Surface style={{ 
                        marginTop: 8, 
                        borderRadius: 12, 
                        backgroundColor: theme.colors.surface, 
                        overflow: 'hidden',
                        borderWidth: 1,
                        borderColor: theme.colors.outlineVariant
                      }} elevation={0}>
                        <View style={{ padding: 12, flexDirection: 'row', alignItems: 'center' }}>
                          <View style={{ 
                            width: 32, 
                            height: 32, 
                            borderRadius: 16, 
                            backgroundColor: theme.colors.secondaryContainer,
                            alignItems: 'center', 
                            justifyContent: 'center',
                            marginRight: 12
                          }}>
                            <MaterialCommunityIcons name="web" size={18} color={theme.colors.onSecondaryContainer} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text variant="labelLarge" numberOfLines={1} style={{ color: theme.colors.primary }}>
                              {linkPreview.domain}
                            </Text>
                            <Text variant="bodySmall" numberOfLines={1} style={{ color: theme.colors.onSurfaceVariant }}>
                              {linkPreview.url}
                            </Text>
                          </View>
                          <MaterialCommunityIcons name="open-in-new" size={16} color={theme.colors.outline} />
                        </View>
                      </Surface>
                    )}

                    {attachment && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: 'rgba(0,0,0,0.05)', padding: 8, borderRadius: 8 }}>
                        <MaterialCommunityIcons name="paperclip" size={16} color={theme.colors.primary} />
                        <Text variant="labelSmall" style={{ marginLeft: 4, color: theme.colors.primary, fontWeight: '600' }}>
                          {attachment.name}
                        </Text>
                      </View>
                    )}
                    <Text variant="labelSmall" style={{ color: theme.colors.outline, marginTop: 8 }}>
                      Ahora mismo
                    </Text>
                  </View>
                </View>
              </Surface>
            </View>
          )}

          {/* Action Button */}
          <View style={{ gap: 12, marginTop: 24 }}>
            <Button 
              mode="contained" 
              onPress={handleSend} 
              loading={loading}
              disabled={loading}
              style={{ borderRadius: 28 }}
              contentStyle={{ height: 56 }}
              icon={isEditing ? "content-save" : "send"}
              labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
            >
              {isEditing ? "Actualizar Alerta" : "Enviar Notificación"}
            </Button>
            
            {isEditing && (
              <Button 
                mode="outlined" 
                onPress={() => {
                  setIsEditing(false);
                  setEditingAlertIds([]);
                  setOriginalAttachment(null);
                  setTitle('');
                  setMessage('');
                  setAttachment(null);
                }}
                style={{ borderRadius: 28 }}
                contentStyle={{ height: 48 }}
                textColor={theme.colors.error}
              >
                Cancelar Edición
              </Button>
            )}
          </View>

          {/* Recent History */}
          {recentAlerts.length > 0 && (
            <View style={styles.historyContainer}>
              <Divider style={{ marginVertical: 32 }} />
              <OverlineText color={theme.colors.onSurfaceVariant} style={{ marginBottom: 16 }}>ENVIADOS RECIENTEMENTE</OverlineText>
              {recentAlerts.map((alert) => {
                const isHighPriority = alert.priority === 'high';
                const icon = isHighPriority ? 'alert' : 'bullhorn';
                const color = isHighPriority ? theme.colors.error : theme.colors.primary;
                
                return (
                  <TouchableOpacity key={alert.id} onPress={() => openHistoryDetail(alert)} activeOpacity={0.7}>
                    <Surface 
                      style={[
                        styles.historyCard, 
                        { 
                          backgroundColor: theme.colors.surfaceContainerLow,
                          borderColor: theme.colors.outlineVariant,
                          borderWidth: 1
                        }
                      ]} 
                      elevation={0}
                    >
                      <View style={[styles.historyIconContainer, { backgroundColor: theme.colors.surfaceContainerHigh }]}>
                        <MaterialCommunityIcons name={icon} size={24} color={color} />
                      </View>
                      
                      <View style={styles.historyTextContainer}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Text variant="titleMedium" style={{ fontWeight: '600', color: theme.colors.onSurface, flex: 1 }}>
                            {alert.title}
                          </Text>
                        </View>
                        
                        <Text variant="bodyMedium" numberOfLines={2} style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                          {alert.message}
                        </Text>
                        
                        <Text variant="labelSmall" style={{ color: theme.colors.outline, marginTop: 8 }}>
                          {alert.createdAt ? formatDistanceToNow(alert.createdAt.toDate(), { addSuffix: true, locale: es }) : 'Reciente'}
                        </Text>
                      </View>
                    </Surface>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>

      {/* History Detail Modal */}
      <Modal
        visible={historyModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setHistoryModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 }}>
          <Surface style={{ borderRadius: 28, padding: 24, backgroundColor: theme.colors.surfaceContainerHigh }} elevation={0}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Text variant="headlineSmall" style={{ fontWeight: '400', fontFamily: 'Roboto-Flex' }}>Detalle de Alerta</Text>
              <IconButton icon="close" onPress={() => setHistoryModalVisible(false)} />
            </View>

            {selectedHistoryItem && (
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
                  <View style={{ 
                    width: 48, 
                    height: 48, 
                    borderRadius: 24, 
                    backgroundColor: selectedHistoryItem.priority === 'high' ? theme.colors.errorContainer : theme.colors.primaryContainer,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <MaterialCommunityIcons 
                      name={selectedHistoryItem.priority === 'high' ? 'alert' : 'bell'} 
                      size={24} 
                      color={selectedHistoryItem.priority === 'high' ? theme.colors.onErrorContainer : theme.colors.onPrimaryContainer} 
                    />
                  </View>
                  <View style={{ marginLeft: 16 }}>
                    <OverlineText color={theme.colors.onSurfaceVariant}>ENVIADO EL</OverlineText>
                    <Text variant="bodyLarge" style={{ fontWeight: '500', color: theme.colors.onSurface }}>
                      {selectedHistoryItem.createdAt ? format(selectedHistoryItem.createdAt.toDate(), "d 'de' MMMM, h:mm a", { locale: es }) : 'Fecha desconocida'}
                    </Text>
                  </View>
                </View>

                <Divider style={{ marginBottom: 24 }} />

                <View style={{ flexDirection: 'row', marginBottom: 24 }}>
                  <View style={{ flex: 1 }}>
                    <OverlineText color={theme.colors.onSurfaceVariant} style={{ marginBottom: 8 }}>REMITENTE</OverlineText>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Avatar.Text 
                        size={32} 
                        label={(selectedHistoryItem.senderName || 'A').charAt(0)} 
                        style={{ backgroundColor: theme.colors.secondaryContainer }}
                        color={theme.colors.onSecondaryContainer}
                      />
                      <View style={{ marginLeft: 12 }}>
                        <Text variant="bodyMedium" style={{ fontWeight: '600', color: theme.colors.onSurface }}>
                          {selectedHistoryItem.senderName || 'Administrador (Sistema)'}
                        </Text>
                        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                          {selectedHistoryItem.senderRole || 'ADMIN'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={{ marginBottom: 24 }}>
                  <OverlineText color={theme.colors.onSurfaceVariant} style={{ marginBottom: 8 }}>DESTINATARIO</OverlineText>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialCommunityIcons name="account-arrow-right" size={20} color={theme.colors.primary} />
                    <Text variant="bodyMedium" style={{ marginLeft: 12, color: theme.colors.onSurface, flex: 1 }}>
                      {(() => {
                        const { audience, recipients, uid } = selectedHistoryItem;
                        
                        // 1. Audiencias predefinidas (Nuevas alertas)
                        if (audience === 'all') return 'Todos';
                        if (audience === 'active') return 'Activos';
                        if (audience === 'admins') return 'Admins';
                        
                        // 2. Lógica para alertas antiguas (Legacy) o Específicas
                        if (recipients && recipients.length > 0) {
                          // Heurística: Si no tiene campo audience pero los destinatarios son casi todos los usuarios
                          if (!audience && allUsers.length > 0 && recipients.length >= (allUsers.length - 1)) {
                            return 'Todos';
                          }

                          // Mostrar nombres (Específico)
                          return recipients
                            .map(rUid => allUsers.find(u => u.id === rUid)?.name || 'Usuario')
                            .join(', ');
                        }
                        
                        // 3. Fallback para alertas antiguas individuales
                        return allUsers.find(u => u.id === uid)?.name || 'Usuario del Sistema';
                      })()}
                    </Text>
                  </View>
                </View>

                <View style={{ marginBottom: 24 }}>
                  <OverlineText color={theme.colors.onSurfaceVariant} style={{ marginBottom: 8 }}>MENSAJE</OverlineText>
                  <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 8, color: theme.colors.onSurface }}>
                    {selectedHistoryItem.title}
                  </Text>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, lineHeight: 20 }}>
                    {selectedHistoryItem.message}
                  </Text>
                </View>

                {selectedHistoryItem.attachment && (
                  <Surface style={{ 
                    borderRadius: 16, 
                    backgroundColor: theme.colors.surface, 
                    borderWidth: 1, 
                    borderColor: theme.colors.outlineVariant,
                    overflow: 'hidden'
                  }} elevation={0}>
                    <TouchableOpacity 
                      onPress={() => Linking.openURL(selectedHistoryItem.attachment.url)}
                      style={{ flexDirection: 'row', alignItems: 'center', padding: 12 }}
                    >
                      <MaterialCommunityIcons name="paperclip" size={20} color={theme.colors.primary} />
                      <Text variant="labelLarge" style={{ marginLeft: 12, color: theme.colors.primary, flex: 1 }}>
                        {selectedHistoryItem.attachment.name}
                      </Text>
                      <MaterialCommunityIcons name="open-in-new" size={16} color={theme.colors.onSurfaceVariant} />
                    </TouchableOpacity>
                  </Surface>
                )}

                <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
                  <Button 
                    mode="outlined" 
                    onPress={() => handleEditAlert(selectedHistoryItem)}
                    style={{ flex: 1, borderColor: theme.colors.primary }}
                    textColor={theme.colors.primary}
                    icon="pencil"
                  >
                    Editar
                  </Button>
                  <Button 
                    mode="outlined" 
                    onPress={() => handleDeleteAlert(selectedHistoryItem)}
                    style={{ flex: 1, borderColor: theme.colors.error }}
                    textColor={theme.colors.error}
                    icon="delete"
                  >
                    Eliminar
                  </Button>
                </View>
              </View>
            )}
          </Surface>
        </View>
      </Modal>

      {/* User Selection Modal - Material You Expressive Design */}
      <Modal
        visible={userModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setUserModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
          {/* Header con diseño elevado */}
          <View style={{ 
            padding: 20, 
            backgroundColor: theme.colors.surfaceContainerLow,
            borderBottomLeftRadius: 24,
            borderBottomRightRadius: 24,
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            elevation: 0
          }}>
            <Text variant="titleLarge" style={{ fontWeight: '600', color: theme.colors.onSurface }}>
              Seleccionar Usuarios
            </Text>
            <Button 
              mode="text" 
              onPress={() => setUserModalVisible(false)}
              textColor={getPrimaryColor()}
            >
              Listo
            </Button>
          </View>
          
          {/* Searchbar con diseño orgánico */}
          <View style={{ padding: 20, paddingBottom: 16 }}>
            <Searchbar
              placeholder="Buscar usuario..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={{ 
                backgroundColor: theme.colors.surfaceContainerHigh,
                borderRadius: 32,
                elevation: 0
              }}
              inputStyle={{ fontSize: 14 }}
              iconColor={theme.colors.onSurfaceVariant}
            />
          </View>

          {/* Lista de usuarios con cards orgánicas */}
          <FlatList
            data={filteredUsers}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 12 }}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            renderItem={({ item }) => {
              const isSelected = selectedUsers.includes(item.id);
              return (
                <TouchableOpacity 
                  onPress={() => toggleUserSelection(item.id)}
                  activeOpacity={0.7}
                  style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    padding: 16,
                    paddingVertical: 14,
                    borderRadius: 24,
                    backgroundColor: isSelected 
                      ? theme.colors.primaryContainer 
                      : theme.colors.surfaceContainerLow,
                    elevation: 0,
                    borderWidth: isSelected ? 2 : 0,
                    borderColor: isSelected ? getPrimaryColor() : 'transparent'
                  }}
                >
                  {/* Avatar con tamaño Material You (48px mínimo) */}
                  {item.photoURL ? (
                    <Avatar.Image 
                      size={48} 
                      source={{ uri: item.photoURL }}
                      style={{ 
                        backgroundColor: theme.colors.surfaceContainerHigh 
                      }}
                    />
                  ) : (
                    <Avatar.Text 
                      size={48} 
                      label={(item.name || 'U').charAt(0).toUpperCase()}
                      style={{ 
                        backgroundColor: getPrimaryColor() 
                      }}
                      labelStyle={{ 
                        color: theme.colors.onPrimary,
                        fontWeight: '600'
                      }}
                    />
                  )}
                  
                  {/* Información del usuario */}
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text 
                      variant="bodyLarge" 
                      style={{ 
                        fontWeight: '600',
                        color: isSelected ? theme.colors.onPrimaryContainer : theme.colors.onSurface,
                        marginBottom: 2
                      }}
                    >
                      {item.name || 'Usuario'}
                    </Text>
                    <Text 
                      variant="bodySmall" 
                      style={{ 
                        color: isSelected 
                          ? theme.colors.onPrimaryContainer 
                          : theme.colors.onSurfaceVariant,
                        fontSize: 12
                      }}
                    >
                      {item.email}
                    </Text>
                  </View>
                  
                  {/* Checkbox con diseño mejorado */}
                  <Checkbox 
                    status={isSelected ? 'checked' : 'unchecked'} 
                    onPress={() => toggleUserSelection(item.id)}
                    color={getPrimaryColor()}
                  />
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  formGroup: {
    marginBottom: 24,
  },
  previewContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  previewCard: {
    borderRadius: 24,
    padding: 16,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyContainer: {
    paddingBottom: 20,
  },
  historyCard: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 12,
    borderRadius: 24,
  },
  historyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyTextContainer: {
    flex: 1,
    marginLeft: 16,
  }
});
