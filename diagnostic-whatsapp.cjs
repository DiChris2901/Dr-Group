const twilio = require('twilio');

const TWILIO_ACCOUNT_SID = 'AC9d2313319dee6dcba99298003893c190';
const TWILIO_AUTH_TOKEN = '2025cd85312e59bf48af46786e73be64';
const MESSAGING_SERVICE_SID = 'MG96fbd375e79dec60497c551823f0f9e0';
const SANDBOX_PHONE_NUMBER = '+14155238886';

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

async function diagnosticFullWhatsApp() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DE WHATSAPP');
  console.log('=' .repeat(60));
  
  try {
    // 1. Verificar configuración del Sandbox
    console.log('\n📱 PASO 1: Verificando Sandbox WhatsApp');
    console.log('-'.repeat(40));
    
    // Obtener información del Sandbox
    console.log('🧪 Sandbox Number: +14155238886');
    console.log('📝 Para activar el Sandbox, envía este mensaje a +14155238886:');
    console.log('💬 "join modern-egg"');
    console.log('⚠️  IMPORTANTE: Debes enviar este mensaje DESDE tu WhatsApp personal primero');
    
    // 2. Verificar estado de tu número en WhatsApp Business
    console.log('\n🏢 PASO 2: Verificando WhatsApp Business API');
    console.log('-'.repeat(40));
    
    // Verificar el servicio de messaging
    const service = await client.messaging.v1.services(MESSAGING_SERVICE_SID).fetch();
    console.log(`✅ Messaging Service: ${service.friendlyName}`);
    console.log(`📊 Estado: ${service.status}`);
    
    // Verificar números en el servicio
    const phoneNumbers = await client.messaging.v1.services(MESSAGING_SERVICE_SID).phoneNumbers.list();
    console.log(`📱 Números en el servicio: ${phoneNumbers.length}`);
    
    if (phoneNumbers.length === 0) {
      console.log('❌ NO HAY NÚMEROS EN EL MESSAGING SERVICE');
      console.log('🔧 Necesitas agregar tu número al servicio');
    } else {
      phoneNumbers.forEach(phone => {
        console.log(`  → ${phone.phoneNumber}`);
        console.log(`    Capacidades: ${phone.capabilities?.join(', ') || 'No definidas'}`);
      });
    }
    
    // 3. Verificar últimos mensajes enviados
    console.log('\n📨 PASO 3: Verificando últimos mensajes');
    console.log('-'.repeat(40));
    
    const recentMessages = await client.messages.list({ limit: 10 });
    console.log(`📊 Últimos ${recentMessages.length} mensajes:`);
    
    recentMessages.forEach((msg, index) => {
      console.log(`\n${index + 1}. Mensaje ${msg.sid}`);
      console.log(`   De: ${msg.from}`);
      console.log(`   Para: ${msg.to}`);
      console.log(`   Estado: ${msg.status}`);
      console.log(`   Fecha: ${msg.dateCreated}`);
      if (msg.errorCode) {
        console.log(`   ❌ Error: ${msg.errorCode} - ${msg.errorMessage}`);
      }
    });
    
    // 4. Prueba específica para verificar el problema
    console.log('\n🧪 PASO 4: Prueba de diagnóstico');
    console.log('-'.repeat(40));
    
    console.log('Probando envío a un número diferente para diagnóstico...');
    
    // Intentar envío desde Sandbox
    try {
      console.log('\n🧪 Intentando desde Sandbox...');
      const sandboxTest = await client.messages.create({
        from: `whatsapp:${SANDBOX_PHONE_NUMBER}`,
        to: 'whatsapp:+573057002736', // Número diferente para prueba
        body: 'Prueba de diagnóstico desde Sandbox - ' + new Date().toLocaleTimeString()
      });
      
      console.log(`✅ Sandbox enviado: ${sandboxTest.sid}`);
      console.log(`📊 Estado: ${sandboxTest.status}`);
      
      // Esperar y verificar
      await new Promise(resolve => setTimeout(resolve, 5000));
      const sandboxStatus = await client.messages(sandboxTest.sid).fetch();
      console.log(`🔄 Estado actualizado: ${sandboxStatus.status}`);
      
      if (sandboxStatus.errorCode) {
        console.log(`❌ Error Sandbox: ${sandboxStatus.errorCode} - ${sandboxStatus.errorMessage}`);
      }
      
    } catch (sandboxError) {
      console.log(`❌ Error enviando desde Sandbox: ${sandboxError.message}`);
    }
    
    // Intentar desde Business API
    try {
      console.log('\n🏢 Intentando desde Business API...');
      const businessTest = await client.messages.create({
        messagingServiceSid: MESSAGING_SERVICE_SID,
        to: 'whatsapp:+573057002736',
        body: 'Prueba de diagnóstico desde Business API - ' + new Date().toLocaleTimeString()
      });
      
      console.log(`✅ Business API enviado: ${businessTest.sid}`);
      console.log(`📊 Estado: ${businessTest.status}`);
      
      // Esperar y verificar
      await new Promise(resolve => setTimeout(resolve, 5000));
      const businessStatus = await client.messages(businessTest.sid).fetch();
      console.log(`🔄 Estado actualizado: ${businessStatus.status}`);
      
      if (businessStatus.errorCode) {
        console.log(`❌ Error Business API: ${businessStatus.errorCode} - ${businessStatus.errorMessage}`);
      }
      
    } catch (businessError) {
      console.log(`❌ Error enviando desde Business API: ${businessError.message}`);
    }
    
    // 5. Recomendaciones
    console.log('\n🎯 PASO 5: Recomendaciones de solución');
    console.log('-'.repeat(40));
    
    console.log('Para solucionar los problemas de entrega:');
    console.log('1. 🧪 SANDBOX: Envía "join modern-egg" al +14155238886 desde tu WhatsApp');
    console.log('2. 🏢 BUSINESS API: Verifica que tu número esté aprobado para WhatsApp Business');
    console.log('3. 📱 DESTINATARIOS: Los números destino deben tener WhatsApp activo');
    console.log('4. 🔧 TWILIO CONSOLE: Revisa la configuración de WhatsApp en tu cuenta');
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
  }
}

diagnosticFullWhatsApp()
  .then(() => {
    console.log('\n✅ Diagnóstico completado');
    process.exit(0);
  });
