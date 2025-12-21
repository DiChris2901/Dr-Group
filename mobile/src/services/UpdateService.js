import * as Updates from 'expo-updates';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import { Alert, Platform } from 'react-native';
import Constants from 'expo-constants';

// ✅ Configuración del proyecto Expo
const EXPO_PROJECT_ID = '169f6749-ebbd-4386-9359-b60f7afe299d';
const EAS_API_URL = `https://api.expo.dev/v2/projects/${EXPO_PROJECT_ID}/builds`;

// ✅ Verificar si hay nueva versión APK en EAS Build
export const checkForNewAPK = async () => {
  if (__DEV__ || Platform.OS !== 'android') {
    return; // Solo funciona en producción Android
  }

  try {
    // Obtener versión actual de la app
    const currentVersion = Constants.expoConfig?.version || '1.0.0';
    
    console.log('🔍 Verificando nueva versión APK en EAS Build...');
    console.log('📱 Versión actual:', currentVersion);
    
    // Consultar API de EAS Build para obtener último build de producción
    const response = await fetch(`${EAS_API_URL}?platform=android&status=finished&limit=1`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.log('⚠️ No se pudo consultar EAS Build API');
      return;
    }
    
    const builds = await response.json();
    
    if (!builds || builds.length === 0) {
      console.log('📦 No hay builds disponibles en EAS');
      return;
    }
    
    // Obtener el build más reciente exitoso de producción
    const latestBuild = builds[0];
    const buildVersion = latestBuild.appVersion || '1.0.0';
    const buildChannel = latestBuild.channel;
    const buildUrl = latestBuild.artifacts?.buildUrl;
    
    console.log('🏗️ Último build encontrado:', {
      version: buildVersion,
      channel: buildChannel,
      createdAt: latestBuild.createdAt
    });
    
    // Solo notificar si es build de producción y versión diferente
    if (buildChannel === 'production' && buildVersion !== currentVersion && buildUrl) {
      Alert.alert(
        '🚀 Nueva Versión Disponible',
        `Versión ${buildVersion} disponible.\n\n¿Deseas descargarla ahora?`,
        [
          { text: 'Más tarde', style: 'cancel' },
          {
            text: 'Descargar',
            onPress: () => downloadAndInstallAPK(buildUrl, buildVersion),
          },
        ]
      );
    } else {
      console.log('✅ App actualizada (Versión actual es la más reciente)');
    }
  } catch (error) {
    console.log('❌ Error verificando versión APK desde EAS:', error);
  }
};

// ✅ Descargar e instalar APK
const downloadAndInstallAPK = async (downloadUrl, version) => {
  try {
    Alert.alert(
      'Descargando...',
      `Descargando versión ${version}. Esto puede tardar unos minutos.`,
      [{ text: 'OK' }]
    );

    // Directorio de descarga
    const downloadPath = `${FileSystem.documentDirectory}dr-group-${version}.apk`;

    // Descargar APK
    const downloadResumable = FileSystem.createDownloadResumable(
      downloadUrl,
      downloadPath,
      {},
      (downloadProgress) => {
        const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
        console.log(`Progreso: ${(progress * 100).toFixed(0)}%`);
      }
    );

    const { uri } = await downloadResumable.downloadAsync();

    Alert.alert(
      '✅ Descarga Completa',
      'La nueva versión se descargó correctamente. ¿Deseas instalarla ahora?',
      [
        { text: 'Más tarde', style: 'cancel' },
        {
          text: 'Instalar',
          onPress: () => installAPK(uri),
        },
      ]
    );
  } catch (error) {
    console.error('Error descargando APK:', error);
    Alert.alert(
      'Error de Descarga',
      `No se pudo descargar la actualización: ${error.message}`,
      [{ text: 'OK' }]
    );
  }
};

// ✅ Instalar APK descargado
const installAPK = async (apkUri) => {
  try {
    // Android requiere content:// URI, no file://
    const contentUri = await FileSystem.getContentUriAsync(apkUri);

    await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
      data: contentUri,
      flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
      type: 'application/vnd.android.package-archive',
    });
  } catch (error) {
    console.error('Error instalando APK:', error);
    Alert.alert(
      'Error de Instalación',
      'No se pudo abrir el instalador. Por favor, instala manualmente desde Descargas.',
      [{ text: 'OK' }]
    );
  }
};

// ✅ Verificar actualizaciones OTA (código original)
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
    console.log('Error verificando actualizaciones OTA:', error);
    if (!silent) {
      Alert.alert('Error', 'No se pudo verificar actualizaciones OTA: ' + error.message);
    }
  }
};

// ✅ Verificar AMBOS tipos de actualizaciones (OTA + APK)
export const checkForAllUpdates = async () => {
  // Primero verificar OTA (más rápido)
  await checkForUpdates(true);
  
  // Luego verificar nueva versión APK
  await checkForNewAPK();
};
