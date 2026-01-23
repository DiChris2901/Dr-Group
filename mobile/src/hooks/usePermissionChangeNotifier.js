// 🔔 Hook para notificar cambios de permisos en tiempo real
// Detecta cuando los permisos del usuario cambian y muestra una alerta visual

import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Portal, Dialog, Text, Button, useTheme as usePaperTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { usePermissions } from './usePermissions';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export const usePermissionChangeNotifier = () => {
  const { permissions, loading } = usePermissions();
  const { user } = useAuth();
  const { getPrimaryColor } = useTheme();
  const theme = usePaperTheme();
  const previousPermissionsRef = useRef(null);
  const isInitialLoadRef = useRef(true);
  const previousUserIdRef = useRef(null);
  
  // Estado para controlar el diálogo
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogData, setDialogData] = useState({ added: [], removed: [] });

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

      // Mostrar diálogo personalizado
      setDialogData({ added, removed });
      setDialogVisible(true);

      // Actualizar referencia
      previousPermissionsRef.current = permissions;
    }
  }, [permissions, loading, user]);

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDialogVisible(false);
  };

  // Renderizar el diálogo Material You
  const renderDialog = () => (
    <Portal>
      <Dialog
        visible={dialogVisible}
        onDismiss={handleDismiss}
        style={{
          borderRadius: 32,
          backgroundColor: theme.colors.surfaceContainerHigh,
        }}
      >
        {/* Header con ícono */}
        <View style={styles.dialogHeader}>
          <View style={[styles.iconContainer, { backgroundColor: `${getPrimaryColor()}20` }]}>
            <MaterialCommunityIcons 
              name="shield-sync" 
              size={32} 
              color={getPrimaryColor()} 
            />
          </View>
        </View>

        {/* Título */}
        <Dialog.Title 
          style={{
            fontFamily: 'Roboto-Flex',
            fontWeight: '500',
            fontSize: 24,
            letterSpacing: -0.5,
            textAlign: 'center',
            color: theme.colors.onSurface,
            paddingTop: 8,
          }}
        >
          Permisos Actualizados
        </Dialog.Title>

        {/* Contenido */}
        <Dialog.Content>
          <View style={styles.contentContainer}>
            {dialogData.added.length > 0 && (
              <View style={[styles.permissionSection, { backgroundColor: theme.colors.surfaceContainerLow }]}>
                <MaterialCommunityIcons 
                  name="check-circle" 
                  size={20} 
                  color={theme.colors.primary} 
                />
                <Text 
                  variant="bodyMedium" 
                  style={{ 
                    color: theme.colors.onSurface,
                    marginLeft: 8,
                    flex: 1,
                  }}
                >
                  {dialogData.added.length} permiso{dialogData.added.length > 1 ? 's' : ''} agregado{dialogData.added.length > 1 ? 's' : ''}
                </Text>
              </View>
            )}

            {dialogData.removed.length > 0 && (
              <View style={[styles.permissionSection, { backgroundColor: theme.colors.surfaceContainerLow }]}>
                <MaterialCommunityIcons 
                  name="close-circle" 
                  size={20} 
                  color={theme.colors.error} 
                />
                <Text 
                  variant="bodyMedium" 
                  style={{ 
                    color: theme.colors.onSurface,
                    marginLeft: 8,
                    flex: 1,
                  }}
                >
                  {dialogData.removed.length} permiso{dialogData.removed.length > 1 ? 's' : ''} removido{dialogData.removed.length > 1 ? 's' : ''}
                </Text>
              </View>
            )}

            <Text 
              variant="bodySmall" 
              style={{ 
                color: theme.colors.onSurfaceVariant,
                textAlign: 'center',
                marginTop: 16,
              }}
            >
              Los cambios se aplicarán de inmediato
            </Text>
          </View>
        </Dialog.Content>

        {/* Botón */}
        <Dialog.Actions style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
          <Button
            mode="contained"
            onPress={handleDismiss}
            style={{
              borderRadius: 24,
              flex: 1,
            }}
            contentStyle={{ paddingVertical: 8 }}
            labelStyle={{
              fontFamily: 'Roboto-Flex',
              fontWeight: '500',
              letterSpacing: 0.5,
            }}
          >
            Entendido
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );

  return { renderDialog };
};

const styles = StyleSheet.create({
  dialogHeader: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 0,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    gap: 12,
    paddingTop: 8,
  },
  permissionSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
});
