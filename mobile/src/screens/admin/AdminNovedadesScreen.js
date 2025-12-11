import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Modal,
  ScrollView,
  Linking
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { collection, query, where, getDocs, updateDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useTheme } from '../../contexts/ThemeContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AdminNovedadesScreen({ navigation }) {
  const { getGradient, getPrimaryColor } = useTheme();
  const [novedades, setNovedades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNovedad, setSelectedNovedad] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchNovedades = async () => {
    try {
      const q = query(
        collection(db, 'novedades'),
        orderBy('date', 'desc')
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNovedades(data);
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

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, 'novedades', id), {
        status: newStatus
      });
      // Actualizar localmente
      setNovedades(prev => prev.map(item => 
        item.id === id ? { ...item, status: newStatus } : item
      ));
      
      // Si está en el modal, actualizar también
      if (selectedNovedad && selectedNovedad.id === id) {
        setSelectedNovedad(prev => ({ ...prev, status: newStatus }));
      }
      
      Alert.alert('Éxito', `Novedad ${newStatus === 'approved' ? 'aprobada' : 'rechazada'} correctamente`);
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el estado');
    }
  };

  const openAttachment = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'No se puede abrir este archivo');
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error al intentar abrir el archivo');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#4caf50';
      case 'rejected': return '#f44336';
      default: return '#ff9800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'approved': return 'Aprobado';
      case 'rejected': return 'Rechazado';
      default: return 'Pendiente';
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => {
        setSelectedNovedad(item);
        setModalVisible(true);
      }}
    >
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.userName}>{item.userName}</Text>
          <Text style={styles.date}>
            {item.date?.toDate ? format(item.date.toDate(), "d 'de' MMMM, h:mm a", { locale: es }) : ''}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.typeRow}>
        <MaterialIcons name="info-outline" size={16} color="#666" />
        <Text style={styles.typeText}>{item.type.replace('_', ' ').toUpperCase()}</Text>
      </View>

      <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
      
      {item.attachmentUrl && (
        <View style={styles.attachmentIndicator}>
          <MaterialIcons name="attach-file" size={14} color="#666" />
          <Text style={styles.attachmentTextSmall}>Adjunto disponible</Text>
        </View>
      )}

      {item.status === 'pending' && (
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.actionButton, { borderColor: '#f44336' }]}
            onPress={() => handleStatusChange(item.id, 'rejected')}
          >
            <Text style={{ color: '#f44336', fontWeight: '600' }}>Rechazar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#4caf50', borderColor: '#4caf50' }]}
            onPress={() => handleStatusChange(item.id, 'approved')}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>Aprobar</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Gestión de Novedades</Text>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator size="large" color={getPrimaryColor()} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={novedades}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNovedades(); }} />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No hay novedades reportadas</Text>
          }
        />
      )}

      {/* Modal de Detalle */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalle de Novedad</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            {selectedNovedad && (
              <ScrollView contentContainerStyle={styles.modalBody}>
                {/* User Info */}
                <View style={styles.detailRow}>
                  <MaterialIcons name="person" size={24} color={getPrimaryColor()} />
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Usuario</Text>
                    <Text style={styles.detailValue}>{selectedNovedad.userName}</Text>
                    <Text style={styles.detailSubValue}>{selectedNovedad.userEmail}</Text>
                  </View>
                </View>

                {/* Date */}
                <View style={styles.detailRow}>
                  <MaterialIcons name="event" size={24} color={getPrimaryColor()} />
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Fecha de Reporte</Text>
                    <Text style={styles.detailValue}>
                      {selectedNovedad.date?.toDate ? format(selectedNovedad.date.toDate(), "EEEE d 'de' MMMM, yyyy - h:mm a", { locale: es }) : ''}
                    </Text>
                  </View>
                </View>

                {/* Type */}
                <View style={styles.detailRow}>
                  <MaterialIcons name="category" size={24} color={getPrimaryColor()} />
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Tipo de Novedad</Text>
                    <Text style={styles.detailValue}>
                      {selectedNovedad.type.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Status */}
                <View style={styles.detailRow}>
                  <MaterialIcons name="info" size={24} color={getStatusColor(selectedNovedad.status)} />
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Estado Actual</Text>
                    <View style={[styles.statusBadge, { alignSelf: 'flex-start', marginTop: 4, backgroundColor: getStatusColor(selectedNovedad.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(selectedNovedad.status) }]}>
                        {getStatusLabel(selectedNovedad.status)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Description */}
                <Text style={styles.sectionTitle}>Descripción</Text>
                <View style={styles.descriptionBox}>
                  <Text style={styles.fullDescription}>{selectedNovedad.description}</Text>
                </View>

                {/* Attachment */}
                {selectedNovedad.attachmentUrl && (
                  <View style={styles.attachmentSection}>
                    <Text style={styles.sectionTitle}>Documento Adjunto</Text>
                    <TouchableOpacity 
                      style={styles.attachmentButton}
                      onPress={() => openAttachment(selectedNovedad.attachmentUrl)}
                    >
                      <MaterialIcons name="description" size={32} color="#e91e63" />
                      <View style={styles.attachmentInfo}>
                        <Text style={styles.attachmentName}>
                          {selectedNovedad.attachmentName || 'Ver Comprobante'}
                        </Text>
                        <Text style={styles.attachmentHint}>Toca para abrir documento</Text>
                      </View>
                      <MaterialIcons name="open-in-new" size={20} color="#666" />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Actions in Modal */}
                {selectedNovedad.status === 'pending' && (
                  <View style={styles.modalActions}>
                    <TouchableOpacity 
                      style={[styles.modalActionButton, { backgroundColor: '#ffebee', borderColor: '#f44336' }]}
                      onPress={() => handleStatusChange(selectedNovedad.id, 'rejected')}
                    >
                      <MaterialIcons name="close" size={20} color="#f44336" />
                      <Text style={{ color: '#f44336', fontWeight: '700', marginLeft: 8 }}>Rechazar</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.modalActionButton, { backgroundColor: '#e8f5e9', borderColor: '#4caf50' }]}
                      onPress={() => handleStatusChange(selectedNovedad.id, 'approved')}
                    >
                      <MaterialIcons name="check" size={20} color="#4caf50" />
                      <Text style={{ color: '#4caf50', fontWeight: '700', marginLeft: 8 }}>Aprobar</Text>
                    </TouchableOpacity>
                  </View>
                )}

              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  listContent: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1c1c1e',
  },
  date: {
    fontSize: 12,
    color: '#8e8e93',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginLeft: 6,
  },
  description: {
    fontSize: 14,
    color: '#3a3a3c',
    lineHeight: 20,
    marginBottom: 16,
  },
  attachmentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#f5f5f5',
    padding: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
    gap: 4
  },
  attachmentTextSmall: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500'
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f2f2f7',
    paddingTop: 12,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  emptyText: {
    textAlign: 'center',
    color: '#8e8e93',
    marginTop: 40,
    fontStyle: 'italic',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1c1c1e',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  detailTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#8e8e93',
    marginBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 16,
    color: '#1c1c1e',
    fontWeight: '500',
  },
  detailSubValue: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1c1c1e',
    marginBottom: 12,
    marginTop: 10,
  },
  descriptionBox: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  fullDescription: {
    fontSize: 15,
    color: '#333',
    lineHeight: 24,
  },
  attachmentSection: {
    marginBottom: 24,
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  attachmentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  attachmentName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 2,
  },
  attachmentHint: {
    fontSize: 12,
    color: '#8e8e93',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
    marginBottom: 20,
  },
  modalActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
});
