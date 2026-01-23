// 🔔 Hook para notificar cambios de permisos en tiempo real
// Detecta cuando los permisos del usuario cambian y muestra una alerta visual

import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { usePermissions } from './usePermissions';
import { useAuth } from '../contexts/AuthContext';

export const usePermissionChangeNotifier = () => {
  const { permissions, loading } = usePermissions();
  const { user } = useAuth();
  const previousPermissionsRef = useRef(null);
  const isInitialLoadRef = useRef(true);
  const previousUserIdRef = useRef(null);

  useEffect(() => {
    // Si cambia el usuario (logout/login), resetear el estado
    if (user?.uid !== previousUserIdRef.current) {
      previousPermissionsRef.current = null;
      isInitialLoadRef.current = true;
      previousUserIdRef.current = user?.uid;
      return;
    }

    // Esperar a que termine la carga inicial
    if (loading) return;

    // En la primera carga, solo guardar los permisos actuales
    if (isInitialLoadRef.current) {
      previousPermissionsRef.current = permissions;
      isInitialLoadRef.current = false;
      return;
    }

    // Si no hay permisos previos guardados, no hay nada que comparar
    if (!previousPermissionsRef.current) {
      previousPermissionsRef.current = permissions;
      return;
    }

    // Detectar cambios en los permisos
    const previousSet = new Set(previousPermissionsRef.current);
    const currentSet = new Set(permissions);

    // Permisos agregados
    const added = permissions.filter(p => !previousSet.has(p));
    
    // Permisos removidos
    const removed = previousPermissionsRef.current.filter(p => !currentSet.has(p));

    // Si hubo cambios, notificar al usuario
    if (added.length > 0 || removed.length > 0) {
      // Feedback táctil
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

      // Construir mensaje
      let message = '🔐 Tus permisos han sido actualizados.\n\n';
      
      if (added.length > 0) {
        message += `✅ Permisos agregados: ${added.length}\n`;
      }
      
      if (removed.length > 0) {
        message += `❌ Permisos removidos: ${removed.length}\n`;
      }
      
      message += '\nLos cambios se aplicarán de inmediato.';

      // Mostrar alerta
      Alert.alert(
        '🔄 Permisos Actualizados',
        message,
        [
          {
            text: 'Entendido',
            onPress: () => {
              // Feedback táctil de confirmación
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          }
        ]
      );

      // Actualizar referencia
      previousPermissionsRef.current = permissions;
    }
  }, [permissions, loading, user]);
};
