import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Platform
} from 'react-native';
import { 
  Text, 
  useTheme as usePaperTheme, 
  IconButton, 
  Button, 
  ActivityIndicator,
  Surface,
  TextInput as PaperInput,
  Chip,
  Card,
  Portal,
  Modal
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

export default function AdminSettingsScreen({ navigation }) {
  const theme = usePaperTheme();

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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
        <Text variant="headlineSmall" style={{ fontWeight: 'bold', flex: 1 }}>Configuración</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Work Schedule Section */}
        <Text variant="labelLarge" style={{ color: theme.colors.primary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
          Jornada Laboral
        </Text>
        
        <Card style={{ marginBottom: 24 }} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 8 }}>Días Laborales</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.secondary, marginBottom: 16 }}>
              Selecciona los días de operación de la empresa.
            </Text>
            
            <View style={styles.daysContainer}>
              {daysOfWeek.map((day) => {
                const isSelected = workDays.includes(day.id);
                return (
                  <Chip
                    key={day.id}
                    selected={isSelected}
                    onPress={() => toggleDay(day.id)}
                    mode={isSelected ? 'flat' : 'outlined'}
                    style={{ marginRight: 8, marginBottom: 8 }}
                  >
                    {day.label}
                  </Chip>
                );
              })}
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <PaperInput
                  label="Hora Entrada"
                  value={workStartTime}
                  onChangeText={setWorkStartTime}
                  placeholder="08:00"
                  maxLength={5}
                  mode="outlined"
                  left={<PaperInput.Icon icon="clock-start" />}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <PaperInput
                  label="Hora Salida"
                  value={workEndTime}
                  onChangeText={setWorkEndTime}
                  placeholder="18:00"
                  maxLength={5}
                  mode="outlined"
                  left={<PaperInput.Icon icon="clock-end" />}
                />
              </View>
            </View>

            <PaperInput
              label="Tiempo de Gracia (minutos)"
              value={gracePeriod}
              onChangeText={setGracePeriod}
              placeholder="15"
              keyboardType="numeric"
              maxLength={2}
              mode="outlined"
              left={<PaperInput.Icon icon="timer-sand" />}
              style={{ marginTop: 16 }}
            />
          </Card.Content>
        </Card>

        {/* Location Section */}
        <Text variant="labelLarge" style={{ color: theme.colors.primary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
          Geolocalización
        </Text>

        <Card style={{ marginBottom: 24 }} mode="elevated">
          <Card.Content>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <IconButton icon="map-marker" iconColor={theme.colors.primary} size={28} />
              <View style={{ flex: 1 }}>
                <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>Ubicación Oficina</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>
                  Control de asistencia por GPS
                </Text>
              </View>
            </View>

            <PaperInput
              label="Radio Permitido (metros)"
              value={locationRadius}
              onChangeText={setLocationRadius}
              placeholder="100"
                keyboardType="numeric"
              maxLength={4}
              mode="outlined"
              left={<PaperInput.Icon icon="ruler" />}
              style={{ marginBottom: 16 }}
            />

            {officeLocation ? (
              <Surface style={[styles.locationInfo, { backgroundColor: theme.colors.surfaceVariant }]} elevation={0}>
                <Text variant="bodySmall" style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                  Lat: {officeLocation.lat.toFixed(6)}
                </Text>
                <Text variant="bodySmall" style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                  Lon: {officeLocation.lon.toFixed(6)}
                </Text>
              </Surface>
            ) : (
              <Surface style={{ padding: 16, borderRadius: 12, backgroundColor: theme.colors.errorContainer, marginBottom: 16 }} elevation={0}>
                <Text variant="bodyMedium" style={{ textAlign: 'center', color: theme.colors.onErrorContainer }}>
                  ⚠️ No hay ubicación registrada
                </Text>
              </Surface>
            )}

            <Button 
              mode="outlined" 
              onPress={captureLocation} 
              style={{ marginBottom: 12 }}
              icon="crosshairs-gps"
            >
              Capturar Ubicación Actual
            </Button>

            <Button 
              mode="contained" 
              onPress={openMapPicker} 
              icon="map-marker"
            >
              Buscar en Mapa
            </Button>
          </Card.Content>
        </Card>

        <Button 
          mode="contained" 
          onPress={handleSave} 
          loading={saving}
          disabled={saving}
          icon="content-save"
          style={{ marginBottom: 32 }}
        >
          Guardar Cambios
        </Button>

      </ScrollView>

      {/* Map Modal */}
      <Portal>
        <Modal
          visible={mapVisible}
          onDismiss={() => setMapVisible(false)}
          contentContainerStyle={{ flex: 1, backgroundColor: theme.colors.background }}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.mapHeader}>
              <IconButton icon="close" onPress={() => setMapVisible(false)} />
              <Text variant="titleLarge" style={{ fontWeight: 'bold', flex: 1 }}>Seleccionar Ubicación</Text>
            </View>
            
            <View style={styles.searchContainer}>
              <PaperInput
                placeholder="Buscar dirección..."
                value={searchAddress}
                onChangeText={setSearchAddress}
                onSubmitEditing={handleSearchAddress}
                mode="outlined"
                style={{ flex: 1, marginRight: 8 }}
                left={<PaperInput.Icon icon="magnify" />}
              />
              <IconButton 
                icon="arrow-right" 
                mode="contained" 
                containerColor={theme.colors.primary} 
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

            <View style={{ padding: 20, backgroundColor: theme.colors.surface }}>
              <Button 
                mode="contained" 
                onPress={confirmMapLocation}
                icon="check"
              >
                Confirmar Ubicación
              </Button>
            </View>
          </SafeAreaView>
        </Modal>
      </Portal>
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
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    marginTop: 16,
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
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
});
