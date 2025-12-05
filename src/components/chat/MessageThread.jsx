import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Avatar,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
  Paper,
  alpha,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  TextField,
  Tooltip,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Switch,
  Collapse,
  Skeleton,
  Fab,
  Popover,
  Grid
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Close as CloseIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  Phone as PhoneIcon,
  WhatsApp as WhatsAppIcon,
  PushPin as PushPinIcon,
  Search as SearchIcon,
  Photo as PhotoIcon,
  PictureAsPdf as PdfIcon,
  InsertDriveFile as FileIcon,
  Download as DownloadIcon,
  Image as ImageIcon,
  OpenInNew as OpenInNewIcon,
  DeleteSweep as DeleteSweepIcon,
  Edit as EditIcon,
  Groups as GroupsIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Chat as ChatIcon,
  AttachFile as AttachFileIcon,
  Mic as MicIcon,
  Schedule as ScheduleIcon,
  CalendarToday as CalendarIcon,
  ExitToApp as ExitToAppIcon,
  PersonAdd as PersonAddIcon,
  Settings as SettingsIcon,
  NotificationsOff as NotificationsOffIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  Palette as PaletteIcon,
  Check as CheckIconFilled
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { onSnapshot, doc, collection, query, where, getDocs, deleteDoc, writeBatch, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../config/firebase';
import { useChatMessages, useChatSearch } from '../../hooks/useChat';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useChatStats } from '../../hooks/useChatStats';
import { useTypingIndicator } from '../../hooks/useTypingIndicator';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import OptimizedAvatar from '../common/OptimizedAvatar';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Thread de mensajes de una conversación
 */
