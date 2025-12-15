import React from 'react';
import { View, StyleSheet, Linking, ScrollView } from 'react-native';
import { Text, Button, Avatar, useTheme, IconButton, Divider, Surface, Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function EmployeeDetailSheet({ employee, onClose, onStatusChange }) {
  const theme = useTheme();

  if (!employee) return null;

  const isNovedad = !!employee.type && !!employee.status;

  const handleCall = () => {
    if (employee.phone) Linking.openURL(`tel:${employee.phone}`);
  };

  const handleWhatsApp = () => {
    if (employee.phone) {
      const phone = employee.phone.replace('+', '');
      const url = `whatsapp://send?phone=${phone}`;
      Linking.openURL(url).catch(() => {
        Linking.openURL(`https://wa.me/${phone}`);
      });
    }
  };

  const handleEmail = () => {
    if (employee.email || employee.empleadoEmail) {
      Linking.openURL(`mailto:${employee.email || employee.empleadoEmail}`);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.header}>
        <Text variant="titleMedium" style={{ fontWeight: 'bold', opacity: 0.5 }}>
          {isNovedad ? 'Detalle de Solicitud' : 'Ficha de Empleado'}
        </Text>
        <IconButton icon="close" onPress={onClose} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Profile Section */}
        <View style={styles.profileHeader}>
          <Avatar.Text 
            size={64} 
            label={(employee.userName || employee.empleadoNombre || 'NN').substring(0, 2).toUpperCase()} 
            style={{ backgroundColor: theme.colors.primaryContainer }}
            color={theme.colors.onPrimaryContainer}
          />
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text variant="headlineSmall" style={{ fontWeight: 'bold' }}>
              {employee.userName || employee.empleadoNombre}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.secondary }}>
              {employee.position || 'Empleado'}
            </Text>
          </View>
        </View>

        {/* Novedad Details */}
        {isNovedad && (
          <Surface style={[styles.novedadCard, { backgroundColor: theme.colors.surfaceVariant }]} elevation={0}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Chip icon="clock" compact>{employee.status?.toUpperCase()}</Chip>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {employee.date?.toDate ? format(employee.date.toDate(), 'dd MMM yyyy, h:mm a', { locale: es }) : ''}
              </Text>
            </View>
            
            <Text variant="titleLarge" style={{ fontWeight: 'bold', color: theme.colors.primary, marginBottom: 8 }}>
              {employee.type?.replace('_', ' ').toUpperCase()}
            </Text>
            
            <Divider style={{ marginBottom: 12 }} />
            
            <Text variant="bodyLarge" style={{ lineHeight: 24 }}>
              {employee.description || 'Sin descripción proporcionada.'}
            </Text>
          </Surface>
        )}

        {/* Decision Buttons */}
        {isNovedad && employee.status === 'pending' && onStatusChange && (
          <View style={styles.decisionButtons}>
            <Button 
              mode="outlined" 
              textColor={theme.colors.error} 
              style={{ flex: 1, borderColor: theme.colors.error }}
              icon="close"
              onPress={() => { onStatusChange(employee.id, 'rejected'); onClose(); }}
            >
              Rechazar
            </Button>
            <Button 
              mode="contained" 
              buttonColor={theme.colors.primary} 
              style={{ flex: 1 }}
              icon="check"
              onPress={() => { onStatusChange(employee.id, 'approved'); onClose(); }}
            >
              Aprobar
            </Button>
          </View>
        )}

        <Divider style={{ marginVertical: 24 }} />

        {/* Contact Actions */}
        <Text variant="titleSmall" style={{ fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>
          Contactar Empleado
        </Text>
        <View style={styles.actionsContainer}>
          <View style={styles.actionItem}>
            <IconButton 
              icon="phone" 
              mode="contained" 
              containerColor={theme.colors.secondaryContainer} 
              iconColor={theme.colors.onSecondaryContainer}
              size={28}
              onPress={handleCall}
            />
            <Text variant="labelSmall">Llamar</Text>
          </View>

          <View style={styles.actionItem}>
            <IconButton 
              icon="whatsapp" 
              mode="contained" 
              containerColor="#25D366" 
              iconColor="white"
              size={28}
              onPress={handleWhatsApp}
            />
            <Text variant="labelSmall">WhatsApp</Text>
          </View>

          <View style={styles.actionItem}>
            <IconButton 
              icon="email" 
              mode="contained" 
              containerColor={theme.colors.tertiaryContainer} 
              iconColor={theme.colors.onTertiaryContainer}
              size={28}
              onPress={handleEmail}
            />
            <Text variant="labelSmall">Email</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    height: '85%', // Increased height for more content
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  novedadCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  decisionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  actionItem: {
    alignItems: 'center',
    gap: 8,
  },
});
