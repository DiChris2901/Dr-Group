const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onCall } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const twilio = require('twilio');

// Configuración de Twilio
const TWILIO_ACCOUNT_SID = 'AC9d2313319dee6dcba99298003893c190';
const TWILIO_AUTH_TOKEN = '2025cd85312e59bf48af46786e73be64';

// Configuración de WhatsApp Business
const MESSAGING_SERVICE_SID = 'MG27cf7b7e053b2fce451e7df1df543916'; // DR Group WhatsApp Service v2 (CORRECTO)
const TWILIO_PHONE_NUMBER = '+12312419541'; // Tu número personal de WhatsApp Business
const SANDBOX_PHONE_NUMBER = '+14155238886'; // Sandbox de Twilio (para pruebas)

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

/**
 * Polling de estado de un mensaje de Twilio
 * @param {string} sid - SID del mensaje
 * @param {number} attempts - Número de intentos
 * @param {number} intervalMs - Intervalo entre intentos
 */
async function pollMessageStatus(sid, attempts = 4, intervalMs = 2500) {
  for (let i = 0; i < attempts; i++) {
    try {
      const msg = await client.messages(sid).fetch();
      const status = msg.status;
      if (['delivered', 'failed', 'undelivered', 'sent'].includes(status)) {
        return msg;
      }
      await new Promise(r => setTimeout(r, intervalMs));
    } catch (e) {
      console.error('❌ Error haciendo polling de estado:', e.message);
      break;
    }
  }
  // Último fetch para devolver algo
  try {
    return await client.messages(sid).fetch();
  } catch {
    return { status: 'unknown' };
  }
}

/**
 * Enviar plantilla WhatsApp (usando Content API / contentSid de Twilio)
 * data:
 *  - phoneNumber: destino, formato +57...
 *  - contentSid: SID de la plantilla (HX...)
 *  - variables: objeto { "1": "valor", "2": "..." }
 */
async function sendWhatsAppTemplate({ phoneNumber, contentSid, variables = {}, forceSandbox = false }) {
  if (!phoneNumber || !contentSid) {
    throw new Error('phoneNumber y contentSid requeridos');
  }
  const method = forceSandbox ? 'SandboxTemplate' : 'BusinessTemplate';
  try {
    console.log(`🧾 Enviando plantilla ${contentSid} a ${phoneNumber} (${method})`);
    const msgConfig = forceSandbox ? {
      from: `whatsapp:${SANDBOX_PHONE_NUMBER}`,
      to: `whatsapp:${phoneNumber}`,
      contentSid,
      contentVariables: JSON.stringify(variables)
    } : {
      messagingServiceSid: MESSAGING_SERVICE_SID,
      to: `whatsapp:${phoneNumber}`,
      contentSid,
      contentVariables: JSON.stringify(variables)
    };
    const result = await client.messages.create(msgConfig);
    console.log(`✅ Plantilla enviada: ${result.sid} status=${result.status}`);
    const polled = await pollMessageStatus(result.sid, 4, 2500);
    // Log en Firestore
    try {
      const db = getFirestore();
      await db.collection('notification_logs').add({
        type: 'whatsapp_template',
        phoneNumber,
        contentSid,
        variables,
        messageSid: result.sid,
        initialStatus: result.status,
        finalStatus: polled.status,
        errorCode: polled.errorCode || null,
        errorMessage: polled.errorMessage || null,
        method,
        createdAt: new Date()
      });
    } catch (logErr) {
      console.warn('⚠️ No se pudo registrar log de plantilla:', logErr.message);
    }
    return {
      success: true,
      messageId: result.sid,
      initialStatus: result.status,
      finalStatus: polled.status,
      method,
      errorCode: polled.errorCode || null,
      errorMessage: polled.errorMessage || null
    };
  } catch (error) {
    console.error('❌ Error enviando plantilla:', error);
    return {
      success: false,
      error: error.message,
      code: error.code,
      moreInfo: error.moreInfo,
      method
    };
  }
}

/**
 * Función inteligente para enviar mensajes de WhatsApp
 * Intenta Business API primero, luego Sandbox como respaldo
 */