const MessageThread = React.memo(({ conversationId, selectedUser, onBack }) => {
  const { currentUser } = useAuth();
  const { 
    getConversation, 
    setActiveConversationId, 
    togglePinMessage, 
    updateGroupInfo, 
    leaveGroup, 
    deleteConversation 
  } = useChat();
  const {
    messages,
    loading,
    error,
    hasMore,
    loadMoreMessages,
    sendMessage,
    markMessageAsRead, // Legacy - mantener por compatibilidad
    updateReadCursor, // Nueva función optimizada
    deleteMessage,
    editMessage,
    forwardMessage,
    toggleReaction
  } = useChatMessages(conversationId);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const previousMessagesLength = useRef(0);
  const isInitialLoad = useRef(true);
  
  // 📊 Hook de estadísticas del chat
  const stats = useChatStats(conversationId);

  // ⌨️ Hook de typing indicator
  const { startTyping, stopTyping, whoIsTyping } = useTypingIndicator(conversationId);

  // 🎨 Fondos predefinidos
  const chatBackgrounds = [
    {
      id: 'default',
      name: 'Por defecto',
      light: `linear-gradient(180deg, ${alpha('#667eea', 0.03)} 0%, ${alpha('#f5f5f5', 0.8)} 50%, ${alpha('#764ba2', 0.03)} 100%)`,
      dark: `linear-gradient(180deg, ${alpha('#667eea', 0.02)} 0%, ${alpha('#764ba2', 0.02)} 100%)`
    },
    {
      id: 'ocean',
      name: 'Océano',
      light: `linear-gradient(180deg, ${alpha('#00b4db', 0.05)} 0%, ${alpha('#0083b0', 0.08)} 100%)`,
      dark: `linear-gradient(180deg, ${alpha('#00b4db', 0.03)} 0%, ${alpha('#0083b0', 0.05)} 100%)`
    },
    {
      id: 'sunset',
      name: 'Atardecer',
      light: `linear-gradient(180deg, ${alpha('#ff6b6b', 0.04)} 0%, ${alpha('#feca57', 0.06)} 100%)`,
      dark: `linear-gradient(180deg, ${alpha('#ff6b6b', 0.02)} 0%, ${alpha('#feca57', 0.04)} 100%)`
    },
    {
      id: 'forest',
      name: 'Bosque',
      light: `linear-gradient(180deg, ${alpha('#11998e', 0.05)} 0%, ${alpha('#38ef7d', 0.07)} 100%)`,
      dark: `linear-gradient(180deg, ${alpha('#11998e', 0.03)} 0%, ${alpha('#38ef7d', 0.05)} 100%)`
    },
    {
      id: 'lavender',
      name: 'Lavanda',
      light: `linear-gradient(180deg, ${alpha('#a8edea', 0.06)} 0%, ${alpha('#fed6e3', 0.08)} 100%)`,
      dark: `linear-gradient(180deg, ${alpha('#a8edea', 0.03)} 0%, ${alpha('#fed6e3', 0.05)} 100%)`
    },
    {
      id: 'classic',
      name: 'Clásico',
      light: `linear-gradient(180deg, ${alpha('#ece9e6', 0.4)} 0%, ${alpha('#ffffff', 0.6)} 100%)`,
      dark: `linear-gradient(180deg, ${alpha('#232526', 0.3)} 0%, ${alpha('#414345', 0.5)} 100%)`
    },
    {
      id: 'night',
      name: 'Nocturno',
      light: `linear-gradient(180deg, ${alpha('#2c3e50', 0.08)} 0%, ${alpha('#3498db', 0.10)} 100%)`,
      dark: `linear-gradient(180deg, ${alpha('#2c3e50', 0.05)} 0%, ${alpha('#3498db', 0.07)} 100%)`
    },
    {
      id: 'rose',
      name: 'Rosa',
      light: `linear-gradient(180deg, ${alpha('#f093fb', 0.05)} 0%, ${alpha('#f5576c', 0.07)} 100%)`,
      dark: `linear-gradient(180deg, ${alpha('#f093fb', 0.03)} 0%, ${alpha('#f5576c', 0.05)} 100%)`
    }
  ];
  
  // ⌨️ C. Estado para indicador de "escribiendo..."
  const [otherUserTyping, setOtherUserTyping] = useState(false);

  // 🎨 Cargar fondo guardado
  useEffect(() => {
    const loadBackground = async () => {
      if (!currentUser?.uid) return;
      try {
        const settingsRef = doc(db, 'userSettings', currentUser.uid);
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists()) {
          const savedBg = settingsSnap.data()?.chatBackground;
          if (savedBg) {
            setSelectedBackground(savedBg);
          }
        }
      } catch (error) {
        console.error('Error loading background:', error);
      }
    };
    loadBackground();
  }, [currentUser?.uid]);

  // 📌 Estado para respuestas
  const [replyingTo, setReplyingTo] = useState(null);

  // 👤 Estado para diálogo de información de usuario
  const [userInfoDialogOpen, setUserInfoDialogOpen] = useState(false);

  // 👥 Estado para diálogo de información del grupo
  const [groupInfoDialogOpen, setGroupInfoDialogOpen] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [groupDescription, setGroupDescription] = useState('');
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);

  // 🔍 Estados para búsqueda
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { results: searchResults, searching } = useChatSearch(conversationId, searchTerm);

  // 📎 Estado para galería de archivos
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryFilter, setGalleryFilter] = useState('all'); // 'all', 'images', 'pdfs', 'others'
  
  // 🖼️ Estados para visor de archivos (reutilizando lógica de MessageBubble)
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [viewingFile, setViewingFile] = useState(null);
  const [viewerSize, setViewerSize] = useState('normal');

  // 🎨 Estados para selector de fondos
  const [backgroundAnchorEl, setBackgroundAnchorEl] = useState(null);
  const [selectedBackground, setSelectedBackground] = useState('default');
  const backgroundPopoverOpen = Boolean(backgroundAnchorEl);

  // 🗑️ Estados para eliminar conversación
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmChecked, setDeleteConfirmChecked] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // 🖼️ Estados para cambio de foto de grupo
  const [uploadingGroupPhoto, setUploadingGroupPhoto] = useState(false);
  const fileInputRef = useRef(null);

  // 📸 Estado para foto del usuario cargada desde Firestore
  const [loadedUserPhoto, setLoadedUserPhoto] = useState(null);

  // 👤 Handlers para el diálogo de usuario
  const handleAvatarClick = (e) => {
    e.stopPropagation();
    if (isGroup) {
      // Para grupos: abrir diálogo de información del grupo
      setGroupInfoDialogOpen(true);
    } else {
      // Para usuarios: abrir diálogo de info
      setUserInfoDialogOpen(true);
    }
  };

  // 🖼️ Handler para cambio de foto de grupo
  const handleGroupPhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !conversation) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida');
      return;
    }

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no debe superar 5MB');
      return;
    }

    setUploadingGroupPhoto(true);

    try {
      // Subir a Storage
      const storageRef = ref(storage, `chat/groups/${conversationId}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);

      // Actualizar metadata del grupo
      await updateGroupInfo(conversationId, { groupPhoto: photoURL });

      console.log('✅ Foto de grupo actualizada');
    } catch (err) {
      console.error('❌ Error subiendo foto:', err);
      alert('Error al subir la foto del grupo');
    } finally {
      setUploadingGroupPhoto(false);
      e.target.value = ''; // Resetear input
    }
  };

  // 🔤 Función para obtener iniciales del nombre
  const getInitials = (name) => {
    if (!name) return '?';
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  const handleCloseUserInfo = () => {
    setUserInfoDialogOpen(false);
  };

  const handleCloseGroupInfo = () => {
    setGroupInfoDialogOpen(false);
    setEditingDescription(false);
    setAdvancedSettingsOpen(false);
  };

  // 📝 Handler para guardar descripción del grupo
  const handleSaveDescription = async () => {
    try {
      await updateGroupInfo(conversationId, { description: groupDescription });
      setEditingDescription(false);
    } catch (err) {
      console.error('❌ Error guardando descripción:', err);
    }
  };

  // 🚪 Handler para abandonar grupo
  const handleLeaveGroup = async () => {
    const isCreator = conversation?.metadata?.createdBy === currentUser?.uid;
    
    if (isCreator && conversation.participantIds?.length > 1) {
      alert('Como creador del grupo, debes eliminar el grupo o transferir la propiedad antes de abandonarlo.');
      return;
    }

    if (!window.confirm('¿Estás seguro de que deseas abandonar este grupo?')) return;

    try {
      await leaveGroup(conversationId);
      handleCloseGroupInfo();
      if (onBack) onBack();
    } catch (err) {
      console.error('❌ Error abandonando grupo:', err);
    }
  };

  // 🗑️ Handler para eliminar conversación DM
  const handleDeleteDM = async () => {
    if (!window.confirm('¿Eliminar esta conversación? Se borrará todo el historial de mensajes.')) return;

    try {
      await deleteConversation(conversationId);
      handleCloseUserInfo();
      if (onBack) onBack();
    } catch (err) {
      console.error('❌ Error eliminando conversación:', err);
    }
  };

  // ⚙️ Handler para cambiar configuraciones del grupo
  // 🎨 Handlers de selector de fondos
  const handleBackgroundClick = (event) => {
    setBackgroundAnchorEl(event.currentTarget);
  };

  const handleBackgroundClose = () => {
    setBackgroundAnchorEl(null);
  };

  const handleSelectBackground = async (backgroundId) => {
    setSelectedBackground(backgroundId);
    handleBackgroundClose();
    
    // Guardar en Firestore
    if (currentUser?.uid) {
      try {
        const settingsRef = doc(db, 'userSettings', currentUser.uid);
        await updateDoc(settingsRef, {
          chatBackground: backgroundId
        });
      } catch (error) {
        console.error('Error saving background:', error);
      }
    }
  };

  const handleToggleSetting = async (setting, value) => {
    try {
      await updateGroupInfo(conversationId, {
        settings: {
          [setting]: value
        }
      });
    } catch (err) {
      console.error('❌ Error actualizando configuración:', err);
    }
  };

  // 🖼️ Handler para eliminar foto del grupo
  const handleDeleteGroupPhoto = async () => {
    if (!conversation || !window.confirm('¿Eliminar foto del grupo?')) return;

    setUploadingGroupPhoto(true);
    try {
      await updateGroupInfo(conversationId, { groupPhoto: null });
      console.log('✅ Foto de grupo eliminada');
    } catch (err) {
      console.error('❌ Error eliminando foto:', err);
      alert('Error al eliminar la foto del grupo');
    } finally {
      setUploadingGroupPhoto(false);
    }
  };

  // 🖼️ Handlers para visor de archivos
  const handleFileClick = (file) => {
    setViewingFile(file);
    setFileViewerOpen(true);
  };

  const handleCloseFileViewer = () => {
    setFileViewerOpen(false);
    setViewingFile(null);
    setViewerSize('normal');
  };

  // 🗑️ Handler para eliminar conversación completa
  const handleDeleteConversation = async () => {
    if (!deleteConfirmChecked) {
      alert('Debes confirmar que deseas eliminar el historial');
      return;
    }

    setDeleting(true);

    try {
      // ✅ CORRECCIÓN: Buscar en colección RAÍZ 'messages' filtrando por conversationId
      const messagesQuery = query(
        collection(db, 'messages'),
        where('conversationId', '==', conversationId)
      );
      
      const messagesSnapshot = await getDocs(messagesQuery);
      
      console.log(`📊 Total de mensajes encontrados para eliminar: ${messagesSnapshot.size}`);

      if (messagesSnapshot.empty) {
        console.log('⚠️ No se encontraron mensajes, solo reseteando metadata...');
      }

      // 2. Eliminar archivos de Storage (SOLO los adjuntos del chat)
      for (const messageDoc of messagesSnapshot.docs) {
        const messageData = messageDoc.data();
        
        if (messageData.attachments && messageData.attachments.length > 0) {
          for (const attachment of messageData.attachments) {
            try {
              // Verificar que el archivo sea de chat_attachments/ (NO comprobantes externos)
              if (attachment.url && attachment.url.includes('chat_attachments')) {
                const urlObj = new URL(attachment.url);
                const pathEncoded = urlObj.pathname.split('/o/')[1];
                
                if (pathEncoded) {
                  const storagePath = decodeURIComponent(pathEncoded.split('?')[0]); // Remover query params
                  
                  // Doble verificación: SOLO eliminar si es de chat_attachments
                  if (storagePath.startsWith('chat_attachments/')) {
                    const { ref, deleteObject } = await import('firebase/storage');
                    const { storage } = await import('../../config/firebase');
                    const fileRef = ref(storage, storagePath);
                    await deleteObject(fileRef);
                    console.log(`🗑️ Archivo chat eliminado: ${storagePath}`);
                  } else {
                    console.log(`ℹ️ Archivo externo preservado (no es adjunto del chat): ${storagePath}`);
                  }
                }
              }
            } catch (error) {
              // Ignorar errores 404 (archivo ya no existe)
              if (error.code === 'storage/object-not-found') {
                console.log(`ℹ️ Archivo ya no existe (ignorado): ${attachment.name || 'archivo'}`);
              } else {
                console.warn('⚠️ Error al eliminar archivo:', error.message);
              }
            }
          }
        }
      }

      // 3. Eliminar mensajes en lotes de 500 (Firestore batch limit)
      const batchSize = 500;
      const messageDocs = messagesSnapshot.docs;
      
      for (let i = 0; i < messageDocs.length; i += batchSize) {
        const batch = writeBatch(db);
        const batchDocs = messageDocs.slice(i, i + batchSize);
        
        batchDocs.forEach(doc => {
          batch.delete(doc.ref);
        });
        
        await batch.commit();
        console.log(`✅ Batch de mensajes ${Math.floor(i / batchSize) + 1} eliminado`);
      }

      // 4. Resetear metadata de la conversación
      const conversationRef = doc(db, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        lastMessage: null,
        lastMessageTime: null,
        unreadCount: {},
        pinnedMessageId: null
      });

      // 5. Cerrar modal y resetear estados
      setDeleteDialogOpen(false);
      setDeleteConfirmChecked(false);

      console.log('✅ Proceso de eliminación finalizado');
      alert('✅ Historial eliminado correctamente');

    } catch (error) {
      console.error('❌ Error crítico eliminando conversación:', error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const conversation = getConversation(conversationId);
  
  // ✅ FIX: Diferenciar entre grupos y conversaciones directas
  const isGroup = conversation?.type === 'group';
  
  // 🔍 Obtener información del otro usuario desde la conversación si selectedUser no está disponible
  const otherUserId = !isGroup && conversation?.participantIds?.find(id => id !== currentUser?.uid);
  
  const displayName = isGroup 
    ? (conversation?.metadata?.groupName || 'Grupo sin nombre')
    : (selectedUser?.displayName 
        || selectedUser?.name 
        || conversation?.participantNames?.[otherUserId]
        || 'Usuario');
  
  const displayPhoto = isGroup
    ? (conversation?.metadata?.groupPhoto || null)
    : (selectedUser?.photoURL 
        || selectedUser?.photo 
        || loadedUserPhoto
        || conversation?.participantPhotos?.[otherUserId]
        || null);

  // 📸 Cargar foto del usuario desde Firestore si no está disponible
  useEffect(() => {
    if (!otherUserId || isGroup || selectedUser?.photoURL || selectedUser?.photo) {
      return; // No es necesario cargar si ya tenemos la foto
    }

    const loadUserPhoto = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', otherUserId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const photoURL = userData.photoURL || userData.photo || null;
          setLoadedUserPhoto(photoURL);
          console.log('📸 Foto de usuario cargada:', photoURL);
        }
      } catch (err) {
        console.error('❌ Error cargando foto del usuario:', err);
      }
    };

    loadUserPhoto();
  }, [otherUserId, isGroup, selectedUser?.photoURL, selectedUser?.photo]);

  // 📝 Cargar descripción del grupo cuando se abre el modal
  useEffect(() => {
    if (groupInfoDialogOpen && conversation?.metadata?.description) {
      setGroupDescription(conversation.metadata.description);
    }
  }, [groupInfoDialogOpen, conversation?.metadata?.description]);

  // 🔐 Verificar si el usuario puede eliminar la conversación
  const canDeleteConversation = () => {
    if (!conversation || !currentUser) return false;
    
    // Conversación directa: ambos pueden eliminar
    if (conversation.type === 'direct') return true;
    
    // Grupo: solo el creador puede eliminar
    if (conversation.type === 'group') {
      return conversation.createdBy === currentUser.uid;
    }
    
    return false;
  };

  // 📌 Mensaje fijado
  const pinnedMessage = messages.find(m => m.id === conversation?.pinnedMessageId);

  // ⌨️ C. Listener para detectar cuando el otro usuario está escribiendo
  useEffect(() => {
    if (!conversationId || !currentUser?.uid) return;

    const unsubscribe = onSnapshot(doc(db, 'conversations', conversationId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const typing = data.typing || {};
        
        // Verificar si algún otro usuario está escribiendo (no el actual)
        const otherUsersTyping = Object.entries(typing).filter(([userId, timestamp]) => {
          if (userId === currentUser.uid) return false;
          if (!timestamp) return false;
          
          // Considerar "escribiendo" si el timestamp es de los últimos 3 segundos
          const now = Date.now();
          const typingTime = timestamp.toMillis();
          return (now - typingTime) < 3000;
        });

        setOtherUserTyping(otherUsersTyping.length > 0);
      }
    });

    return () => unsubscribe();
  }, [conversationId, currentUser?.uid]);

  // 🔄 Resetear flag de carga inicial al cambiar de conversación
  useEffect(() => {
    isInitialLoad.current = true;
    previousMessagesLength.current = 0;
  }, [conversationId]);

  // ✅ Auto-scroll INTELIGENTE: Siempre al final cuando abres un chat nuevo
  useEffect(() => {
    if (messages.length === 0 || !messagesEndRef.current) return;

    // 1️⃣ CARGA INICIAL: SIEMPRE scroll al final del último mensaje (comportamiento solicitado)
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      previousMessagesLength.current = messages.length;
      // Usar timeout para asegurar que el DOM esté renderizado
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
      }, 100);
      return;
    }

    // 2️⃣ MENSAJES NUEVOS: Solo scroll si aumentó la cantidad (no disminuyó por loadMore)
    const messagesIncreased = messages.length > previousMessagesLength.current;

    if (messagesIncreased) {
      // ✅ CRÍTICO: Verificar posición actual ANTES de hacer scroll
      if (!messagesContainerRef.current) {
        previousMessagesLength.current = messages.length;
        return;
      }

      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const scrollPosition = scrollHeight - scrollTop - clientHeight;
      const isNearBottom = scrollPosition < 200;
      const isAtTop = scrollTop < 100;

      // 🚫 PREVENIR SCROLL si el usuario está navegando por mensajes antiguos
      if (isAtTop || (!isNearBottom && scrollPosition > 500)) {
        previousMessagesLength.current = messages.length;
        return;
      }

      // Verificar si el nuevo mensaje es del usuario actual
      const lastMessage = messages[messages.length - 1];
      const isMyMessage = lastMessage?.senderId === currentUser?.uid;
      
      // Solo hacer scroll si:
      // 1. Es mi mensaje Y estoy cerca del final
      // 2. Es mensaje de otro Y estoy MUY cerca del final (< 100px)
      if (isMyMessage && isNearBottom) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      } else if (!isMyMessage && scrollPosition < 100) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }

    previousMessagesLength.current = messages.length;
  }, [messages, currentUser?.uid]);

  // ✅ OPTIMIZACIÓN: Marcar como leídos usando cursor (1 escritura en lugar de N)
  useEffect(() => {
    if (!messages.length || !currentUser?.uid || !updateReadCursor || !conversation) return;

    // Encontrar el último mensaje del otro usuario
    const lastOtherUserMessage = [...messages]
      .reverse()
      .find(msg => msg.senderId !== currentUser.uid);

    if (lastOtherUserMessage?.createdAt) {
      // ✅ MICRO-OPTIMIZACIÓN: Comparar antes de escribir para evitar escrituras redundantes
      const myLastRead = conversation[`lastRead_${currentUser.uid}`];
      const messageTime = lastOtherUserMessage.createdAt instanceof Date 
        ? lastOtherUserMessage.createdAt.getTime() 
        : lastOtherUserMessage.createdAt.toMillis?.() || 0;
      const lastReadTime = myLastRead instanceof Date 
        ? myLastRead.getTime() 
        : myLastRead?.toMillis?.() || 0;

      // Solo actualizar si el mensaje es más nuevo que lo último leído
      if (messageTime > lastReadTime) {
        updateReadCursor(lastOtherUserMessage.createdAt);
      }
    }
  }, [messages, currentUser?.uid, updateReadCursor, conversation]);

  // Detectar scroll para mostrar botón "ir al final"
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!conversation) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
      </Box>
    );
  }

  // Obtener info del otro participante (ya procesado en displayName y displayPhoto)
  // ✅ Para grupos: displayName/displayPhoto son del grupo (metadata)
  // ✅ Para DM: displayName/displayPhoto son del otro usuario (selectedUser)
  const otherParticipantName = displayName;
  const otherParticipantPhoto = displayPhoto;

  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: 'background.default'
      }}
    >
      {/* Header Sobrio */}
      <Paper
        elevation={0}
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 2.5,
          borderBottom: 1,
          borderColor: alpha(theme.palette.primary.main, 0.15),
          background: theme.palette.mode === 'dark'
            ? 'background.paper'
            : `linear-gradient(135deg, ${alpha('#667eea', 0.03)} 0%, ${alpha('#764ba2', 0.02)} 100%)`,
          gap: 2,
          borderRadius: 0,
          boxShadow: '0 2px 12px rgba(102, 126, 234, 0.08)'
        }}
      >
        {/* Botón volver (móvil) */}
        {onBack && (
          <IconButton
            onClick={onBack}
            sx={{ 
              display: { xs: 'block', md: 'none' },
              '&:hover': {
                bgcolor: alpha('#000', 0.04)
              }
            }}
          >
            <ArrowBackIcon />
          </IconButton>
        )}

        {/* Avatar y nombre */}
        <Box sx={{ position: 'relative' }}>
          <OptimizedAvatar
            src={otherParticipantPhoto}
            alt={otherParticipantName}
            onClick={handleAvatarClick}
            sx={{ 
              width: 44, 
              height: 44, 
              border: 2,
              borderColor: alpha('#667eea', 0.3),
              background: !otherParticipantPhoto
                ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
                : undefined,
              boxShadow: '0 2px 12px rgba(102, 126, 234, 0.2)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontSize: '1.1rem',
              fontWeight: 700,
              '&:hover': {
                transform: 'scale(1.15) rotate(-5deg)',
                borderColor: 'primary.main',
                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)'
              }
            }}
          >
            {!otherParticipantPhoto && (
              isGroup ? getInitials(displayName) : <PersonIcon />
            )}
          </OptimizedAvatar>
          {/* Indicador de carga al subir foto */}
          {uploadingGroupPhoto && (
            <CircularProgress
              size={44}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 1
              }}
            />
          )}
          {/* Ícono de edición para grupos (hover) */}
          {isGroup && (
            <Box
              sx={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                bgcolor: 'primary.main',
                borderRadius: '50%',
                width: 18,
                height: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                opacity: 0.9,
                pointerEvents: 'none'
              }}
            >
              <EditIcon sx={{ fontSize: 11, color: 'white' }} />
            </Box>
          )}
        </Box>
        {/* Input oculto para subir foto de grupo */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleGroupPhotoChange}
          style={{ display: 'none' }}
        />

        <Box 
          flexGrow={1}
          onClick={isGroup ? handleAvatarClick : undefined}
          sx={isGroup ? {
            cursor: 'pointer',
            '&:hover': {
              opacity: 0.8
            },
            transition: 'opacity 0.2s ease'
          } : {}}
        >
          {!searchOpen ? (
            <>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.25 }}>
                {otherParticipantName}
              </Typography>
              <Typography 
                variant="caption" 
                color={whoIsTyping.length > 0 ? 'primary.main' : 'text.secondary'}
                sx={{ 
                  fontWeight: whoIsTyping.length > 0 ? 600 : 400,
                  transition: 'all 0.3s ease'
                }}
              >
                {whoIsTyping.length > 0 ? (
                  <>
                    ⌨️ {whoIsTyping.length === 1 
                      ? `${whoIsTyping[0].userName.split(' ')[0]} está escribiendo...`
                      : `${whoIsTyping.length} personas están escribiendo...`
                    }
                  </>
                ) : (
                  isGroup ? `👥 ${conversation?.participantIds?.length || 0} miembros` : `💬 ${messages.length} ${messages.length === 1 ? 'mensaje' : 'mensajes'}`
                )}
              </Typography>
            </>
          ) : (
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar en la conversación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                endAdornment: searching && <CircularProgress size={20} />
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: alpha('#000', 0.02)
                }
              }}
            />
          )}
        </Box>

        {/* Botón de galería de archivos */}
        <Tooltip title="Archivos y Enlaces">
          <IconButton
            onClick={() => setGalleryOpen(true)}
            sx={{
              transition: 'all 0.3s ease',
              '&:hover': {
                bgcolor: alpha('#667eea', 0.1),
                transform: 'scale(1.1)'
              }
            }}
          >
            <PhotoIcon />
          </IconButton>
        </Tooltip>

        {/* Botón de búsqueda */}
        <Tooltip title={searchOpen ? "Cerrar búsqueda" : "Buscar"}>
          <IconButton
            onClick={() => {
              setSearchOpen(!searchOpen);
              if (searchOpen) setSearchTerm('');
            }}
            sx={{
              transition: 'all 0.3s ease',
              '&:hover': {
                bgcolor: alpha('#667eea', 0.1),
                transform: 'rotate(90deg)'
              }
            }}
          >
            {searchOpen ? <CloseIcon /> : <SearchIcon />}
          </IconButton>
        </Tooltip>

        {/* 🎨 Selector de fondos */}
        <Tooltip title="Cambiar fondo">
          <IconButton
            onClick={handleBackgroundClick}
            sx={{
              transition: 'all 0.3s ease',
              '&:hover': {
                bgcolor: alpha('#667eea', 0.1),
                transform: 'scale(1.1)'
              }
            }}
          >
            <PaletteIcon />
          </IconButton>
        </Tooltip>

        {/* 🗑️ Botón eliminar conversación */}
        {canDeleteConversation() && (
          <Tooltip title="Eliminar historial completo">
            <IconButton
              onClick={() => setDeleteDialogOpen(true)}
              sx={{
                transition: 'all 0.3s ease',
                color: 'error.main',
                '&:hover': {
                  bgcolor: alpha('#f44336', 0.1),
                  transform: 'scale(1.1)'
                }
              }}
            >
              <DeleteSweepIcon />
            </IconButton>
          </Tooltip>
        )}
      </Paper>

      {/* 📌 Banner de mensaje fijado */}
      {pinnedMessage && (
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            borderBottom: 1,
            borderColor: alpha('#667eea', 0.2),
            background: `linear-gradient(90deg, ${alpha('#667eea', 0.08)} 0%, ${alpha('#764ba2', 0.08)} 100%)`,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            '&:hover': {
              background: `linear-gradient(90deg, ${alpha('#667eea', 0.12)} 0%, ${alpha('#764ba2', 0.12)} 100%)`
            }
          }}
          onClick={() => {
            const element = document.getElementById(`message-${pinnedMessage.id}`);
            element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }}
        >
          <PushPinIcon 
            sx={{ 
              color: 'primary.main',
              transform: 'rotate(45deg)'
            }} 
          />
          <Box flexGrow={1}>
            <Typography variant="caption" color="primary" fontWeight={600} sx={{ mb: 0.25, display: 'block' }}>
              Mensaje fijado
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {pinnedMessage.text || '📎 Archivo adjunto'}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              togglePinMessage(conversationId, pinnedMessage.id);
            }}
            sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Paper>
      )}

      {/* 🔍 Resultados de búsqueda */}
      {searchOpen && searchTerm && (
        <Paper
          elevation={0}
          sx={{
            maxHeight: 200,
            overflowY: 'auto',
            borderBottom: 1,
            borderColor: alpha('#000', 0.1)
          }}
        >
          {searching ? (
            <Box p={2} display="flex" justifyContent="center">
              <CircularProgress size={24} />
            </Box>
          ) : searchResults.length === 0 ? (
            <Box p={2} textAlign="center">
              <Typography variant="body2" color="text.secondary">
                No se encontraron mensajes
              </Typography>
            </Box>
          ) : (
            <Box>
              {searchResults.map((result) => (
                <Box
                  key={result.id}
                  sx={{
                    p: 1.5,
                    borderBottom: 1,
                    borderColor: alpha('#000', 0.05),
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: alpha('#667eea', 0.05)
                    }
                  }}
                  onClick={() => {
                    const element = document.getElementById(`message-${result.id}`);
                    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setSearchOpen(false);
                    setSearchTerm('');
                  }}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    {result.senderName} • {new Date(result.createdAt).toLocaleDateString('es-CO')}
                  </Typography>
                  <Typography variant="body2" noWrap>
                    {result.text}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Paper>
      )}

      {/* Área de mensajes Sobrio con gradiente */}
      <Box
        ref={messagesContainerRef}
        data-messages-container
        onScroll={handleScroll}
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          p: 2.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          background: (() => {
            const bg = chatBackgrounds.find(b => b.id === selectedBackground);
            return bg ? (theme.palette.mode === 'dark' ? bg.dark : bg.light) : 
              (theme.palette.mode === 'dark'
                ? `linear-gradient(180deg, ${alpha('#667eea', 0.02)} 0%, ${alpha('#764ba2', 0.02)} 100%)`
                : `linear-gradient(180deg, ${alpha('#667eea', 0.03)} 0%, ${alpha('#f5f5f5', 0.8)} 50%, ${alpha('#764ba2', 0.03)} 100%)`);
          })()
        }}
      >
        {loading && messages.length === 0 ? (
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[1, 2, 3, 4].map((i) => (
              <Box key={i} sx={{ alignSelf: i % 2 === 0 ? 'flex-end' : 'flex-start', maxWidth: i % 2 === 0 ? 200 : 150 }}>
                <Skeleton variant="rectangular" width={i % 2 === 0 ? 200 : 150} height={60} sx={{ borderRadius: 2 }} />
              </Box>
            ))}
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : messages.length === 0 ? (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            height="100%"
            gap={2}
          >
            <Typography variant="h6" color="text.secondary">
              No hay mensajes aún
            </Typography>
            <Typography variant="body2" color="text.disabled">
              Envía el primer mensaje para iniciar la conversación
            </Typography>
          </Box>
        ) : (
          <>
            {/* Indicador de mensajes recientes */}
            {!hasMore && messages.length > 0 && (
              <Box display="flex" justifyContent="center" py={2}>
                <Chip
                  label="Inicio de la conversación"
                  size="small"
                  icon={<CheckIcon />}
                  sx={{
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    color: 'success.main',
                    fontWeight: 500,
                    fontSize: '0.7rem'
                  }}
                />
              </Box>
            )}

            {/* Botón cargar más mensajes */}
            {hasMore && (
              <Box display="flex" justifyContent="center" py={2}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={loadMoreMessages}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={16} /> : null}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 500,
                    borderColor: alpha(theme.palette.primary.main, 0.3),
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: alpha(theme.palette.primary.main, 0.05)
                    }
                  }}
                >
                  {loading ? 'Cargando...' : `Cargar mensajes anteriores (${messages.length} mostrados)`}
                </Button>
              </Box>
            )}

            {/* Lista de mensajes */}
            {messages.map((message, index) => {
              const isOwnMessage = message.senderId === currentUser?.uid;
              const showDateDivider =
                index === 0 ||
                new Date(messages[index - 1].createdAt).toDateString() !==
                  new Date(message.createdAt).toDateString();

              return (
                <React.Fragment key={message.id}>
                  {showDateDivider && (
                    <Box
                      sx={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 1,
                        py: 1,
                        textAlign: 'center'
                      }}
                    >
                      <Chip
                        label={new Date(message.createdAt).toLocaleDateString('es-CO', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                        size="small"
                        sx={{
                          bgcolor: alpha(theme.palette.background.paper, 0.8),
                          backdropFilter: 'blur(4px)',
                          color: theme.palette.text.secondary,
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          letterSpacing: 0.5,
                          textTransform: 'uppercase',
                          boxShadow: 1
                        }}
                      />
                    </Box>
                  )}

                  <Box id={`message-${message.id}`}>
                    <MessageBubble
                      message={message}
                      isOwnMessage={isOwnMessage}
                      isNewMessage={index === messages.length - 1}
                      showAvatar={
                        index === 0 || 
                        messages[index - 1].senderId !== message.senderId ||
                        (message.createdAt?.toMillis?.() || message.createdAt) - 
                        (messages[index - 1].createdAt?.toMillis?.() || messages[index - 1].createdAt) > 60000
                      }
                      conversation={conversation}
                      onDelete={deleteMessage}
                      onEdit={editMessage}
                      onReply={setReplyingTo}
                      onForward={forwardMessage}
                      onReact={toggleReaction}
                      onPin={(messageId) => togglePinMessage(conversationId, messageId)}
                      onNavigateToConversation={setActiveConversationId}
                      replyToMessage={
                        message.metadata?.replyTo 
                          ? messages.find(m => m.id === message.metadata.replyTo)
                          : null
                      }
                      onScrollToMessage={(messageId) => {
                        const element = document.getElementById(`message-${messageId}`);
                        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                    />
                  </Box>
                </React.Fragment>
              );
            })}

            <div ref={messagesEndRef} />
          </>
        )}
      </Box>

      {/* 🔽 Botón flotante para bajar */}
      {showScrollButton && (
        <Box
          component={motion.div}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          sx={{ position: 'absolute', bottom: 80, right: 24, zIndex: 5 }}
        >
          <Fab
            size="small"
            color="primary"
            onClick={scrollToBottom}
            sx={{
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              bgcolor: alpha(theme.palette.background.paper, 0.9),
              color: theme.palette.text.primary,
              '&:hover': {
                bgcolor: theme.palette.background.paper
              }
            }}
          >
            <KeyboardArrowDownIcon />
          </Fab>
        </Box>
      )}

      {/* ⌨️ Indicador de "escribiendo..." con burbuja animada */}
      {otherUserTyping && (
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <OptimizedAvatar
            src={selectedUser?.photoURL || selectedUser?.photo}
            sx={{ width: 24, height: 24 }}
          >
            {displayName?.[0]?.toUpperCase()}
          </OptimizedAvatar>
          
          {/* Burbuja con 3 puntos animados */}
          <Paper
            elevation={0}
            component={motion.div}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            sx={{
              p: 1.5,
              borderRadius: 3,
              bgcolor: 'action.hover',
              display: 'flex',
              gap: 0.5,
              alignItems: 'center'
            }}
          >
            <Box
              component={motion.div}
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: 'text.secondary'
              }}
              animate={{ 
                transform: ['translateY(0px)', 'translateY(-4px)', 'translateY(0px)'] 
              }}
              transition={{ 
                duration: 0.6, 
                repeat: Infinity,
                delay: 0
              }}
            />
            <Box
              component={motion.div}
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: 'text.secondary'
              }}
              animate={{ 
                transform: ['translateY(0px)', 'translateY(-4px)', 'translateY(0px)'] 
              }}
              transition={{ 
                duration: 0.6, 
                repeat: Infinity,
                delay: 0.2
              }}
            />
            <Box
              component={motion.div}
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: 'text.secondary'
              }}
              animate={{ 
                transform: ['translateY(0px)', 'translateY(-4px)', 'translateY(0px)'] 
              }}
              transition={{ 
                duration: 0.6, 
                repeat: Infinity,
                delay: 0.4
              }}
            />
          </Paper>
        </Box>
      )}

      {/* Input de mensaje */}
      <MessageInput
        conversationId={conversationId}
        onSendMessage={(text, attachments, replyToId, mentionedUserIds) => sendMessage(text, attachments, replyToId, mentionedUserIds)}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        onTyping={startTyping}
        onStopTyping={stopTyping}
      />

      {/* 🎨 Popover de selector de fondos */}
      <Popover
        open={backgroundPopoverOpen}
        anchorEl={backgroundAnchorEl}
        onClose={handleBackgroundClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            p: 2,
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            minWidth: 320
          }
        }}
      >
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
          🎨 Selecciona un fondo
        </Typography>
        <Grid container spacing={1.5}>
          {chatBackgrounds.map((bg) => (
            <Grid item xs={6} key={bg.id}>
              <Box
                onClick={() => handleSelectBackground(bg.id)}
                sx={{
                  position: 'relative',
                  height: 80,
                  borderRadius: 2,
                  background: theme.palette.mode === 'dark' ? bg.dark : bg.light,
                  cursor: 'pointer',
                  border: 2,
                  borderColor: selectedBackground === bg.id ? 'primary.main' : alpha('#000', 0.1),
                  transition: 'all 0.3s ease',
                  overflow: 'hidden',
                  '&:hover': {
                    borderColor: 'primary.main',
                    transform: 'scale(1.05)',
                    boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.3)}`
                  }
                }}
              >
                {/* Indicador de seleccionado */}
                {selectedBackground === bg.id && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      bgcolor: 'primary.main',
                      borderRadius: '50%',
                      width: 24,
                      height: 24,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                    }}
                  >
                    <CheckIconFilled sx={{ fontSize: 16, color: 'white' }} />
                  </Box>
                )}
                {/* Nombre del fondo */}
                <Typography
                  variant="caption"
                  sx={{
                    position: 'absolute',
                    bottom: 4,
                    left: 6,
                    right: 6,
                    textAlign: 'center',
                    bgcolor: alpha('#fff', 0.9),
                    color: 'text.primary',
                    py: 0.5,
                    px: 1,
                    borderRadius: 1,
                    fontWeight: 600,
                    fontSize: '0.7rem'
                  }}
                >
                  {bg.name}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Popover>

      {/* Diálogo de información del usuario */}
      <Dialog
        open={userInfoDialogOpen}
        onClose={handleCloseUserInfo}
        maxWidth="sm"
        fullWidth
        sx={{
          '& .MuiDialog-container': {
            alignItems: 'center',
            justifyContent: 'flex-end',
            pr: { xs: 0, md: 8 }
          }
        }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            border: 1,
            borderColor: alpha('#000', 0.08),
            m: { xs: 2, md: 0 }
          }
        }}
      >
        <DialogTitle sx={{ p: 0 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 2,
              bgcolor: alpha('#667eea', 0.04),
              borderBottom: 1,
              borderColor: alpha(theme.palette.divider, 0.08)
            }}
          >
            <Typography variant="body1" fontWeight={600} fontSize="1.1rem">
              Información del Usuario
            </Typography>
            <IconButton size="small" onClick={handleCloseUserInfo}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {selectedUser && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
              {/* Avatar Grande */}
              <Avatar
                src={selectedUser.photoURL || selectedUser.photo || displayPhoto}
                alt={selectedUser.displayName || selectedUser.name || displayName}
                sx={{
                  width: 120,
                  height: 120,
                  mb: 2,
                  border: 3,
                  borderColor: 'primary.main',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                }}
              >
                {(!selectedUser.photoURL && !selectedUser.photo && !displayPhoto) && <PersonIcon sx={{ fontSize: 60 }} />}
              </Avatar>

              {/* Nombre */}
              <Typography variant="h5" fontWeight={600} gutterBottom>
                {selectedUser.displayName || selectedUser.name || displayName}
              </Typography>

              {/* Rol y Cargo */}
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                {selectedUser.role && (
                  <Chip
                    label={
                      selectedUser.role === 'ADMIN' ? 'Admin' :
                      selectedUser.role === 'GERENTE' ? 'Gerente' :
                      selectedUser.role === 'CONTADOR' ? 'Contador' :
                      selectedUser.role === 'VISUALIZADOR' ? 'Visualizador' :
                      selectedUser.role
                    }
                    color={
                      selectedUser.role === 'ADMIN' ? 'error' :
                      selectedUser.role === 'GERENTE' ? 'warning' :
                      selectedUser.role === 'CONTADOR' ? 'info' :
                      'default'
                    }
                    size="small"
                  />
                )}
                {selectedUser.position && (
                  <Chip
                    label={selectedUser.position}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>

              <Divider sx={{ width: '100%', mb: 3 }} />

              {/* 📊 Estadísticas del Chat */}
              {!stats.loading && (
                <Box sx={{ width: '100%', mb: 3 }}>
                  <Typography
                    variant="overline"
                    color="text.secondary"
                    sx={{
                      display: 'block',
                      mb: 1.5,
                      fontWeight: 600,
                      letterSpacing: 1
                    }}
                  >
                    Estadísticas de la Conversación
                  </Typography>

                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                    <Box
                      sx={{
                        p: 1.5,
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        borderRadius: 1,
                        border: 1,
                        borderColor: alpha(theme.palette.primary.main, 0.2),
                        textAlign: 'center'
                      }}
                    >
                      <ChatIcon sx={{ fontSize: 20, color: 'primary.main', mb: 0.5 }} />
                      <Typography variant="h6" fontWeight={700}>
                        {stats.totalMessages}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Mensajes
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        p: 1.5,
                        bgcolor: alpha(theme.palette.secondary.main, 0.05),
                        borderRadius: 1,
                        border: 1,
                        borderColor: alpha(theme.palette.secondary.main, 0.2),
                        textAlign: 'center'
                      }}
                    >
                      <AttachFileIcon sx={{ fontSize: 20, color: 'secondary.main', mb: 0.5 }} />
                      <Typography variant="h6" fontWeight={700}>
                        {stats.totalFiles}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Archivos
                      </Typography>
                    </Box>
                  </Box>

                  {stats.firstMessageDate && (
                    <Box sx={{ mt: 2 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          p: 1.5,
                          bgcolor: alpha('#000', 0.02),
                          borderRadius: 1
                        }}
                      >
                        <CalendarIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            En contacto desde
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {format(stats.firstMessageDate, "dd 'de' MMMM 'de' yyyy", { locale: es })}
                          </Typography>
                        </Box>
                      </Box>

                      {stats.lastActivityDate && (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            p: 1.5,
                            bgcolor: alpha('#000', 0.02),
                            borderRadius: 1,
                            mt: 1
                          }}
                        >
                          <ScheduleIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Última actividad
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {formatDistanceToNow(stats.lastActivityDate, { addSuffix: true, locale: es })}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              )}

              <Divider sx={{ width: '100%', mb: 3 }} />

              {/* Información adicional */}
              <Box sx={{ width: '100%' }}>
                {/* Email */}
                {selectedUser.email && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      p: 2,
                      mb: 1,
                      bgcolor: alpha('#000', 0.02),
                      borderRadius: 1,
                      border: 1,
                      borderColor: alpha('#000', 0.08)
                    }}
                  >
                    <EmailIcon color="primary" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Correo electrónico
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {selectedUser.email}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Teléfono */}
                {selectedUser.phone && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      p: 2,
                      mb: 1,
                      bgcolor: alpha('#000', 0.02),
                      borderRadius: 1,
                      border: 1,
                      borderColor: alpha('#000', 0.08)
                    }}
                  >
                    <PhoneIcon color="success" />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Teléfono / WhatsApp
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {selectedUser.phone}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => window.open(`https://wa.me/${selectedUser.phone.replace(/\D/g, '')}`, '_blank')}
                      sx={{
                        bgcolor: '#25D366',
                        color: 'white',
                        '&:hover': {
                          bgcolor: '#128C7E',
                          transform: 'scale(1.1)'
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <WhatsAppIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}

                {/* UID */}
                {selectedUser.uid && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      p: 2,
                      bgcolor: alpha('#000', 0.02),
                      borderRadius: 1,
                      border: 1,
                      borderColor: alpha('#000', 0.08)
                    }}
                  >
                    <BadgeIcon color="primary" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        ID de Usuario
                      </Typography>
                      <Typography 
                        variant="body2" 
                        fontWeight={500}
                        sx={{ 
                          fontFamily: 'monospace',
                          fontSize: '0.75rem'
                        }}
                      >
                        {selectedUser.uid.substring(0, 20)}...
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2.5, pt: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {/* Botones de acción principales */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, width: '100%' }}>
            <Button
              variant="outlined"
              startIcon={<AttachFileIcon />}
              onClick={() => {
                handleCloseUserInfo();
                setGalleryOpen(true);
              }}
              fullWidth
              sx={{ borderRadius: 1 }}
            >
              Archivos
            </Button>
            <Button
              variant="outlined"
              startIcon={<SearchIcon />}
              onClick={() => {
                handleCloseUserInfo();
                setSearchOpen(true);
              }}
              fullWidth
              sx={{ borderRadius: 1 }}
            >
              Buscar
            </Button>
          </Box>

          {/* Botones secundarios */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, width: '100%' }}>
            <Button
              variant="outlined"
              startIcon={<NotificationsOffIcon />}
              onClick={() => {
                // TODO: Implementar silenciar notificaciones
                alert('Función de silenciar en desarrollo');
              }}
              fullWidth
              sx={{ borderRadius: 1 }}
            >
              Silenciar
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDeleteDM}
              fullWidth
              sx={{ borderRadius: 1 }}
            >
              Eliminar
            </Button>
          </Box>

          {/* Botón cerrar */}
          <Button
            variant="contained"
            onClick={handleCloseUserInfo}
            fullWidth
            sx={{ boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)', mt: 1 }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* 👥 Diálogo de información del grupo */}
      <Dialog
        open={groupInfoDialogOpen}
        onClose={handleCloseGroupInfo}
        maxWidth="sm"
        fullWidth
        sx={{
          '& .MuiDialog-container': {
            alignItems: 'center',
            justifyContent: 'flex-end',
            pr: { xs: 0, md: 8 }
          }
        }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            border: 1,
            borderColor: alpha('#000', 0.08),
            m: { xs: 2, md: 0 }
          }
        }}
      >
        <DialogTitle sx={{ p: 0 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 2,
              bgcolor: alpha('#667eea', 0.04),
              borderBottom: 1,
              borderColor: alpha(theme.palette.divider, 0.08)
            }}
          >
            <Typography variant="body1" fontWeight={600} fontSize="1.1rem">
              Información del Grupo
            </Typography>
            <IconButton size="small" onClick={handleCloseGroupInfo}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {conversation && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Avatar del Grupo con controles */}
              <Box sx={{ position: 'relative', my: 3 }}>
                <Avatar
                  src={conversation.metadata?.groupPhoto || null}
                  sx={{
                    width: 120,
                    height: 120,
                    border: 3,
                    borderColor: 'primary.main',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    background: !conversation.metadata?.groupPhoto
                      ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
                      : undefined,
                    fontSize: '2.5rem',
                    fontWeight: 700
                  }}
                >
                  {!conversation.metadata?.groupPhoto && (
                    <GroupsIcon sx={{ fontSize: 60 }} />
                  )}
                </Avatar>

                {/* Loader al subir foto */}
                {uploadingGroupPhoto && (
                  <CircularProgress
                    size={120}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      zIndex: 1
                    }}
                  />
                )}

                {/* Botones de acción sobre la foto */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    display: 'flex',
                    gap: 0.5
                  }}
                >
                  {/* Botón para cambiar/agregar foto */}
                  <Tooltip title={conversation.metadata?.groupPhoto ? "Cambiar foto" : "Agregar foto"}>
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingGroupPhoto}
                        sx={{
                          bgcolor: 'primary.main',
                          color: 'white',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                          '&:hover': {
                            bgcolor: 'primary.dark',
                            transform: 'scale(1.1)'
                          },
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <PhotoIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>

                  {/* Botón para eliminar foto (solo si existe) */}
                  {conversation.metadata?.groupPhoto && (
                    <Tooltip title="Eliminar foto">
                      <span>
                        <IconButton
                          size="small"
                          onClick={handleDeleteGroupPhoto}
                          disabled={uploadingGroupPhoto}
                          sx={{
                            bgcolor: 'error.main',
                            color: 'white',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                            '&:hover': {
                              bgcolor: 'error.dark',
                              transform: 'scale(1.1)'
                            },
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                </Box>
              </Box>

              {/* Nombre del Grupo */}
              <Typography variant="h5" fontWeight={600} gutterBottom sx={{ px: 3, textAlign: 'center' }}>
                {conversation.metadata?.groupName || 'Grupo sin nombre'}
              </Typography>

              {/* Información del creador y fecha */}
              {conversation.metadata?.createdBy && (
                <Box sx={{ px: 3, mb: 2, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Creado por{' '}
                    <Typography component="span" variant="caption" fontWeight={600}>
                      {conversation.participantNames?.[conversation.metadata.createdBy] || 'Usuario'}
                    </Typography>
                  </Typography>
                  {conversation.createdAt && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      {format(new Date(conversation.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                    </Typography>
                  )}
                </Box>
              )}

              {/* Cantidad de miembros */}
              <Chip
                icon={<GroupsIcon />}
                label={`${conversation.participantIds?.length || 0} miembros`}
                color="primary"
                variant="outlined"
                sx={{ mb: 2 }}
              />

              <Divider sx={{ width: '100%', mb: 2 }} />

              {/* 📝 Descripción del Grupo */}
              <Box sx={{ width: '100%', px: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography
                    variant="overline"
                    color="text.secondary"
                    sx={{ fontWeight: 600, letterSpacing: 1 }}
                  >
                    Descripción
                  </Typography>
                  {conversation.metadata?.admins?.includes(currentUser?.uid) && !editingDescription && (
                    <IconButton size="small" onClick={() => setEditingDescription(true)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>

                {editingDescription ? (
                  <Box>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      value={groupDescription}
                      onChange={(e) => setGroupDescription(e.target.value)}
                      placeholder="Describe el propósito del grupo..."
                      variant="outlined"
                      sx={{ mb: 1 }}
                    />
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Button size="small" onClick={() => setEditingDescription(false)}>
                        Cancelar
                      </Button>
                      <Button size="small" variant="contained" onClick={handleSaveDescription}>
                        Guardar
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      p: 2,
                      bgcolor: alpha('#000', 0.02),
                      borderRadius: 1,
                      fontStyle: conversation.metadata?.description ? 'normal' : 'italic'
                    }}
                  >
                    {conversation.metadata?.description || 'Sin descripción'}
                  </Typography>
                )}
              </Box>

              <Divider sx={{ width: '100%', mb: 2 }} />

              {/* 📊 Estadísticas del Grupo */}
              {!stats.loading && (
                <Box sx={{ width: '100%', px: 3, mb: 3 }}>
                  <Typography
                    variant="overline"
                    color="text.secondary"
                    sx={{ display: 'block', mb: 1.5, fontWeight: 600, letterSpacing: 1 }}
                  >
                    Estadísticas del Grupo
                  </Typography>

                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, mb: 2 }}>
                    <Box
                      sx={{
                        p: 1.5,
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        borderRadius: 1,
                        border: 1,
                        borderColor: alpha(theme.palette.primary.main, 0.2),
                        textAlign: 'center'
                      }}
                    >
                      <ChatIcon sx={{ fontSize: 20, color: 'primary.main', mb: 0.5 }} />
                      <Typography variant="h6" fontWeight={700}>
                        {stats.totalMessages}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                        Mensajes
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        p: 1.5,
                        bgcolor: alpha(theme.palette.secondary.main, 0.05),
                        borderRadius: 1,
                        border: 1,
                        borderColor: alpha(theme.palette.secondary.main, 0.2),
                        textAlign: 'center'
                      }}
                    >
                      <AttachFileIcon sx={{ fontSize: 20, color: 'secondary.main', mb: 0.5 }} />
                      <Typography variant="h6" fontWeight={700}>
                        {stats.totalFiles}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                        Archivos
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        p: 1.5,
                        bgcolor: alpha(theme.palette.info.main, 0.05),
                        borderRadius: 1,
                        border: 1,
                        borderColor: alpha(theme.palette.info.main, 0.2),
                        textAlign: 'center'
                      }}
                    >
                      <MicIcon sx={{ fontSize: 20, color: 'info.main', mb: 0.5 }} />
                      <Typography variant="h6" fontWeight={700}>
                        {stats.totalAudios}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                        Audios
                      </Typography>
                    </Box>
                  </Box>

                  {/* Usuario más activo */}
                  {stats.mostActiveUser && (
                    <Box
                      sx={{
                        p: 1.5,
                        bgcolor: alpha(theme.palette.success.main, 0.05),
                        borderRadius: 1,
                        border: 1,
                        borderColor: alpha(theme.palette.success.main, 0.2)
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon sx={{ fontSize: 18, color: 'success.main' }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Miembro más activo
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {conversation.participantNames?.[stats.mostActiveUser.userId] || 'Usuario'}{' '}
                            <Typography component="span" variant="caption" color="text.secondary">
                              ({stats.mostActiveUser.messageCount} mensajes)
                            </Typography>
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  )}

                  {/* Última actividad */}
                  {stats.lastActivityDate && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        p: 1.5,
                        bgcolor: alpha('#000', 0.02),
                        borderRadius: 1,
                        mt: 1
                      }}
                    >
                      <ScheduleIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Última actividad
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {formatDistanceToNow(stats.lastActivityDate, { addSuffix: true, locale: es })}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              )}

              <Divider sx={{ width: '100%', mb: 2 }} />

              {/* Lista de Participantes */}
              <Box sx={{ width: '100%', px: 3, pb: 3 }}>
                <Typography
                  variant="overline"
                  color="text.secondary"
                  sx={{
                    display: 'block',
                    mb: 1.5,
                    fontWeight: 600,
                    letterSpacing: 1
                  }}
                >
                  Participantes
                </Typography>

                <List sx={{ p: 0 }}>
                  {conversation.participantIds?.map((participantId, index) => {
                    const participantName = conversation.participantNames?.[participantId] || 'Usuario';
                    const participantPhoto = conversation.participantPhotos?.[participantId] || null;
                    const isAdmin = conversation.metadata?.admins?.includes(participantId);
                    const isCurrentUser = participantId === currentUser?.uid;

                    return (
                      <ListItem
                        key={participantId}
                        sx={{
                          px: 0,
                          py: 1,
                          borderBottom: index < conversation.participantIds.length - 1 ? 1 : 0,
                          borderColor: alpha('#000', 0.05)
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            src={participantPhoto}
                            sx={{
                              width: 40,
                              height: 40,
                              background: !participantPhoto
                                ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
                                : undefined
                            }}
                          >
                            {!participantPhoto && <PersonIcon />}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" fontWeight={500}>
                                {participantName}
                              </Typography>
                              {isCurrentUser && (
                                <Chip label="Tú" size="small" color="primary" sx={{ height: 20, fontSize: '0.7rem' }} />
                              )}
                              {isAdmin && (
                                <Chip label="Admin" size="small" color="error" sx={{ height: 20, fontSize: '0.7rem' }} />
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </Box>

              {/* ⚙️ Configuraciones Avanzadas (Solo Admins) */}
              {conversation.metadata?.admins?.includes(currentUser?.uid) && (
                <Box sx={{ width: '100%', px: 3, pb: 2 }}>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box
                    onClick={() => setAdvancedSettingsOpen(!advancedSettingsOpen)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      p: 1.5,
                      bgcolor: alpha(theme.palette.warning.main, 0.05),
                      borderRadius: 1,
                      border: 1,
                      borderColor: alpha(theme.palette.warning.main, 0.2),
                      '&:hover': {
                        bgcolor: alpha(theme.palette.warning.main, 0.08)
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SettingsIcon sx={{ color: 'warning.main' }} />
                      <Typography variant="body2" fontWeight={600}>
                        Configuraciones Avanzadas
                      </Typography>
                    </Box>
                    {advancedSettingsOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </Box>

                  <Collapse in={advancedSettingsOpen}>
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={conversation.metadata?.settings?.onlyAdminsCanSend || false}
                            onChange={(e) => handleToggleSetting('onlyAdminsCanSend', e.target.checked)}
                            size="small"
                          />
                        }
                        label={
                          <Typography variant="body2">
                            Solo admins pueden enviar mensajes
                          </Typography>
                        }
                        sx={{ ml: 0 }}
                      />

                      <FormControlLabel
                        control={
                          <Switch
                            checked={conversation.metadata?.settings?.onlyAdminsCanEditInfo || false}
                            onChange={(e) => handleToggleSetting('onlyAdminsCanEditInfo', e.target.checked)}
                            size="small"
                          />
                        }
                        label={
                          <Typography variant="body2">
                            Solo admins pueden cambiar nombre/foto
                          </Typography>
                        }
                        sx={{ ml: 0 }}
                      />

                      <FormControlLabel
                        control={
                          <Switch
                            checked={conversation.metadata?.settings?.restrictLargeFiles || false}
                            onChange={(e) => handleToggleSetting('restrictLargeFiles', e.target.checked)}
                            size="small"
                          />
                        }
                        label={
                          <Typography variant="body2">
                            Restringir archivos pesados (&gt;10MB)
                          </Typography>
                        }
                        sx={{ ml: 0 }}
                      />

                      <FormControlLabel
                        control={
                          <Switch
                            checked={conversation.metadata?.settings?.muteAll || false}
                            onChange={(e) => handleToggleSetting('muteAll', e.target.checked)}
                            size="small"
                          />
                        }
                        label={
                          <Typography variant="body2">
                            Silenciar grupo para todos
                          </Typography>
                        }
                        sx={{ ml: 0 }}
                      />
                    </Box>
                  </Collapse>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2.5, pt: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {/* Botones de acción principales */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, width: '100%' }}>
            <Button
              variant="outlined"
              startIcon={<AttachFileIcon />}
              onClick={() => {
                handleCloseGroupInfo();
                setGalleryOpen(true);
              }}
              fullWidth
              sx={{ borderRadius: 1 }}
            >
              Archivos
            </Button>
            <Button
              variant="outlined"
              startIcon={<SearchIcon />}
              onClick={() => {
                handleCloseGroupInfo();
                setSearchOpen(true);
              }}
              fullWidth
              sx={{ borderRadius: 1 }}
            >
              Buscar
            </Button>
          </Box>

          {/* Botones secundarios (solo para admins o todos) */}
          <Box sx={{ display: 'grid', gridTemplateColumns: conversation.metadata?.admins?.includes(currentUser?.uid) ? '1fr 1fr' : '1fr', gap: 1, width: '100%' }}>
            {conversation.metadata?.admins?.includes(currentUser?.uid) && (
              <Button
                variant="outlined"
                color="primary"
                startIcon={<PersonAddIcon />}
                onClick={() => {
                  // TODO: Abrir modal para agregar participantes
                  alert('Función de agregar participantes en desarrollo');
                }}
                fullWidth
                sx={{ borderRadius: 1 }}
              >
                Agregar
              </Button>
            )}
            {conversation.metadata?.createdBy !== currentUser?.uid && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<ExitToAppIcon />}
                onClick={handleLeaveGroup}
                fullWidth
                sx={{ borderRadius: 1 }}
              >
                Abandonar
              </Button>
            )}
          </Box>

          {/* Botón cerrar */}
          <Button
            variant="contained"
            onClick={handleCloseGroupInfo}
            fullWidth
            sx={{ boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)', mt: 1 }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* 📎 Drawer de Galería de Archivos */}
      <Dialog
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 4px 20px rgba(0, 0, 0, 0.3)' 
              : '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`
          }
        }}
      >
        <DialogTitle
          sx={{
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
              : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2.5
          }}
        >
          <Box display="flex" alignItems="center" gap={1.5}>
            <Avatar
              sx={{
                bgcolor: alpha('#fff', 0.2),
                width: 36,
                height: 36
              }}
            >
              <PhotoIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                Archivos y Enlaces
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                {messages.filter(m => m.attachments?.length > 0).length} archivos compartidos
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={() => setGalleryOpen(false)}
            sx={{
              color: 'white',
              '&:hover': {
                bgcolor: alpha('#fff', 0.1)
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {/* Filtros por tipo */}
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              p: 2,
              borderBottom: 1,
              borderColor: 'divider',
              bgcolor: alpha('#000', 0.02)
            }}
          >
            <Chip
              label={`Todos (${messages.filter(m => m.attachments?.length > 0).flatMap(m => m.attachments).length})`}
              onClick={() => setGalleryFilter('all')}
              color={galleryFilter === 'all' ? 'primary' : 'default'}
              sx={{ fontWeight: galleryFilter === 'all' ? 600 : 400 }}
            />
            <Chip
              label={`Imágenes (${messages.filter(m => m.attachments?.length > 0).flatMap(m => m.attachments).filter(a => a.type?.startsWith('image/')).length})`}
              icon={<PhotoIcon />}
              onClick={() => setGalleryFilter('images')}
              color={galleryFilter === 'images' ? 'primary' : 'default'}
              sx={{ fontWeight: galleryFilter === 'images' ? 600 : 400 }}
            />
            <Chip
              label={`PDFs (${messages.filter(m => m.attachments?.length > 0).flatMap(m => m.attachments).filter(a => a.type === 'application/pdf' || a.name?.endsWith('.pdf')).length})`}
              icon={<PdfIcon />}
              onClick={() => setGalleryFilter('pdfs')}
              color={galleryFilter === 'pdfs' ? 'error' : 'default'}
              sx={{ fontWeight: galleryFilter === 'pdfs' ? 600 : 400 }}
            />
          </Box>

          {/* Grid de archivos */}
          <Box sx={{ p: 2, maxHeight: '60vh', overflow: 'auto' }}>
            {(() => {
              const allAttachments = messages
                .filter(m => m.attachments?.length > 0)
                .flatMap(m => m.attachments.map(att => ({
                  ...att,
                  messageDate: m.createdAt?.toDate?.() || new Date(m.createdAt)
                })));

              const filteredAttachments = allAttachments.filter(att => {
                if (galleryFilter === 'all') return true;
                if (galleryFilter === 'images') return att.type?.startsWith('image/');
                if (galleryFilter === 'pdfs') return att.type === 'application/pdf' || att.name?.endsWith('.pdf');
                return true;
              });

              if (filteredAttachments.length === 0) {
                return (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <PhotoIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                      No hay archivos de este tipo
                    </Typography>
                  </Box>
                );
              }

              return (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: 2
                  }}
                >
                  {filteredAttachments.map((attachment, idx) => {
                    const isImage = attachment.type?.startsWith('image/');
                    const isPdf = attachment.type === 'application/pdf' || attachment.name?.endsWith('.pdf');

                    return (
                      <Paper
                        key={idx}
                        elevation={0}
                        sx={{
                          position: 'relative',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                          borderRadius: 2,
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 8px 20px rgba(102, 126, 234, 0.25)',
                            borderColor: 'primary.main',
                            '& .hover-actions': {
                              opacity: 1
                            }
                          }
                        }}
                        onClick={() => handleFileClick(attachment)}
                      >
                        {/* Preview */}
                        <Box
                          sx={{
                            width: '100%',
                            height: 140,
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative'
                          }}
                        >
                          {isImage ? (
                            <Box
                              component="img"
                              src={attachment.url}
                              alt={attachment.name}
                              sx={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                            />
                          ) : isPdf ? (
                            <Box
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 1
                              }}
                            >
                              <PdfIcon sx={{ fontSize: 48, color: '#d32f2f' }} />
                              <Typography variant="caption" fontWeight={600} color="error">
                                PDF
                              </Typography>
                            </Box>
                          ) : (
                            <Box
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 1
                              }}
                            >
                              <FileIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                              <Typography variant="caption" fontWeight={600}>
                                Archivo
                              </Typography>
                            </Box>
                          )}

                          {/* Hover Actions */}
                          <Box
                            className="hover-actions"
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              bgcolor: alpha('#000', 0.6),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              opacity: 0,
                              transition: 'opacity 0.3s ease'
                            }}
                          >
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(attachment.url, '_blank');
                              }}
                              sx={{
                                bgcolor: 'white',
                                '&:hover': { bgcolor: alpha('#fff', 0.9) }
                              }}
                            >
                              <DownloadIcon />
                            </IconButton>
                          </Box>
                        </Box>

                        {/* Info */}
                        <Box sx={{ p: 1.5 }}>
                          <Typography
                            variant="caption"
                            fontWeight={600}
                            noWrap
                            sx={{ display: 'block', mb: 0.5 }}
                          >
                            {attachment.name || 'Archivo sin nombre'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
                            {attachment.messageDate?.toLocaleDateString('es-CO', {
                              day: '2-digit',
                              month: 'short'
                            })}
                          </Typography>
                        </Box>
                      </Paper>
                    );
                  })}
                </Box>
              );
            })()}
          </Box>
        </DialogContent>
      </Dialog>

      {/* 🖼️ MODAL VISOR PDF/IMAGEN PROFESIONAL - SPECTACULAR DESIGN */}
      <Dialog
        open={fileViewerOpen}
        onClose={handleCloseFileViewer}
        maxWidth="xl"
        fullWidth
        fullScreen={viewerSize === 'fullscreen'}
        PaperProps={{
          sx: {
            borderRadius: viewerSize === 'fullscreen' ? 0 : 2,
            background: theme.palette.background.paper,
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 4px 20px rgba(0, 0, 0, 0.3)'
              : '0 4px 20px rgba(0, 0, 0, 0.08)',
            height: viewerSize === 'fullscreen' ? '100vh' : '90vh',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          p: 3,
          pb: 2,
          background: theme.palette.mode === 'dark'
            ? `linear-gradient(135deg, ${alpha(theme.palette.grey[800], 0.95)} 0%, ${alpha(theme.palette.grey[900], 0.98)} 100%)`
            : `linear-gradient(135deg, ${alpha(theme.palette.grey[50], 0.95)} 0%, ${alpha(theme.palette.grey[100], 0.98)} 100%)`,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box display="flex" alignItems="center" gap={2}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <Avatar sx={{ 
                background: viewingFile?.type?.startsWith('image/')
                  ? `linear-gradient(135deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`
                  : `linear-gradient(135deg, ${theme.palette.error.main}, ${theme.palette.error.dark})`,
                width: 40,
                height: 40
              }}>
                {viewingFile?.type?.startsWith('image/') ? 
                  <ImageIcon sx={{ fontSize: 20 }} /> :
                  <PdfIcon sx={{ fontSize: 20 }} />
                }
              </Avatar>
            </motion.div>
            <Box>
              <Typography variant="h6" sx={{ 
                fontWeight: 600,
                color: theme.palette.text.primary,
                mb: 0.5
              }}>
                {viewingFile?.name || 'Archivo'}
              </Typography>
              <Typography variant="body2" sx={{ 
                color: theme.palette.text.secondary,
                fontSize: '0.85rem'
              }}>
                {viewingFile?.type?.startsWith('image/') ? 'Imagen' : 'Documento PDF'}
                {viewingFile?.messageDate && ` • ${viewingFile.messageDate.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}`}
              </Typography>
            </Box>
          </Box>
          
          <Box display="flex" alignItems="center" gap={1}>
            <Tooltip title={viewerSize === 'fullscreen' ? 'Salir de pantalla completa' : 'Pantalla completa'}>
              <IconButton
                onClick={() => setViewerSize(viewerSize === 'fullscreen' ? 'normal' : 'fullscreen')}
                sx={{ 
                  color: theme.palette.text.primary,
                  background: alpha(theme.palette.info.main, 0.08),
                  '&:hover': { 
                    background: alpha(theme.palette.info.main, 0.12),
                    transform: 'scale(1.05)'
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <OpenInNewIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Descargar">
              <IconButton
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = viewingFile.url;
                  link.download = viewingFile.name;
                  link.target = '_blank';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                sx={{ 
                  color: theme.palette.text.primary,
                  background: alpha(theme.palette.primary.main, 0.08),
                  '&:hover': { 
                    background: alpha(theme.palette.primary.main, 0.12),
                    transform: 'scale(1.05)'
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <DownloadIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            
            <IconButton
              onClick={handleCloseFileViewer}
              sx={{ 
                color: theme.palette.text.secondary,
                '&:hover': { 
                  color: theme.palette.error.main,
                  background: alpha(theme.palette.error.main, 0.08),
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <CloseIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ 
          p: 0, 
          bgcolor: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[50],
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          overflow: 'hidden'
        }}>
          {viewingFile?.type?.startsWith('image/') ? (
            <Box
              component="img"
              src={viewingFile.url}
              alt={viewingFile.name}
              sx={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                p: 2
              }}
            />
          ) : (
            <iframe
              src={viewingFile?.url}
              style={{
                width: '100%',
                height: '100%',
                border: 'none'
              }}
              title={viewingFile?.name || 'Documento'}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 🗑️ Modal de confirmación para eliminar conversación */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleting && setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 4px 20px rgba(0, 0, 0, 0.3)'
              : '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`
          }
        }}
      >
        <DialogTitle
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 2.5
          }}
        >
          <Avatar
            sx={{
              bgcolor: alpha('#fff', 0.2),
              width: 40,
              height: 40
            }}
          >
            <DeleteSweepIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              ⚠️ Eliminar historial completo
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Esta acción no se puede deshacer
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 3, pt: 3 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight={600} gutterBottom>
              Se eliminarán permanentemente:
            </Typography>
            <Typography variant="body2" component="div">
              • Todos los mensajes de la conversación<br />
              • Todos los archivos adjuntos (PDFs, imágenes, etc.)<br />
              • El historial completo para {conversation?.type === 'direct' ? 'ambos participantes' : 'todos los miembros del grupo'}
            </Typography>
          </Alert>

          <FormControlLabel
            control={
              <Checkbox
                checked={deleteConfirmChecked}
                onChange={(e) => setDeleteConfirmChecked(e.target.checked)}
                disabled={deleting}
                color="error"
              />
            }
            label={
              <Typography variant="body2" fontWeight={600}>
                Confirmo que deseo eliminar todo el historial
              </Typography>
            }
            sx={{
              m: 0,
              p: 2,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.error.main, 0.08),
              border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                bgcolor: alpha(theme.palette.error.main, 0.12)
              }
            }}
          />

          {messages.length > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
              📊 Total a eliminar: {messages.length} mensajes y {messages.filter(m => m.attachments?.length > 0).flatMap(m => m.attachments).length} archivos
            </Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2.5, pt: 0, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => {
              setDeleteDialogOpen(false);
              setDeleteConfirmChecked(false);
            }}
            disabled={deleting}
            fullWidth
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteConversation}
            disabled={!deleteConfirmChecked || deleting}
            fullWidth
            startIcon={deleting ? <CircularProgress size={20} color="inherit" /> : <DeleteSweepIcon />}
          >
            {deleting ? 'Eliminando...' : 'Eliminar todo'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
});

MessageThread.displayName = 'MessageThread';

export default MessageThread;
