import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking } from 'react-native';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ChatMessage = ({ message, isOwnMessage, primaryColor }) => {
  const handleFilePress = () => {
    if (message.fileUrl || message.imageUrl) {
      Linking.openURL(message.fileUrl || message.imageUrl);
    }
  };

  return (
    <View style={[
      styles.container,
      isOwnMessage ? styles.ownMessage : styles.otherMessage
    ]}>
      {/* Avatar (solo para mensajes de otros) */}
      {!isOwnMessage && (
        <Image 
          source={{ uri: message.userPhoto || message.photoURL || 'https://via.placeholder.com/28' }} 
          style={styles.avatar}
        />
      )}

      <View style={styles.content}>
        {/* Nombre del usuario (solo para mensajes de otros) */}
        {!isOwnMessage && (
          <Text style={styles.userName}>
            {message.userName || message.displayName || 'Usuario'}
          </Text>
        )}

        {/* Burbuja del mensaje */}
        <View style={[
          styles.bubble,
          isOwnMessage 
            ? { backgroundColor: `${primaryColor}1A` } // alpha 0.1
            : styles.otherBubble
        ]}>
          {/* Imagen adjunta */}
          {message.type === 'image' && message.imageUrl && (
            <TouchableOpacity onPress={handleFilePress}>
              <Image 
                source={{ uri: message.imageUrl }} 
                style={styles.messageImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}

          {/* Archivo adjunto */}
          {message.type === 'file' && message.fileUrl && (
            <TouchableOpacity 
              style={styles.fileContainer}
              onPress={handleFilePress}
            >
              <Text style={styles.fileIcon}>📎</Text>
              <Text style={styles.fileName} numberOfLines={1}>
                {message.fileName || 'Archivo'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Texto del mensaje */}
          {message.text && (
            <Text style={[
              styles.messageText,
              isOwnMessage && styles.ownMessageText
            ]}>
              {message.text}
            </Text>
          )}
        </View>

        {/* Hora del mensaje */}
        <Text style={[
          styles.timestamp,
          isOwnMessage && styles.ownTimestamp
        ]}>
          {message.createdAt ? format(message.createdAt, 'HH:mm', { locale: es }) : ''}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 12,
    alignItems: 'flex-end'
  },
  ownMessage: {
    justifyContent: 'flex-end'
  },
  otherMessage: {
    justifyContent: 'flex-start'
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    backgroundColor: '#e0e0e0'
  },
  content: {
    maxWidth: '75%'
  },
  userName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
    marginLeft: 12
  },
  bubble: {
    borderRadius: 16,
    padding: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2
  },
  otherBubble: {
    backgroundColor: '#f0f0f0'
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 4
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    marginBottom: 4
  },
  fileIcon: {
    fontSize: 20,
    marginRight: 8
  },
  fileName: {
    fontSize: 14,
    color: '#333',
    flex: 1
  },
  messageText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 20
  },
  ownMessageText: {
    color: '#222'
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    marginLeft: 12
  },
  ownTimestamp: {
    textAlign: 'right',
    marginRight: 12,
    marginLeft: 0
  }
});

export default React.memo(ChatMessage);
