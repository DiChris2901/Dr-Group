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

  // ====================================================================
  // 🚨 NOTIFICACIONES DE COMPROMISOS CRÍTICOS (FASE 1)
  // ====================================================================

  /**
   * Notificación de Compromiso Vencido
   * Se envía diariamente para compromisos que no se han pagado después de la fecha de vencimiento
   */
  const sendCommitmentOverdueNotification = async (recipientEmail, commitmentData) => {
    const daysOverdue = commitmentData.daysOverdue || 0;
    
    return await sendEmailNotification(recipientEmail, {
      subject: `❌ COMPROMISO VENCIDO hace ${daysOverdue} ${daysOverdue === 1 ? 'día' : 'días'} - Acción Requerida`,
      message: `⚠️ ALERTA DE VENCIMIENTO\n\nEl siguiente compromiso está VENCIDO y requiere atención inmediata:\n\nEmpresa: ${commitmentData.companyName}\nConcepto: ${commitmentData.concept}\nMonto: ${commitmentData.amount}\nFecha de Vencimiento: ${commitmentData.dueDate}\nDías vencido: ${daysOverdue}\n\nPor favor, gestiona el pago lo antes posible.`,
      type: 'commitment_overdue',
      userName: commitmentData.userName || 'Usuario',
      actionUrl: `${window.location.origin}/commitments?id=${commitmentData.commitmentId}`,
      additionalData: {
        commitment_id: commitmentData.commitmentId,
        company_name: commitmentData.companyName,
        concept: commitmentData.concept,
        amount: commitmentData.amount,
        due_date: commitmentData.dueDate,
        days_overdue: daysOverdue,
        status: 'overdue'
      }
    });
  };

  /**
   * Notificación de Compromiso de Alto Valor
   * Se envía cuando se crea o está próximo a vencer un compromiso que supera el umbral configurado
   */
  const sendHighValueCommitmentNotification = async (recipientEmail, commitmentData) => {
    const threshold = commitmentData.threshold || 50000000; // $50M por defecto
    
    return await sendEmailNotification(recipientEmail, {
      subject: `💎 ALERTA: Compromiso de Alto Valor - ${commitmentData.amount}`,
      message: `💎 COMPROMISO DE ALTO VALOR\n\nSe ha ${commitmentData.isNew ? 'creado un nuevo' : 'detectado un'} compromiso de alto valor:\n\nEmpresa: ${commitmentData.companyName}\nConcepto: ${commitmentData.concept}\nMonto: ${commitmentData.amount}\nFecha de Vencimiento: ${commitmentData.dueDate}\n\nEste compromiso supera el umbral de ${threshold.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })} y requiere seguimiento especial.`,
      type: 'commitment_high_value',
      userName: commitmentData.userName || 'Usuario',
      actionUrl: `${window.location.origin}/commitments?id=${commitmentData.commitmentId}`,
      additionalData: {
        commitment_id: commitmentData.commitmentId,
        company_name: commitmentData.companyName,
        concept: commitmentData.concept,
        amount: commitmentData.amount,
        threshold: threshold,
        due_date: commitmentData.dueDate,
        is_new: commitmentData.isNew || false
      }
    });
  };

  /**
   * Notificación de Compromiso Completado
   * Se envía cuando un compromiso alcanza el 100% de pago
   */
  const sendCommitmentCompletedNotification = async (recipientEmail, commitmentData) => {
    return await sendEmailNotification(recipientEmail, {
      subject: `✅ Compromiso Completado - ${commitmentData.companyName}`,
      message: `✅ COMPROMISO PAGADO COMPLETAMENTE\n\nEl siguiente compromiso ha sido pagado en su totalidad:\n\nEmpresa: ${commitmentData.companyName}\nConcepto: ${commitmentData.concept}\nMonto Total: ${commitmentData.totalAmount}\nÚltimo Pago: ${commitmentData.lastPaymentAmount}\nFecha de Pago Final: ${commitmentData.completionDate}\n\n¡Excelente gestión financiera!`,
      type: 'commitment_completed',
      userName: commitmentData.userName || 'Usuario',
      actionUrl: `${window.location.origin}/commitments?id=${commitmentData.commitmentId}`,
      additionalData: {
        commitment_id: commitmentData.commitmentId,
        company_name: commitmentData.companyName,
        concept: commitmentData.concept,
        total_amount: commitmentData.totalAmount,
        last_payment: commitmentData.lastPaymentAmount,
        completion_date: commitmentData.completionDate,
        payment_count: commitmentData.paymentCount || 1
      }
    });
  };

  // ====================================================================
  // 💳 NOTIFICACIONES DE PAGOS (FASE 1)
  // ====================================================================

  /**
   * Notificación de Pago Registrado
   * Se envía cada vez que se registra un pago completo
   */
  const sendPaymentRegisteredNotification = async (recipientEmail, paymentData) => {
    return await sendEmailNotification(recipientEmail, {
      subject: `💸 Pago Registrado - ${paymentData.amount}`,
      message: `💸 NUEVO PAGO REGISTRADO\n\nSe ha registrado un nuevo pago en el sistema:\n\nEmpresa: ${paymentData.companyName}\nConcepto: ${paymentData.concept}\nMonto: ${paymentData.amount}\nMétodo de Pago: ${paymentData.paymentMethod}\nCuenta: ${paymentData.account}\nFecha: ${paymentData.paymentDate}\n\nEl pago ha sido registrado correctamente.`,
      type: 'payment_registered',
      userName: paymentData.userName || 'Usuario',
      actionUrl: `${window.location.origin}/commitments?id=${paymentData.commitmentId}`,
      additionalData: {
        payment_id: paymentData.paymentId,
        commitment_id: paymentData.commitmentId,
        company_name: paymentData.companyName,
        concept: paymentData.concept,
        amount: paymentData.amount,
        payment_method: paymentData.paymentMethod,
        account: paymentData.account,
        payment_date: paymentData.paymentDate,
        has_receipt: paymentData.hasReceipt || false
      }
    });
  };

  /**
   * Notificación de Pago Parcial (Abono)
   * Se envía cuando se registra un abono que no completa el compromiso
   */
  const sendPartialPaymentNotification = async (recipientEmail, paymentData) => {
    const percentagePaid = ((paymentData.totalPaid / paymentData.totalAmount) * 100).toFixed(1);
    
    return await sendEmailNotification(recipientEmail, {
      subject: `💰 Abono Parcial Registrado - ${paymentData.amount}`,
      message: `💰 ABONO PARCIAL REGISTRADO\n\nSe ha registrado un abono para el compromiso:\n\nEmpresa: ${paymentData.companyName}\nConcepto: ${paymentData.concept}\nAbono: ${paymentData.amount}\nTotal Pagado: ${paymentData.totalPaid} (${percentagePaid}%)\nSaldo Pendiente: ${paymentData.remainingBalance}\nMonto Total: ${paymentData.totalAmount}\n\nEl abono ha sido registrado correctamente.`,
      type: 'payment_partial',
      userName: paymentData.userName || 'Usuario',
      actionUrl: `${window.location.origin}/commitments?id=${paymentData.commitmentId}`,
      additionalData: {
        payment_id: paymentData.paymentId,
        commitment_id: paymentData.commitmentId,
        company_name: paymentData.companyName,
        concept: paymentData.concept,
        partial_amount: paymentData.amount,
        total_paid: paymentData.totalPaid,
        remaining_balance: paymentData.remainingBalance,
        total_amount: paymentData.totalAmount,
        percentage_paid: percentagePaid
      }
    });
  };

  // ====================================================================
  // 📈 NOTIFICACIONES DE INGRESOS (FASE 2)
  // ====================================================================

  /**
   * Notificación de Ingreso Recibido
   * Se envía cuando se registra una consignación o ingreso
   */
  const sendIncomeReceivedNotification = async (recipientEmail, incomeData) => {
    return await sendEmailNotification(recipientEmail, {
      subject: `📈 Ingreso Registrado - ${incomeData.amount}`,
      message: `📈 NUEVO INGRESO REGISTRADO\n\nSe ha registrado un nuevo ingreso en el sistema:\n\nCliente: ${incomeData.clientName}\nMonto: ${incomeData.amount}\nMétodo de Pago: ${incomeData.paymentMethod}\nCuenta Destino: ${incomeData.account}\nBanco: ${incomeData.bank}\nFecha: ${incomeData.date}\n\nEl ingreso ha sido registrado correctamente.`,
      type: 'income_received',
      userName: incomeData.userName || 'Usuario',
      actionUrl: `${window.location.origin}/income`,
      additionalData: {
        income_id: incomeData.incomeId,
        client_name: incomeData.clientName,
        amount: incomeData.amount,
        payment_method: incomeData.paymentMethod,
        account: incomeData.account,
        bank: incomeData.bank,
        date: incomeData.date,
        description: incomeData.description || ''
      }
    });
  };

  // ====================================================================
  // � NOTIFICACIONES DE CONTRATOS (FASE 2)
  // ====================================================================

  /**
   * Notificación de Contrato próximo a vencer
   * Se envía en periodos: 365, 180, 90, 30 días antes
   */
  const sendContractExpirationNotification = async (recipientEmail, contractData) => {
    const { companyName, expirationDate, daysUntilExpiration, period } = contractData;
    
    let urgencyIcon = '📄';
    let urgencyLabel = 'Recordatorio';
    
    if (daysUntilExpiration <= 30) {
      urgencyIcon = '🚨';
      urgencyLabel = 'URGENTE';
    } else if (daysUntilExpiration <= 90) {
      urgencyIcon = '⚠️';
      urgencyLabel = 'Atención';
    }

    return await sendEmailNotification(recipientEmail, {
      subject: `${urgencyIcon} ${urgencyLabel}: Contrato de ${companyName} vence en ${period}`,
      message: `${urgencyIcon} VENCIMIENTO DE CONTRATO\n\nEl contrato de la empresa ${companyName} está próximo a vencer:\n\nDías restantes: ${daysUntilExpiration}\nFecha de vencimiento: ${expirationDate}\nPeríodo de alerta: ${period}\n\nEs importante renovar o revisar el contrato antes de su vencimiento.\n\nAcciones recomendadas:\n✓ Contactar con la empresa\n✓ Preparar documentación de renovación\n✓ Revisar términos y condiciones\n✓ Actualizar información si es necesario`,
      type: `contract_${daysUntilExpiration}_days`,
      userName: contractData.userName || 'Usuario',
      actionUrl: `${window.location.origin}/companies`,
      additionalData: {
        company_id: contractData.companyId,
        company_name: companyName,
        expiration_date: expirationDate,
        days_until_expiration: daysUntilExpiration,
        period: period,
        urgency_level: daysUntilExpiration <= 30 ? 'high' : daysUntilExpiration <= 90 ? 'medium' : 'low'
      }
    });
  };

  /**
   * Notificación de Contrato vence HOY
   */
  const sendContractDueTodayNotification = async (recipientEmail, contractData) => {
    return await sendEmailNotification(recipientEmail, {
      subject: `🚨 CRÍTICO: Contrato de ${contractData.companyName} vence HOY`,
      message: `🔴 ALERTA CRÍTICA - CONTRATO VENCE HOY\n\nEl contrato de la empresa ${contractData.companyName} VENCE HOY (${contractData.expirationDate}).\n\nACCIÓN INMEDIATA REQUERIDA:\n\n⚠️ El contrato expira en pocas horas\n⚠️ Se requiere renovación urgente\n⚠️ Contactar a la empresa inmediatamente\n\nSi el contrato no se renueva, la relación comercial podría verse afectada.\n\nPor favor, tome acción inmediata.`,
      type: 'contract_due_today',
      userName: contractData.userName || 'Usuario',
      actionUrl: `${window.location.origin}/companies`,
      additionalData: {
        company_id: contractData.companyId,
        company_name: contractData.companyName,
        expiration_date: contractData.expirationDate,
        days_until_expiration: 0,
        urgency_level: 'critical'
      }
    });
  };

  /**
   * Notificación de Contrato VENCIDO
   * Se envía diariamente durante 30 días después del vencimiento
   */
  const sendContractExpiredNotification = async (recipientEmail, contractData) => {
    const { companyName, expirationDate, daysExpired } = contractData;
    
    return await sendEmailNotification(recipientEmail, {
      subject: `❌ CRÍTICO: Contrato de ${companyName} VENCIDO hace ${daysExpired} ${daysExpired === 1 ? 'día' : 'días'}`,
      message: `❌ CONTRATO VENCIDO\n\nEl contrato de la empresa ${companyName} está VENCIDO.\n\nFecha de vencimiento: ${expirationDate}\nDías vencido: ${daysExpired} ${daysExpired === 1 ? 'día' : 'días'}\n\n🚨 ACCIÓN URGENTE REQUERIDA:\n\n• Renovar el contrato inmediatamente\n• Contactar con la empresa\n• Regularizar la situación contractual\n• Actualizar la información en el sistema\n\nNota: Esta notificación se enviará diariamente hasta que se actualice la fecha del contrato.`,
      type: 'contract_expired',
      userName: contractData.userName || 'Usuario',
      actionUrl: `${window.location.origin}/companies`,
      additionalData: {
        company_id: contractData.companyId,
        company_name: companyName,
        expiration_date: expirationDate,
        days_expired: daysExpired,
        urgency_level: 'critical',
        requires_action: true
      }
    });
  };

  // ====================================================================
  // �🔐 NOTIFICACIONES DE SEGURIDAD (FASE 2)
  // ====================================================================

  /**
   * Notificación de Cambio de Permiso Crítico
   * Se envía cuando se asigna rol Admin o Super Admin
   */
  const sendCriticalPermissionChangeNotification = async (recipientEmail, permissionData) => {
    return await sendEmailNotification(recipientEmail, {
      subject: `🔐 SEGURIDAD: Cambio Crítico de Permisos`,
      message: `🛡️ ALERTA DE SEGURIDAD\n\nSe ha realizado un cambio crítico en los permisos del sistema:\n\nUsuario Afectado: ${permissionData.targetUserName}\nRol Anterior: ${permissionData.oldRole}\nNuevo Rol: ${permissionData.newRole}\nRealizado por: ${permissionData.changedByName}\nFecha: ${permissionData.timestamp}\n\nSi no autorizaste este cambio, contacta al administrador inmediatamente.`,
      type: 'critical_permission_change',
      userName: permissionData.targetUserName,
      actionUrl: `${window.location.origin}/users`,
      additionalData: {
        target_user_id: permissionData.targetUserId,
        target_user_name: permissionData.targetUserName,
        old_role: permissionData.oldRole,
        new_role: permissionData.newRole,
        changed_by_id: permissionData.changedById,
        changed_by_name: permissionData.changedByName,
        timestamp: permissionData.timestamp,
        security_level: 'critical'
      }
    });
  };

  // 📅 Notificación personalizada (para eventos del calendario)
  const sendCustomNotification = async (recipientEmail, subject, htmlContent) => {
    setSending(true);
    setError(null);

    try {
      const response = await sendEmailNotification(recipientEmail, {
        recipient_name: 'Usuario',
        recipient_email: recipientEmail,
        subject: subject,
        message: htmlContent
      });

      console.log('✅ Notificación personalizada enviada');
      return response;
    } catch (err) {
      console.error('❌ Error enviando notificación personalizada:', err);
      setError(err.message);
      throw err;
    } finally {
      setSending(false);
    }
  };

  // Estado y funciones expuestas
  return {
    // Estados
    sending,
    error,
    
    // Funciones principales
    sendEmailNotification,
    
    // 🧑‍💼 Gestión de Usuarios
    sendUserCreatedNotification,
    sendUserUpdatedNotification, 
    sendRoleChangedNotification,
    sendTestNotification,
    
    // 🚨 Compromisos Críticos (FASE 1)
    sendCommitmentOverdueNotification,
    sendHighValueCommitmentNotification,
    sendCommitmentCompletedNotification,
    
    // 💳 Pagos (FASE 1)
    sendPaymentRegisteredNotification,
    sendPartialPaymentNotification,
    
    // 📈 Ingresos (FASE 2)
    sendIncomeReceivedNotification,
    
    // � Contratos (FASE 2)
    sendContractExpirationNotification,
    sendContractDueTodayNotification,
    sendContractExpiredNotification,
    
    // �🔐 Seguridad (FASE 2)
    sendCriticalPermissionChangeNotification,
    
    // 📅 Eventos Personalizados
    sendCustomNotification,
    
    // Utilidades
    initEmailJS,
    isLoading: sending
  };
};