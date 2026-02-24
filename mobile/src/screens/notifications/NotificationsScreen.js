import React, { useState, useEffect, useCallback, memo, useRef, useMemo } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Modal, TouchableOpacity, Linking, Alert } from 'react-native';
import { Text, useTheme, Surface, Avatar, IconButton, ActivityIndicator, SegmentedButtons, Button, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc, limit, getDocs, writeBatch, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { OverlineText } from '../../components';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import materialTheme from '../../../material-theme.json';

export default function NotificationsScreen({ navigation }) {
  const theme = useTheme();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  
  // Filters & Pagination
  const [filter, setFilter] = useState('unread'); // all, unread, high
  const [limitCount, setLimitCount] = useState(20);
  const unsubscribeRef = useRef(null);
  
  // Action state
  const [actionLoading, setActionLoading] = useState(false);

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
      background: scheme.background,
      outlineVariant: scheme.outlineVariant,
      errorContainer: scheme.errorContainer,
      onErrorContainer: scheme.onErrorContainer
    };
  }, [theme.dark]);

  // ✅ Memoizar helpers para evitar recreaciones
  const getIcon = useCallback((type) => {
    switch (type) {
      case 'admin_alert': return 'bullhorn';
      case 'system': return 'information';
      case 'reminder': return 'clock-outline';
      default: return 'bell-outline';
    }
  }, []);

  const getColor = useCallback((type, priority) => {
    if (priority === 'high') return theme.colors.error;
    switch (type) {
      case 'admin_alert': return theme.colors.primary;
      case 'system': return theme.colors.secondary;
      default: return theme.colors.tertiary;
    }
  }, [theme]);

  const markAsRead = useCallback(async (id, currentReadStatus) => {
    if (currentReadStatus) return;
    try {
      const notifRef = doc(db, 'notifications', id);
      await updateDoc(notifRef, { read: true });
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  }, []);

  const loadMore = useCallback(() => {
    setLimitCount(prev => prev + 20);
  }, []);
  
  // ✅ Marcar todas como leídas
  const markAllAsRead = useCallback(async () => {
    if (actionLoading) return;
    
    try {
      setActionLoading(true);
      
      // Query para todas las notificaciones no leídas del usuario
      const q = query(
        collection(db, 'notifications'),
        where('uid', '==', user.uid),
        where('read', '==', false)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        Alert.alert('Info', 'No tienes notificaciones sin leer');
        setActionLoading(false);
        return;
      }
      
      // Usar batch para actualizar múltiples documentos
      const batch = writeBatch(db);
      snapshot.docs.forEach((document) => {
        batch.update(document.ref, { read: true });
      });
      
      await batch.commit();
      
      Alert.alert(
        'Éxito',
        `${snapshot.size} notificación${snapshot.size > 1 ? 'es' : ''} marcada${snapshot.size > 1 ? 's' : ''} como leída${snapshot.size > 1 ? 's' : ''}`,
        [{ text: 'OK' }]
      );
      
      setActionLoading(false);
    } catch (error) {
      console.error('Error marcando todas como leídas:', error);
      Alert.alert('Error', 'No se pudieron marcar las notificaciones como leídas');
      setActionLoading(false);
    }
  }, [user, actionLoading]);
  
  // ✅ Eliminar todas las notificaciones
  const deleteAllNotifications = useCallback(async () => {
    if (actionLoading) return;
    
    Alert.alert(
      '¿Eliminar todas?',
      'Esta acción eliminará permanentemente todas tus notificaciones. No se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              
              // Query para todas las notificaciones del usuario (uid Y userId para cubrir ambos formatos)
              const [snapUid, snapUserId] = await Promise.all([
                getDocs(query(collection(db, 'notifications'), where('uid', '==', user.uid))),
                getDocs(query(collection(db, 'notifications'), where('userId', '==', user.uid))),
              ]);

              // Combinar resultados evitando duplicados por ID
              const seenIds = new Set();
              const allDocs = [];
              [...snapUid.docs, ...snapUserId.docs].forEach(d => {
                if (!seenIds.has(d.id)) {
                  seenIds.add(d.id);
                  allDocs.push(d);
                }
              });
              
              if (allDocs.length === 0) {
                Alert.alert('Info', 'No tienes notificaciones para eliminar');
                setActionLoading(false);
                return;
              }
              
              // Firestore batch: máximo 500 operaciones por batch
              // Dividimos en chunks de 400 para tener margen de seguridad
              const CHUNK_SIZE = 400;
              const chunks = [];
              for (let i = 0; i < allDocs.length; i += CHUNK_SIZE) {
                chunks.push(allDocs.slice(i, i + CHUNK_SIZE));
              }

              await Promise.all(
                chunks.map(chunk => {
                  const batch = writeBatch(db);
                  chunk.forEach(document => batch.delete(document.ref));
                  return batch.commit();
                })
              );
              
              Alert.alert(
                'Eliminadas',
                `${allDocs.length} notificación${allDocs.length > 1 ? 'es' : ''} eliminada${allDocs.length > 1 ? 's' : ''}`,
                [{ text: 'OK' }]
              );
              
              setActionLoading(false);
            } catch (error) {
              console.error('Error eliminando notificaciones:', error);
              Alert.alert('Error', `No se pudieron eliminar las notificaciones: ${error.message}`);
              setActionLoading(false);
            }
          }
        }
      ]
    );
  }, [user, actionLoading]);

  // ✅ useFocusEffect para limpiar listener al perder foco
  useFocusEffect(
    useCallback(() => {
    if (!user?.uid) {
      setNotifications([]);
      setLoading(false);
      return () => {}; // ✅ Cleanup vacío cuando no hay usuario
    }

    setLoading(true);
    
    // Base query
    let constraints = [
      where('uid', '==', user.uid)
    ];

    // Apply filters
    if (filter === 'unread') {
      constraints.push(where('read', '==', false));
    } else if (filter === 'high') {
      constraints.push(where('priority', '==', 'high'));
    }

    // Apply sort and limit
    constraints.push(orderBy('createdAt', 'desc'));
    constraints.push(limit(limitCount));

    const q = query(collection(db, 'notifications'), ...constraints);

    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        const notifs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setNotifications(notifs);
        setLoading(false);
      }, 
      (error) => {
        console.log("⚠️ Error en listener de notificaciones (esperado al cerrar sesión):", error.code);
        setLoading(false);
      }
    );

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [user, filter, limitCount])
  );

  const openDetail = useCallback((item) => {
    setSelectedNotification(item);
    setModalVisible(true);
    if (!item.read) {
      markAsRead(item.id, item.read);
    }
  }, [markAsRead]);

  const renderItem = ({ item }) => {
    const icon = getIcon(item.type);
    const color = getColor(item.type, item.priority);
    const isUnread = !item.read;

    return (
      <TouchableOpacity onPress={() => openDetail(item)} activeOpacity={0.7}>
        <Surface 
          style={[
            styles.card, 
            { 
              backgroundColor: isUnread ? theme.colors.secondaryContainer : theme.colors.surfaceContainerLow,
              borderColor: isUnread ? 'transparent' : theme.colors.outlineVariant,
              borderWidth: isUnread ? 0 : 1
            }
          ]} 
          elevation={0}
        >
          <View style={[styles.iconContainer, { backgroundColor: isUnread ? theme.colors.background : theme.colors.surfaceContainerHigh }]}>
            <MaterialCommunityIcons name={icon} size={24} color={color} />
          </View>
          
          <View style={styles.textContainer}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Text variant="titleMedium" style={{ fontWeight: isUnread ? '700' : '600', color: theme.colors.onSurface, flex: 1 }}>
                {item.title}
              </Text>
              {isUnread && (
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primary, marginLeft: 8, marginTop: 6 }} />
              )}
            </View>
            
            <Text variant="bodyMedium" numberOfLines={2} style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
              {item.message}
            </Text>
            
            <Text variant="labelSmall" style={{ color: theme.colors.outline, marginTop: 8 }}>
              {item.createdAt ? formatDistanceToNow(item.createdAt.toDate(), { addSuffix: true, locale: es }) : 'Reciente'}
            </Text>
          </View>
        </Surface>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: surfaceColors.background }]}>
      {/* Header Expresivo */}
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 }}>
        {/* Header Top - Navigation Buttons */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.goBack();
            }}
            iconColor={surfaceColors.onSurface}
          />
          <IconButton
            icon="bell-outline"
            mode="contained-tonal"
            size={20}
            iconColor={surfaceColors.primary}
            style={{
              backgroundColor: surfaceColors.primaryContainer,
            }}
          />
        </View>
        
        {/* Header Content - Title */}
        <View style={{ paddingHorizontal: 4 }}>
          <Text style={{ 
            fontFamily: 'Roboto-Flex', 
            fontSize: 57,
            lineHeight: 64,
            fontWeight: '400', 
            color: surfaceColors.onSurface, 
            letterSpacing: -0.5,
            fontVariationSettings: [{ axis: 'wdth', value: 110 }]
          }}>
            Notificaciones
          </Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
        <SegmentedButtons
          value={filter}
          onValueChange={setFilter}
          buttons={[
            { value: 'all', label: 'Todas' },
            { value: 'unread', label: 'No leídas' },
            { value: 'high', label: 'Urgentes' },
          ]}
          density="medium"
        />
      </View>

      {/* Botones de acción */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 20, marginBottom: 16, gap: 12 }}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: surfaceColors.primaryContainer,
              opacity: (actionLoading || notifications.filter(n => !n.read).length === 0) ? 0.5 : 1
            }
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            markAllAsRead();
          }}
          disabled={actionLoading || notifications.filter(n => !n.read).length === 0}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons 
            name="check-all" 
            size={20} 
            color={surfaceColors.onPrimaryContainer} 
          />
          <Text style={[
            styles.actionButtonText, 
            { color: surfaceColors.onPrimaryContainer }
          ]}>
            Marcar Todas
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: surfaceColors.errorContainer,
              opacity: (actionLoading || notifications.length === 0) ? 0.5 : 1
            }
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            deleteAllNotifications();
          }}
          disabled={actionLoading || notifications.length === 0}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons 
            name="delete-outline" 
            size={20} 
            color={surfaceColors.onErrorContainer} 
          />
          <Text style={[
            styles.actionButtonText, 
            { color: surfaceColors.onErrorContainer }
          ]}>
            Eliminar Todas
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de notificaciones */}
      <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.list, notifications.length === 0 && { flex: 1 }]}
          ListFooterComponent={
            notifications.length >= limitCount ? (
              <Button 
                mode="text" 
                onPress={loadMore} 
                style={{ marginTop: 10, marginBottom: 20 }}
                loading={loading}
              >
                Cargar más antiguas
              </Button>
            ) : null
          }
          ListEmptyComponent={
            loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
              </View>
            ) : (
              <View style={styles.empty}>
                <MaterialCommunityIcons name="bell-sleep-outline" size={64} color={theme.colors.outline} />
                <Text variant="titleMedium" style={{ marginTop: 16, color: theme.colors.onSurfaceVariant }}>
                  No tienes notificaciones nuevas
                </Text>
              </View>
            )
          }
        />

      {/* Notification Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 }}>
          <Surface style={{ borderRadius: 28, padding: 24, backgroundColor: theme.colors.surfaceContainerHigh }} elevation={0}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Text variant="headlineSmall" style={{ fontWeight: '400', fontFamily: 'Roboto-Flex' }}>Detalle de Notificación</Text>
              <IconButton icon="close" onPress={() => setModalVisible(false)} />
            </View>

            {selectedNotification && (
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
                  <View style={{ 
                    width: 48, 
                    height: 48, 
                    borderRadius: 24, 
                    backgroundColor: selectedNotification.priority === 'high' ? theme.colors.errorContainer : theme.colors.primaryContainer,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <MaterialCommunityIcons 
                      name={selectedNotification.priority === 'high' ? 'alert' : 'bell'} 
                      size={24} 
                      color={selectedNotification.priority === 'high' ? theme.colors.onErrorContainer : theme.colors.onPrimaryContainer} 
                    />
                  </View>
                  <View style={{ marginLeft: 16 }}>
                    <OverlineText color={theme.colors.onSurfaceVariant}>RECIBIDO EL</OverlineText>
                    <Text variant="bodyLarge" style={{ fontWeight: '500', color: theme.colors.onSurface }}>
                      {selectedNotification.createdAt ? format(selectedNotification.createdAt.toDate(), "d 'de' MMMM, h:mm a", { locale: es }) : 'Fecha desconocida'}
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
                        label={(selectedNotification.senderName || 'A').charAt(0)} 
                        style={{ backgroundColor: theme.colors.secondaryContainer }}
                        color={theme.colors.onSecondaryContainer}
                      />
                      <View style={{ marginLeft: 12 }}>
                        <Text variant="bodyMedium" style={{ fontWeight: '600', color: theme.colors.onSurface }}>
                          {selectedNotification.senderName || 'Administrador (Sistema)'}
                        </Text>
                        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                          {selectedNotification.senderRole || 'ADMIN'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={{ marginBottom: 24 }}>
                  <OverlineText color={theme.colors.onSurfaceVariant} style={{ marginBottom: 8 }}>MENSAJE</OverlineText>
                  <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 8, color: theme.colors.onSurface }}>
                    {selectedNotification.title}
                  </Text>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, lineHeight: 20 }}>
                    {selectedNotification.message}
                  </Text>
                </View>

                {selectedNotification.attachment && (
                  <Surface style={{ 
                    borderRadius: 16, 
                    backgroundColor: theme.colors.surface, 
                    borderWidth: 1, 
                    borderColor: theme.colors.outlineVariant,
                    overflow: 'hidden'
                  }} elevation={0}>
                    <TouchableOpacity 
                      onPress={() => Linking.openURL(selectedNotification.attachment.url)}
                      style={{ flexDirection: 'row', alignItems: 'center', padding: 12 }}
                    >
                      <MaterialCommunityIcons name="paperclip" size={20} color={theme.colors.primary} />
                      <Text variant="labelLarge" style={{ marginLeft: 12, color: theme.colors.primary, flex: 1 }}>
                        {selectedNotification.attachment.name}
                      </Text>
                      <MaterialCommunityIcons name="open-in-new" size={16} color={theme.colors.onSurfaceVariant} />
                    </TouchableOpacity>
                  </Surface>
                )}
              </View>
            )}
          </Surface>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 24,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  card: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 12,
    borderRadius: 24, // Material You Expressive
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: 16,
  },
  empty: {
    alignItems: 'center',
    marginTop: 80,
    opacity: 0.7
  }
});
