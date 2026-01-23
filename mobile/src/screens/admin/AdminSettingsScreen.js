import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  Pressable
} from 'react-native';
import { 
  Text, 
  useTheme as usePaperTheme, 
  IconButton, 
  Button, 
  ActivityIndicator,
  Surface,
  TextInput as PaperInput,
  Portal,
  Modal,
  Divider
} from 'react-native-paper';
import { SobrioCard, DetailRow, OverlineText } from '../../components';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useTheme } from '../../contexts/ThemeContext';
import { usePermissions } from '../../hooks/usePermissions';
import { APP_PERMISSIONS } from '../../constants/permissions';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import * as Haptics from 'expo-haptics';

export default function AdminSettingsScreen({ navigation }) {
  const theme = usePaperTheme();
  const { getPrimaryColor, getSecondaryColor } = useTheme();
  const { can } = usePermissions();
  
  // ✅ Validación de permiso
  if (!can(APP_PERMISSIONS.ADMIN_SETTINGS)) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <MaterialCommunityIcons name="shield-lock" size={64} color={theme.colors.error} />
          <Text variant="headlineSmall" style={{ marginTop: 16, fontWeight: '600' }}>🔒 Acceso Denegado</Text>
          <Text variant="bodyMedium" style={{ marginTop: 8, textAlign: 'center' }}>No tienes permiso para configuración laboral</Text>
          <Button mode="contained" onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>Volver</Button>
        </View>
      </SafeAreaView>
    );
  }

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Work Schedule State
  const [workStartTime, setWorkStartTime] = useState('08:00');
  const [workEndTime, setWorkEndTime] = useState('18:00');
  const [gracePeriod, setGracePeriod] = useState('15');
  const [workDays, setWorkDays] = useState([1, 2, 3, 4, 5]); // Mon-Fri default

  // Location State
  const [officeLocation, setOfficeLocation] = useState(null);
  const [officeAddress, setOfficeAddress] = useState(null);
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

  const getAddressFromCoords = useCallback(async (lat, lon) => {
    try {
      const result = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
      if (result.length > 0) {
        const addr = result[0];
        // Construir dirección legible
        const street = addr.street || addr.name || '';
        const city = addr.city || addr.subregion || '';
        return `${street}, ${city}`.trim().replace(/^, /, '');
      }
    } catch (error) {
      console.log('Error reverse geocoding:', error);
    }
    return null;
  }, []);

  const loadSettings = useCallback(async () => {
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
        
        if (data.address) {
          setOfficeAddress(data.address);
        } else {
          // Intentar obtener dirección si no existe
          const addr = await getAddressFromCoords(data.lat, data.lon);
          if (addr) setOfficeAddress(addr);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      Alert.alert('Error', 'No se pudo cargar la configuración.');
    } finally {
      setLoading(false);
    }
  }, [getAddressFromCoords]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const toggleDay = (dayId) => {
    Haptics.selectionAsync();
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

  const confirmMapLocation = async () => {
    if (tempLocation) {
      setOfficeLocation({
        lat: tempLocation.latitude,
        lon: tempLocation.longitude
      });
      
      // Obtener dirección
      const addr = await getAddressFromCoords(tempLocation.latitude, tempLocation.longitude);
      if (addr) setOfficeAddress(addr);
      
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
      
      // Obtener dirección
      const addr = await getAddressFromCoords(location.coords.latitude, location.coords.longitude);
      if (addr) setOfficeAddress(addr);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
          address: officeAddress,
          updatedAt: new Date()
        });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
        <Text variant="headlineSmall" style={{ color: theme.colors.onSurface, flex: 1 }}>Configuración</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Work Schedule Section */}
        <View style={styles.sectionHeader}>
          <Text variant="labelLarge" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>JORNADA LABORAL</Text>
        </View>
        
        <SobrioCard style={{ marginBottom: 24 }} borderColor={getPrimaryColor()}>
            <View style={{ marginBottom: 20 }}>
              <Text variant="titleMedium" style={{ fontWeight: '600' }}>Días de Operación</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>
                Toca los días para activar o desactivar
              </Text>
            </View>
            
            <View style={styles.daysContainer}>
              {daysOfWeek.map((day) => {
                const isSelected = workDays.includes(day.id);
                return (
                  <Pressable
                    key={day.id}
                    onPress={() => toggleDay(day.id)}
                    style={[
                      styles.dayCircle,
                      isSelected && { backgroundColor: theme.colors.primary },
                      !isSelected && { borderColor: theme.colors.outline, borderWidth: 1 }
                    ]}
                  >
                    <Text 
                      variant="labelLarge" 
                      style={{ 
                        color: isSelected ? theme.colors.onPrimary : theme.colors.onSurfaceVariant,
                        fontWeight: isSelected ? 'bold' : 'normal'
                      }}
                    >
                      {day.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Divider style={{ marginVertical: 20 }} />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <PaperInput
                  label="Entrada"
                  value={workStartTime}
                  onChangeText={setWorkStartTime}
                  placeholder="08:00"
                  maxLength={5}
                  mode="outlined"
                  dense
                  left={<PaperInput.Icon icon="clock-start" size={20} />}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <PaperInput
                  label="Salida"
                  value={workEndTime}
                  onChangeText={setWorkEndTime}
                  placeholder="18:00"
                  maxLength={5}
                  mode="outlined"
                  dense
                  left={<PaperInput.Icon icon="clock-end" size={20} />}
                />
              </View>
            </View>

            <View style={{ marginTop: 16 }}>
              <PaperInput
                label="Tiempo de Gracia (min)"
                value={gracePeriod}
                onChangeText={setGracePeriod}
                placeholder="15"
                keyboardType="numeric"
                maxLength={2}
                mode="outlined"
                dense
                left={<PaperInput.Icon icon="timer-sand" size={20} />}
              />
            </View>
        </SobrioCard>

        {/* Location Section */}
        <View style={styles.sectionHeader}>
          <Text variant="labelLarge" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>GEOLOCALIZACIÓN</Text>
        </View>

        <SobrioCard style={{ marginBottom: 24 }} borderColor={getPrimaryColor()}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View>
                <Text variant="titleMedium" style={{ fontWeight: '600' }}>Zona de Oficina</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>
                  Radio permitido: {locationRadius}m
                </Text>
              </View>
              <IconButton 
                icon="pencil-outline" 
                mode="contained-tonal" 
                size={20}
                onPress={() => {
                  Alert.prompt(
                    "Radio de Cobertura",
                    "Ingresa el radio en metros:",
                    [
                      { text: "Cancelar", style: "cancel" },
                      { text: "Guardar", onPress: text => setLocationRadius(text) }
                    ],
                    "plain-text",
                    locationRadius
                  );
                }}
              />
            </View>

            {/* Map Widget Preview */}
            <Surface style={styles.mapWidget} elevation={0}>
              {officeLocation ? (
                <View style={styles.mapPreviewContent}>
                  <View style={styles.coordinateRow}>
                    <IconButton icon="map-marker" size={24} iconColor={theme.colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text variant="labelMedium" style={{ color: theme.colors.secondary }}>Ubicación Registrada</Text>
                      {officeAddress ? (
                        <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 2 }}>
                          {officeAddress}
                        </Text>
                      ) : null}
                      <Text variant="bodySmall" style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', color: theme.colors.outline }}>
                        {officeLocation.lat.toFixed(6)}, {officeLocation.lon.toFixed(6)}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.emptyMapState}>
                  <IconButton icon="map-marker-off" size={32} iconColor={theme.colors.error} />
                  <Text variant="bodyMedium" style={{ color: theme.colors.error }}>Sin ubicación registrada</Text>
                </View>
              )}
            </Surface>

            <View style={styles.actionButtonsRow}>
              <Button 
                mode="outlined" 
                onPress={captureLocation} 
                icon="crosshairs-gps"
                style={{ flex: 1, marginRight: 8 }}
                compact
              >
                Capturar GPS
              </Button>

              <Button 
                mode="contained-tonal" 
                onPress={openMapPicker} 
                icon="map-search"
                style={{ flex: 1, marginLeft: 8 }}
                compact
              >
                Abrir Mapa
              </Button>
            </View>
        </SobrioCard>

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
  deniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
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
    justifyContent: 'space-between',
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
  sectionHeader: {
    marginBottom: 12,
    marginLeft: 4
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapWidget: {
    backgroundColor: '#f0f2f5', // Light gray background
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)'
  },
  mapPreviewContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  coordinateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  emptyMapState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  }
});