async function sendWhatsAppMessage(to, message, useBusinessAPI = true) {
  try {
    console.log(`📱 Enviando WhatsApp a: ${to}`);
    console.log(`📝 Mensaje: ${message}`);
    
    // Validar que no sea el mismo número (evitar error 63031)
    if (to === '+12312419541' && useBusinessAPI) {
      console.log('⚠️ No se puede enviar desde y hacia el mismo número, usando Sandbox...');
      useBusinessAPI = false;
    }
    
    let messageConfig;
    let method;
    
    if (useBusinessAPI) {
      // Usar WhatsApp Business API con Messaging Service
      console.log(`🏢 Enviando desde WhatsApp Business (Servicio: ${MESSAGING_SERVICE_SID})`);
      messageConfig = {
        messagingServiceSid: MESSAGING_SERVICE_SID,
        to: `whatsapp:${to}`,
        body: message
      };
      method = 'Business API';
    } else {
      // Usar Sandbox como fallback
      console.log(`🧪 Enviando desde Sandbox: ${SANDBOX_PHONE_NUMBER}`);
      messageConfig = {
        from: `whatsapp:${SANDBOX_PHONE_NUMBER}`,
        to: `whatsapp:${to}`,
        body: message
      };
      method = 'Sandbox';
    }
    
    const result = await client.messages.create(messageConfig);
    
    console.log(`✅ WhatsApp enviado a ${to} via ${method}: ${result.sid}`);
    console.log(`📊 Estado: ${result.status}`);
    console.log(`💰 Precio: ${result.price} ${result.priceUnit}`);
    console.log(`🌐 Dirección: ${result.direction}`);
    
    // Verificar estado después de unos segundos
    setTimeout(async () => {
      try {
        const messageStatus = await client.messages(result.sid).fetch();
        console.log(`🔄 Estado actualizado del mensaje ${result.sid}: ${messageStatus.status}`);
        if (messageStatus.errorCode) {
          console.error(`❌ Error en mensaje: ${messageStatus.errorCode} - ${messageStatus.errorMessage}`);
          
          // Si Business API falla, intentar con Sandbox automáticamente
          if (useBusinessAPI && (messageStatus.errorCode === '63016' || messageStatus.errorCode === '63015')) {
            console.log('🔄 Reintentando con Sandbox...');
            return sendWhatsAppMessage(to, message, false);
          }
        }
      } catch (statusError) {
        console.error('❌ Error verificando estado:', statusError);
      }
    }, 5000);
    
    return { 
      success: true, 
      messageId: result.sid,
      status: result.status,
      to: result.to,
      from: result.from
    };
  } catch (error) {
    console.error(`❌ Error enviando WhatsApp a ${to}:`, error);
    console.error(`🔍 Error code: ${error.code}`);
    console.error(`📝 Error message: ${error.message}`);
    console.error(`🌐 More info: ${error.moreInfo}`);
    
    return { 
      success: false, 
      error: error.message,
      code: error.code,
      moreInfo: error.moreInfo
    };
  }
}

/**
 * Función para formatear mensajes según el tipo de notificación
 */
function formatNotificationMessage(type, data) {
  const { empresa, beneficiario, valor, fechaVencimiento, diasRestantes } = data;
  
  const valorText = valor ? `💰 Valor: $${new Intl.NumberFormat('es-CO').format(valor)}` : '';
  const fechaText = `📅 Vencimiento: ${fechaVencimiento}`;
  
  switch (type) {
    case 'compromiso_proximo':
      return `🚨 *COMPROMISO PRÓXIMO A VENCER*\n\n` +
             `🏢 Empresa: ${empresa}\n` +
             `👤 Beneficiario: ${beneficiario}\n` +
             `${valorText}\n` +
             `${fechaText}\n` +
             `⏰ Días restantes: ${diasRestantes}\n\n` +
             `¡No olvides realizar el pago!`;
             
    case 'compromiso_vencido':
      return `❌ *COMPROMISO VENCIDO HOY*\n\n` +
             `🏢 Empresa: ${empresa}\n` +
             `👤 Beneficiario: ${beneficiario}\n` +
             `${valorText}\n` +
             `${fechaText}\n\n` +
             `⚠️ ¡Atención urgente requerida!`;
             
    case 'nuevo_compromiso':
      return `📝 *NUEVO COMPROMISO AGREGADO*\n\n` +
             `🏢 Empresa: ${empresa}\n` +
             `👤 Beneficiario: ${beneficiario}\n` +
             `${valorText}\n` +
             `${fechaText}\n\n` +
             `✅ Compromiso registrado exitosamente`;
             
    case 'evento_automatico':
      const { tipoEvento } = data;
      return `📋 *RECORDATORIO: ${tipoEvento.toUpperCase()}*\n\n` +
             `📅 Fecha: ${fechaVencimiento}\n\n` +
             `🔔 No olvides cumplir con esta obligación`;
             
    default:
      return `🔔 Notificación del sistema DR Group`;
  }
}

/**
 * Cloud Function: Notificación inmediata cuando se crea un nuevo compromiso
 */
