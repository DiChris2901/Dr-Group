import * as Updates from 'expo-updates';
import { Alert } from 'react-native';

export const checkForUpdates = async (silent = true) => {
  if (__DEV__) {
    if (!silent) {
      Alert.alert('Modo Desarrollo', 'Las actualizaciones OTA no funcionan en modo desarrollo.');
    }
    return;
  }

  try {
    const update = await Updates.checkForUpdateAsync();

    if (update.isAvailable) {
      if (!silent) {
        Alert.alert(
          'Actualización Disponible',
          'Descargando nueva versión...',
          [{ text: 'OK' }]
        );
      }
      
      await Updates.fetchUpdateAsync();
      
      Alert.alert(
        'Actualización Lista',
        'La aplicación se reiniciará para aplicar los cambios.',
        [
          {
            text: 'Reiniciar ahora',
            onPress: async () => {
              await Updates.reloadAsync();
            },
          },
        ]
      );
    } else {
      if (!silent) {
        Alert.alert('Actualizado', 'Ya tienes la última versión disponible.');
      }
    }
  } catch (error) {
    console.log('Error verificando actualizaciones:', error);
    if (!silent) {
      Alert.alert('Error', 'No se pudo verificar actualizaciones: ' + error.message);
    }
  }
};
