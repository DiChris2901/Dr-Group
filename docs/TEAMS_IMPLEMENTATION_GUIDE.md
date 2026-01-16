# 🛠️ Guía de Implementación Técnica: Microsoft Teams Integration

**Referencia:** TEAMS_INTEGRATION_PLAN.md

Esta guía contiene el código específico y pasos técnicos para implementar cada fase.

---

## 📦 FASE 1: Setup y Autenticación

### 1.1 Instalar Dependencias

```bash
npm install @azure/msal-react @azure/msal-browser
npm install @microsoft/microsoft-graph-client
npm install @microsoft/mgt-react @microsoft/mgt-msal2-provider
npm install @microsoft/teams-js
```

### 1.2 Crear `src/config/msalConfig.js`

```javascript
import { LogLevel } from '@azure/msal-browser';

export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_MSAL_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_MSAL_TENANT_ID}`,
    redirectUri: import.meta.env.VITE_MSAL_REDIRECT_URI
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            return;
          case LogLevel.Info:
            console.info(message);
            return;
          case LogLevel.Verbose:
            console.debug(message);
            return;
          case LogLevel.Warning:
            console.warn(message);
            return;
        }
      }
    }
  }
};

export const loginRequest = {
  scopes: [
    'User.Read',
    'Chat.Read',
    'Chat.ReadWrite',
    'ChannelMessage.Read.All',
    'ChannelMessage.Send',
    'Files.Read.All',
    'Presence.Read'
  ]
};

export const graphConfig = {
  graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me',
  graphChatsEndpoint: 'https://graph.microsoft.com/v1.0/me/chats'
};
```

### 1.3 Crear `.env.local`

```env
VITE_MSAL_CLIENT_ID=your-client-id-here
VITE_MSAL_TENANT_ID=your-tenant-id-here
VITE_MSAL_REDIRECT_URI=http://localhost:5174
```

### 1.4 Actualizar `src/main.jsx`

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from './config/msalConfig';
import App from './App.jsx';

const msalInstance = new PublicClientApplication(msalConfig);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MsalProvider instance={msalInstance}>
      <App />
    </MsalProvider>
  </React.StrictMode>
);
```

### 1.5 Crear `src/hooks/useTeamsAuth.js`

```javascript
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { loginRequest } from '../config/msalConfig';

export function useTeamsAuth() {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  const login = async () => {
    try {
      await instance.loginPopup(loginRequest);
    } catch (error) {
      console.error('Error al iniciar sesión en Teams:', error);
      throw error;
    }
  };

  const logout = () => {
    instance.logoutPopup();
  };

  const getAccessToken = async () => {
    if (!accounts[0]) return null;
    
    try {
      const response = await instance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0]
      });
      return response.accessToken;
    } catch (error) {
      console.error('Error obteniendo token:', error);
      // Si falla token silencioso, intentar interactivo
      try {
        const response = await instance.acquireTokenPopup(loginRequest);
        return response.accessToken;
      } catch (popupError) {
        console.error('Error en popup de token:', popupError);
        return null;
      }
    }
  };

  return {
    login,
    logout,
    getAccessToken,
    isAuthenticated,
    account: accounts[0] || null
  };
}
```

---

## 📊 FASE 2: Cliente Microsoft Graph

### 2.1 Crear `src/utils/graphClient.js`

```javascript
import { Client } from '@microsoft/microsoft-graph-client';

export function createGraphClient(accessToken) {
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    }
  });
}

export async function getUserProfile(client) {
  try {
    return await client.api('/me').get();
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    throw error;
  }
}

export async function getChats(client) {
  try {
    const response = await client
      .api('/me/chats')
      .expand('members')
      .orderby('lastMessageReceivedDateTime desc')
      .top(50)
      .get();
    
    return response.value;
  } catch (error) {
    console.error('Error obteniendo chats:', error);
    throw error;
  }
}

export async function getChatMessages(client, chatId) {
  try {
    const response = await client
      .api(`/chats/${chatId}/messages`)
      .orderby('createdDateTime desc')
      .top(50)
      .get();
    
    return response.value.reverse(); // Orden cronológico
  } catch (error) {
    console.error('Error obteniendo mensajes:', error);
    throw error;
  }
}

export async function sendChatMessage(client, chatId, message) {
  try {
    const chatMessage = {
      body: {
        content: message
      }
    };
    
    return await client
      .api(`/chats/${chatId}/messages`)
      .post(chatMessage);
  } catch (error) {
    console.error('Error enviando mensaje:', error);
    throw error;
  }
}

export async function getUserPresence(client, userId) {
  try {
    return await client
      .api(`/users/${userId}/presence`)
      .get();
  } catch (error) {
    console.error('Error obteniendo presencia:', error);
    return { availability: 'Offline' };
  }
}
```

### 2.2 Crear `src/hooks/useTeamsChats.js`

