/**
 * 🤖 Hook para el Asistente de IA
 * Gestiona el estado del chat y comunicación con Gemini
 */

import { useState, useCallback, useEffect } from 'react';
import { askAssistant, getSuggestions } from '../services/geminiService';
import { useAuth } from '../context/AuthContext';

export const useAssistant = () => {
  const { userProfile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState(null);

  // Cargar mensaje de bienvenida al iniciar
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage = {
        id: 'welcome',
        role: 'assistant',
        content: `¡Hola ${userProfile?.name?.split(' ')[0] || 'Usuario'}! 👋

Soy tu asistente inteligente de DR Group. Puedo ayudarte con:

🏢 Información de empresas (NIT, contactos, etc.)
💰 Consultas sobre pagos y compromisos
🎰 Datos de salas y liquidaciones
📊 Análisis y resúmenes financieros

**¿En qué puedo ayudarte hoy?**`,
        timestamp: new Date(),
        isWelcome: true
      };
      
      setMessages([welcomeMessage]);
    }
  }, [userProfile, messages.length]);

  // Cargar sugerencias
  useEffect(() => {
    const loadedSuggestions = getSuggestions();
    setSuggestions(loadedSuggestions);
  }, []);

  // 💬 Enviar mensaje
  const sendMessage = useCallback(async (question) => {
    if (!question || question.trim().length === 0) return;

    const questionTrimmed = question.trim();

    // Agregar mensaje del usuario
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: questionTrimmed,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    setError(null);

    try {
      // Llamar a Gemini con contexto de Firebase + historial de conversación
      const conversationHistory = messages.filter(m => !m.isWelcome).slice(-6); // Últimos 6 mensajes
      const response = await askAssistant(questionTrimmed, userProfile, conversationHistory);
      
      // Agregar respuesta del asistente
      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.answer,
        sources: response.sources || [],
        context: response.context,
        timestamp: new Date(),
        success: response.success
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      if (!response.success) {
        setError(response.error);
      }
      
    } catch (err) {
      console.error('Error enviando mensaje:', err);
      
      const errorMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Lo siento, ocurrió un error inesperado. Por favor intenta de nuevo.',
        error: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setError(err.message);
    } finally {
      setIsTyping(false);
    }
  }, [userProfile]);

  // 🧹 Limpiar chat
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  // 🔄 Reiniciar chat
  const resetChat = useCallback(() => {
    const welcomeMessage = {
      id: 'welcome-reset',
      role: 'assistant',
      content: `Chat reiniciado. ¿En qué más puedo ayudarte?`,
      timestamp: new Date()
    };
    
    setMessages([welcomeMessage]);
    setError(null);
  }, []);

  // 💡 Usar sugerencia
  const useSuggestion = useCallback((suggestion) => {
    sendMessage(suggestion);
  }, [sendMessage]);

  return {
    messages,
    isTyping,
    suggestions,
    error,
    sendMessage,
    clearMessages,
    resetChat,
    useSuggestion
  };
};
