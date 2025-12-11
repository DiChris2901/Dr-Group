import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, useTheme, Surface, Avatar, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotificationsScreen({ navigation }) {
  const theme = useTheme();

  // Mock data for now
  const notifications = [
    {
      id: '1',
      title: 'Bienvenido a la nueva App',
      message: 'Disfruta del nuevo diseño Material You.',
      time: 'Hace 5 min',
      icon: 'party-popper',
      color: theme.colors.primary
    },
    {
      id: '2',
      title: 'Recordatorio de Jornada',
      message: 'No olvides registrar tu salida hoy.',
      time: 'Hace 2 horas',
      icon: 'clock-outline',
      color: theme.colors.tertiary
    }
  ];

  const renderItem = ({ item }) => (
    <Surface style={styles.card} elevation={0}>
      <Avatar.Icon 
        size={48} 
        icon={item.icon} 
        style={{ backgroundColor: theme.colors.secondaryContainer }} 
        color={item.color}
      />
      <View style={styles.textContainer}>
        <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{item.title}</Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.secondary }}>{item.message}</Text>
        <Text variant="labelSmall" style={{ color: theme.colors.outline, marginTop: 4 }}>{item.time}</Text>
      </View>
    </Surface>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
        <Text variant="headlineSmall" style={{ fontWeight: 'bold', marginLeft: 8 }}>Notificaciones</Text>
      </View>

      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="bodyLarge">No tienes notificaciones nuevas</Text>
          </View>
        }
      />
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
    padding: 16,
  },
  list: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.5)', // Semi-transparent
  },
  textContainer: {
    flex: 1,
    marginLeft: 16,
  },
  empty: {
    alignItems: 'center',
    marginTop: 40,
  }
});