exports.notifyNewCommitment = onDocumentCreated('commitments/{commitmentId}', async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;
  
  const commitment = snapshot.data();
  const db = getFirestore();
  
  try {
    // Obtener usuarios con notificaciones habilitadas
    const usersSnapshot = await db.collection('users')
      .where('notificationSettings.newCommitments', '==', true)
      .where('notificationSettings.phoneNumber', '!=', null)
      .get();
    
    if (usersSnapshot.empty) {
      console.log('No hay usuarios configurados para recibir notificaciones');
      return;
    }
    
    // Obtener información de la empresa
    const companyDoc = await db.collection('companies').doc(commitment.companyId).get();
    const company = companyDoc.exists ? companyDoc.data() : { name: 'Empresa no encontrada' };
    
    const messageData = {
      empresa: company.name,
      beneficiario: commitment.provider || commitment.beneficiary || 'No especificado',
      valor: commitment.amount,
      fechaVencimiento: commitment.dueDate ? new Date(commitment.dueDate.seconds * 1000).toLocaleDateString('es-CO') : 'No especificada'
    };
    
    const message = formatNotificationMessage('nuevo_compromiso', messageData);
    
    // Enviar notificaciones
    const promises = usersSnapshot.docs.map(async (userDoc) => {
      const user = userDoc.data();
      if (user.notificationSettings?.phoneNumber) {
        return sendWhatsAppMessage(user.notificationSettings.phoneNumber, message, true); // true = usar Business API
      }
    });
    
    await Promise.all(promises);
    console.log(`✅ Notificaciones enviadas para nuevo compromiso: ${commitment.concept}`);
    
  } catch (error) {
    console.error('❌ Error en notifyNewCommitment:', error);
  }
});

/**
 * Cloud Function: Verificación diaria de compromisos y eventos (9 AM Colombia)
 * Cron: 0 14 * * 1-5 (9 AM Colombia = 14:00 UTC, solo días laborables)
 */
exports.dailyNotificationCheck = onSchedule('0 14 * * 1-5', async (context) => {
  const db = getFirestore();
  
  try {
    console.log('🔍 Iniciando verificación diaria de notificaciones...');
    
    // Obtener usuarios con notificaciones habilitadas
    const usersSnapshot = await db.collection('users')
      .where('notificationSettings.phoneNumber', '!=', null)
      .get();
    
    if (usersSnapshot.empty) {
      console.log('No hay usuarios configurados para recibir notificaciones');
      return;
    }
    
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Fechas de verificación (15 días, 7 días, 2 días, hoy)
    const checkDates = [
      { days: 15, type: '15_days' },
      { days: 7, type: '7_days' },
      { days: 2, type: '2_days' },
      { days: 0, type: 'today' }
    ];
    
    for (const { days, type } of checkDates) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + days);
      
      // Obtener compromisos que vencen en la fecha objetivo
      const commitmentsSnapshot = await db.collection('commitments')
        .where('dueDate', '>=', targetDate)
        .where('dueDate', '<', new Date(targetDate.getTime() + 24 * 60 * 60 * 1000))
        .where('status', '!=', 'paid')
        .get();
      
      for (const commitmentDoc of commitmentsSnapshot.docs) {
        const commitment = commitmentDoc.data();
        
        // Obtener información de la empresa
        const companyDoc = await db.collection('companies').doc(commitment.companyId).get();
        const company = companyDoc.exists ? companyDoc.data() : { name: 'Empresa no encontrada' };
        
        const messageData = {
          empresa: company.name,
          beneficiario: commitment.provider || commitment.beneficiary || 'No especificado',
          valor: commitment.amount,
          fechaVencimiento: targetDate.toLocaleDateString('es-CO'),
          diasRestantes: days
        };
        
        const messageType = days === 0 ? 'compromiso_vencido' : 'compromiso_proximo';
        const message = formatNotificationMessage(messageType, messageData);
        
        // Enviar a usuarios que tengan habilitado este tipo de notificación
        for (const user of users) {
          const settings = user.notificationSettings || {};
          const shouldNotify = 
            (days === 15 && settings.commitments15Days) ||
            (days === 7 && settings.commitments7Days) ||
            (days === 2 && settings.commitments2Days) ||
            (days === 0 && settings.commitmentsDueToday);
          
          if (shouldNotify && settings.phoneNumber) {
            await sendWhatsAppMessage(settings.phoneNumber, message);
          }
        }
      }
    }
    
    // Verificar eventos automáticos para hoy
    await checkAutomaticEvents(users, today);
    
    console.log('✅ Verificación diaria completada');
    
  } catch (error) {
    console.error('❌ Error en dailyNotificationCheck:', error);
  }
});

