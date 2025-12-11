import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useTheme } from '../../contexts/ThemeContext';

export default function AdminSettingsScreen({ navigation }) {
  const { getGradient, getPrimaryColor } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [searchAddress, setSearchAddress] = useState('');
  const [tempLocation, setTempLocation] = useState(null);
  
  // State
  const [workStartTime, setWorkStartTime] = useState('08:00');
  const [workEndTime, setWorkEndTime] = useState('18:00');
  const [gracePeriod, setGracePeriod] = useState('15');
  const [workDays, setWorkDays] = useState([1, 2, 3, 4, 5]); // 1=Lun, 0=Dom
  
  // Location State
  const [officeLocation, setOfficeLocation] = useState(null);
  const [locationRadius, setLocationRadius] = useState('100'); // Metros

  const daysOfWeek = [
    { id: 1, label: 'L', name: 'Lunes' },
    { id: 2, label: 'M', name: 'Martes' },
    { id: 3, label: 'M', name: 'Miércoles' },
    { id: 4, label: 'J', name: 'Jueves' },
    { id: 5, label: 'V', name: 'Viernes' },
    { id: 6, label: 'S', name: 'Sábado' },
    { id: 0, label: 'D', name: 'Domingo' },
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, 'settings', 'work_schedule');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setWorkStartTime(data.startTime || '08:00');
        setWorkEndTime(data.endTime || '18:00');
        setGracePeriod(data.gracePeriod?.toString() || '15');
        setWorkDays(data.workDays || [1, 2, 3, 4, 5]);
      }

      // Cargar ubicación
      const locSnap = await getDoc(doc(db, 'settings', 'location'));
      if (locSnap.exists()) {
        const locData = locSnap.data();
        setOfficeLocation(locData);
        setLocationRadius(locData.radius?.toString() || '100');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      Alert.alert('Error', 'No se pudo cargar la configuración.');
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (id) => {
    if (workDays.includes(id)) {
      setWorkDays(workDays.filter(d => d !== id));
    } else {
      setWorkDays([...workDays, id]);
    }
  };

  const openMapPicker = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita acceso a la ubicación para usar el mapa.');
        return;
      }

      let initialRegion = {
        latitude: 4.6097, // Bogotá default
        longitude: -74.0817,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      if (officeLocation) {
        initialRegion = {
          latitude: officeLocation.lat,
          longitude: officeLocation.lon,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        };
        setTempLocation({
          latitude: officeLocation.lat,
          longitude: officeLocation.lon
        });
      } else {
        // Try to get current location
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        initialRegion = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        };
        setTempLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
      }
      
      setMapVisible(true);
    } catch (error) {
      console.error('Error opening map:', error);
      Alert.alert('Error', 'No se pudo abrir el mapa.');
    }
  };

  const handleSearchAddress = async () => {
    if (!searchAddress.trim()) return;
    
    try {
      const result = await Location.geocodeAsync(searchAddress);
      if (result.length > 0) {
        const { latitude, longitude } = result[0];
        setTempLocation({ latitude, longitude });
      } else {
        Alert.alert('No encontrado', 'No se encontraron coordenadas para esa dirección.');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      Alert.alert('Error', 'Falló la búsqueda de dirección.');
    }
  };

  const confirmMapLocation = () => {
    if (tempLocation) {
      setOfficeLocation({
        lat: tempLocation.latitude,
        lon: tempLocation.longitude,
        radius: parseInt(locationRadius) || 100
      });
      setMapVisible(false);
    }
  };

  const captureLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita acceso a la ubicación para registrar la oficina.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });

      setOfficeLocation({
        lat: location.coords.latitude,
        lon: location.coords.longitude,
        radius: parseInt(locationRadius) || 100
      });
      
      Alert.alert('📍 Ubicación Capturada', 'Coordenadas actuales registradas. No olvides guardar los cambios.');
    } catch (error) {
      console.error('Error capturing location:', error);
      Alert.alert('Error', 'No se pudo obtener la ubicación.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validar formato HH:MM
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(workStartTime) || !timeRegex.test(workEndTime)) {
      Alert.alert('Formato Inválido', 'Las horas deben estar en formato HH:MM (ej: 08:00)');
      return;
    }

    // Validar minutos de gracia
    const grace = parseInt(gracePeriod);
    if (isNaN(grace) || grace < 0 || grace > 60) {
      Alert.alert('Valor Inválido', 'El tiempo de gracia debe ser entre 0 y 60 minutos.');
      return;
    }

    if (workDays.length === 0) {
      Alert.alert('Atención', 'Debes seleccionar al menos un día laboral.');
      return;
    }

    try {
      setSaving(true);
      await setDoc(doc(db, 'settings', 'work_schedule'), {
        startTime: workStartTime,
        endTime: workEndTime,
        gracePeriod: grace,
        workDays: workDays,
        updatedAt: new Date()
      });

      // Guardar ubicación si existe
      if (officeLocation) {
        await setDoc(doc(db, 'settings', 'location'), {
          lat: officeLocation.lat,
          lon: officeLocation.lon,
          radius: parseInt(locationRadius) || 100,
          updatedAt: new Date()
        });
      }

      Alert.alert('✅ Guardado', 'La configuración se ha actualizado correctamente.');
      navigation.goBack();
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'No se pudo guardar la configuración.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={getPrimaryColor()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={getGradient()}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Configuración</Text>
          <Text style={styles.headerSubtitle}>Jornada Laboral</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <View style={styles.iconHeader}>
              <View style={[styles.iconContainer, { backgroundColor: getPrimaryColor() + '20' }]}>
                <MaterialIcons name="access-time" size={32} color={getPrimaryColor()} />
              </View>
            </View>
            
            <Text style={styles.sectionTitle}>Días Laborales</Text>
            <Text style={styles.sectionDescription}>
              Selecciona los días de la semana que corresponden a la jornada laboral.
            </Text>

            <View style={styles.daysContainer}>
              {daysOfWeek.map((day) => {
                const isSelected = workDays.includes(day.id);
                return (
                  <TouchableOpacity
                    key={day.id}
                    style={[
                      styles.dayButton,
                      isSelected && { backgroundColor: getPrimaryColor() }
                    ]}
                    onPress={() => toggleDay(day.id)}
                  >
                    <Text style={[
                      styles.dayText,
                      isSelected && { color: '#fff' }
                    ]}>
                      {day.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Horario</Text>
            <Text style={styles.sectionDescription}>
              Define la hora de entrada y salida oficial.
            </Text>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Entrada (HH:MM)</Text>
                <TextInput
                  style={styles.input}
                  value={workStartTime}
                  onChangeText={setWorkStartTime}
                  placeholder="08:00"
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Salida (HH:MM)</Text>
                <TextInput
                  style={styles.input}
                  value={workEndTime}
                  onChangeText={setWorkEndTime}
                  placeholder="18:00"
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tiempo de Gracia (Minutos)</Text>
              <TextInput
                style={styles.input}
                value={gracePeriod}
                onChangeText={setGracePeriod}
                placeholder="15"
                keyboardType="numeric"
                maxLength={2}
              />
              <Text style={styles.helperText}>
                Minutos permitidos después de la hora de entrada antes de considerar llegada tarde.
              </Text>
            </View>
          </View>

          {/* Location Card */}
          <View style={[styles.card, { marginTop: 20 }]}>
            <View style={[styles.iconHeader, { flexDirection: 'row', justifyContent: 'flex-start' }]}>
              <View style={[styles.iconContainer, { backgroundColor: getPrimaryColor() + '20' }]}>
                <MaterialIcons name="location-on" size={32} color={getPrimaryColor()} />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.cardTitle}>Ubicación Oficina</Text>
                <Text style={styles.cardSubtitle}>Geolocalización para control de asistencia</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Radio Permitido (Metros)</Text>
              <TextInput
                style={styles.input}
                value={locationRadius}
                onChangeText={setLocationRadius}
                placeholder="100"
                keyboardType="numeric"
                maxLength={4}
              />
            </View>

            {officeLocation ? (
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Coordenadas Registradas:</Text>
                <Text style={styles.locationValue}>Lat: {officeLocation.lat.toFixed(6)}</Text>
                <Text style={styles.locationValue}>Lon: {officeLocation.lon.toFixed(6)}</Text>
              </View>
            ) : (
              <Text style={styles.noLocationText}>No hay ubicación registrada</Text>
            )}

            <TouchableOpacity
              style={[styles.captureButton, { borderColor: getPrimaryColor(), marginBottom: 12 }]}
              onPress={captureLocation}
            >
              <MaterialIcons name="my-location" size={20} color={getPrimaryColor()} />
              <Text style={[styles.captureButtonText, { color: getPrimaryColor() }]}>
                CAPTURAR UBICACIÓN ACTUAL
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.captureButton, { borderColor: getPrimaryColor(), backgroundColor: getPrimaryColor() + '10' }]}
              onPress={openMapPicker}
            >
              <MaterialIcons name="map" size={20} color={getPrimaryColor()} />
              <Text style={[styles.captureButtonText, { color: getPrimaryColor() }]}>
                BUSCAR EN EL MAPA
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: getPrimaryColor(), marginTop: 24, marginBottom: 40 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>GUARDAR TODOS LOS CAMBIOS</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Map Modal */}
      <Modal
        visible={mapVisible}
        animationType="slide"
        onRequestClose={() => setMapVisible(false)}
      >
        <View style={styles.mapContainer}>
          <View style={styles.mapHeader}>
            <TouchableOpacity onPress={() => setMapVisible(false)} style={styles.closeMapButton}>
              <MaterialIcons name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.mapTitle}>Seleccionar Ubicación</Text>
          </View>
          
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar dirección (ej: Calle 100 # 15-20, Bogotá)"
              value={searchAddress}
              onChangeText={setSearchAddress}
              onSubmitEditing={handleSearchAddress}
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleSearchAddress}>
              <MaterialIcons name="search" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {tempLocation && (
            <MapView
              style={styles.map}
              region={{
                latitude: tempLocation.latitude,
                longitude: tempLocation.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
              onPress={(e) => setTempLocation(e.nativeEvent.coordinate)}
            >
              <Marker
                coordinate={tempLocation}
                draggable
                onDragEnd={(e) => setTempLocation(e.nativeEvent.coordinate)}
              />
            </MapView>
          )}

          <View style={styles.mapFooter}>
            <TouchableOpacity 
              style={[styles.confirmButton, { backgroundColor: getPrimaryColor() }]}
              onPress={confirmMapLocation}
            >
              <Text style={styles.confirmButtonText}>CONFIRMAR UBICACIÓN</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerGradient: {
    height: 180,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    marginTop: -40,
  },
  iconHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3436',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#636e72',
    marginBottom: 16,
    lineHeight: 20,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  dayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f3f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
  },
  divider: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginVertical: 16,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#2d3436',
  },
  helperText: {
    fontSize: 12,
    color: '#adb5bd',
    marginTop: 8,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  locationInfo: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 4,
  },
  locationValue: {
    fontSize: 14,
    color: '#636e72',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  noLocationText: {
    fontSize: 14,
    color: '#adb5bd',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 16,
  },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  captureButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  headerTextContainer: {
    marginLeft: 16,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3436',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#636e72',
    marginTop: 2,
  },
  // Map Styles
  mapContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeMapButton: {
    padding: 8,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 70,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  searchButton: {
    width: 48,
    height: 48,
    backgroundColor: '#667eea',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  map: {
    flex: 1,
  },
  mapFooter: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  confirmButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
