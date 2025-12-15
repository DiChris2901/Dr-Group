import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal
} from 'react-native';
import { Text, useTheme as usePaperTheme, IconButton, Button, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

// Custom Hooks & Components
import { useTheme } from '../../contexts/ThemeContext';
import SobrioCard from '../../components/SobrioCard';
import OverlineText from '../../components/OverlineText';

export default function AdminSettingsScreen({ navigation }) {
  const paperTheme = usePaperTheme();
  const { getPrimaryColor } = useTheme();
  const primaryColor = getPrimaryColor();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Work Schedule State
  const [workStartTime, setWorkStartTime] = useState('08:00');
  const [workEndTime, setWorkEndTime] = useState('18:00');
  const [gracePeriod, setGracePeriod] = useState('15');
  const [workDays, setWorkDays] = useState([1, 2, 3, 4, 5]); // Mon-Fri default

  // Location State
  const [officeLocation, setOfficeLocation] = useState(null);
  const [locationRadius, setLocationRadius] = useState('100');
  const [mapVisible, setMapVisible] = useState(false);
  const [tempLocation, setTempLocation] = useState(null);
  const [searchAddress, setSearchAddress] = useState('');

  const daysOfWeek = [
    { id: 1, label: 'L', full: 'Lunes' },
    { id: 2, label: 'M', full: 'Martes' },
    { id: 3, label: 'M', full: 'Miércoles' },
    { id: 4, label: 'J', full: 'Jueves' },
    { id: 5, label: 'V', full: 'Viernes' },
    { id: 6, label: 'S', full: 'Sábado' },
    { id: 0, label: 'D', full: 'Domingo' },
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const scheduleDoc = await getDoc(doc(db, 'settings', 'work_schedule'));
      if (scheduleDoc.exists()) {
        const data = scheduleDoc.data();
        setWorkStartTime(data.startTime || '08:00');
        setWorkEndTime(data.endTime || '18:00');
        setGracePeriod(data.gracePeriod?.toString() || '15');
        setWorkDays(data.workDays || [1, 2, 3, 4, 5]);
      }

      const locationDoc = await getDoc(doc(db, 'settings', 'location'));
      if (locationDoc.exists()) {
        const data = locationDoc.data();
        setOfficeLocation({ lat: data.lat, lon: data.lon });
        setLocationRadius(data.radius?.toString() || '100');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      Alert.alert('Error', 'No se pudo cargar la configuración.');
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (dayId) => {
    if (workDays.includes(dayId)) {
      setWorkDays(workDays.filter(id => id !== dayId));
    } else {
      setWorkDays([...workDays, dayId]);
    }
  };

  const openMapPicker = async () => {
    try {
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
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
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
        lon: tempLocation.longitude
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
        lon: location.coords.longitude
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
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(workStartTime) || !timeRegex.test(workEndTime)) {
      Alert.alert('Formato Inválido', 'Las horas deben estar en formato HH:MM (ej: 08:00)');
      return;
    }

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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: paperTheme.colors.background }]}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
        <Text variant="headlineSmall" style={{ fontWeight: 'bold', flex: 1 }}>Configuración</Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          
          <OverlineText style={{ marginBottom: 12 }}>Jornada Laboral</OverlineText>
          
          <SobrioCard style={{ marginBottom: 24 }}>
            <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 8 }}>Días Laborales</Text>
            <Text variant="bodySmall" style={{ color: paperTheme.colors.secondary, marginBottom: 16 }}>
              Selecciona los días de operación de la empresa.
            </Text>
            
            <View style={styles.daysContainer}>
              {daysOfWeek.map((day) => {
                const isSelected = workDays.includes(day.id);
                return (
                  <TouchableOpacity
                    key={day.id}
                    style={[
                      styles.dayButton,
                      { 
                        backgroundColor: isSelected ? primaryColor : paperTheme.colors.surfaceVariant,
                        borderColor: isSelected ? primaryColor : paperTheme.colors.outline 
                      }
                    ]}
                    onPress={() => toggleDay(day.id)}
                  >
                    <Text style={{ 
                      color: isSelected ? 'white' : paperTheme.colors.onSurfaceVariant,
                      fontWeight: 'bold'
                    }}>
                      {day.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text variant="labelMedium" style={{ marginBottom: 4 }}>Entrada</Text>
                <TextInput
                  style={[styles.input, { borderColor: paperTheme.colors.outline }]}
                  value={workStartTime}
                  onChangeText={setWorkStartTime}
                  placeholder="08:00"
                  maxLength={5}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text variant="labelMedium" style={{ marginBottom: 4 }}>Salida</Text>
                <TextInput
                  style={[styles.input, { borderColor: paperTheme.colors.outline }]}
                  value={workEndTime}
                  onChangeText={setWorkEndTime}
                  placeholder="18:00"
                  maxLength={5}
                />
              </View>
            </View>

            <View style={{ marginTop: 16 }}>
              <Text variant="labelMedium" style={{ marginBottom: 4 }}>Tiempo de Gracia (min)</Text>
              <TextInput
                style={[styles.input, { borderColor: paperTheme.colors.outline }]}
                value={gracePeriod}
                onChangeText={setGracePeriod}
                placeholder="15"
                keyboardType="numeric"
                maxLength={2}
              />
            </View>
          </SobrioCard>

          <OverlineText style={{ marginBottom: 12 }}>Geolocalización</OverlineText>

          <SobrioCard style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Ionicons name="location" size={24} color={primaryColor} style={{ marginRight: 12 }} />
              <View>
                <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>Ubicación Oficina</Text>
                <Text variant="bodySmall" style={{ color: paperTheme.colors.secondary }}>
                  Control de asistencia por GPS
                </Text>
              </View>
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text variant="labelMedium" style={{ marginBottom: 4 }}>Radio Permitido (metros)</Text>
              <TextInput
                style={[styles.input, { borderColor: paperTheme.colors.outline }]}
                value={locationRadius}
                onChangeText={setLocationRadius}
                placeholder="100"
                keyboardType="numeric"
                maxLength={4}
              />
            </View>

            {officeLocation ? (
              <View style={[styles.locationInfo, { backgroundColor: paperTheme.colors.surfaceVariant }]}>
                <Text variant="bodySmall" style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                  Lat: {officeLocation.lat.toFixed(6)}
                </Text>
                <Text variant="bodySmall" style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                  Lon: {officeLocation.lon.toFixed(6)}
                </Text>
              </View>
            ) : (
              <Text style={{ textAlign: 'center', color: paperTheme.colors.error, marginBottom: 16 }}>
                ⚠️ No hay ubicación registrada
              </Text>
            )}

            <Button 
              mode="outlined" 
              onPress={captureLocation} 
              style={{ marginBottom: 12, borderColor: primaryColor }}
              textColor={primaryColor}
              icon="crosshairs-gps"
            >
              Capturar Ubicación Actual
            </Button>

            <Button 
              mode="contained" 
              onPress={openMapPicker} 
              style={{ backgroundColor: primaryColor }}
              icon="map-marker"
            >
              Buscar en Mapa
            </Button>
          </SobrioCard>

          <Button 
            mode="contained" 
            onPress={handleSave} 
            loading={saving}
            style={{ backgroundColor: primaryColor, paddingVertical: 6 }}
          >
            Guardar Cambios
          </Button>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Map Modal */}
      <Modal
        visible={mapVisible}
        animationType="slide"
        onRequestClose={() => setMapVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
          <View style={styles.mapHeader}>
            <IconButton icon="close" onPress={() => setMapVisible(false)} />
            <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>Seleccionar Ubicación</Text>
          </View>
          
          <View style={styles.searchContainer}>
            <TextInput
              style={[styles.searchInput, { borderColor: paperTheme.colors.outline }]}
              placeholder="Buscar dirección..."
              value={searchAddress}
              onChangeText={setSearchAddress}
              onSubmitEditing={handleSearchAddress}
            />
            <IconButton 
              icon="magnify" 
              mode="contained" 
              containerColor={primaryColor} 
              iconColor="white" 
              onPress={handleSearchAddress} 
            />
          </View>

          {tempLocation && (
            <MapView
              style={{ flex: 1 }}
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

          <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: '#eee' }}>
            <Button 
              mode="contained" 
              onPress={confirmMapLocation}
              style={{ backgroundColor: primaryColor }}
            >
              Confirmar Ubicación
            </Button>
          </View>
        </SafeAreaView>
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
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
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
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  locationInfo: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
});
