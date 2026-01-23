// 👥 PANTALLA DE GESTIÓN DE USUARIOS Y PERMISOS
// Solo accesible para SUPERADMIN o usuarios con permiso 'usuarios.permissions'

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Text,
  Avatar,
  Button,
  Portal,
  Modal,
  Divider,
  Switch,
  Searchbar,
  ActivityIndicator,
  IconButton,
  useTheme as usePaperTheme,
  Surface,
  Badge,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  setDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { useTheme } from '../../contexts/ThemeContext';
import { SobrioCard, OverlineText } from '../../components';
import {
  APP_PERMISSIONS,
  PERMISSION_CATEGORIES,
  calculateAppRole,
  SUPERADMIN_PERMISSIONS,
  TOTAL_PERMISSIONS,
} from '../../constants/permissions';

export default function UsersScreen() {
  const navigation = useNavigation();
  const { user: currentUser } = useAuth();
  const { can, isSuperAdmin } = usePermissions();
  const theme = usePaperTheme();
  const { getPrimaryColor, getSecondaryColor, triggerHaptic, isDarkMode } = useTheme();

  // Estados
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal de edición de permisos
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState([]);
  const [saving, setSaving] = useState(false);

  // ========================================
  // 🏷️ FUNCIÓN PARA NOMBRES DESCRIPTIVOS
  // ========================================

  const getPermissionDisplayName = (permission) => {
    const names = {
      // Pantallas Generales
      'dashboard': '📊 Dashboard (Marcar Jornada)',
      'settings': '⚙️ Configuración',
      'notificaciones': '🔔 Notificaciones',
      'perfil': '👤 Editar Perfil',
      'calendario': '📅 Calendario',
      
      // Asistencias
      'asistencias.propias': '✅ Ver mis registros',
      'asistencias.todos': '👥 Ver todos los registros',
      
      // Reportes
      'reportes.propios': '📈 Ver mi desempeño',
      'reportes.todos': '📊 Ver desempeño del equipo',
      
      // Novedades
      'novedades.reportar': '📝 Reportar incidencias',
      'novedades.gestionar': '🔧 Gestionar incidencias',
      
      // Admin
      'admin.dashboard': '🎛️ Panel Admin',
      'admin.novedades': '📋 Admin Novedades',
      'admin.create_alert': '🚨 Crear Alertas',
      'admin.notification_control': '📬 Control de Notificaciones',
      'admin.settings': '🔧 Configuración Laboral',
      'usuarios.gestionar': '👑 Gestionar Usuarios',
    };
    
    return names[permission] || permission;
  };

  // ========================================
  // 🔒 VALIDACIÓN DE ACCESO
  // ========================================

  const hasAccessToScreen = can(APP_PERMISSIONS.USUARIOS_GESTIONAR);

  useEffect(() => {
    // Solo mostrar alert si los permisos ya cargaron y no tiene acceso
    if (selectedPermissions.length === 0) return; // Permisos aún no cargados
    
    if (!hasAccessToScreen) {
      Alert.alert(
        '🔒 Acceso Denegado',
        'No tienes permisos para gestionar usuarios.',
        [
          { 
            text: 'Entendido', 
            onPress: () => navigation.goBack() 
          }
        ]
      );
    }
  }, [hasAccessToScreen]);

  // ========================================
  // 📡 CARGAR USUARIOS
  // ========================================

  const loadUsers = async () => {
    try {
      setLoading(true);

      // Cargar usuarios
      const usersRef = collection(db, 'users');
      const usersQuery = query(usersRef, orderBy('name', 'asc'));
      const usersSnap = await getDocs(usersQuery);

      const usersData = [];

      for (const userDoc of usersSnap.docs) {
        const userData = userDoc.data();

        // Cargar permisos desde PermissionsApp/{uid}
        const permissionsRef = doc(db, 'PermissionsApp', userDoc.id);
        const permissionsSnap = await getDocs(collection(db, 'PermissionsApp'));
        
        let userPermissions = [];
        permissionsSnap.forEach((permDoc) => {
          if (permDoc.id === userDoc.id) {
            userPermissions = permDoc.data().permissions || [];
          }
        });

        usersData.push({
          uid: userDoc.id,
          ...userData,
          permissions: userPermissions,
          permissionCount: userPermissions.length,
        });
      }

      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch (error) {
      console.error('❌ Error al cargar usuarios:', error);
      Alert.alert('Error', 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (hasAccessToScreen) {
      loadUsers();
    }
  }, [hasAccessToScreen]);

  // ========================================
  // 🔍 BÚSQUEDA DE USUARIOS
  // ========================================

  const handleSearch = (query) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(
      (u) =>
        u.name?.toLowerCase().includes(query.toLowerCase()) ||
        u.email?.toLowerCase().includes(query.toLowerCase()) ||
        u.appRole?.toLowerCase().includes(query.toLowerCase())
    );

    setFilteredUsers(filtered);
  };

  // ========================================
  // ✏️ EDITAR PERMISOS
  // ========================================

  const openEditModal = (userToEdit) => {
    setSelectedUser(userToEdit);
    
    // Filtrar solo permisos válidos del sistema v2.0 (eliminar permisos obsoletos del v1.0)
    const validPermissions = Object.values(APP_PERMISSIONS);
    const userValidPermissions = (userToEdit.permissions || []).filter(perm => 
      validPermissions.includes(perm)
    );
    
    console.log('🔍 Abriendo modal de edición:', {
      usuario: userToEdit.name,
      permisosEnFirestore: userToEdit.permissions?.length || 0,
      permisosObsoletos: (userToEdit.permissions || []).filter(p => !validPermissions.includes(p)),
      permisosValidos: userValidPermissions.length,
      permisos: userValidPermissions,
    });
    
    setSelectedPermissions(userValidPermissions);
    setExpandedCategories([]);
    setEditModalVisible(true);
  };

  const togglePermission = (permission) => {
    setSelectedPermissions((prev) => {
      const isCurrentlySelected = prev.includes(permission);
      
      // ✅ PERMISOS MUTUAMENTE EXCLUYENTES
      
      // 1. DASHBOARD: ADMIN_DASHBOARD vs DASHBOARD
      if (permission === APP_PERMISSIONS.ADMIN_DASHBOARD && !isCurrentlySelected) {
        return [...prev.filter(p => p !== APP_PERMISSIONS.DASHBOARD), permission];
      }
      if (permission === APP_PERMISSIONS.DASHBOARD && !isCurrentlySelected) {
        return [...prev.filter(p => p !== APP_PERMISSIONS.ADMIN_DASHBOARD), permission];
      }
      
      // 2. ASISTENCIAS: Ver todos vs Ver mis registros
      if (permission === APP_PERMISSIONS.ASISTENCIAS_TODOS && !isCurrentlySelected) {
        return [...prev.filter(p => p !== APP_PERMISSIONS.ASISTENCIAS_PROPIAS), permission];
      }
      if (permission === APP_PERMISSIONS.ASISTENCIAS_PROPIAS && !isCurrentlySelected) {
        return [...prev.filter(p => p !== APP_PERMISSIONS.ASISTENCIAS_TODOS), permission];
      }
      
      // 3. REPORTES: Ver todos vs Ver mis reportes
      if (permission === APP_PERMISSIONS.REPORTES_TODOS && !isCurrentlySelected) {
        return [...prev.filter(p => p !== APP_PERMISSIONS.REPORTES_PROPIOS), permission];
      }
      if (permission === APP_PERMISSIONS.REPORTES_PROPIOS && !isCurrentlySelected) {
        return [...prev.filter(p => p !== APP_PERMISSIONS.REPORTES_TODOS), permission];
      }
      
      // Comportamiento normal para otros permisos
      return isCurrentlySelected
        ? prev.filter((p) => p !== permission)
        : [...prev, permission];
    });
  };

  const toggleCategory = (category) => {
    const categoryPermissions = category.permissions;
    const allSelected = categoryPermissions.every((p) =>
      selectedPermissions.includes(p)
    );

    if (allSelected) {
      // Desmarcar todos
      setSelectedPermissions((prev) =>
        prev.filter((p) => !categoryPermissions.includes(p))
      );
    } else {
      // Marcar todos
      setSelectedPermissions((prev) => {
        const newPerms = new Set([...prev, ...categoryPermissions]);
        return Array.from(newPerms);
      });
    }
  };

  const toggleExpandCategory = (categoryId) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // ========================================
  // 💾 GUARDAR PERMISOS
  // ========================================

  const savePermissions = async () => {
    if (!selectedUser) return;

    try {
      setSaving(true);

      // Validar permisos únicos (eliminar duplicados si existen)
      const uniquePermissions = [...new Set(selectedPermissions)];
      const totalPermissionsAvailable = Object.values(APP_PERMISSIONS).length;

      console.log('🔍 DEBUG - Validación de permisos:', {
        usuario: selectedUser.name,
        permisosSeleccionados: selectedPermissions.length,
        permisosUnicos: uniquePermissions.length,
        totalDisponibles: totalPermissionsAvailable,
        hayDuplicados: selectedPermissions.length !== uniquePermissions.length,
        permisos: uniquePermissions,
      });

      // Calcular nuevo appRole basado en permisos específicos (NO en cantidad)
      const newAppRole = calculateAppRole(uniquePermissions);
      
      console.log('📊 Cálculo de rol:', {
        cantidadPermisos: uniquePermissions.length,
        rolCalculado: newAppRole,
        logica: uniquePermissions.includes('usuarios.gestionar') ? 'SUPERADMIN (tiene usuarios.gestionar)' : 
                uniquePermissions.includes('admin.dashboard') ? 'ADMIN (tiene admin.dashboard)' : 
                'USER (sin permisos admin)',
        permisosRelevantes: {
          usuariosGestionar: uniquePermissions.includes('usuarios.gestionar'),
          adminDashboard: uniquePermissions.includes('admin.dashboard'),
        },
      });

      // Actualizar PermissionsApp/{uid} con permisos únicos
      const permissionsRef = doc(db, 'PermissionsApp', selectedUser.uid);
      await setDoc(
        permissionsRef,
        {
          uid: selectedUser.uid,
          permissions: uniquePermissions,
          updatedAt: serverTimestamp(),
          updatedBy: currentUser.uid,
        },
        { merge: true }
      );

      // Actualizar users/{uid} - Solo campo appRole
      const userRef = doc(db, 'users', selectedUser.uid);
      await updateDoc(userRef, {
        appRole: newAppRole,
      });
      
      console.log('✅ Actualización completada:', {
        permisos: uniquePermissions.length,
        rol: newAppRole,
      });

      Alert.alert(
        '✅ Permisos Actualizados',
        `${selectedUser.name} ahora es ${newAppRole}\n\n${uniquePermissions.length}/${totalPermissionsAvailable} permisos activos${selectedUser.appRole !== newAppRole ? `\n\nCambio: ${selectedUser.appRole} → ${newAppRole}` : ''}`
      );

      setEditModalVisible(false);
      setSelectedUser(null);
      
      // Forzar recarga completa
      await loadUsers();
    } catch (error) {
      console.error('❌ Error al guardar permisos:', error);
      Alert.alert('Error', 'No se pudieron guardar los permisos');
    } finally {
      setSaving(false);
    }
  };

  // ========================================
  // 🔄 REFRESH
  // ========================================

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  // ========================================
  // 🎨 RENDERIZADO
  // ========================================

  // Si no tiene acceso, mostrar mensaje
  if (!hasAccessToScreen) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.deniedContainer}>
          <Surface style={[styles.deniedCard, { backgroundColor: theme.colors.surfaceContainerHigh }]} elevation={0}>
            <MaterialCommunityIcons name="shield-lock-outline" size={64} color={theme.colors.error} />
            <Text variant="headlineSmall" style={{ color: theme.colors.onSurface, marginTop: 20, fontWeight: '600' }}>
              Acceso Restringido
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 8 }}>
              No tienes permisos para gestionar usuarios.
            </Text>
          </Surface>
        </View>
      </SafeAreaView>
    );
  }

  // Loading inicial
  if (loading && users.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={getPrimaryColor()} />
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 16 }}>
            Cargando usuarios...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          iconColor={theme.colors.onSurface}
          onPress={() => {
            triggerHaptic('selection');
            navigation.goBack();
          }}
          style={{ margin: 0 }}
        />
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text variant="headlineMedium" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
              Gestión de Usuarios
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
              {filteredUsers.length} usuario{filteredUsers.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <MaterialCommunityIcons name="shield-account" size={40} color={getPrimaryColor()} />
        </View>
      </View>

      {/* Búsqueda */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Buscar por nombre, email o rol..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={[styles.searchbar, { backgroundColor: theme.colors.surfaceContainerHigh }]}
          iconColor={getPrimaryColor()}
          elevation={0}
        />
      </View>

      {/* Lista de Usuarios */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[getPrimaryColor()]}
            tintColor={getPrimaryColor()}
          />
        }
      >
        {filteredUsers.map((userItem) => (
          <SobrioCard key={userItem.uid} style={styles.userCard}>
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('selection');
                openEditModal(userItem);
              }}
              disabled={!isSuperAdmin}
              activeOpacity={0.7}
            >
              <View style={styles.cardContent}>
                {/* Avatar y Nombre */}
                <View style={styles.userInfo}>
                  <Avatar.Image
                    size={56}
                    source={{ uri: userItem.photoURL || 'https://via.placeholder.com/150' }}
                  />
                  <View style={styles.userDetails}>
                    <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
                      {userItem.name || 'Sin nombre'}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                      {userItem.email}
                    </Text>
                    
                    {/* Rol Badge */}
                    <Surface
                      style={[
                        styles.roleChip,
                        {
                          backgroundColor:
                            userItem.appRole === 'SUPERADMIN'
                              ? theme.colors.errorContainer
                              : userItem.appRole === 'ADMIN'
                              ? theme.colors.tertiaryContainer
                              : theme.colors.secondaryContainer,
                        },
                      ]}
                      elevation={0}
                    >
                      <Text 
                        variant="labelSmall" 
                        style={{ 
                          color: userItem.appRole === 'SUPERADMIN'
                            ? theme.colors.onErrorContainer
                            : userItem.appRole === 'ADMIN'
                            ? theme.colors.onTertiaryContainer
                            : theme.colors.onSecondaryContainer,
                          fontWeight: '600',
                        }}
                      >
                        {userItem.appRole || 'USER'}
                      </Text>
                    </Surface>
                  </View>
                </View>

                {/* Permisos Count */}
                <View style={styles.permissionsInfo}>
                  <Surface 
                    style={[styles.permissionsBadge, { backgroundColor: theme.colors.primaryContainer }]}
                    elevation={0}
                  >
                    <MaterialCommunityIcons
                      name="shield-check"
                      size={18}
                      color={theme.colors.onPrimaryContainer}
                    />
                    <Text 
                      variant="labelLarge" 
                      style={{ 
                        color: theme.colors.onPrimaryContainer, 
                        fontWeight: '600',
                        marginLeft: 4,
                      }}
                    >
                      {userItem.permissionCount}/{TOTAL_PERMISSIONS}
                    </Text>
                  </Surface>
                  
                  {isSuperAdmin && (
                    <IconButton
                      icon="chevron-right"
                      size={24}
                      iconColor={theme.colors.onSurfaceVariant}
                      style={{ margin: 0 }}
                    />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          </SobrioCard>
        ))}
      </ScrollView>

      {/* Modal de Edición de Permisos */}
      <Portal>
        <Modal
          visible={editModalVisible}
          onDismiss={() => setEditModalVisible(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header del Modal */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Avatar.Image
                  size={48}
                  source={{ uri: selectedUser?.photoURL || 'https://via.placeholder.com/150' }}
                />
                <View style={styles.modalTitleText}>
                  <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
                    {selectedUser?.name}
                  </Text>
                  <Surface
                    style={[
                      styles.permissionCounter,
                      { 
                        backgroundColor: selectedPermissions.length === TOTAL_PERMISSIONS 
                          ? theme.colors.primaryContainer 
                          : theme.colors.secondaryContainer 
                      }
                    ]}
                    elevation={0}
                  >
                    <MaterialCommunityIcons
                      name="shield-check"
                      size={16}
                      color={selectedPermissions.length === TOTAL_PERMISSIONS ? theme.colors.onPrimaryContainer : theme.colors.onSecondaryContainer}
                    />
                    <Text 
                      variant="labelLarge" 
                      style={{ 
                        color: selectedPermissions.length === TOTAL_PERMISSIONS ? theme.colors.onPrimaryContainer : theme.colors.onSecondaryContainer,
                        fontWeight: '600',
                        marginLeft: 4,
                      }}
                    >
                      {selectedPermissions.length}/{TOTAL_PERMISSIONS}
                    </Text>
                  </Surface>
                </View>
              </View>
              <IconButton
                icon="close"
                size={24}
                iconColor={theme.colors.onSurfaceVariant}
                onPress={() => setEditModalVisible(false)}
              />
            </View>

            {/* Botón Seleccionar TODO / Desmarcar TODO */}
            <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
              <Button
                mode="outlined"
                onPress={() => {
                  triggerHaptic('selection');
                  if (selectedPermissions.length === TOTAL_PERMISSIONS) {
                    // Desmarcar todo
                    setSelectedPermissions([]);
                  } else {
                    // Seleccionar todo (todos los permisos del sistema)
                    const allPerms = Object.values(APP_PERMISSIONS);
                    console.log('✨ Seleccionando TODOS los permisos:', allPerms.length);
                    setSelectedPermissions(allPerms);
                  }
                }}
                style={{ borderRadius: 20 }}
                icon={selectedPermissions.length === TOTAL_PERMISSIONS ? "close-circle" : "check-all"}
              >
                {selectedPermissions.length === TOTAL_PERMISSIONS ? 'Desmarcar Todo' : `Seleccionar Todo (${TOTAL_PERMISSIONS})`}
              </Button>
            </View>

            <Divider style={{ marginBottom: 16 }} />

            {/* Categorías de Permisos */}
            {PERMISSION_CATEGORIES.map((category) => {
              const categoryPerms = category.permissions;
              const selectedCount = categoryPerms.filter((p) =>
                selectedPermissions.includes(p)
              ).length;
              const allSelected = selectedCount === categoryPerms.length;
              const isExpanded = expandedCategories.includes(category.id);

              return (
                <Surface 
                  key={category.id} 
                  style={[styles.categoryContainer, { backgroundColor: theme.colors.surfaceContainerLow }]}
                  elevation={0}
                >
                  {/* Header de Categoría */}
                  <TouchableOpacity
                    onPress={() => {
                      triggerHaptic('selection');
                      toggleExpandCategory(category.id);
                    }}
                    style={styles.categoryHeader}
                    activeOpacity={0.7}
                  >
                    <View style={styles.categoryTitleContainer}>
                      <Surface 
                        style={[styles.categoryIconContainer, { backgroundColor: theme.colors.primaryContainer }]}
                        elevation={0}
                      >
                        <MaterialCommunityIcons
                          name={category.icon}
                          size={20}
                          color={theme.colors.onPrimaryContainer}
                        />
                      </Surface>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text variant="titleSmall" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
                          {category.name}
                        </Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                          {selectedCount}/{categoryPerms.length} activos
                        </Text>
                      </View>
                    </View>

                    <View style={styles.categoryActions}>
                      <Switch
                        value={allSelected}
                        onValueChange={() => {
                          triggerHaptic('selection');
                          toggleCategory(category);
                        }}
                        color={getPrimaryColor()}
                      />
                      <MaterialCommunityIcons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={24}
                        color={theme.colors.onSurfaceVariant}
                        style={{ marginLeft: 8 }}
                      />
                    </View>
                  </TouchableOpacity>

                  {/* Permisos Individuales */}
                  {isExpanded && (
                    <View style={[styles.permissionsContainer, { backgroundColor: theme.colors.surfaceContainerHighest }]}>
                      {categoryPerms.map((perm) => (
                        <TouchableOpacity
                          key={perm}
                          onPress={() => {
                            triggerHaptic('selection');
                            togglePermission(perm);
                          }}
                          style={styles.permissionItem}
                          activeOpacity={0.7}
                        >
                          <Text 
                            variant="bodyMedium" 
                            style={{ 
                              color: theme.colors.onSurface, 
                              flex: 1,
                              fontWeight: selectedPermissions.includes(perm) ? '600' : '400',
                            }}
                          >
                            {getPermissionDisplayName(perm)}
                          </Text>
                          <Switch
                            value={selectedPermissions.includes(perm)}
                            onValueChange={() => {
                              triggerHaptic('selection');
                              togglePermission(perm);
                            }}
                            color={getPrimaryColor()}
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </Surface>
              );
            })}

            {/* Botones de Acción */}
            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => setEditModalVisible(false)}
                style={styles.cancelButton}
                textColor={theme.colors.onSurface}
              >
                Cancelar
              </Button>
              <Button
                mode="contained"
                onPress={() => {
                  triggerHaptic('impactMedium');
                  savePermissions();
                }}
                loading={saving}
                disabled={saving}
                style={styles.saveButton}
                buttonColor={getPrimaryColor()}
              >
                Guardar
              </Button>
            </View>
          </ScrollView>
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
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 8,
  },
  headerTextContainer: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchbar: {
    borderRadius: 28,
    elevation: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  userCard: {
    marginBottom: 12,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  roleChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  permissionsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  permissionsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  deniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  deniedCard: {
    padding: 32,
    borderRadius: 28,
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    margin: 20,
    borderRadius: 28,
    maxHeight: '85%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalTitleText: {
    marginLeft: 12,
    flex: 1,
  },
  permissionCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  categoryContainer: {
    borderRadius: 20,
    marginBottom: 12,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  permissionsContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 6,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 24,
  },
  saveButton: {
    flex: 1,
    borderRadius: 24,
  },
});
