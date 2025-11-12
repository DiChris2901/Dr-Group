import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  limit,
  onSnapshot, 
  addDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../services/firebase';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat debe ser usado dentro de ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { user, userProfile } = useAuth();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // 🔥 LISTENER: Mensajes del chat general
  useEffect(() => {
    if (!user) {
      setMessages([]);
      setLoading(false);
      return;
    }

    console.log('🔥 Iniciando listener de chat...');
    setLoading(true);

    try {
      // Query: últimos 50 mensajes, ordenados por fecha descendente
      const chatsQuery = query(
        collection(db, 'chats'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const unsubscribe = onSnapshot(
        chatsQuery,
        (snapshot) => {
          const messagesData = snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              ...data,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
            };
          });

          // Invertir para mostrar del más antiguo al más reciente
          setMessages(messagesData.reverse());
          setLoading(false);

          console.log(`✅ ${messagesData.length} mensajes cargados`);
        },
        (error) => {
          console.error('❌ Error en listener de chat:', error);
          setLoading(false);
        }
      );

      return () => {
        console.log('🔚 Desconectando listener de chat');
        unsubscribe();
      };
    } catch (error) {
      console.error('❌ Error configurando listener:', error);
      setLoading(false);
    }
  }, [user]);

  // ✅ FUNCIÓN: Enviar mensaje de texto
  const sendMessage = useCallback(async (text) => {
    if (!user || !userProfile || !text?.trim()) {
      console.warn('⚠️ No se puede enviar: usuario no autenticado o texto vacío');
      return;
    }

    setSending(true);
    try {
      const messageData = {
        uid: user.uid,
        userName: userProfile.name || userProfile.displayName || user.email,
        userEmail: user.email,
        userPhoto: userProfile.photoURL || null,
        text: text.trim(),
        type: 'text',
        createdAt: serverTimestamp(),
        // Campos adicionales para compatibilidad con dashboard web
        displayName: userProfile.displayName || userProfile.name,
        photoURL: userProfile.photoURL || null
      };

      await addDoc(collection(db, 'chats'), messageData);
      console.log('✅ Mensaje enviado');
    } catch (error) {
      console.error('❌ Error enviando mensaje:', error);
      throw error;
    } finally {
      setSending(false);
    }
  }, [user, userProfile]);

  // ✅ FUNCIÓN: Enviar imagen
  const sendImage = useCallback(async (imageUri, text = '') => {
    if (!user || !userProfile || !imageUri) {
      console.warn('⚠️ No se puede enviar imagen: datos inválidos');
      return;
    }

    setSending(true);
    try {
      // Subir imagen a Firebase Storage
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      const filename = `chat-images/${user.uid}_${Date.now()}.jpg`;
      const storageRef = ref(storage, filename);
      
      console.log('📤 Subiendo imagen...');
      await uploadBytes(storageRef, blob);
      const imageUrl = await getDownloadURL(storageRef);
      console.log('✅ Imagen subida:', imageUrl);

      // Crear mensaje con imagen
      const messageData = {
        uid: user.uid,
        userName: userProfile.name || userProfile.displayName || user.email,
        userEmail: user.email,
        userPhoto: userProfile.photoURL || null,
        text: text.trim() || '',
        type: 'image',
        imageUrl: imageUrl,
        createdAt: serverTimestamp(),
        displayName: userProfile.displayName || userProfile.name,
        photoURL: userProfile.photoURL || null
      };

      await addDoc(collection(db, 'chats'), messageData);
      console.log('✅ Mensaje con imagen enviado');
    } catch (error) {
      console.error('❌ Error enviando imagen:', error);
      throw error;
    } finally {
      setSending(false);
    }
  }, [user, userProfile]);

  // ✅ FUNCIÓN: Enviar archivo
  const sendFile = useCallback(async (fileUri, fileName, mimeType, text = '') => {
    if (!user || !userProfile || !fileUri) {
      console.warn('⚠️ No se puede enviar archivo: datos inválidos');
      return;
    }

    setSending(true);
    try {
      // Subir archivo a Firebase Storage
      const response = await fetch(fileUri);
      const blob = await response.blob();
      
      const filename = `chat-files/${user.uid}_${Date.now()}_${fileName}`;
      const storageRef = ref(storage, filename);
      
      console.log('📤 Subiendo archivo...');
      await uploadBytes(storageRef, blob);
      const fileUrl = await getDownloadURL(storageRef);
      console.log('✅ Archivo subido:', fileUrl);

      // Crear mensaje con archivo
      const messageData = {
        uid: user.uid,
        userName: userProfile.name || userProfile.displayName || user.email,
        userEmail: user.email,
        userPhoto: userProfile.photoURL || null,
        text: text.trim() || '',
        type: 'file',
        fileUrl: fileUrl,
        fileName: fileName,
        mimeType: mimeType,
        createdAt: serverTimestamp(),
        displayName: userProfile.displayName || userProfile.name,
        photoURL: userProfile.photoURL || null
      };

      await addDoc(collection(db, 'chats'), messageData);
      console.log('✅ Mensaje con archivo enviado');
    } catch (error) {
      console.error('❌ Error enviando archivo:', error);
      throw error;
    } finally {
      setSending(false);
    }
  }, [user, userProfile]);

  const value = {
    messages,
    loading,
    sending,
    unreadCount,
    sendMessage,
    sendImage,
    sendFile
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
