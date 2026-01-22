import { useEffect, useState } from 'react';
import Constants from 'expo-constants';
import { Alert, Linking } from 'react-native';

/**
 * Hook para verificar actualizaciones disponibles en Firebase App Distribution
 * Consulta la última versión disponible y notifica al usuario si hay una actualización
 */
export const useAppDistribution = () => {
  const [updateAvailable, setUpdateAvailable] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    checkForUpdate();
  }, []);

  const checkForUpdate = async () => {
    setIsChecking(true);
    try {
      const currentVersion = Constants.expoConfig?.version || '3.0.0';
      
      // Consultar endpoint público del proyecto (versión simplificada sin auth)
      // Usamos Firestore para almacenar la última versión disponible
      const response = await fetch(
        'https://firestore.googleapis.com/v1/projects/dr-group-cd21b/databases/(default)/documents/appConfig/latestVersion',
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        console.error('❌ [UPDATE CHECK] Error al consultar actualizaciones:', response.status);
        return;
      }

      const doc = await response.json();
      
      const latestVersion = doc.fields?.version?.stringValue;
      const releaseNotes = doc.fields?.releaseNotes?.stringValue || 'Nueva versión disponible';
      const isCritical = doc.fields?.isCritical?.booleanValue || false;
      
      if (!latestVersion) {
        console.error('⚠️ [UPDATE CHECK] No hay versión configurada en Firestore');
        return;
      }
      
      // Comparar versiones
      const comparison = compareVersions(latestVersion, currentVersion);
      
      if (latestVersion !== currentVersion && comparison > 0) {
        const updateData = {
          version: latestVersion,
          downloadUrl: 'https://appdistribution.firebase.google.com/testerapps/1:526970184316:android:4e55364c1a1794daf41ff9',
          releaseNotes: releaseNotes,
          isCritical: isCritical
        };
        setUpdateAvailable(updateData);
      }
    } catch (error) {
      console.error('❌ [UPDATE CHECK] Error:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const compareVersions = (v1, v2) => {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;
      
      if (part1 > part2) return 1;
      if (part1 < part2) return -1;
    }
    return 0;
  };

  const downloadUpdate = () => {
    if (updateAvailable?.downloadUrl) {
      Linking.openURL(updateAvailable.downloadUrl);
    }
  };

  const showUpdateDialog = () => {
    if (!updateAvailable) return;

    const title = updateAvailable.isCritical 
      ? '⚠️ Actualización Crítica Requerida'
      : '🎉 Nueva Versión Disponible';

    const message = `Versión ${updateAvailable.version}\n\n${updateAvailable.releaseNotes}`;

    const buttons = updateAvailable.isCritical
      ? [{ text: 'Actualizar Ahora', onPress: downloadUpdate }]
      : [
          { text: 'Más Tarde', style: 'cancel' },
          { text: 'Actualizar', onPress: downloadUpdate }
        ];

    Alert.alert(title, message, buttons, { cancelable: !updateAvailable.isCritical });
  };

  return {
    updateAvailable,
    isChecking,
    checkForUpdate,
    downloadUpdate,
    showUpdateDialog
  };
};
