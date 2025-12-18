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
  alpha,
  Tabs,
  Tab,
  Badge,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
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
  VisibilityOff as VisibilityOffIcon,
  Notifications as NotificationsIcon,
  Dashboard,
  AccountBalance,
  Receipt,
  TrendingUp,
  Assessment,
  AttachMoney,
  AccessTime,
  CloudUpload as CloudUploadIcon,
  AttachFile as AttachFileIcon,
  InsertDriveFile as FileIcon,
  Close as CloseIcon,
  ContentCopy as ContentCopyIcon
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
import { initializeApp, deleteApp } from 'firebase/app';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, auth, storage } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import NotificationSettingsModal from '../components/notifications/NotificationSettingsModal';
import { useEmailNotifications } from '../hooks/useEmailNotifications';
import useActivityLogs from '../hooks/useActivityLogs';

const UserManagementPage = () => {
  const theme = useTheme();
  const { currentUser, userProfile } = useAuth();
  const { addNotification } = useNotifications();
  const { logActivity } = useActivityLogs();
  
  // 📧 Hook de notificaciones por email
  const { 
    sendUserCreatedNotification, 
    sendUserUpdatedNotification, 
    sendRoleChangedNotification,
    sendCriticalPermissionChangeNotification,
    sending: sendingEmail 
  } = useEmailNotifications();
  
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
  const [activeTab, setActiveTab] = useState(0); // 0: Info, 1: Permisos, 2: Resumen
  
  // Estados del modal de notificaciones
  const [openNotificationsModal, setOpenNotificationsModal] = useState(false);
  const [selectedUserForNotifications, setSelectedUserForNotifications] = useState(null);

  // Estados para empresas y archivos
  const [companies, setCompanies] = useState([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  // 🔐 Estado para mostrar credenciales tras creación
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);
  
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
    temporalPassword: '', // Nueva contraseña temporal
    position: '', // Cargo/Posición
    photoURL: '' // URL de foto de perfil
  });

  // Estado para detectar cambios en el formulario
  const [originalFormData, setOriginalFormData] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Cargar usuarios al montar el componente
  useEffect(() => {
    loadUsers();
    loadCompanies();
  }, []);

  // Cargar empresas desde Firestore
  const loadCompanies = async () => {
    try {
      const companiesCollection = collection(db, 'companies');
      const snapshot = await getDocs(companiesCollection);
      const companiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || doc.data().businessName
      }));
      setCompanies(companiesData);
    } catch (err) {
      console.error('Error loading companies:', err);
    }
  };

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
        
        // Filtrar solo permisos del nuevo sistema
        const newSystemPermissions = ['dashboard', 'compromisos', 'compromisos.ver_todos', 'compromisos.agregar_nuevo', 'compromisos.proximos_vencer', 'pagos', 'pagos.historial', 'pagos.nuevo_pago', 'ingresos', 'ingresos.registrar', 'ingresos.historial', 'ingresos.cuentas', 'gestion_empresarial', 'gestion_empresarial.empresas', 'gestion_empresarial.salas', 'gestion_empresarial.clientes', 'liquidaciones', 'liquidaciones.liquidaciones', 'liquidaciones.historico', 'facturacion', 'facturacion.liquidaciones_por_sala', 'facturacion.cuentas_cobro', 'reportes', 'reportes.resumen', 'reportes.por_empresa', 'reportes.por_periodo', 'reportes.por_concepto', 'usuarios', 'empleados', 'asistencias', 'auditoria', 'storage'];
        
        // Convertir permissions de objeto a array si es necesario
        let userPermissions = user.permissions || [];
        if (typeof userPermissions === 'object' && !Array.isArray(userPermissions)) {
          // Es un objeto, convertir a array tomando las claves con valor true
          userPermissions = Object.keys(userPermissions).filter(key => userPermissions[key] === true);
        }
        
        const filteredPermissions = userPermissions.filter(permission => 
          newSystemPermissions.includes(permission)
        );
        
        const userData = {
          email: user.email || '',
          displayName: user.displayName || user.name || '',
          phone: user.phone || '',
          role: user.role || 'USER',
          permissions: filteredPermissions,
          companies: user.companies || [],
          isActive: user.isActive !== false,
          department: user.department || '',
          notes: user.notes || '',
          position: user.position || '',
          photoURL: user.photoURL || ''
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
          role: 'USER',
          permissions: [
            'dashboard'
          ], // Permisos básicos del nuevo sistema
          companies: [],
          isActive: true,
          department: '',
          notes: '',
          temporalPassword: 'DRGroup2025!',
          position: '',
          photoURL: ''
        };
        
        console.log('📋 Datos del nuevo usuario:', newUserData);
        setFormData(newUserData);
        setOriginalFormData(JSON.parse(JSON.stringify(newUserData)));
        setHasUnsavedChanges(false);
      }
      
      console.log('✅ Abriendo modal...');
      setOpenModal(true);
      setActiveTab(0); // Resetear a primera pestaña
      
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
    setActiveTab(0); // Resetear tabs
    setHasUnsavedChanges(false);
  };

  // Funciones para manejar el modal de notificaciones
  const handleOpenNotificationsModal = (user) => {
    console.log('🔔 Abriendo modal de notificaciones para:', user.email);
    setSelectedUserForNotifications(user);
    setOpenNotificationsModal(true);
  };

  const handleCloseNotificationsModal = () => {
    setOpenNotificationsModal(false);
    setSelectedUserForNotifications(null);
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
    
    // Permisos del nuevo sistema simplificado por rol
    if (newRole === 'ADMIN') {
      newPermissions = [
        'dashboard',
        'compromisos',
        'compromisos.ver_todos',
        'compromisos.agregar_nuevo',
        'compromisos.proximos_vencer',
        'pagos',
        'pagos.historial',
        'pagos.nuevo_pago',
        'ingresos',
        'ingresos.registrar',
        'ingresos.historial',
        'ingresos.cuentas',
        'gestion_empresarial',
        'gestion_empresarial.empresas',
        'gestion_empresarial.salas',
        'gestion_empresarial.clientes',
        'liquidaciones',
        'liquidaciones.liquidaciones',
        'liquidaciones.historico',
        'facturacion',
        'facturacion.liquidaciones_por_sala',
        'facturacion.cuentas_cobro',
        'reportes',
        'reportes.resumen',
        'reportes.por_empresa',
        'reportes.por_periodo',
        'reportes.por_concepto',
        'usuarios',
        'empleados',
        'asistencias',
        'auditoria',
        'storage'
      ];
    } else {
      newPermissions = [
        'dashboard'
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

  // � Subir foto de perfil
  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      addNotification({
        type: 'error',
        title: 'Archivo Inválido',
        message: 'Solo se permiten imágenes'
      });
      return;
    }

    // Validar tamaño (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      addNotification({
        type: 'error',
        title: 'Archivo muy grande',
        message: 'La imagen no debe superar 2MB'
      });
      return;
    }

    try {
      setUploadingPhoto(true);
      const userId = editingUser?.id || formData.email.replace(/[^a-zA-Z0-9]/g, '_');
      const photoRef = ref(storage, `users/${userId}/profile_photo.jpg`);
      
      await uploadBytes(photoRef, file);
      const photoURL = await getDownloadURL(photoRef);
      
      updateFormData({ photoURL });
      
      addNotification({
        type: 'success',
        title: 'Foto Subida',
        message: 'Foto de perfil actualizada correctamente'
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      addNotification({
        type: 'error',
        title: 'Error al Subir Foto',
        message: error.message
      });
    } finally {
      setUploadingPhoto(false);
    }
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
      
      // Filtrar permisos para asegurar que solo se guarden los del nuevo sistema
      const newSystemPermissions = ['dashboard', 'compromisos', 'compromisos.ver_todos', 'compromisos.agregar_nuevo', 'compromisos.proximos_vencer', 'pagos', 'pagos.historial', 'pagos.nuevo_pago', 'ingresos', 'ingresos.registrar', 'ingresos.historial', 'ingresos.cuentas', 'gestion_empresarial', 'gestion_empresarial.empresas', 'gestion_empresarial.salas', 'gestion_empresarial.clientes', 'liquidaciones', 'liquidaciones.liquidaciones', 'liquidaciones.historico', 'facturacion', 'facturacion.liquidaciones_por_sala', 'facturacion.cuentas_cobro', 'reportes', 'reportes.resumen', 'reportes.por_empresa', 'reportes.por_periodo', 'reportes.por_concepto', 'usuarios', 'empleados', 'asistencias', 'auditoria', 'storage'];
      const filteredPermissions = formData.permissions.filter(permission => 
        newSystemPermissions.includes(permission)
      );
      
      // Convertir permissions array a objeto para Firestore
      const permissionsObject = {};
      filteredPermissions.forEach(permission => {
        permissionsObject[permission] = true;
      });
      
      const userData = {
        email: formData.email.toLowerCase(),
        displayName: formData.displayName,
        phone: formData.phone,
        role: formData.role,
        permissions: permissionsObject,
        companies: formData.companies,
        isActive: formData.isActive,
        department: formData.department,
        notes: formData.notes,
        position: formData.position || '',           // ✅ Cargo/Posición
        photoURL: formData.photoURL || '',           // ✅ URL de foto de perfil
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
          
          // 1. Inicializar app secundaria para no perder sesión del admin
          const firebaseConfig = {
            apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
            authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
            projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
            storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
            appId: import.meta.env.VITE_FIREBASE_APP_ID,
          };
          
          // Usamos un nombre único para la app secundaria
          const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
          const secondaryAuth = getAuth(secondaryApp);

          // 2. Crear usuario en Firebase Authentication (usando app secundaria)
          const userCredential = await createUserWithEmailAndPassword(
            secondaryAuth, 
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
            position: formData.position || (formData.role === 'ADMIN' ? 'Administrador' : 'Usuario'),  // ✅ Usar el cargo del formulario
            photoURL: formData.photoURL || '',           // ✅ URL de foto de perfil
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
          
          // 5. Enviar email de reset (usando auth secundaria)
          try {
            await sendPasswordResetEmail(secondaryAuth, formData.email.toLowerCase());
            console.log('📧 Email de reset enviado para configurar contraseña');
          } catch (emailError) {
            console.warn('⚠️ No se pudo enviar email de reset:', emailError.message);
          }
          
          // 6. Limpiar app secundaria
          await signOut(secondaryAuth);
          deleteApp(secondaryApp).catch(console.error);
          
          // 7. Mostrar resultado exitoso
          console.log('� === USUARIO CREADO COMPLETAMENTE ===');
          console.log(`📧 Email: ${formData.email.toLowerCase()}`);
          console.log(`🔑 Password temporal: ${formData.temporalPassword || 'DRGroup2025!'}`);
          console.log(`🆔 Auth UID: ${userCredential.user.uid}`);
          console.log(`🆔 UID: ${userCredential.user.uid}`);
          console.log('✅ El usuario puede iniciar sesión inmediatamente');
          console.log('==========================================');
          
          // ✅ Guardar credenciales para mostrar en modal
          setCreatedCredentials({
            email: formData.email.toLowerCase(),
            password: formData.temporalPassword || 'DRGroup2025!',
            displayName: formData.displayName
          });
          
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
      
      // Si se creó un usuario nuevo, mostrar modal de credenciales
      if (!editingUser && createdCredentials) {
        setShowCredentialsModal(true);
      } else if (!editingUser) {
        // Fallback por si el estado no se actualizó a tiempo
        setCreatedCredentials({
          email: formData.email.toLowerCase(),
          password: formData.temporalPassword || 'DRGroup2025!',
          displayName: formData.displayName
        });
        setShowCredentialsModal(true);
      }
      
      handleCloseModal();
      setHasUnsavedChanges(false);
      
      // 📢 Agregar notificación de éxito
      if (editingUser) {
        // ✅ USUARIO ACTUALIZADO
        addNotification({
          type: 'success',
          title: 'Usuario Actualizado',
          message: `Usuario "${formData.displayName || formData.email}" actualizado correctamente`,
          icon: 'edit'
        });
        
        // 📧 ENVIAR EMAIL DE ACTUALIZACIÓN
        try {
          console.log('📧 Enviando email de actualización a:', formData.email);
          
          // Determinar qué campos cambiaron
          const updatedFields = [];
          if (editingUser.displayName !== formData.displayName) updatedFields.push('Nombre');
          if (editingUser.phone !== formData.phone) updatedFields.push('Teléfono');
          if (editingUser.department !== formData.department) updatedFields.push('Departamento');
          if (JSON.stringify(editingUser.companies) !== JSON.stringify(formData.companies)) updatedFields.push('Empresas asignadas');
          if (JSON.stringify(editingUser.permissions) !== JSON.stringify(formData.permissions)) updatedFields.push('Permisos');
          
          // Si cambió el rol, enviar notificación específica de cambio de rol
          if (editingUser.role !== formData.role) {
            console.log('🔐 Cambio de rol detectado, enviando notificación específica...');
            
            await sendRoleChangedNotification(formData.email, {
              displayName: formData.displayName,
              email: formData.email,
              oldRole: editingUser.role,
              newRole: formData.role,
              changedBy: userProfile?.name || userProfile?.displayName || currentUser.email
            });
            
            // Si el nuevo rol es Admin o Super Admin, enviar alerta de seguridad crítica
            if (formData.role === 'ADMIN' || formData.role === 'admin' || formData.role === 'SUPER_ADMIN' || formData.role === 'super_admin') {
              console.log('🛡️ Cambio crítico de permisos detectado, notificando a administradores...');
              
              await sendCriticalPermissionChangeNotification(formData.email, {
                targetUserName: formData.displayName,
                targetUserId: editingUser.id,
                oldRole: editingUser.role,
                newRole: formData.role,
                changedById: currentUser.uid,
                changedByName: userProfile?.name || userProfile?.displayName || currentUser.email,
                timestamp: new Date().toLocaleString('es-CO')
              });
            }
            
            console.log('✅ Notificación de cambio de rol enviada');
          } else {
            // Solo actualización de información sin cambio de rol
            await sendUserUpdatedNotification(formData.email, {
              displayName: formData.displayName,
              email: formData.email,
              updatedFields: updatedFields.join(', ') || 'Información general',
              updatedBy: userProfile?.name || userProfile?.displayName || currentUser.email
            });
            
            console.log('✅ Email de actualización enviado');
          }
          
          // Registrar en Activity Logs
          await logActivity(
            'update_user',
            'user',
            editingUser.id,
            {
              userName: formData.displayName,
              userEmail: formData.email,
              updatedFields: updatedFields.join(', ') || 'Información general',
              roleChanged: editingUser.role !== formData.role,
              oldRole: editingUser.role,
              newRole: formData.role
            },
            currentUser.uid,
            userProfile?.name || userProfile?.displayName || currentUser.email,
            currentUser.email
          );
          
        } catch (emailError) {
          console.error('⚠️ Error enviando email de actualización:', emailError);
          // No forzar el error, el usuario ya fue actualizado
        }
        
      } else {
        // ✅ USUARIO NUEVO CREADO
        addNotification({
          type: 'success',
          title: '🎉 Usuario Creado Automáticamente',
          message: `Usuario "${formData.displayName || formData.email}" creado completamente en Firebase Auth + Firestore. ¡Listo para usar!`,
          icon: 'person_add'
        });
        console.log('✅ Proceso de creación automática completado exitosamente');
        
        // 📧 ENVIAR EMAIL DE BIENVENIDA
        try {
          console.log('📧 Enviando email de bienvenida a:', formData.email);
          
          await sendUserCreatedNotification(formData.email, {
            displayName: formData.displayName,
            email: formData.email,
            role: formData.role,
            createdBy: userProfile?.name || userProfile?.displayName || currentUser.email
          });
          
          console.log('✅ Email de bienvenida enviado');
          
          // Registrar en Activity Logs
          await logActivity(
            'create_user',
            'user',
            formData.email, // Usamos email como ID temporal
            {
              userName: formData.displayName,
              userEmail: formData.email,
              role: formData.role,
              companies: formData.companies?.length || 0,
              permissions: formData.permissions?.length || 0,
              emailSent: true
            },
            currentUser.uid,
            userProfile?.name || userProfile?.displayName || currentUser.email,
            currentUser.email
          );
          
        } catch (emailError) {
          console.error('⚠️ Error enviando email de bienvenida:', emailError);
          addNotification({
            type: 'warning',
            title: 'Usuario Creado (Email no enviado)',
            message: 'El usuario fue creado pero no se pudo enviar el email de bienvenida.',
            icon: 'warning'
          });
        }
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
              Gestión de Usuarios
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
                        label={user.role || 'Usuario'}
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
                        <Tooltip title="Configurar notificaciones">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenNotificationsModal(user)}
                            sx={{ color: 'warning.main' }}
                          >
                            <NotificationsIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
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
        fullWidth
        maxWidth="lg"
        PaperProps={{
          sx: {
            borderRadius: 2,
            background: theme.palette.background.paper,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 20px rgba(0, 0, 0, 0.3)'
              : '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
            maxWidth: '1000px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 2,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          background: theme.palette.mode === 'dark' 
            ? theme.palette.grey[900]
            : theme.palette.grey[50],
          borderBottom: `1px solid ${theme.palette.divider}`,
          color: 'text.primary'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar 
              src={formData.photoURL} 
              sx={{ 
                bgcolor: 'primary.main', 
                color: 'primary.contrastText',
                width: 48,
                height: 48
              }}
            >
              {!formData.photoURL && (editingUser ? <EditIcon /> : <PersonAddIcon />)}
            </Avatar>
            <Box>
              <Box component="span" sx={{ 
                fontWeight: 700,
                fontSize: '1.25rem',
                mb: 0,
                color: 'text.primary',
                display: 'block'
              }}>
                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
              </Box>
              {editingUser && (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {formData.email}
                </Typography>
              )}
            </Box>
          </Box>
          {editingUser && hasUnsavedChanges && (
            <Chip 
              label="● Cambios sin guardar" 
              size="small" 
              color="warning"
              variant="outlined"
            />
          )}
        </DialogTitle>
        
        <DialogContent sx={{ p: 0 }}>
          {/* TABS NAVIGATION */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', background: alpha(theme.palette.primary.main, 0.02) }}>
            <Tabs 
              value={activeTab} 
              onChange={(e, newValue) => setActiveTab(newValue)}
              variant="fullWidth"
              sx={{
                '& .MuiTab-root': {
                  minHeight: 64,
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  textTransform: 'none',
                  transition: 'all 0.2s ease',
                  '&.Mui-selected': {
                    fontWeight: 600  // Sobrio: máximo 600
                  }
                }
              }}
            >
              <Tab 
                icon={<PersonAddIcon />} 
                iconPosition="start"
                label="Información General" 
              />
              <Tab 
                icon={
                  <Badge 
                    badgeContent={formData.permissions.length} 
                    color="primary"
                    sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem', height: 18, minWidth: 18 } }}
                  >
                    <SecurityIcon />
                  </Badge>
                } 
                iconPosition="start"
                label="Permisos de Acceso" 
              />
              <Tab 
                icon={<CheckCircleIcon />} 
                iconPosition="start"
                label="Resumen" 
              />
            </Tabs>
          </Box>

          {/* TAB PANELS */}
          <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 64px)' }}>
            
            {/* TAB 1: INFORMACIÓN GENERAL */}
            {activeTab === 0 && (
              <Box sx={{ p: 3 }}>
              
              <Grid container spacing={2}>
                {/* Email */}
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData({ email: e.target.value })}
                    disabled={!!editingUser}
                    required
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1,  // Sobrio: borderRadius consistente
                        backgroundColor: !!editingUser 
                          ? 'transparent'
                          : alpha(theme.palette.primary.main, 0.05),
                        transition: 'all 0.2s ease'
                      }
                    }}
                  />
                </Grid>

                {/* Nombre */}
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Nombre completo"
                    value={formData.displayName}
                    onChange={(e) => updateFormData({ displayName: e.target.value })}
                    required
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1,
                        backgroundColor: alpha(theme.palette.primary.main, 0.05),
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.08)
                        }
                      }
                    }}
                  />
                </Grid>

                {/* Teléfono */}
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    label="Teléfono"
                    value={formData.phone}
                    onChange={(e) => updateFormData({ phone: e.target.value })}
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1,
                        backgroundColor: alpha(theme.palette.primary.main, 0.05),
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.08)
                        }
                      }
                    }}
                  />
                </Grid>

                {/* Departamento */}
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    label="Departamento"
                    value={formData.department}
                    onChange={(e) => updateFormData({ department: e.target.value })}
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1,
                        backgroundColor: alpha(theme.palette.primary.main, 0.05),
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.08)
                        }
                      }
                    }}
                  />
                </Grid>

                {/* Rol */}
                <Grid item xs={12} md={2}>
                  <FormControl 
                    fullWidth 
                    required 
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1,
                        backgroundColor: alpha(theme.palette.secondary.main, 0.05),
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.secondary.main, 0.08)
                        }
                      }
                    }}
                  >
                    <InputLabel>Rol</InputLabel>
                    <Select
                      value={formData.role}
                      onChange={(e) => handleRoleChange(e.target.value)}
                      label="Rol"
                    >
                      <MenuItem value="ADMIN">Administrador</MenuItem>
                      <MenuItem value="USER">Usuario</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* FILA 2: Información Adicional */}
                
                {/* Cargo/Posición */}
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Cargo/Posición"
                    value={formData.position}
                    onChange={(e) => updateFormData({ position: e.target.value })}
                    size="small"
                    placeholder="Ej: Contador Senior"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1,
                        backgroundColor: alpha(theme.palette.info.main, 0.05),
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.info.main, 0.08)
                        }
                      }
                    }}
                  />
                </Grid>

                {/* Empresas Asignadas */}
                <Grid item xs={12} md={8}>
                  <FormControl 
                    fullWidth 
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1,
                        backgroundColor: alpha(theme.palette.secondary.main, 0.05),
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.secondary.main, 0.08)
                        }
                      }
                    }}
                  >
                    <InputLabel>Empresas Asignadas</InputLabel>
                    <Select
                      multiple
                      value={formData.companies}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Si selecciona "Todas las empresas"
                        if (value.includes('__all__')) {
                          if (formData.companies.length === companies.length) {
                            // Si ya estaban todas, deseleccionar todas
                            updateFormData({ companies: [] });
                          } else {
                            // Seleccionar todas
                            updateFormData({ companies: companies.map(c => c.name) });
                          }
                        } else {
                          updateFormData({ companies: value });
                        }
                      }}
                      label="Empresas Asignadas"
                      renderValue={(selected) => {
                        if (selected.length === 0) {
                          return <em style={{ color: '#999' }}>Ninguna empresa seleccionada</em>;
                        }
                        if (selected.length === companies.length) {
                          return <Chip label="Todas las empresas" size="small" color="secondary" />;
                        }
                        return (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                              <Chip key={value} label={value} size="small" />
                            ))}
                          </Box>
                        );
                      }}
                    >
                      {/* Opción "Seleccionar todas" */}
                      <MenuItem value="__all__">
                        <Checkbox 
                          checked={formData.companies.length === companies.length && companies.length > 0}
                          indeterminate={formData.companies.length > 0 && formData.companies.length < companies.length}
                        />
                        <Typography sx={{ fontWeight: 600 }}>
                          Todas las empresas ({companies.length})
                        </Typography>
                      </MenuItem>
                      <Divider />
                      
                      {/* Lista de empresas individuales */}
                      {companies.map((company) => (
                        <MenuItem key={company.id} value={company.name}>
                          <Checkbox checked={formData.companies.includes(company.name)} />
                          {company.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>


                {/* FILA 3: Notas y Estado */}

                {/* Notas */}
                <Grid item xs={12} md={10}>
                  <TextField
                    fullWidth
                    label="Notas adicionales"
                    multiline
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => updateFormData({ notes: e.target.value })}
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1,
                        backgroundColor: alpha(theme.palette.warning.main, 0.05),
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.warning.main, 0.08)
                        }
                      }
                    }}
                  />
                </Grid>

                {/* Estado activo */}
                <Grid item xs={12} md={2}>
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
              </Grid>
              </Box>
            )}

            {/* TAB 2: PERMISOS DE ACCESO */}
            {activeTab === 1 && (
              <Box sx={{ p: 3, overflowY: 'auto', flexGrow: 1 }}>
              
              <Grid container spacing={2}>
                {(() => {
                  // Array completo de permisos
                        const allPermissions = [
                      { key: 'dashboard', label: 'Dashboard', icon: <Dashboard />, color: theme.palette.primary.main },
                      { 
                        key: 'compromisos', 
                        label: 'Compromisos', 
                        icon: <AccountBalance />, 
                        color: theme.palette.secondary.main,
                        subPermissions: [
                          { key: 'compromisos.ver_todos', label: 'Ver Todos' },
                          { key: 'compromisos.agregar_nuevo', label: 'Agregar Nuevo' },
                          { key: 'compromisos.proximos_vencer', label: 'Próximos a Vencer' }
                        ]
                      },
                      { 
                        key: 'pagos', 
                        label: 'Pagos', 
                        icon: <Receipt />, 
                        color: theme.palette.primary.main,
                        subPermissions: [
                          { key: 'pagos.historial', label: 'Historial' },
                          { key: 'pagos.nuevo_pago', label: 'Nuevo Pago' }
                        ]
                      },
                      { 
                        key: 'ingresos', 
                        label: 'Ingresos', 
                        icon: <TrendingUp />, 
                        color: '#4caf50',
                        subPermissions: [
                          { key: 'ingresos.registrar', label: 'Registrar Ingreso' },
                          { key: 'ingresos.historial', label: 'Historial' },
                          { key: 'ingresos.cuentas', label: 'Cuentas Bancarias' }
                        ]
                      },
                      { 
                        key: 'gestion_empresarial', 
                        label: 'Gestión Empresarial', 
                        icon: <BusinessIcon />, 
                        color: theme.palette.secondary.main,
                        subPermissions: [
                          { key: 'gestion_empresarial.empresas', label: 'Empresas' },
                          { key: 'gestion_empresarial.salas', label: 'Salas' },
                          { key: 'gestion_empresarial.clientes', label: 'Clientes' }
                        ]
                      },
                      { 
                        key: 'liquidaciones', 
                        label: 'Liquidaciones', 
                        icon: <Receipt />, 
                        color: '#ff9800',
                        subPermissions: [
                          { key: 'liquidaciones.liquidaciones', label: 'Liquidaciones' },
                          { key: 'liquidaciones.historico', label: 'Histórico de Liquidaciones' }
                        ]
                      },
                      { 
                        key: 'facturacion', 
                        label: 'Facturación', 
                        icon: <AttachMoney />, 
                        color: '#2196f3',
                        subPermissions: [
                          { key: 'facturacion.liquidaciones_por_sala', label: 'Liquidaciones por Sala' },
                          { key: 'facturacion.cuentas_cobro', label: 'Cuentas de Cobro' }
                        ]
                      },
                      { 
                        key: 'reportes', 
                        label: 'Reportes', 
                        icon: <Assessment />, 
                        color: theme.palette.primary.main,
                        subPermissions: [
                          { key: 'reportes.resumen', label: 'Resumen General' },
                          { key: 'reportes.por_empresa', label: 'Por Empresa' },
                          { key: 'reportes.por_periodo', label: 'Por Período' },
                          { key: 'reportes.por_concepto', label: 'Por Concepto' }
                        ]
                      },
                      { key: 'usuarios', label: 'Usuarios', icon: <PersonAddIcon />, color: '#ff9800' },
                      { key: 'empleados', label: 'Empleados', icon: <PersonIcon />, color: '#4caf50' },
                      { key: 'asistencias', label: 'Asistencias', icon: <AccessTime />, color: '#ff9800' },
                      { key: 'auditoria', label: 'Auditoría del Sistema', icon: <SecurityIcon />, color: '#9c27b0' },
                      { key: 'storage', label: 'Limpieza de Storage', icon: <DeleteIcon />, color: '#f44336' }
                      ];
                      
                      return allPermissions;
                })().map((permission) => (
                  <Grid item xs={12} sm={6} md={4} key={permission.key}>
                        <Card sx={{
                          border: formData.permissions.includes(permission.key) 
                            ? `2px solid ${permission.color}` 
                            : `1px solid ${theme.palette.divider}`,
                          background: formData.permissions.includes(permission.key)
                            ? alpha(permission.color, 0.05)
                            : theme.palette.background.paper,
                          cursor: permission.subPermissions ? 'default' : 'pointer',
                          transition: 'all 0.2s ease',
                          width: '100%',
                          '&:hover': {
                            boxShadow: `0 2px 8px ${alpha(permission.color, 0.15)}`
                          }
                        }}
                        onClick={!permission.subPermissions ? () => {
                          const newPermissions = formData.permissions.includes(permission.key)
                            ? formData.permissions.filter(p => p !== permission.key)
                            : [...formData.permissions, permission.key];
                          updateFormData({ permissions: newPermissions });
                        } : undefined}
                        >
                          <CardContent sx={{ 
                            p: 1.5, 
                            '&:last-child': { pb: 1.5 }
                          }}>
                            {/* Permiso Principal */}
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between',
                              cursor: permission.subPermissions ? 'pointer' : 'default'
                            }}
                            onClick={permission.subPermissions ? (e) => {
                              e.stopPropagation();
                              const hasParent = formData.permissions.includes(permission.key);
                              let newPermissions;
                              if (hasParent) {
                                // Remover permiso padre y todos los hijos
                                newPermissions = formData.permissions.filter(p => 
                                  p !== permission.key && !p.startsWith(`${permission.key}.`)
                                );
                              } else {
                                // Agregar permiso padre (da acceso a todo)
                                newPermissions = [...formData.permissions.filter(p => !p.startsWith(`${permission.key}.`)), permission.key];
                              }
                              updateFormData({ permissions: newPermissions });
                            } : undefined}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minHeight: '40px' }}>
                                <Box sx={{ 
                                  color: formData.permissions.includes(permission.key) 
                                    ? permission.color 
                                    : 'text.secondary',
                                  transition: 'color 0.2s ease',
                                  flexShrink: 0
                                }}>
                                  {permission.icon}
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1, minWidth: 0 }}>
                                  <Typography variant="body2" sx={{ 
                                    fontWeight: formData.permissions.includes(permission.key) ? 600 : 400,
                                    color: formData.permissions.includes(permission.key) 
                                      ? 'text.primary' 
                                      : 'text.secondary',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {permission.label}
                                  </Typography>
                                  {permission.subPermissions && (() => {
                                    const activeCount = permission.subPermissions.filter(sp =>
                                      formData.permissions.includes(sp.key)
                                    ).length;
                                    const totalCount = permission.subPermissions.length;
                                    const allActive = formData.permissions.includes(permission.key);
                                    
                                    return (
                                      <Chip 
                                        label={allActive ? `${totalCount} de ${totalCount}` : `${activeCount} de ${totalCount}`}
                                        size="small"
                                        icon={allActive || activeCount === totalCount ? <CheckCircleIcon sx={{ fontSize: 12 }} /> : undefined}
                                        sx={{ 
                                          height: 18,
                                          fontSize: '0.65rem',
                                          fontWeight: 600,
                                          bgcolor: allActive || activeCount === totalCount 
                                            ? alpha(permission.color, 0.25) 
                                            : activeCount > 0 
                                              ? alpha(permission.color, 0.15)
                                                : alpha(theme.palette.divider, 0.3),
                                            color: allActive || activeCount > 0 ? permission.color : 'text.secondary',
                                            '& .MuiChip-label': {
                                              px: 0.75
                                            },
                                            '& .MuiChip-icon': {
                                              ml: 0.5,
                                              mr: -0.25
                                            }
                                          }}
                                        />
                                    );
                                  })()}
                                </Box>
                              </Box>
                              
                              <Tooltip 
                                title={
                                  <Box>
                                    <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                                      {formData.permissions.includes(permission.key) 
                                        ? `Acceso Completo a ${permission.label}` 
                                        : `Activar ${permission.label}`}
                                    </Typography>
                                    <Typography variant="caption" sx={{ display: 'block', opacity: 0.9, fontSize: '0.7rem' }}>
                                      {formData.permissions.includes(permission.key)
                                        ? `El usuario tiene acceso a TODAS las páginas de ${permission.label}`
                                        : `Al activar, el usuario tendrá acceso completo a ${permission.label}`}
                                    </Typography>
                                    {permission.subPermissions && !formData.permissions.includes(permission.key) && (
                                      <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic', fontSize: '0.65rem' }}>
                                        💡 O activa solo las páginas específicas que necesite
                                      </Typography>
                                    )}
                                  </Box>
                                }
                                arrow
                                placement="top"
                              >
                                <Switch
                                  checked={formData.permissions.includes(permission.key)}
                                  size="small"
                                  onClick={(e) => permission.subPermissions && e.stopPropagation()}
                                  sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': {
                                      color: permission.color,
                                    },
                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                      backgroundColor: permission.color,
                                    },
                                  }}
                                />
                              </Tooltip>
                            </Box>

                            {/* Sub-permisos - SIEMPRE VISIBLES */}
                            {permission.subPermissions && (
                              <Box sx={{ 
                                mt: 2, 
                                pl: 2, 
                                borderLeft: `2px solid ${alpha(permission.color, 0.3)}`,
                                opacity: formData.permissions.includes(permission.key) ? 0.6 : 1,
                                pointerEvents: formData.permissions.includes(permission.key) ? 'none' : 'auto'
                              }}>
                                {formData.permissions.includes(permission.key) ? (
                                  // Cuando el padre está activo - mostrar mensaje
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                                    <CheckCircleIcon sx={{ fontSize: 16, color: permission.color }} />
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                                      Acceso completo a todas las páginas de {permission.label}
                                    </Typography>
                                  </Box>
                                ) : (
                                  // Cuando el padre está inactivo - sub-permisos editables
                                  <>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                                      Seleccionar páginas específicas:
                                    </Typography>
                                    {permission.subPermissions.map((subPerm) => (
                                  <Box 
                                    key={subPerm.key}
                                    sx={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      justifyContent: 'space-between',
                                      py: 0.5,
                                      cursor: 'pointer'
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      let newPermissions;
                                      if (formData.permissions.includes(subPerm.key)) {
                                        // Desactivar sub-permiso
                                        newPermissions = formData.permissions.filter(p => p !== subPerm.key);
                                      } else {
                                        // Activar sub-permiso
                                        newPermissions = [...formData.permissions, subPerm.key];
                                        
                                        // Verificar si todos los sub-permisos están activos
                                        const allSubPermsActive = permission.subPermissions.every(sp => 
                                          sp.key === subPerm.key || newPermissions.includes(sp.key)
                                        );
                                        
                                        // Si todos están activos, cambiar a permiso padre
                                        if (allSubPermsActive) {
                                          newPermissions = newPermissions.filter(p => !p.startsWith(`${permission.key}.`));
                                          newPermissions.push(permission.key);
                                        }
                                      }
                                      updateFormData({ permissions: newPermissions });
                                    }}
                                  >
                                    <Typography variant="caption" sx={{ 
                                      color: formData.permissions.includes(subPerm.key) ? 'text.primary' : 'text.secondary',
                                      fontWeight: formData.permissions.includes(subPerm.key) ? 600 : 400
                                    }}>
                                      {subPerm.label}
                                    </Typography>
                                    <Tooltip
                                      title={`Acceso solo a: ${subPerm.label}`}
                                      arrow
                                      placement="left"
                                    >
                                      <Switch
                                        checked={formData.permissions.includes(subPerm.key)}
                                        size="small"
                                        onClick={(e) => e.stopPropagation()}
                                        sx={{
                                          '& .MuiSwitch-switchBase.Mui-checked': {
                                            color: permission.color,
                                          },
                                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                            backgroundColor: permission.color,
                                          },
                                        }}
                                      />
                                    </Tooltip>
                                  </Box>
                                ))}
                                  </>
                                )}
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                ))}
              </Grid>
              </Box>
            )}

            {/* TAB 3: RESUMEN */}
            {activeTab === 2 && (
              <Box sx={{ p: 3 }}>
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2" fontWeight={600} gutterBottom>
                    📋 Revisa los datos antes de guardar
                  </Typography>
                  <Typography variant="caption">
                    Verifica que toda la información sea correcta antes de confirmar los cambios.
                  </Typography>
                </Alert>

                <Grid container spacing={3}>
                  {/* Información Personal */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, borderRadius: 2, background: alpha(theme.palette.primary.main, 0.02) }}>
                      <Typography variant="overline" sx={{ fontWeight: 600, color: 'primary.main', display: 'block', mb: 2 }}>
                        👤 Información Personal
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Box>
                          <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.65rem' }}>
                            Email
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {formData.email || '—'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.65rem' }}>
                            Nombre Completo
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {formData.displayName || '—'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.65rem' }}>
                            Teléfono
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {formData.phone || '—'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.65rem' }}>
                            Departamento
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {formData.department || '—'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.65rem' }}>
                            Cargo/Posición
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {formData.position || '—'}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>

                  {/* Rol y Estado */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, borderRadius: 2, background: alpha(theme.palette.secondary.main, 0.02) }}>
                      <Typography variant="overline" sx={{ fontWeight: 600, color: 'secondary.main', display: 'block', mb: 2 }}>
                        🔐 Rol y Acceso
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Box>
                          <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.65rem' }}>
                            Rol del Sistema
                          </Typography>
                          <Chip 
                            label={formData.role === 'ADMIN' ? 'Administrador' : 'Usuario'} 
                            color={formData.role === 'ADMIN' ? 'error' : 'default'}
                            size="small"
                            variant="outlined"
                            sx={{ mt: 0.5, fontWeight: 500 }}
                          />
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.65rem' }}>
                            Estado
                          </Typography>
                          <Chip 
                            label={formData.isActive ? 'Activo' : 'Inactivo'} 
                            color={formData.isActive ? 'success' : 'default'}
                            size="small"
                            variant="outlined"
                            icon={formData.isActive ? <CheckCircleIcon /> : <CancelIcon />}
                            sx={{ mt: 0.5, fontWeight: 500 }}
                          />
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.65rem' }}>
                            Permisos Asignados
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main', mt: 0.5 }}>
                            {formData.permissions.length} permisos
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.65rem' }}>
                            Empresas Asignadas
                          </Typography>
                          <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {formData.companies.length > 0 ? (
                              formData.companies.map((company) => (
                                <Chip 
                                  key={company} 
                                  label={company} 
                                  size="small" 
                                  variant="outlined"
                                  color="secondary"
                                />
                              ))
                            ) : (
                              <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                                Ninguna empresa asignada
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>

                  {/* Lista de Permisos */}
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, borderRadius: 2, background: alpha(theme.palette.success.main, 0.02) }}>
                      <Typography variant="overline" sx={{ fontWeight: 600, color: 'success.main', display: 'block', mb: 2 }}>
                        ✅ Permisos Detallados
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {formData.permissions.length > 0 ? (
                          formData.permissions.map((perm) => {
                            const label = perm.replace(/_/g, ' ').replace(/\./g, ' › ');
                            return (
                              <Chip
                                key={perm}
                                label={label.charAt(0).toUpperCase() + label.slice(1)}
                                size="small"
                                color="success"
                                variant="outlined"
                                sx={{ fontSize: '0.75rem' }}
                              />
                            );
                          })
                        ) : (
                          <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                            No hay permisos asignados
                          </Typography>
                        )}
                      </Box>
                    </Paper>
                  </Grid>

                  {/* Notas */}
                  {formData.notes && (
                    <Grid item xs={12}>
                      <Paper sx={{ p: 2, borderRadius: 2, background: alpha(theme.palette.warning.main, 0.02) }}>
                        <Typography variant="overline" sx={{ fontWeight: 600, color: 'warning.main', display: 'block', mb: 1 }}>
                          📝 Notas Adicionales
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                          {formData.notes}
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}

          </Box>
        </DialogContent>

        <DialogActions sx={{ 
          p: 3, 
          pt: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
          background: theme.palette.mode === 'dark' 
            ? theme.palette.grey[900]
            : theme.palette.grey[50],
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          {/* Botones de navegación entre tabs */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              onClick={handleCloseModal}
              sx={{ 
                borderRadius: 1,
                px: 3,
                py: 1,
                textTransform: 'none',
                fontWeight: 500
              }}
            >
              Cancelar
            </Button>
            
            {activeTab > 0 && (
              <Button
                onClick={() => setActiveTab(activeTab - 1)}
                sx={{ 
                  borderRadius: 1,
                  px: 3,
                  py: 1,
                  textTransform: 'none',
                  fontWeight: 500
                }}
              >
                ← Anterior
              </Button>
            )}
          </Box>

          {/* Botones de acción */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            {activeTab < 2 && (
              <Button
                variant="outlined"
                onClick={() => setActiveTab(activeTab + 1)}
                sx={{ 
                  borderRadius: 1,
                  px: 3,
                  py: 1,
                  textTransform: 'none',
                  fontWeight: 600
                }}
              >
                Siguiente →
              </Button>
            )}
            
            {/* Botón Guardar/Actualizar - Siempre visible en todas las pestañas */}
            <Button
              variant="contained"
              onClick={handleSaveUser}
              disabled={
                !formData.email || 
                !formData.displayName || 
                (editingUser && !hasUnsavedChanges) || 
                modalLoading
              }
              sx={{
                borderRadius: 1,
                px: 3,
                py: 1,
                textTransform: 'none',
                fontWeight: 600,
                background: theme.palette.primary.main,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                '&:hover': {
                  background: theme.palette.primary.dark,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  transition: 'all 0.2s ease'
                },
                '&:disabled': {
                  background: alpha(theme.palette.primary.main, 0.3),
                  color: 'rgba(0, 0, 0, 0.26)'
                }
              }}
              startIcon={modalLoading ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {modalLoading ? 'Guardando...' : `${editingUser ? 'Actualizar' : 'Crear'} Usuario`}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Modal de configuración de notificaciones */}
      <NotificationSettingsModal
        open={openNotificationsModal}
        onClose={handleCloseNotificationsModal}
        user={selectedUserForNotifications}
      />

      {/* 🔐 Modal de Credenciales Creadas - Diseño Sobrio */}
      <Dialog
        open={showCredentialsModal}
        onClose={() => setShowCredentialsModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 1,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            overflow: 'hidden'
          }
        }}
      >
        <Box sx={{ 
          p: 3,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <Box sx={{ 
            p: 1, 
            borderRadius: 1, 
            bgcolor: alpha(theme.palette.success.main, 0.1),
            color: theme.palette.success.main,
            display: 'flex'
          }}>
            <CheckCircleIcon />
          </Box>
          <Box>
            <Typography variant="overline" sx={{ fontWeight: 700, color: theme.palette.text.secondary, lineHeight: 1 }}>
              REGISTRO EXITOSO
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
              Credenciales de Acceso
            </Typography>
          </Box>
        </Box>

        <DialogContent sx={{ p: 3 }}>
          <Alert severity="info" variant="outlined" sx={{ mb: 3, borderRadius: 1 }}>
            Comparte estas credenciales con el usuario. Deberá cambiar su contraseña al iniciar sesión por primera vez.
          </Alert>

          <Paper variant="outlined" sx={{ 
            p: 0, 
            borderRadius: 1, 
            borderColor: alpha(theme.palette.divider, 0.2),
            overflow: 'hidden'
          }}>
            <Box sx={{ p: 2, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
              <Typography variant="caption" color="text.secondary" fontWeight="bold" sx={{ letterSpacing: 0.5 }}>
                USUARIO / EMAIL
              </Typography>
              <Box display="flex" alignItems="center" justifyContent="space-between" mt={0.5}>
                <Typography variant="body1" fontWeight="500">
                  {createdCredentials?.email}
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={() => {
                    navigator.clipboard.writeText(createdCredentials?.email);
                    addNotification({ type: 'success', message: 'Email copiado' });
                  }}
                  sx={{ 
                    borderRadius: 1,
                    color: theme.palette.primary.main,
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
                  }}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            <Box sx={{ p: 2, bgcolor: alpha(theme.palette.action.hover, 0.02) }}>
              <Typography variant="caption" color="text.secondary" fontWeight="bold" sx={{ letterSpacing: 0.5 }}>
                CONTRASEÑA TEMPORAL
              </Typography>
              <Box 
                display="flex" 
                alignItems="center" 
                justifyContent="space-between" 
                mt={1}
                sx={{ 
                  bgcolor: theme.palette.background.paper, 
                  p: 1.5, 
                  borderRadius: 1,
                  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`
                }}
              >
                <Typography variant="h6" fontFamily="monospace" fontWeight="bold" color="text.primary" sx={{ letterSpacing: 1 }}>
                  {createdCredentials?.password}
                </Typography>
                <Button
                  size="small"
                  startIcon={<ContentCopyIcon fontSize="small" />}
                  onClick={() => {
                    navigator.clipboard.writeText(createdCredentials?.password);
                    addNotification({ type: 'success', message: 'Contraseña copiada' });
                  }}
                  sx={{ 
                    textTransform: 'none',
                    borderRadius: 1,
                    fontWeight: 600
                  }}
                >
                  Copiar
                </Button>
              </Box>
            </Box>
          </Paper>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            fullWidth 
            variant="contained" 
            onClick={() => setShowCredentialsModal(false)}
            sx={{ 
              py: 1.5, 
              borderRadius: 1,
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: 'none',
              '&:hover': { boxShadow: 'none' }
            }}
          >
            Entendido, cerrar ventana
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagementPage;
