const twilio = require('twilio');

// ⚠️ IMPORTANTE: Actualiza estas credenciales con las actuales de tu cuenta Twilio
const accountSid = 'AC4edddde73e334e2f68b9e0a99ba9e3a7';
const authToken = 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'; // ⚠️ REEMPLAZA CON EL TOKEN ACTUAL
const businessNumber = '+12312419541';
const messagingServiceSid = 'MG27cf7b7e053b2fce451e7df1df543916';

console.log('🔐 Configuración actual:');
console.log('📱 Account SID:', accountSid);
console.log('🔑 Auth Token:', authToken.substring(0, 8) + '...' + authToken.substring(authToken.length - 4));
console.log('📞 Business Number:', businessNumber);
console.log('🛠️ Messaging Service:', messagingServiceSid);
console.log('');

if (authToken === 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX') {
  console.log('❌ DEBES ACTUALIZAR EL AUTH TOKEN EN EL ARCHIVO');
  console.log('📋 Pasos para obtener las credenciales:');
  console.log('1. Ve a https://console.twilio.com/');
  console.log('2. En la sección "Account Info" encontrarás:');
  console.log('   - Account SID');
  console.log('   - Auth Token (clic en "View" para revelarlo)');
  console.log('3. Reemplaza las credenciales en este archivo');
  console.log('4. Ejecuta el script nuevamente');
  return;
}

const client = twilio(accountSid, authToken);

async function checkPostVerification() {
  console.log('🔍 Verificando configuración post-verificación...\n');
  
  try {
    // 1. Verificar que las credenciales funcionan
    console.log('🔐 Verificando autenticación...');
    const account = await client.api.accounts(accountSid).fetch();
    console.log('✅ Autenticación exitosa');
    console.log('🏢 Nombre de cuenta:', account.friendlyName);
    console.log('📊 Estado:', account.status);
    
    // 2. Verificar el Messaging Service
    console.log('\n🛠️ Verificando Messaging Service...');
    const service = await client.messaging.v1.services(messagingServiceSid).fetch();
    console.log('✅ Servicio encontrado:', service.friendlyName);
    
    // 3. Listar números en el servicio
    console.log('\n📋 Números configurados:');
    const phoneNumbers = await client.messaging.v1.services(messagingServiceSid)
      .phoneNumbers.list();
    
    if (phoneNumbers.length === 0) {
      console.log('⚠️ No hay números configurados en el Messaging Service');
    } else {
      phoneNumbers.forEach(number => {
        console.log(`  📱 ${number.phoneNumber}`);
        console.log(`     Capabilities: ${JSON.stringify(number.capabilities)}`);
      });
    }
    
    // 4. Verificar plantillas (si las hay)
    console.log('\n📄 Verificando plantillas de contenido...');
    try {
      const contentList = await client.content.v1.contents.list({ limit: 10 });
      if (contentList.length === 0) {
        console.log('📭 No hay plantillas de contenido configuradas');
        console.log('💡 Para usar WhatsApp Business necesitas plantillas aprobadas');
      } else {
        console.log(`✅ Encontradas ${contentList.length} plantillas:`);
        contentList.forEach(content => {
          console.log(`  📄 ${content.friendlyName} (${content.sid})`);
          console.log(`     Estado: ${content.approvalRequests?.status || 'Unknown'}`);
        });
      }
    } catch (error) {
      console.log('⚠️ No se pudo verificar plantillas:', error.message);
    }
    
    console.log('\n✅ Verificación completada');
    console.log('\n📋 RESUMEN:');
    console.log('- Credenciales: ✅ Válidas');
    console.log('- Messaging Service: ✅ Configurado');
    console.log('- Números: ' + (phoneNumbers.length > 0 ? '✅ Configurados' : '⚠️ Sin configurar'));
    
    console.log('\n🚀 SIGUIENTE PASO:');
    console.log('1. Si no tienes plantillas, créalas en Twilio Console > Content');
    console.log('2. Una vez aprobadas, prueba con el modal de la aplicación');
    console.log('3. Si ya tienes plantillas aprobadas, prueba directamente');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code === 20003) {
      console.log('\n🔑 ERROR DE AUTENTICACIÓN:');
      console.log('- Verifica que el Account SID y Auth Token sean correctos');
      console.log('- El Auth Token puede haber cambiado');
      console.log('- Ve a https://console.twilio.com/ para verificar');
    }
  }
}

checkPostVerification();