```javascript
import { useState, useEffect } from 'react';
import { useTeamsAuth } from './useTeamsAuth';
import { createGraphClient, getChats } from '../utils/graphClient';

export function useTeamsChats() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { getAccessToken, isAuthenticated } = useTeamsAuth();

  const fetchChats = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const token = await getAccessToken();
      if (!token) throw new Error('No se pudo obtener token');

      const client = createGraphClient(token);
      const chatsData = await getChats(client);
      setChats(chatsData);
      setError(null);
    } catch (err) {
      console.error('Error cargando chats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [isAuthenticated]);

  return {
    chats,
    loading,
    error,
    refetch: fetchChats
  };
}
```

### 2.3 Crear `src/hooks/useTeamsMessages.js`

```javascript
import { useState, useEffect } from 'react';
import { useTeamsAuth } from './useTeamsAuth';
import { createGraphClient, getChatMessages, sendChatMessage } from '../utils/graphClient';

export function useTeamsMessages(chatId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const { getAccessToken, isAuthenticated } = useTeamsAuth();

  const fetchMessages = async () => {
    if (!chatId || !isAuthenticated) return;

    try {
      setLoading(true);
      const token = await getAccessToken();
      if (!token) throw new Error('No se pudo obtener token');

      const client = createGraphClient(token);
      const messagesData = await getChatMessages(client, chatId);
      setMessages(messagesData);
      setError(null);
    } catch (err) {
      console.error('Error cargando mensajes:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (messageText) => {
    if (!chatId || !messageText.trim()) return;

    try {
      setSending(true);
      const token = await getAccessToken();
      if (!token) throw new Error('No se pudo obtener token');

      const client = createGraphClient(token);
      await sendChatMessage(client, chatId, messageText);
      
      // Recargar mensajes después de enviar
      await fetchMessages();
    } catch (err) {
      console.error('Error enviando mensaje:', err);
      throw err;
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [chatId, isAuthenticated]);

  return {
    messages,
    loading,
    sending,
    error,
    sendMessage,
    refetch: fetchMessages
  };
}
```

---

## 🎨 FASE 3: Componentes UI

### 3.1 Crear `src/components/teams/ChatList.jsx`

```javascript
import React from 'react';
import {
  Box,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Badge,
  Skeleton,
  alpha,
  useTheme
} from '@mui/material';
import { useTeamsChats } from '../../hooks/useTeamsChats';

export default function ChatList({ selectedChatId, onSelectChat }) {
  const theme = useTheme();
  const { chats, loading, error } = useTeamsChats();

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Box key={i} sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Skeleton variant="circular" width={40} height={40} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="80%" />
              <Skeleton variant="text" width="60%" />
            </Box>
          </Box>
        ))}
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="error">
          Error cargando conversaciones: {error}
        </Typography>
      </Box>
    );
  }

  const getChatTitle = (chat) => {
    if (chat.topic) return chat.topic;
    const otherMembers = chat.members?.filter(m => m.userId !== 'you') || [];
    return otherMembers.map(m => m.displayName).join(', ') || 'Chat sin nombre';
  };

  return (
    <Paper
      elevation={0}
      sx={{
        height: '100%',
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        overflow: 'hidden'
      }}
    >
      <List sx={{ p: 0 }}>
        {chats.map((chat) => (
          <ListItem
            key={chat.id}
            button
            selected={chat.id === selectedChatId}
            onClick={() => onSelectChat(chat.id)}
            sx={{
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              transition: 'all 0.2s ease',
              '&.Mui-selected': {
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.12)
                }
              },
              '&:hover': {
                bgcolor: alpha(theme.palette.action.hover, 0.04)
              }
            }}
          >
            <ListItemAvatar>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                variant="dot"
                sx={{
                  '& .MuiBadge-badge': {
                    backgroundColor: theme.palette.success.main,
                    width: 10,
                    height: 10,
                    borderRadius: '50%'
                  }
                }}
              >
                <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                  {getChatTitle(chat).charAt(0).toUpperCase()}
                </Avatar>
              </Badge>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {getChatTitle(chat)}
                </Typography>
              }
              secondary={
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.text.secondary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {chat.lastMessagePreview?.content || 'Sin mensajes'}
                </Typography>
              }
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}
```

### 3.2 Crear `src/components/teams/ChatWindow.jsx`

