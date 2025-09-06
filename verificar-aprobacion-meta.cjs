#!/usr/bin/env node
/**
 * SCRIPT DE VERIFICACIÓN POST-APROBACIÓN META
 * Ejecutar cuando Meta apruebe la verificación del negocio
 */

const twilio = require('twilio');

// Configuración actual (NO CAMBIAR)
const accountSid = 'AC9d2313319dee6dcba99298003893c190';
const authToken = '2025cd85312e59bf48af46786e73be64';
const businessNumber = '+12312419541';
const messagingServiceSid = 'MG27cf7b7e053b2fce451e7df1df543916';

const client = twilio(accountSid, authToken);

async function verificarAprobacionMeta() {
  console.log('🔍 VERIFICANDO SI META YA APROBÓ TU NEGOCIO\n');
  
  try {
    // 1. Verificar capabilities del número
    console.log('📱 Verificando número Business...');
    const numbers = await client.messaging.v1.services(messagingServiceSid).phoneNumbers.list();
    const ourNumber = numbers.find(n => n.phoneNumber === businessNumber);
    
    if (!ourNumber) {
      console.log('❌ Número no encontrado en el servicio');
      return;
    }
    
    const hasWhatsApp = ourNumber.capabilities.includes('whatsapp');
    console.log(`📊 Capabilities: ${ourNumber.capabilities.join(', ')}`);
    console.log(`🟢 WhatsApp: ${hasWhatsApp ? '✅ ACTIVO' : '⏳ PENDIENTE'}`);
    
    if (hasWhatsApp) {
      console.log('\n🎉 ¡TU WHATSAPP BUSINESS YA ESTÁ ACTIVO!');
      console.log('📱 Número Business funcionando: ' + businessNumber);
      console.log('✅ Ya no necesitas Sandbox');
      console.log('🚀 Sistema de notificaciones 100% operativo');
      
      // Probar envío directo
      console.log('\n🧪 Probando envío directo...');
      try {
        const testMessage = await client.messages.create({
          from: `whatsapp:${businessNumber}`,
          to: `whatsapp:+573001234567`, // CAMBIAR POR TU NÚMERO
          body: `🎉 ¡APROBACIÓN CONFIRMADA!

Tu WhatsApp Business ${businessNumber} ya está 100% operativo.

✅ Meta aprobó tu verificación
🚀 DR Group Dashboard listo
🕒 ${new Date().toLocaleString('es-CO')}`
        });
        
        console.log('✅ Mensaje de confirmación enviado');
        console.log('📨 SID:', testMessage.sid);
        
      } catch (error) {
        console.log('⚠️ Error en envío directo:', error.message);
        console.log('💡 Puede necesitar unos minutos más para propagarse');
      }
      
    } else {
      console.log('\n⏳ Verificación aún pendiente');
      console.log('📧 Revisa tu email de Meta Business');
      console.log('🔄 Ejecuta este script nuevamente en unas horas');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Ejecutar verificación
verificarAprobacionMeta();
