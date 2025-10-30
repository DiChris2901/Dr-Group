/**
 * Hook para gestionar notificaciones vía Telegram Bot
 * DR Group Dashboard - Sistema de Notificaciones
 */

import { useState } from 'react';

export const useTelegramNotifications = () => {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  // Configuración del Bot desde variables de entorno
  const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
  const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

  /**
   * Enviar mensaje de Telegram con soporte de prioridad
   */
  const sendTelegramMessage = async (chatId, message, options = {}) => {
    if (!BOT_TOKEN) {
      throw new Error('❌ VITE_TELEGRAM_BOT_TOKEN no configurado en .env');
    }

    if (!chatId) {
      throw new Error('❌ Chat ID de Telegram no proporcionado');
    }

    // Convertir chatId a número si es string
    const numericChatId = typeof chatId === 'string' ? parseInt(chatId, 10) : chatId;
    
    // Configurar prioridad
    const priority = options.priority || 'normal';
    const silent = priority === 'low' || options.silent || false;
    
    // Agregar emoji según prioridad si no está en el mensaje
    let finalMessage = message;
    if (!message.startsWith('�') && !message.startsWith('⚠️') && !message.startsWith('📌') && !message.startsWith('📝')) {
      const priorityEmoji = {
        critical: '🔴 ',
        high: '⚠️ ',
        normal: '📌 ',
        low: '📝 '
      };
      finalMessage = (priorityEmoji[priority] || '') + message;
    }
    
    console.log('�🔍 Telegram Debug:', {
      originalChatId: chatId,
      numericChatId,
      priority,
      silent,
      type: typeof numericChatId,
      botToken: BOT_TOKEN ? '✅ Configurado' : '❌ Faltante'
    });

    setSending(true);
    setError(null);

    try {
      const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: numericChatId,
          text: message,
          parse_mode: 'HTML',
          disable_web_page_preview: options.disablePreview || false,
          ...options
        })
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.description || 'Error al enviar mensaje de Telegram');
      }

      console.log('✅ Telegram - Mensaje enviado:', data.result.message_id);
      return { success: true, messageId: data.result.message_id };

    } catch (err) {
      console.error('❌ Error enviando mensaje de Telegram:', err);
      setError(err.message);
      throw err;
    } finally {
      setSending(false);
    }
  };

  /**
   * Verificar Chat ID de Telegram
   */
  const verifyChatId = async (chatId) => {
    try {
      // Convertir chatId a número si es string
      const numericChatId = typeof chatId === 'string' ? parseInt(chatId, 10) : chatId;
      
      const response = await fetch(`${TELEGRAM_API_URL}/getChat?chat_id=${numericChatId}`);
      const data = await response.json();
      
      if (!data.ok) {
        throw new Error('Chat ID inválido o bot no iniciado');
      }

      return {
        valid: true,
        username: data.result.username || null,
        firstName: data.result.first_name || null,
        type: data.result.type
      };
    } catch (err) {
      return { valid: false, error: err.message };
    }
  };

  /**
   * Formatear mensaje HTML para Telegram
   */
  const formatTelegramMessage = (title, content, footer = null) => {
    let message = `<b>🔔 ${title}</b>\n\n`;
    message += content;
    if (footer) {
      message += `\n\n<i>${footer}</i>`;
    }
    return message;
  };

  // ===== NOTIFICACIONES ESPECÍFICAS =====

  /**
   * 👤 Usuario Creado
   */
  const sendUserCreatedNotification = async (chatId, userData) => {
    const message = formatTelegramMessage(
      'Nuevo Usuario Creado',
      `👤 <b>${userData.displayName}</b>\n` +
      `📧 ${userData.email}\n` +
      `🎭 Rol: <b>${userData.role}</b>\n` +
      `👨‍💼 Creado por: ${userData.createdBy}`,
      'DR Group Dashboard'
    );

    return await sendTelegramMessage(chatId, message);
  };

  /**
   * ✏️ Usuario Actualizado
   */
  const sendUserUpdatedNotification = async (chatId, userData) => {
    const message = formatTelegramMessage(
      'Usuario Actualizado',
      `👤 <b>${userData.displayName}</b>\n` +
      `📧 ${userData.email}\n` +
      `🔄 Actualizado por: ${userData.updatedBy}`,
      'DR Group Dashboard'
    );

    return await sendTelegramMessage(chatId, message);
  };

  /**
   * 🎭 Rol Cambiado
   */
  const sendRoleChangedNotification = async (chatId, roleData) => {
    const message = formatTelegramMessage(
      '⚠️ Rol Modificado',
      `👤 <b>${roleData.userName}</b>\n` +
      `📧 ${roleData.userEmail}\n` +
      `🔄 ${roleData.oldRole} → <b>${roleData.newRole}</b>\n` +
      `👨‍💼 Modificado por: ${roleData.changedBy}`,
      'Cambio de permisos crítico'
    );

    return await sendTelegramMessage(chatId, message);
  };

  /**
   * 🚨 Compromiso Vencido
   */
  const sendCommitmentOverdueNotification = async (chatId, commitmentData) => {
    const message = formatTelegramMessage(
      '🚨 COMPROMISO VENCIDO',
      `🏢 <b>${commitmentData.companyName}</b>\n` +
      `💼 ${commitmentData.concept}\n` +
      `💰 <b>${commitmentData.amount}</b>\n` +
      `📅 Vencimiento: ${commitmentData.dueDate}\n` +
      `⏰ <b>${commitmentData.daysOverdue} días de retraso</b>`,
      '⚠️ Acción requerida urgente'
    );

    return await sendTelegramMessage(chatId, message);
  };

  /**
   * 💎 Compromiso de Alto Valor
   */
  const sendHighValueCommitmentNotification = async (chatId, commitmentData) => {
    const message = formatTelegramMessage(
      '💎 Compromiso de Alto Valor',
      `🏢 <b>${commitmentData.companyName}</b>\n` +
      `� Beneficiario: ${commitmentData.beneficiary || commitmentData.companyName}\n` +
      `�💼 ${commitmentData.concept}\n` +
      `💰 <b>${commitmentData.amount}</b>\n` +
      `📅 Vencimiento: ${commitmentData.dueDate}\n` +
      `⚡ Umbral: ${commitmentData.threshold}`,
      'Requiere atención prioritaria'
    );

    return await sendTelegramMessage(chatId, message);
  };

  /**
   * ✅ Compromiso Completado
   */
  const sendCommitmentCompletedNotification = async (chatId, commitmentData) => {
    const message = formatTelegramMessage(
      '✅ Compromiso Completado',
      `🏢 <b>${commitmentData.companyName}</b>\n` +
      `💼 ${commitmentData.concept}\n` +
      `💰 <b>${commitmentData.amount}</b>\n` +
      `📅 Fecha: ${commitmentData.completionDate}\n` +
      `✅ Estado: <b>PAGADO</b>`,
      'Gestión exitosa'
    );

    return await sendTelegramMessage(chatId, message);
  };

  /**
   * 💳 Pago Registrado
   */
  const sendPaymentRegisteredNotification = async (chatId, paymentData) => {
    const message = formatTelegramMessage(
      '💳 Nuevo Pago Registrado',
      `🏢 <b>${paymentData.companyName}</b>\n` +
      `� Beneficiario: ${paymentData.beneficiary || paymentData.companyName}\n` +
      `�💰 Monto: <b>${paymentData.amount}</b>\n` +
      `📅 Fecha: ${paymentData.paymentDate}\n` +
      `💼 Concepto: ${paymentData.concept}\n` +
      `👤 Registrado por: ${paymentData.registeredBy}`,
      'DR Group Dashboard'
    );

    return await sendTelegramMessage(chatId, message);
  };

  /**
   * 🟡 Pago Parcial
   */
  const sendPartialPaymentNotification = async (chatId, paymentData) => {
    const message = formatTelegramMessage(
      '🟡 Pago Parcial Registrado',
      `🏢 <b>${paymentData.companyName}</b>\n` +
      `💰 Pagado: <b>${paymentData.paidAmount}</b>\n` +
      `💵 Total: ${paymentData.totalAmount}\n` +
      `📊 Pendiente: <b>${paymentData.remainingAmount}</b>\n` +
      `📅 ${paymentData.paymentDate}`,
      'Requiere seguimiento'
    );

    return await sendTelegramMessage(chatId, message);
  };

  /**
   * 📬 Ingreso Recibido
   */
  const sendIncomeReceivedNotification = async (chatId, incomeData) => {
    const message = formatTelegramMessage(
      '📬 Ingreso Recibido',
      `🏢 <b>${incomeData.companyName}</b>\n` +
      `💰 Monto: <b>${incomeData.amount}</b>\n` +
      `💼 Concepto: ${incomeData.concept}\n` +
      `📅 ${incomeData.receiptDate}`,
      'Registro contable actualizado'
    );

    return await sendTelegramMessage(chatId, message);
  };

  /**
   * 📝 Mensaje de Prueba
   */
  const sendTestNotification = async (chatId, userName) => {
    const message = formatTelegramMessage(
      '🧪 Prueba de Telegram',
      `¡Hola <b>${userName}</b>! 👋\n\n` +
      `Tu bot de Telegram está correctamente configurado.\n\n` +
      `✅ Chat ID verificado\n` +
      `✅ Permisos correctos\n` +
      `✅ Listo para recibir notificaciones`,
      `🤖 DR Group Bot • ${new Date().toLocaleString('es-CO')}`
    );

    return await sendTelegramMessage(chatId, message);
  };

  /**
   * 📅 Notificación Personalizada (para eventos del calendario)
   */
  const sendCustomNotification = async (chatId, message) => {
    return await sendTelegramMessage(chatId, message);
  };

  return {
    // Estados
    sending,
    error,

    // Funciones base
    sendTelegramMessage,
    verifyChatId,
    formatTelegramMessage,

    // Notificaciones específicas
    sendUserCreatedNotification,
    sendUserUpdatedNotification,
    sendRoleChangedNotification,
    sendCommitmentOverdueNotification,
    sendHighValueCommitmentNotification,
    sendCommitmentCompletedNotification,
    sendPaymentRegisteredNotification,
    sendPartialPaymentNotification,
    sendIncomeReceivedNotification,
    sendTestNotification,
    
    // 📅 Eventos Personalizados
    sendCustomNotification
  };
};
