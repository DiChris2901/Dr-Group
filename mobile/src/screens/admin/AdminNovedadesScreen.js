import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  RefreshControl,
  Animated,
  Linking,
  Dimensions,
  Pressable,
  ScrollView // Added ScrollView import
} from 'react-native';
import { 
  Text, 
  useTheme as usePaperTheme, 
  Avatar, 
  Searchbar,
  Portal,
  Modal,
  SegmentedButtons
} from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import materialTheme from '../../../material-theme.json';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import { collection, query, orderBy, getDocs, updateDoc, doc, onSnapshot, where, Timestamp, limit } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { SafeAreaView } from 'react-native-safe-area-context';

// Custom Hooks & Components
import { useTheme } from '../../contexts/ThemeContext';
import { usePermissions } from '../../hooks/usePermissions';
import { APP_PERMISSIONS } from '../../constants/permissions';
import ExpressiveCard from '../../components/ExpressiveCard';
import DetailRow from '../../components/DetailRow';
import OverlineText from '../../components/OverlineText';

const { width } = Dimensions.get('window');

export default function AdminNovedadesScreen({ navigation }) {
  const paperTheme = usePaperTheme();
  const { getPrimaryColor } = useTheme();
  const { can } = usePermissions();
  const primaryColor = getPrimaryColor();

  // Surface colors dinámicos
  const surfaceColors = useMemo(() => {
    const scheme = paperTheme.dark ? materialTheme.schemes.dark : materialTheme.schemes.light;
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
      errorContainer: scheme.errorContainer,
      onErrorContainer: scheme.onErrorContainer,
      tertiaryContainer: scheme.tertiaryContainer,
      onTertiaryContainer: scheme.onTertiaryContainer,
      surfaceVariant: scheme.surfaceVariant,
      background: scheme.background,
      error: scheme.error,
      outlineVariant: scheme.outlineVariant
    };
  }, [paperTheme.dark]);

  const [novedades, setNovedades] = useState([]);
  const [filteredNovedades, setFilteredNovedades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending'); // 'pending' | 'all'
  const [selectedNovedad, setSelectedNovedad] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // ✅ Ref para cleanup de listener
  const unsubscribeRef = useRef(null);

  // ✅ Real-time listener con useFocusEffect para cleanup al perder foco
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      const q = query(
        collection(db, 'novedades'), 
        orderBy('date', 'desc'),
        limit(50) // ✅ Solo últimas 50 novedades
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNovedades(data);
      // filterData se ejecutará automáticamente por el useEffect que depende de 'novedades'
      setLoading(false);
      setRefreshing(false);
    }, (error) => {
      console.error("Error escuchando novedades:", error);
      Alert.alert('Error', 'No se pudieron cargar las novedades en tiempo real');
      setLoading(false);
      setRefreshing(false);
    });
    
    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [])
);

  // Mantener onRefresh solo para el pull-to-refresh manual si es necesario,
  // aunque con onSnapshot ya no es estrictamente necesario, pero sirve para forzar reload si hay problemas de red.
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // El onSnapshot se encarga, pero simulamos un delay o podríamos reconectar
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const filterData = useCallback((data, query, status) => {
    let filtered = data;
    
    // Filter by Status
    if (status === 'pending') {
      filtered = filtered.filter(item => item.status === 'pending');
    }

    // Filter by Search
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(item => 
        item.userName?.toLowerCase().includes(lowerQuery) ||
        item.type?.toLowerCase().includes(lowerQuery)
      );
    }

    setFilteredNovedades(filtered);
  }, []);

  useEffect(() => {
    filterData(novedades, searchQuery, filterStatus);
  }, [searchQuery, filterStatus, novedades, filterData]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const item = novedades.find(n => n.id === id);

      // Optimistic Update
      setNovedades(prev => prev.map(n => 
        n.id === id ? { ...n, status: newStatus } : n
      ));

      await updateDoc(doc(db, 'novedades', id), { status: newStatus });
      
      // ✅ Lógica de Reapertura Automática
      if (newStatus === 'approved' && item?.type === 'solicitud_reapertura') {
        try {
            const dateObj = item.date.toDate();
            const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
            
            // Buscar el documento de asistencia correcto (ID autogenerado)
            const qAsistencia = query(
                collection(db, 'asistencias'),
                where('uid', '==', item.uid),
                where('fecha', '==', dateStr)
            );
            
            const snapshot = await getDocs(qAsistencia);
            
            if (!snapshot.empty) {
                // ✅ Ordenar en memoria para evitar errores de índice y asegurar el último registro
                const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                docs.sort((a, b) => {
                    const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
                    const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
                    return timeB - timeA;
                });

                const docData = docs[0];
                const docId = docData.id;

                // ❌ Lógica de "Gap" ELIMINADA a petición del usuario.
                // Al reabrir, se asume que el tiempo transcurrido SÍ fue trabajado.
                // Simplemente borramos la salida y dejamos que el contador siga corriendo.
                
                await updateDoc(doc(db, 'asistencias', docId), {
                    salida: null,
                    horasTrabajadas: null,
                    estadoActual: 'trabajando'
                    // No tocamos los breaks
                });
                Alert.alert('Reapertura Exitosa', 'La jornada ha sido reabierta. El tiempo transcurrido contará como trabajado.');
            } else {
                throw new Error('No se encontró registro de asistencia para esta fecha');
            }
        } catch (err) {
            console.error("Error reabriendo jornada:", err);
            Alert.alert('Advertencia', 'Se aprobó la novedad pero no se pudo reabrir la jornada automáticamente. Verifique si existe el registro.');
        }
      }

      if (selectedNovedad?.id === id) {
        setSelectedNovedad(prev => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el estado');
      // fetchNovedades(); // Ya no es necesario revertir manualmente, onSnapshot lo hará si falla en servidor
    }
  };

  const renderRightActions = (progress, dragX, item) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 100],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.rightActionContainer}>
        <Animated.View style={[
          styles.actionButton, 
          { 
            backgroundColor: surfaceColors.errorContainer, 
            transform: [{ translateX: trans }],
            borderRadius: 100, // Pill/Circle shape
            width: 80, // Fixed width for circle/pill
            height: 80, // Fixed height
            marginRight: 24, // Spacing from edge
          }
        ]}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              handleStatusChange(item.id, 'rejected');
            }}
            style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
            android_ripple={{ color: surfaceColors.onErrorContainer + '1F', borderless: true }}
          >
            <MaterialCommunityIcons name="close" size={32} color={surfaceColors.onErrorContainer} />
          </Pressable>
        </Animated.View>
      </View>
    );
  };

  const renderLeftActions = (progress, dragX, item) => {
    const trans = dragX.interpolate({
      inputRange: [0, 100],
      outputRange: [-100, 0],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.leftActionContainer}>
        <Animated.View style={[
          styles.actionButton, 
          { 
            backgroundColor: surfaceColors.primaryContainer, 
            transform: [{ translateX: trans }],
            borderRadius: 100, // Pill/Circle shape
            width: 80,
            height: 80,
            marginLeft: 24,
          }
        ]}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              handleStatusChange(item.id, 'approved');
            }}
            style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
            android_ripple={{ color: surfaceColors.onPrimaryContainer + '1F', borderless: true }}
          >
            <MaterialCommunityIcons name="check" size={32} color={surfaceColors.onPrimaryContainer} />
          </Pressable>
        </Animated.View>
      </View>
    );
  };

  const renderItem = ({ item }) => (
    <Swipeable
      renderRightActions={(p, d) => renderRightActions(p, d, item)}
      renderLeftActions={(p, d) => renderLeftActions(p, d, item)}
      containerStyle={{ overflow: 'visible' }} // Allow shadows/elevation to show
    >
      <ExpressiveCard 
        onPress={() => { setSelectedNovedad(item); setModalVisible(true); }}
        style={{ marginBottom: 16 }}
        variant="outlined" // ✅ CORRECCIÓN: Forzar variante outlined para tener borde
      >
        <View style={styles.cardHeader}>
          <Avatar.Text 
            size={48} // Larger avatar for expressive touch
            label={item.userName ? item.userName.substring(0, 2).toUpperCase() : 'NA'} 
            style={{ backgroundColor: surfaceColors.primaryContainer }}
            color={surfaceColors.onPrimaryContainer}
            labelStyle={{ fontWeight: '600' }}
          />
          <View style={styles.headerText}>
            <Text style={{ 
              fontFamily: 'Roboto-Flex', 
              fontSize: 18, 
              fontWeight: '500', 
              color: surfaceColors.onSurface,
              fontVariationSettings: [{ axis: 'wdth', value: 110 }] // Google Look
            }}>
              {item.userName || 'Usuario'}
            </Text>
            <Text variant="bodyMedium" style={{ color: surfaceColors.onSurfaceVariant, marginTop: 2 }}>
              {item.date?.toDate ? format(item.date.toDate(), "d MMM, h:mm a", { locale: es }) : 'Fecha inválida'}
            </Text>
          </View>
          
          {/* Status Chip - Material 3 Assist Chip Style */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: item.status === 'pending' ? surfaceColors.outlineVariant : 'transparent',
            backgroundColor: item.status === 'pending' ? 'transparent' : item.status === 'approved' ? surfaceColors.primaryContainer : surfaceColors.errorContainer
          }}>
            <MaterialCommunityIcons 
              name={item.status === 'pending' ? 'clock-outline' : item.status === 'approved' ? 'check' : 'close'}
              size={16}
              color={item.status === 'pending' ? surfaceColors.onSurfaceVariant : item.status === 'approved' ? surfaceColors.onPrimaryContainer : surfaceColors.onErrorContainer}
              style={{ marginRight: 6 }}
            />
            <Text style={{ 
              color: item.status === 'pending' ? surfaceColors.onSurfaceVariant : item.status === 'approved' ? surfaceColors.onPrimaryContainer : surfaceColors.onErrorContainer, 
              fontSize: 12, 
              fontWeight: '600' 
            }}>
              {item.status === 'pending' ? 'Pendiente' : item.status === 'approved' ? 'Aprobado' : 'Rechazado'}
            </Text>
          </View>
        </View>
        
        <View style={{ marginTop: 16 }}>
            <OverlineText color={surfaceColors.primary} style={{ marginBottom: 6 }}>
                {item.type?.replace('_', ' ')}
            </OverlineText>
            {item.description ? (
                <Text 
                  numberOfLines={2} 
                  style={{ 
                    color: surfaceColors.onSurfaceVariant, 
                    fontSize: 15, 
                    lineHeight: 22 
                  }}
                >
                    {item.description}
                </Text>
            ) : null}
        </View>
      </ExpressiveCard>
    </Swipeable>
  );

  // ✅ Validación de permiso (después de todos los hooks)
  if (!can(APP_PERMISSIONS.ADMIN_NOVEDADES)) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: paperTheme.colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <MaterialCommunityIcons name="shield-lock" size={64} color={paperTheme.colors.error} />
          <Text variant="headlineSmall" style={{ marginTop: 16, fontWeight: '600' }}>🔒 Acceso Denegado</Text>
          <Text variant="bodyMedium" style={{ marginTop: 8, textAlign: 'center' }}>No tienes permiso para administrar novedades</Text>
          <Pressable onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
            <Text variant="bodyMedium" style={{ color: primaryColor, fontWeight: '600' }}>Volver</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, { backgroundColor: surfaceColors.background }]}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={{ 
            fontFamily: 'Roboto-Flex', 
            fontSize: 36, // Display Small
            lineHeight: 44,
            fontWeight: '400', 
            color: surfaceColors.onSurface, 
            letterSpacing: -0.5,
            fontVariationSettings: [{ axis: 'wdth', value: 110 }] // Google Look
          }}>
            Novedades
          </Text>
          <Text variant="bodyLarge" style={{ color: surfaceColors.onSurfaceVariant, marginTop: 8, fontSize: 16 }}>
            Gestionar reportes de empleados
          </Text>
        </View>

        {/* Filter Chips - SegmentedButtons */}
        <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
          <SegmentedButtons
            value={filterStatus}
            onValueChange={(value) => {
              Haptics.selectionAsync();
              setFilterStatus(value);
            }}
            buttons={[
              { value: 'pending', label: 'Pendientes', icon: 'clock-outline' },
              { value: 'all', label: 'Historial', icon: 'history' },
            ]}
          />
        </View>

        <Searchbar
          placeholder="Buscar empleado..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[
            styles.searchBar, 
            { 
              backgroundColor: surfaceColors.surfaceContainerHigh, 
              borderRadius: 100, // Full Pill
              height: 56, // Standard M3 height
            }
          ]}
          inputStyle={{ 
            minHeight: 0, // Fix for some Android versions
            alignSelf: 'center' 
          }}
          iconColor={surfaceColors.onSurfaceVariant}
          placeholderTextColor={surfaceColors.onSurfaceVariant}
          elevation={0}
        />

        {filteredNovedades.length === 0 && !loading ? (
          <View style={styles.emptyState}>
            <View style={{
              width: 160,
              height: 160,
              borderRadius: 80,
              backgroundColor: surfaceColors.surfaceContainerHigh,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 24
            }}>
              <MaterialCommunityIcons 
                name="check-decagram" 
                size={80} 
                color={surfaceColors.primary} 
              />
            </View>
            <Text style={{ 
              fontFamily: 'Roboto-Flex', 
              fontSize: 24, 
              fontWeight: '400', 
              color: surfaceColors.onSurface,
              textAlign: 'center',
              fontVariationSettings: [{ axis: 'wdth', value: 110 }]
            }}>
              ¡Todo al día!
            </Text>
            <Text variant="bodyLarge" style={{ color: surfaceColors.onSurfaceVariant, marginTop: 8, textAlign: 'center' }}>
              No hay novedades pendientes por revisar.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredNovedades}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />
        )}

        {/* Detail Modal */}
        <Portal>
          <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={[styles.modal, { backgroundColor: surfaceColors.surfaceContainerHigh }]}>
            {selectedNovedad && (
              <View>
                <OverlineText color={surfaceColors.primary} style={{ marginBottom: 16, fontSize: 16 }}>
                  Detalle de Novedad
                </OverlineText>
                
                <DetailRow 
                  icon="account"
                  label="Empleado"
                  value={selectedNovedad.userName}
                  iconColor={surfaceColors.primary}
                />
                
                <View style={{ height: 12 }} />

                <DetailRow 
                  icon="alert-circle"
                  label="Tipo"
                  value={selectedNovedad.type?.replace('_', ' ').toUpperCase()}
                  iconColor={surfaceColors.onSurfaceVariant}
                />

                <View style={{ height: 12 }} />

                <DetailRow 
                  icon="file-document-outline"
                  label="Descripción"
                  value={selectedNovedad.description || 'Sin descripción'}
                  iconColor={surfaceColors.onSurfaceVariant}
                />

                {selectedNovedad.attachmentUrl && (
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      Linking.openURL(selectedNovedad.attachmentUrl);
                    }}
                    android_ripple={{ color: surfaceColors.primary + '1F' }}
                    style={({ pressed }) => [
                      {
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 14,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: surfaceColors.primary,
                        marginTop: 24,
                        transform: [{ scale: pressed ? 0.98 : 1 }]
                      }
                    ]}
                  >
                    <MaterialCommunityIcons name="paperclip" size={20} color={surfaceColors.primary} style={{ marginRight: 8 }} />
                    <Text style={{ color: surfaceColors.primary, fontWeight: '500', fontSize: 15 }}>
                      Ver Adjunto
                    </Text>
                  </Pressable>
                )}

                <View style={styles.modalActions}>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      handleStatusChange(selectedNovedad.id, 'rejected');
                      setModalVisible(false);
                    }}
                    android_ripple={{ color: surfaceColors.onErrorContainer + '1F' }}
                    style={({ pressed }) => [
                      {
                        flex: 1,
                        marginRight: 8,
                        padding: 16,
                        borderRadius: 24,
                        backgroundColor: surfaceColors.errorContainer,
                        alignItems: 'center',
                        transform: [{ scale: pressed ? 0.98 : 1 }]
                      }
                    ]}
                  >
                    <Text style={{ color: surfaceColors.onErrorContainer, fontWeight: '600', fontSize: 16 }}>
                      Rechazar
                    </Text>
                  </Pressable>
                  
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      handleStatusChange(selectedNovedad.id, 'approved');
                      setModalVisible(false);
                    }}
                    android_ripple={{ color: surfaceColors.onPrimaryContainer + '1F' }}
                    style={({ pressed }) => [
                      {
                        flex: 1,
                        marginLeft: 8,
                        padding: 16,
                        borderRadius: 24,
                        backgroundColor: surfaceColors.primaryContainer,
                        alignItems: 'center',
                        transform: [{ scale: pressed ? 0.98 : 1 }]
                      }
                    ]}
                  >
                    <Text style={{ color: surfaceColors.onPrimaryContainer, fontWeight: '600', fontSize: 16 }}>
                      {selectedNovedad.type === 'solicitud_reapertura' ? 'Autorizar Reapertura' : 'Aprobar'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </Modal>
        </Portal>

      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  filterChips: {
    // Removed flex styles that caused stretching
  },
  searchBar: {
    marginHorizontal: 24,
    marginBottom: 24, // Increased spacing
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  rightActionContainer: {
    width: 120, // Increased width for better swipe feel
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  leftActionContainer: {
    width: 120,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 0, // No shadow, just color
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  modal: {
    margin: 20,
    padding: 24,
    borderRadius: 28,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 24,
  }
});
