import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import ChatMessage from './ChatMessage';

const ChatScreen = ({ navigation }) => {
  const { messages, loading, sending, sendMessage, sendImage, sendFile, setIsInChatScreen } = useChat();
  const { user } = useAuth();
  const { getPrimaryColor } = useTheme();
  
  const [messageText, setMessageText] = useState('');
  const flatListRef = useRef(null);
  
  const primaryColor = getPrimaryColor();

  // ✅ PASO 3.5: Informar cuando usuario está en ChatScreen
  useEffect(() => {
    setIsInChatScreen(true);
    console.log('🟢 Usuario entró a ChatScreen');

    return () => {
      setIsInChatScreen(false);
      console.log('🔴 Usuario salió de ChatScreen');
    };
  }, []);

  // Auto-scroll al final cuando llegan nuevos mensajes
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      // Pequeño delay para asegurar que el FlatList se haya renderizado
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Función para enviar mensaje de texto
  const handleSendMessage = async () => {
    if (!messageText.trim() || sending) return;

    const text = messageText;
    setMessageText(''); // Limpiar input inmediatamente
    
    try {
      await sendMessage(text);
    } catch (error) {
      Alert.alert('Error', 'No se pudo enviar el mensaje');
      setMessageText(text); // Restaurar texto si falla
    }
  };

  // Función para seleccionar y enviar imagen
  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permiso denegado', 'Necesitas dar permiso para acceder a las fotos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7, // Comprimir imagen
      });

      if (!result.canceled && result.assets[0]) {
        await sendImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error seleccionando imagen:', error);
      Alert.alert('Error', 'No se pudo cargar la imagen');
    }
  };

  // Función para seleccionar y enviar archivo
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true
      });

      if (result.type === 'success') {
        await sendFile(result.uri, result.name, result.mimeType);
      }
    } catch (error) {
      console.error('Error seleccionando archivo:', error);
      Alert.alert('Error', 'No se pudo cargar el archivo');
    }
  };

  // Renderizar cada mensaje
  const renderMessage = ({ item }) => {
    const isOwnMessage = item.uid === user?.uid;
    return (
      <ChatMessage 
        message={item} 
        isOwnMessage={isOwnMessage}
        primaryColor={primaryColor}
      />
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={primaryColor} />
        <Text style={styles.loadingText}>Cargando mensajes...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: primaryColor }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>💬 Chat General</Text>
      </View>

      {/* Lista de mensajes */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyText}>No hay mensajes aún</Text>
            <Text style={styles.emptySubtext}>Sé el primero en escribir algo</Text>
          </View>
        }
      />

      {/* Input de mensaje */}
      <View style={styles.inputContainer}>
        {/* Botones de adjuntar */}
        <TouchableOpacity 
          style={styles.attachButton}
          onPress={handlePickImage}
          disabled={sending}
        >
          <Text style={styles.attachIcon}>🖼️</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.attachButton}
          onPress={handlePickDocument}
          disabled={sending}
        >
          <Text style={styles.attachIcon}>📎</Text>
        </TouchableOpacity>

        {/* Input de texto */}
        <TextInput
          style={styles.input}
          placeholder="Escribe un mensaje..."
          value={messageText}
          onChangeText={setMessageText}
          multiline
          maxLength={500}
          editable={!sending}
        />

        {/* Botón de enviar */}
        <TouchableOpacity 
          style={[
            styles.sendButton,
            { backgroundColor: primaryColor },
            (!messageText.trim() || sending) && styles.sendButtonDisabled
          ]}
          onPress={handleSendMessage}
          disabled={!messageText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendIcon}>➤</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 12,
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  backButton: {
    marginRight: 12
  },
  backButtonText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '600'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff'
  },
  messagesList: {
    paddingVertical: 12
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0'
  },
  attachButton: {
    padding: 8,
    marginRight: 4
  },
  attachIcon: {
    fontSize: 24
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 15,
    maxHeight: 100,
    marginRight: 8
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4
  },
  sendButtonDisabled: {
    opacity: 0.5
  },
  sendIcon: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600'
  }
});

export default ChatScreen;