/**
 * Función auxiliar para verificar eventos automáticos
 */
async function checkAutomaticEvents(users, date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  
  // Verificar si hoy es día de eventos automáticos
  const events = [];
  
  // UIAF - día 10 de cada mes
  if (day === 10) {
    events.push({
      type: 'evento_automatico',
      data: {
        tipoEvento: 'Reporte UIAF',
        fechaVencimiento: date.toLocaleDateString('es-CO')
      }
    });
  }
  
  // Aquí se pueden agregar más verificaciones para Coljuegos y Parafiscales
  // (requiere lógica de días hábiles que ya tienes en el frontend)
  
  // Enviar notificaciones de eventos automáticos
  for (const event of events) {
    const message = formatNotificationMessage(event.type, event.data);
    
    for (const user of users) {
      const settings = user.notificationSettings || {};
      if (settings.automaticEvents && settings.phoneNumber) {
        await sendWhatsAppMessage(settings.phoneNumber, message);
      }
    }
  }
}

/**
 * Cloud Function para pruebas manuales de WhatsApp
 */
exports.testWhatsAppNotification = onCall(async (request) => {
  const { data } = request;
  const { phoneNumber, message, useBusinessAPI = true, forceSandbox = false } = data;
  
  if (!phoneNumber || !message) {
    throw new Error('Número de teléfono y mensaje son requeridos');
  }
  
  console.log(`🧪 Prueba de WhatsApp - Preferencia Business: ${useBusinessAPI ? 'SÍ' : 'NO'} | forceSandbox=${forceSandbox}`);

  // Si forzamos sandbox directamente
  if (forceSandbox) {
    return await sendWhatsAppMessage(phoneNumber, message, false);
  }

  try {
    let primaryAttempt;
    let finalStatus;
    let usedMethod = 'Business API';
    let attemptedSandbox = false;

    if (useBusinessAPI) {
      primaryAttempt = await sendWhatsAppMessage(phoneNumber, message, true);
      // Si falla inmediatamente, intentar Sandbox
      if (!primaryAttempt.success) {
        console.log('⚠️ Fallo inmediato en Business API, intentando Sandbox...');
        attemptedSandbox = true;
        usedMethod = 'Sandbox';
        return await sendWhatsAppMessage(phoneNumber, message, false);
      }
      // Poll status para validar entrega real
      const polled = await pollMessageStatus(primaryAttempt.messageId, 4, 2500);
      finalStatus = polled.status;
      console.log(`📡 Estado final tras polling (Business): ${finalStatus}`);

      // Si no se entregó y status es failed/undelivered o quedó en queued/accepted -> intentar sandbox
      if (['failed', 'undelivered'].includes(finalStatus) || ['accepted', 'queued'].includes(finalStatus)) {
        console.log('⚠️ Business API no entregó (o quedó colgado). Intentando Sandbox como fallback sincrónico...');
        attemptedSandbox = true;
        const sandboxResult = await sendWhatsAppMessage(phoneNumber, message, false);
        sandboxResult.method = sandboxResult.success ? 'Sandbox (fallback)' : 'Sandbox (fallback - falló)';
        sandboxResult.businessMessageId = primaryAttempt.messageId;
        sandboxResult.businessFinalStatus = finalStatus;
        return sandboxResult;
      }

      primaryAttempt.finalStatus = finalStatus;
      primaryAttempt.method = usedMethod;
      primaryAttempt.attemptedSandbox = attemptedSandbox;
      return primaryAttempt;
    } else {
      // Directo sandbox
      const sandbox = await sendWhatsAppMessage(phoneNumber, message, false);
      sandbox.method = 'Sandbox';
      return sandbox;
    }
  } catch (error) {
    console.error('❌ Error en prueba:', error);
    throw new Error(`Error enviando WhatsApp: ${error.message}`);
  }
});

/**
 * Cloud Function para enviar una plantilla aprobada
 * data: { phoneNumber, contentSid, variables, forceSandbox }
 */
exports.sendWhatsAppTemplate = onCall(async (request) => {
  const { data } = request;
  const { phoneNumber, contentSid, variables = {}, forceSandbox = false } = data || {};
  if (!phoneNumber) throw new Error('phoneNumber requerido');
  if (!contentSid) throw new Error('contentSid requerido');
  try {
    return await sendWhatsAppTemplate({ phoneNumber, contentSid, variables, forceSandbox });
  } catch (e) {
    console.error('❌ Error en sendWhatsAppTemplate:', e);
    throw new Error(e.message || 'Error desconocido');
  }
});
