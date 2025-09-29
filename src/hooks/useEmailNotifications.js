import { useState } from 'react';
import emailjs from '@emailjs/browser';

export const useEmailNotifications = () => {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  // Configuración EmailJS desde variables de entorno
  const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  // Inicializar EmailJS (se ejecuta una sola vez)
  const initEmailJS = () => {
    if (PUBLIC_KEY) {
      emailjs.init(PUBLIC_KEY);
      console.log('📧 EmailJS inicializado correctamente');
    } else {
      console.error('❌ EmailJS - Falta PUBLIC_KEY en variables de entorno');
    }
  };

  // Función principal para enviar notificaciones por email
  const sendEmailNotification = async (recipientEmail, templateData) => {
    setSending(true);
    setError(null);

    try {
      // Validar configuración
      if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY || 
          SERVICE_ID === 'tu-service-id-aqui' || 
          TEMPLATE_ID === 'tu-template-id-aqui' || 
          PUBLIC_KEY === 'tu-public-key-aqui') {
        
        // Modo demo - simular envío exitoso
        console.log('🎭 MODO DEMO - EmailJS no configurado');
        console.log('📧 Simulando envío de email a:', recipientEmail);
        console.log('📄 Datos del template:', templateData);
        
        // Simular delay de red
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return {
          status: 200,
          text: 'DEMO_SUCCESS - Email simulado enviado correctamente'
        };
      }

      // Inicializar EmailJS si no se ha hecho
      initEmailJS();

      // Preparar parámetros del template
      const templateParams = {
        to_email: recipientEmail,
        to_name: templateData.userName || 'Usuario',
        from_name: 'DR Group',
        company_name: 'DR Group',
        subject: templateData.subject || 'Notificación DR Group',
        message: templateData.message,
        notification_type: templateData.type || 'general',
        action_url: templateData.actionUrl || `${window.location.origin}/dashboard`,
        timestamp: new Date().toLocaleString('es-CO', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'America/Bogota'
        }),
        // Datos adicionales específicos del tipo de notificación
        ...templateData.additionalData
      };

      console.log('📧 Enviando email con parámetros:', templateParams);

      // Enviar email usando EmailJS
      const response = await emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        templateParams,
        PUBLIC_KEY
      );

      console.log('✅ Email enviado exitosamente:', response);
      
      return {
        success: true,
        messageId: response.text,
        status: response.status
      };

    } catch (error) {
      console.error('❌ Error enviando email:', error);
      setError(error.message);
      
      return {
        success: false,
        error: error.message
      };
    } finally {
      setSending(false);
    }
  };

  // Funciones específicas para diferentes tipos de notificaciones
  const sendUserCreatedNotification = async (userEmail, userData) => {
    return await sendEmailNotification(userEmail, {
      subject: '🎉 Bienvenido a DR Group - Tu cuenta ha sido creada',
      message: `Hola ${userData.displayName || userData.email},\n\nTu cuenta en el sistema DR Group ha sido creada exitosamente.\n\nPuedes acceder al dashboard usando tu email y contraseña.\n\n¡Bienvenido al equipo!`,
      type: 'user_created',
      userName: userData.displayName || userData.email,
      actionUrl: `${window.location.origin}/login`,
      additionalData: {
        user_role: userData.role || 'Usuario',
        created_by: userData.createdBy || 'Administrador',
        login_email: userEmail
      }
    });
  };

  const sendUserUpdatedNotification = async (userEmail, userData) => {
    return await sendEmailNotification(userEmail, {
      subject: '🔄 Tu información ha sido actualizada - DR Group',
      message: `Hola ${userData.displayName || userData.email},\n\nTu información de perfil en DR Group ha sido actualizada.\n\nSi no realizaste estos cambios, contacta al administrador inmediatamente.`,
      type: 'user_updated',
      userName: userData.displayName || userData.email,
      additionalData: {
        updated_fields: userData.updatedFields || 'Información general',
        updated_by: userData.updatedBy || 'Administrador'
      }
    });
  };

  const sendRoleChangedNotification = async (userEmail, userData) => {
    return await sendEmailNotification(userEmail, {
      subject: '🔐 Tu rol ha sido actualizado - DR Group',
      message: `Hola ${userData.displayName || userData.email},\n\nTu rol en el sistema DR Group ha sido actualizado a: ${userData.newRole}\n\nEsto puede cambiar tus permisos de acceso. Inicia sesión para ver los cambios.`,
      type: 'role_changed',
      userName: userData.displayName || userData.email,
      additionalData: {
        old_role: userData.oldRole || 'Usuario',
        new_role: userData.newRole || 'Usuario',
        changed_by: userData.changedBy || 'Administrador'
      }
    });
  };

  const sendTestNotification = async (userEmail, userName = 'Usuario') => {
    return await sendEmailNotification(userEmail, {
      subject: '🧪 Prueba de Notificación - DR Group',
      message: `¡Hola ${userName}!\n\nEsta es una prueba del sistema de notificaciones por email de DR Group.\n\nSi recibes este mensaje, la configuración está funcionando correctamente.`,
      type: 'test',
      userName: userName,
      additionalData: {
        test_timestamp: new Date().toISOString(),
        test_type: 'email_configuration'
      }
    });
  };

  // Estado y funciones expuestas
  return {
    // Estados
    sending,
    error,
    
    // Funciones principales
    sendEmailNotification,
    
    // Funciones específicas
    sendUserCreatedNotification,
    sendUserUpdatedNotification, 
    sendRoleChangedNotification,
    sendTestNotification,
    
    // Utilidades
    initEmailJS
  };
};