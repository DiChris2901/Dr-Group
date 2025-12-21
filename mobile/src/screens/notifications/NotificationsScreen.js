import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Modal, TouchableOpacity, Linking } from 'react-native';
import { Text, useTheme, Surface, Avatar, IconButton, ActivityIndicator, Divider, SegmentedButtons, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc, limit } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { OverlineText } from '../../components';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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

  useEffect(() => {
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

    return () => unsubscribe();
  }, [user, filter, limitCount]);

  const loadMore = () => {
    setLimitCount(prev => prev + 20);
  };

  const markAsRead = async (id, currentReadStatus) => {
    if (currentReadStatus) return;
    try {
      const notifRef = doc(db, 'notifications', id);
      await updateDoc(notifRef, { read: true });
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'admin_alert': return 'bullhorn';
      case 'system': return 'information';
      case 'reminder': return 'clock-outline';
      default: return 'bell-outline';
    }
  };

  const getColor = (type, priority) => {
    if (priority === 'high') return theme.colors.error;
    switch (type) {
      case 'admin_alert': return theme.colors.primary;
      case 'system': return theme.colors.secondary;
      default: return theme.colors.tertiary;
    }
  };

  const openDetail = (item) => {
    setSelectedNotification(item);
    setModalVisible(true);
    if (!item.read) {
      markAsRead(item.id, item.read);
    }
  };

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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
        <Text variant="headlineSmall" style={{ fontWeight: '400', fontFamily: 'Roboto-Flex', marginLeft: 8 }}>
          Notificaciones
        </Text>
      </View>

      <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
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

      {loading && notifications.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
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
            <View style={styles.empty}>
              <MaterialCommunityIcons name="bell-sleep-outline" size={64} color={theme.colors.outline} />
              <Text variant="titleMedium" style={{ marginTop: 16, color: theme.colors.onSurfaceVariant }}>
                No tienes notificaciones nuevas
              </Text>
            </View>
          }
        />
      )}

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  list: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
