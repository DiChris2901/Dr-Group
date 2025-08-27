import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Grid,
  Avatar,
  Tooltip,
  Switch,
  Divider,
  useTheme,
  alpha
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  AdminPanelSettings as AdminIcon,
  Security as SecurityIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// Firebase imports
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  setDoc,
  serverTimestamp,
  query,
  where 
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  deleteUser,
  getAuth,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { db, auth } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';

// Permisos y roles simplificados
import { 
  USER_ROLES
} from '../utils/userPermissions';

const UserManagementPage = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const { addNotification } = useNotifications();
  
  // Estados principales
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  
  // Estados del modal
  const [openModal, setOpenModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    phone: '',
    role: 'EMPLOYEE',
    permissions: [],
    companies: [],
    isActive: true,
    department: '',
    notes: '',
    temporalPassword: '' // Nueva contraseña temporal
  });

  // Estado para detectar cambios en el formulario
  const [originalFormData, setOriginalFormData] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Cargar usuarios al montar el componente
  useEffect(() => {
    loadUsers();
  }, []);

  // Cargar perfil del usuario actual
  useEffect(() => {
    const loadCurrentUserProfile = async () => {
      if (currentUser?.email) {
        try {
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('email', '==', currentUser.email.toLowerCase()));
          const snapshot = await getDocs(q);
          
          if (!snapshot.empty) {
            const userDoc = snapshot.docs[0];
            setCurrentUserProfile({ id: userDoc.id, ...userDoc.data() });
          }
        } catch (err) {
          console.error('Error loading current user profile:', err);
        }
      }
    };

    loadCurrentUserProfile();
  }, [currentUser]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersCollection = collection(db, 'users');
      const snapshot = await getDocs(usersCollection);
      
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setUsers(usersData);
      setError(null);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = async (user = null) => {
    try {
      console.log('🔧 Abriendo modal de usuario...', user ? 'Editando' : 'Creando nuevo');
      
      if (user) {
        // Editar usuario existente
        setEditingUser(user);
        
        const userData = {
          email: user.email || '',
          displayName: user.displayName || user.name || '',
          phone: user.phone || '',
          role: user.role || 'EMPLOYEE',
          permissions: user.permissions || [],
          companies: user.companies || [],
          isActive: user.isActive !== false,
          department: user.department || '',
          notes: user.notes || ''
        };
        
        setFormData(userData);
        setOriginalFormData(JSON.parse(JSON.stringify(userData)));
        setHasUnsavedChanges(false);
      } else {
        // Crear nuevo usuario - versión simplificada
        setEditingUser(null);
        const newUserData = {
          email: '',
          displayName: '',
          phone: '',
          role: 'EMPLOYEE',
          permissions: [
            'view_commitments',
            'view_receipts'
          ], // Permisos básicos simplificados
          companies: [],
          isActive: true,
          department: '',
          notes: '',
          temporalPassword: 'DRGroup2025!'
        };
        
        console.log('📋 Datos del nuevo usuario:', newUserData);
        setFormData(newUserData);
        setOriginalFormData(JSON.parse(JSON.stringify(newUserData)));
        setHasUnsavedChanges(false);
      }
      
      console.log('✅ Abriendo modal...');
      setOpenModal(true);
      
    } catch (error) {
      console.error('❌ Error abriendo modal:', error);
      addNotification({
        type: 'error',
        title: 'Error al Abrir Formulario',
        message: 'No se pudo abrir el formulario de usuario',
        icon: 'error'
      });
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditingUser(null);
    setShowPassword(false);
    setHasUnsavedChanges(false);
  };

  // Función para detectar cambios en el formulario
  const checkForChanges = (newFormData) => {
    // Función para comparar arrays sin importar el orden
    const arraysEqual = (arr1, arr2) => {
      if (arr1.length !== arr2.length) return false;
      const sorted1 = [...arr1].sort();
      const sorted2 = [...arr2].sort();
      return JSON.stringify(sorted1) === JSON.stringify(sorted2);
    };
    
    // Comparar cada campo individualmente
    const hasChanges = 
      newFormData.email !== originalFormData.email ||
      newFormData.displayName !== originalFormData.displayName ||
      newFormData.phone !== originalFormData.phone ||
      newFormData.role !== originalFormData.role ||
      newFormData.department !== originalFormData.department ||
      newFormData.notes !== originalFormData.notes ||
      newFormData.isActive !== originalFormData.isActive ||
      !arraysEqual(newFormData.permissions || [], originalFormData.permissions || []) ||
      !arraysEqual(newFormData.companies || [], originalFormData.companies || []);
    
    setHasUnsavedChanges(hasChanges);
  };

  // Función helper para actualizar formData y detectar cambios
  const updateFormData = (updates) => {
    const newFormData = { ...formData, ...updates };
    setFormData(newFormData);
    checkForChanges(newFormData);
  };

  const handleRoleChange = (newRole) => {
    console.log('🔧 Cambiando rol a:', newRole);
    
    let newPermissions = [];
    
    // Permisos simplificados por rol
    if (newRole === 'ADMIN') {
      newPermissions = [
        'admin_access',
        'system_config',
        'manage_users',
        'view_users',
        'view_commitments',
        'create_commitments',
        'edit_commitments',
        'delete_commitments',
        'view_receipts',
        'download_receipts',
        'upload_receipts',
        'delete_receipts',
        'generate_reports',
        'export_data'
      ];
    } else if (newRole === 'MANAGER') {
      newPermissions = [
        'view_commitments',
        'create_commitments',
        'edit_commitments',
        'view_receipts',
        'download_receipts',
        'upload_receipts',
        'generate_reports',
        'export_data'
      ];
    } else {
      newPermissions = [
        'view_commitments',
        'view_receipts',
        'download_receipts'
      ];
    }
    
    updateFormData({
      role: newRole,
      permissions: newPermissions
    });
  };

  const handlePermissionToggle = (permission) => {
    const newPermissions = formData.permissions.includes(permission)
      ? formData.permissions.filter(p => p !== permission)
      : [...formData.permissions, permission];
    
    updateFormData({
      permissions: newPermissions
    });
  };

  // 🔄 Función para sincronizar usuarios con Authentication
  const syncUserWithAuth = async (user) => {
    try {
      console.log('🔄 Sincronizando usuario con Authentication...', user.email);
      
      // Actualizar estado a ACTIVE (ya no pendiente)
      await updateDoc(doc(db, 'users', user.id), {
        status: 'ACTIVE',
        authCompleted: true,
        updatedAt: new Date()
      });
      
      // Eliminar de pending_auth_users si existe
      const pendingQuery = query(
        collection(db, 'pending_auth_users'), 
        where('email', '==', user.email.toLowerCase())
      );
      const pendingSnapshot = await getDocs(pendingQuery);
      
      if (!pendingSnapshot.empty) {
        await deleteDoc(doc(db, 'pending_auth_users', pendingSnapshot.docs[0].id));
        console.log('✅ Eliminado de pending_auth_users');
      }
      
      await loadUsers();
      
      addNotification({
        type: 'success',
        title: '✅ Usuario Sincronizado',
        message: `Usuario "${user.displayName || user.email}" ahora está completamente activo`,
        icon: 'check_circle'
      });
      
    } catch (err) {
      console.error('Error sincronizando usuario:', err);
      addNotification({
        type: 'error',
        title: 'Error de Sincronización',
        message: 'No se pudo completar la sincronización',
        icon: 'error'
      });
    }
  };

  const handleSaveUser = async () => {
    try {
      setModalLoading(true);
      setError(null);
      
      const userData = {
        email: formData.email.toLowerCase(),
        displayName: formData.displayName,
        phone: formData.phone,
        role: formData.role,
        permissions: formData.permissions,
        companies: formData.companies,
        isActive: formData.isActive,
        department: formData.department,
        notes: formData.notes,
        updatedAt: new Date(),
        ...(editingUser ? {} : { 
          createdAt: new Date(),
          createdBy: currentUser.uid 
        })
      };

      if (editingUser) {
        // Actualizar usuario existente
        await updateDoc(doc(db, 'users', editingUser.id), userData);
      } else {
        // Verificar si el usuario ya existe ANTES de crear
        const usersRef = collection(db, 'users');
        const existingUserQuery = query(usersRef, where('email', '==', formData.email.toLowerCase()));
        const existingUserSnapshot = await getDocs(existingUserQuery);
        
        if (!existingUserSnapshot.empty) {
          throw new Error('Ya existe un usuario con este email');
        }
        
        // 🚀 Crear usuario completo
        console.log('🔧 Creando usuario completo automáticamente...');
        
        try {
          console.log('🔧 Iniciando creación de usuario...');
          console.log('📧 Email:', formData.email.toLowerCase());
          console.log('👤 Usuario actual:', currentUser?.email);
          
          // Guardar credenciales del admin para restaurar después
          const adminEmail = currentUser.email;
          const adminPassword = prompt('Para crear el usuario, ingresa tu contraseña de administrador:');
          if (!adminPassword) {
            throw new Error('Se requiere la contraseña del administrador para crear usuarios');
          }
          
          // 1. Crear usuario en Firebase Authentication
          const userCredential = await createUserWithEmailAndPassword(
            auth, 
            formData.email.toLowerCase(), 
            formData.temporalPassword || 'DRGroup2025!'
          );
          
          console.log('✅ Usuario creado en Authentication:', userCredential.user.uid);
          
          // 2. Preparar datos simplificados para Firestore
          const simpleUserData = {
            email: formData.email.toLowerCase(),
            displayName: formData.displayName,
            name: formData.displayName,
            phone: formData.phone || '',
            role: formData.role,
            permissions: formData.permissions,
            companies: formData.companies,
            isActive: true,
            department: formData.department || 'Administración',
            position: formData.role === 'ADMIN' ? 'Administrador' : 'Usuario',
            authUid: userCredential.user.uid,
            status: 'ACTIVE',
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: currentUser.uid,
            notes: formData.notes || 'Usuario creado desde panel de administración'
          };
          
          // 3. Crear documento en Firestore usando el UID de Auth como ID
          console.log('� Creando documento en Firestore con UID:', userCredential.user.uid);
          console.log('📋 Datos a guardar:', simpleUserData);
          
          await setDoc(doc(db, 'users', userCredential.user.uid), simpleUserData);
          console.log('✅ Usuario guardado en Firestore con ID:', userCredential.user.uid);
          
          // 4. Enviar email de reset para que configure su propia contraseña
          try {
            await sendPasswordResetEmail(auth, formData.email.toLowerCase());
            console.log('📧 Email de reset enviado para configurar contraseña');
          } catch (emailError) {
            console.warn('⚠️ No se pudo enviar email de reset:', emailError.message);
          }
          
          // 5. Restaurar sesión del administrador
          console.log('🔄 Restaurando sesión del administrador...');
          await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
          console.log('✅ Sesión del administrador restaurada');
          
          // 6. Mostrar resultado exitoso
          console.log('� === USUARIO CREADO COMPLETAMENTE ===');
          console.log(`📧 Email: ${formData.email.toLowerCase()}`);
          console.log(`🔑 Password temporal: ${formData.temporalPassword || 'DRGroup2025!'}`);
          console.log(`🆔 Auth UID: ${userCredential.user.uid}`);
          console.log(`🆔 UID: ${userCredential.user.uid}`);
          console.log('✅ El usuario puede iniciar sesión inmediatamente');
          console.log('==========================================');
          
        } catch (authError) {
          console.error('❌ Error creando usuario:', authError);
          
          if (authError.code === 'auth/email-already-in-use') {
            throw new Error('Este email ya está registrado');
          } else if (authError.code === 'permission-denied') {
            throw new Error('Sin permisos para crear usuarios. Verifica las reglas de Firestore');
          }
          
          throw new Error(`Error: ${authError.message}`);
        }
      }

      await loadUsers();
      handleCloseModal();
      setHasUnsavedChanges(false);
      
      // 📢 Agregar notificación de éxito
      if (editingUser) {
        addNotification({
          type: 'success',
          title: 'Usuario Actualizado',
          message: `Usuario "${formData.displayName || formData.email}" actualizado correctamente`,
          icon: 'edit'
        });
      } else {
        // Para usuarios nuevos - notificación de creación automática
        addNotification({
          type: 'success',
          title: '🎉 Usuario Creado Automáticamente',
          message: `Usuario "${formData.displayName || formData.email}" creado completamente en Firebase Auth + Firestore. ¡Listo para usar!`,
          icon: 'person_add'
        });
        console.log('✅ Proceso de creación automática completado exitosamente');
      }
      
    } catch (err) {
      console.error('Error saving user:', err);
      setError(`Error al ${editingUser ? 'actualizar' : 'crear'} usuario: ${err.message}`);
      
      // 📢 Notificación de error
      addNotification({
        type: 'error',
        title: `Error al ${editingUser ? 'Actualizar' : 'Crear'} Usuario`,
        message: err.message,
        icon: 'error'
      });
      
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    const userToDelete = users.find(u => u.id === userId);
    
    if (!userToDelete) {
      setError('Usuario no encontrado');
      return;
    }
    
    // Prevenir eliminar el último administrador
    if (userToDelete.role === 'ADMIN' && users.filter(u => u.role === 'ADMIN').length === 1) {
      setError('No puedes eliminar el último administrador del sistema');
      return;
    }
    
    // Prevenir que un usuario se elimine a sí mismo
    if (userToDelete.email === currentUser?.email) {
      setError('No puedes eliminar tu propio usuario');
      return;
    }
    
    if (window.confirm(`¿Estás seguro de que quieres eliminar completamente al usuario "${userToDelete.displayName || userToDelete.email}"?\n\nEsta acción eliminará:\n- Su cuenta de autenticación\n- Todos sus datos del sistema\n- No se puede deshacer`)) {
      try {
        setLoading(true);
        console.log('🗑️ Eliminando usuario completo...', userToDelete.email);
        console.log('🔍 Datos del usuario:', userToDelete);
        
        let deletedFromAuth = false;
        
        // ⚠️ NOTA: La eliminación de Firebase Auth desde frontend tiene limitaciones
        // Solo puede eliminar al usuario actualmente autenticado
        
        // 1. Primero eliminar de Firestore (siempre funciona)
        console.log('🔥 Eliminando de Firestore...');
        await deleteDoc(doc(db, 'users', userId));
        console.log('✅ Usuario eliminado de Firestore');
        
        // 2. Para Firebase Auth, solo mostrar advertencia
        if (userToDelete.authUid) {
          console.warn('⚠️ No se puede eliminar de Firebase Auth desde frontend');
          console.warn('⚠️ El usuario aún existe en Authentication, deberá ser eliminado manualmente desde Firebase Console');
          deletedFromAuth = false;
        } else {
          deletedFromAuth = true; // No había authUid, no hay nada que eliminar en Auth
        }
        
        // 3. Log de auditoría local (sin Cloud Function)
        try {
          await addDoc(collection(db, 'audit_logs'), {
            action: 'DELETE_USER',
            targetUser: userToDelete.email,
            performedBy: currentUser.email,
            performedByUid: currentUser.uid,
            timestamp: new Date(),
            details: {
              deletedUser: {
                email: userToDelete.email,
                role: userToDelete.role,
                displayName: userToDelete.displayName
              },
              note: 'Usuario eliminado de Firestore. Auth debe ser eliminado manualmente.'
            }
          });
        } catch (auditError) {
          console.warn('⚠️ Error creando log de auditoría:', auditError);
        }
        
        await loadUsers();
        setError(null);
        
        // 📢 Notificación de eliminación
        const message = deletedFromAuth 
          ? 'Usuario eliminado completamente del sistema'
          : 'Usuario eliminado de Firestore. Revisar Firebase Auth manualmente.';
        
        addNotification({
          type: 'warning',
          title: 'Usuario Eliminado',
          message: `Usuario "${userToDelete.displayName || userToDelete.email}" eliminado de Firestore. ⚠️ Revisar Firebase Auth manualmente.`,
          icon: 'delete'
        });
        
        console.log('✅', message);
        
      } catch (err) {
        console.error('❌ Error eliminando usuario:', err);
        
        // 📢 Notificación de error en eliminación
        let errorMessage = `Error al eliminar usuario: ${err.message}`;
        
        if (err.code === 'permission-denied') {
          errorMessage = 'No tienes permisos para eliminar usuarios';
          setError('No tienes permisos para eliminar usuarios');
        } else {
          setError(`Error al eliminar usuario: ${err.message}`);
        }
        
        addNotification({
          type: 'error',
          title: 'Error al Eliminar Usuario',
          message: errorMessage,
          icon: 'error'
        });
        
      } finally {
        setLoading(false);
      }
    }
  };

  const handleToggleActiveStatus = async (user) => {
    try {
      const newStatus = !user.isActive;
      
      await updateDoc(doc(db, 'users', user.id), {
        isActive: newStatus,
        updatedAt: new Date()
      });
      
      await loadUsers();
      
      // 📢 Notificación de cambio de estado
      addNotification({
        type: newStatus ? 'success' : 'warning',
        title: `Usuario ${newStatus ? 'Activado' : 'Desactivado'}`,
        message: `Usuario "${user.displayName || user.email}" ${newStatus ? 'activado' : 'desactivado'} correctamente`,
        icon: newStatus ? 'check_circle' : 'cancel'
      });
      
    } catch (err) {
      console.error('Error updating user status:', err);
      setError('Error al actualizar estado del usuario');
      
      // 📢 Notificación de error
      addNotification({
        type: 'error',
        title: 'Error al Cambiar Estado',
        message: 'No se pudo actualizar el estado del usuario',
        icon: 'error'
      });
    }
  };

  const getRoleChipColor = (role) => {
    switch (role) {
      case 'ADMIN': return 'error';
      case 'MANAGER': return 'warning';
      case 'EMPLOYEE': return 'primary';
      case 'VIEWER': return 'default';
      default: return 'default';
    }
  };

  const getPermissionGroups = () => {
    const groups = {
      'Comprobantes': [
        'view_receipts',
        'download_receipts',
        'upload_receipts',
        'delete_receipts'
      ],
      'Compromisos': [
        'view_commitments',
        'create_commitments',
        'edit_commitments',
        'delete_commitments'
      ],
      'Reportes': [
        'generate_reports',
        'export_data'
      ],
      'Administración': [
        'manage_users',
        'view_users',
        'admin_access',
        'system_config'
      ]
    };
    return groups;
  };

  if (loading && users.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: { xs: 2, sm: 3, md: 4 },
      maxWidth: '1400px',
      mx: 'auto'
    }}>
      {/* HEADER GRADIENT SOBRIO SIMPLIFICADO */}
      <Paper 
        sx={{ 
          background: theme.palette.mode === 'dark' 
            ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
            : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          borderRadius: 1,
          overflow: 'hidden',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 20px rgba(0, 0, 0, 0.3)'
            : '0 4px 20px rgba(0, 0, 0, 0.08)',
          mb: 6
        }}
      >
        <Box sx={{ 
          p: 3, 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          <Box>
            <Typography variant="overline" sx={{ 
              fontWeight: 600, 
              fontSize: '0.7rem', 
              color: 'rgba(255, 255, 255, 0.8)',
              letterSpacing: 1.2
            }}>
              ADMINISTRACIÓN • GESTIÓN DE USUARIOS
            </Typography>
            <Typography variant="h4" sx={{ 
              fontWeight: 700, 
              mt: 0.5, 
              mb: 0.5,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              👥 Gestión de Usuarios
            </Typography>
            <Typography variant="body1" sx={{ 
              color: 'rgba(255, 255, 255, 0.9)'
            }}>
              Administra usuarios, roles y permisos del sistema
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => handleOpenModal()}
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.15)',
              color: 'white',
              borderRadius: 1,
              fontWeight: 600,
              px: 3,
              py: 1.5,
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.25)',
                transform: 'translateY(-1px)'
              }
            }}
          >
            Nuevo Usuario
          </Button>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Estadísticas sobrias con bordes dinámicos */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 20px rgba(0, 0, 0, 0.2)'
              : '0 4px 20px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 8px 30px rgba(0, 0, 0, 0.3)'
                : '0 8px 30px rgba(0, 0, 0, 0.12)',
              borderColor: alpha(theme.palette.primary.main, 0.8)
            }
          }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Typography variant="overline" sx={{ 
                fontWeight: 600,
                color: theme.palette.primary.main,
                letterSpacing: 1.2
              }}>
                TOTAL USUARIOS
              </Typography>
              <Typography variant="h3" sx={{ 
                fontWeight: 700,
                color: theme.palette.text.primary,
                mt: 1
              }}>
                {users.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.success.main, 0.6)}`,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 20px rgba(0, 0, 0, 0.2)'
              : '0 4px 20px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 8px 30px rgba(0, 0, 0, 0.3)'
                : '0 8px 30px rgba(0, 0, 0, 0.12)',
              borderColor: alpha(theme.palette.success.main, 0.8)
            }
          }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Typography variant="overline" sx={{ 
                fontWeight: 600,
                color: theme.palette.success.main,
                letterSpacing: 1.2
              }}>
                USUARIOS ACTIVOS
              </Typography>
              <Typography variant="h3" sx={{ 
                fontWeight: 700,
                color: theme.palette.text.primary,
                mt: 1
              }}>
                {users.filter(u => u.isActive !== false).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.error.main, 0.6)}`,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 20px rgba(0, 0, 0, 0.2)'
              : '0 4px 20px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 8px 30px rgba(0, 0, 0, 0.3)'
                : '0 8px 30px rgba(0, 0, 0, 0.12)',
              borderColor: alpha(theme.palette.error.main, 0.8)
            }
          }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Typography variant="overline" sx={{ 
                fontWeight: 600,
                color: theme.palette.error.main,
                letterSpacing: 1.2
              }}>
                ADMINISTRADORES
              </Typography>
              <Typography variant="h3" sx={{ 
                fontWeight: 700,
                color: theme.palette.text.primary,
                mt: 1
              }}>
                {users.filter(u => u.role === 'ADMIN').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.secondary.main, 0.6)}`,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 20px rgba(0, 0, 0, 0.2)'
              : '0 4px 20px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 8px 30px rgba(0, 0, 0, 0.3)'
                : '0 8px 30px rgba(0, 0, 0, 0.12)',
              borderColor: alpha(theme.palette.secondary.main, 0.8)
            }
          }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Typography variant="overline" sx={{ 
                fontWeight: 600,
                color: theme.palette.secondary.main,
                letterSpacing: 1.2
              }}>
                GERENTES
              </Typography>
              <Typography variant="h3" sx={{ 
                fontWeight: 700,
                color: theme.palette.text.primary,
                mt: 1
              }}>
                {users.filter(u => u.role === 'MANAGER').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabla de usuarios con diseño sobrio */}
      <Card sx={{ 
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
        boxShadow: theme.palette.mode === 'dark'
          ? '0 4px 20px rgba(0, 0, 0, 0.2)'
          : '0 4px 20px rgba(0, 0, 0, 0.08)',
        overflow: 'hidden'
      }}>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell>Departamento</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Último acceso</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: getRoleChipColor(user.role) === 'error' ? '#f44336' : '#2196f3' }}>
                          {user.displayName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {user.displayName || 'Sin nombre'}
                            {user.status === 'PENDING_AUTH' && (
                              <Chip 
                                label="⏳ Pendiente Auth" 
                                size="small" 
                                color="warning" 
                                sx={{ ml: 1, fontSize: '0.75rem' }}
                              />
                            )}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={USER_ROLES[user.role]?.name || user.role}
                        color={getRoleChipColor(user.role)}
                        size="small"
                        icon={user.role === 'ADMIN' ? <AdminIcon /> : <SecurityIcon />}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {user.department || 'No asignado'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Switch
                          checked={user.isActive !== false}
                          onChange={() => handleToggleActiveStatus(user)}
                          size="small"
                        />
                        <Typography variant="body2" color={user.isActive !== false ? 'success.main' : 'error.main'}>
                          {user.isActive !== false ? 'Activo' : 'Inactivo'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {user.lastLogin ? new Date(user.lastLogin.toDate()).toLocaleDateString() : 'Nunca'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {user.status === 'PENDING_AUTH' && (
                          <Tooltip title="Completar sincronización con Authentication">
                            <IconButton
                              size="small"
                              onClick={() => syncUserWithAuth(user)}
                              sx={{ color: 'success.main' }}
                            >
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Editar usuario">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenModal(user)}
                            sx={{ color: 'primary.main' }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar usuario">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteUser(user.id)}
                              sx={{ color: 'error.main' }}
                              disabled={user.role === 'ADMIN' && users.filter(u => u.role === 'ADMIN').length === 1}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Modal de crear/editar usuario */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(250,250,250,0.95) 100%)',
            backdropFilter: 'blur(20px)',
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box>
            {editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
            {editingUser && (
              <Box component="div" sx={{ 
                display: 'block', 
                opacity: 0.8, 
                mt: 0.5,
                fontSize: '0.75rem',
                lineHeight: 1.66
              }}>
                {formData.email}
              </Box>
            )}
          </Box>
          {editingUser && hasUnsavedChanges && (
            <Chip 
              label="● Cambios sin guardar" 
              size="small" 
              sx={{ 
                backgroundColor: 'rgba(255,193,7,0.9)', 
                color: 'rgba(0,0,0,0.87)',
                fontWeight: 600,
                animation: 'pulse 2s infinite'
              }} 
            />
          )}
        </DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Información básica */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData({ email: e.target.value })}
                disabled={!!editingUser}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre completo"
                value={formData.displayName}
                onChange={(e) => updateFormData({ displayName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Teléfono"
                value={formData.phone}
                onChange={(e) => updateFormData({ phone: e.target.value })}
              />
            </Grid>
            
            {/* Campo de contraseña temporal - Solo para usuarios nuevos */}
            {!editingUser && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Contraseña Temporal"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.temporalPassword}
                  onChange={(e) => updateFormData({ temporalPassword: e.target.value })}
                  helperText="Se enviará email para cambiar contraseña"
                  InputProps={{
                    endAdornment: (
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    )
                  }}
                />
              </Grid>
            )}
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Departamento"
                value={formData.department}
                onChange={(e) => updateFormData({ department: e.target.value })}
              />
            </Grid>

            {/* Rol */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Rol</InputLabel>
                <Select
                  value={formData.role}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  label="Rol"
                >
                  {Object.entries(USER_ROLES).map(([key, role]) => (
                    <MenuItem key={key} value={key}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {key === 'ADMIN' ? <AdminIcon /> : <SecurityIcon />}
                        {role.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Estado activo */}
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => updateFormData({ isActive: e.target.checked })}
                  />
                }
                label="Usuario activo"
              />
            </Grid>

            {/* Notas */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notas adicionales"
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) => updateFormData({ notes: e.target.value })}
              />
            </Grid>

            {/* Permisos personalizados */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Permisos Específicos
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Los permisos se asignan automáticamente según el rol, pero puedes personalizarlos:
              </Typography>
              
              {Object.entries(getPermissionGroups()).map(([groupName, permissions]) => (
                <Box key={groupName} sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    {groupName}
                  </Typography>
                  <Grid container spacing={1}>
                    {permissions.map((permission) => (
                      <Grid item xs={12} sm={6} key={permission}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={formData.permissions.includes(permission)}
                              onChange={() => handlePermissionToggle(permission)}
                              size="small"
                            />
                          }
                          label={
                            <Typography variant="body2">
                              {permission.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase())}
                            </Typography>
                          }
                        />
                      </Grid>
                    ))}
                  </Grid>
                  <Divider sx={{ mt: 2 }} />
                </Box>
              ))}
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleCloseModal}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveUser}
            disabled={
              !formData.email || 
              !formData.displayName || 
              (editingUser && !hasUnsavedChanges) || // Para usuarios existentes, solo habilitar si hay cambios
              modalLoading // Deshabilitar durante el guardado
            }
            sx={{
              background: hasUnsavedChanges || !editingUser ? 
                'linear-gradient(135deg, #28a745 0%, #20c997 100%)' : 
                'rgba(0, 0, 0, 0.12)',
              '&:hover': {
                background: hasUnsavedChanges || !editingUser ? 
                  'linear-gradient(135deg, #218838 0%, #1ea085 100%)' :
                  'rgba(0, 0, 0, 0.12)',
              },
              '&:disabled': {
                background: 'rgba(0, 0, 0, 0.12)',
                color: 'rgba(0, 0, 0, 0.26)'
              }
            }}
          >
            {modalLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              `${editingUser ? 'Actualizar' : 'Crear'} Usuario`
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagementPage;