```javascript
import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  CircularProgress,
  alpha,
  useTheme
} from '@mui/material';
import { Send } from '@mui/icons-material';
import { useTeamsMessages } from '../../hooks/useTeamsMessages';
import MessageBubble from './MessageBubble';

export default function ChatWindow({ chatId }) {
  const theme = useTheme();
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef(null);
  const { messages, loading, sending, sendMessage } = useTeamsMessages(chatId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!messageInput.trim() || sending) return;

    try {
      await sendMessage(messageInput);
      setMessageInput('');
    } catch (error) {
      console.error('Error enviando mensaje:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!chatId) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'grid',
          placeItems: 'center',
          color: theme.palette.text.secondary
        }}
      >
        <Typography variant="body1">
          Selecciona una conversación para comenzar
        </Typography>
      </Box>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        height: '100%',
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Mensajes */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1
        }}
      >
        {loading ? (
          <Box sx={{ display: 'grid', placeItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input de mensaje */}
      <Box
        sx={{
          p: 2,
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.2)}`
        }}
      >
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Escribe un mensaje..."
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={sending}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1
              }
            }}
          />
          <IconButton
            color="primary"
            onClick={handleSend}
            disabled={!messageInput.trim() || sending}
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.2)
              }
            }}
          >
            {sending ? <CircularProgress size={24} /> : <Send />}
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
}
```

### 3.3 Crear `src/components/teams/MessageBubble.jsx`

```javascript
import React from 'react';
import { Box, Typography, alpha, useTheme } from '@mui/material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function MessageBubble({ message }) {
  const theme = useTheme();
  const isMe = message.from?.user?.displayName === 'Tú'; // Ajustar lógica

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isMe ? 'flex-end' : 'flex-start',
        mb: 1
      }}
    >
      <Box
        sx={{
          maxWidth: '70%',
          bgcolor: isMe
            ? theme.palette.primary.main
            : alpha(theme.palette.divider, 0.1),
          color: isMe ? 'white' : theme.palette.text.primary,
          borderRadius: 2,
          p: 1.5,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
        }}
      >
        {!isMe && (
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              color: isMe ? 'rgba(255,255,255,0.9)' : theme.palette.primary.main,
              display: 'block',
              mb: 0.5
            }}
          >
            {message.from?.user?.displayName || 'Usuario'}
          </Typography>
        )}
        <Typography variant="body2">
          {message.body?.content || ''}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: isMe ? 'rgba(255,255,255,0.7)' : theme.palette.text.secondary,
            display: 'block',
            mt: 0.5,
            fontSize: '0.65rem'
          }}
        >
          {format(new Date(message.createdDateTime), 'HH:mm', { locale: es })}
        </Typography>
      </Box>
    </Box>
  );
}
```

### 3.4 Crear `src/pages/ConversationsPage.jsx`

```javascript
import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  alpha,
  useTheme
} from '@mui/material';
import { Chat } from '@mui/icons-material';
import { useTeamsAuth } from '../hooks/useTeamsAuth';
import ChatList from '../components/teams/ChatList';
import ChatWindow from '../components/teams/ChatWindow';

export default function ConversationsPage() {
  const theme = useTheme();
  const [selectedChatId, setSelectedChatId] = useState(null);
  const { login, isAuthenticated } = useTeamsAuth();

  if (!isAuthenticated) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: 2,
              mx: 'auto',
              mb: 2,
              display: 'grid',
              placeItems: 'center',
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              color: theme.palette.primary.main
            }}
          >
            <Chat sx={{ fontSize: 40 }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
            Conecta con Microsoft Teams
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 3 }}>
            Inicia sesión con tu cuenta de Microsoft para acceder a tus conversaciones
          </Typography>
          <Button
            variant="contained"
            onClick={login}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Conectar con Teams
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Paper
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          borderRadius: 2,
          p: 3,
          mb: 3,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'white' }}>
          Conversaciones
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
          Chat integrado con Microsoft Teams
        </Typography>
      </Paper>

      {/* Chat Container */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '350px 1fr' },
          gap: 2,
          height: 'calc(100vh - 280px)'
        }}
      >
        <ChatList
          selectedChatId={selectedChatId}
          onSelectChat={setSelectedChatId}
        />
        <ChatWindow chatId={selectedChatId} />
      </Box>
    </Container>
  );
}
```

---

## 🔄 Integración con Dashboard

### Agregar ruta en `src/App.jsx`

```javascript
import ConversationsPage from './pages/ConversationsPage';

// En las rutas:
<Route path="/conversations" element={<ConversationsPage />} />
```

### Agregar item en Sidebar

```javascript
// En src/components/layout/Sidebar.jsx
import { Chat } from '@mui/icons-material';

const menuItems = [
  // ... otros items
  {
    title: 'Conversaciones',
    icon: Chat,
    path: '/conversations',
    color: '#0078d4', // Color de Teams
    permission: 'teams' // Agregar permiso si es necesario
  }
];
```

---

## ✅ Checklist de Testing

- [ ] Autenticación con Azure AD funciona
- [ ] Se obtienen chats correctamente
- [ ] Se muestran mensajes en orden cronológico
- [ ] Se puede enviar mensaje
- [ ] Scroll automático funciona
- [ ] Diseño es responsivo
- [ ] Loading states funcionan
- [ ] Error handling funciona
- [ ] Token refresh automático funciona
- [ ] Logout limpia sesión correctamente

---

## 🐛 Troubleshooting Común

### Error: "AADSTS65001: User consent required"
**Solución:** Ir a Azure Portal → App Registration → API Permissions → "Grant admin consent"

### Error: "InvalidAuthenticationToken"
**Solución:** Verificar que los scopes en `loginRequest` coincidan con los permisos en Azure AD

### Error: "CORS policy"
**Solución:** Verificar que el redirect URI esté configurado correctamente en Azure AD

### Chats no cargan
**Solución:** Verificar que el usuario tenga Teams activado y chats existentes

---

**Siguiente:** Ver TEAMS_INTEGRATION_PLAN.md para contexto general y fases de desarrollo.
