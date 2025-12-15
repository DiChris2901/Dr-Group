import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  RefreshControl,
  Animated,
  Linking,
  Dimensions
} from 'react-native';
import { 
  Text, 
  useTheme as usePaperTheme, 
  Avatar, 
  IconButton, 
  Chip,
  Searchbar,
  Portal,
  Modal,
  Button
} from 'react-native-paper';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import { collection, query, orderBy, getDocs, updateDoc, doc } from 'firebase/firestore';
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

  const [novedades, setNovedades] = useState([]);
  const [filteredNovedades, setFilteredNovedades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending'); // 'pending' | 'all'
  const [selectedNovedad, setSelectedNovedad] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchNovedades = async () => {
    try {
      const q = query(collection(db, 'novedades'), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNovedades(data);
      filterData(data, searchQuery, filterStatus);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudieron cargar las novedades');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNovedades();
  }, []);

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
      // Optimistic Update
      setNovedades(prev => prev.map(item => 
        item.id === id ? { ...item, status: newStatus } : item
      ));

      await updateDoc(doc(db, 'novedades', id), { status: newStatus });
      
      if (selectedNovedad?.id === id) {
        setSelectedNovedad(prev => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el estado');
      fetchNovedades(); // Revert on error
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
        <Animated.View style={[styles.actionButton, { backgroundColor: paperTheme.colors.error, transform: [{ translateX: trans }] }]}>
          <IconButton icon="close" iconColor="white" onPress={() => handleStatusChange(item.id, 'rejected')} />
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Rechazar</Text>
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
        <Animated.View style={[styles.actionButton, { backgroundColor: primaryColor, transform: [{ translateX: trans }] }]}>
          <IconButton icon="check" iconColor="white" onPress={() => handleStatusChange(item.id, 'approved')} />
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Aprobar</Text>
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
            style={{ backgroundColor: primaryColor + '20' }}
            color={primaryColor}
          />
          <View style={styles.headerText}>
            <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{item.userName || 'Usuario'}</Text>
            <Text variant="bodySmall" style={{ color: paperTheme.colors.secondary }}>
              {item.date?.toDate ? format(item.date.toDate(), "d MMM, h:mm a", { locale: es }) : 'Fecha inválida'}
            </Text>
          </View>
          <Chip 
            icon={item.status === 'pending' ? 'clock' : item.status === 'approved' ? 'check' : 'close'} 
            style={{ backgroundColor: item.status === 'pending' ? paperTheme.colors.tertiaryContainer : item.status === 'approved' ? '#E8F5E9' : '#FFEBEE' }}
            textStyle={{ color: item.status === 'pending' ? paperTheme.colors.onTertiaryContainer : item.status === 'approved' ? '#2E7D32' : '#C62828', fontSize: 10 }}
            compact
          >
            {item.status === 'pending' ? 'Pendiente' : item.status === 'approved' ? 'Aprobado' : 'Rechazado'}
          </Chip>
        </View>
        
        <View style={{ marginTop: 12 }}>
            <OverlineText color={paperTheme.colors.secondary} style={{ marginBottom: 4 }}>
                {item.type?.replace('_', ' ')}
            </OverlineText>
            {item.description ? (
                <Text numberOfLines={2} style={{ color: paperTheme.colors.onSurfaceVariant }}>
                    {item.description}
                </Text>
            ) : null}
        </View>
      </SobrioCard>
    </Swipeable>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, { backgroundColor: paperTheme.colors.background }]}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: primaryColor }}>
            Novedades
          </Text>
        </View>

        {/* Filter Chips */}
        <View style={styles.filterChips}>
          <Chip 
            selected={filterStatus === 'pending'} 
            onPress={() => setFilterStatus('pending')}
            style={{ marginRight: 8 }}
            showSelectedOverlay
          >
            Pendientes
          </Chip>
          <Chip 
            selected={filterStatus === 'all'} 
            onPress={() => setFilterStatus('all')}
            showSelectedOverlay
          >
            Historial
          </Chip>
        </View>

        <Searchbar
          placeholder="Buscar empleado..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          elevation={0}
        />

        {filteredNovedades.length === 0 && !loading ? (
          <View style={styles.emptyState}>
            <Avatar.Icon size={80} icon="check-all" style={{ backgroundColor: primaryColor + '20' }} color={primaryColor} />
            <Text variant="headlineSmall" style={{ marginTop: 16, fontWeight: 'bold' }}>¡Todo al día!</Text>
            <Text variant="bodyMedium" style={{ color: paperTheme.colors.secondary }}>No hay novedades pendientes.</Text>
          </View>
        ) : (
          <FlatList
            data={filteredNovedades}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNovedades(); }} />}
          />
        )}

        {/* Detail Modal */}
        <Portal>
          <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={[styles.modal, { backgroundColor: paperTheme.colors.background }]}>
            {selectedNovedad && (
              <View>
                <OverlineText color={primaryColor} style={{ marginBottom: 16, fontSize: 16 }}>
                  Detalle de Novedad
                </OverlineText>
                
                <DetailRow 
                  icon="person"
                  label="Empleado"
                  value={selectedNovedad.userName}
                  iconColor={primaryColor}
                />
                
                <View style={{ height: 12 }} />

                <DetailRow 
                  icon="alert-circle"
                  label="Tipo"
                  value={selectedNovedad.type?.replace('_', ' ').toUpperCase()}
                  iconColor={paperTheme.colors.secondary}
                />

                <View style={{ height: 12 }} />

                <DetailRow 
                  icon="document-text"
                  label="Descripción"
                  value={selectedNovedad.description || 'Sin descripción'}
                  iconColor={paperTheme.colors.tertiary}
                />

                {selectedNovedad.attachmentUrl && (
                  <Button 
                    mode="outlined" 
                    icon="paperclip" 
                    onPress={() => Linking.openURL(selectedNovedad.attachmentUrl)}
                    style={{ marginTop: 24, borderColor: primaryColor }}
                    textColor={primaryColor}
                  >
                    Ver Adjunto
                  </Button>
                )}

                <View style={styles.modalActions}>
                  <Button 
                    mode="contained" 
                    buttonColor={paperTheme.colors.error} 
                    onPress={() => { handleStatusChange(selectedNovedad.id, 'rejected'); setModalVisible(false); }}
                    style={{ flex: 1, marginRight: 8 }}
                  >
                    Rechazar
                  </Button>
                  <Button 
                    mode="contained" 
                    buttonColor={primaryColor} 
                    onPress={() => { handleStatusChange(selectedNovedad.id, 'approved'); setModalVisible(false); }}
                    style={{ flex: 1, marginLeft: 8 }}
                  >
                    Aprobar
                  </Button>
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
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
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
