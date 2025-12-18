import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  RefreshControl,
  Animated,
  Linking,
  Dimensions,
  Pressable
} from 'react-native';
import { 
  Text, 
  useTheme as usePaperTheme, 
  Avatar, 
  Searchbar,
  Portal,
  Modal
} from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import materialTheme from '../../../material-theme.json';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import { collection, query, orderBy, getDocs, updateDoc, doc, onSnapshot, where, Timestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { SafeAreaView } from 'react-native-safe-area-context';

// Custom Hooks & Components
import { useTheme } from '../../contexts/ThemeContext';
import SobrioCard from '../../components/SobrioCard';
import DetailRow from '../../components/DetailRow';
import OverlineText from '../../components/OverlineText';

const { width } = Dimensions.get('window');

export default function AdminNovedadesScreen({ navigation }) {
  const paperTheme = usePaperTheme();
  const { getPrimaryColor } = useTheme();
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
      error: scheme.error
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

  // ✅ Real-time listener para actualizaciones automáticas
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'novedades'), orderBy('date', 'desc'));
    
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

    return () => unsubscribe();
  }, []);

  // Mantener fetchNovedades solo para el pull-to-refresh manual si es necesario,
  // aunque con onSnapshot ya no es estrictamente necesario, pero sirve para forzar reload si hay problemas de red.
  const onRefresh = async () => {
    setRefreshing(true);
    // El onSnapshot se encarga, pero simulamos un delay o podríamos reconectar
    setTimeout(() => setRefreshing(false), 1000);
  };

  useEffect(() => {
    filterData(novedades, searchQuery, filterStatus);
  }, [searchQuery, filterStatus, novedades]);

  const filterData = (data, query, status) => {
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
  };

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

                // ✅ Lógica de "Gap" (Interrupción):
                // Calcular el tiempo desde que cerró (salida) hasta ahora (reapertura)
                // y registrarlo como un break para que NO cuente como tiempo trabajado.
                // Así el contador "continúa" desde donde quedó (ej. 15 min) en lugar de sumar el tiempo muerto.
                let updatedBreaks = docData.breaks || [];
                
                if (docData.salida && docData.salida.hora) {
                    const salidaTimestamp = docData.salida.hora;
                    const nowTimestamp = Timestamp.now();
                    
                    // Calcular duración del gap
                    const salidaDate = salidaTimestamp.toDate();
                    const nowDate = nowTimestamp.toDate();
                    const diffMs = nowDate - salidaDate;
                    
                    if (diffMs > 0) {
                        const horas = Math.floor(diffMs / 1000 / 60 / 60);
                        const minutos = Math.floor((diffMs / 1000 / 60) % 60);
                        const segundos = Math.floor((diffMs / 1000) % 60);
                        const duracionHMS = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
                        
                        updatedBreaks.push({
                            inicio: salidaTimestamp,
                            fin: nowTimestamp,
                            duracion: duracionHMS,
                            tipo: 'reapertura_gap' // Marca especial para identificarlo
                        });
                    }
                }

                await updateDoc(doc(db, 'asistencias', docId), {
                    salida: null,
                    horasTrabajadas: null,
                    estadoActual: 'trabajando',
                    breaks: updatedBreaks
                });
                Alert.alert('Reapertura Exitosa', 'La jornada ha sido reabierta. El tiempo inactivo se registró como pausa automática.');
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
        <Animated.View style={[styles.actionButton, { backgroundColor: surfaceColors.errorContainer, transform: [{ translateX: trans }] }]}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              handleStatusChange(item.id, 'rejected');
            }}
            style={{ alignItems: 'center' }}
          >
            <MaterialCommunityIcons name="close" size={24} color={surfaceColors.onErrorContainer} />
            <Text style={{ color: surfaceColors.onErrorContainer, fontWeight: '600', marginTop: 4 }}>Rechazar</Text>
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
        <Animated.View style={[styles.actionButton, { backgroundColor: surfaceColors.primaryContainer, transform: [{ translateX: trans }] }]}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              handleStatusChange(item.id, 'approved');
            }}
            style={{ alignItems: 'center' }}
          >
            <MaterialCommunityIcons name="check" size={24} color={surfaceColors.onPrimaryContainer} />
            <Text style={{ color: surfaceColors.onPrimaryContainer, fontWeight: '600', marginTop: 4 }}>Aprobar</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  };

  const renderItem = ({ item }) => (
    <Swipeable
      renderRightActions={(p, d) => renderRightActions(p, d, item)}
      renderLeftActions={(p, d) => renderLeftActions(p, d, item)}
    >
      <SobrioCard 
        onPress={() => { setSelectedNovedad(item); setModalVisible(true); }}
        borderColor={primaryColor}
        style={{ marginBottom: 12 }}
      >
        <View style={styles.cardHeader}>
          <Avatar.Text 
            size={40} 
            label={item.userName ? item.userName.substring(0, 2).toUpperCase() : 'NA'} 
            style={{ backgroundColor: surfaceColors.primaryContainer }}
            color={surfaceColors.onPrimaryContainer}
          />
          <View style={styles.headerText}>
            <Text variant="titleMedium" style={{ fontWeight: '600' }}>{item.userName || 'Usuario'}</Text>
            <Text variant="bodySmall" style={{ color: surfaceColors.onSurfaceVariant }}>
              {item.date?.toDate ? format(item.date.toDate(), "d MMM, h:mm a", { locale: es }) : 'Fecha inválida'}
            </Text>
          </View>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 4,
            paddingHorizontal: 12,
            borderRadius: 16,
            backgroundColor: item.status === 'pending' ? surfaceColors.tertiaryContainer : item.status === 'approved' ? surfaceColors.primaryContainer : surfaceColors.errorContainer
          }}>
            <MaterialCommunityIcons 
              name={item.status === 'pending' ? 'clock' : item.status === 'approved' ? 'check' : 'close'}
              size={14}
              color={item.status === 'pending' ? surfaceColors.onTertiaryContainer : item.status === 'approved' ? surfaceColors.onPrimaryContainer : surfaceColors.onErrorContainer}
              style={{ marginRight: 4 }}
            />
            <Text style={{ color: item.status === 'pending' ? surfaceColors.onTertiaryContainer : item.status === 'approved' ? surfaceColors.onPrimaryContainer : surfaceColors.onErrorContainer, fontSize: 11, fontWeight: '500' }}>
              {item.status === 'pending' ? 'Pendiente' : item.status === 'approved' ? 'Aprobado' : 'Rechazado'}
            </Text>
          </View>
        </View>
        
        <View style={{ marginTop: 12 }}>
            <OverlineText color={surfaceColors.onSurfaceVariant} style={{ marginBottom: 4 }}>
                {item.type?.replace('_', ' ')}
            </OverlineText>
            {item.description ? (
                <Text numberOfLines={2} style={{ color: surfaceColors.onSurfaceVariant }}>
                    {item.description}
                </Text>
            ) : null}
        </View>
      </SobrioCard>
    </Swipeable>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, { backgroundColor: surfaceColors.background }]}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineLarge" style={{ fontWeight: '600', color: surfaceColors.onSurface, letterSpacing: -0.5 }}>
            Novedades
          </Text>
          <Text variant="bodyLarge" style={{ color: surfaceColors.onSurfaceVariant, marginTop: 4 }}>
            Gestionar reportes de empleados
          </Text>
        </View>

        {/* Filter Chips */}
        <View style={styles.filterChips}>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setFilterStatus('pending');
            }}
            android_ripple={{ color: surfaceColors.primary + '1F' }}
            style={({ pressed }) => [
              {
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 20,
                backgroundColor: filterStatus === 'pending' ? surfaceColors.primaryContainer : surfaceColors.surfaceContainer,
                borderWidth: filterStatus === 'pending' ? 0 : 1,
                borderColor: surfaceColors.surfaceVariant,
                marginRight: 8,
                transform: [{ scale: pressed ? 0.97 : 1 }]
              }
            ]}
          >
            <MaterialCommunityIcons 
              name="clock-alert" 
              size={18} 
              color={filterStatus === 'pending' ? surfaceColors.onPrimaryContainer : surfaceColors.onSurface}
              style={{ marginRight: 8 }}
            />
            <Text style={{ color: filterStatus === 'pending' ? surfaceColors.onPrimaryContainer : surfaceColors.onSurface, fontWeight: '500' }}>
              Pendientes
            </Text>
          </Pressable>
          
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setFilterStatus('all');
            }}
            android_ripple={{ color: surfaceColors.primary + '1F' }}
            style={({ pressed }) => [
              {
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 20,
                backgroundColor: filterStatus === 'all' ? surfaceColors.primaryContainer : surfaceColors.surfaceContainer,
                borderWidth: filterStatus === 'all' ? 0 : 1,
                borderColor: surfaceColors.surfaceVariant,
                transform: [{ scale: pressed ? 0.97 : 1 }]
              }
            ]}
          >
            <MaterialCommunityIcons 
              name="history" 
              size={18} 
              color={filterStatus === 'all' ? surfaceColors.onPrimaryContainer : surfaceColors.onSurface}
              style={{ marginRight: 8 }}
            />
            <Text style={{ color: filterStatus === 'all' ? surfaceColors.onPrimaryContainer : surfaceColors.onSurface, fontWeight: '500' }}>
              Historial
            </Text>
          </Pressable>
        </View>

        <Searchbar
          placeholder="Buscar empleado..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[styles.searchBar, { backgroundColor: surfaceColors.surfaceContainer, borderRadius: 20 }]}
          elevation={0}
        />

        {filteredNovedades.length === 0 && !loading ? (
          <View style={styles.emptyState}>
            <Avatar.Icon size={80} icon="check-all" style={{ backgroundColor: surfaceColors.primaryContainer }} color={surfaceColors.onPrimaryContainer} />
            <Text variant="headlineSmall" style={{ marginTop: 16, fontWeight: '600' }}>¡Todo al día!</Text>
            <Text variant="bodyMedium" style={{ color: surfaceColors.onSurfaceVariant }}>No hay novedades pendientes.</Text>
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
    flexDirection: 'row',
    marginTop: 16,
  },
  searchBar: {
    marginHorizontal: 24,
    marginBottom: 16,
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
    width: 100,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  leftActionContainer: {
    width: 100,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  actionButton: {
    width: 100,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 28, // Match SobrioCard radius
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
