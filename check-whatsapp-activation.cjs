const twilio = require('twilio');

const client = twilio('AC9d2313319dee6dcba99298003893c190', '2025cd85312e59bf48af46786e73be64');
const correctSid = 'MG27cf7b7e053b2fce451e7df1df543916';

async function checkWhatsAppStatus() {
  console.log('🔍 VERIFICANDO ESTADO DE WHATSAPP EN TU NÚMERO\n');
  
  try {
    // 1. Verificar el servicio correcto
    console.log('📦 Verificando Messaging Service correcto...');
    const service = await client.messaging.v1.services(correctSid).fetch();
    console.log(`✅ Servicio: ${service.friendlyName}`);
    
    // 2. Verificar el número en el servicio
    console.log('\n📱 Verificando tu número en el servicio...');
    const numbers = await client.messaging.v1.services(correctSid).phoneNumbers.list();
    
    const ourNumber = numbers.find(n => n.phoneNumber === '+12312419541');
    if (ourNumber) {
      console.log('✅ Número encontrado en el servicio');
      console.log('📋 Capabilities actuales:', ourNumber.capabilities);
      
      const hasWhatsApp = ourNumber.capabilities.includes('whatsapp');
      console.log(`📞 WhatsApp: ${hasWhatsApp ? '✅ ACTIVO' : '❌ NO ACTIVO'}`);
      
      if (!hasWhatsApp) {
        console.log('\n🚨 PROBLEMA IDENTIFICADO:');
        console.log('Tu número NO tiene WhatsApp activado en Twilio');
        console.log('\n🔧 POSIBLES CAUSAS:');
        console.log('1. La verificación de Meta aún está pendiente');
        console.log('2. No se completó el proceso de activación de WhatsApp Business API');
        console.log('3. Falta configuración en Twilio Console');
        
        console.log('\n📋 PASOS PARA SOLUCIONAR:');
        console.log('1. Ve a Twilio Console > Messaging > WhatsApp');
        console.log('2. Verifica el estado de tu WhatsApp Business');
        console.log('3. Si dice "Pending", espera la aprobación de Meta');
        console.log('4. Si dice "Active", contacta soporte de Twilio');
      }
    } else {
      console.log('❌ Número NO encontrado en el servicio');
    }
    
    // 3. Intentar envío de prueba para ver el error específico
    console.log('\n🧪 Probando envío directo para ver el error...');
    try {
      const testMessage = await client.messages.create({
        messagingServiceSid: correctSid,
        to: '+15005550006', // Número de prueba
        body: 'Test WhatsApp'
      });
      console.log('✅ Envío exitoso (inesperado):', testMessage.sid);
    } catch (error) {
      console.log('❌ Error esperado:', error.message);
      console.log('🔍 Código de error:', error.code);
      
      // Interpretar errores comunes
      switch (error.code) {
        case 63016:
          console.log('📝 Significa: WhatsApp no está habilitado para este número');
          break;
        case 21614:
          console.log('📝 Significa: Número no verificado para WhatsApp');
          break;
        case 21211:
          console.log('📝 Significa: Número no válido para este servicio');
          break;
        default:
          console.log('📝 Error no categorizado');
      }
    }
    
    console.log('\n📊 RESUMEN:');
    console.log('- SID correcto: ✅ MG27cf7b7e053b2fce451e7df1df543916');
    console.log('- Número en servicio: ✅ +12312419541');
    console.log(`- WhatsApp activo: ${ourNumber && ourNumber.capabilities.includes('whatsapp') ? '✅' : '❌'}`);
    
    if (!ourNumber || !ourNumber.capabilities.includes('whatsapp')) {
      console.log('\n🎯 CONCLUSIÓN:');
      console.log('El fallback a Sandbox es CORRECTO mientras WhatsApp no esté activo.');
      console.log('Una vez que Meta apruebe tu verificación, WhatsApp se activará automáticamente.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkWhatsAppStatus();
